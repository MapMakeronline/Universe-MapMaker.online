/**
 * KOMPONENT BASEMAP SELECTOR - SELEKTOR MAP PODKŁADOWYCH
 *
 * Odpowiada za:
 * - Wybór mapy podkładowej (OpenStreetMap, Satellite, Terrain)
 * - Wyświetlanie listy dostępnych map bazowych
 * - Przełączanie między różnymi dostawcami map
 * - Ustawienia jakości i poziomu detali mapy
 * - Interface do konfiguracji mapy bazowej
 */
'use client';

import React from 'react';
import { Box, Typography, TextField, MenuItem, useTheme } from '@mui/material';

interface BasemapSelectorProps {
  selectedBasemap: string;
  onBasemapChange: (basemap: string) => void;
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

export const BasemapSelector: React.FC<BasemapSelectorProps> = ({
  selectedBasemap,
  onBasemapChange
}) => {
  const theme = useTheme();

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
        Wybór mapy podkładowej
      </Typography>

      <TextField
        select
        value={selectedBasemap}
        size="small"
        fullWidth
        onChange={(e) => onBasemapChange(e.target.value)}
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
        <MenuItem value="google-maps" sx={{ fontSize: BASEMAP_CONFIG.typography.menuItem.fontSize }}>
          Google Maps
        </MenuItem>
        <MenuItem value="openstreetmap" sx={{ fontSize: BASEMAP_CONFIG.typography.menuItem.fontSize }}>
          OpenStreetMap
        </MenuItem>
        <MenuItem value="satellite" sx={{ fontSize: BASEMAP_CONFIG.typography.menuItem.fontSize }}>
          Satelita
        </MenuItem>
        <MenuItem value="terrain" sx={{ fontSize: BASEMAP_CONFIG.typography.menuItem.fontSize }}>
          Teren
        </MenuItem>
        <MenuItem value="hybrid" sx={{ fontSize: BASEMAP_CONFIG.typography.menuItem.fontSize }}>
          Hybrydowa
        </MenuItem>
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
