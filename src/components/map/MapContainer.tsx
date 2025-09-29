'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import Map, { NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, MapRef } from 'react-map-gl';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setViewState, setMapLoaded, setFullscreen } from '@/store/slices/mapSlice';
import { fetchMapboxToken, MAP_CONFIG } from '@/lib/mapbox/config';
import DrawTools from './DrawTools';
import Geocoder from './Geocoder';
import MeasurementTools from './MeasurementTools';

// Import CSS dla Mapbox GL
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContainerProps {
  children?: React.ReactNode;
}

const MapContainer: React.FC<MapContainerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapRef>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const { viewState, mapStyle, isFullscreen } = useAppSelector((state) => state.map);

  // Fetch Mapbox token on mount
  useEffect(() => {
    const initializeToken = async () => {
      try {
        setIsLoadingToken(true);
        const token = await fetchMapboxToken();
        setMapboxToken(token);
        setTokenError('');
      } catch (error) {
        setTokenError('Nie udało się pobrać tokena Mapbox');
        console.error('Token fetch error:', error);
      } finally {
        setIsLoadingToken(false);
      }
    };

    initializeToken();
  }, []);

  const onMove = useCallback((evt: any) => {
    dispatch(setViewState(evt.viewState));
  }, [dispatch]);

  const onLoad = useCallback(() => {
    dispatch(setMapLoaded(true));
  }, [dispatch]);

  const onResize = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  // Show loading state
  if (isLoadingToken) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <div>Ładowanie mapy...</div>
        </Box>
      </Box>
    );
  }

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
        mapboxAccessToken={mapboxToken}
        {...MAP_CONFIG}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Navigation Controls - prawy górny róg */}
        <NavigationControl
          position="top-right"
          showCompass={true}
          showZoom={true}
        />

        {/* Geolocation Control - prawy górny róg, poniżej navigation */}
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserHeading={true}
        />

        {/* Fullscreen Control - prawy górny róg, na dole */}
        <FullscreenControl
          position="top-right"
        />

        {/* Scale Control - lewy dolny róg */}
        <ScaleControl
          position="bottom-left"
          maxWidth={100}
          unit="metric"
        />

        {/* Geocoder - Search */}
        <Geocoder />

        {/* Draw Tools */}
        <DrawTools />

        {/* Measurement Tools */}
        <MeasurementTools />

        {/* Dodatkowe komponenty (Markers, Popup) */}
        {children}
      </Map>
    </Box>
  );
};

export default MapContainer;