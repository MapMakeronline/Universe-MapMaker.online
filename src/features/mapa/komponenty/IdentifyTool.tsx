'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { mapLogger } from '@/tools/logger';
import IdentifyModal from '@/features/layers/modals/IdentifyModal';
import { setDrawMode } from '@/redux/slices/drawSlice';
import { useIdentifyFeatureMutation } from '@/backend/layers';
import { useSearchParams } from 'next/navigation';
import { getQGISFeatureInfoMultiLayer } from '@/lib/qgis/getFeatureInfo';

interface FeatureProperty {
  key: string;
  value: any;
}

interface IdentifiedFeature {
  layer: string;
  sourceLayer?: string;
  properties: FeatureProperty[];
  geometry?: {
    type: string;
    coordinates?: any;
  };
  isBuilding3D?: boolean;
  buildingId?: string;
}

const IdentifyTool = () => {
  const { current: mapRef } = useMap();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const projectName = searchParams.get('project') || 'graph'; // Get project name from URL

  // Backend mutation for identify feature
  const [identifyFeature, { isLoading: isIdentifyingBackend }] = useIdentifyFeatureMutation();

  const { identify } = useAppSelector((state) => state.draw);
  const layers = useAppSelector((state) => state.layers.layers); // Get layer tree

  const [modalOpen, setModalOpen] = useState(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<IdentifiedFeature[]>([]);
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | undefined>();
  const [isIdentifyingQGIS, setIsIdentifyingQGIS] = useState(false);

  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();
    if (!map) return;

    // Only handle clicks when identify mode is active
    if (!identify.isActive) return;

    // IMPORTANT: Disable drawing mode when identify is active
    dispatch(setDrawMode('simple_select'));
    mapLogger.log('🔍 Identify: Disabled drawing mode (switched to simple_select)');

    // Track touch start for tap vs drag detection (mobile)
    let touchStartPt: { x: number; y: number } | null = null;

    const handleMapClick = async (e: any) => {
      mapLogger.log('🔍 Identify: Click received', {
        isActive: identify.isActive,
        point: [e.lngLat.lng, e.lngLat.lat],
      });

      // ==================== QUERY BACKEND API (POST /api/layer/feature/coordinates) ====================
      // Get visible QGIS layers from layer tree
      const getVisibleLayers = () => {
        const visible: Array<{ id: string; name: string; type: string }> = [];

        const traverse = (items: any[]) => {
          items.forEach((item) => {
            if (item.type === 'group' && item.children) {
              traverse(item.children);
            } else if (item.visible && item.id && item.name) {
              // Determine layer type from geometry
              const layerType = item.geometry?.toLowerCase() === 'point' ? 'point'
                : item.geometry?.toLowerCase()?.includes('line') ? 'line'
                : 'polygon'; // Default to polygon

              visible.push({
                id: item.id,
                name: item.name,
                type: layerType,
              });
            }
          });
        };

        traverse(layers);
        return visible;
      };

      const visibleLayers = getVisibleLayers();

      mapLogger.log('🔍 Identify: Querying backend API', {
        projectName,
        layerCount: visibleLayers.length,
        point: [e.lngLat.lng, e.lngLat.lat],
      });

      // Query layers using BOTH Backend API + QGIS OWS
      if (projectName && visibleLayers.length > 0) {
        try {
          // ========== QGIS OWS GetFeatureInfo (Primary source) ==========
          setIsIdentifyingQGIS(true);
          const canvas = map.getCanvas();
          const qgisLayerNames = visibleLayers.map(l => l.name);

          mapLogger.log('🔍 Querying QGIS Server OWS', {
            layerCount: qgisLayerNames.length,
            layers: qgisLayerNames,
          });

          const qgisResult = await getQGISFeatureInfoMultiLayer(
            {
              project: projectName,
              clickPoint: e.lngLat,
              bounds: map.getBounds(),
              width: canvas.width,
              height: canvas.height,
              featureCount: 10,
            },
            qgisLayerNames
          );

          setIsIdentifyingQGIS(false);

          // Transform QGIS features to IdentifiedFeature format
          const qgisFeatures: IdentifiedFeature[] = qgisResult.features.map((feature: any) => {
            const properties: FeatureProperty[] = Object.entries(feature.properties || {}).map(
              ([key, value]) => ({ key, value })
            );

            // Extract layer name from feature.id (format: "layerName.featureId")
            const layerName = feature.id?.split('.')[0] || 'Unknown';

            return {
              layer: layerName,
              sourceLayer: 'QGIS Server',
              properties,
              geometry: feature.geometry,
            };
          });

          mapLogger.log('✅ QGIS OWS results', {
            totalFeatures: qgisFeatures.length,
          });

          // ========== Backend API (Fallback/Additional source) ==========
          // Create bbox for better polygon/line detection (pixel tolerance)
          const pixelTolerance = 5; // 5 pixels around click point
          const point = map.project([e.lngLat.lng, e.lngLat.lat]);
          const bbox = [
            map.unproject([point.x - pixelTolerance, point.y - pixelTolerance]),
            map.unproject([point.x + pixelTolerance, point.y + pixelTolerance]),
          ];

          const allResults = await Promise.all(
            visibleLayers.map(async (layer) => {
              try {
                // Use bbox for polygon layers (better tolerance), point for others
                const queryParams = layer.type === 'polygon'
                  ? {
                      project: projectName,
                      layer_id: layer.id,
                      bbox: [[bbox[0].lng, bbox[0].lat], [bbox[1].lng, bbox[1].lat]],
                      layer_type: layer.type as 'point' | 'line' | 'polygon',
                    }
                  : {
                      project: projectName,
                      layer_id: layer.id,
                      point: [e.lngLat.lng, e.lngLat.lat],
                      layer_type: layer.type as 'point' | 'line' | 'polygon',
                    };

                const result = await identifyFeature(queryParams as any).unwrap();

                return {
                  layerName: layer.name,
                  features: result.data.features || [],
                };
              } catch (error) {
                mapLogger.warn(`⚠️ Backend API for ${layer.name} failed:`, error);
                return { layerName: layer.name, features: [] };
              }
            })
          );

          // Transform Backend API features to IdentifiedFeature format
          const backendFeatures: IdentifiedFeature[] = [];
          allResults.forEach(({ layerName, features: layerFeatures }) => {
            layerFeatures.forEach((feature: any) => {
              const properties: FeatureProperty[] = Object.entries(feature.properties || {}).map(
                ([key, value]) => ({ key, value })
              );

              backendFeatures.push({
                layer: layerName,
                sourceLayer: 'Backend API',
                properties,
                geometry: feature.geometry,
              });
            });
          });

          mapLogger.log('✅ Backend API results', {
            totalFeatures: backendFeatures.length,
            layers: allResults.map(r => ({ layer: r.layerName, count: r.features.length })),
          });

          // ========== Combine results (QGIS OWS primary, Backend API fallback) ==========
          // If QGIS OWS found features, use them. Otherwise use Backend API results.
          const combinedFeatures = qgisFeatures.length > 0 ? qgisFeatures : backendFeatures;

          mapLogger.log('📊 Combined results', {
            qgisCount: qgisFeatures.length,
            backendCount: backendFeatures.length,
            finalCount: combinedFeatures.length,
            source: qgisFeatures.length > 0 ? 'QGIS OWS' : 'Backend API',
          });

          setIdentifiedFeatures(combinedFeatures);
        } catch (error) {
          mapLogger.error('❌ Identify query failed:', error);
          setIsIdentifyingQGIS(false);
          setIdentifiedFeatures([]);
        }
      } else {
        // No visible layers
        setIdentifiedFeatures([]);
      }

      setClickCoordinates([e.lngLat.lng, e.lngLat.lat]);
      setModalOpen(true);
    };

    // 1) Desktop/Mobile: click handler (works after tap on mobile when no drag/pinch)
    map.on('click', handleMapClick);

    // 2) Mobile fallback: touchstart/touchend pattern (tap vs drag detection)
    const handleTouchStart = (e: any) => {
      if (e.points?.length === 1) {
        touchStartPt = { x: e.point.x, y: e.point.y };
      }
    };

    const handleTouchEnd = (e: any) => {
      if (e.points?.length !== 1 || !touchStartPt) {
        touchStartPt = null;
        return;
      }

      // Check if user moved finger (drag vs tap)
      const dx = Math.abs(e.point.x - touchStartPt.x);
      const dy = Math.abs(e.point.y - touchStartPt.y);
      const moved = Math.max(dx, dy) > 8; // 8px tolerance

      touchStartPt = null;

      if (moved) {
        mapLogger.log('🔍 Touch moved - ignoring (drag, not tap)');
        return; // Was a drag, not a tap
      }

      // Clean tap detected - trigger identify
      mapLogger.log('🔍 Clean tap detected (touchend fallback)');
      handleMapClick(e);
    };

    map.on('touchstart', handleTouchStart);
    map.on('touchend', handleTouchEnd);

    // Change cursor when identify mode is active
    if (identify.isActive) {
      map.getCanvas().style.cursor = 'help';
    } else {
      map.getCanvas().style.cursor = '';
    }

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.off('touchstart', handleTouchStart);
      map.off('touchend', handleTouchEnd);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, identify.isActive, dispatch, identifyFeature, projectName, layers]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setIdentifiedFeatures([]);
    setClickCoordinates(undefined);
  };

  return (
    <IdentifyModal
      open={modalOpen}
      onClose={handleCloseModal}
      features={identifiedFeatures}
      coordinates={clickCoordinates}
      isLoading={isIdentifyingBackend || isIdentifyingQGIS}
    />
  );
};

export default IdentifyTool;
