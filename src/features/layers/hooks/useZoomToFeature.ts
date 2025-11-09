/**
 * useZoomToFeature Hook
 *
 * Provides functionality to zoom to selected feature(s) from attribute table
 * and highlight them temporarily on the map.
 *
 * Uses direct QGIS Server WFS API (bypassing backend) to fetch feature geometry.
 *
 * Usage:
 * ```tsx
 * const zoomToFeature = useZoomToFeature(mapInstance);
 * zoomToFeature(featureId, layerObject);
 * ```
 */

import { useCallback } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { useGetSelectedFeaturesMutation } from '@/backend/layers';
import { showError, showSuccess } from '@/redux/slices/notificationSlice';
import type { LayerNode } from '@/types-app/layers';

/**
 * Get all coordinates from a geometry object (supports all GeoJSON geometry types)
 */
function getAllCoordinates(geometry: any): number[][] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];

    case 'LineString':
      return geometry.coordinates;

    case 'Polygon':
      return geometry.coordinates[0]; // Outer ring only

    case 'MultiPolygon':
      return geometry.coordinates.flat(2);

    case 'MultiLineString':
      return geometry.coordinates.flat();

    default:
      console.warn('[getAllCoordinates] Unknown geometry type:', geometry.type);
      return [];
  }
}

/**
 * Calculate bounding box from geometry [minLng, minLat, maxLng, maxLat]
 */
function calculateBBox(geometry: any): [number, number, number, number] {
  const coords = getAllCoordinates(geometry);

  if (coords.length === 0) {
    throw new Error('No coordinates found in geometry');
  }

  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);

  return [
    Math.min(...lngs), // minLng
    Math.min(...lats), // minLat
    Math.max(...lngs), // maxLng
    Math.max(...lats)  // maxLat
  ];
}

/**
 * Convert EPSG:3857 (Web Mercator) coordinates to WGS84 (lat/lng)
 * Backend returns bbox in meters, MapLibre expects degrees
 */
function epsg3857ToWGS84(x: number, y: number): [number, number] {
  const lng = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) / (Math.PI / 4) - 1) * 90;
  return [lng, lat];
}

/**
 * Highlight selected feature on map (temporary highlight layer)
 */
