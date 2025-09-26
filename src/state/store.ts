import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistStore, persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage"
import { api } from "./services/api"
import { uiSlice } from "./slices/uiSlice"
import { layersSlice } from "./slices/layersSlice"
import { parcelsSlice } from "./slices/parcelsSlice"
import { measurementSlice } from "./slices/measurementSlice"

// Configure persistence for specific slices only
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["ui", "layers"], // Only persist UI state and layers
  blacklist: ["api", "parcels", "measurement"], // Don't persist heavy data or temporary state
}

const rootReducer = combineReducers({
  ui: uiSlice.reducer,
  layers: layersSlice.reducer,
  parcels: parcelsSlice.reducer,
  measurement: measurementSlice.reducer,
  [api.reducerPath]: api.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/FLUSH",
        ],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["_persist"],
      },
    }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== "production",
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
