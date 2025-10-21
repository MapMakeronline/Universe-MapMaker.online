'use client';

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import Map, { ScaleControl, MapRef } from 'react-map-gl';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setViewState, setMapLoaded, setFullscreen } from '@/redux/slices/mapSlice';
import { MAPBOX_TOKEN, MAP_CONFIG } from '@/mapbox/config';
import { mapLogger } from '@/tools/logger';
import { saveViewport, loadViewport, autoSaveViewport } from '@/mapbox/viewport-persistence';
import DrawTools from '../narzedzia/DrawTools';
import MeasurementTools from '../narzedzia/MeasurementTools';
import IdentifyTool from './IdentifyTool';
import Buildings3D from './Buildings3D';
import FeatureAttributesModal from '@/features/layers/modals/FeatureAttributesModal';
import RightFABToolbar from '@/features/narzedzia/RightFABToolbar';

// Import CSS dla Mapbox GL
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  children?: React.ReactNode;
  projectName?: string; // Project name for viewport persistence
}

const MapContainer: React.FC<MapContainerProps> = ({ children, projectName }) => {
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapRef>(null);
  const [tokenError, setTokenError] = useState<string>('');

  const { viewState, mapStyle, isFullscreen, isMapLoaded } = useAppSelector((state) => state.map);

  // Check token on mount
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setTokenError('Mapbox token nie jest skonfigurowany');
      mapLogger.error('❌ MAPBOX_TOKEN is missing in environment variables');
    } else {
      setTokenError('');
      // Token loaded - no need to log (reduces console spam)
    }
  }, []);

  // VIEWPORT PERSISTENCE: Load saved viewport on mount
  useEffect(() => {
    if (!projectName) return;

    const savedViewport = loadViewport(projectName);

    if (savedViewport) {
      // Restore viewport from sessionStorage (silent to reduce console spam)
      dispatch(setViewState(savedViewport));
    }
  }, [projectName, dispatch]);

  // VIEWPORT PERSISTENCE: Auto-save viewport every 10 seconds
  useEffect(() => {
    if (!projectName) return;

    // Use mapRef to get CURRENT viewState, not stale closure
    const getViewState = () => {
      if (!mapRef.current) return viewState;
      const map = mapRef.current.getMap();
      const center = map.getCenter();
      return {
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      };
    };

    const cleanup = autoSaveViewport(
      projectName,
      getViewState,
      10000 // 10 seconds
    );

    return cleanup;
  }, [projectName]); // REMOVED viewState dependency!

  // VIEWPORT PERSISTENCE: Save on unmount (page close/navigate)
  useEffect(() => {
    return () => {
      if (projectName && mapRef.current) {
        const map = mapRef.current.getMap();
        const center = map.getCenter();
        const currentViewState = {
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        };
        saveViewport(projectName, currentViewState);
        // Silent save on unmount (reduces console spam)
      }
    };
  }, [projectName]); // REMOVED viewState dependency!

  // Throttle onMove to reduce Redux updates (120 FPS = ~8ms between updates)
  const lastUpdateTime = useRef<number>(0);
  const onMove = useCallback((evt: any) => {
    const now = Date.now();
    if (now - lastUpdateTime.current > 8) { // Throttle: 120 FPS for ultra-smooth movement
      lastUpdateTime.current = now;
      dispatch(setViewState(evt.viewState));
    }
  }, [dispatch]);

  const onLoad = useCallback(() => {
    console.log('🗺️ Map onLoad event fired - setting isMapLoaded = true');
    dispatch(setMapLoaded(true));
  }, [dispatch]);

  // Debounce resize to prevent excessive map.resize() calls
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      mapRef.current?.resize();
    }, 150); // Debounce 150ms
  }, []);

  // PWA detection and mobile viewport fixes (with debouncing for performance)
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    // Detect PWA/standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) {
      // In PWA mode, ensure smooth interactions (silent to reduce console spam)
      map.scrollZoom.enable();
      map.dragRotate.enable();
      map.touchZoomRotate.enable();
    }

    // Debounced viewport resize handler (prevents excessive map.resize() calls)
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleViewportResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        map.resize(); // Silent resize (no console spam)
      }, 300); // Debounce 300ms
    };

    // Debounced visibility change handler
    let visibilityTimeout: NodeJS.Timeout | null = null;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          map.resize(); // Silent resize (no console spam)
        }, 200); // Debounce 200ms
      }
    };

    // Listen to various resize events
    window.addEventListener('orientationchange', handleViewportResize);
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('orientationchange', handleViewportResize);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
    };
  }, [mapRef]);

  // Show error state
  if (tokenError) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {tokenError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}
    >

      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onLoad={onLoad}
        onResize={onResize}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        {...MAP_CONFIG}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Scale Control - Bottom center with metric ruler (only after map loads) */}
        {isMapLoaded && (
          <ScaleControl
            position="bottom-center"
            maxWidth={200}
            unit="metric"
          />
        )}

        {/* Geocoder - Search (disabled, now using SearchModal from RightToolbar) */}
        {/* <Geocoder /> */}

        {/* Draw Tools */}
        <DrawTools />

        {/* Measurement Tools */}
        <MeasurementTools />

        {/* Identify Tool */}
        <IdentifyTool />

        {/* 3D Buildings */}
        <Buildings3D />

        {/* Dodatkowe komponenty (Markers, Popup) */}
        {children}
      </Map>

      {/* Universal Feature Attributes Modal for ALL feature types (buildings, POI, points, lines, polygons, etc.) */}
      <FeatureAttributesModal />

      {/* Proste toolbary bez MUI - ukryte */}
      {/* <SimpleDrawingToolbar />
      <SimpleMeasurementToolbar /> */}

      {/* ===== RIGHT FAB TOOLBAR - Unified Material Icons FABs ===== */}
      {/* All tools in one vertical column with consistent styling */}
      <RightFABToolbar />
    </Box>
  );
};

export default MapContainer;
