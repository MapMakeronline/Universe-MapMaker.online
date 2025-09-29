import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapState, ViewState } from '@/types/map';

const initialState: MapState = {
  viewState: {
    longitude: 21.0122, // Warszawa
    latitude: 52.2297,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  },
  mapStyle: 'mapbox://styles/mapbox/streets-v12',
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
    setMapStyle: (state, action: PayloadAction<string>) => {
      state.mapStyle = action.payload;
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