import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import layersReducer from './slices/layersSlice';
import drawReducer from './slices/drawSlice';
import authReducer from './slices/authSlice';
import buildingsReducer from './slices/buildingsSlice';
import featuresReducer from './slices/featuresSlice';
import projectsReducer from './slices/projectsSlice';
import { projectsApi } from './api/projectsApi'; // Phase 3: RTK Query API
import { adminApi } from './api/adminApi'; // Admin API for user management

// Create a makeStore function for Next.js App Router
export const makeStore = () => {
  return configureStore({
    reducer: {
      map: mapReducer,
      layers: layersReducer,
      draw: drawReducer,
      auth: authReducer,
      buildings: buildingsReducer,
      features: featuresReducer,
      projects: projectsReducer,
      // Phase 3: RTK Query API reducer
      [projectsApi.reducerPath]: projectsApi.reducer,
      [adminApi.reducerPath]: adminApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignoruj nieserializowalne dane w Redux (np. funkcje z Mapbox)
          ignoredActions: ['map/setViewState'],
          ignoredPaths: ['map.mapInstance'],
        },
      })
        // Phase 3: Add RTK Query middleware for caching, invalidation, polling, etc.
        .concat(projectsApi.middleware)
        .concat(adminApi.middleware),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];