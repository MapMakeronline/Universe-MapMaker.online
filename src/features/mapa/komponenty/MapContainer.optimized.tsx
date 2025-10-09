'use client';

/**
 * Optimized MapContainer - 60fps Performance
 *
 * Optimizations applied:
 * - Lazy loading for heavy components (DrawTools, Buildings3D, etc.)
 * - Throttled Redux updates (max 10 updates/sec)
 * - Memoized callbacks to prevent re-renders
 * - Device-specific optimizations (low-end devices)
 * - Feature-state batching for 3D buildings
 * - Performance monitoring (dev mode)
 */

import React, { useCallback, useRef, useState, useEffect, useMemo, lazy, Suspense, memo } from 'react';
import Map, { NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, MapRef } from 'react-map-gl';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setViewState, setMapLoaded } from '@/redux/slices/mapSlice';
import { MAPBOX_TOKEN } from '@/mapbox/config';
import {
  PERFORMANCE_CONFIG,
  createThrottle,
  optimizeForDevice,
  trackPerformance,
} from '@/mapbox/performance';
import { mapLogger } from '@/narzedzia/logger';

// Lazy load heavy components
const DrawTools = lazy(() => import('../narzedzia/DrawTools'));
const MeasurementTools = lazy(() => import('../narzedzia/MeasurementTools'));
const IdentifyTool = lazy(() => import('./IdentifyTool'));
const Buildings3D = lazy(() => import('./Buildings3D'));
const FeatureAttributesModal = lazy(() => import('@/features/warstwy/modale/FeatureAttributesModal'));
const MobileFAB = lazy(() => import('./MobileFAB'));

// Import CSS dla Mapbox GL
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  children?: React.ReactNode;
}

/**
 * Loading fallback for lazy-loaded components
 */
const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
    }}
  >
    <CircularProgress size={40} />
  </Box>
);

const MapContainerOptimized: React.FC<MapContainerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapRef>(null);
  const geolocateControlRef = useRef<any>(null);
  const [tokenError, setTokenError] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState(false);

  const { viewState, mapStyle } = useAppSelector((state) => state.map);

  // Check token on mount
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setTokenError('Mapbox token nie jest skonfigurowany');
      mapLogger.error('❌ MAPBOX_TOKEN is missing in environment variables');
    } else {
      setTokenError('');
      mapLogger.log('✅ MAPBOX_TOKEN loaded successfully');
    }
  }, []);

  // Throttled onMove callback (max 10 updates/sec)
  const throttledSetViewState = useMemo(
    () =>
      createThrottle((newViewState: any) => {
        dispatch(setViewState(newViewState));
      }, 100),
    [dispatch]
  );

  const onMove = useCallback(
    (evt: any) => {
      throttledSetViewState(evt.viewState);
    },
    [throttledSetViewState]
  );

  // Map load handler with optimizations
  const onLoad = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // Apply device-specific optimizations
    optimizeForDevice(map);

    // Enable performance tracking in development
    if (process.env.NODE_ENV === 'development') {
      trackPerformance(map);
    }

    mapLogger.log('🗺️ Map loaded and optimized');
    setIsMapReady(true);
    dispatch(setMapLoaded(true));
  }, [dispatch]);

  // Optimized resize handler
  const onResize = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  // PWA detection and mobile viewport fixes
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const map = mapRef.current.getMap();

    // Detect PWA/standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      mapLogger.log('📱 PWA detected - enabling full gesture interaction');
      map.scrollZoom.enable();
      map.dragRotate.enable();
      map.touchZoomRotate.enable();
    }

    // Mobile viewport resize handlers
    const handleViewportResize = () => {
      mapLogger.log('📐 Viewport changed - resizing map');
      map.resize();
    };

    window.addEventListener('orientationchange', handleViewportResize);
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        mapLogger.log('👁️ Page visible - resizing map');
        map.resize();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('orientationchange', handleViewportResize);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mapRef, isMapReady]);

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
        {...PERFORMANCE_CONFIG}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-left" showCompass={true} showZoom={true} />

        {/* Geolocation Control */}
        <GeolocateControl
          ref={geolocateControlRef}
          position="bottom-left"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={false}
          showUserLocation={false}
          showUserHeading={false}
          fitBoundsOptions={{
            maxZoom: 16,
            duration: 1000, // Faster animation
          }}
        />

        {/* Fullscreen Control */}
        <FullscreenControl position="bottom-left" />

        {/* Scale Control */}
        <ScaleControl position="bottom-left" maxWidth={100} unit="metric" />

        {/* Lazy-loaded components */}
        {isMapReady && (
          <Suspense fallback={<LoadingFallback />}>
            <DrawTools />
            <MeasurementTools />
            <IdentifyTool />
            <Buildings3D />
          </Suspense>
        )}

        {/* Additional children */}
        {children}
      </Map>

      {/* Modals & UI outside map */}
      {isMapReady && (
        <Suspense fallback={null}>
          <FeatureAttributesModal />
          <MobileFAB />
        </Suspense>
      )}
    </Box>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(MapContainerOptimized);
