export interface LayerNode {
  id: string;
  name: string;
  type: 'group' | 'layer';
  visible: boolean;
  opacity: number;
  children?: LayerNode[];
  color?: string;
  icon?: string;
  sourceType?: 'vector' | 'raster' | 'geojson';
  source?: any;
  paint?: any;
  layout?: any;
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