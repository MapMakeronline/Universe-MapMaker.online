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
import { mapLogger } from '@/tools/logger';

// Device detection utilities (inline to avoid extra file)
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const getDeviceMemory = () => {
  if (typeof window === 'undefined') return 8;
  return (navigator as any).deviceMemory || 8;
};

const getBuildingHeightMultiplier = () => {
  const memory = getDeviceMemory();
  const ios = isIOS();
  // Lower height multiplier for low-memory devices
  if (ios || memory <= 2) return 0.7;
  if (memory <= 4) return 0.85;
  return 1.0;
};

const getDeviceLogPrefix = () => {
  const ios = isIOS();
  const memory = getDeviceMemory();
  return ios ? `📱 iOS (${memory}GB)` : `💻 Desktop (${memory}GB)`;
};

const Buildings3D = () => {
  const { current: mapRef } = useMap();
  // PERFORMANCE: Subscribe only to mapStyleKey (not entire state.map)
  // Prevents re-render when viewState changes during map panning
  const mapStyleKey = useAppSelector((state) => state.map.mapStyleKey);

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

      // Get device-specific optimizations
      const iosDevice = isIOS();
      const deviceMemory = getDeviceMemory();
      const heightMultiplier = getBuildingHeightMultiplier();
      const devicePrefix = getDeviceLogPrefix();

      mapLogger.log(`🏢 ${devicePrefix} Style event fired, checking 3D mode:`, {
        mapStyleKey,
        enable3D: currentStyle?.enable3D,
        enableTerrain: currentStyle?.enableTerrain,
        enableSky: currentStyle?.enableSky,
        styleName: currentStyle?.name,
        device: { ios: iosDevice, memory: deviceMemory, heightMultiplier }
      });

      // Check if full 3D mode (terrain + buildings + sky)
      if (currentStyle?.enableTerrain && currentStyle?.enableSky) {
        try {
          mapLogger.log(`🌄 ${devicePrefix} Enabling FULL 3D mode (terrain + buildings + sky)`);

          // OPTIMIZED: Reduced pitch angles for better FPS
          // iOS gets even lower pitch for better GPU performance
          const currentZoom = map.getZoom();
          const basePitch = currentZoom < 10 ? 35 : 50;
          const pitch = iosDevice ? Math.max(25, basePitch - 10) : basePitch;

          // iOS gets reduced terrain exaggeration
          const terrainExaggeration = iosDevice ? 0.6 : 0.8;

          const success = enableFull3DMode(map, {
            terrainExaggeration,
            pitch: pitch,
            bearing: 0
          });

          if (success) {
            mapLogger.log(`✅ ${devicePrefix} Full 3D mode enabled`, {
              pitch: `${pitch}°`,
              zoom: currentZoom.toFixed(1),
              terrainExaggeration,
              heightMultiplier
            });
            if (currentZoom < 16) {
              mapLogger.log(`ℹ️ Zoom in to level 16+ to see 3D buildings. Current: ${currentZoom.toFixed(1)}`);
            }
          } else {
            mapLogger.error(`❌ ${devicePrefix} Failed to enable full 3D mode`);
          }
        } catch (e) {
          mapLogger.error(`❌ ${devicePrefix} Failed to enable full 3D mode:`, e);
        }
      }
      // Just 3D buildings
      else if (currentStyle?.enable3D) {
        try {
          mapLogger.log(`🏢 ${devicePrefix} Enabling 3D buildings only`);

          // OPTIMIZED: Reduced pitch angles for better FPS
          // iOS gets even lower pitch for better GPU performance
          const currentZoom = map.getZoom();
          const basePitch = currentZoom < 10 ? 35 : 50;
          const pitch = iosDevice ? Math.max(25, basePitch - 10) : basePitch;

          // Set pitch for 3D view (faster transition)
          map.easeTo({
            pitch: pitch,
            bearing: 0,
            duration: 800
          });

          // Add 3D buildings with device-specific height multiplier
          const success = add3DBuildings(map, {
            minzoom: 16,
            heightMultiplier
          });

          if (success) {
            mapLogger.log(`✅ ${devicePrefix} 3D buildings enabled`, {
              pitch: `${pitch}°`,
              zoom: currentZoom.toFixed(1),
              heightMultiplier
            });
            if (currentZoom < 16) {
              mapLogger.log(`ℹ️ Zoom in to level 16+ to see buildings. Current: ${currentZoom.toFixed(1)}`);
            }
          } else {
            mapLogger.error(`❌ ${devicePrefix} Failed to add 3D buildings`);
          }
        } catch (e) {
          mapLogger.error(`❌ ${devicePrefix} Failed to add 3D buildings:`, e);
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

    // ==================== WEBGL CONTEXT LOSS RECOVERY ====================
    // Handle WebGL context loss (happens during memory pressure or GPU issues)
    // IMPORTANT: Don't try to restore immediately - wait for browser to recover
    let isContextLost = false;
    let restoreTimer: NodeJS.Timeout | null = null;

    const handleContextLost = (e: any) => {
      e.preventDefault();
      isContextLost = true;
      mapLogger.warn('⚠️ WebGL context lost - waiting for recovery...');

      // Clear any pending restore timer
      if (restoreTimer) {
        clearTimeout(restoreTimer);
        restoreTimer = null;
      }
    };

    const handleContextRestored = () => {
      if (!isContextLost) return;

      mapLogger.log('✅ WebGL context restored');
      isContextLost = false;

      // CRITICAL: Wait longer before re-initializing to ensure full recovery
      // Immediate re-initialization can cause cascading context losses
      if (restoreTimer) {
        clearTimeout(restoreTimer);
      }

      restoreTimer = setTimeout(() => {
        try {
          mapLogger.log('🔄 Re-initializing 3D features after context recovery');
          onStyleLoad();
        } catch (err) {
          mapLogger.error('❌ Failed to restore 3D features:', err);
        }
        restoreTimer = null;
      }, 1000); // Wait 1 second for full GPU recovery
    };

    const canvas = map.getCanvas();
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      mapLogger.log('🏢 Cleaning up Buildings3D component');

      // Clear restore timer if pending
      if (restoreTimer) {
        clearTimeout(restoreTimer);
        restoreTimer = null;
      }

      // Remove event listeners
      map.off('style.load', handleStyleLoad);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      // Cleanup 3D features
      try {
        disableFull3DMode(map);
      } catch (e) {
        // Layers already removed - that's OK
      }
    };
  }, [mapRef, mapStyleKey]);

  return null;
};

export default Buildings3D;
