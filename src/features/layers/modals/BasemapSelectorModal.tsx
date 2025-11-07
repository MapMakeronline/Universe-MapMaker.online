/**
 * BASEMAP SELECTOR MODAL - Modal wyboru mapy podkładowej
 *
 * Funkcjonalność:
 * - Lista dostępnych map podkładowych Mapbox (Ulice, Satelita, Outdoor, etc.)
 * - Radio buttons do wyboru
 * - Synchronizacja z Redux store
 * - **LAYER PRESERVATION** - Zachowuje warstwy QGIS podczas zmiany mapy podkładowej
 */
'use client';

import React from 'react';
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
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMapStyle } from '@/redux/slices/mapSlice';
import { MAP_STYLES } from '@/mapbox/config';

interface BasemapSelectorModalProps {
  open: boolean;
  onClose: () => void;
}

export const BasemapSelectorModal: React.FC<BasemapSelectorModalProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const mapStyleKey = useAppSelector((state) => state.map.mapStyleKey);

  const handleBasemapChange = (key: string) => {
    const style = MAP_STYLES[key];
    if (style) {
      // Layer preservation is now handled in MapContainer via Redux state change
      dispatch(setMapStyle({ url: style.style, key }));
    }
  };

  const handleApply = () => {
    // Zamknij modal - wybrana mapa jest już zastosowana przez handleBasemapChange
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Wybór mapy podkładowej</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={mapStyleKey || 'streets'}
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
                        Mapbox {key}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: mapStyleKey === key ? 'primary.main' : 'divider',
                    bgcolor: mapStyleKey === key ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            💡 Warstwy projektu są zachowane podczas zmiany mapy podkładowej
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={handleApply}>
          Zastosuj
        </Button>
      </DialogActions>
    </Dialog>
  );
};
