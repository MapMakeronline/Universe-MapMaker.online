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
import React from 'react';
import { Box, Typography, TextField, MenuItem } from '@mui/material';
import { BasemapSelectorProps } from '@/types/layers';

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
  },
  
  // Kolory
  colors: {
    background: {
      container: 'rgba(50, 50, 50, 0.95)',
      input: 'rgba(40, 40, 40, 0.9)'
    },
    text: {
      title: 'white',
      guide: {
        default: 'rgba(255, 255, 255, 0.6)',
        hover: '#4fc3f7'
      },
      input: 'white',
      icon: 'rgba(255, 255, 255, 0.6)'
    },
    border: {
      default: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.3)',
      focus: '#4fc3f7'
    }
  }
} as const;

export const BasemapSelector: React.FC<BasemapSelectorProps> = ({
  selectedBasemap,
  onBasemapChange
}) => {
  return (
        <Box
      sx={{
        flexShrink: 0,
        bgcolor: BASEMAP_CONFIG.colors.background.container,
        borderTop: BASEMAP_CONFIG.container.border,
        p: BASEMAP_CONFIG.container.padding,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography sx={{ 
        fontSize: BASEMAP_CONFIG.typography.title.fontSize, 
        fontWeight: BASEMAP_CONFIG.typography.title.fontWeight, 
        color: BASEMAP_CONFIG.colors.text.title, 
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
            backgroundColor: BASEMAP_CONFIG.colors.background.input,
            color: BASEMAP_CONFIG.colors.text.input,
            fontSize: BASEMAP_CONFIG.input.fontSize,
            '& fieldset': {
              borderColor: BASEMAP_CONFIG.colors.border.default,
            },
            '&:hover fieldset': {
              borderColor: BASEMAP_CONFIG.colors.border.hover,
            },
            '&.Mui-focused fieldset': {
              borderColor: BASEMAP_CONFIG.colors.border.focus,
            },
          },
          '& .MuiSelect-icon': {
            color: BASEMAP_CONFIG.colors.text.icon,
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
        color: BASEMAP_CONFIG.colors.text.guide.default, 
        mt: BASEMAP_CONFIG.typography.guide.marginTop,
        fontWeight: BASEMAP_CONFIG.typography.guide.fontWeight,
        cursor: 'pointer',
        '&:hover': {
          color: BASEMAP_CONFIG.colors.text.guide.hover
        }
      }}>
        Rozpocznij poradnik
      </Typography>
    </Box>
  );
};
