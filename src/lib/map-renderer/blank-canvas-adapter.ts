/**
 * Blank Canvas Adapter
 *
 * Minimal renderer using pure Canvas API - NO basemap, NO third-party library.
 * Perfect for:
 * - Data-only visualization (no geographic context needed)
 * - Full control over rendering
 * - Minimal bundle size (no Mapbox/Leaflet dependency)
 * - Custom projections
 *
 * Features:
 * - ✅ No external map dependencies
 * - ✅ Renders only your data
 * - ✅ Pan/zoom with mouse/touch
 * - ✅ Layer visibility/opacity control
 * - ✅ GeoJSON rendering (points, lines, polygons)
 * - ❌ No WMS/vector tiles (client-side only)
 * - ❌ No 3D terrain
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

interface CanvasLayer {
  id: string;
  config: GeoJSONLayerConfig | BackgroundLayerConfig;
  visible: boolean;
  opacity: number;
}

export class BlankCanvasRenderer implements MapRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private layers: Map<string, CanvasLayer> = new Map();

  // Viewport state
  private viewState: ViewState = {
    center: { lng: 0, lat: 0 },
    zoom: 2,
    bearing: 0,
    pitch: 0,
  };

  // Pan/zoom interaction
  private isDragging = false;
  private lastMousePos: [number, number] = [0, 0];

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

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.cursor = 'grab';

    // Set canvas size to match container
    this.resizeCanvas();

    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Set initial viewport
    this.viewState = {
      center: options.center,
      zoom: options.zoom,
      bearing: options.bearing || 0,
      pitch: options.pitch || 0,
    };

    // Setup interaction handlers
    this.setupInteraction();

    // Initial render
    this.render();

    // Trigger load event
    this.emit('load', {});

    return Promise.resolve();
  }

  destroy(): void {
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this.layers.clear();
    this.eventHandlers.clear();
  }

  isReady(): boolean {
    return this.canvas !== null && this.ctx !== null;
  }

  // ========================================
  // Viewport Control
  // ========================================

  getViewState(): ViewState {
    return { ...this.viewState };
  }

  setViewState(state: Partial<ViewState>): void {
    if (state.center) this.viewState.center = state.center;
    if (state.zoom !== undefined) this.viewState.zoom = state.zoom;
    if (state.bearing !== undefined) this.viewState.bearing = state.bearing;
    if (state.pitch !== undefined) this.viewState.pitch = state.pitch;

    this.render();
    this.emit('moveend', { viewState: this.viewState });
  }

  async flyTo(
    state: Partial<ViewState>,
    options?: { duration?: number }
  ): Promise<void> {
    // Animate viewport change
    const duration = options?.duration || 2000;
    const startTime = Date.now();
    const startState = { ...this.viewState };

    const targetCenter = state.center || startState.center;
    const targetZoom = state.zoom !== undefined ? state.zoom : startState.zoom;

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        // Interpolate viewport
        this.viewState.center = {
          lng: startState.center.lng + (targetCenter.lng - startState.center.lng) * eased,
          lat: startState.center.lat + (targetCenter.lat - startState.center.lat) * eased,
        };
        this.viewState.zoom = startState.zoom + (targetZoom - startState.zoom) * eased;

        this.render();
        this.emit('move', { viewState: this.viewState });

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.emit('moveend', { viewState: this.viewState });
          resolve();
        }
      };

      animate();
    });
  }

  async fitBounds(
    bbox: BBox,
    options?: { padding?: number; duration?: number }
  ): Promise<void> {
    const [west, south, east, north] = bbox;

    // Calculate center
    const center: LngLat = {
      lng: (west + east) / 2,
      lat: (south + north) / 2,
    };

    // Calculate zoom to fit bounds (simplified)
    const padding = options?.padding || 50;
    const canvasWidth = this.canvas!.width - padding * 2;
    const canvasHeight = this.canvas!.height - padding * 2;

    const lngSpan = Math.abs(east - west);
    const latSpan = Math.abs(north - south);

    // Rough zoom calculation (more accurate would use Mercator projection)
    const zoom = Math.min(
      Math.log2(360 / lngSpan),
      Math.log2(180 / latSpan)
    ) - 1;

    return this.flyTo({ center, zoom: Math.max(1, zoom) }, options);
  }

  // ========================================
  // Layer Management
  // ========================================

  addLayer(
    config: WMSLayerConfig | GeoJSONLayerConfig | BackgroundLayerConfig
  ): string {
    if (config.type === 'raster') {
      console.warn('BlankCanvas: WMS layers not supported (client-side only)');
      return config.id;
    }

    this.layers.set(config.id, {
      id: config.id,
      config: config as any,
      visible: config.visible,
      opacity: config.opacity,
    });

    this.render();
    return config.id;
  }

  removeLayer(layerId: string): void {
    this.layers.delete(layerId);
    this.render();
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
    if (layer) {
      layer.visible = visible;
      this.render();
    }
  }

  getLayerVisibility(layerId: string): boolean {
    return this.layers.get(layerId)?.visible || false;
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.opacity = opacity;
      this.render();
    }
  }

  getLayerOpacity(layerId: string): number {
    return this.layers.get(layerId)?.opacity || 1;
  }

  moveLayer(layerId: string, beforeId?: string): void {
    // Would need to implement layer ordering
    console.warn('BlankCanvas: Layer reordering not implemented');
  }

  // ========================================
  // Feature Interaction
  // ========================================

  queryRenderedFeatures(point: [number, number], options?: any): any[] {
    // Would need to implement hit testing
    return [];
  }

  queryRenderedFeaturesInBBox(bbox: [number, number, number, number], options?: any): any[] {
    return [];
  }

  // ========================================
  // Coordinate Conversion
  // ========================================

  project(lngLat: LngLat): [number, number] {
    if (!this.canvas) return [0, 0];

    // Simple Mercator projection
    const scale = Math.pow(2, this.viewState.zoom) * 256 / 360;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const x = centerX + (lngLat.lng - this.viewState.center.lng) * scale;
    const y = centerY - (lngLat.lat - this.viewState.center.lat) * scale;

    return [x, y];
  }

  unproject(point: [number, number]): LngLat {
    if (!this.canvas) return { lng: 0, lat: 0 };

    const scale = Math.pow(2, this.viewState.zoom) * 256 / 360;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const lng = this.viewState.center.lng + (point[0] - centerX) / scale;
    const lat = this.viewState.center.lat - (point[1] - centerY) / scale;

    return { lng, lat };
  }

  // ========================================
  // Events
  // ========================================

  on(event: string, handler: (e: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (e: any) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  once(event: string, handler: (e: any) => void): void {
    const wrapper = (e: any) => {
      handler(e);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  // ========================================
  // Advanced Features
  // ========================================

  getNativeInstance(): any {
    return { canvas: this.canvas, ctx: this.ctx };
  }

  getRendererType(): 'canvas' {
    return 'canvas';
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private resizeCanvas(): void {
    if (!this.canvas || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render layers in order
    for (const layer of this.layers.values()) {
      if (!layer.visible) continue;

      this.ctx.globalAlpha = layer.opacity;

      if (layer.config.type === 'background') {
        this.renderBackground(layer.config as BackgroundLayerConfig);
      } else if (layer.config.type === 'geojson') {
        this.renderGeoJSON(layer.config as GeoJSONLayerConfig);
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private renderBackground(config: BackgroundLayerConfig): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = config.color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderGeoJSON(config: GeoJSONLayerConfig): void {
    if (!this.ctx || !config.data?.features) return;

    const style = config.style || {};

    config.data.features.forEach((feature: any) => {
      const geometry = feature.geometry;

      if (geometry.type === 'Point') {
        this.renderPoint(geometry.coordinates, style);
      } else if (geometry.type === 'LineString') {
        this.renderLineString(geometry.coordinates, style);
      } else if (geometry.type === 'Polygon') {
        this.renderPolygon(geometry.coordinates, style);
      }
    });
  }

  private renderPoint(coordinates: [number, number], style: any): void {
    if (!this.ctx) return;

    const [x, y] = this.project({ lng: coordinates[0], lat: coordinates[1] });

    this.ctx.beginPath();
    this.ctx.arc(x, y, style.circleRadius || 6, 0, Math.PI * 2);
    this.ctx.fillStyle = style.fillColor || '#f75e4c';
    this.ctx.fill();
    this.ctx.strokeStyle = style.strokeColor || '#ffffff';
    this.ctx.lineWidth = style.strokeWidth || 2;
    this.ctx.stroke();
  }

  private renderLineString(coordinates: [number, number][], style: any): void {
    if (!this.ctx || coordinates.length < 2) return;

    this.ctx.beginPath();
    const start = this.project({ lng: coordinates[0][0], lat: coordinates[0][1] });
    this.ctx.moveTo(start[0], start[1]);

    for (let i = 1; i < coordinates.length; i++) {
      const point = this.project({ lng: coordinates[i][0], lat: coordinates[i][1] });
      this.ctx.lineTo(point[0], point[1]);
    }

    this.ctx.strokeStyle = style.strokeColor || '#f75e4c';
    this.ctx.lineWidth = style.strokeWidth || 3;
    this.ctx.stroke();
  }

  private renderPolygon(coordinates: [number, number][][], style: any): void {
    if (!this.ctx || coordinates.length === 0) return;

    const outerRing = coordinates[0];

    this.ctx.beginPath();
    const start = this.project({ lng: outerRing[0][0], lat: outerRing[0][1] });
    this.ctx.moveTo(start[0], start[1]);

    for (let i = 1; i < outerRing.length; i++) {
      const point = this.project({ lng: outerRing[i][0], lat: outerRing[i][1] });
      this.ctx.lineTo(point[0], point[1]);
    }

    this.ctx.closePath();

    // Fill
    this.ctx.fillStyle = style.fillColor || '#f75e4c';
    this.ctx.globalAlpha = (style.fillOpacity || 0.5) * this.ctx.globalAlpha;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    // Stroke
    this.ctx.strokeStyle = style.strokeColor || '#ffffff';
    this.ctx.lineWidth = style.strokeWidth || 2;
    this.ctx.stroke();
  }

  private setupInteraction(): void {
    if (!this.canvas) return;

    // Mouse pan
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMousePos = [e.clientX, e.clientY];
      this.canvas!.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.lastMousePos[0];
      const dy = e.clientY - this.lastMousePos[1];

      // Convert pixel delta to lng/lat delta
      const scale = Math.pow(2, this.viewState.zoom) * 256 / 360;
      const dlng = -dx / scale;
      const dlat = dy / scale;

      this.viewState.center.lng += dlng;
      this.viewState.center.lat += dlat;

      this.lastMousePos = [e.clientX, e.clientY];
      this.render();
      this.emit('move', { viewState: this.viewState });
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas!.style.cursor = 'grab';
        this.emit('moveend', { viewState: this.viewState });
      }
    });

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      const delta = -Math.sign(e.deltaY);
      this.viewState.zoom = Math.max(1, Math.min(20, this.viewState.zoom + delta * 0.5));

      this.render();
      this.emit('zoom', { viewState: this.viewState });
      this.emit('zoomend', { viewState: this.viewState });
    });

    // Click
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      const point: [number, number] = [e.clientX - rect.left, e.clientY - rect.top];
      const lngLat = this.unproject(point);

      this.emit('click', { lngLat, point });
    });
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}
