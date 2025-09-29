'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setDrawMode,
  addDrawFeature,
  updateDrawFeature,
  removeDrawFeature,
  setSelectedFeature,
} from '@/store/slices/drawSlice';
import { DRAW_STYLES } from '@/lib/mapbox/draw-styles';

// Import styles for Mapbox GL Draw
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const DrawTools: React.FC = () => {
  const { current: map } = useMap();
  const dispatch = useAppDispatch();
  const { draw } = useAppSelector((state) => state.draw);
  const drawRef = useRef<MapboxDraw | null>(null);
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

    // Initialize Mapbox GL Draw
    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      userProperties: true,
      styles: DRAW_STYLES,
    });

    drawRef.current = drawInstance;
    map.addControl(drawInstance);

    // Event handlers
    const handleDrawCreate = (e: any) => {
      e.features.forEach((feature: any) => {
        dispatch(addDrawFeature(feature));
      });
    };

    const handleDrawUpdate = (e: any) => {
      e.features.forEach((feature: any) => {
        dispatch(updateDrawFeature(feature));
      });
    };

    const handleDrawDelete = (e: any) => {
      e.features.forEach((feature: any) => {
        dispatch(removeDrawFeature(feature.id));
      });
    };

    const handleDrawSelectionChange = (e: any) => {
      const selectedId = e.features.length > 0 ? e.features[0].id : undefined;
      dispatch(setSelectedFeature(selectedId));
    };

    // Add event listeners
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
    map.on('draw.selectionchange', handleDrawSelectionChange);

    return () => {
      // Cleanup
      map.off('draw.create', handleDrawCreate);
      map.off('draw.update', handleDrawUpdate);
      map.off('draw.delete', handleDrawDelete);
      map.off('draw.selectionchange', handleDrawSelectionChange);

      if (drawRef.current) {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map, isMapReady, dispatch]);

  // Update draw mode when Redux state changes
  useEffect(() => {
    if (!drawRef.current) return;

    try {
      // Map modes that might not be available in standard mapbox-gl-draw
      const modeMap: Record<string, string> = {
        'draw_rectangle': 'draw_polygon',
        'draw_circle': 'draw_polygon',
      };

      const mappedMode = modeMap[draw.mode] || draw.mode;
      drawRef.current.changeMode(mappedMode);
    } catch (error) {
      console.error('Error changing draw mode:', error);
    }
  }, [draw.mode]);

  // Sync features from Redux to Draw instance
  useEffect(() => {
    if (!drawRef.current) return;

    const currentFeatures = drawRef.current.getAll();

    // Remove features that are not in Redux
    currentFeatures.features.forEach((feature) => {
      const existsInRedux = draw.features.some(f => f.id === feature.id);
      if (!existsInRedux) {
        try {
          drawRef.current!.delete(feature.id as string);
        } catch (error) {
          console.warn('Error deleting feature:', error);
        }
      }
    });

    // Add features that are in Redux but not in Draw
    draw.features.forEach((feature) => {
      const existsInDraw = currentFeatures.features.some(f => f.id === feature.id);
      if (!existsInDraw) {
        try {
          drawRef.current!.add(feature);
        } catch (error) {
          console.warn('Error adding feature:', error);
        }
      }
    });
  }, [draw.features]);

  return null; // This component doesn't render anything
};

export default DrawTools;