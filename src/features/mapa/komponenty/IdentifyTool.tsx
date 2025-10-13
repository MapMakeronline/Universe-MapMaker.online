'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { mapLogger } from '@/narzedzia/logger';
import IdentifyModal from '@/features/warstwy/modale/IdentifyModal';
import { addFeature, selectFeature, setAttributeModalOpen } from '@/redux/slices/featuresSlice';
import { setDrawMode } from '@/redux/slices/drawSlice';
import type { MapFeature } from '@/redux/slices/featuresSlice';
import { query3DBuildingsAtPoint, get3DBuildingsSource } from '@/mapbox/3d-picking';
import { detect3DLayers, has3DLayers } from '@/mapbox/3d-layer-detection';

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
  const { identify } = useAppSelector((state) => state.draw);
  const { features, selectedFeatureId } = useAppSelector((state) => state.features);
  const { mapStyleKey } = useAppSelector((state) => state.map);

  const [modalOpen, setModalOpen] = useState(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<IdentifiedFeature[]>([]);
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | undefined>();

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

    const handleMapClick = (e: any) => {
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

        setIdentifiedFeatures(transformed);
        setClickCoordinates([e.lngLat.lng, e.lngLat.lat]);
        setModalOpen(true);
      } else {
        // Show modal even with no features
        setIdentifiedFeatures([]);
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
  }, [mapRef, identify.isActive, mapStyleKey, dispatch, features]);

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
    />
  );
};

export default IdentifyTool;
