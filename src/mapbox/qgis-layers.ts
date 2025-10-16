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
import { mapLogger } from '@/tools/logger';

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
      `STYLES=&` +
      `WIDTH=256&` +
      `HEIGHT=256&` +
      `CRS=${crs}&` +
      `BBOX={bbox-epsg-3857}&` + // Mapbox will replace this with actual bbox
      `FORMAT=image/png&` +
      `TRANSPARENT=true&` +
      `DPI=96&` +
      `MAP=/projects/${encodeURIComponent(projectName)}/${encodeURIComponent(projectName)}.qgs`; // Absolute path to QGS file

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
      `MAP=/projects/${encodeURIComponent(projectName)}/${encodeURIComponent(projectName)}.qgs`;

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

/**
 * Refresh WMS layer by removing and re-adding it
 *
 * This forces QGIS Server to re-render the layer with updated styles/data.
 * Use after:
 * - Changing layer style in QGIS
 * - Updating layer data
 * - Modifying layer visibility/opacity
 *
 * @param map Mapbox GL JS map instance
 * @param layerId Layer ID (e.g., 'qgis-wms-layer-MyProject_1-layer_uuid')
 * @param layerName Original layer name from QGIS
 * @param projectName Project name
 * @param options Layer options (opacity, visibility, etc.)
 */
export function refreshWMSLayer(
  map: mapboxgl.Map,
  layerId: string,
  layerName: string,
  projectName: string,
  options?: Partial<WMSLayerOptions>
): boolean {
  try {
    mapLogger.log(`🔄 Refreshing WMS layer: ${layerId}`);

    // Get current layer state
    const layer = map.getLayer(layerId);
    if (!layer) {
      mapLogger.warn(`Layer not found: ${layerId}`);
      return false;
    }

    const currentVisibility = map.getLayoutProperty(layerId, 'visibility');
    const currentOpacity = map.getPaintProperty(layerId, 'raster-opacity') as number | undefined;

    // Remove layer and source
    removeQGISLayer(map, layerId);

    // Re-add with current or new options
    addWMSLayer(map, {
      layerName,
      projectName,
      opacity: options?.opacity !== undefined ? options.opacity : (currentOpacity || 1),
      visible: options?.visible !== undefined ? options.visible : currentVisibility === 'visible',
      ...options
    });

    mapLogger.log(`✅ WMS layer refreshed: ${layerId}`);
    return true;
  } catch (error) {
    mapLogger.error(`❌ Failed to refresh WMS layer ${layerId}:`, error);
    return false;
  }
}

/**
 * Update project logo (thumbnail)
 *
 * Triggers backend to regenerate project thumbnail based on current layer visibility/styles.
 * Call this after:
 * - Changing layer visibility
 * - Changing layer opacity
 * - Reordering layers
 * - Adding/removing layers
 *
 * @param projectName Project name
 */
export async function updateProjectLogo(projectName: string): Promise<boolean> {
  try {
    mapLogger.log(`📸 Updating project logo: ${projectName}`);

    // Get auth token from localStorage (stored as 'authToken', not 'token')
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      mapLogger.warn(`⚠️ No auth token found - skipping logo update for ${projectName}`);
      return false;
    }

    const response = await fetch(`${QGIS_SERVER_URL.replace('/ows', '')}/api/projects/logo/update/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({ project: projectName }),
    });

    if (!response.ok) {
      throw new Error(`Logo update failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    mapLogger.log(`✅ Project logo updated: ${projectName}`);
    return data.success || true;
  } catch (error) {
    mapLogger.error(`❌ Failed to update project logo ${projectName}:`, error);
    return false;
  }
}

/**
 * WGS84 (EPSG:4326) → Web Mercator (EPSG:3857) coordinate transformation
 *
 * Converts longitude/latitude to Web Mercator projection (meters).
 * Used for QGIS Server WMS requests which expect EPSG:3857 coordinates.
 *
 * @param lon Longitude in degrees (-180 to 180)
 * @param lat Latitude in degrees (-85.0511 to 85.0511)
 * @returns [x, y] coordinates in meters (EPSG:3857)
 */
function lngLatToWebMercator(lon: number, lat: number): [number, number] {
  const R = 6378137; // Earth radius in meters (WGS84 semi-major axis)

  // X coordinate (longitude → meters)
  const x = R * (lon * Math.PI / 180);

  // Y coordinate (latitude → meters, using Mercator projection)
  // Formula: y = R * ln(tan(π/4 + φ/2))
  const y = R * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 360)));

  return [x, y];
}

/**
 * Get feature information from QGIS Server (WMS GetFeatureInfo)
 *
 * Queries QGIS Server for features at a specific map click point.
 * Uses WMS 1.3.0 GetFeatureInfo request with BBOX and pixel coordinates.
 *
 * **Tolerance Control:**
 * - Backend buffer is controlled by QGIS Server configuration
 * - Frontend sends BBOX matching visible viewport
 * - `FEATURE_COUNT` limits max results (default: 10)
 *
 * Example:
 * ```ts
 * const result = await getFeatureInfo('MyProject', 'buildings', [21.012, 52.229], map);
 * if (result.success) {
 *   console.log('Features found:', result.data.features);
 * }
 * ```
 *
 * @param projectName QGIS project name (e.g., "MyProject_1")
 * @param layerName Layer name from QGIS project (NOT layer UUID!)
 * @param lngLat Click coordinates [longitude, latitude] in WGS84
 * @param map Mapbox GL JS map instance (used for viewport calculations)
 * @param featureCount Maximum number of features to return (default: 10)
 * @returns Promise with success status and feature data
 */
