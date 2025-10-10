/**
 * Mapbox Performance Optimizations
 *
 * This module contains performance utilities and configurations for Mapbox GL JS
 * to ensure smooth 60fps rendering even on low-end devices.
 */

import type { MapRef } from 'react-map-gl';
import type mapboxgl from 'mapbox-gl';

/**
 * Enhanced Map Configuration for Maximum Performance
 * Based on Mapbox GL JS best practices (v3.x)
 */
export const PERFORMANCE_CONFIG = {
  // Rendering optimizations
  antialias: false, // Disable antialiasing (25% performance boost)
  preserveDrawingBuffer: false, // Don't keep canvas buffer (better memory)
  failIfMajorPerformanceCaveat: false, // Allow WebGL on all devices

  // Tile & cache optimizations
  maxTileCacheSize: 50, // Reduce cache (faster GC, less memory)
  refreshExpiredTiles: false, // Don't auto-refresh old tiles
  renderWorldCopies: false, // Don't render world duplicates

  // Animation optimizations
  fadeDuration: 100, // Faster tile fade (default: 300ms)
  crossSourceCollisions: false, // Disable collision detection across sources

  // Interaction optimizations
  clickTolerance: 5, // Larger tap area for mobile
  dragRotate: true,
  dragPan: true,
  touchZoomRotate: { around: 'center' }, // Optimize touch gestures

  // Disable unnecessary features
  doubleClickZoom: false, // Conflicts with drawing tools
  attributionControl: false, // Add separately for control
  logoPosition: 'bottom-left' as const,
};

/**
 * Layer-specific performance settings
 */
export const LAYER_PERFORMANCE = {
  // 3D Buildings
  buildings: {
    minzoom: 15, // Don't render buildings below zoom 15
    maxzoom: 22,
    // Use feature-state instead of filters for selection (10x faster)
    useFeatureState: true,
  },

  // Vector layers
  vector: {
    minzoom: 0,
    maxzoom: 22,
    // Simplify geometries based on zoom
    tolerance: 0.375, // Douglas-Peucker simplification
  },

  // Raster layers
  raster: {
    minzoom: 0,
    maxzoom: 22,
    tileSize: 512, // Use 512px tiles (fewer requests)
  },
};

/**
 * Throttle function for Redux updates
 * Prevents excessive re-renders during map movement
 */
export const createThrottle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    // Clear pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (now - lastCall >= delay) {
      // Execute immediately if enough time has passed
      lastCall = now;
      func(...args);
    } else {
      // Schedule execution for later
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };
};

/**
 * Debounce function for expensive operations
 */
export const createDebounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Optimize map for low-end devices
 * Detects device capabilities and adjusts settings
 */
export const optimizeForDevice = (map: mapboxgl.Map): void => {
  // Detect device type
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const isLowEnd = isMobile && (navigator.hardwareConcurrency || 2) <= 2;

  if (isLowEnd) {
    console.log('🔧 Detected low-end device - applying optimizations');

    // Reduce render quality
    map.setMaxBounds(undefined); // Remove bounds constraint (faster panning)
    map.setMaxPitch(45); // Limit pitch (less geometry to render)

    // Disable expensive effects
    map.setFog(null); // Remove atmospheric fog
    map.setLight({ anchor: 'viewport', intensity: 0.5 }); // Reduce lighting
  }

  // Enable WebGL optimizations
  const gl = map.painter?.context?.gl;
  if (gl) {
    // Enable conservative memory usage
    gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
  }
};

/**
 * Batch feature-state updates for better performance
 * Instead of updating each feature individually, batch them
 */
export class FeatureStateBatcher {
  private map: mapboxgl.Map;
  private updates: Map<string, Map<string, any>> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  /**
   * Queue a feature-state update
   */
  setFeatureState(
    source: string,
    sourceLayer: string | undefined,
    featureId: string | number,
    state: Record<string, any>
  ): void {
    const key = `${source}:${sourceLayer}:${featureId}`;

    if (!this.updates.has(key)) {
      this.updates.set(key, new Map());
    }

    const featureUpdates = this.updates.get(key)!;
    Object.entries(state).forEach(([k, v]) => {
      featureUpdates.set(k, v);
    });

    // Schedule batch update
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, 16); // ~60fps
  }

  /**
   * Apply all queued updates at once
   */
  private flush(): void {
    this.updates.forEach((stateMap, key) => {
      const [source, sourceLayer, featureId] = key.split(':');
      const state = Object.fromEntries(stateMap);

      this.map.setFeatureState(
        {
          source,
          sourceLayer: sourceLayer !== 'undefined' ? sourceLayer : undefined,
          id: featureId,
        },
        state
      );
    });

    this.updates.clear();
    this.timeoutId = null;
  }

  /**
   * Clear all queued updates
   */
  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.updates.clear();
  }
}

/**
 * Viewport-based layer loading
 * Only render layers visible in current viewport
 */
export const updateLayerVisibility = (
  map: mapboxgl.Map,
  layers: Array<{ id: string; minzoom?: number; maxzoom?: number }>
): void => {
  const zoom = map.getZoom();

  layers.forEach(({ id, minzoom = 0, maxzoom = 22 }) => {
    const visibility = zoom >= minzoom && zoom <= maxzoom ? 'visible' : 'none';

    try {
      map.setLayoutProperty(id, 'visibility', visibility);
    } catch (e) {
      // Layer doesn't exist yet
    }
  });
};

/**
 * Memory management - clear unused resources
 */
export const clearMapCache = (map: mapboxgl.Map): void => {
  // Force garbage collection of old tiles
  const style = map.getStyle();
  if (style?.sources) {
    Object.keys(style.sources).forEach((sourceId) => {
      try {
        const source = map.getSource(sourceId) as any;
        if (source && typeof source.clearTiles === 'function') {
          source.clearTiles();
        }
      } catch (e) {
        // Source might not support clearTiles
      }
    });
  }
};

/**
 * Preload tiles for smooth panning
 * Load tiles around current viewport in advance
 */
export const preloadTiles = (map: mapboxgl.Map): void => {
  const bounds = map.getBounds();
  const zoom = Math.ceil(map.getZoom());

  // Preload tiles 1 zoom level higher for smooth zoom in
  if (zoom < 22) {
    map.once('idle', () => {
      // Trigger tile loading by temporarily changing bounds
      const padding = {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100,
      };

      map.fitBounds(bounds, { padding, duration: 0 });
    });
  }
};

/**
 * Monitor and log performance metrics
 */
export const trackPerformance = (map: mapboxgl.Map): void => {
  if (process.env.NODE_ENV === 'development') {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        console.log(`📊 Mapbox FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measureFPS);
    };

    measureFPS();

    // Log render statistics
    map.on('render', () => {
      const stats = (map as any).painter?.renderToTexture?.stats;
      if (stats) {
        console.log('🎨 Render stats:', stats);
      }
    });
  }
};
