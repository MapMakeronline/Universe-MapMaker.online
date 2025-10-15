/**
 * Unit tests for QGIS GetFeatureInfo utilities
 *
 * Run with: npm test src/lib/qgis/getFeatureInfo.test.ts
 */

import {
  lngLatToPixel,
  webMercatorToWGS84,
  wgs84ToWebMercator,
  isPointInExtent,
} from './getFeatureInfo';
import { LngLat, LngLatBounds } from 'mapbox-gl';

describe('getFeatureInfo utilities', () => {
  describe('lngLatToPixel', () => {
    it('should convert center point to center pixel', () => {
      const lngLat = new LngLat(18.7652, 52.1234);
      const bounds = new LngLatBounds(
        [18.7, 52.1], // SW
        [18.8, 52.15]  // NE
      );
      const width = 512;
      const height = 512;

      const pixel = lngLatToPixel(lngLat, bounds, width, height);

      // Should be approximately in the center
      expect(pixel.x).toBeCloseTo(333, 0); // ~65% from left
      expect(pixel.y).toBeCloseTo(230, 0); // ~45% from top
    });

    it('should convert southwest corner to (0, height)', () => {
      const lngLat = new LngLat(18.7, 52.1);
      const bounds = new LngLatBounds([18.7, 52.1], [18.8, 52.15]);
      const width = 512;
      const height = 512;

      const pixel = lngLatToPixel(lngLat, bounds, width, height);

      expect(pixel.x).toBe(0);
      expect(pixel.y).toBe(512);
    });

    it('should convert northeast corner to (width, 0)', () => {
      const lngLat = new LngLat(18.8, 52.15);
      const bounds = new LngLatBounds([18.7, 52.1], [18.8, 52.15]);
      const width = 512;
      const height = 512;

      const pixel = lngLatToPixel(lngLat, bounds, width, height);

      expect(pixel.x).toBe(512);
      expect(pixel.y).toBe(0);
    });
  });

  describe('webMercatorToWGS84', () => {
    it('should convert Web Mercator to WGS84', () => {
      const mercatorX = 2090942.57;
      const mercatorY = 6796741.92;

      const wgs84 = webMercatorToWGS84(mercatorX, mercatorY);

      expect(wgs84.lng).toBeCloseTo(18.7652, 3);
      expect(wgs84.lat).toBeCloseTo(52.1234, 3);
    });

    it('should handle equator coordinates', () => {
      const mercatorX = 0;
      const mercatorY = 0;

      const wgs84 = webMercatorToWGS84(mercatorX, mercatorY);

      expect(wgs84.lng).toBeCloseTo(0, 6);
      expect(wgs84.lat).toBeCloseTo(0, 6);
    });

    it('should handle prime meridian', () => {
      const mercatorX = 0;
      const mercatorY = 6696158; // ~52°N

      const wgs84 = webMercatorToWGS84(mercatorX, mercatorY);

      expect(wgs84.lng).toBeCloseTo(0, 6);
      expect(wgs84.lat).toBeCloseTo(52, 0);
    });
  });

  describe('wgs84ToWebMercator', () => {
    it('should convert WGS84 to Web Mercator', () => {
      const lng = 18.7652;
      const lat = 52.1234;

      const mercator = wgs84ToWebMercator(lng, lat);

      expect(mercator.x).toBeCloseTo(2090942.57, 0);
      expect(mercator.y).toBeCloseTo(6796741.92, 0);
    });

    it('should handle equator coordinates', () => {
      const lng = 0;
      const lat = 0;

      const mercator = wgs84ToWebMercator(lng, lat);

      expect(mercator.x).toBeCloseTo(0, 6);
      expect(mercator.y).toBeCloseTo(0, 6);
    });

    it('should be inverse of webMercatorToWGS84', () => {
      const lng = 18.7652;
      const lat = 52.1234;

      const mercator = wgs84ToWebMercator(lng, lat);
      const wgs84 = webMercatorToWGS84(mercator.x, mercator.y);

      expect(wgs84.lng).toBeCloseTo(lng, 4);
      expect(wgs84.lat).toBeCloseTo(lat, 4);
    });
  });

  describe('isPointInExtent', () => {
    const extent: [number, number, number, number] = [
      2088072, // minX
      6791904, // minY
      2093376, // maxX
      6797843, // maxY
    ];

    it('should return true for point inside extent', () => {
      const point = { lng: 2090942.57, lat: 6796741.92 };

      const result = isPointInExtent(point, extent);

      expect(result).toBe(true);
    });

    it('should return false for point outside extent (west)', () => {
      const point = { lng: 2000000, lat: 6796741.92 };

      const result = isPointInExtent(point, extent);

      expect(result).toBe(false);
    });

    it('should return false for point outside extent (east)', () => {
      const point = { lng: 3000000, lat: 6796741.92 };

      const result = isPointInExtent(point, extent);

      expect(result).toBe(false);
    });

    it('should return false for point outside extent (south)', () => {
      const point = { lng: 2090942.57, lat: 6000000 };

      const result = isPointInExtent(point, extent);

      expect(result).toBe(false);
    });

    it('should return false for point outside extent (north)', () => {
      const point = { lng: 2090942.57, lat: 7000000 };

      const result = isPointInExtent(point, extent);

      expect(result).toBe(false);
    });

    it('should return true for point on extent boundary', () => {
      const point = { lng: extent[0], lat: extent[1] };

      const result = isPointInExtent(point, extent);

      expect(result).toBe(true);
    });
  });
});

/**
 * Integration tests for GetFeatureInfo API
 *
 * Note: These require QGIS Server to be running
 */
describe('getFeatureInfo API (integration)', () => {
  // Skip integration tests by default
  // Run with: npm test -- --testPathPattern=getFeatureInfo --runInBand
  const skipIntegration = true;

  if (skipIntegration) {
    it.skip('skipping integration tests', () => {});
    return;
  }

  it('should fetch features from QGIS Server', async () => {
    const { getQGISFeatureInfo } = await import('./getFeatureInfo');
    const { LngLat, LngLatBounds } = await import('mapbox-gl');

    const result = await getQGISFeatureInfo({
      project: 'graph',
      layerName: 'test',
      clickPoint: new LngLat(18.7652, 52.1234),
      bounds: new LngLatBounds([18.7, 52.1], [18.8, 52.15]),
      width: 512,
      height: 512,
      featureCount: 10,
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('FeatureCollection');
    expect(Array.isArray(result.features)).toBe(true);
  });

  it('should handle empty results', async () => {
    const { getQGISFeatureInfo } = await import('./getFeatureInfo');
    const { LngLat, LngLatBounds } = await import('mapbox-gl');

    // Click outside layer extent
    const result = await getQGISFeatureInfo({
      project: 'graph',
      layerName: 'test',
      clickPoint: new LngLat(0, 0),
      bounds: new LngLatBounds([-1, -1], [1, 1]),
      width: 512,
      height: 512,
      featureCount: 10,
    });

    expect(result.features.length).toBe(0);
  });
});
