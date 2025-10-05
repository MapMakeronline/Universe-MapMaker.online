import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Universal Features Slice - manages ALL editable map features
 * Supports: 3D buildings, POI, layers, custom points, etc.
 */

export interface FeatureAttribute {
  key: string;
  value: string | number;
}

export interface MapFeature {
  id: string;
  type: 'building' | 'poi' | 'point' | 'line' | 'polygon' | 'layer' | 'custom';
  name: string;
  layer?: string; // Source layer name
  sourceLayer?: string; // Mapbox source layer
  coordinates: [number, number]; // Center point
  geometry?: any; // Full GeoJSON geometry
  attributes: FeatureAttribute[];
  selected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturesState {
  features: Record<string, MapFeature>; // Key = feature ID
  selectedFeatureId: string | null;
  isAttributeModalOpen: boolean;
  filterType: 'all' | 'building' | 'poi' | 'point' | 'line' | 'polygon' | 'layer' | 'custom';
}

const initialState: FeaturesState = {
  features: {},
  selectedFeatureId: null,
  isAttributeModalOpen: false,
  filterType: 'all',
};

const featuresSlice = createSlice({
  name: 'features',
  initialState,
  reducers: {
    addFeature: (state, action: PayloadAction<MapFeature>) => {
      const feature = {
        ...action.payload,
        createdAt: action.payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.features[feature.id] = feature;
    },

    updateFeature: (state, action: PayloadAction<{ id: string; updates: Partial<MapFeature> }>) => {
      const { id, updates } = action.payload;
      if (state.features[id]) {
        state.features[id] = {
          ...state.features[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    deleteFeature: (state, action: PayloadAction<string>) => {
      delete state.features[action.payload];
      if (state.selectedFeatureId === action.payload) {
        state.selectedFeatureId = null;
      }
    },

    selectFeature: (state, action: PayloadAction<string | null>) => {
      // Deselect previous feature
      if (state.selectedFeatureId && state.features[state.selectedFeatureId]) {
        state.features[state.selectedFeatureId].selected = false;
      }

      // Select new feature
      state.selectedFeatureId = action.payload;
      if (action.payload && state.features[action.payload]) {
        state.features[action.payload].selected = true;
      }
    },

    updateFeatureAttribute: (state, action: PayloadAction<{
      featureId: string;
      attributeKey: string;
      value: string | number
    }>) => {
      const { featureId, attributeKey, value } = action.payload;
      const feature = state.features[featureId];

      if (feature) {
        const attrIndex = feature.attributes.findIndex(attr => attr.key === attributeKey);
        if (attrIndex >= 0) {
          feature.attributes[attrIndex].value = value;
        } else {
          feature.attributes.push({ key: attributeKey, value });
        }
        feature.updatedAt = new Date().toISOString();
      }
    },

    addFeatureAttribute: (state, action: PayloadAction<{
      featureId: string;
      attribute: FeatureAttribute
    }>) => {
      const { featureId, attribute } = action.payload;
      const feature = state.features[featureId];

      if (feature) {
        feature.attributes.push(attribute);
        feature.updatedAt = new Date().toISOString();
      }
    },

    deleteFeatureAttribute: (state, action: PayloadAction<{
      featureId: string;
      attributeKey: string
    }>) => {
      const { featureId, attributeKey } = action.payload;
      const feature = state.features[featureId];

      if (feature) {
        feature.attributes = feature.attributes.filter(attr => attr.key !== attributeKey);
        feature.updatedAt = new Date().toISOString();
      }
    },

    setAttributeModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAttributeModalOpen = action.payload;
    },

    setFilterType: (state, action: PayloadAction<FeaturesState['filterType']>) => {
      state.filterType = action.payload;
    },

    // Batch operations
    importFeatures: (state, action: PayloadAction<MapFeature[]>) => {
      action.payload.forEach(feature => {
        state.features[feature.id] = {
          ...feature,
          createdAt: feature.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    },

    clearAllFeatures: (state) => {
      state.features = {};
      state.selectedFeatureId = null;
    },

    clearFeaturesByType: (state, action: PayloadAction<MapFeature['type']>) => {
      Object.keys(state.features).forEach(id => {
        if (state.features[id].type === action.payload) {
          delete state.features[id];
        }
      });
    },
  },
});

export const {
  addFeature,
  updateFeature,
  deleteFeature,
  selectFeature,
  updateFeatureAttribute,
  addFeatureAttribute,
  deleteFeatureAttribute,
  setAttributeModalOpen,
  setFilterType,
  importFeatures,
  clearAllFeatures,
  clearFeaturesByType,
} = featuresSlice.actions;

export default featuresSlice.reducer;
