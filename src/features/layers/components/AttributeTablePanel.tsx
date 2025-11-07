'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { DataGrid, GridColDef, GridRowModel, GridRowsProp, GridRowSelectionModel } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { useTheme } from '@mui/material/styles';
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
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

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

  // Handle row selection (highlight on map)
  const handleRowSelection = useCallback((newSelection: GridRowSelectionModel) => {
    setSelectionModel(newSelection);

    if (newSelection.length > 0 && onRowSelect) {
      const selectedId = newSelection[0];
      const selectedRow = rows.find((row) => row.id === selectedId);
      if (selectedRow) {
        console.log('🎯 Row selected:', selectedId, selectedRow);
        onRowSelect(selectedId, selectedRow);
      }
    }
  }, [rows, onRowSelect]);

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
          height: 8,
          bgcolor: isDragging ? 'primary.main' : 'divider',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'primary.light',
          },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
      </Box>

      {/* Header */}
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
            {filteredRows.length} rekordów
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Wyszukaj..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
            }}
            sx={{ width: 250 }}
          />

          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isLoading}>
            Odśwież
          </Button>

          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={filteredRows.length === 0}>
            CSV
          </Button>

          {editedRows.size > 0 && (
            <Button size="small" variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <CircularProgress size={16} /> : `Zapisz (${editedRows.size})`}
            </Button>
          )}

          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
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
            checkboxSelection
            pagination
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={handleRowSelection}
            processRowUpdate={handleRowEditCommit}
            onProcessRowUpdateError={(error) => {
              console.error('Row edit error:', error);
              dispatch(showError('Błąd edycji wiersza'));
            }}
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
              '& .MuiDataGrid-row:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              },
              '& .MuiDataGrid-row.Mui-selected': {
                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                },
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
}
