/**
 * Leaflet.js Adapter
 *
 * Implements MapRenderer interface for Leaflet.js.
 * Demonstrates how to add alternative map engine with minimal code changes.
 *
 * Installation:
 * npm install leaflet @types/leaflet
 *
 * Usage:
 * const renderer = new LeafletRenderer();
 * await renderer.initialize(container, { center, zoom });
 */

import type {
  MapRenderer,
  ViewState,
  LngLat,
  BBox,
  WMSLayerConfig,
  GeoJSONLayerConfig,
  BackgroundLayerConfig,
} from './types';

// Leaflet types (install with: npm install leaflet @types/leaflet)
// For now, use 'any' to avoid requiring Leaflet dependency
type LeafletMap = any;
type LeafletLayer = any;

export class LeafletRenderer implements MapRenderer {
  private map: LeafletMap | null = null;
  private container: HTMLElement | null = null;
  private layers: Map<string, LeafletLayer> = new Map();
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
    // Dynamic import to avoid bundling Leaflet if not used
    const L = await import('leaflet');

    this.container = container;

    // Create Leaflet map
    this.map = L.map(container, {
      center: [options.center.lat, options.center.lng], // Leaflet uses [lat, lng]
      zoom: options.zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Add default tile layer if style URL provided
    if (typeof options.style === 'string') {
      L.tileLayer(options.style, {
        maxZoom: 19,
      }).addTo(this.map);
    }

    // Leaflet doesn't have async load event, resolve immediately
    return Promise.resolve();
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.container = null;
    this.layers.clear();
    this.eventHandlers.clear();
  }

  isReady(): boolean {
    return this.map !== null;
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
      bearing: 0, // Leaflet doesn't support bearing by default
      pitch: 0,   // Leaflet doesn't support pitch
    };
  }

  setViewState(state: Partial<ViewState>): void {
    if (!this.map) throw new Error('Map not initialized');

    if (state.center && state.zoom !== undefined) {
      this.map.setView([state.center.lat, state.center.lng], state.zoom);
    } else if (state.center) {
      this.map.panTo([state.center.lat, state.center.lng]);
    } else if (state.zoom !== undefined) {
      this.map.setZoom(state.zoom);
    }
  }

  async flyTo(
    state: Partial<ViewState>,
    options?: { duration?: number; easing?: (t: number) => number }
  ): Promise<void> {
    if (!this.map) throw new Error('Map not initialized');

    const flyOptions: any = {
      animate: true,
      duration: (options?.duration || 2000) / 1000, // Leaflet uses seconds
    };

    return new Promise((resolve) => {
      this.map!.once('moveend', () => resolve());

      if (state.center && state.zoom !== undefined) {
        this.map!.flyTo([state.center.lat, state.center.lng], state.zoom, flyOptions);
      } else if (state.center) {
        this.map!.flyTo([state.center.lat, state.center.lng], this.map!.getZoom(), flyOptions);
      } else if (state.zoom !== undefined) {
        const center = this.map!.getCenter();
        this.map!.flyTo([center.lat, center.lng], state.zoom, flyOptions);
      }
    });
  }

  async fitBounds(
    bbox: BBox,
    options?: { padding?: number; duration?: number }
  ): Promise<void> {
    if (!this.map) throw new Error('Map not initialized');

    const L = await import('leaflet');
    const [west, south, east, north] = bbox;

    return new Promise((resolve) => {
      this.map!.once('moveend', () => resolve());
      this.map!.fitBounds(
        [
          [south, west], // Leaflet uses [lat, lng]
          [north, east],
        ],
        {
          padding: [options?.padding || 50, options?.padding || 50],
          animate: true,
          duration: (options?.duration || 1000) / 1000,
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

    // Remove layer if already exists
    if (this.layers.has(config.id)) {
      this.removeLayer(config.id);
    }

    // Add layer based on type
    if (config.type === 'raster') {
      this.addWMSLayer(config as WMSLayerConfig);
    } else if (config.type === 'geojson' || config.type === 'vector') {
      this.addGeoJSONLayer(config as GeoJSONLayerConfig);
    } else if (config.type === 'background') {
      // Leaflet doesn't have background layer - use pane with CSS
      console.warn('Leaflet: Background layers not fully supported');
    }

    return config.id;
  }

  removeLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer && this.map) {
      this.map.removeLayer(layer);
      this.layers.delete(layerId);
    }
  }

  hasLayer(layerId: string): boolean {
    return this.layers.has(layerId);
  }

  getLayers(): string[] {
    return Array.from(this.layers.keys());
  }

  // ========================================
  // Layer Properties
  // ========================================

  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId);
    if (!layer || !this.map) return;

    if (visible) {
      layer.addTo(this.map);
    } else {
      this.map.removeLayer(layer);
    }
  }

