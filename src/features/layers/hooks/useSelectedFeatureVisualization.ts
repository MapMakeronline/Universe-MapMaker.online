/**
 * useSelectedFeatureVisualization Hook
 *
 * Provides functionality to visualize selected feature(s) from attribute table
 * with highlight and vertices (nodes) on the map - similar to QGIS selection.
 *
 * Features:
 * - Highlight selected geometry (fill + outline)
 * - Show vertices (nodes) as small circles
 * - Auto-cleanup on layer change or unmount
 *
 * Usage:
 * ```tsx
 * const { visualizeFeature, clearVisualization } = useSelectedFeatureVisualization();
 * visualizeFeature(featureId, layer, projectName);
 * ```
 */

import { useCallback, useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useGetSelectedFeaturesMutation } from '@/backend/layers';

// IMPORTANT: Use different IDs than useZoomToFeature to avoid conflicts
// useZoomToFeature uses: 'selected-feature-highlight', 'selected-feature-highlight-fill', 'selected-feature-highlight-outline'
// This hook uses: 'qgis-selection-*' prefix to differentiate
const HIGHLIGHT_LAYER_ID = 'qgis-selection-highlight';
const HIGHLIGHT_FILL_LAYER_ID = 'qgis-selection-fill';
const HIGHLIGHT_OUTLINE_LAYER_ID = 'qgis-selection-outline';
const VERTICES_LAYER_ID = 'qgis-selection-vertices';
const HIGHLIGHT_SOURCE_ID = 'qgis-selection-source';
const VERTICES_SOURCE_ID = 'qgis-selection-vertices-source';

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
 * Hook for visualizing selected feature with highlight and vertices
 *
 * @param mapInstanceOverride - Optional map instance override (for components outside MapProvider)
 * @returns Object with visualizeFeature and clearVisualization functions
 */
