import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { createSelector } from "reselect"
import type { RootState } from "../store"
import type { Geometry } from "geojson"

export interface MeasurementState {
  mode: "none" | "distance" | "area" | "bearing"
  isActive: boolean
  result: number
  unit: "metric" | "imperial"
  geometry?: Geometry
  coordinates: [number, number][]
  snapToFeatures: boolean
  snapTolerance: number
  history: Array<{
    id: string
    type: "distance" | "area" | "bearing"
    result: number
    unit: string
    geometry: Geometry
    timestamp: number
  }>
}

const initialState: MeasurementState = {
  mode: "none",
  isActive: false,
  result: 0,
  unit: "metric",
  coordinates: [],
  snapToFeatures: false,
  snapTolerance: 10, // pixels
  history: [],
}

export const measurementSlice = createSlice({
  name: "measurement",
  initialState,
  reducers: {
    setMeasurementMode: (state, action: PayloadAction<MeasurementState["mode"]>) => {
      state.mode = action.payload
      state.isActive = action.payload !== "none"
      if (action.payload === "none") {
        state.coordinates = []
        state.result = 0
        state.geometry = undefined
      }
    },
    setMeasurementActive: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload
      if (!action.payload) {
        state.coordinates = []
        state.result = 0
        state.geometry = undefined
      }
    },
    addMeasurementPoint: (state, action: PayloadAction<[number, number]>) => {
      state.coordinates.push(action.payload)
    },
    removeMeasurementPoint: (state, action: PayloadAction<number>) => {
      state.coordinates.splice(action.payload, 1)
    },
    updateMeasurementPoint: (state, action: PayloadAction<{ index: number; coordinates: [number, number] }>) => {
      const { index, coordinates } = action.payload
      if (index >= 0 && index < state.coordinates.length) {
        state.coordinates[index] = coordinates
      }
    },
    setMeasurementResult: (state, action: PayloadAction<{ result: number; geometry?: Geometry }>) => {
      state.result = action.payload.result
      state.geometry = action.payload.geometry
    },
    setMeasurementUnit: (state, action: PayloadAction<MeasurementState["unit"]>) => {
      state.unit = action.payload
    },
    setSnapToFeatures: (state, action: PayloadAction<boolean>) => {
      state.snapToFeatures = action.payload
    },
    setSnapTolerance: (state, action: PayloadAction<number>) => {
      state.snapTolerance = Math.max(1, Math.min(50, action.payload))
    },
    clearMeasurement: (state) => {
      state.coordinates = []
      state.result = 0
      state.geometry = undefined
    },
    saveMeasurementToHistory: (state) => {
      if (state.result > 0 && state.geometry && state.mode !== "none") {
        const measurement = {
          id: Date.now().toString(),
          type: state.mode as "distance" | "area" | "bearing",
          result: state.result,
          unit: state.unit,
          geometry: state.geometry,
          timestamp: Date.now(),
        }
        state.history.unshift(measurement)
        // Keep only last 50 measurements
        if (state.history.length > 50) {
          state.history = state.history.slice(0, 50)
        }
      }
    },
    removeMeasurementFromHistory: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter((m) => m.id !== action.payload)
    },
    clearMeasurementHistory: (state) => {
      state.history = []
    },
  },
})

export const {
  setMeasurementMode,
  setMeasurementActive,
  addMeasurementPoint,
  removeMeasurementPoint,
  updateMeasurementPoint,
  setMeasurementResult,
  setMeasurementUnit,
  setSnapToFeatures,
  setSnapTolerance,
  clearMeasurement,
  saveMeasurementToHistory,
  removeMeasurementFromHistory,
  clearMeasurementHistory,
} = measurementSlice.actions

// Memoized selectors
export const selectMeasurement = (state: RootState) => state.measurement
export const selectMeasurementMode = createSelector(selectMeasurement, (measurement) => measurement.mode)
export const selectMeasurementActive = createSelector(selectMeasurement, (measurement) => measurement.isActive)
export const selectMeasurementResult = createSelector(selectMeasurement, (measurement) => measurement.result)
export const selectMeasurementUnit = createSelector(selectMeasurement, (measurement) => measurement.unit)
export const selectMeasurementCoordinates = createSelector(selectMeasurement, (measurement) => measurement.coordinates)
export const selectMeasurementGeometry = createSelector(selectMeasurement, (measurement) => measurement.geometry)
export const selectMeasurementHistory = createSelector(selectMeasurement, (measurement) => measurement.history)
export const selectSnapToFeatures = createSelector(selectMeasurement, (measurement) => measurement.snapToFeatures)
export const selectSnapTolerance = createSelector(selectMeasurement, (measurement) => measurement.snapTolerance)

export const selectFormattedMeasurementResult = createSelector(
  [selectMeasurementResult, selectMeasurementUnit, selectMeasurementMode],
  (result, unit, mode) => {
    if (result === 0) return ""

    switch (mode) {
      case "distance":
        if (unit === "metric") {
          return result < 1000 ? `${result.toFixed(2)} m` : `${(result / 1000).toFixed(2)} km`
        } else {
          const feet = result * 3.28084
          return feet < 5280 ? `${feet.toFixed(2)} ft` : `${(feet / 5280).toFixed(2)} mi`
        }
      case "area":
        if (unit === "metric") {
          return result < 10000 ? `${result.toFixed(2)} m²` : `${(result / 10000).toFixed(2)} ha`
        } else {
          const sqFeet = result * 10.7639
          return sqFeet < 43560 ? `${sqFeet.toFixed(2)} ft²` : `${(sqFeet / 43560).toFixed(2)} acres`
        }
      case "bearing":
        return `${result.toFixed(1)}°`
      default:
        return result.toString()
    }
  },
)
