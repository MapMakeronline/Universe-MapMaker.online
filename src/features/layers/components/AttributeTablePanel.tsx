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
import {
  useGetLayerFeaturesQuery,
  useGetLayerConstraintsQuery,
  useSaveMultipleRecordsMutation,
} from '@/backend/layers';
import { useAppDispatch } from '@/redux/hooks';
import { showSuccess, showError } from '@/redux/slices/notificationSlice';

interface AttributeTablePanelProps {
  projectName: string;
  layerId: string;
  layerName: string;
  onClose: () => void;
  onRowSelect?: (featureId: string | number, feature: any) => void; // Callback for map highlight
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
}: AttributeTablePanelProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const [editedRows, setEditedRows] = useState<Map<number, GridRowModel>>(new Map());
  const [panelHeight, setPanelHeight] = useState(300); // Default 300px
  const [isDragging, setIsDragging] = useState(false);
  const [clickedRowId, setClickedRowId] = useState<string | number | null>(null);

  // Fetch layer features (row-based data)
  const {
    data: featuresResponse,
    isLoading,
    error,
    refetch,
  } = useGetLayerFeaturesQuery({ project: projectName, layer_id: layerId });

  // Fetch column constraints
  const { data: constraintsResponse } = useGetLayerConstraintsQuery({
    project: projectName,
    layer_id: layerId,
  });

  const [saveRecords, { isLoading: isSaving }] = useSaveMultipleRecordsMutation();

  // Extract data from response
  const features = featuresResponse?.data || [];
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

  // Prepare DataGrid rows
  const rows: GridRowsProp = useMemo(() => {
    return features.map((feature, index) => ({
      id: feature.gid || feature.fid || index,
      ...feature,
    }));
  }, [features]);

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

    const dataToSave = Array.from(editedRows.values());

    try {
      await saveRecords({
        project: projectName,
        layer: layerId,
        data: dataToSave,
      }).unwrap();

      dispatch(showSuccess(`Zapisano ${dataToSave.length} rekordów`));
      setEditedRows(new Map());
      refetch();
    } catch (err: any) {
      console.error('Save error:', err);
      dispatch(showError(`Błąd zapisu: ${err.message || 'Nieznany błąd'}`));
    }
  };

  // Export to CSV
  const handleExport = () => {
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

  // Resize handle drag handlers
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newHeight = window.innerHeight - e.clientY;
    setPanelHeight(Math.max(150, Math.min(newHeight, window.innerHeight - 100)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: panelHeight,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* Drag Handle */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          height: 10,
          bgcolor: isDragging ? 'primary.main' : 'divider',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out',
          borderTop: '2px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          boxShadow: isDragging ? '0 -2px 8px rgba(0,0,0,0.2)' : 'none',
          '&:hover': {
            bgcolor: 'primary.light',
            borderColor: 'primary.main',
            height: 12,
            boxShadow: '0 -2px 6px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 18, color: isDragging ? 'primary.contrastText' : 'text.secondary' }} />
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Top Row - Title & Close */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
              Tabela atrybutów: {layerName}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
              {searchText && filteredRows.length !== rows.length
                ? `${filteredRows.length} z ${rows.length} rekordów`
                : `${rows.length} rekordów`}
            </Typography>
          </Box>

          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Toolbar - Icons matching old app */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          {/* Selection & Navigation Group */}
          <Tooltip title="Zaznacz wszystkie">
            <IconButton size="small" disabled>
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Odznacz wszystkie">
            <IconButton size="small" disabled>
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Odwróć zaznaczenie">
            <IconButton size="small" disabled>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Editing Group */}
          <Tooltip title="Dodaj rekord">
            <IconButton size="small" disabled>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edytuj rekord">
            <IconButton size="small" disabled>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Usuń zaznaczone">
            <IconButton size="small" disabled>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Save/Cancel Group */}
          <Tooltip title="Zapisz zmiany">
            <span>
              <IconButton
                size="small"
                onClick={handleSave}
                disabled={editedRows.size === 0 || isSaving}
                color={editedRows.size > 0 ? 'primary' : 'default'}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Anuluj zmiany">
            <IconButton
              size="small"
              disabled={editedRows.size === 0}
              onClick={() => setEditedRows(new Map())}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Undo/Redo Group */}
          <Tooltip title="Cofnij">
            <IconButton size="small" disabled>
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ponów">
            <IconButton size="small" disabled>
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* View Group */}
          <Tooltip title="Przybliż do zaznaczonych">
            <IconButton size="small" disabled>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pokaż na mapie">
            <IconButton size="small" disabled>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Filter Group */}
          <Tooltip title="Filtruj">
            <IconButton size="small" disabled>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Export/Refresh Group */}
          <Tooltip title="Eksportuj CSV">
            <span>
              <IconButton
                size="small"
                onClick={handleExport}
                disabled={filteredRows.length === 0}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Odśwież dane">
            <span>
              <IconButton size="small" onClick={() => refetch()} disabled={isLoading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Settings */}
          <Tooltip title="Ustawienia tabeli">
            <IconButton size="small" disabled>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          {/* Search Box - Right side */}
          <TextField
            size="small"
            placeholder="Wyszukaj..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
            }}
            sx={{
              width: 250,
              '& .MuiOutlinedInput-root': {
                height: 32,
                fontSize: '13px',
              },
            }}
          />

          {/* Edit indicator */}
          {editedRows.size > 0 && (
            <Box
              sx={{
                ml: 1,
                px: 1.5,
                py: 0.5,
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                borderRadius: 1,
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {editedRows.size} zmian
            </Box>
          )}
        </Box>
      </Box>

      {/* DataGrid Content */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
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
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            onRowClick={handleRowClick}
            pagination
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
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
                fontSize: '12px',
              },
              '& .MuiDataGrid-columnHeader': {
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                fontWeight: 600,
                fontSize: '12px',
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
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
            }}
          />
        )}
      </Box>
    </Box>
  );
}
