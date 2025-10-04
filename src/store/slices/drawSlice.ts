import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DrawState, MeasurementState, Measurement } from '@/types/geometry';
import { Feature, Geometry, GeoJsonProperties } from 'geojson';

const initialDrawState: DrawState = {
  mode: 'simple_select',
  isActive: false,
  features: [],
  selectedFeatureId: undefined,
};

const initialMeasurementState: MeasurementState = {
  isDistanceMode: false,
  isAreaMode: false,
  measurements: [],
  activePoints: [],
};

interface IdentifyState {
  isActive: boolean;
}

const initialIdentifyState: IdentifyState = {
  isActive: false,
};

interface DrawAndMeasureState {
  draw: DrawState;
  measurement: MeasurementState;
  identify: IdentifyState;
}

const initialState: DrawAndMeasureState = {
  draw: initialDrawState,
  measurement: initialMeasurementState,
  identify: initialIdentifyState,
};

const drawSlice = createSlice({
  name: 'draw',
  initialState,
  reducers: {
    // Draw actions
    setDrawMode: (state, action: PayloadAction<DrawState['mode']>) => {
      state.draw.mode = action.payload;
      state.draw.isActive = action.payload !== 'simple_select';
    },
    setDrawActive: (state, action: PayloadAction<boolean>) => {
      state.draw.isActive = action.payload;
      if (!action.payload) {
        state.draw.mode = 'simple_select';
      }
    },
    addDrawFeature: (state, action: PayloadAction<Feature<Geometry, GeoJsonProperties>>) => {
      state.draw.features.push(action.payload);
    },
    updateDrawFeature: (state, action: PayloadAction<Feature<Geometry, GeoJsonProperties>>) => {
      const index = state.draw.features.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.draw.features[index] = action.payload;
      }
    },
    removeDrawFeature: (state, action: PayloadAction<string>) => {
      state.draw.features = state.draw.features.filter(f => f.id !== action.payload);
      if (state.draw.selectedFeatureId === action.payload) {
        state.draw.selectedFeatureId = undefined;
      }
    },
    setSelectedFeature: (state, action: PayloadAction<string | undefined>) => {
      state.draw.selectedFeatureId = action.payload;
    },
    clearAllFeatures: (state) => {
      state.draw.features = [];
      state.draw.selectedFeatureId = undefined;
    },

    // Measurement actions
    setMeasurementMode: (state, action: PayloadAction<{ distance?: boolean; area?: boolean }>) => {
      state.measurement.isDistanceMode = action.payload.distance || false;
      state.measurement.isAreaMode = action.payload.area || false;
      if (action.payload.distance || action.payload.area) {
        state.measurement.activePoints = [];
      }
    },
    addMeasurementPoint: (state, action: PayloadAction<[number, number]>) => {
      state.measurement.activePoints.push(action.payload);
    },
    clearMeasurementPoints: (state) => {
      state.measurement.activePoints = [];
    },
    addMeasurement: (state, action: PayloadAction<Measurement>) => {
      state.measurement.measurements.push(action.payload);
    },
    removeMeasurement: (state, action: PayloadAction<string>) => {
      state.measurement.measurements = state.measurement.measurements.filter(m => m.id !== action.payload);
    },
    clearAllMeasurements: (state) => {
      state.measurement.measurements = [];
      state.measurement.activePoints = [];
    },

    // Identify actions
    setIdentifyMode: (state, action: PayloadAction<boolean>) => {
      state.identify.isActive = action.payload;
    },
  },
});

export const {
  setDrawMode,
  setDrawActive,
  addDrawFeature,
  updateDrawFeature,
  removeDrawFeature,
  setSelectedFeature,
  clearAllFeatures,
  setMeasurementMode,
  addMeasurementPoint,
  clearMeasurementPoints,
  addMeasurement,
  removeMeasurement,
  clearAllMeasurements,
  setIdentifyMode,
} = drawSlice.actions;

export default drawSlice.reducer;