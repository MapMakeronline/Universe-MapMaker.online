'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { DataGridPro, GridColDef, GridRowModel, GridRowsProp } from '@mui/x-data-grid-pro';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  useGetLayerFeaturesQuery,
  useGetLayerConstraintsQuery,
  useSaveMultipleRecordsMutation,
  useLazyExportLayerQuery,
} from '@/backend/layers';
import { useAppDispatch } from '@/redux/hooks';
import { showSuccess, showError } from '@/redux/slices/notificationSlice';

interface AttributeTablePanelProps {
  projectName: string;
  layerId: string;
  layerName: string;
  onClose: () => void;
  onRowSelect?: (featureId: string | number, feature: any) => void; // Callback for map highlight
  leftPanelWidth?: number; // Width of left panel (for dynamic offset)
  onHeightChange?: (height: number) => void; // Callback for height changes (for FAB positioning)
}

/**
 * Attribute Table Panel
 * Bottom-docked resizable panel showing layer attributes
 *
 * Features:
 * - Resizable height (drag handle)
 * - Row selection highlights feature on map
 * - Search, pagination, export CSV
 * - In-line editing + batch save
 */
export function AttributeTablePanel({
  projectName,
  layerId,
  layerName,
  onClose,
  onRowSelect,
  leftPanelWidth = 0,
  onHeightChange,
}: AttributeTablePanelProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // Debounced search for backend filtering
  const [editedRows, setEditedRows] = useState<Map<number, GridRowModel>>(new Map());
  const [newRows, setNewRows] = useState<GridRowsProp>([]); // Local state for new rows
  // Default height: smaller on mobile (200px) for landscape compatibility
  const [panelHeight, setPanelHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 600 ? 200 : 300;
    }
    return 300;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [clickedRowId, setClickedRowId] = useState<string | number | null>(null);

  // Debounce search text (500ms delay) - prevents excessive backend requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch layer features (row-based data)
  // Load ALL features at once - MUI DataGrid Pro has built-in virtualization
  // Can handle 100k+ rows with smooth scrolling
  const {
    data: featuresResponse,
    isLoading,
    error,
    refetch,
  } = useGetLayerFeaturesQuery(
    {
      project: projectName,
      layer_id: layerId,
      limit: 999999, // Load all features - DataGrid Pro virtualizes rendering
    },
    {
      skip: !projectName || !layerId, // Don't fetch if project or layer not specified
    }
  );



  // Fetch column constraints
  const { data: constraintsResponse } = useGetLayerConstraintsQuery(
    {
      project: projectName,
      layer_id: layerId,
    },
    {
      skip: !projectName || !layerId, // Don't fetch if project or layer not specified
    }
  );

  const [saveRecords, { isLoading: isSaving }] = useSaveMultipleRecordsMutation();
  const [exportLayer] = useLazyExportLayerQuery();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Extract data from response
  // IMPORTANT: Clear features while loading to prevent showing stale data from previous layer
  const features = isLoading ? [] : (featuresResponse?.data || []);
  const constraints = constraintsResponse?.data || {
    not_null_fields: [],
    unique_fields: [],
    sequence_fields: [],
  };


  // Prepare DataGrid columns
  const columns: GridColDef[] = useMemo(() => {
    if (features.length === 0) return [];

    const firstRow = features[0];
    const cols: GridColDef[] = [];

    Object.keys(firstRow).forEach((key) => {
      // Skip geometry columns
      if (key === 'geom' || key === 'geometry') return;

      const isRequired = constraints.not_null_fields.includes(key);
      const isAutoIncrement = constraints.sequence_fields.includes(key);

      cols.push({
        field: key,
        headerName: key + (isRequired ? ' *' : ''),
        flex: 1,
        minWidth: 120,
        editable: !isAutoIncrement,
        type: 'string',
        valueFormatter: (value) => {
          if (value === null || value === undefined) return '';
          return String(value);
        },
      });
    });

    return cols;
  }, [features, constraints]);

  // Find primary key column dynamically (ogc_fid, gid, fid, or id)
  // IMPORTANT: ogc_fid is the standard PostGIS/QGIS primary key
  const primaryKeyColumn = useMemo(() => {
    return columns.find(col =>
      col.field === 'ogc_fid' || col.field === 'gid' || col.field === 'fid' || col.field === 'id'
    )?.field || '';
  }, [columns]);

  // Prepare DataGrid rows (combine API data + new local rows)
  const rows: GridRowsProp = useMemo(() => {
    const apiRows = features.map((feature, index) => ({
      // IMPORTANT: Try ogc_fid first (PostGIS standard), then gid, fid, or fall back to index
      id: feature.ogc_fid || feature.gid || feature.fid || feature.id || index,
      ...feature,
    }));
    // Prepend new rows at the top
    const combined = [...newRows, ...apiRows];
    return combined;
  }, [features, newRows]);

  // Filter rows by search text (client-side only - TODO: move to backend)
  // NOTE: For large datasets (10k+ rows), this should be moved to backend filtering
  // Use debouncedSearch to prevent excessive re-renders
  const allFilteredRows = useMemo(() => {
    if (!debouncedSearch) {
      return rows;
    }

    const filtered = rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    );

    return filtered;
  }, [rows, debouncedSearch]);

  // Notify parent of initial height (for FAB positioning)
  // Clear state when switching layers to prevent showing stale data
  React.useEffect(() => {
    setEditedRows(new Map());
    setNewRows([]);
    setClickedRowId(null);
    setSearchText("");
    setDebouncedSearch("");
  }, [layerId]); // Reset when layer changes

  React.useEffect(() => {
    onHeightChange?.(panelHeight);
  }, [panelHeight, onHeightChange]);

  // Handle row edit
  const handleRowEditCommit = (newRow: GridRowModel) => {
    setEditedRows((prev) => new Map(prev).set(newRow.id as number, newRow));
    return newRow;
  };

  // Handle row click (highlight on map without checkboxes)
  const handleRowClick = useCallback((params: any) => {
    const rowId = params.id;
    setClickedRowId(rowId);

    if (onRowSelect) {
      onRowSelect(rowId, params.row);
    }
  }, [onRowSelect]);

  // Save all changes
  const handleSave = async () => {
    if (editedRows.size === 0) {
      dispatch(showSuccess('Brak zmian do zapisania'));
      return;
    }

    // Get all edited rows
    let dataToSave = Array.from(editedRows.values());

    // ✅ VALIDATE NOT NULL FIELDS
    const notNullFields = constraints?.not_null_fields || [];
    const sequenceFields = constraints?.sequence_fields || [];
    for (const row of dataToSave) {
      for (const field of notNullFields) {
        // Skip ALL auto-increment fields (gid, id, ogc_fid, etc.)
        if (sequenceFields.includes(field)) continue;

        const value = row[field];
        if (value === null || value === undefined || value === '') {
          dispatch(showError(`Pole "${field}" jest wymagane (NOT NULL)`));
          return; // Abort save
        }
      }
    }

    // ✅ SEPARATE NEW RECORDS (temp-...) vs UPDATED RECORDS (with gid)
    const newRecords = dataToSave.filter((row) => {
      const id = row.id || row.gid;
      return typeof id === 'string' && id.startsWith('temp-');
    });

    const updatedRecords = dataToSave.filter((row) => {
      const id = row.id || row.gid;
      return !(typeof id === 'string' && id.startsWith('temp-'));
    });

    // ✅ CLEAN DATA FOR BACKEND
    // Remove temporary fields (id, temp ID, geometry)
    const cleanedNewRecords = newRecords.map((row) => {
      const cleaned = { ...row };
      delete cleaned.id; // Remove temp ID
      delete cleaned.gid; // Remove gid (auto-generated by backend)
      delete cleaned.geom; // Remove geometry
      delete cleaned.geometry;
      return cleaned;
    });

    const cleanedUpdatedRecords = updatedRecords.map((row) => {
      const cleaned = { ...row };
      delete cleaned.id; // DataGrid uses 'id', backend uses 'gid'
      delete cleaned.geom;
      delete cleaned.geometry;
      return cleaned;
    });

    try {
      // ✅ SAVE UPDATED RECORDS (if any)
      if (cleanedUpdatedRecords.length > 0) {
        await saveRecords({
          project: projectName,
          layer: layerId,
          data: cleanedUpdatedRecords,
        }).unwrap();

        dispatch(showSuccess(`Zaktualizowano ${cleanedUpdatedRecords.length} rekordów`));
      }

      // ✅ SAVE NEW RECORDS (if any)
      if (cleanedNewRecords.length > 0) {
        // Test if multipleSaving supports INSERT (records without gid)
        await saveRecords({
          project: projectName,
          layer: layerId,
          data: cleanedNewRecords,
        }).unwrap();

        dispatch(showSuccess(`Dodano ${cleanedNewRecords.length} nowych rekordów`));
      }

      // Clear edit map and new rows
      setEditedRows(new Map());
      setNewRows([]);

      // Refresh table to get real gid from backend
      refetch();
    } catch (err: any) {
      // Extract error message from backend response
      const errorMessage = err?.data?.message || err?.message || 'Nieznany błąd zapisu';
      dispatch(showError(`Błąd zapisu: ${errorMessage}`));
    }
  };

  // Add new record
  const handleAddRow = () => {
    // Create empty record with default values
    const newRow: Record<string, any> = {};

    columns.forEach((col) => {
      // Skip auto-increment columns (e.g., gid)
      if (constraints.sequence_fields.includes(col.field)) return;

      // Set null for all other columns
      newRow[col.field] = null;
    });

    // Add temporary ID (without gid - backend will generate it)
    const tempId = `temp-${Date.now()}`;
    newRow.id = tempId;

    // Add to local state (will appear in DataGrid)
    setNewRows((prev) => [newRow, ...prev]);

    // Mark as edited immediately (user needs to fill data and save)
    setEditedRows((prev) => {
      const updated = new Map(prev);
      updated.set(tempId, newRow);
      return updated;
    });

    dispatch(showSuccess('Dodano nowy wiersz. Wypełnij dane i kliknij "Zapisz"'));
  };

  // Export to CSV (client-side)
  const handleExportCSV = () => {
    if (allFilteredRows.length === 0) {
      dispatch(showError('Brak danych do eksportu'));
      return;
    }

    const csv = [
      columns.map((col) => col.headerName).join(','),
      ...allFilteredRows.map((row) =>
        columns.map((col) => {
          const value = row[col.field];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerName}_attributes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    dispatch(showSuccess('Eksportowano do CSV'));
  };

  // Export to various formats (backend)
  const handleExportFormat = async (format: 'ESRI SHAPEFILE' | 'GEOJSON' | 'GML' | 'KML') => {
    setExportMenuAnchor(null); // Close menu

    try {
      const result = await exportLayer({
        project: projectName,
        layer_id: layerId,
        epsg: 4326, // WGS84 by default
        layer_format: format,
      }).unwrap();

      // Download blob
      const url = window.URL.createObjectURL(result);
      const a = document.createElement('a');
      a.href = url;

      // Determine file extension
      const extension = format === 'ESRI SHAPEFILE' ? 'zip'
        : format === 'GEOJSON' ? 'geojson'
        : format === 'GML' ? 'gml'
        : 'kml';

      a.download = `${layerName}.${extension}`;
      a.click();
      window.URL.revokeObjectURL(url);

      dispatch(showSuccess(`Eksportowano do ${format}`));
    } catch (err: any) {
      console.error('Export error:', err);
      dispatch(showError(`Błąd eksportu: ${err.message || 'Nieznany błąd'}`));
    }
  };

  // Resize handle drag handlers (mouse + touch support)
  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling on mobile
    const newHeight = window.innerHeight - e.clientY;
    const clampedHeight = Math.max(150, Math.min(newHeight, window.innerHeight - 100));
    setPanelHeight(clampedHeight);
    onHeightChange?.(clampedHeight); // Notify parent of height change
  }, [isDragging, onHeightChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp); // Handle touch cancel
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: { xs: 0, sm: leftPanelWidth }, // Full width on mobile, dynamic on desktop
        right: { xs: 70, sm: 70, md: 70 }, // Offset for right toolbar (FAB menu)
        height: panelHeight,
        maxHeight: { xs: '50vh', sm: '70vh' }, // Limit height on mobile (especially landscape)
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        borderRight: '1px solid',
        borderRightColor: 'divider',
        borderLeft: { xs: 'none', sm: leftPanelWidth > 0 ? '1px solid' : 'none' },
        borderLeftColor: 'divider',
        transition: 'left 0.3s ease-in-out', // Smooth transition when panel opens/closes
      }}
    >
      {/* Drag Handle - Mobile & Desktop optimized */}
      <Box
        onPointerDown={handlePointerDown}
        sx={{
          height: { xs: 20, sm: 10 }, // Larger touch target on mobile
          bgcolor: isDragging ? 'primary.main' : 'divider',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out',
          borderTop: '2px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          boxShadow: isDragging ? '0 -2px 8px rgba(0,0,0,0.2)' : 'none',
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none', // Prevent text selection during drag
          '&:hover': {
            bgcolor: 'primary.light',
            borderColor: 'primary.main',
            height: { xs: 24, sm: 12 }, // Maintain larger size on mobile
            boxShadow: '0 -2px 6px rgba(0,0,0,0.15)',
          },
          '&:active': {
            bgcolor: 'primary.main',
          },
        }}
      >
        <DragHandleIcon
          sx={{
            fontSize: { xs: 24, sm: 18 }, // Larger icon on mobile
            color: isDragging ? 'primary.contrastText' : 'text.secondary'
          }}
        />
      </Box>

      {/* Header - Responsive toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: { xs: 0.5, sm: 1 }, // Less padding on mobile
          py: { xs: 0.25, sm: 0.25 }, // Compact on all screens
          bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider',
          gap: { xs: 0.25, sm: 0.5 }, // Tighter spacing on mobile
          minHeight: { xs: 40, sm: 40 }, // Compact height
          flexWrap: 'nowrap', // Never wrap - use horizontal scroll
          overflowX: 'auto', // Always allow horizontal scroll if needed
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 2,
          },
        }}
      >
        {/* Title & Record Count - Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mr: { xs: 0.5, sm: 1 } }}>
          <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {layerName}
          </Typography>
          <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {searchText && allFilteredRows.length !== rows.length
              ? `${allFilteredRows.length} / ${rows.length} wierszy`
              : `${rows.length} ${rows.length === 1 ? 'wiersz' : rows.length < 5 ? 'wiersze' : 'wierszy'}`}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 }, display: { xs: 'none', sm: 'block' } }} />

        {/* Editing Group - ALWAYS VISIBLE (important) */}
        <Tooltip title="Dodaj rekord">
          <IconButton size="small" onClick={handleAddRow} sx={{ p: { xs: 0.75, sm: 0.5 } }}>
            <AddIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 } }} />

        {/* Save/Cancel Group - ALWAYS VISIBLE (critical) */}
          <Tooltip title="Zapisz zmiany">
            <span>
              <IconButton
                size="small"
                onClick={handleSave}
                disabled={editedRows.size === 0 || isSaving}
                color={editedRows.size > 0 ? 'primary' : 'default'}
                sx={{ p: { xs: 0.75, sm: 0.5 } }}
              >
                <SaveIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Anuluj zmiany">
            <span>
              <IconButton
                size="small"
                disabled={editedRows.size === 0}
                onClick={() => setEditedRows(new Map())}
                sx={{ p: { xs: 0.75, sm: 0.5 } }}
              >
                <CancelIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
              </IconButton>
            </span>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 } }} />

          {/* Export/Refresh Group - ALWAYS VISIBLE */}
          <Tooltip title="Eksportuj">
            <span>
              <IconButton
                size="small"
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={allFilteredRows.length === 0}
                sx={{ p: { xs: 0.75, sm: 0.5 } }}
              >
                <DownloadIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Odśwież dane">
            <span>
              <IconButton size="small" onClick={() => refetch()} disabled={isLoading} sx={{ p: { xs: 0.75, sm: 0.5 } }}>
                <RefreshIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          {/* Search Box - Hidden on small mobile screens in landscape */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <TextField
              size="small"
              placeholder="Wyszukaj..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />,
              }}
              sx={{
                width: { sm: 140, md: 200 },
                '& .MuiOutlinedInput-root': {
                  height: 28,
                  fontSize: '12px',
                },
              }}
            />
          </Box>

          {/* Edit indicator */}
          {editedRows.size > 0 && (
            <Box
              sx={{
                ml: { xs: 0.5, sm: 1 },
                px: { xs: 0.75, sm: 1 },
                py: 0.25,
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                borderRadius: 0.5,
                fontSize: { xs: '10px', sm: '11px' },
                fontWeight: 600,
              }}
            >
              {editedRows.size}
            </Box>
          )}

          {/* Close Button - Larger on mobile */}
          <Tooltip title="Zamknij">
            <IconButton size="small" onClick={onClose} sx={{ ml: { xs: 0.25, sm: 0.5 }, p: { xs: 0.75, sm: 0.5 } }}>
              <CloseIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
            </IconButton>
          </Tooltip>
      </Box>

      {/* DataGrid Content */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {isLoading || features.length === 0 ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Skeleton loader - table-like structure */}
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1 }} /> {/* Header */}
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 0.5, opacity: 1 - i * 0.1 }} />
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="caption" color="text.secondary">
                {isLoading ? 'Ładowanie danych...' : 'Inicjalizacja tabeli...'}
              </Typography>
            </Box>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">Błąd ładowania danych: {(error as any).message || 'Nieznany błąd'}</Alert>
          </Box>
        ) : allFilteredRows.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              {searchText ? 'Brak wyników wyszukiwania' : 'Brak danych'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGridPro
              rows={allFilteredRows}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              onRowClick={handleRowClick}

              // Performance Optimizations
              columnVirtualizationEnabled // Only render visible columns (100+ columns)
              pinnedColumns={{ left: primaryKeyColumn ? [primaryKeyColumn] : [], right: [] }} // Pin primary key column

              // NO PAGINATION - Show all rows with virtualization
              // MUI DataGrid Pro virtualizes rendering (only renders ~20 visible rows at a time)
              // Can smoothly handle 10k+ rows with infinite scroll
              pagination={false} // Disable pagination - show all rows

              rowHeight={36} // Compact row height
              columnHeaderHeight={32} // Compact header height

              // Sorting and filtering (client-side)
              sortingMode="client"
              disableColumnFilter // Disable column menu filters for performance
              disableColumnMenu={false} // Keep column menu for other actions

              processRowUpdate={handleRowEditCommit}
              onProcessRowUpdateError={(error) => {
                dispatch(showError('Błąd edycji wiersza'));
              }}
              getRowClassName={(params) =>
                params.id === clickedRowId ? 'clicked-row' : ''
              }

              // Custom footer with info and edit counter
              slotProps={{
                footer: {
                  sx: {
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  },
                },
              }}
              slots={{
                footer: () => (
                  <Box sx={{
                    p: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                      {allFilteredRows.length} {allFilteredRows.length === 1 ? 'wiersz' : allFilteredRows.length < 5 ? 'wiersze' : 'wierszy'}
                      {debouncedSearch && ` (filtrowane: "${debouncedSearch}")`}
                    </Typography>
                    {editedRows.size > 0 && (
                      <Box sx={{
                        px: 1,
                        py: 0.5,
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        borderRadius: 1,
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {editedRows.size} {editedRows.size === 1 ? 'zmiana' : 'zmian'}
                      </Box>
                    )}
                  </Box>
                ),
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  fontSize: { xs: '13px', sm: '12px' },
                  padding: { xs: '6px 12px', sm: '6px 16px' }, // Reduced vertical padding
                },
                '& .MuiDataGrid-columnHeader': {
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                  fontWeight: 600,
                  fontSize: { xs: '12px', sm: '11px' }, // Smaller header font
                  padding: { xs: '4px 12px', sm: '4px 16px' }, // Reduced header padding
                  minHeight: '32px !important', // Force compact header
                  maxHeight: '32px !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  fontSize: { xs: '12px', sm: '11px' },
                  lineHeight: '1.2',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  minHeight: { xs: 40, sm: 36 }, // Slightly taller on mobile for touch
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                  },
                },
                '& .MuiDataGrid-row.clicked-row': {
                  bgcolor: theme.palette.mode === 'dark' ? '#c62828' : '#ef5350',
                  color: '#fff',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#b71c1c' : '#e53935',
                  },
                  '& .MuiDataGrid-cell': {
                    color: '#fff',
                  },
                },
                // Custom scrollbar + force overflow for unlimited rows
                '& .MuiDataGrid-virtualScroller': {
                  overflow: 'auto !important', // CRITICAL: Force scrollbar to show all rows
                  '&::-webkit-scrollbar': {
                    width: 8,
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'divider',
                    borderRadius: 4,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={handleExportCSV}>
          CSV (tabela atrybutów)
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('GEOJSON')}>
          GeoJSON (geometria + atrybuty)
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('ESRI SHAPEFILE')}>
          Shapefile (.zip)
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('GML')}>
          GML (OGC standard)
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('KML')}>
          KML (Google Earth)
        </MenuItem>
      </Menu>
    </Box>
  );
}
