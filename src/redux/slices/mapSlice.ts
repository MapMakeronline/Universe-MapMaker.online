import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapState, ViewState } from '@/types-app/map';

const initialState: MapState = {
  viewState: {
    longitude: 21.0122, // Warszawa
    latitude: 52.2297,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  },
  mapStyle: 'mapbox://styles/mapbox/streets-v12', // full3d uses streets-v12 + terrain + 3D
  mapStyleKey: 'full3d', // Default to Full 3D mode (Teren + Budynki)
  isLoaded: false,
  isFullscreen: false,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setViewState: (state, action: PayloadAction<Partial<ViewState>>) => {
      state.viewState = { ...state.viewState, ...action.payload };
    },
    setMapStyle: (state, action: PayloadAction<string | { url: string; key: string }>) => {
      if (typeof action.payload === 'string') {
        state.mapStyle = action.payload;
      } else {
        state.mapStyle = action.payload.url;
        state.mapStyleKey = action.payload.key;
      }
    },
    setMapLoaded: (state, action: PayloadAction<boolean>) => {
      state.isLoaded = action.payload;
    },
    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },
    flyToLocation: (state, action: PayloadAction<{ longitude: number; latitude: number; zoom?: number }>) => {
      const { longitude, latitude, zoom = 14 } = action.payload;
      state.viewState.longitude = longitude;
      state.viewState.latitude = latitude;
      state.viewState.zoom = zoom;
    },
  },
});

export const {
  setViewState,
  setMapStyle,
  setMapLoaded,
  setFullscreen,
  flyToLocation,
} = mapSlice.actions;

export default mapSlice.reducer;