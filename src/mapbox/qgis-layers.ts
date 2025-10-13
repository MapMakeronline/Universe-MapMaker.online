/**
 * QGIS Server Integration (WMS/WFS)
 *
 * Provides utilities for adding QGIS Server layers to Mapbox GL JS
 * Supports:
 * - WMS (Web Map Service) - Raster tiles from QGIS Server
 * - WFS (Web Feature Service) - Vector features as GeoJSON
 *
 * QGIS Server Endpoint: https://api.universemapmaker.online/ows
 *
 * Based on QGIS Server docs:
 * - https://docs.qgis.org/3.34/en/docs/server_manual/services.html
 */

import mapboxgl from 'mapbox-gl';
import { mapLogger } from '@/narzedzia/logger';

/**
 * QGIS Server base URL
 */
const QGIS_SERVER_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/ows`
  : 'https://api.universemapmaker.online/ows';

/**
 * Options for adding WMS layer
 */
export interface WMSLayerOptions {
  /** Layer name from QGIS project */
  layerName: string;
  /** Project name (used in QGIS Server MAP parameter) */
  projectName: string;
  /** Layer opacity (0-1) */
  opacity?: number;
  /** Visible by default */
  visible?: boolean;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** CRS/EPSG code (default: EPSG:3857) */
  crs?: string;
}

/**
 * Options for adding WFS layer
 */
export interface WFSLayerOptions {
  /** Layer name from QGIS project */
  layerName: string;
  /** Project name (used in QGIS Server MAP parameter) */
  projectName: string;
  /** Layer opacity (0-1) */
  opacity?: number;
  /** Visible by default */
  visible?: boolean;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Feature limit (default: 1000) */
  maxFeatures?: number;
  /** CRS/EPSG code (default: EPSG:4326 for GeoJSON) */
  crs?: string;
  /** Layer style (fill color, stroke, etc.) */
  style?: {
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
  };
}

/**
 * Add WMS layer from QGIS Server
 *
 * WMS (Web Map Service) renders raster tiles on the server.
 * Use this for:
 * - Complex styled layers (SLD, QML)
 * - Large datasets (thousands of features)
 * - Raster data (orthophotos, elevation)
 *
 * Example:
 * ```ts
 * addWMSLayer(map, {
 *   layerName: 'buildings',
 *   projectName: 'MyProject_1',
 *   opacity: 0.8,
 *   visible: true
 * });
 * ```
 *
 * @param map Mapbox GL JS map instance
 * @param options WMS layer options
 * @returns Source ID and layer ID for future reference
 */
export function addWMSLayer(
  map: mapboxgl.Map,
  options: WMSLayerOptions
): { sourceId: string; layerId: string } | null {
  const {
    layerName,
    projectName,
    opacity = 1,
    visible = true,
    minZoom = 0,
    maxZoom = 22,
    crs = 'EPSG:3857'
  } = options;

  try {
    const sourceId = `qgis-wms-${projectName}-${layerName}`;
    const layerId = `qgis-wms-layer-${projectName}-${layerName}`;

    // Check if source already exists
    if (map.getSource(sourceId)) {
      mapLogger.warn(`WMS source already exists: ${sourceId}`);
      return { sourceId, layerId };
    }

    // WMS GetMap URL template
    // QGIS Server expects:
    // - SERVICE=WMS
    // - VERSION=1.3.0 (or 1.1.1)
    // - REQUEST=GetMap
    // - LAYERS=layer_name
    // - WIDTH=256
    // - HEIGHT=256
    // - CRS=EPSG:3857
    // - BBOX=minx,miny,maxx,maxy (in CRS units)
    // - FORMAT=image/png
    // - TRANSPARENT=true
    // - MAP=/path/to/project.qgs (or project name if configured)
    const wmsUrl = `${QGIS_SERVER_URL}?` +
      `SERVICE=WMS&` +
      `VERSION=1.3.0&` +
      `REQUEST=GetMap&` +
      `LAYERS=${encodeURIComponent(layerName)}&` +
      `WIDTH=256&` +
      `HEIGHT=256&` +
      `CRS=${crs}&` +
      `BBOX={bbox-epsg-3857}&` + // Mapbox will replace this with actual bbox
      `FORMAT=image/png&` +
      `TRANSPARENT=true&` +
      `MAP=${encodeURIComponent(projectName)}/${encodeURIComponent(projectName)}.qgs`; // Full path to QGS file

    mapLogger.log(`📍 Adding WMS layer: ${layerName} from project ${projectName}`);
    mapLogger.log(`   URL template: ${wmsUrl.substring(0, 150)}...`);

    // Add raster source
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [wmsUrl],
      tileSize: 256,
      minzoom: minZoom,
      maxzoom: maxZoom,
    });

    // Add raster layer
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': opacity,
      },
      layout: {
        visibility: visible ? 'visible' : 'none',
      },
    });

    mapLogger.log(`✅ WMS layer added: ${layerId}`);
    return { sourceId, layerId };
  } catch (error) {
    mapLogger.error(`❌ Failed to add WMS layer ${layerName}:`, error);
    return null;
  }
}

/**
 * Add WFS layer from QGIS Server
 *
 * WFS (Web Feature Service) returns vector features as GeoJSON.
 * Use this for:
 * - Interactive features (click, hover)
 * - Client-side styling
 * - Small to medium datasets (< 10,000 features)
 * - Real-time data updates
 *
 * Example:
 * ```ts
 * addWFSLayer(map, {
 *   layerName: 'points_of_interest',
 *   projectName: 'MyProject_1',
 *   maxFeatures: 500,
 *   style: {
 *     fillColor: '#f75e4c',
 *     fillOpacity: 0.6,
 *     strokeColor: '#ffffff',
 *     strokeWidth: 2
 *   }
 * });
 * ```
 *
 * @param map Mapbox GL JS map instance
 * @param options WFS layer options
 * @returns Promise resolving to source ID and layer ID
 */
export async function addWFSLayer(
  map: mapboxgl.Map,
  options: WFSLayerOptions
): Promise<{ sourceId: string; layerId: string } | null> {
  const {
    layerName,
    projectName,
    opacity = 1,
    visible = true,
    minZoom = 0,
    maxZoom = 22,
    maxFeatures = 1000,
    crs = 'EPSG:4326', // GeoJSON uses WGS84
    style = {}
  } = options;

  try {
    const sourceId = `qgis-wfs-${projectName}-${layerName}`;
    const layerId = `qgis-wfs-layer-${projectName}-${layerName}`;

    // Check if source already exists
    if (map.getSource(sourceId)) {
      mapLogger.warn(`WFS source already exists: ${sourceId}`);
      return { sourceId, layerId };
    }

    // WFS GetFeature URL
    // QGIS Server expects:
    // - SERVICE=WFS
    // - VERSION=1.1.0 (or 2.0.0)
    // - REQUEST=GetFeature
    // - TYPENAME=layer_name
    // - OUTPUTFORMAT=application/json (or geojson)
    // - SRSNAME=EPSG:4326 (for GeoJSON)
    // - MAXFEATURES=1000
    // - MAP=/path/to/project.qgs (or project name)
    const wfsUrl = `${QGIS_SERVER_URL}?` +
      `SERVICE=WFS&` +
      `VERSION=1.1.0&` +
      `REQUEST=GetFeature&` +
      `TYPENAME=${encodeURIComponent(layerName)}&` +
      `OUTPUTFORMAT=application/json&` +
      `SRSNAME=${crs}&` +
      `MAXFEATURES=${maxFeatures}&` +
      `MAP=${encodeURIComponent(projectName)}/${encodeURIComponent(projectName)}.qgs`;

    mapLogger.log(`📍 Fetching WFS layer: ${layerName} from project ${projectName}`);
    mapLogger.log(`   URL: ${wfsUrl}`);

    // Fetch GeoJSON data from QGIS Server
    const response = await fetch(wfsUrl);

    if (!response.ok) {
      throw new Error(`WFS request failed: ${response.status} ${response.statusText}`);
    }

    const geojson = await response.json();

    mapLogger.log(`✅ WFS data fetched: ${geojson.features?.length || 0} features`);

    // Add GeoJSON source
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
    });

    // Determine geometry type from first feature
    const firstFeature = geojson.features?.[0];
    const geometryType = firstFeature?.geometry?.type;

    mapLogger.log(`   Geometry type: ${geometryType}`);

    // Add appropriate layer based on geometry type
    if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      // Circle layer for points
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': style.fillColor || '#f75e4c',
          'circle-opacity': style.fillOpacity !== undefined ? style.fillOpacity : opacity,
          'circle-radius': 6,
          'circle-stroke-color': style.strokeColor || '#ffffff',
          'circle-stroke-width': style.strokeWidth || 2,
          'circle-stroke-opacity': style.strokeOpacity !== undefined ? style.strokeOpacity : 1,
        },
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      // Line layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': style.strokeColor || '#f75e4c',
          'line-width': style.strokeWidth || 3,
          'line-opacity': style.strokeOpacity !== undefined ? style.strokeOpacity : opacity,
        },
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      // Polygon fill + stroke
      map.addLayer({
        id: `${layerId}-fill`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': style.fillColor || '#f75e4c',
          'fill-opacity': style.fillOpacity !== undefined ? style.fillOpacity : opacity * 0.5,
        },
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        minzoom: minZoom,
        maxzoom: maxZoom,
      });

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': style.strokeColor || '#ffffff',
          'line-width': style.strokeWidth || 2,
          'line-opacity': style.strokeOpacity !== undefined ? style.strokeOpacity : 1,
        },
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    }

    mapLogger.log(`✅ WFS layer added: ${layerId}`);
    return { sourceId, layerId };
  } catch (error) {
    mapLogger.error(`❌ Failed to add WFS layer ${layerName}:`, error);
    return null;
  }
}

/**
 * Remove QGIS layer (WMS or WFS)
 *
 * @param map Mapbox GL JS map instance
 * @param layerId Layer ID to remove
 */
export function removeQGISLayer(map: mapboxgl.Map, layerId: string): boolean {
  try {
    // Remove layer
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
      mapLogger.log(`🗑️ Removed layer: ${layerId}`);
    }

    // For polygon layers, also remove fill layer
    const fillLayerId = `${layerId}-fill`;
    if (map.getLayer(fillLayerId)) {
      map.removeLayer(fillLayerId);
      mapLogger.log(`🗑️ Removed fill layer: ${fillLayerId}`);
    }

    // Extract source ID from layer ID
    const sourceId = layerId.replace('qgis-wms-layer-', 'qgis-wms-')
                            .replace('qgis-wfs-layer-', 'qgis-wfs-');

    // Remove source if no other layers use it
    if (map.getSource(sourceId)) {
      const layers = map.getStyle()?.layers || [];
      const otherLayersUsingSource = layers.some(layer =>
        'source' in layer && layer.source === sourceId && layer.id !== layerId
      );

      if (!otherLayersUsingSource) {
        map.removeSource(sourceId);
        mapLogger.log(`🗑️ Removed source: ${sourceId}`);
      }
    }

    return true;
  } catch (error) {
    mapLogger.error(`❌ Failed to remove QGIS layer ${layerId}:`, error);
    return false;
  }
}

/**
 * Update QGIS layer visibility
 *
 * @param map Mapbox GL JS map instance
 * @param layerId Layer ID
 * @param visible Visibility state
 */
export function updateQGISLayerVisibility(
  map: mapboxgl.Map,
  layerId: string,
  visible: boolean
): boolean {
  try {
    const visibility = visible ? 'visible' : 'none';

    // Update main layer
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }

    // Update fill layer if exists (for polygons)
    const fillLayerId = `${layerId}-fill`;
    if (map.getLayer(fillLayerId)) {
      map.setLayoutProperty(fillLayerId, 'visibility', visibility);
    }

    mapLogger.log(`👁️ Updated visibility for ${layerId}: ${visibility}`);
    return true;
  } catch (error) {
    mapLogger.error(`❌ Failed to update visibility for ${layerId}:`, error);
    return false;
  }
}

/**
 * Update QGIS layer opacity
 *
 * @param map Mapbox GL JS map instance
 * @param layerId Layer ID
 * @param opacity Opacity value (0-1)
 */
export function updateQGISLayerOpacity(
  map: mapboxgl.Map,
  layerId: string,
  opacity: number
): boolean {
  try {
    const layer = map.getLayer(layerId);
    if (!layer) {
      mapLogger.warn(`Layer not found: ${layerId}`);
      return false;
    }

    // Update opacity based on layer type
    if (layer.type === 'raster') {
      map.setPaintProperty(layerId, 'raster-opacity', opacity);
    } else if (layer.type === 'circle') {
      map.setPaintProperty(layerId, 'circle-opacity', opacity);
    } else if (layer.type === 'line') {
      map.setPaintProperty(layerId, 'line-opacity', opacity);
    } else if (layer.type === 'fill') {
      map.setPaintProperty(layerId, 'fill-opacity', opacity);
    }

    // Update fill layer if exists (for polygons)
    const fillLayerId = `${layerId}-fill`;
    if (map.getLayer(fillLayerId)) {
      map.setPaintProperty(fillLayerId, 'fill-opacity', opacity * 0.5); // Fill is always semi-transparent
    }

    mapLogger.log(`🎨 Updated opacity for ${layerId}: ${opacity}`);
    return true;
  } catch (error) {
    mapLogger.error(`❌ Failed to update opacity for ${layerId}:`, error);
    return false;
  }
}

/**
 * Get all QGIS layers on the map
 *
 * @param map Mapbox GL JS map instance
 * @returns Array of layer IDs
 */
export function getQGISLayers(map: mapboxgl.Map): string[] {
  const layers = map.getStyle()?.layers || [];
  return layers
    .filter(layer => layer.id.startsWith('qgis-wms-layer-') || layer.id.startsWith('qgis-wfs-layer-'))
    .map(layer => layer.id);
}
