import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import layersReducer from './slices/layersSlice';
import drawReducer from './slices/drawSlice';
import authReducer from './slices/authSlice';
import featuresReducer from './slices/featuresSlice';
import projectsReducer from './slices/projectsSlice';
import notificationReducer from './slices/notificationSlice';
import loadingReducer from './slices/loadingSlice';

// NEW: Single baseApi for all backend communication (RTK Query)
import { baseApi } from '@/backend';

// Create a makeStore function for Next.js App Router
export const makeStore = () => {
  return configureStore({
    reducer: {
      map: mapReducer,
      layers: layersReducer,
      draw: drawReducer,
      auth: authReducer,
      features: featuresReducer,
      projects: projectsReducer,
      notification: notificationReducer,
      loading: loadingReducer,

      // NEW: Single baseApi (all modules: auth, projects, layers, users)
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignoruj nieserializowalne dane w Redux (np. funkcje z Mapbox, Blob z API)
          ignoredActions: [
            'map/setViewState',
            'layersApi/executeQuery/fulfilled', // exportStyle Blob response
            'layersApi/executeMutation/fulfilled', // exportLayer Blob response
          ],
          ignoredPaths: [
            'map.mapInstance',
            'layersApi.queries', // Ignore all layersApi query cache (Blob responses)
          ],
        },
      })
        // NEW: Single baseApi middleware (handles all modules)
        .concat(baseApi.middleware),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];