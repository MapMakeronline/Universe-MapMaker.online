/**
 * useSelectedFeatureVisualization Hook (Canvas Overlay Version)
 *
 * Provides functionality to visualize selected feature(s) from attribute table
 * with highlight and vertices (nodes) on the map - similar to QGIS selection.
 *
 * Uses HTML Canvas overlay to render above QGIS WMS raster tiles.
 *
 * Features:
 * - Highlight selected geometry (fill + outline) - YELLOW + RED
 * - Show vertices (nodes) as small circles - BLACK with WHITE stroke
 * - Canvas overlay renders ABOVE all map layers (including WMS rasters)
 * - Auto-cleanup on layer change or unmount
 *
 * Usage:
 * ```tsx
 * const { visualizeFeature, clearVisualization } = useSelectedFeatureVisualization();
 * visualizeFeature(featureId, layer, projectName);
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useGetSelectedFeaturesMutation } from '@/backend/layers';

/**
 * Extracts all vertices from a GeoJSON geometry
 * Supports: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
 */
function extractVertices(geometry: any): Array<[number, number]> {
  const vertices: Array<[number, number]> = [];

  function extractFromCoordinates(coords: any, depth: number) {
    if (depth === 0) {
      // Single coordinate pair [lng, lat]
      vertices.push(coords as [number, number]);
    } else if (Array.isArray(coords)) {
      coords.forEach(c => extractFromCoordinates(c, depth - 1));
    }
  }

  switch (geometry.type) {
    case 'Point':
      vertices.push(geometry.coordinates);
      break;
    case 'LineString':
      extractFromCoordinates(geometry.coordinates, 1);
      break;
    case 'Polygon':
      extractFromCoordinates(geometry.coordinates, 2);
      break;
    case 'MultiPoint':
      extractFromCoordinates(geometry.coordinates, 1);
      break;
    case 'MultiLineString':
      extractFromCoordinates(geometry.coordinates, 2);
      break;
    case 'MultiPolygon':
      extractFromCoordinates(geometry.coordinates, 3);
      break;
    default:
      console.warn('[extractVertices] Unknown geometry type:', geometry.type);
  }

  return vertices;
}

/**
 * Convert EPSG:3857 (Web Mercator meters) to WGS84 (lng/lat degrees)
 * Backend returns geometries in EPSG:3857, but Mapbox expects WGS84
 */
function epsg3857ToWGS84(x: number, y: number): [number, number] {
  const lng = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) / (Math.PI / 4) - 1) * 90;
  return [lng, lat];
}

/**
 * Convert lng/lat to screen pixel coordinates
 */
function projectToScreen(map: any, x: number, y: number): { x: number; y: number } {
  // Convert from EPSG:3857 (meters) to WGS84 (degrees) first
  const [lng, lat] = epsg3857ToWGS84(x, y);
  const point = map.project([lng, lat]);
  return { x: point.x, y: point.y };
}

/**
 * Draw polygon on canvas
 */
