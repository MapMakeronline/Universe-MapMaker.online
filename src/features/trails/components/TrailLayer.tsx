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

import { useEffect } from 'react';
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
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      console.warn('TrailLayer: Map not ready');
      return;
    }

    // Wait for map to be fully loaded
    const addTrailLayer = () => {
      try {
        // Remove existing layer/source if they exist
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        // 1. Add source
        map.addSource(sourceId, {
          type: 'geojson',
          data: trail,
        });

        // 2. Add layer
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
        console.error('Error adding trail layer:', error);
      }
    };

    // Add layer when map is ready
    if (map.loaded()) {
      addTrailLayer();
    } else {
      map.once('load', addTrailLayer);
    }

    // Cleanup function
    return () => {
      if (!map) return;

      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        console.log('🗑️ Trail layer removed');
      } catch (error) {
        console.error('Error removing trail layer:', error);
      }
    };
  }, [trail.geometry, trail.properties.name, mapRef, color, width, fitBounds, sourceId, layerId]); // Use stable properties instead of whole object

  // This component renders nothing (it only adds layers to map)
  return null;
}

export default TrailLayer;
