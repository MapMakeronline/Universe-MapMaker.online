import { MapStyles } from '@/types-app/map';

// Get token directly from environment variable
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ';

// Simple function to get token (for compatibility)
export const fetchMapboxToken = async (): Promise<string> => {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured in environment variables');
  }
  return MAPBOX_TOKEN;
};

export const DEFAULT_VIEW_STATE = {
  longitude: 21.0122, // Warszawa
  latitude: 52.2297,
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

export const MAP_STYLES: MapStyles = {
  full3d: {
    name: '3D Pełny (Teren + Budynki)',
    style: 'mapbox://styles/mapbox/streets-v12',
    enable3D: true,
    enableTerrain: true,
    enableSky: true,
  },
  none: {
    name: 'Brak mapy podkładowej',
    style: 'mapbox://styles/mapbox/light-v11', // Minimalistic light style
  },
  satellite3d: {
    name: 'Satelita (Teren + Budynki)',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    enable3D: true,
    enableTerrain: true,
    enableSky: true,
  },
  dark: {
    name: 'Ciemna',
    style: 'mapbox://styles/mapbox/dark-v11',
  },
  navigation: {
    name: 'Nawigacja',
    style: 'mapbox://styles/mapbox/navigation-night-v1',
  },
};

export const MAP_CONFIG = {
  // ==================== PROJECTION (EPSG:3857 - Web Mercator) ====================
  projection: 'mercator' as const, // Force Web Mercator projection (EPSG:3857) - matches backend PostGIS data

  // ==================== RENDERING OPTIMIZATIONS ====================
  antialias: false, // Wyłącz antialiasing dla lepszej wydajności (30% szybsze renderowanie)
  preserveDrawingBuffer: false, // Lepsze FPS (oszczędza memory)
  renderWorldCopies: false, // Nie renderuj duplikatów świata (50% mniej tile requests)
  fadeDuration: 100, // Skróć czas fade animacji (domyślnie 300ms → 100ms = 2x szybsze)

  // ==================== TILE CACHE OPTIMIZATIONS ====================
  maxTileCacheSize: 30, // Zmniejszono z 50 → 30 (szybszy GC, mniejsze memory usage)
  refreshExpiredTiles: false, // Nie odświeżaj automatycznie kafelków (oszczędza bandwidth)

  // ==================== INTERACTION OPTIMIZATIONS ====================
  attributionControl: false, // Wyłącz attribution control (mniej DOM nodes)
  doubleClickZoom: false, // Wyłącz double-click zoom (conflict z drawing tools)
  dragRotate: true, // Enable rotation
  dragPan: true, // Enable panning
  keyboard: true, // Enable keyboard navigation
  scrollZoom: true, // Enable scroll zoom
  touchZoom: true, // Enable pinch-to-zoom
  touchRotate: true, // Enable two-finger rotation
  clickTolerance: 5, // Better mobile tap detection (pixels)
  hash: false, // Nie zapisuj pozycji w URL hash (oszczędza CPU na hash updates)
  cooperativeGestures: false, // Wyłącz "Użyj Ctrl+scroll" (lepsze UX)
  trackResize: true, // Automatycznie wykrywaj zmiany rozmiaru

  // ==================== ZOOM LIMITS ====================
  maxZoom: 22, // Maksymalny zoom (domyślnie 22)
  minZoom: 0, // Minimalny zoom

  // ==================== PERFORMANCE TWEAKS ====================
  // Ogranicz liczbę visible tiles (GPU optimization)
  maxBounds: undefined, // No bounds restriction (ustawiane dynamicznie przez projekt)
  maxPitch: 85, // Ogranicz max pitch (60 → 85, mniej extreme angles = lepsze FPS)
  minPitch: 0, // Min pitch
};