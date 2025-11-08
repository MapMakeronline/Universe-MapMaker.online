'use client';

import React, { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { GridColumnVisibilityModel } from '@mui/x-data-grid-pro';

interface ColumnInfo {
  field: string;
  headerName: string;
  group: 'geometry' | 'metadata' | 'attributes';
}

interface ColumnManagerModalProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnInfo[];
  visibilityModel: GridColumnVisibilityModel;
  onVisibilityChange: (model: GridColumnVisibilityModel) => void;
}

/**
 * Column Manager Modal
 * Clean, user-friendly interface for managing table columns
 *
 * Features:
 * - Search columns by name
 * - Group by type (geometry, metadata, attributes)
 * - Select all / Deselect all
 * - Counter of visible columns
 * - Large touch targets for mobile
 */
export function ColumnManagerModal({
  open,
  onClose,
  columns,
  visibilityModel,
  onVisibilityChange,
}: ColumnManagerModalProps) {
  const [searchText, setSearchText] = useState('');
  const [localVisibility, setLocalVisibility] = useState<GridColumnVisibilityModel>(visibilityModel);

  // Sync external changes
  React.useEffect(() => {
    setLocalVisibility(visibilityModel);
  }, [visibilityModel]);

  // Group columns by type
  const groupedColumns = useMemo(() => {
    const groups: Record<string, ColumnInfo[]> = {
      geometry: [],
      metadata: [],
      attributes: [],
    };

    columns.forEach((col) => {
      groups[col.group].push(col);
    });

    return groups;
  }, [columns]);

  // Filter columns by search text
  const filteredGroups = useMemo(() => {
    if (!searchText.trim()) return groupedColumns;

    const filtered: Record<string, ColumnInfo[]> = {
      geometry: [],
      metadata: [],
      attributes: [],
    };

    const search = searchText.toLowerCase();

    Object.entries(groupedColumns).forEach(([group, cols]) => {
      filtered[group as keyof typeof filtered] = cols.filter(
        (col) =>
          col.headerName.toLowerCase().includes(search) ||
          col.field.toLowerCase().includes(search)
      );
    });

    return filtered;
  }, [groupedColumns, searchText]);

  // Count visible columns
  const visibleCount = useMemo(() => {
    return columns.filter((col) => localVisibility[col.field] !== false).length;
  }, [columns, localVisibility]);

  const handleToggle = (field: string) => {
    setLocalVisibility((prev) => ({
      ...prev,
      [field]: prev[field] === false ? true : false,
    }));
  };

  const handleSelectAll = () => {
    const newModel: GridColumnVisibilityModel = {};
    columns.forEach((col) => {
      newModel[col.field] = true;
    });
    setLocalVisibility(newModel);
  };

  const handleDeselectAll = () => {
    const newModel: GridColumnVisibilityModel = {};
    columns.forEach((col) => {
      newModel[col.field] = false;
    });
    setLocalVisibility(newModel);
  };

  const handleApply = () => {
    onVisibilityChange(localVisibility);
    onClose();
  };

  const handleCancel = () => {
    setLocalVisibility(visibilityModel); // Reset to original
    onClose();
  };

  const renderGroup = (groupKey: 'geometry' | 'metadata' | 'attributes', title: string, icon: React.ReactNode) => {
    const cols = filteredGroups[groupKey];
    if (cols.length === 0) return null;

    const visibleInGroup = cols.filter((col) => localVisibility[col.field] !== false).length;

    return (
      <Box key={groupKey} sx={{ mb: 2 }}>
        {/* Group Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
            pb: 0.5,
            borderBottom: '2px solid',
            borderColor: 'divider',
          }}
        >
          {icon}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '13px' }}>
            {title}
          </Typography>
          <Chip
            label={`${visibleInGroup}/${cols.length}`}
            size="small"
            sx={{ ml: 'auto', height: 20, fontSize: '10px' }}
          />
        </Box>

        {/* Column Checkboxes */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1 }}>
          {cols.map((col) => {
            const isVisible = localVisibility[col.field] !== false;

            return (
              <FormControlLabel
                key={col.field}
                control={
                  <Checkbox
                    checked={isVisible}
                    onChange={() => handleToggle(col.field)}
                    size="small"
                    sx={{ py: 0.5 }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: isVisible ? 'text.primary' : 'text.disabled',
                        fontWeight: isVisible ? 500 : 400,
                        flex: 1,
                        wordBreak: 'break-word',
                      }}
                    >
                      {col.headerName}
                    </Typography>
                    {!isVisible && <VisibilityOffIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                  </Box>
                }
                sx={{
                  m: 0,
                  p: 0.5,
                  borderRadius: 1,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          borderRadius: 2,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ViewColumnIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flex: 1, fontSize: '16px', fontWeight: 600 }}>
          Zarządzaj kolumnami
        </Typography>
        <Chip
          icon={<VisibilityIcon sx={{ fontSize: 14 }} />}
          label={`${visibleCount}/${columns.length} widocznych`}
          color="primary"
          size="small"
          sx={{ fontWeight: 600 }}
        />
        <IconButton size="small" onClick={handleCancel} sx={{ ml: 1 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 2 }}>
        {/* Search + Quick Actions */}
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Search Box */}
          <TextField
            size="small"
            fullWidth
            placeholder="Wyszukaj kolumnę..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handleSelectAll}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Zaznacz wszystkie
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityOffIcon />}
              onClick={handleDeselectAll}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Odznacz wszystkie
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Column Groups */}
        <Box sx={{ maxHeight: '50vh', overflowY: 'auto', pr: 1 }}>
          {renderGroup('geometry', 'Geometria', <ViewColumnIcon sx={{ fontSize: 18, color: 'primary.main' }} />)}
          {renderGroup('metadata', 'Metadane', <ViewColumnIcon sx={{ fontSize: 18, color: 'secondary.main' }} />)}
          {renderGroup('attributes', 'Atrybuty', <ViewColumnIcon sx={{ fontSize: 18, color: 'success.main' }} />)}

          {/* No results */}
          {searchText && Object.values(filteredGroups).every((cols) => cols.length === 0) && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" sx={{ fontSize: '13px' }}>
                Nie znaleziono kolumn dla: "{searchText}"
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined" sx={{ borderRadius: 2 }}>
          Anuluj
        </Button>
        <Button onClick={handleApply} variant="contained" sx={{ borderRadius: 2 }}>
          Zastosuj
        </Button>
      </DialogActions>
    </Dialog>
  );
}
