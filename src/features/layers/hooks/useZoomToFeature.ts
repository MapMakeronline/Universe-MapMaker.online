/**
 * useZoomToFeature Hook
 *
 * Provides functionality to zoom to selected feature(s) from attribute table
 * and highlight them temporarily on the map.
 *
 * Usage:
 * ```tsx
 * const zoomToFeature = useZoomToFeature();
 * zoomToFeature(featureId, layerDisplayName);
 * ```
 */

import { useCallback } from 'react';
import { useMap } from 'react-map-gl';
import { useGetSelectedFeaturesMutation } from '@/backend/layers';
import { useAppSelector } from '@/redux/hooks';
import type { QGISProjectTree, QGISLayerNode, isVectorLayer, isGroupLayer } from '@/types/qgis';

/**
 * Recursively search tree.json for layer by display name
 * Returns QGIS layer ID (UUID)
 */
function findLayerIdByName(
  nodes: QGISLayerNode[] | undefined,
  displayName: string
): string | null {
  if (!nodes) return null;

  for (const node of nodes) {
    // Check if current node matches
    if (node.name === displayName) {
      // Only vector layers have IDs
      if ('id' in node && node.type === 'VectorLayer') {
        return node.id;
      }
    }

    // Recursively search children (for groups)
    if ('children' in node && node.type === 'group') {
      const childResult = findLayerIdByName(node.children, displayName);
      if (childResult) return childResult;
    }
  }

  return null;
}

/**
 * Get QGIS layer ID from display name using tree.json
 */
function getQGISLayerId(
  projectData: any,
  layerDisplayName: string
): string | null {
  const tree = projectData?.tree as QGISProjectTree | undefined;
  if (!tree?.children) {
    console.warn('[Zoom to Feature] tree.json not available in project data');
    return null;
  }

  const layerId = findLayerIdByName(tree.children, layerDisplayName);
  if (!layerId) {
    console.warn(`[Zoom to Feature] Layer "${layerDisplayName}" not found in tree.json`);
    return null;
  }

  return layerId;
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
 * - Fetches feature geometry from backend (POST /api/layer/features/selected)
 * - Zooms map to feature bbox with smooth animation
 * - Highlights feature with orange fill + outline for 3 seconds
 * - Automatically converts layer display name to QGIS ID via tree.json
 *
 * @returns zoomToFeature function
 */
export function useZoomToFeature() {
  const { current: map } = useMap();
  const [getSelectedFeatures] = useGetSelectedFeaturesMutation();
  const currentProject = useAppSelector((state) => state.projects.currentProject);
  const projectData = useAppSelector((state) => state.projects.projectData);

  const zoomToFeature = useCallback(
    async (
      featureId: string | number,
      layerDisplayName: string
    ) => {
      if (!map) {
        console.warn('[Zoom to Feature] Map not ready');
        return;
      }

      if (!currentProject) {
        console.warn('[Zoom to Feature] No project selected');
        return;
      }

      try {
        console.log(`[Zoom to Feature] Zooming to feature ${featureId} in layer "${layerDisplayName}"`);

        // Convert layer display name to QGIS layer ID
        const qgisLayerId = getQGISLayerId(projectData, layerDisplayName);
        if (!qgisLayerId) {
          console.error(`[Zoom to Feature] Could not find QGIS layer ID for "${layerDisplayName}"`);
          return;
        }

        console.log(`[Zoom to Feature] QGIS layer ID: ${qgisLayerId}`);

        // Fetch feature geometry from backend
        const response = await getSelectedFeatures({
          project: currentProject,
          layer_id: qgisLayerId,
          label: [String(featureId)], // Convert to string array
        }).unwrap();

        if (!response.success || !response.data.features.length) {
          console.error('[Zoom to Feature] No geometry returned from backend');
          return;
        }

        const featureCollection = response.data;
        const bbox = featureCollection.bbox; // [minX, minY, maxX, maxY] in EPSG:3857

        console.log(`[Zoom to Feature] Got bbox:`, bbox);

        // Zoom to feature bbox with padding
        map.fitBounds(
          [
            [bbox[0], bbox[1]], // SW corner
            [bbox[2], bbox[3]], // NE corner
          ],
          {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1000, // Smooth animation (1 second)
            maxZoom: 18, // Don't zoom in too close for small features
          }
        );

        // Highlight feature on map (3 second highlight)
        highlightFeatureOnMap(map, featureCollection);

        console.log('[Zoom to Feature] Successfully zoomed to feature');
      } catch (error) {
        console.error('[Zoom to Feature] Error:', error);
      }
    },
    [map, currentProject, projectData, getSelectedFeatures]
  );

  return zoomToFeature;
}
