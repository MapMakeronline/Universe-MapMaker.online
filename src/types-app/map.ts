export interface MapState {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    bearing: number;
    pitch: number;
  };
  mapStyle: string;
  mapStyleKey?: string; // Key to identify style in MAP_STYLES (e.g., 'full3d', 'buildings3d')
  isLoaded: boolean;
  isFullscreen: boolean;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center: {
    longitude: number;
    latitude: number;
  };
}

export interface MapStyles {
  [key: string]: {
    name: string;
    style: string;
    preview?: string;
    enable3D?: boolean;
    enableTerrain?: boolean;
    enableSky?: boolean;
    enableOSMBuildings?: boolean; // Włącz szczegółowe budynki z OSM
    enableEnhanced3D?: boolean; // Włącz ulepszone 3D (drzewa + tekstury)
    description?: string; // Opis stylu mapy
    initialBounds?: MapBounds; // Początkowy obszar do wyświetlenia
  };
}

export interface MarkerData {
  id: string;
  longitude: number;
  latitude: number;
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
}