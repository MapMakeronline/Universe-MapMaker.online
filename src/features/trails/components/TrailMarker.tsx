/**
 * TrailMarker - Marker creation component
 *
 * REFACTORED (2025-11-20): Simplified component
 *
 * Features:
 * - Arrow icon pointing in trail direction
 * - Creates Mapbox marker element
 * - Marker animation handled by useTrailAnimationWithMarker hook
 * - Accepts markerRef from parent (shared with animation hook)
 *
 * Uses Mapbox GL JS Marker API
 */

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapRef } from 'react-map-gl';

interface TrailMarkerProps {
  mapRef: React.RefObject<MapRef>;
  markerRef: React.RefObject<mapboxgl.Marker | null>; // Shared ref from parent
  visible: boolean; // Show/hide marker based on animation state
}

/**
 * TrailMarker Component
 *
 * Creates a direction arrow marker element
 * Animation logic handled by useTrailAnimationWithMarker hook
 *
 * @param mapRef - Reference to Mapbox map
 * @param markerRef - Reference to Mapbox marker (shared with animation hook)
 * @param visible - Whether marker should be visible
 *
 * @example
 * const markerRef = useRef<mapboxgl.Marker | null>(null);
 *
 * <TrailMarker
 *   mapRef={mapRef}
 *   markerRef={markerRef}
 *   visible={isPlaying}
 * />
 */
export function TrailMarker({
  mapRef,
  markerRef,
  visible,
}: TrailMarkerProps) {
  const [mapReady, setMapReady] = useState(false); // Track when map is ready

  // Effect 1: Wait for map to be ready (similar to TrailLayer)
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;

    const checkMapReady = () => {
      const map = mapRef.current?.getMap();

      if (map && (map.isStyleLoaded?.() || map.loaded())) {
        console.log('✅ TrailMarker: Map is ready!');
        setMapReady(true);
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      } else {
        console.log('⏳ TrailMarker: Waiting for map to initialize...');
      }
    };

    // Check immediately
    checkMapReady();

    // If not ready, check every 100ms until ready
    if (!mapReady) {
      checkInterval = setInterval(checkMapReady, 100);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []); // Empty deps - runs once on mount

  // Effect 2: Create marker when map is ready
  useEffect(() => {
    if (!mapReady) {
      console.log('⏳ TrailMarker: Map not ready yet, waiting...');
      return;
    }

    console.log('🔷 TrailMarker: Attempting to create marker', {
      hasMapRef: !!mapRef.current,
      hasMap: !!mapRef.current?.getMap(),
    });

    const map = mapRef.current?.getMap();
    if (!map) {
      console.log('📍 TrailMarker: Map not ready');
      return;
    }

    // Create marker element (arrow SVG)
    const el = document.createElement('div');
    el.className = 'trail-marker';
    el.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer circle (white border) -->
        <circle cx="20" cy="20" r="18" fill="white" stroke="#333" stroke-width="2"/>

        <!-- Inner circle (blue background) -->
        <circle cx="20" cy="20" r="15" fill="#1976d2"/>

        <!-- Arrow pointing up (will rotate with bearing) -->
        <path d="M20 8 L26 22 L20 18 L14 22 Z" fill="white" stroke="#333" stroke-width="1"/>
      </svg>
    `;

    // Create Mapbox marker
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    });

    markerRef.current = marker;
    console.log('✅ TrailMarker: Created marker element successfully');

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      console.log('🧹 TrailMarker: Cleaned up on unmount');
    };
  }, [mapReady, markerRef]); // Re-run when map becomes ready

  // Note: Marker visibility is handled by useTrailAnimationWithMarker Effect 1
  // (removes marker when visible=false). No need to duplicate that logic here.

  // This component renders nothing (marker is added directly to map)
  return null;
}

export default TrailMarker;