function drawPolygon(
  ctx: CanvasRenderingContext2D,
  map: any,
  coordinates: number[][][],
  fillColor: string,
  strokeColor: string,
  lineWidth: number
) {
  // Draw each ring (outer + holes)
  coordinates.forEach((ring, ringIndex) => {
    ctx.beginPath();

    ring.forEach((coord, i) => {
      const { x, y } = projectToScreen(map, coord[0], coord[1]);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();

    // Fill only outer ring
    if (ringIndex === 0) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Stroke all rings
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  });
}

/**
 * Draw MultiPolygon on canvas
 */
function drawMultiPolygon(
  ctx: CanvasRenderingContext2D,
  map: any,
  coordinates: number[][][][],
  fillColor: string,
  strokeColor: string,
  lineWidth: number
) {
  coordinates.forEach(polygon => {
    drawPolygon(ctx, map, polygon, fillColor, strokeColor, lineWidth);
  });
}

/**
 * Draw LineString on canvas
 */
function drawLineString(
  ctx: CanvasRenderingContext2D,
  map: any,
  coordinates: number[][],
  strokeColor: string,
  lineWidth: number
) {
  ctx.beginPath();

  coordinates.forEach((coord, i) => {
    const { x, y } = projectToScreen(map, coord[0], coord[1]);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Draw Point on canvas
 */
function drawPoint(
  ctx: CanvasRenderingContext2D,
  map: any,
  coordinates: number[],
  fillColor: string,
  strokeColor: string,
  radius: number,
  strokeWidth: number
) {
  const { x, y } = projectToScreen(map, coordinates[0], coordinates[1]);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
}

/**
 * Draw vertices as circles on canvas
 */
function drawVertices(
  ctx: CanvasRenderingContext2D,
  map: any,
  vertices: Array<[number, number]>,
  fillColor: string,
  strokeColor: string,
  radius: number,
  strokeWidth: number
) {
  vertices.forEach(([lng, lat]) => {
    const { x, y } = projectToScreen(map, lng, lat);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  });
}

/**
 * Hook for visualizing selected feature with highlight and vertices using Canvas overlay
 *
 * @param mapInstanceOverride - Optional map instance override (for components outside MapProvider)
 * @returns Object with visualizeFeature and clearVisualization functions
 */
export function useSelectedFeatureVisualization(mapInstanceOverride?: any) {
  const { current: mapFromContext } = useMap();
  const map = mapInstanceOverride || mapFromContext;
  const [getSelectedFeatures] = useGetSelectedFeaturesMutation();

  // Canvas overlay element reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Current feature geometry for redrawing on map move/zoom
  const currentFeatureRef = useRef<any>(null);
  const currentVerticesRef = useRef<Array<[number, number]>>([]);

  /**
   * Render canvas overlay
   */
  const renderCanvas = useCallback(() => {
    if (!map || !canvasRef.current || !currentFeatureRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const feature = currentFeatureRef.current;
    const vertices = currentVerticesRef.current;

    console.log('[Canvas Overlay] 🎨 Rendering feature:', feature.geometry.type);

    // Draw geometry based on type
    if (feature.geometry.type === 'Polygon') {
      drawPolygon(
        ctx,
        map,
        feature.geometry.coordinates,
        'rgba(255, 255, 0, 0.5)', // Yellow fill (50% opacity)
        '#ff0000', // Red outline
        3 // Line width
      );
    } else if (feature.geometry.type === 'MultiPolygon') {
      drawMultiPolygon(
        ctx,
        map,
        feature.geometry.coordinates,
        'rgba(255, 255, 0, 0.5)', // Yellow fill (50% opacity)
        '#ff0000', // Red outline
        3 // Line width
      );
    } else if (feature.geometry.type === 'LineString') {
      drawLineString(
        ctx,
        map,
        feature.geometry.coordinates,
        '#ff0000', // Red
        4 // Line width
      );
    } else if (feature.geometry.type === 'Point') {
      drawPoint(
        ctx,
        map,
        feature.geometry.coordinates,
        '#ff0000', // Red fill
        '#ffffff', // White stroke
        8, // Radius
        2 // Stroke width
      );
    }

    // Draw vertices (black circles with white outline)
    if (vertices.length > 0) {
      drawVertices(
        ctx,
        map,
        vertices,
        '#000000', // Black fill
        '#ffffff', // White stroke
        5, // Radius (5px as specified)
        2 // Stroke width (2px as specified)
      );
    }

    console.log('[Canvas Overlay] ✅ Canvas rendered with', vertices.length, 'vertices');
  }, [map]);

  /**
   * Initialize canvas overlay
   */
  const initCanvas = useCallback(() => {
    if (!map || canvasRef.current) return;

    console.log('[Canvas Overlay] 🎨 Initializing canvas overlay...');

    const mapContainer = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.id = 'qgis-selection-canvas-overlay';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    canvas.style.zIndex = '999'; // Above all map layers

    // Match map container size
    const rect = mapContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    mapContainer.appendChild(canvas);
    canvasRef.current = canvas;

    // Redraw on map move/zoom
    const handleMapUpdate = () => {
      renderCanvas();
    };

    map.on('move', handleMapUpdate);
    map.on('zoom', handleMapUpdate);
    map.on('resize', () => {
      if (canvasRef.current) {
        const rect = mapContainer.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;
        renderCanvas();
      }
    });

    console.log('[Canvas Overlay] ✅ Canvas overlay initialized');
  }, [map, renderCanvas]);

  /**
   * Removes canvas overlay
   */
  const clearVisualization = useCallback(() => {
    console.log('[Canvas Overlay] ✨ Clearing visualization...');

    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }

    currentFeatureRef.current = null;
    currentVerticesRef.current = [];

    console.log('[Canvas Overlay] ✅ Cleared');
  }, []);

  /**
   * Visualizes selected feature with highlight and vertices using Canvas overlay
   *
   * @param featureId - Feature ID (ogc_fid)
   * @param layer - Layer object with id and name
   * @param projectName - Project name (string)
   */
  const visualizeFeature = useCallback(async (
    featureId: number | string,
    layer: { id: string; name: string },
    projectName: string
  ) => {
    console.log('[Canvas Overlay] 🎨 Starting visualization:', {
      featureId,
      layerName: layer.name
    });

    if (!map) {
      console.error('[Canvas Overlay] ❌ Map not ready');
      return;
    }

    try {
      // Initialize canvas if needed
      initCanvas();

      // Extract numeric ogc_fid from GML ID if needed
      let actualFeatureId = featureId;
      if (typeof featureId === 'string' && featureId.includes('.')) {
        const parts = featureId.split('.');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          actualFeatureId = parts[1];
        }
      }

      // Fetch geometry from backend
      const response = await getSelectedFeatures({
        project: projectName,
        layer_id: layer.id,
        label: [String(actualFeatureId)]
      }).unwrap();

      // Handle undefined or null response
      if (!response) {
        console.error('[Canvas Overlay] ❌ Backend returned undefined/null response');
        return;
      }

      // Parse response if string
      let parsedResponse = response;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error('[Canvas Overlay] ❌ Failed to parse response:', e);
          return;
        }
      }

      const actualData = (parsedResponse as any).data || parsedResponse;

      if (!actualData.features || actualData.features.length === 0) {
        console.error('[Canvas Overlay] ❌ No features returned');
        return;
      }

      const feature = actualData.features[0];
      console.log('[Canvas Overlay] ✅ Feature received:', {
        id: feature.id,
        geometryType: feature.geometry.type
      });

      // Extract vertices
      const vertices = extractVertices(feature.geometry);
      console.log('[Canvas Overlay] 📍 Extracted vertices:', vertices.length);

      // Store feature and vertices for redrawing
      currentFeatureRef.current = feature;
      currentVerticesRef.current = vertices;

      // Render on canvas
      renderCanvas();

      console.log('[Canvas Overlay] ✅ Visualization complete!');

    } catch (error: any) {
      // Don't log as error if it's just missing geometry (expected for ~20% of features)
      const isMissingGeometry = error?.data?.includes('Nie znaleziono geometrii');

      if (isMissingGeometry) {
        console.warn('[Canvas Overlay] ⚠️ No geometry for this feature (expected for descriptive layers)');
      } else {
        console.error('[Canvas Overlay] ❌ Error:', error);
      }
    }
  }, [map, getSelectedFeatures, initCanvas, renderCanvas]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearVisualization();
    };
  }, [clearVisualization]);

  return {
    visualizeFeature,
    clearVisualization
  };
}
