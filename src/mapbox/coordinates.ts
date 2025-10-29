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
 * EPSG:3857 - Web Mercator (Pseudo-Mercator)
 * Used by web mapping services (Google Maps, Mapbox, OpenStreetMap)
 *
 * Units: meters
 * Range: X: [-20037508.34, 20037508.34], Y: [-20048966.10, 20048966.10]
 */
proj4.defs(
  'EPSG:3857',
  '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs'
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
 * Or transform between any two CRS when fromCRS and toCRS are specified
 *
 * @param extent - [minX, minY, maxX, maxY] in source CRS
 * @param fromCRS - Source coordinate system (default: 'EPSG:2180')
 * @param toCRS - Target coordinate system (default: 'EPSG:4326')
 * @returns [minLng, minLat, maxLng, maxLat] in target CRS
 *
 * @example
 * // Polish coordinates (EPSG:2180) to WGS84
 * const extent = [1575340.24, 6278773.80, 2689465.69, 7367152.64];
 * const [minLng, minLat, maxLng, maxLat] = transformExtent(extent);
 * // Result: [14.12, 49.00, 24.15, 54.83] (approximately Poland bounds)
 *
 * @example
 * // Web Mercator (EPSG:3857) to WGS84
 * const extent = [2055612, 7221689, 2055964, 7222181];
 * const [minLng, minLat, maxLng, maxLat] = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
 */
export function transformExtent(
  extent: [number, number, number, number],
  fromCRS: string = 'EPSG:2180',
  toCRS: string = 'EPSG:4326'
): [number, number, number, number] {
  const [minX, minY, maxX, maxY] = extent;

  // Transform bottom-left corner
  const [minLng, minLat] = proj4(fromCRS, toCRS, [minX, minY]);

  // Transform top-right corner
  const [maxLng, maxLat] = proj4(fromCRS, toCRS, [maxX, maxY]);

  return [minLng, minLat, maxLng, maxLat];
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
 * Transform extent from EPSG:3857 (Web Mercator) to EPSG:4326 (WGS84)
 *
 * @param extent - [minX, minY, maxX, maxY] in EPSG:3857 (meters)
 * @returns [minLng, minLat, maxLng, maxLat] in EPSG:4326 (degrees)
 *
 * @example
 * // Web Mercator coordinates (EPSG:3857)
 * const extent = [1883502, 6566838, 1883639, 6567053];
 *
 * // Transform to WGS84 for Mapbox
 * const [minLng, minLat, maxLng, maxLat] = transformExtentFromWebMercator(extent);
 * // Result: [16.92, 52.04, 16.93, 52.05] (approximately)
 */
export function transformExtentFromWebMercator(
  extent: [number, number, number, number]
): [number, number, number, number] {
  const [minX, minY, maxX, maxY] = extent;

  // Transform bottom-left corner
  const [minLng, minLat] = proj4('EPSG:3857', 'EPSG:4326', [minX, minY]);

  // Transform top-right corner
  const [maxLng, maxLat] = proj4('EPSG:3857', 'EPSG:4326', [maxX, maxY]);

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Detect coordinate system based on coordinate values
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns 'EPSG:4326' | 'EPSG:2180' | 'EPSG:3857' | 'unknown'
 *
 * @example
 * detectCRS(19.25, 52.14) // 'EPSG:4326'
 * detectCRS(2132403, 6651920) // 'EPSG:2180'
 * detectCRS(1883502, 6566838) // 'EPSG:3857'
 */
export function detectCRS(x: number, y: number): 'EPSG:4326' | 'EPSG:2180' | 'EPSG:3857' | 'unknown' {
  // WGS84 bounds check
  if (isValidWGS84(x, y)) {
    return 'EPSG:4326';
  }

  // EPSG:3857 (Web Mercator) - rozszerzony zakres dla całego świata
  // X: ~-20037508 to ~20037508 (meters)
  // Y: ~-20048966 to ~20048966 (meters)
  // Dla Polski: X: ~1,800,000 to ~2,700,000, Y: ~6,400,000 to ~7,400,000
  // ROZSZERZONO: aby obsługiwać również nietypowe zakresy (np. 2537183 - 8441295)
  if (
    Math.abs(x) >= 1000000 && Math.abs(x) <= 20037508 &&
    Math.abs(y) >= 5000000 && Math.abs(y) <= 20048966
  ) {
    return 'EPSG:3857';
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

  // FALLBACK: Jeśli współrzędne są duże (> 180), prawdopodobnie to projected CRS
  // Domyślnie zakładamy EPSG:3857 (Web Mercator) jako najbardziej uniwersalny
  if (Math.abs(x) > 180 || Math.abs(y) > 180) {
    console.warn(`⚠️ Unrecognized CRS for coords [${x}, ${y}], assuming EPSG:3857 (Web Mercator)`);
    return 'EPSG:3857';
  }

  return 'unknown';
}