function highlightFeatureOnMap(map: any, featureCollection: any) {
  const sourceId = 'selected-feature-highlight';
  const fillLayerId = 'selected-feature-highlight-fill';
  const outlineLayerId = 'selected-feature-highlight-outline';

  // Remove existing highlight layers
  if (map.getLayer(outlineLayerId)) {
    map.removeLayer(outlineLayerId);
  }
  if (map.getLayer(fillLayerId)) {
    map.removeLayer(fillLayerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }

  // Add new highlight source
  map.addSource(sourceId, {
    type: 'geojson',
    data: featureCollection,
  });

  // Add fill layer (semi-transparent orange)
  map.addLayer({
    id: fillLayerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': '#ff9800', // Orange
      'fill-opacity': 0.3,
    },
  });

  // Add outline layer (dark orange, thick line)
  map.addLayer({
    id: outlineLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#ff5722', // Dark orange
      'line-width': 3,
    },
  });

  // Auto-remove highlight after 3 seconds
  setTimeout(() => {
    try {
      if (map.getLayer(outlineLayerId)) {
        map.removeLayer(outlineLayerId);
      }
      if (map.getLayer(fillLayerId)) {
        map.removeLayer(fillLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } catch (error) {
      // Ignore errors if map is already destroyed
      console.debug('[Zoom to Feature] Highlight cleanup error (map may be destroyed):', error);
    }
  }, 3000);
}

/**
 * Hook to zoom to selected feature from attribute table
 *
 * Features:
 * - Fetches feature geometry directly from QGIS Server WFS API
 * - Zooms map to feature bbox with smooth animation
 * - Highlights feature with orange fill + outline for 3 seconds
 * - Uses ogc_fid filter to get single feature
 *
 * @param mapInstanceOverride - Optional map instance override (for components outside MapProvider)
 * @returns zoomToFeature function
 */
export function useZoomToFeature(mapInstanceOverride?: any) {
  const { current: mapFromContext } = useMap();
  const map = mapInstanceOverride || mapFromContext; // Use override if provided, fallback to context
  const currentProject = useAppSelector((state) => state.projects.currentProject);
  const dispatch = useAppDispatch();
  const [getSelectedFeatures] = useGetSelectedFeaturesMutation();

  const zoomToFeature = useCallback(
    async (
      featureId: string | number,
      layer: LayerNode,
      rowData?: any // Optional row data from attribute table (may contain geometry)
    ) => {
      if (!map) {
        console.warn('[Zoom to Feature] Map not ready');
        return;
      }

      if (!currentProject) {
        console.warn('[Zoom to Feature] No project selected');
        return;
      }

      // Extract project name string from Project object
      const projectName = currentProject.project_name;

      if (!projectName) {
        console.error('[Zoom to Feature] Project name is undefined');
        return;
      }

      // Extract numeric ogc_fid from GML ID if needed
      // GML ID format: "Id<uuid>.<number>" → extract <number>
      let actualFeatureId = featureId;
      if (typeof featureId === 'string' && featureId.includes('.')) {
        const parts = featureId.split('.');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          actualFeatureId = parts[1]; // Extract numeric part
          console.log('[Zoom to Feature] Extracted numeric ID from GML ID:', {
            gmlId: featureId,
            numericId: actualFeatureId
          });
        }
      }

      // DEBUG: Check if rowData has geometry
      console.log('[Zoom to Feature] 🎯 Full debug:', {
        featureId,
        actualFeatureId,
        layerName: layer.name,
        layerId: layer.id,
        projectName,
        hasRowData: !!rowData,
        hasGeometry: !!rowData?.geometry,
        hasGeom: !!rowData?.geom,
        rowDataKeys: rowData ? Object.keys(rowData) : [],
        geometryType: rowData?.geometry?.type || rowData?.geom?.type,
        geometrySample: rowData?.geometry || rowData?.geom
      });

      // FAST PATH: Use geometry from rowData if available (no WFS request needed)
      const geometry = rowData?.geometry || rowData?.geom;

      if (geometry) {
        try {
          console.log('[Zoom to Feature] ✅ Using geometry from rowData (fast path)');
          const bbox = calculateBBox(geometry);

          console.log('[Zoom to Feature] Calculated bbox from rowData:', bbox);

          // Zoom to feature bbox with padding
          map.fitBounds(
            [
              [bbox[0], bbox[1]], // SW corner
              [bbox[2], bbox[3]], // NE corner
            ],
            {
              padding: { top: 100, bottom: 100, left: 100, right: 100 },
              duration: 1000,
              maxZoom: 18,
            }
          );

          // Highlight feature on map
          const featureCollection = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry,
              properties: rowData
            }]
          };
          highlightFeatureOnMap(map, featureCollection);

          console.log('[Zoom to Feature] ✅ Zoom complete (fast path)!');
          dispatch(showSuccess('Przybliżono do zaznaczonego obiektu'));
          return; // Exit early - no WFS request needed

        } catch (error) {
          console.error('[Zoom to Feature] ❌ Error with rowData geometry:', error);
          console.log('[Zoom to Feature] Falling back to WFS...');
          // Continue to WFS fallback below
        }
      }

      // BACKEND PATH: No geometry in rowData, fetch from backend endpoint
      console.log('[Zoom to Feature] ⚠️ No geometry in rowData, using backend API');

      try {
        console.log(`[Zoom to Feature] Fetching from backend:`, {
          featureId,
          layerName: layer.name,
          layerId: layer.id,
          projectName,
        });

        // Call backend endpoint POST /api/layer/features/selected
        const response = await getSelectedFeatures({
          project: projectName,
          layer_id: layer.id, // QGIS layer ID (UUID)
          label: [String(actualFeatureId)], // Backend expects array of feature IDs (numeric ogc_fid)
        }).unwrap();

        console.log('[Zoom to Feature] ✅ Backend response (raw):', response);
        console.log('[Zoom to Feature] 🔍 Response type:', typeof response);

        // Handle undefined or null response
        if (!response) {
          console.error('[Zoom to Feature] ❌ Backend returned undefined/null response');
          dispatch(showError('Nie można przybliżyć do obiektu: Brak odpowiedzi z serwera'));
          return;
        }

        // IMPORTANT: RTK Query might return JSON string instead of parsed object
        // Parse if string, otherwise use as-is
        let parsedResponse = response;
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
            console.log('[Zoom to Feature] ✅ Parsed string to object:', parsedResponse);
          } catch (e) {
            console.error('[Zoom to Feature] ❌ Failed to parse response:', e);
            dispatch(showError('Nie można przybliżyć do obiektu: Nieprawidłowa odpowiedź z serwera'));
            return;
          }
        }

        // Backend returns {data: {...}, success: true, message: ""}
        // Extract the actual FeatureCollection from 'data' field
        const actualData = (parsedResponse as any).data || parsedResponse;

        console.log('[Zoom to Feature] 🔍 Response validation:', {
          hasData: !!(response as any).data,
          hasFeatures: !!actualData.features,
          featuresLength: actualData.features?.length,
          responseType: actualData.type,
          hasBbox: !!actualData.bbox,
          actualDataKeys: Object.keys(actualData || {})
        });

        if (!actualData.features || actualData.features.length === 0) {
          console.error('[Zoom to Feature] ❌ No features returned from backend', {
            features: actualData.features,
            length: actualData.features?.length
          });
          return;
        }

        const feature = actualData.features[0];

        if (!feature.bbox) {
          console.error('[Zoom to Feature] ❌ No bbox in feature response');
          return;
        }

        // Backend returns bbox in EPSG:3857 (Web Mercator meters): [minX, minY, maxX, maxY]
        const [minX, minY, maxX, maxY] = feature.bbox;

        console.log('[Zoom to Feature] 📍 Backend bbox (EPSG:3857):', feature.bbox);

        // Convert EPSG:3857 (meters) to WGS84 (lat/lng degrees) for MapLibre
        const [minLng, minLat] = epsg3857ToWGS84(minX, minY);
        const [maxLng, maxLat] = epsg3857ToWGS84(maxX, maxY);

        console.log('[Zoom to Feature] 🌍 Converted to WGS84:', {
          sw: [minLng, minLat],
          ne: [maxLng, maxLat]
        });

        // Zoom to feature bbox with padding
        map.fitBounds(
          [
            [minLng, minLat], // SW corner
            [maxLng, maxLat], // NE corner
          ],
          {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1000, // Smooth animation (1 second)
            maxZoom: 18, // Don't zoom in too close for small features
          }
        );

        // Highlight feature on map (3 second highlight)
        const featureCollection = {
          type: 'FeatureCollection',
          features: [feature]
        };
        highlightFeatureOnMap(map, featureCollection);

        console.log('[Zoom to Feature] ✅ Successfully zoomed to feature (backend path)');
        dispatch(showSuccess('Przybliżono do zaznaczonego obiektu'));
      } catch (error: any) {
        console.error('[Zoom to Feature] ❌ Error:', error);
        console.error('[Zoom to Feature] 🔍 Error details:', {
          status: error?.status,
          data: error?.data,
          message: error?.message,
          fullError: error
        });

        // Log request details for debugging
        console.error('[Zoom to Feature] 📤 Request that failed:', {
          endpoint: '/api/layer/features/selected',
          method: 'POST',
          body: {
            project: projectName,
            layer_id: layer.id,
            label: [String(actualFeatureId)]
          },
          layerInfo: {
            name: layer.name,
            id: layer.id,
            type: layer.type
          }
        });

        // Parse backend error message
        let errorMessage = 'Nie udało się przybliżyć do obiektu';
        let detailedMessage = '';

        if (error?.data) {
          try {
            const parsed = typeof error.data === 'string' ? JSON.parse(error.data) : error.data;
            if (parsed.message) {
              errorMessage = parsed.message;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        console.warn(`[Zoom to Feature] Backend error: ${errorMessage}`);
        console.warn('[Zoom to Feature] 💡 Possible causes:');
        console.warn('  1. Feature ID not found in database (check if ogc_fid exists)');
        console.warn('  2. Layer ID mismatch (check tree.json vs database)');
        console.warn('  3. Backend SQL query issue (check Django logs)');
        console.warn('  4. Missing geometry column in layer table');
        console.warn('  5. NULL or invalid geometry for this feature');

        // Provide user-friendly explanation based on error type
        if (errorMessage.includes('Nie znaleziono geometrii')) {
          detailedMessage = 'Ten obiekt nie ma zapisanej geometrii w bazie danych. Może być to warstwa opisowa (bez geometrii) lub brakujące dane.';
        } else if (errorMessage.includes('Nie znaleziono warstwy')) {
          detailedMessage = 'Warstwa nie została znaleziona w projekcie. Spróbuj odświeżyć projekt.';
        } else if (errorMessage.includes('Nie znaleziono kolumny')) {
          detailedMessage = 'Warstwa nie ma kolumny geometrii. To może być tabela opisowa bez danych przestrzennych.';
        } else {
          detailedMessage = errorMessage;
        }

        // Show user-friendly error notification
        dispatch(showError(`Nie można przybliżyć do obiektu: ${detailedMessage}`));
      }
    },
    [map, currentProject, getSelectedFeatures, dispatch]
  );

  return zoomToFeature;
}
