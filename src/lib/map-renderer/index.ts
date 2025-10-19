/**
 * Map Renderer Abstraction Layer
 *
 * Renderer-agnostic map library for Universe-MapMaker.
 * Supports multiple map engines: Mapbox GL JS, Leaflet, custom Canvas.
 *
 * @module map-renderer
 */

// ============================================================================
// Core Types & Interface
// ============================================================================

export type {
  MapRenderer,
  LngLat,
  BBox,
  ViewState,
  LayerConfig,
  WMSLayerConfig,
  GeoJSONLayerConfig,
  BackgroundLayerConfig,
  LayerType,
  LayerVisibility,
} from './types';

// ============================================================================
// Adapters (Implementations)
// ============================================================================

export { MapboxRenderer } from './mapbox-adapter';
export { LeafletRenderer } from './leaflet-adapter';
export { BlankCanvasRenderer } from './blank-canvas-adapter';

// ============================================================================
// Factory & Configuration
// ============================================================================

export { MapRendererFactory } from './factory';
export type { RendererType, RendererConfig } from './factory';

// ============================================================================
// React Hooks
// ============================================================================

export {
  useMapRenderer,
  useMapRendererSync,
  useMapRendererControls,
} from './useMapRenderer';
export type {
  UseMapRendererOptions,
  UseMapRendererReturn,
} from './useMapRenderer';
