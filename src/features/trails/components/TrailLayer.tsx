"use client"

/**
 * TrailLayer - Render trail on Mapbox map (Frontend only)
 *
 * Features:
 * - Adds Mapbox source + layer for trail LineString
 * - Customizable color and line width
 * - Auto-fits map bounds to trail
 * - Cleanup on unmount
 *
 * Uses Mapbox GL JS (runs in browser)
 */

import { useEffect, useRef } from 'react';
import { MapRef } from 'react-map-gl';
import type { TrailFeature } from '../types';
import { calculateBounds } from '../utils/trailCalculations';

interface TrailLayerProps {
  trail: TrailFeature;
  mapRef: React.RefObject<MapRef>;
  color?: string;
  width?: number;
  fitBounds?: boolean;
  sourceId?: string;
  layerId?: string;
}

/**
 * TrailLayer Component
 *
 * Renders a trail on Mapbox map as a LineString layer
 *
 * @param trail - TrailFeature to display
 * @param mapRef - Reference to Mapbox map
 * @param color - Line color (default: '#FF5722' coral/red)
 * @param width - Line width in pixels (default: 4)
 * @param fitBounds - Auto-fit map to trail bounds (default: true)
 * @param sourceId - Custom source ID (default: 'trail-source')
 * @param layerId - Custom layer ID (default: 'trail-layer')
 *
 * @example
 * <TrailLayer
 *   trail={trailFeature}
 *   mapRef={mapRef}
 *   color="#FF5722"
 *   width={4}
 * />
 */
export function TrailLayer({
  trail,
  mapRef,
  color = '#FF5722', // Coral/red (primary color)
  width = 4,
  fitBounds = true,
  sourceId = 'trail-source',
  layerId = 'trail-layer',
}: TrailLayerProps) {
  // Track current trail ID to detect actual trail changes (not just re-renders)
  const currentTrailIdRef = useRef<string | null>(null);
  const trailId = `${trail.properties.name}-${trail.geometry.coordinates.length}`;
  const cleanupNeededRef = useRef(false); // Track if cleanup is needed on unmount

  useEffect(() => {
    const map = mapRef.current?.getMap();

    // Guard: Map must exist
    if (!map) {
      console.warn('TrailLayer: Map not ready');
      return;
    }

    // Check if this is the same trail (just a re-render) or a new trail
    const isSameTrail = currentTrailIdRef.current === trailId;

    if (isSameTrail) {
      console.log('🔄 TrailLayer: Same trail, skipping re-add (prevent cleanup loop)');
      // Don't cleanup on unmount if it's the same trail (just a re-render)
      cleanupNeededRef.current = false;
      return; // Don't re-add if it's the same trail
    }

    // Update current trail ID
    currentTrailIdRef.current = trailId;
    cleanupNeededRef.current = true; // Mark that cleanup is needed

    // Function to add trail layer
    const addTrailLayer = () => {
      try {
        // Remove existing layer/source if they exist (cleanup before adding new)
        // Defensive: wrap in try-catch to avoid terrain/removeSource bug
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            console.log('🗑️ Removed old layer:', layerId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
            console.log('🗑️ Removed old source:', sourceId);
          }
        } catch (removeError) {
          console.warn('⚠️ TrailLayer: error while removing source (terrain bug?), ignoring:', removeError);
        }

        // 1. Add source with current trail data
        map.addSource(sourceId, {
          type: 'geojson',
          data: trail,
        });
        console.log('✅ Added source:', sourceId);

        // 2. Add layer with current styling
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': width,
            'line-opacity': 0.9,
          },
        });
        console.log('✅ Added layer:', layerId);

        console.log('✅ Trail layer added:', {
          name: trail.properties.name,
          color,
          width,
          points: trail.geometry.coordinates.length,
        });

        // 3. Fit bounds to trail (optional)
        if (fitBounds) {
          try {
            const bounds = calculateBounds(trail);
            map.fitBounds(bounds, {
              padding: 50,
              duration: 1000,
              maxZoom: 14,
            });
          } catch (error) {
            console.error('Error fitting bounds:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error adding trail layer:', error);
      }
    };

    // Add layer immediately if map style is already loaded, or wait for single 'load' event
    if (map.isStyleLoaded?.() || map.loaded()) {
      console.log('🗺️ TrailLayer: Style already loaded, adding layer immediately');
      addTrailLayer();
    } else {
      console.log('🗺️ TrailLayer: Waiting for map load event...');
      // Use map.once() instead of map.on() to avoid infinite loop
      map.once('load', addTrailLayer);
    }

    // Cleanup function - runs when component unmounts or trail changes
    return () => {
      // Only cleanup if needed (component unmount or actual trail change, not re-render)
      if (!cleanupNeededRef.current) {
        console.log('🔄 Trail layer: Skipping cleanup (just a re-render)');
        return;
      }

      console.log('🗑️ Trail layer: Cleaning up (unmount or trail change)');
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        currentTrailIdRef.current = null; // Reset trail ID
      } catch (error) {
        console.warn('⚠️ TrailLayer: error during cleanup, ignoring:', error);
      }
    };
  }, [trail, mapRef, color, width, fitBounds, sourceId, layerId, trailId]); // Re-run when trail or props change

  // Separate cleanup effect for component unmount (when activeTrail becomes null)
  useEffect(() => {
    const map = mapRef.current?.getMap();

    // Cleanup on component unmount
    return () => {
      if (!map) return;

      console.log('🗑️ Trail layer: Component unmounting, removing layer');
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.warn('⚠️ TrailLayer: error during unmount cleanup, ignoring:', error);
      }
    };
  }, []); // Empty deps = runs only on mount/unmount

  // This component renders nothing (it only adds layers to map)
  return null;
}

export default TrailLayer;
