/**
 * Map Utilities - Coordinate Transformations
 *
 * Converts coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
 * for use with Mapbox GL JS.
 *
 * IMPORTANT: Backend returns coordinates in EPSG:3857, but Mapbox requires EPSG:4326.
 *
 * Documentation: SEARCH_DOCUMENTATION.md (lines 377-414)
 */

// Web Mercator constants
const WEB_MERCATOR_MAX = 20037508.34;

/**
 * Convert single point from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
 *
 * @param x - X coordinate in meters (Web Mercator)
 * @param y - Y coordinate in meters (Web Mercator)
 * @returns [longitude, latitude] in degrees (WGS84)
 *
 * @example
 * const [lng, lat] = webMercatorToLngLat(2123456.78, 6789012.34);
 * // [19.045678, 52.123456]
 */
export const webMercatorToLngLat = (x: number, y: number): [number, number] => {
  // Longitude: linear conversion
  const lng = (x / WEB_MERCATOR_MAX) * 180;

  // Latitude: inverse Mercator projection (exponential)
  const lat = (Math.atan(Math.exp((y / WEB_MERCATOR_MAX) * 180 * Math.PI / 180)) * 360 / Math.PI) - 90;

  return [lng, lat];
};

/**
 * Recursively convert coordinates array (handles nested arrays)
 * Supports Point, LineString, Polygon, MultiPolygon, etc.
 *
 * @param coords - Coordinates in any nesting level
 * @returns Converted coordinates in WGS84
 *
 * @example
 * // Point: [x, y]
 * convertCoordinates([2123456.78, 6789012.34]);
 * // [19.045678, 52.123456]
 *
 * // Polygon: [[[x, y], [x, y], ...]]
 * convertCoordinates([[[x1, y1], [x2, y2], ...]]);
 * // [[[lng1, lat1], [lng2, lat2], ...]]
 */
const convertCoordinates = (coords: any): any => {
  // Base case: single point [x, y]
  if (typeof coords[0] === 'number') {
    return webMercatorToLngLat(coords[0], coords[1]);
  }

  // Recursive case: array of points/arrays
  return coords.map(convertCoordinates);
};

/**
 * Convert GeoJSON features from Web Mercator to WGS84
 * Transforms geometry coordinates while preserving properties
 *
 * @param features - Array of GeoJSON features with EPSG:3857 geometry
 * @returns Array of GeoJSON features with EPSG:4326 geometry
 *
 * @example
 * const wgs84Features = convertFeaturesToWGS84(features);
 * map.addSource('source', {
 *   type: 'geojson',
 *   data: { type: 'FeatureCollection', features: wgs84Features }
 * });
 */
export const convertFeaturesToWGS84 = (features: any[]): any[] => {
  return features.map(feature => ({
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: convertCoordinates(feature.geometry.coordinates)
    }
  }));
};

/**
 * Convert bounding box from Web Mercator to WGS84
 *
 * @param bbox - [minX, minY, maxX, maxY] in EPSG:3857
 * @returns [[swLng, swLat], [neLng, neLat]] in EPSG:4326
 *
 * @example
 * const bbox = [2123456.78, 6789012.34, 2123567.89, 6789123.45];
 * const bounds = convertBboxToWGS84(bbox);
 * map.fitBounds(bounds, { padding: 50, duration: 1000 });
 */
export const convertBboxToWGS84 = (
  bbox: [number, number, number, number]
): [[number, number], [number, number]] => {
  const [minX, minY, maxX, maxY] = bbox;
  const [swLng, swLat] = webMercatorToLngLat(minX, minY);
  const [neLng, neLat] = webMercatorToLngLat(maxX, maxY);

  return [
    [swLng, swLat], // Southwest corner
    [neLng, neLat]  // Northeast corner
  ];
};

/**
 * Extract unique values from array
 * Filters out null/undefined, sorts alphabetically
 *
 * @param values - Array of values (may contain duplicates)
 * @returns Sorted array of unique values
 *
 * @example
 * const precincts = ['Uniejów', 'Uniejów', 'Kolbudy', null];
 * getUniqueValues(precincts); // ['Kolbudy', 'Uniejów']
 */
export const getUniqueValues = (values: any[]): string[] => {
  const unique = new Set<string>();
  values.forEach(value => {
    if (value != null && value !== '') {
      unique.add(String(value));
    }
  });
  return Array.from(unique).sort();
};
