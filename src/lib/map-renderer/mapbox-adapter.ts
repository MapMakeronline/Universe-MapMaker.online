/**
 * Mapbox GL JS Adapter
 *
 * Implements MapRenderer interface for Mapbox GL JS / MapLibre GL.
 * Wraps Mapbox API to match renderer-agnostic interface.
 */

import mapboxgl from 'mapbox-gl';
import type {
  MapRenderer,
  ViewState,
  LngLat,
  BBox,
  WMSLayerConfig,
  GeoJSONLayerConfig,
  BackgroundLayerConfig,
} from './types';

export class MapboxRenderer implements MapRenderer {
  private map: mapboxgl.Map | null = null;
  private container: HTMLElement | null = null;
  private eventHandlers: Map<string, Set<(e: any) => void>> = new Map();

  // ========================================
  // Lifecycle
  // ========================================

  async initialize(
    container: HTMLElement,
    options: {
      center: LngLat;
      zoom: number;
      bearing?: number;
      pitch?: number;
      style?: string | object;
    }
  ): Promise<void> {
    this.container = container;

    // Default to blank style if not provided
    const style = options.style || this.createBlankStyle();

    this.map = new mapboxgl.Map({
      container,
      center: [options.center.lng, options.center.lat],
      zoom: options.zoom,
      bearing: options.bearing || 0,
      pitch: options.pitch || 0,
      style: style as any,
      // Disable attribution for cleaner UI (re-enable if needed)
      attributionControl: false,
    });

    // Wait for map to load
    return new Promise((resolve) => {
      this.map!.once('load', () => resolve());
    });
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.container = null;
    this.eventHandlers.clear();
  }

  isReady(): boolean {
    return this.map !== null && this.map.isStyleLoaded();
  }

  // ========================================
  // Viewport Control
  // ========================================

  getViewState(): ViewState {
    if (!this.map) throw new Error('Map not initialized');

    const center = this.map.getCenter();
    return {
      center: { lng: center.lng, lat: center.lat },
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
    };
  }

  setViewState(state: Partial<ViewState>): void {
    if (!this.map) throw new Error('Map not initialized');

    const options: any = {};
    if (state.center) options.center = [state.center.lng, state.center.lat];
    if (state.zoom !== undefined) options.zoom = state.zoom;
    if (state.bearing !== undefined) options.bearing = state.bearing;
    if (state.pitch !== undefined) options.pitch = state.pitch;

    this.map.jumpTo(options);
  }

  async flyTo(
    state: Partial<ViewState>,
    options?: { duration?: number; easing?: (t: number) => number }
  ): Promise<void> {
    if (!this.map) throw new Error('Map not initialized');

    const flyOptions: any = {
      duration: options?.duration || 2000,
      easing: options?.easing,
    };

    if (state.center) flyOptions.center = [state.center.lng, state.center.lat];
    if (state.zoom !== undefined) flyOptions.zoom = state.zoom;
    if (state.bearing !== undefined) flyOptions.bearing = state.bearing;
    if (state.pitch !== undefined) flyOptions.pitch = state.pitch;

    return new Promise((resolve) => {
      this.map!.once('moveend', () => resolve());
      this.map!.flyTo(flyOptions);
    });
  }

