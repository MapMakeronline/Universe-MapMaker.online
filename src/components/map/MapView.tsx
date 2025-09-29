'use client'

/**
 * MapView - Główny komponent mapy Mapbox GL JS
 * Czysty komponent bez external dependencies, tylko mapa
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { MapViewProps, ViewState } from '../../types/map.types'
import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_CONFIG,
  CONTROL_SETTINGS,
  MAP_LIMITS
} from '../../config/mapbox'
import styles from './map.module.css'

const MapView = ({
  width = '100%',
  height = 600,
  showControls = true,
  showCoordinates = true,
  onMove,
  onLoad,
  onError,
  initialConfig,
  className = ''
}: MapViewProps) => {
  // Refs dla DOM i instancji mapy
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  // Stan komponentu
  const [isLoaded, setIsLoaded] = useState(false)
  const [viewState, setViewState] = useState<ViewState>({
    center: initialConfig?.center || DEFAULT_MAP_CONFIG.center,
    zoom: initialConfig?.zoom || DEFAULT_MAP_CONFIG.zoom,
    pitch: initialConfig?.pitch || DEFAULT_MAP_CONFIG.pitch,
    bearing: initialConfig?.bearing || DEFAULT_MAP_CONFIG.bearing
  })

  // Aktualizacja stanu widoku - wywołuje callback jeśli został przekazany
  const updateViewState = useCallback((newState: Partial<ViewState>) => {
    const updatedState = { ...viewState, ...newState }
    setViewState(updatedState)
    onMove?.(updatedState)
  }, [viewState, onMove])

  // Handler ruchu mapy - aktualizuje współrzędne w czasie rzeczywistym
  const handleMapMove = useCallback(() => {
    if (!mapRef.current) return

    const center = mapRef.current.getCenter()
    const zoom = mapRef.current.getZoom()
    const pitch = mapRef.current.getPitch()
    const bearing = mapRef.current.getBearing()

    updateViewState({
      center: {
        lng: Math.round(center.lng * 10000) / 10000,
        lat: Math.round(center.lat * 10000) / 10000
      },
      zoom: Math.round(zoom * 100) / 100,
      pitch: Math.round(pitch),
      bearing: Math.round(bearing)
    })
  }, [updateViewState])

  // Inicjalizacja mapy - uruchamia się tylko raz
  useEffect(() => {
    console.log('[MAP] Inicjalizacja MapView...')

    if (!mapContainerRef.current || mapRef.current) return
    if (!MAPBOX_TOKEN) {
      const error = new Error('Brak tokenu Mapbox')
      console.error('[MAP]', error.message)
      onError?.(error)
      return
    }

    try {
      // Ustawienie tokenu globalnie
      mapboxgl.accessToken = MAPBOX_TOKEN

      // Konfiguracja mapy
      const mapConfig = {
        ...DEFAULT_MAP_CONFIG,
        ...initialConfig,
        container: mapContainerRef.current,
        center: [viewState.center.lng, viewState.center.lat] as [number, number],
        zoom: viewState.zoom,
        pitch: viewState.pitch,
        bearing: viewState.bearing,
        minZoom: MAP_LIMITS.minZoom,
        maxZoom: MAP_LIMITS.maxZoom,
        maxBounds: MAP_LIMITS.maxBounds
      }

      console.log('[MAP] Tworzenie instancji mapy...', mapConfig)
      mapRef.current = new mapboxgl.Map(mapConfig)

      // Event listeners dla mapy
      mapRef.current.on('load', () => {
        console.log('[MAP] Mapa załadowana pomyślnie')
        setIsLoaded(true)
        onLoad?.(mapRef.current!)
      })

      mapRef.current.on('move', handleMapMove)
      mapRef.current.on('zoom', handleMapMove)
      mapRef.current.on('rotate', handleMapMove)
      mapRef.current.on('pitch', handleMapMove)

      mapRef.current.on('error', (e) => {
        console.error('[MAP] Błąd mapy:', e)
        const error = new Error(e.error?.message || 'Nieznany błąd mapy')
        onError?.(error)
      })

      // Dodanie kontrolek jeśli włączone
      if (showControls) {
        // Kontrolki nawigacji (zoom, kompas)
        mapRef.current.addControl(
          new mapboxgl.NavigationControl(CONTROL_SETTINGS.navigation),
          'top-right'
        )

        // Kontrolka pełnego ekranu
        if (CONTROL_SETTINGS.fullscreen) {
          mapRef.current.addControl(
            new mapboxgl.FullscreenControl(),
            'top-right'
          )
        }

        // Skala mapy
        mapRef.current.addControl(
          new mapboxgl.ScaleControl(CONTROL_SETTINGS.scale),
          'bottom-left'
        )
      }

    } catch (error) {
      console.error('[MAP] Błąd inicjalizacji:', error)
      onError?.(error as Error)
    }

    // Cleanup przy odmontowaniu komponentu
    return () => {
      console.log('[MAP] Czyszczenie mapy...')
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Tylko przy mount - nie zależymy od innych wartości

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ width, height }}
    >
      {/* Kontener mapy */}
      <div
        ref={mapContainerRef}
        className={styles.mapContainer}
        aria-label="Interaktywna mapa Mapbox"
      />

      {/* Panel współrzędnych - pokazuje aktualną pozycję */}
      {showCoordinates && isLoaded && (
        <div className={styles.coordinates}>
          <div className={styles.coordinatesHeader}>Lokalizacja</div>
          <div className={styles.coordinatesItem}>
            <span>Szerokość:</span>
            <span>{viewState.center.lat}°</span>
          </div>
          <div className={styles.coordinatesItem}>
            <span>Długość:</span>
            <span>{viewState.center.lng}°</span>
          </div>
          <div className={styles.coordinatesItem}>
            <span>Zoom:</span>
            <span>{viewState.zoom}</span>
          </div>
          {viewState.pitch !== 0 && (
            <div className={styles.coordinatesItem}>
              <span>Nachylenie:</span>
              <span>{viewState.pitch}°</span>
            </div>
          )}
          {viewState.bearing !== 0 && (
            <div className={styles.coordinatesItem}>
              <span>Obrót:</span>
              <span>{viewState.bearing}°</span>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>Ładowanie mapy...</p>
        </div>
      )}
    </div>
  )
}

export default MapView

// TODO: Dodać obsługę gestów dotykowych na mobile
// TODO: Dodać możliwość zmiany stylu mapy w runtime
// TODO: Dodać support dla custom markers