export async function getFeatureInfo(
  projectName: string,
  layerName: string,
  lngLat: [number, number],
  map: mapboxgl.Map,
  featureCount: number = 10
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Get map container dimensions (for BBOX calculation)
    const container = map.getContainer();
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Convert click coordinates to pixel position
    const point = map.project(lngLat);

    // Get viewport bounds (SW and NE corners)
    const sw = map.unproject([0, height]); // Bottom-left corner
    const ne = map.unproject([width, 0]);  // Top-right corner

    // Transform viewport bounds to Web Mercator (EPSG:3857)
    const [swX, swY] = lngLatToWebMercator(sw.lng, sw.lat);
    const [neX, neY] = lngLatToWebMercator(ne.lng, ne.lat);

    mapLogger.log('🔍 GetFeatureInfo: Building WMS request', {
      projectName,
      layerName,
      clickPoint: lngLat,
      pixelPoint: { x: Math.round(point.x), y: Math.round(point.y) },
      viewport: { width, height },
      bbox: {
        sw: [swX.toFixed(2), swY.toFixed(2)],
        ne: [neX.toFixed(2), neY.toFixed(2)]
      }
    });

    // Build WMS GetFeatureInfo request
    // QGIS Server expects:
    // - SERVICE=WMS
    // - VERSION=1.3.0 (newer standard)
    // - REQUEST=GetFeatureInfo
    // - LAYERS=layer_name (layers to query)
    // - QUERY_LAYERS=layer_name (layers to identify)
    // - STYLES= (empty for default)
    // - FORMAT=image/png (map format, not feature format!)
    // - FEATURE_COUNT=10 (max features to return)
    // - INFO_FORMAT=application/json (feature format)
    // - CRS=EPSG:3857 (coordinate system)
    // - WIDTH=viewport_width (map width in pixels)
    // - HEIGHT=viewport_height (map height in pixels)
    // - BBOX=minX,minY,maxX,maxY (viewport bounds in EPSG:3857)
    // - I=x (pixel X coordinate - WMS 1.3.0 uses I/J instead of X/Y)
    // - J=y (pixel Y coordinate)
    // - MAP=/projects/ProjectName/ProjectName.qgs (absolute path)
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeatureInfo',
      LAYERS: layerName,
      QUERY_LAYERS: layerName,
      STYLES: '',
      FORMAT: 'image/png',
      FEATURE_COUNT: featureCount.toString(),
      INFO_FORMAT: 'application/json',
      CRS: 'EPSG:3857', // WMS 1.3.0 uses CRS (not SRS)
      WIDTH: width.toString(),
      HEIGHT: height.toString(),
      BBOX: `${swX},${swY},${neX},${neY}`, // Viewport bounds
      I: Math.round(point.x).toString(), // Pixel X (WMS 1.3.0)
      J: Math.round(point.y).toString(), // Pixel Y (WMS 1.3.0)
      map: `/projects/${projectName}/${projectName}.qgs`, // Absolute path to QGS file
    });

    const url = `${QGIS_SERVER_URL}?${params}`;
    mapLogger.log(`🌐 GetFeatureInfo FULL URL:`, url);
    mapLogger.log(`🌐 GetFeatureInfo parameters:`, {
      layerName,
      projectName,
      clickPoint: lngLat,
      pixelPoint: { x: Math.round(point.x), y: Math.round(point.y) },
      featureCount
    });

    // Fetch feature data from QGIS Server
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // QGIS Server returns GeoJSON FeatureCollection
    // { "type": "FeatureCollection", "features": [...] }
    const featuresFound = data.features?.length || 0;
    mapLogger.log(`✅ GetFeatureInfo: Found ${featuresFound} features`);

    return { success: true, data };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    mapLogger.error('❌ GetFeatureInfo error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Add all project layers from QGIS tree structure
 *
 * Recursively processes layer tree and adds all VectorLayer/RasterLayer as WMS layers.
 * This matches the old project's `addProjectLayers()` function.
 *
 * @param map Mapbox GL JS map instance
 * @param items Layer tree items from QGIS Server (can be nested groups)
 * @param projectName Project name
 * @returns Number of layers added
 */
export function addProjectLayers(
  map: mapboxgl.Map,
  items: any[],
  projectName: string
): number {
  let layersAdded = 0;

  const processItems = (items: any[]) => {
    items.forEach((item) => {
      // Add VectorLayer or RasterLayer as WMS
      if (item.type === 'VectorLayer' || item.type === 'RasterLayer') {
        const result = addWMSLayer(map, {
          layerName: item.name, // CRITICAL: Use item.name (layer name), NOT item.id (UUID)!
          projectName,
          opacity: item.opacity !== undefined ? item.opacity / 255 : 1, // QGIS uses 0-255, we use 0-1
          visible: item.visible !== false,
          minZoom: 0,
          maxZoom: 22,
          crs: 'EPSG:3857',
        });

        if (result) {
          layersAdded++;
          mapLogger.log(`✅ Added WMS layer: ${item.name} (ID: ${item.id})`);
        }
      }

      // Recursively process group children
      if (item.type === 'group' && item.children && item.children.length > 0) {
        processItems(item.children);
      }
    });
  };

  mapLogger.log(`📦 Adding project layers for: ${projectName}`);
  processItems(items);
  mapLogger.log(`✅ Added ${layersAdded} WMS layers`);

  // Update project logo after adding all layers
  updateProjectLogo(projectName);

  return layersAdded;
}
