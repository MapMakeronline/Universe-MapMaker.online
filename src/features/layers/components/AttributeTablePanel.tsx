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
import { DataGridPro, GridColDef, GridRowModel, GridRowsProp, GridColumnVisibilityModel } from '@mui/x-data-grid-pro';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ColumnManagerModal } from './ColumnManagerModal';
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
  layerId: string; // QGIS layer ID (UUID from tree.json) - used for backend API calls
  layerName: string; // Display name (for UI)
  sourceTableName?: string; // PostgreSQL table name (optional - kept for potential future use)
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
  sourceTableName,
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

  // PERSISTENCE: Load saved panel height from localStorage
  const [panelHeight, setPanelHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`attributeTable_${layerId}_height`);
      if (saved) return parseInt(saved, 10);
      return window.innerWidth < 600 ? 200 : 300;
    }
    return 300;
  });

  // PERSISTENCE: Save panel height to localStorage when changed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`attributeTable_${layerId}_height`, panelHeight.toString());
    }
  }, [panelHeight, layerId]);

  // PERSISTENCE: Column visibility state (saved per layer)
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`attributeTable_${layerId}_columnVisibility`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return {};
        }
      }
    }
    return {};
  });

  // PERSISTENCE: Save column visibility when changed
  const handleColumnVisibilityChange = React.useCallback((newModel: GridColumnVisibilityModel) => {
    setColumnVisibilityModel(newModel);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`attributeTable_${layerId}_columnVisibility`, JSON.stringify(newModel));
    }
  }, [layerId]);

  const [isDragging, setIsDragging] = useState(false);
  const [clickedRowId, setClickedRowId] = useState<string | number | null>(null);
  const [isLayerSwitching, setIsLayerSwitching] = useState(false); // Track layer switching state
  const [rowLimit, setRowLimit] = useState(100); // Current row limit (starts at BATCH_SIZE, increases on scroll)
  const [hasMoreRows, setHasMoreRows] = useState(true); // Whether there are more rows to load

  // Local state for displayed features (decoupled from RTK Query cache)
  // This prevents stale data from previous layer appearing during switch
  const [displayedFeatures, setDisplayedFeatures] = useState<Array<Record<string, any>>>([]);

  // Debounce search text (500ms delay) - prevents excessive backend requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch layer features (row-based data)
  // PERFORMANCE: Infinite scroll with automatic loading
  // ULTRA-OPTIMIZED: Start with 100 rows (instant load), load +100 more on scroll
  // For 19k rows: 100→200→300... (user sees data in ~100-200ms, instant feel)
  const BATCH_SIZE = 100; // Load 100 rows per batch (ultra-fast UX)

  const {
    data: featuresResponse,
    isLoading,
    error,
    refetch,
    isFetching, // Tracks active requests (including re-fetch)
  } = useGetLayerFeaturesQuery(
    {
      project: projectName,
      layer_id: layerId, // CRITICAL: Backend expects QGIS layer ID (UUID from tree.json)
      limit: rowLimit, // Dynamic limit (increases on scroll)
    },
    {
      skip: !projectName || !layerId, // Don't fetch if project or layer not specified
      // CRITICAL FIX: Always refetch when layer changes (prevents stale cache data)
      // Without this, RTK Query returns cached data from previous layer briefly
      refetchOnMountOrArgChange: true, // Force fresh data on layer change
    }
  );



  // Fetch column constraints
  const { data: constraintsResponse } = useGetLayerConstraintsQuery(
    {
      project: projectName,
      layer_id: layerId, // CRITICAL: Backend expects QGIS layer ID (UUID from tree.json)
    },
    {
      skip: !projectName || !layerId, // Don't fetch if project or layer not specified
    }
  );

  const [saveRecords, { isLoading: isSaving }] = useSaveMultipleRecordsMutation();
  const [exportLayer] = useLazyExportLayerQuery();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);

  // Extract constraints
  const constraints = constraintsResponse?.data || {
    not_null_fields: [],
    unique_fields: [],
    sequence_fields: [],
  };

  // Sync displayedFeatures with RTK Query data
  // PROGRESSIVE LOADING: Show data immediately as it arrives (no batching delay)
  React.useEffect(() => {
    console.log(`[AttributeTablePanel] useEffect triggered:`, {
      layerId,
      layerName,
      hasData: !!featuresResponse?.data,
      dataLength: featuresResponse?.data?.length,
      isLoading,
      isFetching,
      currentDisplayedCount: displayedFeatures.length,
      timestamp: new Date().toISOString()
    });

    if (featuresResponse?.data && featuresResponse.data.length > 0) {
      console.log(`[AttributeTablePanel] ✅ Setting displayedFeatures:`, {
        layerName,
        count: featuresResponse.data.length,
        timestamp: new Date().toISOString()
      });

      // INSTANT UX: Show data immediately without any batching delay
      // User sees column names + first rows instantly (~50-100ms)
      setDisplayedFeatures(featuresResponse.data);

      // Clear switching flag immediately when we have data
      // This ensures table becomes interactive ASAP
      if (isLayerSwitching) {
        setIsLayerSwitching(false);
      }
    } else if (!isLoading && !isFetching && featuresResponse?.data !== undefined) {
      // Data fetch complete but returned empty array
      console.log(`[AttributeTablePanel] ⚠️ Empty data received (layer has no features):`, {
        layerName,
        timestamp: new Date().toISOString()
      });
      setDisplayedFeatures([]);
      setIsLayerSwitching(false);
    } else {
      console.log(`[AttributeTablePanel] ⏳ Still loading:`, {
        layerName,
        isLoading,
        isFetching,
        timestamp: new Date().toISOString()
      });
    }
  }, [featuresResponse?.data, layerId, layerName, isLoading, isFetching, isLayerSwitching]);

  // Detect if we've loaded all rows (for infinite scroll)
  React.useEffect(() => {
    if (displayedFeatures.length > 0 && displayedFeatures.length < rowLimit) {
      // Backend returned fewer rows than requested → no more data
      setHasMoreRows(false);
    } else if (displayedFeatures.length === rowLimit) {
      // Loaded exactly the limit → might have more
      setHasMoreRows(true);
    }
  }, [displayedFeatures.length, rowLimit]);


  // Helper: Categorize column type (for column manager)
  const categorizeColumn = (key: string): 'geometry' | 'metadata' | 'attributes' => {
    // Geometry columns
    if (key === 'geom' || key === 'geometry' || key === 'wkb_geometry') return 'geometry';

    // Metadata columns (IDs, technical fields)
    const metadataFields = ['ogc_fid', 'gid', 'fid', 'id', 'lokalnyId', 'wersjaId', 'poczatekWersjiObiektu', 'obowiazujeOd', 'koniecWersjiObiektu'];
    if (metadataFields.includes(key)) return 'metadata';

    // Everything else is an attribute (descript_1, symbol, etc.)
    return 'attributes';
  };

  // Prepare DataGrid columns
  const columns: GridColDef[] = useMemo(() => {
    if (displayedFeatures.length === 0) return [];

    const firstRow = displayedFeatures[0];
    const allKeys = Object.keys(firstRow);

    // COLUMN ORDER: Data columns first, then ID columns at the end
    // This puts important data (descript_1, descript_2) before technical IDs (ogc_fid)
    const idColumns = ['ogc_fid', 'gid', 'fid', 'id'];
    const sortedKeys = allKeys.sort((a, b) => {
      const aIsId = idColumns.includes(a);
      const bIsId = idColumns.includes(b);

      // ID columns go to the end
      if (aIsId && !bIsId) return 1;
      if (!aIsId && bIsId) return -1;

      // Keep original order for non-ID columns
      return 0;
    });

    const cols: GridColDef[] = [];

    sortedKeys.forEach((key) => {
      // Skip geometry columns
      if (key === 'geom' || key === 'geometry') return;

      const isRequired = constraints.not_null_fields.includes(key);
      const isAutoIncrement = constraints.sequence_fields.includes(key);

      // RESPONSIVE COLUMN WIDTHS: ID columns narrow, data columns wider
      const isIdColumn = idColumns.includes(key);

      cols.push({
        field: key,
        headerName: key + (isRequired ? ' *' : ''),
        // ID columns: fixed narrow width (no flex)
        // Data columns: flexible width (grows to fill space)
        ...(isIdColumn ? {
          width: 60, // Fixed 60px for ID columns (just enough for numbers)
          minWidth: 60,
          maxWidth: 80,
        } : {
          flex: 1, // Data columns grow to fill available space
          minWidth: 150, // Wider minimum for readability
        }),
        editable: !isAutoIncrement,
        type: 'string',
        valueFormatter: (value) => {
          if (value === null || value === undefined) return '';
          return String(value);
        },
      });
    });

    return cols;
  }, [displayedFeatures, constraints]);

  // Prepare column info for ColumnManagerModal
  const columnInfoForManager = useMemo(() => {
    return columns.map((col) => ({
      field: col.field,
      headerName: col.headerName || col.field,
      group: categorizeColumn(col.field),
    }));
  }, [columns]);

  // Find primary key column dynamically (ogc_fid, gid, fid, or id)
  // IMPORTANT: ogc_fid is the standard PostGIS/QGIS primary key
  const primaryKeyColumn = useMemo(() => {
    return columns.find(col =>
      col.field === 'ogc_fid' || col.field === 'gid' || col.field === 'fid' || col.field === 'id'
    )?.field || '';
  }, [columns]);

  // Prepare DataGrid rows (combine displayed features + new local rows)
  const rows: GridRowsProp = useMemo(() => {
    const apiRows = displayedFeatures.map((feature, index) => ({
      // IMPORTANT: Try ogc_fid first (PostGIS standard), then gid, fid, or fall back to index
      id: feature.ogc_fid || feature.gid || feature.fid || feature.id || index,
      ...feature,
    }));
    // Prepend new rows at the top
    const combined = [...newRows, ...apiRows];
    return combined;
  }, [displayedFeatures, newRows]);

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

  // CRITICAL: Clear state IMMEDIATELY when switching layers
  // This prevents stale data from previous layer showing up
  React.useEffect(() => {
    console.log(`[AttributeTablePanel] 🔄 Layer changed, resetting state:`, {
      layerId,
      layerName,
      timestamp: new Date().toISOString()
    });

    // 1. Clear displayed features FIRST (instant clear)
    setDisplayedFeatures([]);

    // 2. Mark as switching (shows loader)
    setIsLayerSwitching(true);

    // 3. Reset all other state
    setEditedRows(new Map());
    setNewRows([]);
    setClickedRowId(null);
    setSearchText("");
    setDebouncedSearch("");
    setRowLimit(BATCH_SIZE); // Reset to initial batch size
    setHasMoreRows(true); // Reset "more rows" flag

    // NOTE: Don't use timeout here - let the sync effect (line 134-140) handle clearing isLayerSwitching
    // when new data actually arrives
  }, [layerId, layerName, BATCH_SIZE]); // Reset when layer changes

  // NOTE: isLayerSwitching is now cleared in the main sync effect above
  // No need for separate timeout-based clearing - data shows immediately

  React.useEffect(() => {
    onHeightChange?.(panelHeight);
  }, [panelHeight, onHeightChange]);

  // Handle infinite scroll - load more rows when user scrolls to bottom
  const handleRowsScrollEnd = useCallback(() => {
    // Only load more if:
    // 1. Not currently fetching
    // 2. Has more rows to load
    // 3. Not in search mode (search is client-side)
    if (!isFetching && hasMoreRows && !searchText) {
      setRowLimit((prev) => prev + BATCH_SIZE);
    }
  }, [isFetching, hasMoreRows, searchText, BATCH_SIZE]);

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
    // IMPROVED: Better limits - min 150px, max 80% of viewport height
    const maxHeight = Math.floor(window.innerHeight * 0.8); // 80% of viewport
    const clampedHeight = Math.max(150, Math.min(newHeight, maxHeight));
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
          gap: 0.5,
          transition: 'all 0.2s ease-in-out',
          borderTop: '2px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          boxShadow: isDragging ? '0 -2px 8px rgba(0,0,0,0.2)' : 'none',
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none', // Prevent text selection during drag
          position: 'relative', // For height indicator
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
        {/* Height indicator during drag */}
        {isDragging && (
          <Box
            sx={{
              position: 'absolute',
              right: 16,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '11px',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            {panelHeight}px
          </Box>
        )}
        {/* Quick height presets - shown on hover (desktop only) */}
        {!isDragging && (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: { xs: 'none', sm: 'none', md: 'flex' }, // Desktop only
              gap: 0.5,
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
              pointerEvents: 'none',
              '.MuiBox-root:hover &': {
                opacity: 1,
                pointerEvents: 'auto',
              },
            }}
          >
            {[
              { label: 'S', height: 200 },
              { label: 'M', height: 350 },
              { label: 'L', height: 500 },
            ].map(({ label, height }) => (
              <Box
                key={label}
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelHeight(height);
                  onHeightChange?.(height);
                }}
                sx={{
                  px: 0.75,
                  py: 0.25,
                  bgcolor: panelHeight === height ? 'primary.main' : 'background.paper',
                  color: panelHeight === height ? 'primary.contrastText' : 'text.secondary',
                  borderRadius: 0.5,
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                {label}
              </Box>
            ))}
          </Box>
        )}
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
          <Typography sx={{
            fontSize: { xs: '12px', sm: '13px' },
            fontWeight: 600,
            whiteSpace: 'nowrap',
            // Highlight layer name during switch for visual feedback
            color: isLayerSwitching ? 'primary.main' : 'inherit',
            transition: 'color 0.2s ease-in-out'
          }}>
            {layerName}
          </Typography>
          <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {/* Force 0 rows display during layer switch to prevent stale count */}
            {isLayerSwitching ? '(ładowanie...)' : (
              searchText && allFilteredRows.length !== rows.length
                ? `${allFilteredRows.length} / ${rows.length} wierszy`
                : `${rows.length} ${rows.length === 1 ? 'wiersz' : rows.length < 5 ? 'wiersze' : 'wierszy'}`
            )}
            {!isLayerSwitching && hasMoreRows && !searchText && ` (więcej...)`}
          </Typography>
          {/* Loading indicator + Refresh button */}
          {(isFetching || isLayerSwitching) ? (
            <CircularProgress size={14} sx={{ ml: 0.5, color: 'primary.main' }} />
          ) : (
            <Tooltip title="Odśwież dane">
              <IconButton
                size="small"
                onClick={() => refetch()}
                sx={{
                  p: 0.25,
                  ml: 0.25,
                  opacity: 0.6,
                  '&:hover': { opacity: 1 }
                }}
              >
                <RefreshIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
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

          {/* Export/Column Manager Group - ALWAYS VISIBLE */}
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

          <Tooltip title="Zarządzaj kolumnami">
            <IconButton
              size="small"
              onClick={() => setColumnManagerOpen(true)}
              disabled={columns.length === 0}
              sx={{ p: { xs: 0.75, sm: 0.5 } }}
            >
              <ViewWeekIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
            </IconButton>
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
      <Box sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        // Fade animation during layer switch
        opacity: isLayerSwitching ? 0.3 : 1,
        transition: 'opacity 0.15s ease-in-out',
        pointerEvents: isLayerSwitching ? 'none' : 'auto', // Disable clicks during switch
      }}>
        {/* Only show skeleton loader during initial load or layer switch (NOT during infinite scroll) */}
        {/* MINIMAL SKELETON: Only 3 rows to show instantly, then real data appears */}
        {(isLoading || isLayerSwitching) && displayedFeatures.length === 0 ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Minimal skeleton loader - just header + 3 rows for instant feel */}
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1 }} /> {/* Header */}
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 0.5, opacity: 1 - i * 0.15 }} />
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                {isLayerSwitching ? 'Ładowanie...' : 'Ładowanie...'}
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

              // Infinite scroll - load more rows when scrolled to bottom
              onRowsScrollEnd={handleRowsScrollEnd}

              // PERSISTENCE: Column visibility (saved per layer in localStorage)
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityChange}

              // Performance Optimizations
              columnVirtualizationEnabled // Only render visible columns (100+ columns)
              pinnedColumns={{ left: primaryKeyColumn ? [primaryKeyColumn] : [], right: [] }} // Pin primary key column

              // NO PAGINATION - Show all rows with virtualization + infinite scroll
              // MUI DataGrid Pro virtualizes rendering (only renders ~20 visible rows at a time)
              // Can smoothly handle 10k+ rows with infinite scroll
              pagination={false} // Disable pagination - use infinite scroll instead

              rowHeight={36} // Compact row height
              columnHeaderHeight={32} // Compact header height
              rowBuffer={25} // OPTIMIZED: Render 25 rows before/after viewport (default: 100)
              columnBuffer={5} // OPTIMIZED: Render 5 columns before/after viewport (default: 10)

              // Sorting and filtering
              // SMART: Disable sorting for large datasets (>1000 rows) - client-side sorting is slow
              sortingMode={rows.length > 1000 ? undefined : "client"}
              disableColumnSort={rows.length > 1000} // Disable sorting UI for large tables
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
                // POSITIONING FIX: Panel (column menu) opens upward to prevent expanding map
                panel: {
                  anchorOrigin: {
                    vertical: 'top', // Attach to top of anchor element
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'bottom', // Panel's bottom edge aligns with anchor's top
                    horizontal: 'left',
                  },
                  sx: {
                    maxHeight: '60vh', // Limit to 60% of viewport height
                    overflow: 'auto',
                    // Prevent panel from expanding outside viewport
                    '& .MuiPaper-root': {
                      maxHeight: '60vh',
                    },
                  },
                },
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
                    bgcolor: isLayerSwitching ? 'action.hover' : 'inherit', // Visual feedback
                    transition: 'background-color 0.2s ease-in-out',
                  }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                      {/* Force loading text during layer switch */}
                      {isLayerSwitching ? 'Ładowanie warstwy...' : (
                        <>
                          {allFilteredRows.length} {allFilteredRows.length === 1 ? 'wiersz' : allFilteredRows.length < 5 ? 'wiersze' : 'wierszy'}
                          {debouncedSearch && ` (filtrowane: "${debouncedSearch}")`}
                          {hasMoreRows && !searchText && ` • Przewiń w dół aby załadować więcej`}
                          {rows.length > 1000 && ' • Sortowanie wyłączone (>1000 wierszy)'}
                        </>
                      )}
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

      {/* Column Manager Modal */}
      <ColumnManagerModal
        open={columnManagerOpen}
        onClose={() => setColumnManagerOpen(false)}
        columns={columnInfoForManager}
        visibilityModel={columnVisibilityModel}
        onVisibilityChange={handleColumnVisibilityChange}
      />
    </Box>
  );
}
