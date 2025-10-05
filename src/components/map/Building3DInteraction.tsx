'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBuilding, selectBuilding, setAttributeModalOpen, setBuildingSelectMode } from '@/store/slices/buildingsSlice';
import { mapLogger } from '@/lib/logger';
import type { MapLayerMouseEvent } from 'mapbox-gl';

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

    mapLogger.log('🏢 Initializing 3D building interaction', {
      isBuildingSelectModeActive,
      is3DMode
    });

    // Change cursor on hover over 3D buildings
    const onMouseMove = (e: MapLayerMouseEvent) => {
      // Only show pointer cursor if building select mode is active
      if (!isBuildingSelectModeActiveRef.current) {
        return;
      }

      // Use smaller bbox for cursor (more precise visual feedback)
      const bbox: [number, number, number, number] = [
        e.point.x - 5,
        e.point.y - 5,
        e.point.x + 5,
        e.point.y + 5
      ];

      const features = map.queryRenderedFeatures(bbox, {
        layers: ['3d-buildings']
      });

      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    };

    // Handle click on 3D buildings
    const onClick = (e: MapLayerMouseEvent) => {
      // Only handle clicks if building select mode is active AND other tools are not active
      if (!isBuildingSelectModeActiveRef.current) {
        mapLogger.log('🏢 Building click ignored - mode not active', {
          refValue: isBuildingSelectModeActiveRef.current
        });
        return;
      }

      // Don't handle if identify or measurement tools are active
      if (identify.isActive || measurement.isActive) {
        mapLogger.log('🏢 Building click ignored - other tool active', {
          identify: identify.isActive,
          measurement: measurement.isActive
        });
        return;
      }

      // Query with larger radius to work around accuracy circle and improve mobile experience
      // Use a 15px radius box around the click point
      const bbox: [number, number, number, number] = [
        e.point.x - 15,
        e.point.y - 15,
        e.point.x + 15,
        e.point.y + 15
      ];

      const features = map.queryRenderedFeatures(bbox, {
        layers: ['3d-buildings']
      });

      const currentZoom = map.getZoom();
      const has3DLayer = map.getLayer('3d-buildings');

      mapLogger.log('🏢 Building click handler fired:', {
        featuresFound: features.length,
        point: e.point,
        lngLat: e.lngLat,
        modeActive: isBuildingSelectModeActiveRef.current,
        zoom: currentZoom,
        has3DLayer: !!has3DLayer,
        minZoomForBuildings: 15
      });

      if (features.length === 0) {
        // Check if zoom is too low
        if (currentZoom < 15) {
          mapLogger.log('⚠️ Zoom too low for 3D buildings. Current:', currentZoom, 'Required: 15+');
          alert(`Przybliż mapę do poziomu zoom 15 lub wyżej aby zobaczyć budynki 3D.\n\nAktualny zoom: ${currentZoom.toFixed(1)}`);
        }
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

      // Disable building select mode after selection (auto-deactivate)
      dispatch(setBuildingSelectMode(false));

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
        mapLogger.log('✅ 3D building interaction enabled', {
          hasLayer: true,
          currentMode: isBuildingSelectModeActiveRef.current
        });
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
