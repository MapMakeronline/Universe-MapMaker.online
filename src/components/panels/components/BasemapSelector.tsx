/**
 * KOMPONENT BASEMAP SELECTOR - SELEKTOR MAP PODKŁADOWYCH
 *
 * Odpowiada za:
 * - Wybór mapy podkładowej Mapbox (Ulice, Satelita, Outdoor, etc.)
 * - Wyświetlanie listy dostępnych map bazowych
 * - Przełączanie między różnymi stylami Mapbox
 * - Synchronizacja z Redux store
 */
'use client';

import React from 'react';
import { Box, Typography, TextField, MenuItem, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMapStyle } from '@/store/slices/mapSlice';
import { MAP_STYLES } from '@/lib/mapbox/config';

interface BasemapSelectorProps {
  // Props are now optional since we use Redux
}

// Obiekt konfiguracji dla wielkości i stylów selektora map podkładowych
const BASEMAP_CONFIG = {
  // Ustawienia kontenera
  container: {
    padding: 1.5,
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },

  // Ustawienia typografii
  typography: {
    title: {
      fontSize: '9px',
      fontWeight: 500,
      marginBottom: 1
    },
    guide: {
      fontSize: '8px',
      fontWeight: 500,
      marginTop: 1
    },
    menuItem: {
      fontSize: '9px'
    }
  },

  // Ustawienia pola wejściowego
  input: {
    padding: '6px 12px',
    fontSize: '10px'
  }
} as const;

export const BasemapSelector: React.FC<BasemapSelectorProps> = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { mapStyleKey } = useAppSelector((state) => state.map);

  const handleBasemapChange = (key: string) => {
    const style = MAP_STYLES[key];
    if (style) {
      dispatch(setMapStyle({ url: style.style, key }));
    }
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        bgcolor: theme.palette.background.paper,
        borderTop: BASEMAP_CONFIG.container.border,
        p: BASEMAP_CONFIG.container.padding,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography sx={{
        fontSize: BASEMAP_CONFIG.typography.title.fontSize,
        fontWeight: BASEMAP_CONFIG.typography.title.fontWeight,
        color: theme.palette.text.primary,
        mb: BASEMAP_CONFIG.typography.title.marginBottom
      }}>
        Mapa podkładowa
      </Typography>

      <TextField
        select
        value={mapStyleKey || 'streets'}
        size="small"
        fullWidth
        onChange={(e) => handleBasemapChange(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
            fontSize: BASEMAP_CONFIG.input.fontSize,
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.divider,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            },
          },
          '& .MuiSelect-icon': {
            color: theme.palette.text.secondary,
          },
          '& .MuiInputBase-input': {
            padding: `${BASEMAP_CONFIG.input.padding} !important`,
          }
        }}
      >
        {Object.entries(MAP_STYLES).map(([key, style]) => (
          <MenuItem
            key={key}
            value={key}
            sx={{ fontSize: BASEMAP_CONFIG.typography.menuItem.fontSize }}
          >
            {style.name}
          </MenuItem>
        ))}
      </TextField>

      <Typography sx={{
        fontSize: BASEMAP_CONFIG.typography.guide.fontSize,
        color: theme.palette.text.secondary,
        mt: BASEMAP_CONFIG.typography.guide.marginTop,
        fontWeight: BASEMAP_CONFIG.typography.guide.fontWeight,
        cursor: 'pointer',
        '&:hover': {
          color: theme.palette.primary.main
        }
      }}>
        Rozpocznij poradnik
      </Typography>
    </Box>
  );
};
