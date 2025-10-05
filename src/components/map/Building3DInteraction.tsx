'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';
import { mapLogger } from '@/lib/logger';

/**
 * Building3DInteraction Component
 *
 * SIMPLIFIED: Uses direct Mapbox GL event listener on '3d-buildings' layer.
 * This is the recommended approach from Mapbox documentation.
 *
 * Key change: map.on('click', '3d-buildings') instead of React Map GL onClick
 */
const Building3DInteraction = () => {
  const { current: mapRef } = useMap();
  const dispatch = useAppDispatch();
  const { buildings, selectedBuildingId, isBuildingSelectModeActive } = useAppSelector((state) => state.buildings);
  const { mapStyleKey } = useAppSelector((state) => state.map);
  const { identify, measurement } = useAppSelector((state) => state.draw);

  // Use ref to always have current value in event handlers
  const isBuildingSelectModeActiveRef = useRef(isBuildingSelectModeActive);

  useEffect(() => {
    isBuildingSelectModeActiveRef.current = isBuildingSelectModeActive;
  }, [isBuildingSelectModeActive]);

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

    mapLogger.log('🏢 Initializing 3D building interaction (direct layer listener)', {
      isBuildingSelectModeActive,
      is3DMode
    });

    // Wait for style to load and layer to be available
    const setupInteraction = () => {
      if (!map.isStyleLoaded() || !map.getLayer('3d-buildings')) {
        setTimeout(setupInteraction, 100);
        return;
      }

      // Change cursor on hover
      const handleMouseEnter = () => {
        if (isBuildingSelectModeActiveRef.current) {
          map.getCanvas().style.cursor = 'pointer';
        }
      };

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      // Handle click on 3D buildings - features are AUTOMATICALLY available!
      const handleClick = (e: any) => {
        mapLogger.log('🏢 Building clicked', {
          isBuildingMode: isBuildingSelectModeActiveRef.current,
          identifyActive: identify.isActive,
          measurementActive: measurement.isActive,
          featuresCount: e.features?.length || 0
        });

        // Only handle clicks if building select mode is active
        if (!isBuildingSelectModeActiveRef.current) {
          mapLogger.log('🏢 Building click ignored - mode not active');
          return;
        }

        // Don't handle if other tools are active
        if (identify.isActive || measurement.isActive) {
          mapLogger.log('🏢 Building click ignored - other tool active');
          return;
        }

        const feature = e.features?.[0];
        if (!feature) {
          mapLogger.log('🏢 No feature found in click event');
          return;
        }

        const featureId = feature.id?.toString() || `building-${Date.now()}`;

        mapLogger.log('🏢 Selected building:', {
          id: featureId,
          properties: feature.properties
        });

        // Trigger haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Check if building already exists in store
        let building = buildings[featureId];

        if (!building) {
          // Create new building entry from Mapbox feature
          const coordinates: [number, number] = feature.geometry?.type === 'Point'
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

      // Attach event listeners DIRECTLY to the layer
      map.on('mouseenter', '3d-buildings', handleMouseEnter);
      map.on('mouseleave', '3d-buildings', handleMouseLeave);
      map.on('click', '3d-buildings', handleClick);

      mapLogger.log('✅ 3D building interaction enabled (direct layer listeners)');

      // Cleanup function
      return () => {
        mapLogger.log('🏢 Cleaning up 3D building interaction');
        map.off('mouseenter', '3d-buildings', handleMouseEnter);
        map.off('mouseleave', '3d-buildings', handleMouseLeave);
        map.off('click', '3d-buildings', handleClick);
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
    };

    const cleanup = setupInteraction();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [mapRef, mapStyleKey, dispatch, selectedBuildingId, buildings, identify.isActive, measurement.isActive]);

  return null;
};

export default Building3DInteraction;
