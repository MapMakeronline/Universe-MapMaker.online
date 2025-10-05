'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';
import { mapLogger } from '@/lib/logger';
import type { MapLayerMouseEvent } from 'mapbox-gl';

/**
 * Building3DInteraction Component
 *
 * Handles click/touch interactions with 3D buildings using React Map GL's
 * interactiveLayerIds feature. This provides automatic feature detection
 * for both desktop and mobile devices.
 *
 * How it works:
 * 1. MapContainer sets interactiveLayerIds={['3d-buildings']}
 * 2. Click events automatically include event.features with building data
 * 3. Works on BOTH desktop (click) and mobile (touch) automatically
 * 4. No need for manual queryRenderedFeatures or touch detection
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

    mapLogger.log('🏢 Initializing 3D building interaction (React Map GL events)', {
      isBuildingSelectModeActive,
      is3DMode
    });

    // Handle click on 3D buildings
    // This event comes from React Map GL's onClick prop in MapContainer
    // Features are automatically populated via interactiveLayerIds
    const handleMapClick = (e: MapLayerMouseEvent) => {
      mapLogger.log('🏢 Map click event received', {
        isBuildingMode: isBuildingSelectModeActiveRef.current,
        identifyActive: identify.isActive,
        measurementActive: measurement.isActive,
        hasFeatures: !!(e as any).features && (e as any).features.length > 0
      });

      // Only handle clicks if building select mode is active AND other tools are not active
      if (!isBuildingSelectModeActiveRef.current) {
        mapLogger.log('🏢 Building click ignored - mode not active');
        return;
      }

      // Don't handle if identify or measurement tools are active
      if (identify.isActive || measurement.isActive) {
        mapLogger.log('🏢 Building click ignored - other tool active');
        return;
      }

      // Check if we have features from interactiveLayerIds
      const features = (e as any).features;

      if (!features || features.length === 0) {
        // Clicked on empty space - deselect
        dispatch(selectBuilding(null));

        // Check if zoom is too low
        const currentZoom = map.getZoom();
        if (currentZoom < 15) {
          mapLogger.log('⚠️ Zoom too low for 3D buildings. Current:', currentZoom, 'Required: 15+');
          alert(`Przybliż mapę do poziomu zoom 15 lub wyżej aby zobaczyć budynki 3D.\n\nAktualny zoom: ${currentZoom.toFixed(1)}`);
        }
        return;
      }

      const feature = features[0];
      const featureId = feature.id?.toString() || `building-${Date.now()}`;

      mapLogger.log('🏢 Clicked on 3D building:', {
        id: featureId,
        properties: feature.properties,
        fromInteractiveLayer: true
      });

      // Trigger haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50); // 50ms vibration
      }

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

      // Keep building select mode active (user can select multiple buildings)
      // User must manually disable via RightToolbar button

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

    // Change cursor on hover over 3D buildings (optional enhancement)
    const handleMouseMove = (e: MapLayerMouseEvent) => {
      if (!isBuildingSelectModeActiveRef.current) {
        return;
      }

      const features = (e as any).features;
      map.getCanvas().style.cursor = features && features.length > 0 ? 'pointer' : '';
    };

    // Attach event listeners to map
    map.on('click', handleMapClick as any);
    map.on('mousemove', handleMouseMove as any);

    mapLogger.log('✅ 3D building interaction enabled (React Map GL with interactiveLayerIds)', {
      currentMode: isBuildingSelectModeActiveRef.current
    });

    return () => {
      mapLogger.log('🏢 Cleaning up 3D building interaction');

      // Remove event listeners
      map.off('click', handleMapClick as any);
      map.off('mousemove', handleMouseMove as any);
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
  }, [mapRef, mapStyleKey, dispatch, selectedBuildingId, buildings, identify.isActive, measurement.isActive]);

  return null;
};

export default Building3DInteraction;
