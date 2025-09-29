'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapCoordinates {
  lng: number
  lat: number
  zoom: number
}

interface MapboxMapProps {
  token?: string
}

export default function MapboxMapNew({ token }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [coordinates, setCoordinates] = useState<MapCoordinates>({
    lng: 21.0122, // Warszawa długość geograficzna
    lat: 52.2297,  // Warszawa szerokość geograficzna
    zoom: 10
  })
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Użyj tokenu z props lub zmiennej środowiskowej
  const mapboxToken = token || process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Aktualizacja współrzędnych podczas ruchu mapy
  const updateCoordinates = useCallback(() => {
    if (!map.current) return

    const center = map.current.getCenter()
    const zoom = map.current.getZoom()

    setCoordinates({
      lng: Math.round(center.lng * 10000) / 10000,
      lat: Math.round(center.lat * 10000) / 10000,
      zoom: Math.round(zoom * 100) / 100
    })
  }, [])

  useEffect(() => {
    // Sprawdzenie czy mamy token
    if (!mapboxToken) {
      setMapError('Brak tokenu Mapbox. Dodaj NEXT_PUBLIC_MAPBOX_TOKEN do pliku .env.local')
      setIsLoading(false)
      return
    }

    // Sprawdzenie czy kontener istnieje
    if (!mapContainer.current) return

    // Zapobieganie wielokrotnej inicjalizacji
    if (map.current) return

    try {
      // Ustawienie tokenu Mapbox
      mapboxgl.accessToken = mapboxToken

      // Inicjalizacja mapy
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Styl mapy
        center: [coordinates.lng, coordinates.lat],   // Początkowe centrum (Warszawa)
        zoom: coordinates.zoom,                        // Początkowy zoom
        projection: 'mercator'                         // Projekcja mapy
      })

      // Dodanie kontrolek nawigacji (zoom in/out, kompas)
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }),
        'top-right'
      )

      // Dodanie kontrolki pełnego ekranu
      map.current.addControl(
        new mapboxgl.FullscreenControl(),
        'top-right'
      )

      // Dodanie kontrolki skali
      map.current.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }),
        'bottom-left'
      )

      // Event listeners dla aktualizacji współrzędnych
      map.current.on('load', () => {
        setIsLoading(false)
        console.log('Mapa Mapbox załadowana pomyślnie')
      })

      map.current.on('move', updateCoordinates)
      map.current.on('zoom', updateCoordinates)

      // Obsługa błędów
      map.current.on('error', (e) => {
        console.error('Błąd Mapbox:', e)
        setMapError(`Błąd ładowania mapy: ${e.error?.message || 'Nieznany błąd'}`)
      })

    } catch (error) {
      console.error('Błąd inicjalizacji mapy:', error)
      setMapError(`Nie udało się zainicjalizować mapy: ${error instanceof Error ? error.message : 'Nieznany błąd'}`)
      setIsLoading(false)
    }

    // Cleanup przy odmontowaniu komponentu
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mapboxToken]) // Dependencja tylko od tokenu

  return (
    <div className="map-container">
      {/* Kontener mapy */}
      <div
        ref={mapContainer}
        className="mapbox-container"
        aria-label="Interaktywna mapa"
      />

      {/* Panel informacyjny ze współrzędnymi */}
      <div className="coordinates-panel">
        <div className="coordinates-header">Lokalizacja</div>
        <div className="coordinates-item">
          <span className="coordinates-label">Długość:</span>
          <span className="coordinates-value">{coordinates.lng}°</span>
        </div>
        <div className="coordinates-item">
          <span className="coordinates-label">Szerokość:</span>
          <span className="coordinates-value">{coordinates.lat}°</span>
        </div>
        <div className="coordinates-item">
          <span className="coordinates-label">Zoom:</span>
          <span className="coordinates-value">{coordinates.zoom}</span>
        </div>
      </div>

      {/* Komunikat o ładowaniu */}
      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner" />
          <p>Ładowanie mapy...</p>
        </div>
      )}

      {/* Komunikat o błędzie */}
      {mapError && (
        <div className="map-error">
          <p className="error-title">⚠️ Błąd mapy</p>
          <p className="error-message">{mapError}</p>
          <div className="error-help">
            <p>Aby naprawić:</p>
            <ol>
              <li>Zarejestruj się na <a href="https://account.mapbox.com/auth/signup/" target="_blank" rel="noopener noreferrer">mapbox.com</a></li>
              <li>Skopiuj swój Access Token</li>
              <li>Dodaj go do pliku .env.local jako NEXT_PUBLIC_MAPBOX_TOKEN</li>
              <li>Zrestartuj serwer deweloperski</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}