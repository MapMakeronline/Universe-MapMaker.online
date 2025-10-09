import { MapStyles } from '@/typy/map';

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
  streets: {
    name: 'Ulice',
    style: 'mapbox://styles/mapbox/streets-v12',
  },
  satellite: {
    name: 'Satelita',
    style: 'mapbox://styles/mapbox/satellite-v9',
  },
  outdoors: {
    name: 'Outdoor',
    style: 'mapbox://styles/mapbox/outdoors-v12',
  },
  light: {
    name: 'Jasny',
    style: 'mapbox://styles/mapbox/light-v11',
  },
  dark: {
    name: 'Ciemny',
    style: 'mapbox://styles/mapbox/dark-v11',
  },
  buildings3d: {
    name: '3D Budynki',
    style: 'mapbox://styles/mapbox/streets-v12',
    enable3D: true,
  },
  full3d: {
    name: '3D Pełny (Teren + Budynki)',
    style: 'mapbox://styles/mapbox/streets-v12',
    enable3D: true,
    enableTerrain: true,
    enableSky: true,
  },
};

export const MAP_CONFIG = {
  antialias: false, // Wyłącz antialiasing dla lepszej wydajności
  attributionControl: false,
  doubleClickZoom: false,
  dragRotate: true,
  dragPan: true,
  keyboard: true,
  scrollZoom: true,
  touchZoom: true,
  touchRotate: true,
  clickTolerance: 5, // Better mobile tap detection (pixels)
  preserveDrawingBuffer: false, // Lepsze FPS
  refreshExpiredTiles: false, // Nie odświeżaj automatycznie kafelków
  renderWorldCopies: false, // Nie renderuj duplikatów świata
  maxTileCacheSize: 50, // Mniejszy cache dla szybszego GC
  fadeDuration: 150, // Skróć czas fade animacji (domyślnie 300ms)
};