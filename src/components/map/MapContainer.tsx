'use client';

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import Map, { NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, MapRef } from 'react-map-gl';
import { Box, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setViewState, setMapLoaded, setFullscreen } from '@/store/slices/mapSlice';
import { MAPBOX_TOKEN, MAP_CONFIG } from '@/lib/mapbox/config';
import { mapLogger } from '@/lib/logger';
import DrawTools from './DrawTools';
import MeasurementTools from './MeasurementTools';
import IdentifyTool from './IdentifyTool';
import Buildings3D from './Buildings3D';
import BuildingAttributesModal from './BuildingAttributesModal';
import FeatureAttributesModal from './FeatureAttributesModal';
import MobileFAB from './MobileFAB';
import TapTest from './TapTest';

// Import CSS dla Mapbox GL
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  children?: React.ReactNode;
}

const MapContainer: React.FC<MapContainerProps> = ({ children }) => {
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

  // Throttle onMove to reduce Redux updates (max 10 updates per second)
  const lastUpdateTime = useRef<number>(0);
  const onMove = useCallback((evt: any) => {
    const now = Date.now();
    if (now - lastUpdateTime.current > 100) { // Throttle: max 10 updates/sec
      lastUpdateTime.current = now;
      dispatch(setViewState(evt.viewState));
    }
  }, [dispatch]);

  const onLoad = useCallback(() => {
    dispatch(setMapLoaded(true));
  }, [dispatch]);

  const onResize = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  // PWA detection and mobile viewport fixes
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

    // Mobile viewport resize handlers (iOS address bar, orientation)
    const handleViewportResize = () => {
      mapLogger.log('📐 Viewport changed - resizing map');
      map.resize();
    };

    // Listen to various resize events
    window.addEventListener('orientationchange', handleViewportResize);
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        mapLogger.log('👁️ Page visible - resizing map');
        map.resize();
      }
    });

    return () => {
      window.removeEventListener('orientationchange', handleViewportResize);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
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

        {/* Tap Test - Testowa funkcja wykrywania tap/click (bez konfliktu z pinch-zoom) */}
        <TapTest />

        {/* Dodatkowe komponenty (Markers, Popup) */}
        {children}
      </Map>

      {/* Building Attributes Modal */}
      <BuildingAttributesModal />

      {/* Universal Feature Attributes Modal */}
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