  getLayerVisibility(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer || !this.map) return false;

    return this.map.hasLayer(layer);
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    if (layer.setOpacity) {
      layer.setOpacity(opacity);
    } else if (layer.setStyle) {
      layer.setStyle({ opacity, fillOpacity: opacity * 0.5 });
    }
  }

  getLayerOpacity(layerId: string): number {
    const layer = this.layers.get(layerId);
    if (!layer) return 1;

    return layer.options?.opacity || 1;
  }

  moveLayer(layerId: string, beforeId?: string): void {
    // Leaflet doesn't have built-in z-index reordering
    // Would need to remove and re-add layer
    console.warn('Leaflet: Layer reordering not implemented');
  }

  // ========================================
  // Feature Interaction
  // ========================================

  queryRenderedFeatures(
    point: [number, number],
    options?: { layers?: string[]; radius?: number }
  ): any[] {
    // Leaflet doesn't have built-in spatial query
    // Would need to implement custom hit testing
    console.warn('Leaflet: queryRenderedFeatures not implemented');
    return [];
  }

  queryRenderedFeaturesInBBox(
    bbox: [number, number, number, number],
    options?: { layers?: string[] }
  ): any[] {
    console.warn('Leaflet: queryRenderedFeaturesInBBox not implemented');
    return [];
  }

  // ========================================
  // Coordinate Conversion
  // ========================================

  project(lngLat: LngLat): [number, number] {
    if (!this.map) return [0, 0];
    const point = this.map.latLngToContainerPoint([lngLat.lat, lngLat.lng]);
    return [point.x, point.y];
  }

  unproject(point: [number, number]): LngLat {
    if (!this.map) return { lng: 0, lat: 0 };
    const latlng = this.map.containerPointToLatLng(point);
    return { lng: latlng.lng, lat: latlng.lat };
  }

  // ========================================
  // Events
  // ========================================

  on(event: string, handler: (e: any) => void): void {
    if (!this.map) return;

    // Map Leaflet events to standard events
    const leafletEvent = this.mapEventName(event);

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    this.map.on(leafletEvent, handler);
  }

  off(event: string, handler: (e: any) => void): void {
    if (!this.map) return;

    const leafletEvent = this.mapEventName(event);
    this.eventHandlers.get(event)?.delete(handler);
    this.map.off(leafletEvent, handler);
  }

  once(event: string, handler: (e: any) => void): void {
    if (!this.map) return;
    const leafletEvent = this.mapEventName(event);
    this.map.once(leafletEvent, handler);
  }

  // ========================================
  // Advanced Features
  // ========================================

  getNativeInstance(): any {
    return this.map;
  }

  getRendererType(): 'leaflet' {
    return 'leaflet';
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async addWMSLayer(config: WMSLayerConfig): Promise<void> {
    const L = await import('leaflet');

    const layer = L.tileLayer.wms(config.url, {
      layers: config.layers.join(','),
      format: config.format || 'image/png',
      transparent: config.transparent !== false,
      opacity: config.opacity,
      crs: L.CRS.EPSG3857, // Default to Web Mercator
    });

    if (config.visible && this.map) {
      layer.addTo(this.map);
    }

    this.layers.set(config.id, layer);
  }

  private async addGeoJSONLayer(config: GeoJSONLayerConfig): Promise<void> {
    const L = await import('leaflet');

    const style = config.style || {};

    const layer = L.geoJSON(config.data, {
      style: {
        color: style.strokeColor || '#f75e4c',
        weight: style.strokeWidth || 2,
        opacity: style.strokeOpacity || config.opacity,
        fillColor: style.fillColor || '#f75e4c',
        fillOpacity: (style.fillOpacity || config.opacity) * 0.5,
      },
      pointToLayer: (feature: any, latlng: any) => {
        return L.circleMarker(latlng, {
          radius: style.circleRadius || 6,
          fillColor: style.fillColor || '#f75e4c',
          color: style.strokeColor || '#ffffff',
          weight: style.strokeWidth || 2,
          opacity: config.opacity,
          fillOpacity: config.opacity,
        });
      },
    });

    if (config.visible && this.map) {
      layer.addTo(this.map);
    }

    this.layers.set(config.id, layer);
  }

  private mapEventName(event: string): string {
    // Map standard event names to Leaflet event names
    const eventMap: Record<string, string> = {
      load: 'load',
      click: 'click',
      move: 'move',
      moveend: 'moveend',
      zoom: 'zoom',
      zoomend: 'zoomend',
    };

    return eventMap[event] || event;
  }
}
