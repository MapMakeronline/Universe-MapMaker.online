/**
 * Map Renderer Factory
 *
 * Creates appropriate renderer based on configuration.
 * Centralizes renderer instantiation logic.
 *
 * Usage:
 * ```ts
 * const renderer = MapRendererFactory.create('mapbox', { accessToken: '...' });
 * await renderer.initialize(container, { center, zoom });
 * ```
 */

import type { MapRenderer } from './types';
import { MapboxRenderer } from './mapbox-adapter';
import { LeafletRenderer } from './leaflet-adapter';
import { BlankCanvasRenderer } from './blank-canvas-adapter';

export type RendererType = 'mapbox' | 'leaflet' | 'canvas' | 'auto';

export interface RendererConfig {
  /** Mapbox access token (required for 'mapbox' renderer) */
  mapboxAccessToken?: string;

  /** Default basemap style URL (optional) */
  basemapStyle?: string;

  /** Preferred renderer type (default: 'auto') */
  type?: RendererType;

  /** Enable debug logging */
  debug?: boolean;
}

export class MapRendererFactory {
  /**
   * Create renderer instance
   *
   * @param type Renderer type ('mapbox', 'leaflet', 'canvas', 'auto')
   * @param config Renderer-specific configuration
   * @returns MapRenderer instance
   */
  static create(type: RendererType = 'auto', config?: RendererConfig): MapRenderer {
    // Auto-detect best renderer
    if (type === 'auto') {
      type = this.detectBestRenderer(config);
    }

    switch (type) {
      case 'mapbox':
        return this.createMapboxRenderer(config);

      case 'leaflet':
        return this.createLeafletRenderer(config);

      case 'canvas':
        return this.createBlankCanvasRenderer(config);

      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }
  }

  /**
   * Auto-detect best renderer based on environment and config
   */
  private static detectBestRenderer(config?: RendererConfig): 'mapbox' | 'leaflet' | 'canvas' {
    // If Mapbox token provided, prefer Mapbox
    if (config?.mapboxAccessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      return 'mapbox';
    }

    // If basemap style URL provided, use Leaflet
    if (config?.basemapStyle) {
      return 'leaflet';
    }

    // Default to BlankCanvas (no dependencies)
    return 'canvas';
  }

  private static createMapboxRenderer(config?: RendererConfig): MapRenderer {
    // Set Mapbox access token globally
    const mapboxgl = require('mapbox-gl');
    mapboxgl.accessToken = config?.mapboxAccessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox access token not provided. Map may not work correctly.');
    }

    return new MapboxRenderer();
  }

  private static createLeafletRenderer(config?: RendererConfig): MapRenderer {
    return new LeafletRenderer();
  }

  private static createBlankCanvasRenderer(config?: RendererConfig): MapRenderer {
    return new BlankCanvasRenderer();
  }

  /**
   * Check if renderer type is available
   */
  static isRendererAvailable(type: RendererType): boolean {
    try {
      switch (type) {
        case 'mapbox':
          require('mapbox-gl');
          return true;

        case 'leaflet':
          require('leaflet');
          return true;

        case 'canvas':
          return true; // Always available (no dependencies)

        case 'auto':
          return true;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of available renderers
   */
  static getAvailableRenderers(): RendererType[] {
    const available: RendererType[] = ['auto']; // auto is always available

    if (this.isRendererAvailable('mapbox')) available.push('mapbox');
    if (this.isRendererAvailable('leaflet')) available.push('leaflet');
    if (this.isRendererAvailable('canvas')) available.push('canvas');

    return available;
  }
}
