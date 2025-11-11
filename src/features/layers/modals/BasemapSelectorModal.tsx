/**
 * BASEMAP SELECTOR MODAL - Modal wyboru mapy podkładowej
 *
 * Funkcjonalność:
 * - Lista dostępnych map podkładowych Mapbox
 * - Radio buttons do wyboru
 * - Synchronizacja z Redux store
 * - **Zapisuje wybór w backendzie** (tree.json)
 */
'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMapStyle } from '@/redux/slices/mapSlice';
import { MAP_STYLES } from '@/mapbox/config';
import { useSetBasemapMutation } from '@/backend/projects';
import { mapLogger } from '@/tools/logger';

interface BasemapSelectorModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string; // Nazwa projektu do zapisania w backendzie
}

export const BasemapSelectorModal: React.FC<BasemapSelectorModalProps> = ({
  open,
  onClose,
  projectName,
}) => {
  const dispatch = useAppDispatch();
  const mapStyleKey = useAppSelector((state) => state.map.mapStyleKey);

  const [setBasemap, { isLoading, error }] = useSetBasemapMutation();
  const [selectedKey, setSelectedKey] = useState(mapStyleKey || 'full3d');

  const handleBasemapChange = (key: string) => {
    setSelectedKey(key);
  };

  const handleApply = () => {
    const style = MAP_STYLES[selectedKey];
    if (!style) {
      mapLogger.error(`❌ Style not found: ${selectedKey}`);
      return;
    }

    try {
      mapLogger.log(`🎨 Changing basemap to: ${selectedKey}`);

      // Save preference to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('mapStyleKey', selectedKey);
        mapLogger.log(`💾 Saved basemap preference to localStorage: ${selectedKey}`);
      }

      // Change map style in Redux (triggers QGISProjectLayersLoader to reload layers)
      dispatch(setMapStyle({ url: style.style, key: selectedKey }));

      mapLogger.log(`✅ Basemap changed: ${selectedKey}`);

      // Close modal
      onClose();

    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      mapLogger.error('❌ Failed to change basemap:', errorMessage, err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Wybór mapy podkładowej</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Nie udało się zapisać mapy podkładowej. Spróbuj ponownie.
            </Alert>
          )}

          <FormControl component="fieldset" fullWidth disabled={isLoading}>
            <RadioGroup
              value={selectedKey}
              onChange={(e) => handleBasemapChange(e.target.value)}
            >
              {Object.entries(MAP_STYLES).map(([key, style]) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {style.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {style.description || `Mapbox ${key}`}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: selectedKey === key ? 'primary.main' : 'divider',
                    bgcolor: selectedKey === key ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            💡 Wybrana mapa jest zapisana w projekcie
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Anuluj
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={isLoading || selectedKey === mapStyleKey}
        >
          {isLoading ? <CircularProgress size={20} /> : 'Zastosuj'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
