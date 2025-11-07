/**
 * Layer Preservation Utility
 *
 * Saves and restores QGIS layers when map basemap style changes.
 * Prevents layer loss during mapStyle transitions.
 */

import mapboxgl from 'mapbox-gl';
import { mapLogger } from '@/tools/logger';

interface SavedLayer {
  id: string;
  type: string;
  source: string;
  sourceLayer?: string;
  layout?: any;
  paint?: any;
  filter?: any;
  minzoom?: number;
  maxzoom?: number;
  metadata?: any;
}

interface SavedSource {
  id: string;
  spec: any;
}

/**
 * Save all QGIS layers and sources before style change
 */
export function saveQGISLayers(map: mapboxgl.Map): {
  layers: SavedLayer[];
  sources: SavedSource[];
} {
  const style = map.getStyle();
  if (!style) {
    return { layers: [], sources: [] };
  }

  // Save QGIS layers (WMS raster layers)
  const savedLayers: SavedLayer[] = style.layers
    .filter((layer: any) => {
      // Keep only QGIS layers (not Mapbox base layers, not 3D buildings, not sky)
      return (
        layer.id.startsWith('qgis-wms-layer-') ||
        layer.id.startsWith('qgis-wfs-layer-')
      );
    })
    .map((layer: any) => ({
      id: layer.id,
      type: layer.type,
      source: layer.source,
      sourceLayer: layer['source-layer'],
      layout: layer.layout,
      paint: layer.paint,
      filter: layer.filter,
      minzoom: layer.minzoom,
      maxzoom: layer.maxzoom,
      metadata: layer.metadata,
    }));

  // Save QGIS sources
  const savedSources: SavedSource[] = [];
  Object.entries(style.sources).forEach(([id, source]) => {
    // Keep only QGIS sources (not Mapbox sources)
    if (id.startsWith('qgis-wms-') || id.startsWith('qgis-wfs-')) {
      savedSources.push({
        id,
        spec: source,
      });
    }
  });

  mapLogger.log(`💾 Saved ${savedLayers.length} QGIS layers and ${savedSources.length} sources`);

  return { layers: savedLayers, sources: savedSources };
}

/**
 * Restore QGIS layers after style change
 */
export function restoreQGISLayers(
  map: mapboxgl.Map,
  savedLayers: SavedLayer[],
  savedSources: SavedSource[]
): void {
  if (!map.isStyleLoaded()) {
    mapLogger.warn('⚠️ Map style not loaded yet - deferring restoration');
    // Wait for style to load
    map.once('style.load', () => {
      restoreQGISLayers(map, savedLayers, savedSources);
    });
    return;
  }

  // Restore sources first
  savedSources.forEach(({ id, spec }) => {
    if (!map.getSource(id)) {
      try {
        map.addSource(id, spec as any);
        mapLogger.log(`✅ Restored source: ${id}`);
      } catch (error) {
        mapLogger.error(`❌ Failed to restore source ${id}:`, error);
      }
    }
  });

  // Restore layers
  savedLayers.forEach((layer) => {
    if (!map.getLayer(layer.id)) {
      try {
        map.addLayer({
          id: layer.id,
          type: layer.type as any,
          source: layer.source,
          'source-layer': layer.sourceLayer,
          layout: layer.layout,
          paint: layer.paint,
          filter: layer.filter,
          minzoom: layer.minzoom,
          maxzoom: layer.maxzoom,
          metadata: layer.metadata,
        });
        mapLogger.log(`✅ Restored layer: ${layer.id}`);
      } catch (error) {
        mapLogger.error(`❌ Failed to restore layer ${layer.id}:`, error);
      }
    }
  });

  mapLogger.log(`🔄 Restored ${savedLayers.length} QGIS layers`);
}
