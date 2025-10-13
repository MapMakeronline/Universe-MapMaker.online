'use client';

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import Map, { NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, MapRef } from 'react-map-gl';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setViewState, setMapLoaded, setFullscreen } from '@/redux/slices/mapSlice';
import { MAPBOX_TOKEN, MAP_CONFIG } from '@/mapbox/config';
import { mapLogger } from '@/narzedzia/logger';
import { saveViewport, loadViewport, autoSaveViewport } from '@/mapbox/viewport-persistence';
import DrawTools from '../narzedzia/DrawTools';
import MeasurementTools from '../narzedzia/MeasurementTools';
import IdentifyTool from './IdentifyTool';
import Buildings3D from './Buildings3D';
import FeatureAttributesModal from '@/features/warstwy/modale/FeatureAttributesModal';
import MobileFAB from './MobileFAB';

// Import CSS dla Mapbox GL
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  children?: React.ReactNode;
  projectName?: string; // Project name for viewport persistence
}

const MapContainer: React.FC<MapContainerProps> = ({ children, projectName }) => {
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapRef>(null);
  const geolocateControlRef = useRef<any>(null);
  const [tokenError, setTokenError] = useState<string>('');

  const { viewState, mapStyle, isFullscreen } = useAppSelector((state) => state.map);

  // Check token on mount
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setTokenError('Mapbox token nie jest skonfigurowany');
      mapLogger.error('❌ MAPBOX_TOKEN is missing in environment variables');
    } else {
      setTokenError('');
      mapLogger.log('✅ MAPBOX_TOKEN loaded successfully:', MAPBOX_TOKEN.substring(0, 20) + '...');
      mapLogger.log('🗺️ MapContainer: Mapbox access token is valid');
    }
  }, []);

  // VIEWPORT PERSISTENCE: Load saved viewport on mount
  useEffect(() => {
    if (!projectName) return;

    const savedViewport = loadViewport(projectName);

    if (savedViewport) {
      // Restore viewport from sessionStorage
      dispatch(setViewState(savedViewport));
      mapLogger.log('✅ Restored viewport from sessionStorage:', savedViewport);
    } else {
      mapLogger.log('ℹ️ No saved viewport found, using default or project extent');
    }
  }, [projectName, dispatch]);

  // VIEWPORT PERSISTENCE: Auto-save viewport every 10 seconds
  useEffect(() => {
    if (!projectName) return;

    const cleanup = autoSaveViewport(
      projectName,
      () => viewState,
      10000 // 10 seconds
    );

    return cleanup;
  }, [projectName, viewState]);

  // VIEWPORT PERSISTENCE: Save on unmount (page close/navigate)
  useEffect(() => {
    return () => {
      if (projectName && viewState) {
        saveViewport(projectName, viewState);
        mapLogger.log('💾 Saved viewport on unmount');
      }
    };
  }, [projectName, viewState]);

  // Throttle onMove to reduce Redux updates (max 5 updates per second for better performance)
  const lastUpdateTime = useRef<number>(0);
  const onMove = useCallback((evt: any) => {
    const now = Date.now();
    if (now - lastUpdateTime.current > 200) { // Throttle: max 5 updates/sec (doubled from 100ms)
      lastUpdateTime.current = now;
      dispatch(setViewState(evt.viewState));
    }
  }, [dispatch]);

  const onLoad = useCallback(() => {
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
      mapLogger.log('📱 PWA detected - enabling full gesture interaction');
      // In PWA mode, ensure smooth interactions
      map.scrollZoom.enable();
      map.dragRotate.enable();
      map.touchZoomRotate.enable();
    }

    // Debounced viewport resize handler (prevents excessive map.resize() calls)
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleViewportResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        mapLogger.log('📐 Viewport changed - resizing map (debounced)');
        map.resize();
      }, 300); // Debounce 300ms
    };

    // Debounced visibility change handler
    let visibilityTimeout: NodeJS.Timeout | null = null;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          mapLogger.log('👁️ Page visible - resizing map (debounced)');
          map.resize();
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

  // Building click handling is now done via direct layer listeners in Building3DInteraction
  // No need for onClick or interactiveLayerIds here

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
        {/* Navigation Controls - lewy dolny róg */}
        <NavigationControl
          position="bottom-left"
          showCompass={true}
          showZoom={true}
        />

        {/* Geolocation Control - lewy dolny róg, poniżej navigation */}
        <GeolocateControl
          ref={geolocateControlRef}
          position="bottom-left"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={false}
          showUserLocation={false}
          showUserHeading={false}
          fitBoundsOptions={{
            maxZoom: 16,
            duration: 1500, // Szybsza animacja (1.5s)
          }}
        />

        {/* Fullscreen Control - lewy dolny róg, na dole */}
        <FullscreenControl
          position="bottom-left"
        />

        {/* Scale Control - lewy dolny róg */}
        <ScaleControl
          position="bottom-left"
          maxWidth={100}
          unit="metric"
        />

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

      {/* Mobile FAB - Floating Action Button (działa na wszystkich urządzeniach) */}
      <MobileFAB />
    </Box>
  );
};

export default MapContainer;
