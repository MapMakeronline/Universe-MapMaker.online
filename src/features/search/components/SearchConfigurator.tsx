/**
 * SearchConfigurator - Plot Search Configuration Modal
 *
 * Allows authenticated users to:
 * - Select parcel layer
 * - Map precinct column (obręb)
 * - Map plot number column (numer działki)
 * - Save configuration to backend
 *
 * Documentation: SEARCH_DOCUMENTATION.md (lines 81-90)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLazyGetPlotLayerAttributesQuery, useSavePlotConfigMutation } from '@/backend/plot';
import type { PlotConfig } from '@/backend/plot';

interface SearchConfiguratorProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  vectorLayers: Array<{ id: string; name: string }>;
  currentConfig: PlotConfig | null;
  onSaveSuccess: (config: PlotConfig) => void;
}

const SearchConfigurator: React.FC<SearchConfiguratorProps> = ({
  open,
  onClose,
  projectName,
  vectorLayers,
  currentConfig,
  onSaveSuccess,
}) => {
  // Temporary state (edited in modal)
  const [tempLayerId, setTempLayerId] = useState<string>('');
  const [tempPrecinctColumn, setTempPrecinctColumn] = useState<string>('');
  const [tempPlotNumberColumn, setTempPlotNumberColumn] = useState<string>('');

  // RTK Query
  const [fetchLayerAttributes, { data: attributesData, isLoading: attributesLoading }] =
    useLazyGetPlotLayerAttributesQuery();
  const [savePlotConfig, { isLoading: isSaving }] = useSavePlotConfigMutation();

  // Load current config when modal opens
  useEffect(() => {
    if (open && currentConfig) {
      setTempLayerId(currentConfig.plot_layer);
      setTempPrecinctColumn(currentConfig.plot_precinct_column);
      setTempPlotNumberColumn(currentConfig.plot_number_column);
    } else if (open && !currentConfig) {
      // Reset to defaults if no config
      setTempLayerId('');
      setTempPrecinctColumn('');
      setTempPlotNumberColumn('');
    }
  }, [open, currentConfig]);

  // Fetch layer attributes when layer is selected
  useEffect(() => {
    if (tempLayerId && projectName && open) {
      fetchLayerAttributes({
        project: projectName,
        layer_id: tempLayerId,
      });
    }
  }, [tempLayerId, projectName, open, fetchLayerAttributes]);

  // Get available columns (filter out geometry columns)
  const availableColumns = attributesData?.data?.Types
    ? Object.keys(attributesData.data.Types).filter(col => col !== 'geom' && col !== 'ogc_fid')
    : [];

  // Handle save
  const handleSave = async () => {
    if (!tempLayerId || !tempPrecinctColumn || !tempPlotNumberColumn) {
      alert('Wypełnij wszystkie pola');
      return;
    }

    try {
      await savePlotConfig({
        project: projectName,
        plot_layer: tempLayerId,
        plot_number_column: tempPlotNumberColumn,
        plot_precinct_column: tempPrecinctColumn,
      }).unwrap();

      // Notify parent component
      onSaveSuccess({
        plot_layer: tempLayerId,
        plot_number_column: tempPlotNumberColumn,
        plot_precinct_column: tempPrecinctColumn,
      });

      onClose();
    } catch (error) {
      console.error('Failed to save plot config:', error);
      alert('Błąd podczas zapisywania konfiguracji');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: '#4a5568',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          Konfiguracja wyszukiwania działek
        </Box>
        <IconButton
          onClick={handleCancel}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Layer Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="config-layer-label">Wybierz warstwę działek:</InputLabel>
          <Select
            labelId="config-layer-label"
            value={tempLayerId}
            label="Wybierz warstwę działek:"
            onChange={(e) => setTempLayerId(e.target.value)}
          >
            {vectorLayers.length === 0 && (
              <MenuItem disabled>
                <em>Brak warstw wektorowych w projekcie</em>
              </MenuItem>
            )}
            {vectorLayers.map((layer) => (
              <MenuItem key={layer.id} value={layer.id}>
                {layer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Precinct Column */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled={!tempLayerId}>
          <InputLabel id="config-precinct-column-label">Kolumna obręb:</InputLabel>
          <Select
            labelId="config-precinct-column-label"
            value={availableColumns.includes(tempPrecinctColumn) ? tempPrecinctColumn : ''}
            label="Kolumna obręb:"
            onChange={(e) => setTempPrecinctColumn(e.target.value)}
          >
            {!tempLayerId && (
              <MenuItem disabled>
                <em>Najpierw wybierz warstwę</em>
              </MenuItem>
            )}
            {attributesLoading && (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Ładowanie kolumn...
              </MenuItem>
            )}
            {availableColumns.map((columnName) => (
              <MenuItem key={columnName} value={columnName}>
                {columnName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Plot Number Column */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled={!tempLayerId}>
          <InputLabel id="config-plot-column-label">Kolumna numer działki:</InputLabel>
          <Select
            labelId="config-plot-column-label"
            value={availableColumns.includes(tempPlotNumberColumn) ? tempPlotNumberColumn : ''}
            label="Kolumna numer działki:"
            onChange={(e) => setTempPlotNumberColumn(e.target.value)}
          >
            {!tempLayerId && (
              <MenuItem disabled>
                <em>Najpierw wybierz warstwę</em>
              </MenuItem>
            )}
            {attributesLoading && (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Ładowanie kolumn...
              </MenuItem>
            )}
            {availableColumns.map((columnName) => (
              <MenuItem key={columnName} value={columnName}>
                {columnName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Wybierz kolumny zawierające obręb i numer działki
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit" disabled={isSaving}>
          Anuluj
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!tempLayerId || !tempPrecinctColumn || !tempPlotNumberColumn || isSaving}
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchConfigurator;
