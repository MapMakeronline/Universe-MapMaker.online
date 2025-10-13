import type { LayerNode } from '@/typy/layers';

/**
 * Determine whether to use WMS (raster tiles) or WFS (GeoJSON) for rendering a layer
 *
 * Decision criteria:
 * 1. Use WMS for complex styled layers (preserve QGIS styles)
 * 2. Use WMS for polygon layers (often have categorization, patterns)
 * 3. Use WMS for raster layers (orthophotos, elevation)
 * 4. Use WFS for simple point/line layers (better interaction)
 *
 * @param layer - Layer to render
 * @param projectName - Optional project name for project-specific overrides
 * @returns true if WMS should be used, false for WFS
 */
export function shouldUseWMS(layer: LayerNode, projectName?: string): boolean {
  // 🧪 TEST MODE: Force WMS for specific projects to test style preservation
  const TEST_WMS_PROJECTS = ['graph', 'test'];
  if (projectName && TEST_WMS_PROJECTS.includes(projectName.toLowerCase())) {
    console.log(`📍 [WMS] ${layer.name}: Test mode for project "${projectName}"`);
    return true;
  }
  // Always use WMS for raster layers
  if (layer.type === 'RasterLayer') {
    console.log(`📍 [WMS] ${layer.name}: RasterLayer`);
    return true;
  }

  // Use WMS for polygon/multipolygon layers (often have complex styles)
  if (layer.geometry === 'Polygon' || layer.geometry === 'MultiPolygon') {
    console.log(`📍 [WMS] ${layer.name}: Polygon geometry`);
    return true;
  }

  // Use WMS for layers with specific naming patterns
  const name = layer.name.toLowerCase();
  const wmsKeywords = [
    'mpzp',                    // Miejscowe Plany Zagospodarowania Przestrzennego
    'plan',                    // Plans with categorization
    'obszar',                  // Areas (often styled)
    'rewitalizacj',            // Revitalization areas
    'działk',                  // Land parcels (often categorized by type)
    'przeznaczenie',           // Land use designation
    'kategori',                // Categorized layers
    'klasyfikacj',             // Classification layers
    'budynek',                 // Buildings (complex styles)
    'building',
  ];

  if (wmsKeywords.some(keyword => name.includes(keyword))) {
    console.log(`📍 [WMS] ${layer.name}: Keyword match`);
    return true;
  }

  // Use WFS for simple point/line layers (better interaction)
  if (layer.geometry === 'Point' || layer.geometry === 'MultiPoint' ||
      layer.geometry === 'LineString' || layer.geometry === 'MultiLineString') {
    console.log(`📍 [WFS] ${layer.name}: Point/Line geometry`);
    return false;
  }

  // Default: WFS for unknown cases (safer, allows interaction)
  console.log(`📍 [WFS] ${layer.name}: Default (unknown case)`);
  return false;
}

/**
 * Get rendering strategy explanation for debugging
 */
export function getRenderingStrategyExplanation(layer: LayerNode): string {
  if (shouldUseWMS(layer)) {
    return `WMS (raster): Preserves QGIS styles, server-side rendering`;
  } else {
    return `WFS (vector): Interactive features, client-side styling`;
  }
}
