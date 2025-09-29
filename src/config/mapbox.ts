/**
 * Centralna konfiguracja dla Mapbox GL JS
 * Wszystkie ustawienia i stałe w jednym miejscu
 */

import { MapStyle, MapConfig, Coordinates } from '../types/map.types'
import { validateMapboxToken as enhancedValidate, getTokenDebugInfo, isCloudRunEnvironment } from '../utils/mapbox-token-validator'

// Token z zmiennych środowiskowych
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Domyślne współrzędne - Warszawa, Polska
export const DEFAULT_CENTER: Coordinates = {
  lat: 52.2297,
  lng: 21.0122
}

// Domyślny poziom zoom
export const DEFAULT_ZOOM = 11

// Dostępne style map
export const MAP_STYLES: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11'
}

// Domyślna konfiguracja mapy
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  style: MAP_STYLES.streets,
  showControls: true,
  pitch: 0,
  bearing: 0
}

// Legacy validation for backward compatibility
export const validateMapboxToken = (): { isValid: boolean; error?: string } => {
  const result = enhancedValidate(MAPBOX_TOKEN)

  // Log enhanced debug info
  if (typeof window !== 'undefined') {
    console.log('[MAP] Token validation:', {
      ...getTokenDebugInfo(),
      environment: result.environment,
      warnings: result.warnings
    })
  }

  if (result.warnings && result.warnings.length > 0) {
    result.warnings.forEach(warning => console.warn('[MAP Warning]', warning))
  }

  return {
    isValid: result.isValid,
    error: result.error
  }
}

// Export enhanced validator for direct use
export { enhancedValidate, getTokenDebugInfo, isCloudRunEnvironment }

// Ustawienia kontrolek mapy
export const CONTROL_SETTINGS = {
  navigation: {
    showCompass: true,
    showZoom: true,
    visualizePitch: true
  },
  fullscreen: true,
  scale: {
    maxWidth: 100,
    unit: 'metric' as const
  }
}

// Limity mapy dla lepszej wydajności
export const MAP_LIMITS = {
  minZoom: 1,
  maxZoom: 20,
  maxBounds: [
    [-180, -85], // Southwest corner
    [180, 85]    // Northeast corner
  ] as [[number, number], [number, number]]
}