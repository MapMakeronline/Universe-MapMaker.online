/**
 * QGIS Server GetFeatureInfo API Client
 *
 * This module provides utilities for querying feature information from QGIS Server
 * using WMS GetFeatureInfo requests. It handles coordinate conversion, pixel calculation,
 * and response parsing.
 *
 * @module lib/qgis/getFeatureInfo
 * @see Dokumentacja/QGIS-IDENTIFY-TOOL-ANALIZA.md
 */

import { LngLat, LngLatBounds } from 'mapbox-gl';

/**
 * Base URL for QGIS Server OWS endpoint
 */
const QGIS_OWS_ENDPOINT = 'https://api.universemapmaker.online/ows';

/**
 * Parameters for GetFeatureInfo request
 */
export interface QGISFeatureInfoParams {
  /** Project name (e.g., "graph") */
  project: string;
  /** Layer name (e.g., "test") */
  layerName: string;
  /** Click point in WGS84 coordinates */
  clickPoint: LngLat;
  /** Map viewport bounds in WGS84 coordinates */
  bounds: LngLatBounds;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Maximum number of features to return (default: 10) */
  featureCount?: number;
  /** WMS version to use (default: "1.1.1") */
  version?: '1.1.1' | '1.3.0';
  /** Whether to include geometry in response (default: false) */
  withGeometry?: boolean;
}

/**
 * GeoJSON Feature returned by QGIS Server
 */
export interface QGISFeature {
  /** Feature ID (e.g., "test.88") */
  id: string;
  /** Feature type (always "Feature") */
  type: 'Feature';
  /** Feature properties/attributes */
  properties: Record<string, any>;
  /** Feature geometry (null unless withGeometry=true) */
  geometry: any | null;
}

/**
 * GeoJSON FeatureCollection returned by QGIS Server
 */
export interface QGISFeatureCollection {
  /** Collection type (always "FeatureCollection") */
  type: 'FeatureCollection';
  /** Array of features found at the click point */
  features: QGISFeature[];
}

/**
 * Pixel coordinates
 */
interface PixelCoords {
  x: number;
  y: number;
}

/**
 * Converts geographic coordinates (LngLat) to pixel coordinates
 * based on the current map viewport.
 *
 * This is used to calculate the X/Y or I/J parameters for GetFeatureInfo.
 *
 * @param lngLat - Click point in WGS84 coordinates
 * @param bounds - Map viewport bounds in WGS84 coordinates
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Pixel coordinates { x, y }
 *
 * @example
 * const pixel = lngLatToPixel(
 *   { lng: 18.7652, lat: 52.1234 },
 *   map.getBounds(),
 *   512,
 *   512
 * );
 * // pixel: { x: 256, y: 128 }
 */
export function lngLatToPixel(
  lngLat: LngLat,
  bounds: LngLatBounds,
  width: number,
  height: number
): PixelCoords {
  const minX = bounds.getWest();
  const maxX = bounds.getEast();
  const minY = bounds.getSouth();
  const maxY = bounds.getNorth();

  // Calculate normalized position (0-1)
  const normalizedX = (lngLat.lng - minX) / (maxX - minX);
  const normalizedY = (maxY - lngLat.lat) / (maxY - minY); // Note: Y is inverted (top = maxY)

  // Convert to pixel coordinates
  const x = Math.floor(normalizedX * width);
  const y = Math.floor(normalizedY * height);

  return { x, y };
}

/**
 * Builds GetFeatureInfo URL for QGIS Server
 *
 * Supports both WMS 1.1.1 (X/Y, SRS) and WMS 1.3.0 (I/J, CRS).
 *
 * @param params - GetFeatureInfo parameters
 * @param pixelCoords - Click point in pixel coordinates
 * @returns Complete GetFeatureInfo URL
 */
function buildGetFeatureInfoURL(
  params: QGISFeatureInfoParams,
  pixelCoords: PixelCoords
): string {
  const {
    project,
    layerName,
    bounds,
    width,
    height,
    featureCount = 10,
    version = '1.1.1',
    withGeometry = false,
  } = params;

  // WMS 1.1.1 uses SRS and X/Y
  // WMS 1.3.0 uses CRS and I/J
  const isVersion13 = version === '1.3.0';

  const searchParams = new URLSearchParams({
    MAP: `/projects/${project}/${project}.qgs`,
    SERVICE: 'WMS',
    VERSION: version,
    REQUEST: 'GetFeatureInfo',
    LAYERS: layerName,
    QUERY_LAYERS: layerName,
    [isVersion13 ? 'CRS' : 'SRS']: 'EPSG:4326',
    BBOX: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    [isVersion13 ? 'I' : 'X']: pixelCoords.x.toString(),
    [isVersion13 ? 'J' : 'Y']: pixelCoords.y.toString(),
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: featureCount.toString(),
  });

  // Add WITH_GEOMETRY parameter if requested (QGIS 3.x)
  if (withGeometry) {
    searchParams.append('WITH_GEOMETRY', '1');
  }

  return `${QGIS_OWS_ENDPOINT}?${searchParams.toString()}`;
}

/**
 * Fetches feature information from QGIS Server using WMS GetFeatureInfo
 *
 * This is the main function for identifying features at a specific point on the map.
 * It automatically converts geographic coordinates to pixel coordinates and handles
 * the GetFeatureInfo request/response.
 *
 * @param params - GetFeatureInfo parameters
 * @returns Promise resolving to GeoJSON FeatureCollection
 * @throws Error if the request fails or returns invalid data
 *
 * @example
 * const features = await getQGISFeatureInfo({
 *   project: 'graph',
 *   layerName: 'test',
 *   clickPoint: e.lngLat,
 *   bounds: map.getBounds(),
 *   width: canvas.width,
 *   height: canvas.height,
 *   featureCount: 10
 * });
 *
 * console.log(`Found ${features.features.length} features`);
 * features.features.forEach(f => {
 *   console.log(f.id, f.properties);
 * });
 */
