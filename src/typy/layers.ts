export interface LayerNode {
  id: string;
  name: string;
  type: 'group' | 'layer' | 'RasterLayer' | 'VectorLayer' | 'WMSLayer';
  visible: boolean;
  opacity: number;
  children?: LayerNode[];
  childrenVisible?: boolean; // Is group expanded (UI state)
  color?: string;
  icon?: string;
  sourceType?: 'vector' | 'raster' | 'geojson' | 'wms';
  source?: any;
  paint?: any;
  layout?: any;
  extent?: [number, number, number, number]; // [minX, minY, maxX, maxY] from backend
}

export interface LayersState {
  layers: LayerNode[];
  expandedGroups: string[];
  activeLayerId?: string;
}

export const LayerIcons = {
  points: 'Place',
  buildings: 'Business',
  roads: 'Timeline',
  green: 'Park',
  water: 'Water',
  folder: 'Folder',
  layer: 'Layers',
} as const;

export type LayerIconType = keyof typeof LayerIcons;