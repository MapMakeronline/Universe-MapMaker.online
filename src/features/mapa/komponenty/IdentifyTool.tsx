'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { mapLogger } from '@/tools/logger';
import IdentifyModal from '@/features/layers/modals/IdentifyModal';
import { addFeature, selectFeature, setAttributeModalOpen } from '@/redux/slices/featuresSlice';
import { setDrawMode } from '@/redux/slices/drawSlice';
import type { MapFeature } from '@/redux/slices/featuresSlice';
import { query3DBuildingsAtPoint, get3DBuildingsSource } from '@/mapbox/3d-picking';
import { detect3DLayers, has3DLayers } from '@/mapbox/3d-layer-detection';
import { getQGISFeatureInfoMultiLayer, type QGISFeature } from '@/lib/qgis/getFeatureInfo';
import { useSearchParams } from 'next/navigation';

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

  const { identify } = useAppSelector((state) => state.draw);
  const { features, selectedFeatureId } = useAppSelector((state) => state.features);
  const layers = useAppSelector((state) => state.layers.layers); // Get layer tree

  // PERFORMANCE: Subscribe only to mapStyleKey (not entire state.map)
  // Prevents re-render when viewState changes during map panning
  const mapStyleKey = useAppSelector((state) => state.map.mapStyleKey);

  const [modalOpen, setModalOpen] = useState(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<IdentifiedFeature[]>([]);
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | undefined>();
  const [isLoadingQGIS, setIsLoadingQGIS] = useState(false);

  const selectedFeatureIdRef = useRef(selectedFeatureId);

  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId;
  }, [selectedFeatureId]);

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
      mapLogger.log('🔍 Identify: Click/Tap received', {
        isActive: identify.isActive,
        point: e.point,
        lngLat: e.lngLat
      });

      // ==================== UNIVERSAL 3D PICKING ====================
      // Check if map has ANY 3D layers (not just '3d-buildings')
      const mapHas3DLayers = has3DLayers(map);
      const layers3D = mapHas3DLayers ? detect3DLayers(map) : [];

      mapLogger.log('🔍 Identify: Universal 3D layer detection', {
        has3DLayers: mapHas3DLayers,
        layerCount: layers3D.length,
        layers: layers3D,
        pitch: map.getPitch(),
        bearing: map.getBearing()
      });

      // Use 3D picking utility for ALL 3D layers (works with any camera angle!)
      const building3DFeatures = mapHas3DLayers
        ? query3DBuildingsAtPoint(map, e.point, 12) // 12px tolerance (increased from 8px)
        : [];

      const is3DBuilding = building3DFeatures.length > 0;

      mapLogger.log('🔍 Identify: 3D Picking results', {
        has3DLayers: mapHas3DLayers,
        building3DCount: building3DFeatures.length,
        layers3D: layers3D,
        pitch: map.getPitch(),
        bearing: map.getBearing()
      });

      // Query regular features with bbox tolerance (8px pad)
      const pad = 8;
      const bbox: [[number, number], [number, number]] = [
        [e.point.x - pad, e.point.y - pad],
        [e.point.x + pad, e.point.y + pad],
      ];

      const queriedFeatures = map.queryRenderedFeatures(bbox);

      mapLogger.log('🔍 Identify: Found features', {
        totalCount: queriedFeatures.length,
        building3DCount: building3DFeatures.length,
        bbox
      });

      if (is3DBuilding || queriedFeatures.length > 0) {
        // ==================== HANDLE 3D BUILDINGS (PRIORITY) ====================

        if (is3DBuilding) {
          // Use the closest building from 3D picking (already sorted by distance)
          const firstFeature = building3DFeatures[0];
          // Handle 3D building selection
          const featureId = firstFeature.id?.toString() || `building-${Date.now()}`;

          mapLogger.log('🏢 Identify: 3D Building selected', {
            id: featureId,
            properties: firstFeature.properties
          });

          // Trigger haptic feedback on mobile
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          // Check if building already exists in store
          let building = features[featureId];

          if (!building) {
            // Create new building entry from Mapbox feature
            const coordinates: [number, number] = firstFeature.geometry?.type === 'Point'
              ? (firstFeature.geometry.coordinates as [number, number])
              : [e.lngLat.lng, e.lngLat.lat];

            const mapFeature: MapFeature = {
              id: featureId,
              type: 'building',
              name: firstFeature.properties?.name || `Budynek ${featureId}`,
              layer: '3d-buildings',
              sourceLayer: 'building',
              coordinates,
              geometry: firstFeature.geometry,
              attributes: Object.entries(firstFeature.properties || {}).map(([key, value]) => ({
                key,
                value: value as string | number
              })),
              selected: false,
            };

            dispatch(addFeature(mapFeature));
          }

          // Select building and open universal feature modal
          dispatch(selectFeature(featureId));
          dispatch(setAttributeModalOpen(true));

          // Update feature state for visual feedback (ORANGE HIGHLIGHT)
          // Use 3D picking utility to detect source
          const buildingSource = get3DBuildingsSource(map);

          const prevSelectedId = selectedFeatureIdRef.current;
          if (prevSelectedId && prevSelectedId !== featureId) {
            // Remove previous selection
            try {
              map.removeFeatureState({
                source: buildingSource,
                sourceLayer: 'building',
                id: prevSelectedId
              });
            } catch (e) {
              // Ignore errors if feature doesn't exist
            }
          }

          // Highlight selected building
          try {
            map.setFeatureState(
              {
                source: buildingSource,
                sourceLayer: 'building',
                id: featureId
              },
              { selected: true }
            );
            mapLogger.log('✅ Building feature state updated', { source: buildingSource, id: featureId });
          } catch (e) {
            mapLogger.error('Failed to set feature state:', e);
          }

          // Don't show identify modal for 3D buildings
          return;
        }

        // Handle regular features (exclude ALL 3D layers, not just '3d-buildings')
        const regularFeatures = queriedFeatures.filter(f => {
          const layerId = f.layer?.id;
          if (!layerId) return true; // Keep features without layer ID

          // Filter out ALL 3D layers (universal detection)
          return !layers3D.includes(layerId);
        });

        mapLogger.log('🔍 Identify: Regular features after 3D filtering', {
          total: queriedFeatures.length,
          regular: regularFeatures.length,
          filtered3D: queriedFeatures.length - regularFeatures.length
        });

        if (regularFeatures.length > 0) {
          // For the first feature, create a MapFeature and store it
          const firstFeature = regularFeatures[0];
          const featureId = firstFeature.id?.toString() || `feature-${Date.now()}`;

          // Check if feature already exists in store
          if (!features[featureId]) {
            const coordinates: [number, number] = firstFeature.geometry?.type === 'Point'
              ? (firstFeature.geometry.coordinates as [number, number])
              : [e.lngLat.lng, e.lngLat.lat];

            const mapFeature: MapFeature = {
              id: featureId,
              type: 'poi', // Default type for regular features
              name: firstFeature.properties?.name || firstFeature.layer?.id || 'Nieznany obiekt',
              layer: firstFeature.layer?.id,
              sourceLayer: firstFeature.sourceLayer,
              coordinates,
              geometry: firstFeature.geometry,
              attributes: Object.entries(firstFeature.properties || {}).map(([key, value]) => ({
                key,
                value: value as string | number
              })),
              selected: false,
            };

            dispatch(addFeature(mapFeature));
          }
        }

        // Transform regular features for IdentifyModal display (exclude 3D buildings already handled)
        const transformed: IdentifiedFeature[] = regularFeatures.map((feature: any) => {
          const properties: FeatureProperty[] = Object.entries(feature.properties || {}).map(
            ([key, value]) => ({
              key,
              value,
            })
          );

          return {
            layer: feature.layer?.id || 'Unknown Layer',
            sourceLayer: feature.sourceLayer,
            properties,
            geometry: feature.geometry ? {
              type: feature.geometry.type,
              coordinates: feature.geometry.coordinates,
            } : undefined,
          };
        });

        // ==================== QUERY QGIS SERVER (WMS/WFS LAYERS) ====================
        // Get visible QGIS layers from layer tree
        const getVisibleQGISLayers = (): string[] => {
          const visibleLayers: string[] = [];

          const traverse = (items: any[]) => {
            items.forEach((item) => {
              if (item.type === 'group' && item.children) {
                traverse(item.children);
              } else if (item.type === 'layer' && item.visible && item.name) {
                // Only query QGIS layers (not Mapbox layers)
                // QGIS layers have specific properties from tree.json
                visibleLayers.push(item.name);
              }
            });
          };

          traverse(layers);
          return visibleLayers;
        };

        const qgisLayers = getVisibleQGISLayers();

        mapLogger.log('🗺️ Identify: Querying QGIS Server layers', {
          projectName,
          layerCount: qgisLayers.length,
          layers: qgisLayers
        });

        // Query QGIS Server if project and layers exist
        if (projectName && qgisLayers.length > 0) {
          try {
            setIsLoadingQGIS(true);

            const canvas = map.getCanvas();
            const qgisResult = await getQGISFeatureInfoMultiLayer(
              {
                project: projectName,
                clickPoint: e.lngLat,
                bounds: map.getBounds(),
                width: canvas.width,
                height: canvas.height,
                featureCount: 10,
              },
              qgisLayers
            );

            mapLogger.log('✅ QGIS Server response', {
              featureCount: qgisResult.features.length,
              features: qgisResult.features.map(f => ({
                id: f.id,
                properties: Object.keys(f.properties)
              }))
            });

            // Transform QGIS features to IdentifiedFeature format
            const qgisTransformed: IdentifiedFeature[] = qgisResult.features.map((feature: QGISFeature) => {
              const properties: FeatureProperty[] = Object.entries(feature.properties).map(
                ([key, value]) => ({
                  key,
                  value,
                })
              );

              // Extract layer name from feature ID (e.g., "test.88" → "test")
              const layerName = feature.id.split('.')[0];

              return {
                layer: layerName,
                sourceLayer: 'QGIS WMS',
                properties,
                geometry: feature.geometry ? {
                  type: feature.geometry.type,
                  coordinates: feature.geometry.coordinates,
                } : undefined,
              };
            });

            // Combine Mapbox features with QGIS features
            const allFeatures = [...transformed, ...qgisTransformed];

            mapLogger.log('🔍 Identify: Combined results', {
              mapboxFeatures: transformed.length,
              qgisFeatures: qgisTransformed.length,
              total: allFeatures.length
            });

            setIdentifiedFeatures(allFeatures);
          } catch (error) {
            mapLogger.error('❌ QGIS Server query failed:', error);
            // Show only Mapbox features if QGIS query fails
            setIdentifiedFeatures(transformed);
          } finally {
            setIsLoadingQGIS(false);
          }
        } else {
          // No QGIS layers, show only Mapbox features
          setIdentifiedFeatures(transformed);
        }

        setClickCoordinates([e.lngLat.lng, e.lngLat.lat]);
        setModalOpen(true);
      } else {
        // No Mapbox features found - try QGIS Server only
        const getVisibleQGISLayers = (): string[] => {
          const visibleLayers: string[] = [];

          const traverse = (items: any[]) => {
            items.forEach((item) => {
              if (item.type === 'group' && item.children) {
                traverse(item.children);
              } else if (item.type === 'layer' && item.visible && item.name) {
                visibleLayers.push(item.name);
              }
            });
          };

          traverse(layers);
          return visibleLayers;
        };

        const qgisLayers = getVisibleQGISLayers();

        if (projectName && qgisLayers.length > 0) {
          try {
            setIsLoadingQGIS(true);

            const canvas = map.getCanvas();
            const qgisResult = await getQGISFeatureInfoMultiLayer(
              {
                project: projectName,
                clickPoint: e.lngLat,
                bounds: map.getBounds(),
                width: canvas.width,
                height: canvas.height,
                featureCount: 10,
              },
              qgisLayers
            );

            if (qgisResult.features.length > 0) {
              // Transform QGIS features
              const qgisTransformed: IdentifiedFeature[] = qgisResult.features.map((feature: QGISFeature) => {
                const properties: FeatureProperty[] = Object.entries(feature.properties).map(
                  ([key, value]) => ({
                    key,
                    value,
                  })
                );

                const layerName = feature.id.split('.')[0];

                return {
                  layer: layerName,
                  sourceLayer: 'QGIS WMS',
                  properties,
                  geometry: feature.geometry ? {
                    type: feature.geometry.type,
                    coordinates: feature.geometry.coordinates,
                  } : undefined,
                };
              });

              setIdentifiedFeatures(qgisTransformed);
            } else {
              // No features from QGIS either
              setIdentifiedFeatures([]);
            }
          } catch (error) {
            mapLogger.error('❌ QGIS Server query failed:', error);
            setIdentifiedFeatures([]);
          } finally {
            setIsLoadingQGIS(false);
          }
        } else {
          // No QGIS layers
          setIdentifiedFeatures([]);
        }

        setClickCoordinates([e.lngLat.lng, e.lngLat.lat]);
        setModalOpen(true);
      }
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
  }, [mapRef, identify.isActive, mapStyleKey, dispatch, features, projectName, layers]);

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
      isLoading={isLoadingQGIS}
    />
  );
};

export default IdentifyTool;