export async function getQGISFeatureInfo(
  params: QGISFeatureInfoParams
): Promise<QGISFeatureCollection> {
  const { clickPoint, bounds, width, height } = params;

  // Convert click point to pixel coordinates
  const pixelCoords = lngLatToPixel(clickPoint, bounds, width, height);

  // Build GetFeatureInfo URL
  const url = buildGetFeatureInfoURL(params, pixelCoords);

  console.log('🔍 GetFeatureInfo request:', {
    project: params.project,
    layer: params.layerName,
    clickPoint: { lng: clickPoint.lng, lat: clickPoint.lat },
    pixelCoords,
    url,
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `GetFeatureInfo failed: ${response.status} ${response.statusText}\n${text}`
      );
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(
        `Unexpected content type: ${contentType}\n${text.substring(0, 500)}`
      );
    }

    const data: QGISFeatureCollection = await response.json();

    console.log('✅ GetFeatureInfo response:', {
      featureCount: data.features.length,
      features: data.features.map(f => ({
        id: f.id,
        properties: Object.keys(f.properties),
      })),
    });

    return data;
  } catch (error) {
    console.error('❌ GetFeatureInfo error:', error);
    throw error;
  }
}

/**
 * Queries multiple layers at once and combines results
 *
 * This is useful when you want to check all visible layers for features
 * at the click point.
 *
 * @param params - Base GetFeatureInfo parameters (without layerName)
 * @param layerNames - Array of layer names to query
 * @returns Promise resolving to combined FeatureCollection
 *
 * @example
 * const features = await getQGISFeatureInfoMultiLayer(
 *   {
 *     project: 'graph',
 *     clickPoint: e.lngLat,
 *     bounds: map.getBounds(),
 *     width: canvas.width,
 *     height: canvas.height
 *   },
 *   ['test', 'TestFutures', 'Granica Ciepłowody']
 * );
 */
export async function getQGISFeatureInfoMultiLayer(
  params: Omit<QGISFeatureInfoParams, 'layerName'>,
  layerNames: string[]
): Promise<QGISFeatureCollection> {
  const allFeatures: QGISFeature[] = [];
  const errors: Array<{ layer: string; error: any }> = [];

  // Query all layers in parallel
  const promises = layerNames.map(async (layerName) => {
    try {
      const result = await getQGISFeatureInfo({
        ...params,
        layerName,
      });
      return { layerName, features: result.features };
    } catch (error) {
      errors.push({ layer: layerName, error });
      return { layerName, features: [] };
    }
  });

  const results = await Promise.all(promises);

  // Combine all features
  results.forEach(({ features }) => {
    allFeatures.push(...features);
  });

  if (errors.length > 0) {
    console.warn('⚠️ Some layers failed to query:', errors);
  }

  console.log(`📊 Multi-layer query results: ${allFeatures.length} features from ${layerNames.length} layers`);

  return {
    type: 'FeatureCollection',
    features: allFeatures,
  };
}

/**
 * Checks if a point is within layer extent
 *
 * This is useful for pre-filtering layers before making GetFeatureInfo requests.
 * Layer extent is available in tree.json.
 *
 * @param point - Point to check (WGS84 or Web Mercator)
 * @param extent - Layer extent [minX, minY, maxX, maxY]
 * @returns True if point is within extent
 *
 * @example
 * const layerExtent = [2088072, 6791904, 2093376, 6797843]; // from tree.json
 * if (isPointInExtent({ lng: 18.7652, lat: 52.1234 }, layerExtent)) {
 *   // Query this layer
 * }
 */
export function isPointInExtent(
  point: { lng: number; lat: number },
  extent: [number, number, number, number]
): boolean {
  const [minX, minY, maxX, maxY] = extent;
  return (
    point.lng >= minX &&
    point.lng <= maxX &&
    point.lat >= minY &&
    point.lat <= maxY
  );
}

/**
 * Converts Web Mercator (EPSG:3857) coordinates to WGS84 (EPSG:4326)
 *
 * Note: Mapbox GL JS uses WGS84 (EPSG:4326) internally for LngLat,
 * so this function is only needed if you have Web Mercator coordinates
 * from another source.
 *
 * @param x - X coordinate in Web Mercator (meters)
 * @param y - Y coordinate in Web Mercator (meters)
 * @returns { lng, lat } in WGS84
 *
 * @example
 * const wgs84 = webMercatorToWGS84(2090942.57, 6796741.92);
 * // wgs84: { lng: 18.7652, lat: 52.1234 }
 */
export function webMercatorToWGS84(x: number, y: number): { lng: number; lat: number } {
  const lng = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);

  return { lng, lat };
}

/**
 * Converts WGS84 (EPSG:4326) coordinates to Web Mercator (EPSG:3857)
 *
 * This is useful if you need to work with coordinates in the same
 * coordinate system as PostGIS layers (most layers use EPSG:3857).
 *
 * @param lng - Longitude in WGS84 (degrees)
 * @param lat - Latitude in WGS84 (degrees)
 * @returns { x, y } in Web Mercator (meters)
 *
 * @example
 * const mercator = wgs84ToWebMercator(18.7652, 52.1234);
 * // mercator: { x: 2090942.57, y: 6796741.92 }
 */
export function wgs84ToWebMercator(lng: number, lat: number): { x: number; y: number } {
  const x = (lng * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;

  return { x, y };
}
