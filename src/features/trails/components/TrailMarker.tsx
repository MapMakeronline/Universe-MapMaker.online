/**
 * TrailMarker - Animated position marker on trail
 *
 * Features:
 * - Arrow icon pointing in trail direction
 * - Rotates according to bearing (currentBearing)
 * - Updates position in real-time during animation
 * - Google Maps style navigation arrow
 *
 * Uses Mapbox GL JS Marker API
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapRef } from 'react-map-gl';

interface TrailMarkerProps {
  mapRef: React.RefObject<MapRef>;
  currentPoint: [number, number] | null;
  currentBearing: number;
  visible: boolean; // Show/hide marker based on animation state
}

/**
 * TrailMarker Component
 *
 * Renders a direction arrow marker at current trail position
 *
 * @param mapRef - Reference to Mapbox map
 * @param currentPoint - Current position [lng, lat]
 * @param currentBearing - Current direction (0-360 degrees)
 * @param visible - Whether marker should be visible
 *
 * @example
 * <TrailMarker
 *   mapRef={mapRef}
 *   currentPoint={currentPoint}
 *   currentBearing={currentBearing}
 *   visible={isPlaying}
 * />
 */
export function TrailMarker({
  mapRef,
  currentPoint,
  currentBearing,
  visible,
}: TrailMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

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

    // Add marker to map (initially hidden)
    if (currentPoint && visible) {
      marker.setLngLat(currentPoint).addTo(map);
      console.log('📍 TrailMarker: Created and added to map');
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
        console.log('📍 TrailMarker: Removed from map');
      }
    };
  }, [mapRef]); // Only run once on mount

  // Effect 2: Update marker position and rotation
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (currentPoint && visible) {
      // Update position
      marker.setLngLat(currentPoint);

      // Update rotation (bearing)
      marker.setRotation(currentBearing);

      // Ensure marker is visible
      marker.addTo(mapRef.current!.getMap()!);

      console.log('📍 TrailMarker: Updated', {
        position: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
        bearing: `${currentBearing.toFixed(1)}°`,
      });
    } else {
      // Hide marker when not visible
      marker.remove();
    }
  }, [currentPoint, currentBearing, visible, mapRef]);

  // This component renders nothing (marker is added directly to map)
  return null;
}

export default TrailMarker;
