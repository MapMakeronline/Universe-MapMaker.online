/**
 * QGIS Project Layer Types
 *
 * Types for QGIS project tree.json structure from backend
 * Endpoint: GET /api/projects/new/json?project={project_name}
 */

/** Vector layer type from QGIS */
export interface QGISVectorLayer {
  name: string;
  id: string;
  visible: boolean;
  consultations: boolean;
  public: boolean;
  inspire: boolean;
  app: boolean;
  app_confirmed: boolean;
  excluded_columns: boolean;
  parent: string;
  key_column_name: string;
  published: boolean;
  extent: [number, number, number, number]; // [minX, minY, maxX, maxY]
  scale: number | null;
  geometry: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  type: 'VectorLayer';
  labeling:
    | ''
    | {
        textColor: [number, number, number, number]; // [R, G, B, A]
        fontSize: number;
        scaleMin: number;
        scaleMax: number;
        fieldName: string;
      };
  opacity: number; // 0-255
}

/** Raster layer type from QGIS */
export interface QGISRasterLayer {
  name: string;
  id: string;
  visible: boolean;
  consultations: boolean;
  public: boolean;
  inspire: boolean;
  app: boolean;
  app_confirmed: boolean;
  excluded_columns: boolean;
  parent: string;
  key_column_name: string;
  published: boolean;
  extent: number[]; // Can be empty for raster layers
  type: 'RasterLayer';
  scale: {
    large: boolean;
    hasScaleBasedVisibility: boolean;
    maximumScale: number;
    minimumScale: number;
  };
  opacity: number; // 0-255
}

/** Group layer type (folder) from QGIS */
export interface QGISGroupLayer {
  name: string;
  childrenVisible: boolean;
  visible: boolean;
  type: 'group';
  parent: string;
  app: boolean;
  inspire: boolean;
  app_confirmed: boolean;
  extent: number[];
  children: QGISLayerNode[];
}

/** Union type for all QGIS layer types */
export type QGISLayerNode = QGISVectorLayer | QGISRasterLayer | QGISGroupLayer;

/** Root structure of tree.json */
export interface QGISProjectTree {
  children: QGISLayerNode[];
}

/** Helper type guard functions */
export function isVectorLayer(node: QGISLayerNode): node is QGISVectorLayer {
  return node.type === 'VectorLayer';
}

export function isRasterLayer(node: QGISLayerNode): node is QGISRasterLayer {
  return node.type === 'RasterLayer';
}

export function isGroupLayer(node: QGISLayerNode): node is QGISGroupLayer {
  return node.type === 'group';
}

/** WMS/WFS layer configuration for rendering */
export interface QGISLayerConfig {
  id: string;
  name: string;
  type: 'wms' | 'wfs' | 'raster';
  visible: boolean;
  opacity: number;
  extent?: [number, number, number, number];
  geometry?: string;
  projectName: string;
  layerId: string;
}
