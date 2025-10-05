'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';
import { mapLogger } from '@/lib/logger';
import type { MapLayerMouseEvent } from 'mapbox-gl';

const Building3DInteraction = () => {
  const { current: mapRef } = useMap();
  const dispatch = useAppDispatch();
  const { buildings, selectedBuildingId } = useAppSelector((state) => state.buildings);
  const { mapStyleKey } = useAppSelector((state) => state.map);

  useEffect(() => {
    if (!mapRef) {
      return;
    }

    const map = mapRef.getMap();
    if (!map) {
      return;
    }

    // Only enable 3D building interaction when in 3D mode
    const is3DMode = mapStyleKey === 'buildings3d' || mapStyleKey === 'full3d';
    if (!is3DMode) {
      return;
    }

    mapLogger.log('🏢 Initializing 3D building interaction');

    // Change cursor on hover over 3D buildings
    const onMouseMove = (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['3d-buildings']
      });

      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    };

    // Handle click on 3D buildings
    const onClick = (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['3d-buildings']
      });

      mapLogger.log('🏢 Building click handler fired:', {
        featuresFound: features.length,
        point: e.point,
        lngLat: e.lngLat
      });

      if (features.length === 0) {
        // Clicked on empty space - deselect
        dispatch(selectBuilding(null));
        return;
      }

      const feature = features[0];
      const featureId = feature.id?.toString() || `building-${Date.now()}`;

      mapLogger.log('🏢 Clicked on 3D building:', {
        id: featureId,
        properties: feature.properties
      });

      // Check if building already exists in store
      let building = buildings[featureId];

      if (!building) {
        // Create new building entry from Mapbox feature
        const coordinates: [number, number] = feature.geometry.type === 'Point'
          ? (feature.geometry.coordinates as [number, number])
          : [e.lngLat.lng, e.lngLat.lat];

        building = {
          id: featureId,
          name: feature.properties?.name || `Budynek ${featureId}`,
          coordinates,
          attributes: Object.entries(feature.properties || {}).map(([key, value]) => ({
            key,
            value: value as string | number
          })),
          selected: false,
        };

        dispatch(addBuilding(building));
      }

      // Select building and open modal
      dispatch(selectBuilding(featureId));
      dispatch(setAttributeModalOpen(true));

      // Update feature state for visual feedback
      if (selectedBuildingId && selectedBuildingId !== featureId) {
        // Remove previous selection
        try {
          map.removeFeatureState({
            source: 'composite',
            sourceLayer: 'building',
            id: selectedBuildingId
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
    };

    // Wait for map to be fully loaded and 3d-buildings layer to be available
    let retryCount = 0;
    const maxRetries = 15; // Increased retry count
    const retryDelay = 300; // Reduced delay for faster checks

    const setupInteraction = () => {
      if (!map.isStyleLoaded()) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupInteraction, retryDelay);
        }
        return;
      }

      if (map.getLayer('3d-buildings')) {
        map.on('mousemove', onMouseMove);
        map.on('click', onClick);
        mapLogger.log('✅ 3D building interaction enabled');
      } else if (retryCount < maxRetries) {
        retryCount++;
        mapLogger.log(`⏳ Waiting for 3d-buildings layer... (${retryCount}/${maxRetries})`);
        setTimeout(setupInteraction, retryDelay);
      } else {
        mapLogger.log('ℹ️ 3d-buildings layer not available. Interaction disabled.');
      }
    };

    // Start setup after a small delay to ensure Buildings3D component runs first
    setTimeout(setupInteraction, 200);

    return () => {
      mapLogger.log('🏢 Cleaning up 3D building interaction');
      map.off('mousemove', onMouseMove);
      map.off('click', onClick);
      map.getCanvas().style.cursor = '';

      // Clear all feature states
      if (selectedBuildingId) {
        try {
          map.removeFeatureState({
            source: 'composite',
            sourceLayer: 'building',
            id: selectedBuildingId
          });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [mapRef, mapStyleKey, dispatch, selectedBuildingId, buildings]);

  return null;
};

export default Building3DInteraction;
