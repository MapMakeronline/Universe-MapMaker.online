'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { DataGridPro, GridColDef, GridRowModel, GridRowsProp, GridRowParams } from '@mui/x-data-grid-pro';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';
import {
  useGetLayerFeaturesQuery,
  useGetLayerConstraintsQuery,
  useSaveMultipleRecordsMutation,
} from '@/backend/layers';
import { useAppDispatch } from '@/redux/hooks';
import { showSuccess, showError } from '@/redux/slices/notificationSlice';
import { useZoomToFeature } from '../hooks/useZoomToFeature';

interface AttributeTableModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  layerId: string;
  layerName: string;
}

/**
 * Attribute Table Modal
 * Displays layer attributes in editable DataGrid table
 *
 * Features:
 * - Display all layer attributes in row-based table
 * - In-line editing (double-click cell)
 * - Search across all columns
 * - Export to CSV
 * - Batch save changes
 * - Validation (NOT NULL, UNIQUE, AUTO_INCREMENT)
 * - Zoom to feature on row click
 */
export function AttributeTableModal({
  open,
  onClose,
  projectName,
  layerId,
  layerName,
}: AttributeTableModalProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const zoomToFeature = useZoomToFeature();
  const [searchText, setSearchText] = useState('');
  const [editedRows, setEditedRows] = useState<Map<number, GridRowModel>>(new Map());

  // Infinite scroll state: how many rows to display (starts at 100)
  const [displayedRowsCount, setDisplayedRowsCount] = useState(100);

  // Fetch layer features (row-based data)
  // Optimization: Load only 1000 records for better performance
  const {
    data: featuresResponse,
    isLoading,
    error,
    refetch,
  } = useGetLayerFeaturesQuery(
    { project: projectName, layer_id: layerId, limit: 1000 },
    { skip: !open } // Don't fetch until modal opens
  );

  // Fetch column constraints (NOT NULL, UNIQUE, AUTO_INCREMENT)
  const { data: constraintsResponse } = useGetLayerConstraintsQuery(
    { project: projectName, layer_id: layerId },
    { skip: !open }
  );

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
      // Skip geometry columns (not editable in table)
      if (key === 'geom' || key === 'geometry') return;

      const isRequired = constraints.not_null_fields.includes(key);
      const isUnique = constraints.unique_fields.includes(key);
      const isAutoIncrement = constraints.sequence_fields.includes(key);

      cols.push({
        field: key,
        headerName: key + (isRequired ? ' *' : ''),
        flex: 1,
        minWidth: 150,
        editable: !isAutoIncrement, // Disable editing for auto-increment columns (gid)
        type: 'string', // Default to string (backend doesn't send type info in /api/layer/features)
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
      // Use first available primary key: gid > fid > ogc_fid > fallback to index
      // Use ?? instead of || to allow 0 as valid ID
      id: feature.gid ?? feature.fid ?? feature.ogc_fid ?? index,
      ...feature,
    }));
  }, [features]);

  // Filter rows by search text (all rows, not sliced)
  const allFilteredRows = useMemo(() => {
    if (!searchText) return rows;

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [rows, searchText]);

  // Infinite scroll: Display only first N rows (grows as user scrolls)
  const displayedRows = useMemo(() => {
    const sliced = allFilteredRows.slice(0, displayedRowsCount);
    return sliced;
  }, [allFilteredRows, displayedRowsCount]);

  // Reset displayedRowsCount when layer changes or search changes
  React.useEffect(() => {
    setDisplayedRowsCount(100);
  }, [layerId, searchText]);

  // Infinite scroll: DataGridPro native implementation
  const handleScrollEnd = React.useCallback(() => {
    if (displayedRowsCount < allFilteredRows.length) {
      setDisplayedRowsCount(prev => Math.min(prev + 100, allFilteredRows.length));
    }
  }, [displayedRowsCount, allFilteredRows.length]);

  // Handler for cell edit
  const handleRowEditCommit = (newRow: GridRowModel) => {
    setEditedRows((prev) => new Map(prev).set(newRow.id as number, newRow));
    return newRow;
  };

  // Save all changes to backend
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
      setEditedRows(new Map()); // Clear edited rows
      refetch(); // Refresh data
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Nieznany błąd zapisu';
      dispatch(showError(`Błąd zapisu: ${errorMessage}`));
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (allFilteredRows.length === 0) {
      dispatch(showError('Brak danych do eksportu'));
      return;
    }

    const csv = [
      // Header row
      columns.map((col) => col.headerName).join(','),
      // Data rows
      ...allFilteredRows.map((row) =>
        columns.map((col) => {
          const value = row[col.field];
          // Escape commas and quotes in CSV
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

  // Zoom to feature on row click
  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      console.log('[Attribute Table] Row clicked, full row data:', params.row);

      // Try to get feature ID from row (check multiple possible primary key columns)
      // Priority: gid > fid > ogc_fid > id (DataGrid row ID)
      // IMPORTANT: Use ?? instead of || to allow 0 as valid ID
      const featureId = params.row.gid ?? params.row.fid ?? params.row.ogc_fid ?? params.row.id;

      if (featureId === undefined || featureId === null) {
        console.warn('[Attribute Table] Row clicked but no primary key found (gid/fid/ogc_fid/id)');
        console.warn('[Attribute Table] Available columns:', Object.keys(params.row));
        return;
      }

      console.log(`[Attribute Table] Row clicked: feature ID = ${featureId}, layer = "${layerName}"`);

      // Zoom to feature on map
      zoomToFeature(featureId, layerName);
    },
    [zoomToFeature, layerName]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen>
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: theme.palette.modal?.header || '#4a5568',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
            Tabela atrybutów: {layerName}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {displayedRows.length < allFilteredRows.length
              ? `${displayedRows.length} / ${allFilteredRows.length} rekordów`
              : `${allFilteredRows.length} rekordów`}
          </Typography>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: '#fafafa',
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Wyszukaj..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1, maxWidth: '400px' }}
          />

          {/* Actions */}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Odśwież
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={allFilteredRows.length === 0}
          >
            Eksportuj CSV
          </Button>
        </Box>

        {/* DataGrid or Loading/Error */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Skeleton loader - table-like structure */}
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} /> {/* Header */}
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={42} sx={{ borderRadius: 0.5, opacity: 1 - i * 0.07 }} />
              ))}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 3 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">Ładowanie tabeli atrybutów...</Typography>
              </Box>
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">
                Błąd ładowania danych: {(error as any).message || 'Nieznany błąd'}
              </Alert>
            </Box>
          ) : allFilteredRows.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <Typography color="text.secondary">
                {searchText ? 'Brak wyników wyszukiwania' : 'Brak danych'}
              </Typography>
            </Box>
          ) : (
            <DataGridPro
              rows={displayedRows}
              columns={columns}
              // Infinite scroll: DataGridPro native implementation
              onRowsScrollEnd={handleScrollEnd}
              scrollEndThreshold={200} // Trigger when 200px from bottom
              hideFooter
              processRowUpdate={handleRowEditCommit}
              onProcessRowUpdateError={(error) => {
                dispatch(showError('Błąd edycji wiersza'));
              }}
              // Zoom to feature on row click
              onRowClick={handleRowClick}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  fontSize: '13px',
                },
                '& .MuiDataGrid-columnHeader': {
                  bgcolor: '#f5f5f5',
                  fontWeight: 600,
                  fontSize: '13px',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer', // Indicate clickable rows
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            />
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          borderTop: '1px solid #e0e0e0',
          px: 3,
          py: 2,
          gap: 2,
        }}
      >
        <Typography variant="caption" sx={{ mr: 'auto', color: 'text.secondary' }}>
          {editedRows.size > 0 && `${editedRows.size} niezapisanych zmian`}
        </Typography>

        <Button onClick={onClose} variant="outlined">
          Anuluj
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={editedRows.size === 0 || isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
