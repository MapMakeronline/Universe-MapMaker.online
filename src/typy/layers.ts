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
  sourceType?: 'vector' | 'raster' | 'geojson' | 'wms' | 'wfs' | 'qgis-wms' | 'qgis-wfs';
  source?: any;
  paint?: any;
  layout?: any;
  extent?: [number, number, number, number]; // [minX, minY, maxX, maxY] from backend

  // ==================== QGIS INTEGRATION ====================
  /**
   * Layer type for backend integration
   * - 'mapbox': Standard Mapbox layers (vector, raster, geojson)
   * - 'qgis-wms': WMS layer from QGIS Server (raster tiles)
   * - 'qgis-wfs': WFS layer from QGIS Server (vector GeoJSON)
   */
  layerType?: 'mapbox' | 'qgis-wms' | 'qgis-wfs';

  /**
   * Project name (for QGIS layers)
   * Used to construct WMS/WFS requests
   */
  projectName?: string;

  /**
   * QGIS layer styling (for WFS layers)
   */
  qgisStyle?: {
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
  };

  /**
   * Feature limit for WFS layers (default: 1000)
   */
  maxFeatures?: number;

  /**
   * Geometry type (from tree.json)
   * Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
   */
  geometry?: string;

  /**
   * Data source for geojson layers (inline data)
   */
  data?: any;
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