'use client'

/**
 * Strona główna - Universe MapMaker z zaawansowanym Layer Panel
 */

import { useState } from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import { store } from '../src/state/store'
import { darkTheme } from '../src/lib/theme'
import { LayerManagerCore } from '../src/modules/layers'
import MapLoader from '../src/components/map/MapLoader'
import { ViewState } from '../src/types/map.types'

export default function UniverseMapMaker() {
  // Stan mapy
  const [currentView, setCurrentView] = useState<ViewState | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Handlers mapy
  const handleMapMove = (viewState: ViewState) => {
    setCurrentView(viewState)
    console.log('[APP] Mapa przesunięta:', viewState)
  }

  const handleMapLoad = () => {
    setIsMapLoaded(true)
    console.log('[APP] Mapa załadowana')
  }

  const handleMapError = (error: Error) => {
    console.error('[APP] Błąd mapy:', error)
  }

  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />

        {/* Full screen layout without flex conflicts */}
        <Box sx={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>

          {/* Full screen map */}
          <MapLoader
            width="100%"
            height="100vh"
            showControls={true}
            showCoordinates={true}
            onMove={handleMapMove}
            onLoad={handleMapLoad}
            onError={handleMapError}
            initialConfig={{
              center: { lat: 52.2297, lng: 21.0122 }, // Warszawa
              zoom: 11,
              pitch: 0,
              bearing: 0
            }}
          />

          {/* Layer Panel overlay */}
          <LayerManagerCore
            sidebarVariant="permanent"
            sidebarWidth={320}
            sidebarMiniWidth={72}
          />

          {/* Debug panel */}
          {isMapLoaded && currentView && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                p: 1.5,
                borderRadius: 1,
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 1000,
                minWidth: 200
              }}
            >
              <div>🗺️ Universe MapMaker v2.0</div>
              <div>Lat: {currentView.center.lat.toFixed(4)}</div>
              <div>Lng: {currentView.center.lng.toFixed(4)}</div>
              <div>Zoom: {currentView.zoom.toFixed(1)}</div>
              <div style={{ marginTop: 8, fontSize: '10px', opacity: 0.8 }}>
                Zaawansowany system zarządzania warstwami
              </div>
            </Box>
          )}
        </Box>
      </ThemeProvider>
    </Provider>
  )
}

/*
 * INSTRUKCJE DLA DEVELOPERA:
 *
 * 1. QUICK START:
 *    - Skopiuj .env.local.example do .env.local
 *    - Dodaj swój token Mapbox
 *    - npm run dev
 *
 * 2. DOSTOSOWANIE:
 *    - Zmień initialConfig aby ustawić inne centrum
 *    - Ustaw showControls={false} aby ukryć kontrolki
 *    - Dodaj onMove handler aby reagować na ruch mapy
 *
 * 3. BŁĘDY:
 *    - Brak tokenu? Sprawdź .env.local
 *    - Mapa nie ładuje? Sprawdź console
 *    - Błąd "pk."? Token musi zaczynać się od "pk."
 *
 * 4. PRODUCTION:
 *    - Usuń debug panel
 *    - Sprawdź czy token jest w zmiennych środowiskowych
 *    - Zoptymalizuj rozmiar mapy dla mobile
 */