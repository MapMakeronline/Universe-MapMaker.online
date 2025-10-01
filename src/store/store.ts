import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import layersReducer from './slices/layersSlice';
import drawReducer from './slices/drawSlice';

export const store = configureStore({
  reducer: {
    map: mapReducer,
    layers: layersReducer,
    draw: drawReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;