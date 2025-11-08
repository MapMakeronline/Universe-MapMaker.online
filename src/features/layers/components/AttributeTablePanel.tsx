'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { DataGrid, GridColDef, GridRowModel, GridRowsProp } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
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
}: AttributeTablePanelProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
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

  // Fetch layer features (row-based data)
  const {
    data: featuresResponse,
    isLoading,
    error,
    refetch,
  } = useGetLayerFeaturesQuery({
    project: projectName,
    layer_id: layerId,
    limit: 999999, // Load all features without pagination
  });

  // Fetch column constraints
  const { data: constraintsResponse } = useGetLayerConstraintsQuery({
    project: projectName,
    layer_id: layerId,
  });

  const [saveRecords, { isLoading: isSaving }] = useSaveMultipleRecordsMutation();
  const [exportLayer] = useLazyExportLayerQuery();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Extract data from response
  const features = featuresResponse?.data || [];
  const constraints = constraintsResponse?.data || {
    not_null_fields: [],
    unique_fields: [],
    sequence_fields: [],
  };

  // Debug: Log feature count
  React.useEffect(() => {
    if (features.length > 0) {
      console.log(`📊 AttributeTable loaded ${features.length} features from backend`);
    }
  }, [features.length]);

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

  // Prepare DataGrid rows (combine API data + new local rows)
  const rows: GridRowsProp = useMemo(() => {
    const apiRows = features.map((feature, index) => ({
      id: feature.gid || feature.fid || index,
      ...feature,
    }));
    // Prepend new rows at the top
    return [...newRows, ...apiRows];
  }, [features, newRows]);

  // Filter rows by search text
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [rows, searchText]);

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
      console.log('🎯 Row clicked:', rowId, params.row);
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

    console.log('💾 Preparing to save rows:', dataToSave);

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

    console.log('📊 New records:', newRecords.length);
    console.log('📝 Updated records:', updatedRecords.length);

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
        console.log('💾 Saving updated records:', cleanedUpdatedRecords);

        await saveRecords({
          project: projectName,
          layer: layerId,
          data: cleanedUpdatedRecords,
        }).unwrap();

        dispatch(showSuccess(`Zaktualizowano ${cleanedUpdatedRecords.length} rekordów`));
      }

      // ✅ SAVE NEW RECORDS (if any)
      if (cleanedNewRecords.length > 0) {
        console.log('💾 Saving new records:', cleanedNewRecords);
        console.log('📤 Request payload:', {
          project: projectName,
          layer: layerId,
          data: cleanedNewRecords,
        });

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
      console.error('❌ Save error:', err);
      console.error('❌ Error details:', err?.data);

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
    if (filteredRows.length === 0) {
      dispatch(showError('Brak danych do eksportu'));
      return;
    }

    const csv = [
      columns.map((col) => col.headerName).join(','),
      ...filteredRows.map((row) =>
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
    setPanelHeight(Math.max(150, Math.min(newHeight, window.innerHeight - 100)));
  }, [isDragging]);

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
            {searchText && filteredRows.length !== rows.length
              ? `${filteredRows.length} / ${rows.length} wierszy`
              : `${rows.length} ${rows.length === 1 ? 'wiersz' : rows.length < 5 ? 'wiersze' : 'wierszy'}`}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 }, display: { xs: 'none', sm: 'block' } }} />

        {/* Selection & Navigation Group - HIDDEN ON MOBILE (disabled features) */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Zaznacz wszystkie">
            <IconButton size="small" disabled sx={{ p: 0.5 }}>
              <ViewColumnIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Odznacz wszystkie">
            <IconButton size="small" disabled sx={{ p: 0.5 }}>
              <CancelIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Odwróć zaznaczenie">
            <IconButton size="small" disabled sx={{ p: 0.5 }}>
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </Box>

          {/* Editing Group - ALWAYS VISIBLE (important) */}
          <Tooltip title="Dodaj rekord">
            <IconButton size="small" onClick={handleAddRow} sx={{ p: { xs: 0.75, sm: 0.5 } }}>
              <AddIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Edytuj rekord">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Usuń zaznaczone">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

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
            <IconButton
              size="small"
              disabled={editedRows.size === 0}
              onClick={() => setEditedRows(new Map())}
              sx={{ p: { xs: 0.75, sm: 0.5 } }}
            >
              <CancelIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 } }} />

          {/* Undo/Redo Group - HIDDEN ON MOBILE (disabled features) */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Cofnij">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <UndoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ponów">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <RedoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </Box>

          {/* View Group - HIDDEN ON MOBILE (disabled features) */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Przybliż do zaznaczonych">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <ZoomInIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pokaż na mapie">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </Box>

          {/* Filter Group - HIDDEN ON MOBILE (disabled features) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Filtruj">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <FilterListIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </Box>

          {/* Export/Refresh Group - ALWAYS VISIBLE */}
          <Tooltip title="Eksportuj">
            <span>
              <IconButton
                size="small"
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={filteredRows.length === 0}
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

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 }, display: { xs: 'none', md: 'block' } }} />

          {/* Settings - HIDDEN ON MOBILE */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
            <Tooltip title="Ustawienia tabeli">
              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                <SettingsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">Błąd ładowania danych: {(error as any).message || 'Nieznany błąd'}</Alert>
          </Box>
        ) : filteredRows.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              {searchText ? 'Brak wyników wyszukiwania' : 'Brak danych'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              onRowClick={handleRowClick}
              // No pagination - full scroll with virtualization
              hideFooter
              rowHeight={36} // Compact row height
              columnHeaderHeight={32} // Compact header height
              // Enable sorting for all columns
              sortingMode="client"
              disableColumnFilter={false}
              processRowUpdate={handleRowEditCommit}
              onProcessRowUpdateError={(error) => {
                console.error('Row edit error:', error);
                dispatch(showError('Błąd edycji wiersza'));
              }}
              getRowClassName={(params) =>
                params.id === clickedRowId ? 'clicked-row' : ''
              }
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
                // Custom scrollbar
                '& .MuiDataGrid-virtualScroller': {
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
