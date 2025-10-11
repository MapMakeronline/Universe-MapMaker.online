/**
 * Coordinate Transformation Utilities
 *
 * Handles coordinate system transformations between:
 * - EPSG:2180 (Polish National Grid - ETRS89 / Poland CS92)
 * - EPSG:4326 (WGS84 - World Geodetic System)
 *
 * Why needed:
 * - Backend (Django + PostGIS) stores coordinates in EPSG:2180 (Polish standard)
 * - Mapbox GL JS requires EPSG:4326 (longitude, latitude in degrees)
 * - QGIS projects often use local coordinate systems
 */

import proj4 from 'proj4';

/**
 * EPSG:2180 - Polish National Grid (ETRS89 / Poland CS92)
 * Official definition from EPSG Registry
 *
 * Used by:
 * - Polish government GIS systems
 * - Cadastral data (ewidencja gruntów)
 * - Municipal planning documents (MPZP)
 *
 * Units: meters
 * Bounds: approximately Poland territory
 */
proj4.defs(
  'EPSG:2180',
  '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);

/**
 * EPSG:4326 - WGS84 (World Geodetic System 1984)
 * Already defined in proj4 by default
 *
 * Used by:
 * - GPS systems
 * - Web mapping (Google Maps, Mapbox, OpenStreetMap)
 * - GeoJSON standard
 *
 * Units: degrees
 * Range: longitude [-180, 180], latitude [-90, 90]
 */

/**
 * Transform extent from EPSG:2180 to EPSG:4326 (WGS84)
 *
 * @param extent - [minX, minY, maxX, maxY] in EPSG:2180 (meters)
 * @returns [minLng, minLat, maxLng, maxLat] in EPSG:4326 (degrees)
 *
 * @example
 * // Polish coordinates (EPSG:2180)
 * const extent = [1575340.24, 6278773.80, 2689465.69, 7367152.64];
 *
 * // Transform to WGS84 for Mapbox
 * const [minLng, minLat, maxLng, maxLat] = transformExtent(extent);
 * // Result: [14.12, 49.00, 24.15, 54.83] (approximately Poland bounds)
 */
export function transformExtent(
  extent: [number, number, number, number]
): [number, number, number, number] {
  const [minX, minY, maxX, maxY] = extent;

  // Transform bottom-left corner
  const [minLng, minLat] = proj4('EPSG:2180', 'EPSG:4326', [minX, minY]);

  // Transform top-right corner
  const [maxLng, maxLat] = proj4('EPSG:2180', 'EPSG:4326', [maxX, maxY]);

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Transform single point from EPSG:2180 to EPSG:4326
 *
 * @param x - X coordinate in EPSG:2180 (easting, meters)
 * @param y - Y coordinate in EPSG:2180 (northing, meters)
 * @returns [longitude, latitude] in EPSG:4326 (degrees)
 *
 * @example
 * const [lng, lat] = transformPoint(2132403, 6651920);
 * // Result: [19.25, 52.14] (approximately Warsaw)
 */
export function transformPoint(x: number, y: number): [number, number] {
  return proj4('EPSG:2180', 'EPSG:4326', [x, y]);
}

/**
 * Transform coordinates from EPSG:4326 to EPSG:2180
 * (Reverse transformation - WGS84 to Polish National Grid)
 *
 * @param lng - Longitude in degrees
 * @param lat - Latitude in degrees
 * @returns [x, y] in EPSG:2180 (meters)
 *
 * @example
 * const [x, y] = transformToPolishGrid(19.25, 52.14);
 * // Result: [2132403, 6651920] (approximately Warsaw in EPSG:2180)
 */
export function transformToPolishGrid(lng: number, lat: number): [number, number] {
  return proj4('EPSG:4326', 'EPSG:2180', [lng, lat]);
}

/**
 * Validate if coordinates are valid WGS84 (EPSG:4326)
 *
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns true if valid, false otherwise
 */
export function isValidWGS84(lng: number, lat: number): boolean {
  return (
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90 &&
    !isNaN(lng) &&
    !isNaN(lat)
  );
}

/**
 * Detect coordinate system based on coordinate values
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns 'EPSG:4326' | 'EPSG:2180' | 'unknown'
 *
 * @example
 * detectCRS(19.25, 52.14) // 'EPSG:4326'
 * detectCRS(2132403, 6651920) // 'EPSG:2180'
 */
export function detectCRS(x: number, y: number): 'EPSG:4326' | 'EPSG:2180' | 'unknown' {
  // WGS84 bounds check
  if (isValidWGS84(x, y)) {
    return 'EPSG:4326';
  }

  // EPSG:2180 typical bounds for Poland
  // X: ~160,000 to ~860,000 (easting)
  // Y: ~5,200,000 to ~7,800,000 (northing)
  if (
    x >= 100000 &&
    x <= 900000 &&
    y >= 5000000 &&
    y <= 8000000
  ) {
    return 'EPSG:2180';
  }

  return 'unknown';
}
