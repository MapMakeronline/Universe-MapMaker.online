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
  console.log('🎨 DrawTools: Component mounted/rendering');

  const { current: map } = useMap();
  const dispatch = useAppDispatch();
  const { draw } = useAppSelector((state) => state.draw);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  console.log('🎨 DrawTools: Initial state check - map:', !!map, 'draw:', draw);

  // Debug Redux state changes
  useEffect(() => {
    console.log('🎨 DrawTools: Redux state changed:', draw);
    console.log('🎨 DrawTools: Current mode:', draw.mode);
    console.log('🎨 DrawTools: Is active:', draw.isActive);
    console.log('🎨 DrawTools: Features count:', draw.features.length);
    console.log('🎨 DrawTools: Map available:', !!map);
    console.log('🎨 DrawTools: Map ready:', isMapReady);
    console.log('🎨 DrawTools: DrawRef exists:', !!drawRef.current);
  }, [draw]);

  // Check if map is ready
  useEffect(() => {
    if (!map) {
      console.log('🗺️ DrawTools: No map available for readiness check');
      return;
    }

    console.log('🗺️ DrawTools: Checking map readiness...');
    const mapInstance = map.getMap();

    const checkMapReady = () => {
      console.log('🗺️ DrawTools: Style data event fired, checking if loaded...');
      if (mapInstance.isStyleLoaded()) {
        console.log('✅ DrawTools: Map style is loaded! Setting isMapReady = true');
        setIsMapReady(true);
      } else {
        console.log('⏳ DrawTools: Map style still loading...');
      }
    };

    if (mapInstance.isStyleLoaded()) {
      console.log('✅ DrawTools: Map style already loaded! Setting isMapReady = true');
      setIsMapReady(true);
    } else {
      console.log('⏳ DrawTools: Map style not loaded yet, adding load listener');
      // Używamy 'load' zamiast 'styledata' - bardziej niezawodne
      mapInstance.on('load', () => {
        console.log('✅ DrawTools: Map load event fired! Setting isMapReady = true');
        setIsMapReady(true);
      });

      // Fallback - jeśli event nie zadziała, spróbuj po 3 sekundach
      setTimeout(() => {
        if (!mapInstance.isStyleLoaded()) {
          console.log('⚠️ DrawTools: Timeout fallback - forcing map ready state');
          setIsMapReady(true);
        }
      }, 3000);
    }

    return () => {
      mapInstance.off('styledata', checkMapReady);
      mapInstance.off('load', checkMapReady);
    };
  }, [map]);

  // Initialize Mapbox GL Draw
  useEffect(() => {
    if (!map || !isMapReady) {
      console.log('🎨 DrawTools: Waiting for map..., map:', !!map, 'isMapReady:', isMapReady);
      return;
    }

    console.log('🎨 DrawTools: Initializing fresh DrawTools...');

    // Create simple draw instance with default modes
    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      userProperties: true,
      styles: DRAW_STYLES,
    });

    drawRef.current = drawInstance;
    map.addControl(drawInstance);

    console.log('🎨 DrawTools: DrawInstance created and added to map');
    console.log('🎨 DrawTools: Available drawing modes:', Object.keys(drawInstance.modes));

    // Event handlers
    const handleDrawCreate = (e: any) => {
      console.log('🎨✨ DrawTools: Feature created!', e.features);
      e.features.forEach((feature: any) => {
        dispatch(addDrawFeature(feature));
      });
    };

    const handleDrawUpdate = (e: any) => {
      console.log('🎨🔄 DrawTools: Feature updated!', e.features);
      e.features.forEach((feature: any) => {
        dispatch(updateDrawFeature(feature));
      });
    };

    const handleDrawDelete = (e: any) => {
      console.log('🎨🗑️ DrawTools: Feature deleted!', e.features);
      e.features.forEach((feature: any) => {
        dispatch(removeDrawFeature(feature.id));
      });
    };

    const handleDrawSelectionChange = (e: any) => {
      console.log('🎨🔍 DrawTools: Selection changed!', e.features);
      const selectedId = e.features.length > 0 ? e.features[0].id : undefined;
      dispatch(setSelectedFeature(selectedId));
    };

    // Basic map click handler to test if map events work at all
    const handleMapClick = (e: any) => {
      console.log('🗺️👆 DrawTools: Map clicked!', {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        currentDrawMode: draw.mode,
        drawRefExists: !!drawRef.current
      });
    };

    // Add event listeners
    console.log('🎨 DrawTools: Adding event listeners...');
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
    map.on('draw.selectionchange', handleDrawSelectionChange);

    // Add basic map click listener to test if map events work at all
    map.on('click', handleMapClick);
    console.log('🎨 DrawTools: Event listeners added successfully');

    return () => {
      // Cleanup
      console.log('🎨 DrawTools: Cleaning up event listeners...');
      map.off('draw.create', handleDrawCreate);
      map.off('draw.update', handleDrawUpdate);
      map.off('draw.delete', handleDrawDelete);
      map.off('draw.selectionchange', handleDrawSelectionChange);
      map.off('click', handleMapClick);

      if (drawRef.current) {
        console.log('🎨 DrawTools: Removing draw control from map');
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map, isMapReady, dispatch]);

  // Handle mode changes from Redux
  useEffect(() => {
    if (!drawRef.current) {
      console.log('🎨 DrawTools: Cannot change mode - drawRef is null');
      return;
    }

    console.log('🎨 DrawTools: Changing drawing mode to:', draw.mode);

    try {
      // Map our custom modes to standard Mapbox GL Draw modes
      let actualMode = draw.mode;

      switch (draw.mode) {
        case 'draw_point':
          actualMode = 'draw_point';
          break;
        case 'draw_line_string':
          actualMode = 'draw_line_string';
          break;
        case 'draw_polygon':
          actualMode = 'draw_polygon';
          break;
        case 'draw_rectangle':
          // For now, use polygon mode for rectangle - we'll enhance later
          actualMode = 'draw_polygon';
          console.log('🎨 DrawTools: Rectangle mode mapped to polygon');
          break;
        case 'simple_select':
          actualMode = 'simple_select';
          break;
        default:
          actualMode = 'simple_select';
          console.log('🎨 DrawTools: Unknown mode, defaulting to simple_select');
      }

      console.log('🎨 DrawTools: Calling changeMode with:', actualMode);
      drawRef.current.changeMode(actualMode);
      console.log('✅ DrawTools: Successfully changed to mode:', actualMode);

      // Check cursor change and add visual feedback
      const canvas = map.getCanvas();
      if (actualMode !== 'simple_select') {
        console.log('🎯 DrawTools: Setting cursor to crosshair for drawing mode');
        canvas.style.cursor = 'crosshair';
      } else {
        console.log('🎯 DrawTools: Setting cursor to default for select mode');
        canvas.style.cursor = '';
      }

    } catch (error) {
      console.error('❌ DrawTools: Failed to change drawing mode:', error);
      // Fallback to select mode
      try {
        drawRef.current.changeMode('simple_select');
        console.log('🔄 DrawTools: Fallback to simple_select successful');
      } catch (fallbackError) {
        console.error('💥 DrawTools: Even fallback failed:', fallbackError);
      }
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