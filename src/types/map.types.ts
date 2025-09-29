/**
 * TypeScript definicje dla systemu map
 * Wszystkie typy w jednym miejscu dla łatwego zarządzania
 */

import type { Map as MapboxMap } from 'mapbox-gl'

// Podstawowe współrzędne geograficzne
export interface Coordinates {
  lat: number  // szerokość geograficzna (-90 do 90)
  lng: number  // długość geograficzna (-180 do 180)
}

// Dostępne style map Mapbox
export type MapStyle = 'streets' | 'satellite' | 'outdoors' | 'light' | 'dark'

// Stan widoku mapy - wszystkie parametry kamera
export interface ViewState {
  center: Coordinates
  zoom: number
  pitch?: number   // nachylenie kamery (0-60 stopni)
  bearing?: number // obrót mapy (0-360 stopni)
}

// Kompletna konfiguracja mapy
export interface MapConfig extends ViewState {
  style: string        // URL stylu Mapbox
  showControls: boolean // czy pokazywać kontrolki nawigacji
}

// Props dla komponentu MapView
export interface MapViewProps {
  width?: string | number    // szerokość mapy (domyślnie: 100%)
  height?: string | number   // wysokość mapy (domyślnie: 600px)
  showControls?: boolean     // czy pokazywać kontrolki (domyślnie: true)
  showCoordinates?: boolean  // czy pokazywać panel współrzędnych (domyślnie: true)
  onMove?: (viewState: ViewState) => void  // callback przy ruchu mapy
  onLoad?: (map: MapboxMap) => void        // callback po załadowaniu mapy
  onError?: (error: Error) => void         // callback przy błędzie
  initialConfig?: Partial<MapConfig>       // początkowa konfiguracja mapy
  className?: string     // dodatkowe klasy CSS
}

// Props dla komponentu MapLoader
export interface MapLoaderProps extends Omit<MapViewProps, 'onLoad' | 'onError'> {
  fallbackMessage?: string  // wiadomość gdy brak tokenu
  loadingMessage?: string   // wiadomość podczas ładowania
}

// Hook useMap - return type
export interface UseMapReturn {
  map: MapboxMap | null
  isLoaded: boolean
  error: string | null
  viewState: ViewState
  updateViewState: (newState: Partial<ViewState>) => void
}

// Dane o kontrolkach mapy
export interface MapControls {
  navigation: boolean    // kontrolki zoom i kompas
  fullscreen: boolean   // przycisk pełnego ekranu
  scale: boolean        // skala mapy
  geolocate: boolean    // lokalizacja użytkownika
}

// Status ładowania mapy
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error'

// Błędy związane z mapą
export interface MapError {
  type: 'token' | 'network' | 'style' | 'unknown'
  message: string
  originalError?: Error
}

// Event handlery dla mapy
export interface MapEventHandlers {
  onMoveStart?: () => void
  onMove?: (viewState: ViewState) => void
  onMoveEnd?: (viewState: ViewState) => void
  onZoomStart?: () => void
  onZoom?: (zoom: number) => void
  onZoomEnd?: (zoom: number) => void
  onClick?: (coordinates: Coordinates) => void
}

// Konfiguracja dla custom hook useMap
export interface UseMapConfig extends MapConfig {
  container: HTMLElement | null
  onLoad?: (map: MapboxMap) => void
  onError?: (error: MapError) => void
}

// TODO: Rozszerzyć o typy dla warstw mapy (layers)
// TODO: Dodać typy dla markerów i popup-ów
// TODO: Dodać typy dla stylów custom