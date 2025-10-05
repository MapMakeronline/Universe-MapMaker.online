'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { mapLogger } from '@/lib/logger';
import IdentifyModal from '../panels/IdentifyModal';
import { addBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';
import { setDrawMode } from '@/store/slices/drawSlice';

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
  const { buildings, selectedBuildingId } = useAppSelector((state) => state.buildings);
  const { mapStyleKey } = useAppSelector((state) => state.map);

  const [modalOpen, setModalOpen] = useState(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<IdentifiedFeature[]>([]);
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | undefined>();

  const selectedBuildingIdRef = useRef(selectedBuildingId);

  useEffect(() => {
    selectedBuildingIdRef.current = selectedBuildingId;
  }, [selectedBuildingId]);

  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();
    if (!map) return;

    // Only handle clicks when identify mode is active
    if (!identify.isActive) return;

    // IMPORTANT: Disable drawing mode when identify is active
    dispatch(setDrawMode('simple_select'));
    mapLogger.log('🔍 Identify: Disabled drawing mode (switched to simple_select)');

    const handleMapClick = (e: any) => {
      mapLogger.log('🔍 Identify: Click received', {
        isActive: identify.isActive,
        point: e.point,
        lngLat: e.lngLat
      });

      // Query with bbox tolerance (12px pad for buildings, 8px was too small)
      // Bigger bbox helps catch buildings when clicking near edges
      const pad = 12;
      const bbox: [[number, number], [number, number]] = [
        [e.point.x - pad, e.point.y - pad],
        [e.point.x + pad, e.point.y + pad],
      ];

      const features = map.queryRenderedFeatures(bbox);

      mapLogger.log('🔍 Identify: Found features', {
        count: features.length,
        bbox
      });

      if (features.length > 0) {
        // Check if we're in 3D mode and if ANY feature is a 3D building
        const is3DMode = mapStyleKey === 'buildings3d' || mapStyleKey === 'full3d';

        // Find first 3D building in features (skip labels and other layers)
        const buildingFeature = features.find(f => f.layer?.id === '3d-buildings');
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
          let building = buildings[featureId];

          if (!building) {
            // Create new building entry from Mapbox feature
            const coordinates: [number, number] = firstFeature.geometry?.type === 'Point'
              ? (firstFeature.geometry.coordinates as [number, number])
              : [e.lngLat.lng, e.lngLat.lat];

            building = {
              id: featureId,
              name: firstFeature.properties?.name || `Budynek ${featureId}`,
              coordinates,
              attributes: Object.entries(firstFeature.properties || {}).map(([key, value]) => ({
                key,
                value: value as string | number
              })),
              selected: false,
            };

            dispatch(addBuilding(building));
          }

          // Select building and open building modal
          dispatch(selectBuilding(featureId));
          dispatch(setAttributeModalOpen(true));

          // Update feature state for visual feedback
          const prevSelectedId = selectedBuildingIdRef.current;
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

        // Transform regular features to our format (exclude 3D buildings already shown)
        const transformed: IdentifiedFeature[] = features
          .filter(f => f.layer?.id !== '3d-buildings') // Skip buildings, already handled
          .map((feature: any) => {
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

    // Add click handler
    map.on('click', handleMapClick);

    // Change cursor when identify mode is active
    if (identify.isActive) {
      map.getCanvas().style.cursor = 'help';
    } else {
      map.getCanvas().style.cursor = '';
    }

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, identify.isActive, mapStyleKey, dispatch, buildings]);

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
