'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { mapLogger } from '@/lib/logger';
import IdentifyModal from '../panels/IdentifyModal';
import { addFeature, selectFeature, setAttributeModalOpen } from '@/store/slices/featuresSlice';
import { setDrawMode } from '@/store/slices/drawSlice';
import type { MapFeature } from '@/store/slices/featuresSlice';

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

      // Query with bbox tolerance (8px pad for better mobile hit detection)
      const pad = 8;
      const bbox: [[number, number], [number, number]] = [
        [e.point.x - pad, e.point.y - pad],
        [e.point.x + pad, e.point.y + pad],
      ];

      const queriedFeatures = map.queryRenderedFeatures(bbox);

      mapLogger.log('🔍 Identify: Found features', {
        count: queriedFeatures.length,
        bbox
      });

      if (queriedFeatures.length > 0) {
        // Check if we're in 3D mode and if ANY feature is a 3D building
        const is3DMode = mapStyleKey === 'buildings3d' || mapStyleKey === 'full3d';

        // Find first 3D building in features (skip labels and other layers)
        const buildingFeature = queriedFeatures.find(f => f.layer?.id === '3d-buildings');
        const is3DBuilding = is3DMode && buildingFeature;

        if (is3DBuilding) {
          // Use the building feature, not the first feature
          const firstFeature = buildingFeature;
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

          // Update feature state for visual feedback
          const prevSelectedId = selectedFeatureIdRef.current;
          if (prevSelectedId && prevSelectedId !== featureId) {
            // Remove previous selection
            try {
              map.removeFeatureState({
                source: 'composite',
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
                source: 'composite',
                sourceLayer: 'building',
                id: featureId
              },
              { selected: true }
            );
          } catch (e) {
            mapLogger.error('Failed to set feature state:', e);
          }

          // Don't show identify modal for 3D buildings
          return;
        }

        // Handle regular features (non-3D buildings)
        const regularFeatures = queriedFeatures.filter(f => f.layer?.id !== '3d-buildings');

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