  async fitBounds(
    bbox: BBox,
    options?: { padding?: number; duration?: number }
  ): Promise<void> {
    if (!this.map) throw new Error('Map not initialized');

    const [west, south, east, north] = bbox;

    return new Promise((resolve) => {
      this.map!.once('moveend', () => resolve());
      this.map!.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: options?.padding || 50,
          duration: options?.duration || 1000,
        }
      );
    });
  }

  // ========================================
  // Layer Management
  // ========================================

  addLayer(
    config: WMSLayerConfig | GeoJSONLayerConfig | BackgroundLayerConfig
  ): string {
    if (!this.map) throw new Error('Map not initialized');

    const layerId = config.id;

    // Remove layer if already exists
    if (this.map.getLayer(layerId)) {
      this.removeLayer(layerId);
    }

    // Add source and layer based on type
    if (config.type === 'raster') {
      this.addWMSLayer(config as WMSLayerConfig);
    } else if (config.type === 'geojson' || config.type === 'vector') {
      this.addGeoJSONLayer(config as GeoJSONLayerConfig);
    } else if (config.type === 'background') {
      this.addBackgroundLayer(config as BackgroundLayerConfig);
    }

    return layerId;
  }

  removeLayer(layerId: string): void {
    if (!this.map) return;

    // Remove layer
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }

    // Remove fill layer (for polygons)
    const fillLayerId = `${layerId}-fill`;
    if (this.map.getLayer(fillLayerId)) {
      this.map.removeLayer(fillLayerId);
    }

    // Remove source
    const sourceId = layerId;
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }
  }

  hasLayer(layerId: string): boolean {
    if (!this.map) return false;
    return this.map.getLayer(layerId) !== undefined;
  }

  getLayers(): string[] {
    if (!this.map) return [];
    return this.map.getStyle().layers.map((l) => l.id);
  }

  // ========================================
  // Layer Properties
  // ========================================

  setLayerVisibility(layerId: string, visible: boolean): void {
    if (!this.map) return;

    const visibility = visible ? 'visible' : 'none';

    // Update main layer
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(layerId, 'visibility', visibility);
    }

    // Update fill layer (for polygons)
    const fillLayerId = `${layerId}-fill`;
    if (this.map.getLayer(fillLayerId)) {
      this.map.setLayoutProperty(fillLayerId, 'visibility', visibility);
    }
  }

  getLayerVisibility(layerId: string): boolean {
    if (!this.map || !this.map.getLayer(layerId)) return false;
    return this.map.getLayoutProperty(layerId, 'visibility') !== 'none';
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    if (!this.map || !this.map.getLayer(layerId)) return;

    const layer = this.map.getLayer(layerId);

    if (layer?.type === 'raster') {
      this.map.setPaintProperty(layerId, 'raster-opacity', opacity);
    } else if (layer?.type === 'circle') {
      this.map.setPaintProperty(layerId, 'circle-opacity', opacity);
    } else if (layer?.type === 'line') {
      this.map.setPaintProperty(layerId, 'line-opacity', opacity);
    } else if (layer?.type === 'fill') {
      this.map.setPaintProperty(layerId, 'fill-opacity', opacity);
    }

    // Update fill layer (for polygons)
    const fillLayerId = `${layerId}-fill`;
    if (this.map.getLayer(fillLayerId)) {
      this.map.setPaintProperty(fillLayerId, 'fill-opacity', opacity * 0.5);
    }
  }

  getLayerOpacity(layerId: string): number {
    if (!this.map || !this.map.getLayer(layerId)) return 1;

    const layer = this.map.getLayer(layerId);

    if (layer?.type === 'raster') {
      return this.map.getPaintProperty(layerId, 'raster-opacity') || 1;
    } else if (layer?.type === 'circle') {
      return this.map.getPaintProperty(layerId, 'circle-opacity') || 1;
    } else if (layer?.type === 'line') {
      return this.map.getPaintProperty(layerId, 'line-opacity') || 1;
    } else if (layer?.type === 'fill') {
      return this.map.getPaintProperty(layerId, 'fill-opacity') || 1;
    }

    return 1;
  }

  moveLayer(layerId: string, beforeId?: string): void {
    if (!this.map || !this.map.getLayer(layerId)) return;
    this.map.moveLayer(layerId, beforeId);
  }

  // ========================================
  // Feature Interaction
  // ========================================

  queryRenderedFeatures(
    point: [number, number],
    options?: { layers?: string[]; radius?: number }
  ): any[] {
    if (!this.map) return [];

    // Query features with bbox (better for click tolerance)
    const radius = options?.radius || 5;
    const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
      [point[0] - radius, point[1] - radius],
      [point[0] + radius, point[1] + radius],
    ];

    return this.map.queryRenderedFeatures(bbox, {
      layers: options?.layers,
    });
  }

  queryRenderedFeaturesInBBox(
    bbox: [number, number, number, number],
    options?: { layers?: string[] }
  ): any[] {
    if (!this.map) return [];

    return this.map.queryRenderedFeatures(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      {
        layers: options?.layers,
      }
    );
  }

  // ========================================
  // Coordinate Conversion
  // ========================================

  project(lngLat: LngLat): [number, number] {
    if (!this.map) return [0, 0];
    const point = this.map.project([lngLat.lng, lngLat.lat]);
    return [point.x, point.y];
  }

  unproject(point: [number, number]): LngLat {
    if (!this.map) return { lng: 0, lat: 0 };
    const lngLat = this.map.unproject(point);
    return { lng: lngLat.lng, lat: lngLat.lat };
  }

  // ========================================
  // Events
  // ========================================

  on(event: string, handler: (e: any) => void): void {
    if (!this.map) return;

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    this.map.on(event as any, handler);
  }

  off(event: string, handler: (e: any) => void): void {
    if (!this.map) return;

    this.eventHandlers.get(event)?.delete(handler);
    this.map.off(event as any, handler);
  }

  once(event: string, handler: (e: any) => void): void {
    if (!this.map) return;
    this.map.once(event as any, handler);
  }

  // ========================================
  // Advanced Features
  // ========================================

  setTerrain(enabled: boolean): void {
    if (!this.map) return;

    if (enabled) {
      // Add terrain source
      if (!this.map.getSource('mapbox-dem')) {
        this.map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb',
          tileSize: 512,
          maxzoom: 14,
        });
      }

      this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    } else {
      this.map.setTerrain(null);
    }
  }

  getNativeInstance(): any {
    return this.map;
  }

  getRendererType(): 'mapbox' {
    return 'mapbox';
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private addWMSLayer(config: WMSLayerConfig): void {
    if (!this.map) return;

    this.map.addSource(config.id, {
      type: 'raster',
      tiles: [config.url],
      tileSize: 256,
      minzoom: config.minZoom || 0,
      maxzoom: config.maxZoom || 22,
    });

    this.map.addLayer({
      id: config.id,
      type: 'raster',
      source: config.id,
      paint: {
        'raster-opacity': config.opacity,
      },
      layout: {
        visibility: config.visible ? 'visible' : 'none',
      },
    });
  }

  private addGeoJSONLayer(config: GeoJSONLayerConfig): void {
    if (!this.map) return;

    // Add GeoJSON source
    this.map.addSource(config.id, {
      type: 'geojson',
      data: config.data,
    });

    // Determine geometry type from first feature
    const features = config.data.features || [];
    const geometryType = features[0]?.geometry?.type;

    const style = config.style || {};

    // Add layer based on geometry type
    if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      this.map.addLayer({
        id: config.id,
        type: 'circle',
        source: config.id,
        paint: {
          'circle-color': style.fillColor || '#f75e4c',
          'circle-opacity': style.fillOpacity || config.opacity,
          'circle-radius': style.circleRadius || 6,
          'circle-stroke-color': style.strokeColor || '#ffffff',
          'circle-stroke-width': style.strokeWidth || 2,
        },
        layout: {
          visibility: config.visible ? 'visible' : 'none',
        },
      });
    } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      this.map.addLayer({
        id: config.id,
        type: 'line',
        source: config.id,
        paint: {
          'line-color': style.strokeColor || '#f75e4c',
          'line-width': style.strokeWidth || 3,
          'line-opacity': style.strokeOpacity || config.opacity,
        },
        layout: {
          visibility: config.visible ? 'visible' : 'none',
        },
      });
    } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      // Add fill layer
      this.map.addLayer({
        id: `${config.id}-fill`,
        type: 'fill',
        source: config.id,
        paint: {
          'fill-color': style.fillColor || '#f75e4c',
          'fill-opacity': (style.fillOpacity || config.opacity) * 0.5,
        },
        layout: {
          visibility: config.visible ? 'visible' : 'none',
        },
      });

      // Add stroke layer
      this.map.addLayer({
        id: config.id,
        type: 'line',
        source: config.id,
        paint: {
          'line-color': style.strokeColor || '#ffffff',
          'line-width': style.strokeWidth || 2,
        },
        layout: {
          visibility: config.visible ? 'visible' : 'none',
        },
      });
    }
  }

  private addBackgroundLayer(config: BackgroundLayerConfig): void {
    if (!this.map) return;

    this.map.addLayer({
      id: config.id,
      type: 'background',
      paint: {
        'background-color': config.color,
      },
      layout: {
        visibility: config.visible ? 'visible' : 'none',
      },
    });
  }

  /**
   * Create minimal blank style (no basemap)
   */
  private createBlankStyle(): object {
    return {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#f5f5f5', // Light gray (change to 'rgba(0,0,0,0)' for transparent)
          },
        },
      ],
    };
  }
}
