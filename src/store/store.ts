import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import layersReducer from './slices/layersSlice';
import drawReducer from './slices/drawSlice';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import buildingsReducer from './slices/buildingsSlice';

export const store = configureStore({
  reducer: {
    map: mapReducer,
    layers: layersReducer,
    draw: drawReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
    buildings: buildingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignoruj nieserializowalne dane w Redux (np. funkcje z Mapbox)
        ignoredActions: ['map/setViewState'],
        ignoredPaths: ['map.mapInstance'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;