export function useSelectedFeatureVisualization(mapInstanceOverride?: any) {
  const { current: mapFromContext } = useMap();
  const map = mapInstanceOverride || mapFromContext;
  const [getSelectedFeatures] = useGetSelectedFeaturesMutation();

  /**
   * Removes existing highlight and vertices layers
   */
  const clearVisualization = useCallback(() => {
    if (!map) return;

    try {
      // Remove layers (in reverse order)
      if (map.getLayer(VERTICES_LAYER_ID)) {
        map.removeLayer(VERTICES_LAYER_ID);
      }
      if (map.getLayer(HIGHLIGHT_OUTLINE_LAYER_ID)) {
        map.removeLayer(HIGHLIGHT_OUTLINE_LAYER_ID);
      }
      if (map.getLayer(HIGHLIGHT_FILL_LAYER_ID)) {
        map.removeLayer(HIGHLIGHT_FILL_LAYER_ID);
      }
      if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
        map.removeLayer(HIGHLIGHT_LAYER_ID);
      }

      // Remove sources
      if (map.getSource(VERTICES_SOURCE_ID)) {
        map.removeSource(VERTICES_SOURCE_ID);
      }
      if (map.getSource(HIGHLIGHT_SOURCE_ID)) {
        map.removeSource(HIGHLIGHT_SOURCE_ID);
      }

      console.log('[Feature Visualization] ✨ Cleared previous visualization');
    } catch (error) {
      console.debug('[Feature Visualization] Cleanup error (map may be destroyed):', error);
    }
  }, [map]);

  /**
   * Visualizes selected feature with highlight and vertices
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
    console.log('[Feature Visualization] 🎨 Starting visualization:', {
      featureId,
      layerName: layer.name
    });

    if (!map) {
      console.error('[Feature Visualization] ❌ Map not ready');
      return;
    }

    try {
      // Clear previous visualization
      clearVisualization();

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
        console.error('[Feature Visualization] ❌ Backend returned undefined/null response');
        return;
      }

      // Parse response if string
      let parsedResponse = response;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error('[Feature Visualization] ❌ Failed to parse response:', e);
          return;
        }
      }

      const actualData = (parsedResponse as any).data || parsedResponse;

      if (!actualData.features || actualData.features.length === 0) {
        console.error('[Feature Visualization] ❌ No features returned');
        return;
      }

      const feature = actualData.features[0];
      console.log('[Feature Visualization] ✅ Feature received:', {
        id: feature.id,
        geometryType: feature.geometry.type,
        bbox: feature.bbox
      });

      // Add highlight source
      console.log('[Feature Visualization] 🎨 Adding highlight source...');
      map.addSource(HIGHLIGHT_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [feature]
        }
      });
      console.log('[Feature Visualization] ✅ Highlight source added');

      // Get all map layers to analyze rendering order
      const layers = map.getStyle().layers;

      // STRATEGY: Add visualization layers at the very top (no beforeId)
      // This ensures they render above all other layers, including QGIS project layers
      // Labels will still be readable as they typically render last
      const firstLabelLayerId = undefined; // Force top of stack

      console.log('[Feature Visualization] 🔍 Map layers analysis:', {
        totalLayers: layers.length,
        strategy: 'Add to top of layer stack (above all layers)',
        willInsertBefore: firstLabelLayerId || 'TOP OF STACK (above everything)'
      });

      // Style based on geometry type
      console.log('[Feature Visualization] 🎨 Adding style layers for geometry type:', feature.geometry.type);

      if (feature.geometry.type.includes('Polygon')) {
        // Polygon fill (yellow with transparency)
        console.log('[Feature Visualization] 🟡 Adding polygon fill layer...');
        map.addLayer({
          id: HIGHLIGHT_FILL_LAYER_ID,
          type: 'fill',
          source: HIGHLIGHT_SOURCE_ID,
          paint: {
            'fill-color': '#ffff00', // Yellow
            'fill-opacity': 0.5
          }
        }, firstLabelLayerId); // Insert before first label layer
        console.log('[Feature Visualization] ✅ Polygon fill layer added');

        // Polygon outline (red) - add on top of fill
        console.log('[Feature Visualization] 🔴 Adding polygon outline layer...');
        map.addLayer({
          id: HIGHLIGHT_OUTLINE_LAYER_ID,
          type: 'line',
          source: HIGHLIGHT_SOURCE_ID,
          paint: {
            'line-color': '#ff0000', // Red
            'line-width': 3
          }
        }, firstLabelLayerId); // Insert before first label layer
        console.log('[Feature Visualization] ✅ Polygon outline layer added');
      } else if (feature.geometry.type.includes('LineString')) {
        // LineString (red)
        console.log('[Feature Visualization] 🔴 Adding LineString layer...');
        map.addLayer({
          id: HIGHLIGHT_LAYER_ID,
          type: 'line',
          source: HIGHLIGHT_SOURCE_ID,
          paint: {
            'line-color': '#ff0000', // Red
            'line-width': 4
          }
        }, firstLabelLayerId);
        console.log('[Feature Visualization] ✅ LineString layer added');
      } else if (feature.geometry.type.includes('Point')) {
        // Point (red with white outline)
        console.log('[Feature Visualization] 🔴 Adding Point layer...');
        map.addLayer({
          id: HIGHLIGHT_LAYER_ID,
          type: 'circle',
          source: HIGHLIGHT_SOURCE_ID,
          paint: {
            'circle-color': '#ff0000', // Red
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        }, firstLabelLayerId);
        console.log('[Feature Visualization] ✅ Point layer added');
      }

      // Extract vertices
      const vertices = extractVertices(feature.geometry);
      console.log('[Feature Visualization] 📍 Extracted vertices:', vertices.length);

      // Add vertices layer (small black circles with white stroke)
      console.log('[Feature Visualization] ⚫ Adding vertices source...');
      map.addSource(VERTICES_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: vertices.map((coord, index) => ({
            type: 'Feature',
            id: index,
            geometry: {
              type: 'Point',
              coordinates: coord
            },
            properties: {
              vertexIndex: index
            }
          }))
        }
      });
      console.log('[Feature Visualization] ✅ Vertices source added');

      console.log('[Feature Visualization] ⚫ Adding vertices layer...');
      map.addLayer({
        id: VERTICES_LAYER_ID,
        type: 'circle',
        source: VERTICES_SOURCE_ID,
        paint: {
          'circle-color': '#000000', // Black
          'circle-radius': 5,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff' // White outline
        }
      }, firstLabelLayerId); // Insert before labels so vertices are visible
      console.log('[Feature Visualization] ✅ Vertices layer added');

      console.log('[Feature Visualization] ✅ Visualization complete - All layers added!');

    } catch (error: any) {
      // Don't log as error if it's just missing geometry (expected for ~20% of features)
      const isMissingGeometry = error?.data?.includes('Nie znaleziono geometrii');

      if (isMissingGeometry) {
        console.warn('[Feature Visualization] ⚠️ No geometry for this feature (expected for descriptive layers)');
      } else {
        console.error('[Feature Visualization] ❌ Error:', error);
      }
    }
  }, [map, getSelectedFeatures, clearVisualization]);

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
