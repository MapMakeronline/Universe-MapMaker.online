export interface MapState {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    bearing: number;
    pitch: number;
  };
  mapStyle: string;
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

export interface MapStyles {
  [key: string]: {
    name: string;
    style: string;
    preview?: string;
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