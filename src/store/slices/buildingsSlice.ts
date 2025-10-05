import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BuildingAttribute {
  key: string;
  value: string | number;
}

export interface Building {
  id: string;
  name: string;
  coordinates: [number, number];
  attributes: BuildingAttribute[];
  selected?: boolean;
}

export interface BuildingsState {
  buildings: Record<string, Building>;
  selectedBuildingId: string | null;
  isAttributeModalOpen: boolean;
}

const initialState: BuildingsState = {
  buildings: {},
  selectedBuildingId: null,
  isAttributeModalOpen: false,
};

const buildingsSlice = createSlice({
  name: 'buildings',
  initialState,
  reducers: {
    addBuilding: (state, action: PayloadAction<Building>) => {
      state.buildings[action.payload.id] = action.payload;
    },
    updateBuilding: (state, action: PayloadAction<{ id: string; updates: Partial<Building> }>) => {
      const { id, updates } = action.payload;
      if (state.buildings[id]) {
        state.buildings[id] = { ...state.buildings[id], ...updates };
      }
    },
    deleteBuilding: (state, action: PayloadAction<string>) => {
      delete state.buildings[action.payload];
      if (state.selectedBuildingId === action.payload) {
        state.selectedBuildingId = null;
      }
    },
    selectBuilding: (state, action: PayloadAction<string | null>) => {
      // Deselect previous building
      if (state.selectedBuildingId && state.buildings[state.selectedBuildingId]) {
        state.buildings[state.selectedBuildingId].selected = false;
      }

      // Select new building
      state.selectedBuildingId = action.payload;
      if (action.payload && state.buildings[action.payload]) {
        state.buildings[action.payload].selected = true;
      }
    },
    updateBuildingAttribute: (state, action: PayloadAction<{ buildingId: string; attributeKey: string; value: string | number }>) => {
      const { buildingId, attributeKey, value } = action.payload;
      const building = state.buildings[buildingId];

      if (building) {
        const attrIndex = building.attributes.findIndex(attr => attr.key === attributeKey);
        if (attrIndex >= 0) {
          building.attributes[attrIndex].value = value;
        } else {
          building.attributes.push({ key: attributeKey, value });
        }
      }
    },
    addBuildingAttribute: (state, action: PayloadAction<{ buildingId: string; attribute: BuildingAttribute }>) => {
      const { buildingId, attribute } = action.payload;
      const building = state.buildings[buildingId];

      if (building) {
        building.attributes.push(attribute);
      }
    },
    deleteBuildingAttribute: (state, action: PayloadAction<{ buildingId: string; attributeKey: string }>) => {
      const { buildingId, attributeKey } = action.payload;
      const building = state.buildings[buildingId];

      if (building) {
        building.attributes = building.attributes.filter(attr => attr.key !== attributeKey);
      }
    },
    setAttributeModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAttributeModalOpen = action.payload;
    },
  },
});

export const {
  addBuilding,
  updateBuilding,
  deleteBuilding,
  selectBuilding,
  updateBuildingAttribute,
  addBuildingAttribute,
  deleteBuildingAttribute,
  setAttributeModalOpen,
} = buildingsSlice.actions;

export default buildingsSlice.reducer;
