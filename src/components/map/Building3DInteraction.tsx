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

  // Long-press detection for mobile
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressDurationMs = 500; // 500ms for long press
  const touchStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const maxTouchMoveDistance = 10; // Maximum pixels allowed during long press

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

    mapLogger.log('🏢 Initializing 3D building interaction (mobile-optimized)', {
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

    // Helper function to handle building selection (shared by click and long-press)
    const handleBuildingSelection = (e: MapLayerMouseEvent) => {
      console.log('🏢 BUILDING HANDLER: Selection triggered', {
        isBuildingMode: isBuildingSelectModeActiveRef.current,
        identifyActive: identify.isActive,
        measurementActive: measurement.isActive
      });

      // Only handle if building select mode is active AND other tools are not active
      if (!isBuildingSelectModeActiveRef.current) {
        mapLogger.log('🏢 Building selection ignored - mode not active');
        return;
      }

      // Don't handle if identify or measurement tools are active
      if (identify.isActive || measurement.isActive) {
        mapLogger.log('🏢 Building selection ignored - other tool active');
        return;
      }

      // Query with larger radius for better mobile touch accuracy
      // Mobile: 20px radius, Desktop: 15px radius
      const isTouchDevice = 'ontouchstart' in window;
      const radius = isTouchDevice ? 20 : 15;

      const bbox: [number, number, number, number] = [
        e.point.x - radius,
        e.point.y - radius,
        e.point.x + radius,
        e.point.y + radius
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
        minZoomForBuildings: 15,
        isTouchDevice: 'ontouchstart' in window,
        searchRadius: radius
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

    // Desktop click handler (immediate)
    const onClick = (e: MapLayerMouseEvent) => {
      const isTouchDevice = 'ontouchstart' in window;

      // On desktop, handle click immediately
      // On mobile, ignore click (only long-press works)
      if (!isTouchDevice) {
        handleBuildingSelection(e);
      }
    };

    // Mobile touch handlers for long-press detection
    const onTouchStart = (e: any) => {
      const isTouchDevice = 'ontouchstart' in window;
      if (!isTouchDevice || !isBuildingSelectModeActiveRef.current) {
        return;
      }

      // Cancel any existing timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // Store touch start point
      touchStartPointRef.current = {
        x: e.point.x,
        y: e.point.y
      };

      mapLogger.log('👆 Touch start for long-press detection', { point: e.point });

      // Start long-press timer
      longPressTimerRef.current = setTimeout(() => {
        mapLogger.log('⏰ Long press triggered!');

        // Trigger haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50); // 50ms vibration
        }

        // Handle building selection
        handleBuildingSelection(e);

        // Clear refs
        longPressTimerRef.current = null;
        touchStartPointRef.current = null;
      }, longPressDurationMs);
    };

    const onTouchMove = (e: any) => {
      if (!longPressTimerRef.current || !touchStartPointRef.current) {
        return;
      }

      // Calculate distance moved
      const dx = e.point.x - touchStartPointRef.current.x;
      const dy = e.point.y - touchStartPointRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If finger moved too much, cancel long-press
      if (distance > maxTouchMoveDistance) {
        mapLogger.log('🚫 Long-press cancelled - finger moved too much', { distance });
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        touchStartPointRef.current = null;
      }
    };

    const onTouchEnd = () => {
      // Cancel long-press timer if touch ended before timeout
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      touchStartPointRef.current = null;
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
        // Desktop handlers
        map.on('mousemove', onMouseMove);
        map.on('click', onClick);

        // Mobile touch handlers
        map.on('touchstart', onTouchStart);
        map.on('touchmove', onTouchMove);
        map.on('touchend', onTouchEnd);
        map.on('touchcancel', onTouchEnd);

        mapLogger.log('✅ 3D building interaction enabled (desktop + mobile long-press)', {
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

      // Clear long-press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Remove event listeners
      map.off('mousemove', onMouseMove);
      map.off('click', onClick);
      map.off('touchstart', onTouchStart);
      map.off('touchmove', onTouchMove);
      map.off('touchend', onTouchEnd);
      map.off('touchcancel', onTouchEnd);
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
