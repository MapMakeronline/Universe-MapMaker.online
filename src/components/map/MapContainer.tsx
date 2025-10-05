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
import Building3DInteraction, { useBuildingClickHandler } from './Building3DInteraction';
import BuildingAttributesModal from './BuildingAttributesModal';
import MobileFAB from './MobileFAB';

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

  // Use building click handler from Building3DInteraction
  const handleBuildingClick = useBuildingClickHandler();

  // Map click handler - delegates to building handler
  const onClick = useCallback((event: any) => {
    // Call building handler with features from interactiveLayerIds
    handleBuildingClick(event);
  }, [handleBuildingClick]);

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
        onClick={onClick}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['3d-buildings']}
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

        {/* 3D Building Interaction */}
        <Building3DInteraction />

        {/* Dodatkowe komponenty (Markers, Popup) */}
        {children}
      </Map>

      {/* Building Attributes Modal */}
      <BuildingAttributesModal />

      {/* Proste toolbary bez MUI - ukryte */}
      {/* <SimpleDrawingToolbar />
      <SimpleMeasurementToolbar /> */}

      {/* Mobile FAB - Floating Action Button (działa na wszystkich urządzeniach) */}
      <MobileFAB />
    </Box>
  );
};

export default MapContainer;
