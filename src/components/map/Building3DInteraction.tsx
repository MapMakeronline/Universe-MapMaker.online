'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';
import { mapLogger } from '@/lib/logger';

/**
 * Building3DInteraction Component
 *
 * Best-practice implementation using queryRenderedFeatures with bbox tolerance.
 * Better for mobile (8px pad around tap point).
 * Based on production-tested pattern.
 */
const Building3DInteraction = () => {
  const { current: mapRef } = useMap();
  const dispatch = useAppDispatch();
  const { buildings, selectedBuildingId, isBuildingSelectModeActive } = useAppSelector((state) => state.buildings);
  const { mapStyleKey } = useAppSelector((state) => state.map);
  const { identify, measurement } = useAppSelector((state) => state.draw);

  // Use refs to always have current values in event handlers
  const isBuildingSelectModeActiveRef = useRef(isBuildingSelectModeActive);
  const selectedBuildingIdRef = useRef(selectedBuildingId);

  useEffect(() => {
    isBuildingSelectModeActiveRef.current = isBuildingSelectModeActive;
  }, [isBuildingSelectModeActive]);

  useEffect(() => {
    selectedBuildingIdRef.current = selectedBuildingId;
  }, [selectedBuildingId]);

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

    mapLogger.log('🏢 Initializing 3D building interaction (bbox query pattern)', {
      isBuildingSelectModeActive,
      is3DMode
    });

    // Wait for style to load and layer to be available
    const setupInteraction = () => {
      if (!map.isStyleLoaded() || !map.getLayer('3d-buildings')) {
        setTimeout(setupInteraction, 100);
        return;
      }

      mapLogger.log('✅ 3D buildings layer found, setting up handlers');

      // Handle map click with bbox query (better for mobile - 8px tolerance)
      const handleMapClick = (e: any) => {
        mapLogger.log('🏢 Map click event', {
          point: e.point,
          lngLat: e.lngLat,
          isBuildingMode: isBuildingSelectModeActiveRef.current,
          identifyActive: identify.isActive,
          measurementActive: measurement.isActive
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

        // Query with bbox tolerance (8px pad - better for mobile)
        const pad = 8;
        const bbox: [[number, number], [number, number]] = [
          [e.point.x - pad, e.point.y - pad],
          [e.point.x + pad, e.point.y + pad],
        ];

        const features = map.queryRenderedFeatures(bbox, {
          layers: ['3d-buildings']
        });

        mapLogger.log('🏢 Query results', {
          featuresCount: features.length,
          bbox
        });

        const feature = features[0];
        if (!feature) {
          mapLogger.log('🏢 No building found in click area');
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
      };

      // Handle mouse move for cursor change (desktop only)
      const handleMouseMove = (e: any) => {
        if (!isBuildingSelectModeActiveRef.current) {
          return;
        }

        const pad = 8;
        const bbox: [[number, number], [number, number]] = [
          [e.point.x - pad, e.point.y - pad],
          [e.point.x + pad, e.point.y + pad],
        ];

        const features = map.queryRenderedFeatures(bbox, {
          layers: ['3d-buildings']
        });

        map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
      };

      // Attach event listeners to map (not layer)
      map.on('click', handleMapClick);
      map.on('mousemove', handleMouseMove);

      mapLogger.log('✅ 3D building interaction enabled (bbox query)');

      // Cleanup function
      return () => {
        mapLogger.log('🏢 Cleaning up 3D building interaction');
        map.off('click', handleMapClick);
        map.off('mousemove', handleMouseMove);
        map.getCanvas().style.cursor = '';

        // Clear all feature states
        const prevSelectedId = selectedBuildingIdRef.current;
        if (prevSelectedId) {
          try {
            map.removeFeatureState({
              source: 'composite',
              sourceLayer: 'building',
              id: prevSelectedId
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
  }, [mapRef, mapStyleKey, dispatch, buildings, identify.isActive, measurement.isActive]);

  return null;
};

export default Building3DInteraction;
