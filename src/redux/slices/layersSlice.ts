import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LayersState, LayerNode } from '@/types-app/layers';

// Mock layers removed - projects start with empty layer tree
// Layers will be loaded from backend API per project

const initialState: LayersState = {
  layers: [], // Empty by default - loaded per project from backend
  expandedGroups: [],
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
    deleteLayer: (state, action: PayloadAction<string>) => {
      const deleteLayerRecursive = (layers: LayerNode[], targetId: string): LayerNode[] => {
        return layers.filter(layer => {
          if (layer.id === targetId) {
            return false; // Remove this layer
          }
          if (layer.children) {
            layer.children = deleteLayerRecursive(layer.children, targetId);
          }
          return true;
        });
      };

      state.layers = deleteLayerRecursive(state.layers, action.payload);

      // If the deleted layer was active, clear the active layer
      if (state.activeLayerId === action.payload) {
        state.activeLayerId = undefined;
      }

      // Remove from expanded groups if it was a group
      state.expandedGroups = state.expandedGroups.filter(id => id !== action.payload);
    },
    addDrawnLayer: (state, action: PayloadAction<{
      name: string;
      type: 'point' | 'line' | 'polygon';
      features: any[];
      color?: string;
    }>) => {
      const { name, type, features, color } = action.payload;

      const iconMap = {
        point: 'points' as const,
        line: 'lines' as const,
        polygon: 'polygon' as const,
      };

      const colorMap = {
        point: '#f44336',
        line: '#2196f3',
        polygon: '#4caf50',
      };

      const newLayer: LayerNode = {
        id: `drawn-${Date.now()}`,
        name,
        type: 'layer',
        visible: true,
        opacity: 1,
        color: color || colorMap[type],
        icon: iconMap[type],
        sourceType: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      };

      // Dodaj warstwę na początek listy (na górze drzewa)
      state.layers.unshift(newLayer);

      // Ustaw jako aktywną warstwę
      state.activeLayerId = newLayer.id;
    },
    // Load layers from backend (replaces current layers)
    loadLayers: (state, action: PayloadAction<LayerNode[]>) => {
      state.layers = action.payload;
      // Auto-expand all groups
      const expandedIds: string[] = [];
      const extractGroupIds = (layers: LayerNode[]) => {
        layers.forEach(layer => {
          if (layer.type === 'group') {
            expandedIds.push(layer.id);
            if (layer.children) {
              extractGroupIds(layer.children);
            }
          }
        });
      };
      extractGroupIds(action.payload);
      state.expandedGroups = expandedIds;
    },
    // Reset layers to empty (for switching projects)
    resetLayers: (state) => {
      state.layers = [];
      state.expandedGroups = [];
      state.activeLayerId = undefined;
    },

    // NEW: Move layer in hierarchy (for drag & drop)
    moveLayer: (state, action: PayloadAction<{
      layerId: string;
      targetId: string;
      position: 'before' | 'after' | 'inside';
    }>) => {
      const { layerId, targetId, position } = action.payload;

      // Helper: Find layer by ID and return path
      const findLayerPath = (layers: LayerNode[], id: string, path: number[] = []): number[] | null => {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].id === id) {
            return [...path, i];
          }
          if (layers[i].children) {
            const found = findLayerPath(layers[i].children!, id, [...path, i]);
            if (found) return found;
          }
        }
        return null;
      };

      // Helper: Remove layer at path
      const removeAtPath = (layers: LayerNode[], path: number[]): { layers: LayerNode[]; removed: LayerNode | null } => {
        if (path.length === 0) return { layers, removed: null };
        if (path.length === 1) {
          const removed = layers[path[0]];
          return {
            layers: layers.filter((_, i) => i !== path[0]),
            removed
          };
        }

        const newLayers = [...layers];
        let current: any = newLayers;
        for (let i = 0; i < path.length - 1; i++) {
          current[path[i]] = { ...current[path[i]], children: [...current[path[i]].children!] };
          current = current[path[i]].children!;
        }
        const removed = current[path[path.length - 1]];
        current.splice(path[path.length - 1], 1);
        return { layers: newLayers, removed };
      };

      // Helper: Insert layer at path
      const insertAtPath = (layers: LayerNode[], path: number[], layer: LayerNode, pos: 'before' | 'after' | 'inside'): LayerNode[] => {
        if (path.length === 0) {
          return pos === 'before' ? [layer, ...layers] : [...layers, layer];
        }

        const newLayers = [...layers];
        let current: any = newLayers;
        for (let i = 0; i < path.length - 1; i++) {
          current[path[i]] = { ...current[path[i]], children: [...current[path[i]].children!] };
          current = current[path[i]].children!;
        }

        const targetIndex = path[path.length - 1];
        if (pos === 'inside') {
          // Insert as child of target
          const target = current[targetIndex];
          current[targetIndex] = {
            ...target,
            children: target.children ? [...target.children, layer] : [layer]
          };
        } else if (pos === 'before') {
          current.splice(targetIndex, 0, layer);
        } else { // 'after'
          current.splice(targetIndex + 1, 0, layer);
        }

        return newLayers;
      };

      // Special case: Move to main level
      if (targetId === '__main_level__') {
        const layerPath = findLayerPath(state.layers, layerId);
        if (!layerPath) return;

        const { layers: afterRemoval, removed } = removeAtPath(state.layers, layerPath);
        if (!removed) return;

        state.layers = [...afterRemoval, removed]; // Add to end of main level
        return;
      }

      // Find paths
      const layerPath = findLayerPath(state.layers, layerId);
      const targetPath = findLayerPath(state.layers, targetId);

      if (!layerPath || !targetPath) return;

      // Remove layer
      const { layers: afterRemoval, removed } = removeAtPath(state.layers, layerPath);
      if (!removed) return;

      // Find new target path (after removal)
      const newTargetPath = findLayerPath(afterRemoval, targetId);
      if (!newTargetPath) return;

      // Insert at new position
      state.layers = insertAtPath(afterRemoval, newTargetPath, removed, position);
    },

    // NEW: Reorder entire hierarchy (for bulk operations)
    reorderLayers: (state, action: PayloadAction<LayerNode[]>) => {
      state.layers = action.payload;
    },

    // NEW: Toggle all layers visibility in a group (cascade)
    toggleGroupVisibilityCascade: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;

      const toggleGroup = (layers: LayerNode[]): boolean => {
        for (const layer of layers) {
          if (layer.id === groupId && layer.type === 'group') {
            const newVisibility = !layer.visible;
            layer.visible = newVisibility;

            // Cascade to all children
            const cascadeVisibility = (children: LayerNode[]) => {
              children.forEach(child => {
                child.visible = newVisibility;
                if (child.children) {
                  cascadeVisibility(child.children);
                }
              });
            };

            if (layer.children) {
              cascadeVisibility(layer.children);
            }
            return true;
          }
          if (layer.children && toggleGroup(layer.children)) {
            return true;
          }
        }
        return false;
      };

      toggleGroup(state.layers);
    },

    // NEW: Expand all groups
    expandAllGroups: (state) => {
      const expandedIds: string[] = [];
      const extractGroupIds = (layers: LayerNode[]) => {
        layers.forEach(layer => {
          if (layer.type === 'group') {
            expandedIds.push(layer.id);
            if (layer.children) {
              extractGroupIds(layer.children);
            }
          }
        });
      };
      extractGroupIds(state.layers);
      state.expandedGroups = expandedIds;
    },

    // NEW: Collapse all groups
    collapseAllGroups: (state) => {
      state.expandedGroups = [];
    },
  },
});

export const {
  toggleLayerVisibility,
  setLayerOpacity,
  toggleGroupExpanded,
  setActiveLayer,
  deleteLayer,
  addDrawnLayer,
  loadLayers,
  resetLayers,
  // NEW actions
  moveLayer,
  reorderLayers,
  toggleGroupVisibilityCascade,
  expandAllGroups,
  collapseAllGroups,
} = layersSlice.actions;

export default layersSlice.reducer;