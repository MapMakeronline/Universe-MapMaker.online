'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/redux/hooks';
import { MAP_STYLES } from '@/mapbox/config';
import {
  add3DBuildings,
  remove3DBuildings,
  add3DTerrain,
  remove3DTerrain,
  addSkyLayer,
  removeSkyLayer,
  enableFull3DMode,
  disableFull3DMode
} from '@/mapbox/map3d';
import { mapLogger } from '@/narzedzia/logger';

const Buildings3D = () => {
  const { current: mapRef } = useMap();
  const { mapStyleKey, mapStyle } = useAppSelector((state) => state.map);

  useEffect(() => {
    if (!mapRef) {
      return;
    }

    // Get native Mapbox GL map instance
    const map = mapRef.getMap();
    if (!map) {
      return;
    }

    // Clean up 3D features BEFORE style change
    const cleanup3DFeatures = () => {
      try {
        mapLogger.log('🧹 Cleaning up 3D features before style change');
        remove3DBuildings(map);
        removeSkyLayer(map);
        remove3DTerrain(map);
      } catch (e) {
        // Layers might not exist yet - that's OK
      }
    };

    const onStyleLoad = () => {
      // Check if current style has 3D enabled using mapStyleKey
      const currentStyle = mapStyleKey ? MAP_STYLES[mapStyleKey] : undefined;

      mapLogger.log('🏢 Style event fired, checking 3D mode:', {
        mapStyleKey,
        enable3D: currentStyle?.enable3D,
        enableTerrain: currentStyle?.enableTerrain,
        enableSky: currentStyle?.enableSky,
        styleName: currentStyle?.name
      });

      // Check if full 3D mode (terrain + buildings + sky)
      if (currentStyle?.enableTerrain && currentStyle?.enableSky) {
        try {
          mapLogger.log('🌄 Enabling FULL 3D mode (terrain + buildings + sky)');

          // Get current zoom to adjust pitch
          const currentZoom = map.getZoom();
          const pitch = currentZoom < 10 ? 45 : 60;

          const success = enableFull3DMode(map, {
            terrainExaggeration: 1.2,
            pitch: pitch,
            bearing: 0
          });

          if (success) {
            mapLogger.log(`✅ Full 3D mode enabled (pitch: ${pitch}°, zoom: ${currentZoom.toFixed(1)})`);
            if (currentZoom < 15) {
              mapLogger.log(`ℹ️ Zoom in to level 15+ to see 3D buildings. Current: ${currentZoom.toFixed(1)}`);
            }
          } else {
            mapLogger.error('❌ Failed to enable full 3D mode');
          }
        } catch (e) {
          mapLogger.error('❌ Failed to enable full 3D mode:', e);
        }
      }
      // Just 3D buildings
      else if (currentStyle?.enable3D) {
        try {
          mapLogger.log('🏢 Enabling 3D buildings only');

          // Get current zoom to adjust pitch
          const currentZoom = map.getZoom();
          const pitch = currentZoom < 10 ? 45 : 60;

          // Set pitch for 3D view
          map.easeTo({
            pitch: pitch,
            bearing: 0,
            duration: 1000
          });

          // Add 3D buildings
          const success = add3DBuildings(map);

          if (success) {
            mapLogger.log(`✅ 3D buildings enabled (pitch: ${pitch}°, zoom: ${currentZoom.toFixed(1)})`);
            if (currentZoom < 15) {
              mapLogger.log(`ℹ️ Zoom in to level 15+ to see buildings. Current: ${currentZoom.toFixed(1)}`);
            }
          } else {
            mapLogger.error('❌ Failed to add 3D buildings');
          }
        } catch (e) {
          mapLogger.error('❌ Failed to add 3D buildings:', e);
        }
      }
      // No 3D - clean up everything
      else {
        try {
          mapLogger.log('🏢 Disabling all 3D features');
          disableFull3DMode(map);
          mapLogger.log('✅ All 3D features disabled');
        } catch (e) {
          mapLogger.error('❌ Failed to remove 3D features:', e);
        }
      }
    };

    // Clean up before style change
    cleanup3DFeatures();

    // Apply 3D features when style is fully loaded
    // Use 'style.load' event which fires when style is completely loaded
    const handleStyleLoad = () => {
      mapLogger.log('🗺️ Style fully loaded, applying 3D features');
      onStyleLoad();
    };

    // Check if map is already loaded
    if (map.loaded() && map.isStyleLoaded()) {
      mapLogger.log('🗺️ Map already loaded, applying 3D settings immediately');
      // Small delay to ensure everything is ready
      setTimeout(() => onStyleLoad(), 100);
    } else {
      mapLogger.log('🗺️ Waiting for map style to load');
      map.once('style.load', handleStyleLoad);
    }

    // Listen for future style changes
    map.on('style.load', handleStyleLoad);

    return () => {
      mapLogger.log('🏢 Cleaning up Buildings3D component');
      map.off('style.load', handleStyleLoad);
      try {
        disableFull3DMode(map);
      } catch (e) {
        // Layers already removed
      }
    };
  }, [mapRef, mapStyleKey]);

  return null;
};

export default Buildings3D;
