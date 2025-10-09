'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { useAppDispatch } from '@/redux/hooks';
import { flyToLocation } from '@/redux/slices/mapSlice';
import { MAPBOX_TOKEN } from '@/mapbox/config';

// Import CSS for Geocoder
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const Geocoder: React.FC = () => {
  const { current: map } = useMap();
  const dispatch = useAppDispatch();
  const geocoderRef = useRef<MapboxGeocoder | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Check if map is ready
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();

    const checkMapReady = () => {
      if (mapInstance.isStyleLoaded()) {
        setIsMapReady(true);
      }
    };

    if (mapInstance.isStyleLoaded()) {
      setIsMapReady(true);
    } else {
      mapInstance.on('styledata', checkMapReady);
    }

    return () => {
      mapInstance.off('styledata', checkMapReady);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    const initializeGeocoder = async () => {
      try {
        if (!MAPBOX_TOKEN) {
          throw new Error('Mapbox token not configured');
        }

        // Create geocoder instance
        const mapboxgl = (await import('mapbox-gl')).default;
        const geocoder = new MapboxGeocoder({
          accessToken: MAPBOX_TOKEN,
          mapboxgl: mapboxgl as any,
          marker: true,
          placeholder: 'Szukaj miejsca...',
          proximity: {
            longitude: 21.0122,
            latitude: 52.2297,
          },
          countries: 'pl',
          language: 'pl',
          limit: 5,
          flyTo: {
            bearing: 0,
            speed: 1.2,
            curve: 1,
            easing: (t: number) => t,
          },
        });

        geocoderRef.current = geocoder;

        // Add event listeners
        geocoder.on('result', (e: any) => {
          const { center } = e.result.geometry;
          dispatch(flyToLocation({
            longitude: center[0],
            latitude: center[1],
            zoom: 14,
          }));
        });

        geocoder.on('clear', () => {
          // Optionally handle clear event
          console.log('Geocoder cleared');
        });

        geocoder.on('error', (e: any) => {
          console.error('Geocoder error:', e);
        });

        // Add geocoder to map
        map.addControl(geocoder, 'top-left');

      } catch (error) {
        console.error('Error initializing geocoder:', error);
      }
    };

    initializeGeocoder();

    return () => {
      if (geocoderRef.current) {
        map.removeControl(geocoderRef.current);
        geocoderRef.current = null;
      }
    };
  }, [map, isMapReady, dispatch]);

  return null; // This component doesn't render anything
};

export default Geocoder;