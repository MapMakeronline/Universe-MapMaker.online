import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LayersState, LayerNode } from '@/types/layers';

const mockLayers: LayerNode[] = [
  {
    id: 'poi-group',
    name: 'Punkty POI',
    type: 'group',
    visible: true,
    opacity: 1,
    icon: 'folder',
    children: [
      {
        id: 'restaurants',
        name: 'Restauracje',
        type: 'layer',
        visible: true,
        opacity: 1,
        color: '#ff5722',
        icon: 'points',
        sourceType: 'vector',
      },
      {
        id: 'hotels',
        name: 'Hotele',
        type: 'layer',
        visible: false,
        opacity: 0.8,
        color: '#2196f3',
        icon: 'points',
        sourceType: 'vector',
      },
    ],
  },
  {
    id: 'buildings',
    name: 'Budynki',
    type: 'layer',
    visible: true,
    opacity: 0.7,
    color: '#9e9e9e',
    icon: 'buildings',
    sourceType: 'vector',
  },
  {
    id: 'infrastructure',
    name: 'Infrastruktura',
    type: 'group',
    visible: true,
    opacity: 1,
    icon: 'folder',
    children: [
      {
        id: 'roads',
        name: 'Drogi',
        type: 'layer',
        visible: true,
        opacity: 1,
        color: '#424242',
        icon: 'roads',
        sourceType: 'vector',
      },
      {
        id: 'railways',
        name: 'Koleje',
        type: 'layer',
        visible: false,
        opacity: 1,
        color: '#795548',
        icon: 'roads',
        sourceType: 'vector',
      },
    ],
  },
  {
    id: 'nature',
    name: 'Środowisko',
    type: 'group',
    visible: true,
    opacity: 1,
    icon: 'folder',
    children: [
      {
        id: 'green-areas',
        name: 'Tereny zielone',
        type: 'layer',
        visible: true,
        opacity: 0.6,
        color: '#4caf50',
        icon: 'green',
        sourceType: 'vector',
      },
      {
        id: 'water-bodies',
        name: 'Zbiorniki wodne',
        type: 'layer',
        visible: true,
        opacity: 0.8,
        color: '#2196f3',
        icon: 'water',
        sourceType: 'vector',
      },
    ],
  },
];

const initialState: LayersState = {
  layers: mockLayers,
  expandedGroups: ['poi-group', 'infrastructure', 'nature'],
  activeLayerId: undefined,
};

const layersSlice = createSlice({
  name: 'layers',
  initialState,
  reducers: {
    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const toggleLayer = (layers: LayerNode[]): boolean => {
        for (const layer of layers) {
          if (layer.id === action.payload) {
            layer.visible = !layer.visible;
            return true;
          }
          if (layer.children && toggleLayer(layer.children)) {
            return true;
          }
        }
        return false;
      };
      toggleLayer(state.layers);
    },
    setLayerOpacity: (state, action: PayloadAction<{ id: string; opacity: number }>) => {
      const setOpacity = (layers: LayerNode[]): boolean => {
        for (const layer of layers) {
          if (layer.id === action.payload.id) {
            layer.opacity = action.payload.opacity;
            return true;
          }
          if (layer.children && setOpacity(layer.children)) {
            return true;
          }
        }
        return false;
      };
      setOpacity(state.layers);
    },
    toggleGroupExpanded: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      if (state.expandedGroups.includes(groupId)) {
        state.expandedGroups = state.expandedGroups.filter(id => id !== groupId);
      } else {
        state.expandedGroups.push(groupId);
      }
    },
    setActiveLayer: (state, action: PayloadAction<string | undefined>) => {
      state.activeLayerId = action.payload;
    },
  },
});

export const {
  toggleLayerVisibility,
  setLayerOpacity,
  toggleGroupExpanded,
  setActiveLayer,
} = layersSlice.actions;

export default layersSlice.reducer;