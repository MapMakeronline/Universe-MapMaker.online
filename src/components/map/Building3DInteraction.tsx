'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';
import { mapLogger } from '@/lib/logger';

/**
 * Building3DInteraction Component
 *
 * Handles click/touch interactions with 3D buildings using React Map GL's
 * interactiveLayerIds feature through a custom context.
 *
 * IMPORTANT: This component exports a click handler that MUST be called
 * from MapContainer's onClick prop to receive features from interactiveLayerIds.
 */

// Export the click handler creator
export const useBuildingClickHandler = () => {
  const { current: mapRef } = useMap();
  const dispatch = useAppDispatch();
  const { buildings, selectedBuildingId, isBuildingSelectModeActive } = useAppSelector((state) => state.buildings);
  const { mapStyleKey } = useAppSelector((state) => state.map);
  const { identify, measurement } = useAppSelector((state) => state.draw);

  return useCallback((event: any) => {
    if (!mapRef) return;

    const map = mapRef.getMap();
    if (!map) return;

    // Only handle in 3D mode
    const is3DMode = mapStyleKey === 'buildings3d' || mapStyleKey === 'full3d';
    if (!is3DMode) return;

    mapLogger.log('🏢 Map click event received', {
      isBuildingMode: isBuildingSelectModeActive,
      identifyActive: identify.isActive,
      measurementActive: measurement.isActive,
      hasFeatures: !!(event.features && event.features.length > 0)
    });

    // Only handle clicks if building select mode is active AND other tools are not active
    if (!isBuildingSelectModeActive) {
      mapLogger.log('🏢 Building click ignored - mode not active');
      return;
    }

    // Don't handle if identify or measurement tools are active
    if (identify.isActive || measurement.isActive) {
      mapLogger.log('🏢 Building click ignored - other tool active');
      return;
    }

    // Check if we have features from interactiveLayerIds
    const features = event.features;

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
      const coordinates: [number, number] = feature.geometry?.type === 'Point'
        ? (feature.geometry.coordinates as [number, number])
        : [event.lngLat.lng, event.lngLat.lat];

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
  }, [mapRef, mapStyleKey, dispatch, selectedBuildingId, buildings, isBuildingSelectModeActive, identify.isActive, measurement.isActive]);
};

const Building3DInteraction = () => {
  const { current: mapRef } = useMap();
  const { isBuildingSelectModeActive } = useAppSelector((state) => state.buildings);
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

    mapLogger.log('🏢 3D building interaction ready (via React Map GL onClick)', {
      isBuildingSelectModeActive,
      is3DMode
    });

    // Change cursor on hover over 3D buildings
    const handleMouseMove = (e: any) => {
      if (!isBuildingSelectModeActive) {
        map.getCanvas().style.cursor = '';
        return;
      }

      // Query features at mouse position
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['3d-buildings']
      });

      map.getCanvas().style.cursor = features && features.length > 0 ? 'pointer' : '';
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, mapStyleKey, isBuildingSelectModeActive]);

  return null;
};

export default Building3DInteraction;
