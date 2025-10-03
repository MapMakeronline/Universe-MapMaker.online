/**
 * KONFIGURACJA TEMATU MATERIAL-UI
 * 
 * Odpowiada za:
 * - Definiowanie customowego tematu dla całej aplikacji
 * - Konfigurację kolorów (paleta, primary, secondary, error)
 * - Ustawienia typografii (fonty, rozmiary, wagi)
 * - Style komponentów Material-UI (customizacja buttonów, kart, inputów)
 * - Responsywne breakpointy
 * - Style specyficzne dla sidebara i innych komponentów UI
 * - Dark/light mode configuration
 */

'use client';

import { createTheme } from '@mui/material/styles';

// ===================================================================
// GŁÓWNY TEMAT APLIKACJI - Centralna konfiguracja wyglądu
// ===================================================================
export const theme = createTheme({
  
  // ===================================================================
  // PALETA KOLORÓW - Definiuje główne kolory aplikacji
  // ===================================================================
  palette: {
    mode: 'light',        // Tryb jasny (alternatywa: 'dark')
    
    // Kolory główne (przyciski, linki, akcenty)
    primary: {
      main: '#1976d2',    // Główny niebieski
      light: '#42a5f5',   // Jaśniejszy odcień
      dark: '#1565c0',    // Ciemniejszy odcień
    },
    
    // Kolory drugorzędne (elementy pomocnicze)
    secondary: {
      main: '#dc004e',    // Główny różowy/czerwony
      light: '#ff5983',   // Jaśniejszy odcień
      dark: '#9a0036',    // Ciemniejszy odcień
    },
    
    // Kolory tła
    background: {
      default: '#f5f5f5', // Tło całej aplikacji (szare)
      paper: '#ffffff',   // Tło kart i paneli (białe)
    },
  },

  // ===================================================================
  // TYPOGRAFIA - Ustawienia fontów i tekstów
  // ===================================================================
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Główny font
    
    // Style nagłówków (h1, h2, h3)
    h1: { fontWeight: 500 },   // Średnia grubość czcionki
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
  },

  // ===================================================================
  // CUSTOMIZACJA KOMPONENTÓW - Nadpisywanie domyślnych stylów MUI
  // ===================================================================
  components: {
    
    // Stylowanie przycisków
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Wyłącza CAPS w tekście przycisków
          borderRadius: 8,       // Lekko zaokrąglone rogi
        },
      },
    },
    
    // Stylowanie kart/paneli
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,                        // Bardziej zaokrąglone rogi
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Subtelny cień
        },
      },
    },

    // Stylowanie przycisków ikon
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&.sidebar-toggle': {
            backgroundColor: 'rgba(55, 60, 72, 0.9)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            '&:hover': {
              backgroundColor: 'rgba(79, 195, 247, 0.8)',
            },
          },
          '&.toolbar-icon': {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: '4px',
            minWidth: 'auto',
            '&:hover': { 
              color: '#4fc3f7' 
            },
          },
        },
      },
    },
  },
});

// ===================================================================
// DODATKOWE STAŁE STYLOWE - Często używane kolory i style
// ===================================================================

// Kolory ikon według typu warstwy
export const layerIconColors = {
  grupa: '#4fc3f7',    // Niebieski dla folderów/grup
  wektor: '#81c784',   // Zielony dla warstw wektorowych  
  raster: '#81c784',   // Zielony dla warstw rastrowych
  default: '#81c784'   // Domyślny zielony
} as const;

// Kolory drop zones
export const dropZoneColors = {
  primary: '#4caf50',     // Główny zielony
  secondary: '#66bb6a',   // Jaśniejszy zielony
  hover: '#4caf50'        // Kolor przy hover
} as const;

// Style sidebar/panelu
export const sidebarStyles = {
  width: 320,
  background: 'rgba(60, 60, 60, 0.9)',
  boxShadow: '2px 0 12px rgba(0,0,0,0.4)',
  borderRight: '1px solid rgba(255, 255, 255, 0.2)',
  header: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  }
} as const;