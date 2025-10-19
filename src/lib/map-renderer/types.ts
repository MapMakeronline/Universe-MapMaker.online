/**
 * Map Renderer Abstraction Layer
 *
 * Decouples application logic from specific map rendering engine.
 * Supports: Mapbox GL JS, Leaflet, OpenLayers, deck.gl, custom Canvas/SVG
 *
 * Design Pattern: Adapter Pattern
 * - Interface defines contract (what operations map must support)
 * - Adapters implement interface for specific engines
 * - Application code depends only on interface, not implementation
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Geographic coordinate in WGS84
 */
export interface LngLat {
  lng: number;
  lat: number;
}

/**
 * Bounding box [west, south, east, north]
 */
export type BBox = [number, number, number, number];

/**
 * Map viewport state
 */
export interface ViewState {
  center: LngLat;
  zoom: number;
  bearing?: number; // Rotation in degrees (0 = north)
  pitch?: number;   // Tilt in degrees (0 = flat, 60 = 3D)
}

/**
 * Layer visibility state
 */
export type LayerVisibility = 'visible' | 'none';

/**
 * Layer types supported by all renderers
 */
export type LayerType =
  | 'raster'      // WMS tiles, satellite imagery
  | 'vector'      // GeoJSON, vector tiles
  | 'geojson'     // Client-side GeoJSON
  | 'background'  // Solid color background
  | 'group';      // Logical grouping (no rendering)

/**
 * Generic layer configuration (renderer-agnostic)
 */
export interface LayerConfig {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number; // 0-1
  minZoom?: number;
  maxZoom?: number;
  metadata?: Record<string, any>; // Custom metadata (e.g., QGIS layer ID)
}

/**
 * WMS layer specific configuration
 */
export interface WMSLayerConfig extends LayerConfig {
  type: 'raster';
  url: string; // WMS GetMap URL template
  layers: string[]; // WMS layer names
  format?: string; // image/png, image/jpeg
  transparent?: boolean;
  crs?: string; // EPSG:3857, EPSG:4326
}

/**
 * GeoJSON layer specific configuration
 */
export interface GeoJSONLayerConfig extends LayerConfig {
  type: 'geojson' | 'vector';
  data: any; // GeoJSON FeatureCollection or URL
  style?: {
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    circleRadius?: number; // For point features
  };
}

/**
 * Background layer configuration (for blank/custom base)
 */
export interface BackgroundLayerConfig extends LayerConfig {
  type: 'background';
  color: string; // CSS color (e.g., '#f5f5f5', 'rgba(0,0,0,0)')
}

// ============================================================================
// Map Renderer Interface
// ============================================================================

/**
 * Map Renderer Interface
 *
 * Contract that all map rendering engines must implement.
 * Application code interacts ONLY with this interface.
 *
 * Implementations:
 * - MapboxRenderer (Mapbox GL JS / MapLibre GL)
 * - LeafletRenderer (Leaflet.js)
 * - BlankCanvasRenderer (Pure Canvas/SVG, no basemap)
 * - DeckGLRenderer (deck.gl for advanced 3D)
 */
export interface MapRenderer {
  // ========================================
  // Lifecycle
  // ========================================

  /**
   * Initialize map instance
   * @param container HTML element to mount map
   * @param options Initial map configuration
   */
  initialize(container: HTMLElement, options: {
    center: LngLat;
    zoom: number;
    bearing?: number;
    pitch?: number;
    style?: string | object; // Engine-specific style (optional)
  }): Promise<void>;

  /**
   * Destroy map instance and cleanup resources
   */
  destroy(): void;

  /**
   * Check if map is ready for operations
   */
  isReady(): boolean;

  // ========================================
  // Viewport Control
  // ========================================

  /**
   * Get current viewport state
   */
  getViewState(): ViewState;

  /**
   * Set viewport state (instant jump)
   */
  setViewState(state: Partial<ViewState>): void;

