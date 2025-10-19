/**
 * useMapRenderer Hook
 *
 * React hook for renderer-agnostic map integration.
 * Automatically manages lifecycle, syncs with Redux, handles cleanup.
 *
 * Usage:
 * ```tsx
 * function MapComponent() {
 *   const { renderer, isReady } = useMapRenderer({
 *     type: 'mapbox', // or 'leaflet', 'canvas', 'auto'
 *     container: 'map-container',
 *     center: { lng: 19.0, lat: 52.0 },
 *     zoom: 6,
 *   });
 *
 *   if (!isReady) return <div>Loading...</div>;
 *
 *   return <div id="map-container" style={{ width: '100%', height: '100vh' }} />;
 * }
 * ```
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapRenderer, LngLat } from './types';
import { MapRendererFactory, type RendererType, type RendererConfig } from './factory';

export interface UseMapRendererOptions extends RendererConfig {
  /** Renderer type */
  type?: RendererType;

  /** Container element ID or ref */
  container: string | React.RefObject<HTMLElement>;

  /** Initial map center */
  center: LngLat;

  /** Initial zoom level */
  zoom: number;

  /** Initial bearing (rotation in degrees) */
  bearing?: number;

  /** Initial pitch (tilt in degrees) */
  pitch?: number;

  /** Basemap style (URL or Mapbox style) */
  style?: string | object;

  /** Auto-sync with Redux layers state */
  syncWithRedux?: boolean;
}

export interface UseMapRendererReturn {
  /** Renderer instance (use this to control map) */
  renderer: MapRenderer | null;

  /** Is map ready for operations */
  isReady: boolean;

  /** Error during initialization */
  error: Error | null;

  /** Container ref (if you need it) */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * React hook for renderer-agnostic map
 *
 * Handles:
 * - Renderer initialization
 * - Lifecycle management (mount/unmount)
 * - Redux state synchronization (optional)
 * - Error handling
 */
export function useMapRenderer(options: UseMapRendererOptions): UseMapRendererReturn {
  const [renderer, setRenderer] = useState<MapRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create container ref if not provided
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef =
    typeof options.container === 'string' ? internalRef : options.container;

  // Initialize renderer
  useEffect(() => {
    let isMounted = true;
    let rendererInstance: MapRenderer | null = null;

    const initializeRenderer = async () => {
      try {
        // Get container element
        const container =
          typeof options.container === 'string'
            ? document.getElementById(options.container)
            : (containerRef as React.RefObject<HTMLElement>).current;

        if (!container) {
          throw new Error('Container element not found');
        }

        // Create renderer
        rendererInstance = MapRendererFactory.create(options.type || 'auto', {
          mapboxAccessToken: options.mapboxAccessToken,
          basemapStyle: options.basemapStyle,
          type: options.type,
          debug: options.debug,
        });

        // Initialize renderer
        await rendererInstance.initialize(container, {
          center: options.center,
          zoom: options.zoom,
          bearing: options.bearing,
          pitch: options.pitch,
          style: options.style,
        });

        if (isMounted) {
          setRenderer(rendererInstance);
          setIsReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize map renderer:', err);
        if (isMounted) {
          setError(err as Error);
        }
      }
    };

    initializeRenderer();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (rendererInstance) {
        rendererInstance.destroy();
      }
    };
  }, [options.container, options.type]); // Re-initialize if container or type changes

  return {
    renderer,
    isReady,
    error,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
  };
}

/**
 * Hook for syncing Redux layers with renderer
 *
 * Usage:
 * ```tsx
 * const { renderer } = useMapRenderer({ ... });
 * const layers = useAppSelector((state) => state.layers.layers);
 *
 * useMapRendererSync(renderer, layers, projectName);
 * ```
 */
export function useMapRendererSync(
  renderer: MapRenderer | null,
  layers: any[], // LayerNode[] from Redux
  projectName: string
) {
  const prevLayersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!renderer || !renderer.isReady()) return;

    // Detect changes in layers
    const prevLayers = prevLayersRef.current;
    const currentLayers = layers;

    // Find layers that changed visibility/opacity
    currentLayers.forEach((layer) => {
      const prevLayer = prevLayers.find((l) => l.id === layer.id);

      // Visibility changed
      if (prevLayer && prevLayer.visible !== layer.visible) {
        const layerId = `qgis-wms-layer-${projectName}-${layer.name}`;
        renderer.setLayerVisibility(layerId, layer.visible);
      }

      // Opacity changed
      if (prevLayer && prevLayer.opacity !== layer.opacity) {
        const layerId = `qgis-wms-layer-${projectName}-${layer.name}`;
        renderer.setLayerOpacity(layerId, layer.opacity);
      }
    });

    // Update ref
    prevLayersRef.current = currentLayers;
  }, [renderer, layers, projectName]);
}

/**
 * Hook for controlling viewport
 *
 * Usage:
 * ```tsx
 * const { renderer } = useMapRenderer({ ... });
 * const { flyTo, fitBounds } = useMapRendererControls(renderer);
 *
 * <button onClick={() => flyTo({ center: { lng: 19, lat: 52 }, zoom: 10 })}>
 *   Fly to Warsaw
 * </button>
 * ```
 */
export function useMapRendererControls(renderer: MapRenderer | null) {
  const flyTo = useCallback(
    async (state: { center?: LngLat; zoom?: number; bearing?: number; pitch?: number }) => {
      if (!renderer) return;
      await renderer.flyTo(state);
    },
    [renderer]
  );

  const fitBounds = useCallback(
    async (bbox: [number, number, number, number], options?: { padding?: number }) => {
      if (!renderer) return;
      await renderer.fitBounds(bbox, options);
    },
    [renderer]
  );

  const setViewState = useCallback(
    (state: { center?: LngLat; zoom?: number; bearing?: number; pitch?: number }) => {
      if (!renderer) return;
      renderer.setViewState(state);
    },
    [renderer]
  );

  return {
    flyTo,
    fitBounds,
    setViewState,
  };
}
