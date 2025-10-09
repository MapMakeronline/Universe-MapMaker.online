import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import layersReducer from './slices/layersSlice';
import drawReducer from './slices/drawSlice';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import buildingsReducer from './slices/buildingsSlice';
import featuresReducer from './slices/featuresSlice';
import projectsReducer from './slices/projectsSlice';

// Create a makeStore function for Next.js App Router
export const makeStore = () => {
  return configureStore({
    reducer: {
      map: mapReducer,
      layers: layersReducer,
      draw: drawReducer,
      auth: authReducer,
      dashboard: dashboardReducer,
      buildings: buildingsReducer,
      features: featuresReducer,
      projects: projectsReducer,
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
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];