  /**
   * Animate viewport to new state (smooth transition)
   */
  flyTo(state: Partial<ViewState>, options?: {
    duration?: number; // ms
    easing?: (t: number) => number;
  }): Promise<void>;

  /**
   * Fit map to bounding box
   */
  fitBounds(bbox: BBox, options?: {
    padding?: number; // pixels
    duration?: number; // ms
  }): Promise<void>;

  // ========================================
  // Layer Management
  // ========================================

  /**
   * Add layer to map
   * @param config Layer configuration (type-specific)
   * @returns Layer ID for future reference
   */
  addLayer(config: WMSLayerConfig | GeoJSONLayerConfig | BackgroundLayerConfig): string;

  /**
   * Remove layer from map
   */
  removeLayer(layerId: string): void;

  /**
   * Check if layer exists on map
   */
  hasLayer(layerId: string): boolean;

  /**
   * Get all layer IDs
   */
  getLayers(): string[];

  // ========================================
  // Layer Properties
  // ========================================

  /**
   * Update layer visibility
   */
  setLayerVisibility(layerId: string, visible: boolean): void;

  /**
   * Get layer visibility
   */
  getLayerVisibility(layerId: string): boolean;

  /**
   * Update layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): void;

  /**
   * Get layer opacity
   */
  getLayerOpacity(layerId: string): number;

  /**
   * Reorder layer (move to different z-index)
   */
  moveLayer(layerId: string, beforeId?: string): void;

  // ========================================
  // Feature Interaction
  // ========================================

  /**
   * Query features at point
   * @param point Screen coordinates [x, y]
   * @param options Query options (layers to query, radius)
   * @returns GeoJSON features at point
   */
  queryRenderedFeatures(
    point: [number, number],
    options?: {
      layers?: string[];
      radius?: number; // pixels
    }
  ): any[]; // GeoJSON Feature[]

  /**
   * Query features in bounding box
   */
  queryRenderedFeaturesInBBox(
    bbox: [number, number, number, number], // screen coords [x1, y1, x2, y2]
    options?: {
      layers?: string[];
    }
  ): any[];

  // ========================================
  // Coordinate Conversion
  // ========================================

  /**
   * Convert geographic coordinates to screen pixels
   */
  project(lngLat: LngLat): [number, number];

  /**
   * Convert screen pixels to geographic coordinates
   */
  unproject(point: [number, number]): LngLat;

  // ========================================
  // Events
  // ========================================

  /**
   * Register event listener
   * Events: 'load', 'click', 'move', 'moveend', 'zoom', 'zoomend'
   */
  on(event: string, handler: (e: any) => void): void;

  /**
   * Unregister event listener
   */
  off(event: string, handler: (e: any) => void): void;

  /**
   * Trigger one-time event listener
   */
  once(event: string, handler: (e: any) => void): void;

  // ========================================
  // Advanced Features (Optional)
  // ========================================

  /**
   * Enable/disable 3D terrain (if supported)
   */
  setTerrain?(enabled: boolean): void;

  /**
   * Get native map instance (escape hatch for engine-specific features)
   * Use sparingly - prefer interface methods
   */
  getNativeInstance(): any;

  /**
   * Get renderer type (for debugging/feature detection)
   */
  getRendererType(): 'mapbox' | 'leaflet' | 'canvas' | 'deckgl' | 'openlayers';
}

// ============================================================================
// Factory Pattern
// ============================================================================

/**
 * Map Renderer Factory
 *
 * Creates appropriate renderer based on configuration.
 * Application uses factory instead of direct instantiation.
 */
export interface MapRendererFactory {
  /**
   * Create renderer instance
   * @param type Renderer type to create
   * @param config Renderer-specific configuration
   */
  create(
    type: 'mapbox' | 'leaflet' | 'canvas' | 'deckgl',
    config?: any
  ): MapRenderer;
}
