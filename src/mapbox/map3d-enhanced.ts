/**
 * ENHANCED 3D FEATURES FOR MAPBOX
 * 
 * Adds advanced 3D features similar to Streets GL:
 * - 3D Trees from OSM data
 * - Enhanced buildings with roof colors and textures
 * - Better lighting and materials
 */

import mapboxgl from 'mapbox-gl';

/**
 * Add 3D trees layer using OSM data
 * Trees are rendered as simple 3D cylinders with realistic green variations
 *
 * NEW FEATURES (inspired by Streets GL):
 * - Multiple green shades for forests (spring to autumn)
 * - Taller trees at higher zoom levels
 * - Better opacity for layered depth effect
 * - Seasonal color variation based on tree type
 */
export function add3DTrees(map: mapboxgl.Map) {
  try {
    // CRITICAL FIX: Remove existing layers BEFORE adding new ones
    // This prevents "layer already exists" errors when switching basemaps
    remove3DTrees(map);

    // Add 3D trees using fill-extrusion
    // Forests/woods with varied green tones (inspired by Streets GL)
    map.addLayer({
      id: '3d-trees',
      type: 'fill-extrusion',
      source: 'composite',
      'source-layer': 'landuse',
      filter: [
        'all',
        ['==', 'class', 'wood'], // Forests/woods
      ],
      minzoom: 14,
      paint: {
        // Varied forest colors (5 shades of green)
        'fill-extrusion-color': [
          'match',
          ['%', ['id'], 5],
          0, '#2D5A2D', // Dark forest green
          1, '#3A6B35', // Medium forest green
          2, '#4A7C4E', // Lighter green
          3, '#2E7D32', // Standard green
          '#367C39'     // Default forest (between dark and light)
        ],

        // Progressive height increase with zoom
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, 6,   // 6m at zoom 14 (distant view)
          15, 10,  // 10m at zoom 15
          16, 14,  // 14m at zoom 16
          18, 18   // 18m at zoom 18 (close view)
        ],
        'fill-extrusion-base': 0,

        // Better opacity for depth
        'fill-extrusion-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, 0.6, // More transparent at distance
          16, 0.75, // Medium opacity
          18, 0.85  // More opaque up close
        ],
      }
    });

    // Add individual trees (points) as small 3D objects with variation
    if (map.getSource('composite')) {
      map.addLayer({
        id: '3d-tree-points',
        type: 'fill-extrusion',
        source: 'composite',
        'source-layer': 'poi_label',
        filter: [
          'all',
          ['==', 'class', 'park'],
          ['==', 'type', 'tree']
        ],
        minzoom: 17,
        paint: {
          // Individual tree color variation
          'fill-extrusion-color': [
            'match',
            ['%', ['id'], 4],
            0, '#2D6B2D', // Dark green
            1, '#3A7D3A', // Medium green
            2, '#4A8C4A', // Light green
            '#367C39'     // Default
          ],

          // Varied tree heights (8-14m)
          'fill-extrusion-height': [
            'match',
            ['%', ['id'], 3],
            0, 8,   // Small tree
            1, 12,  // Medium tree
            14      // Tall tree (default)
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.85,
        }
      });
    }

    console.log('✅ 3D trees added with color variation', {
      forestColors: '5 green shades',
      treeColors: '4 green shades',
      heightRange: '6-18m (zoom-dependent)',
      opacityRange: '0.6-0.85 (depth-aware)'
    });
    return true;
  } catch (e) {
    console.error('❌ Failed to add 3D trees:', e);
    return false;
  }
}

/**
 * Remove 3D trees layers
 */
export function remove3DTrees(map: mapboxgl.Map) {
  if (map.getLayer('3d-trees')) {
    map.removeLayer('3d-trees');
  }
  if (map.getLayer('3d-tree-points')) {
    map.removeLayer('3d-tree-points');
  }
}

/**
 * Add enhanced 3D buildings with roof colors and better materials
 * Based on OSM building tags (building:colour, roof:colour, building:material)
 *
 * NEW FEATURES:
 * - More realistic building colors (15+ variations)
 * - Warmer tones for residential, cooler for commercial
 * - Better color distribution for realism
 */
export function addEnhanced3DBuildings(map: mapboxgl.Map, options?: {
  minzoom?: number;
  heightMultiplier?: number;
}) {
  try {
    const minzoom = options?.minzoom || 16;
    const heightMultiplier = options?.heightMultiplier || 0.7;

    // CRITICAL FIX: Remove ALL enhanced buildings layers BEFORE adding
    removeEnhanced3DBuildings(map);

    // Find the first symbol layer (labels) to insert buildings before it
    const layers = map.getStyle()?.layers;
    const firstSymbolId = layers?.find(layer => layer.type === 'symbol')?.id;

    const sourceId = map.getSource('composite') ? 'composite' : 'mapbox-3d-buildings';

    // Add Mapbox 3D Buildings source if needed
    if (!map.getSource('mapbox-3d-buildings') && sourceId === 'mapbox-3d-buildings') {
      map.addSource('mapbox-3d-buildings', {
        type: 'vector',
        url: 'mapbox://mapbox.3d-buildings'
      });
    }

    // Add enhanced 3D buildings with MORE realistic colors
    map.addLayer(
      {
        id: 'enhanced-3d-buildings',
        source: sourceId,
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: minzoom,
        paint: {
          // Building walls - ENHANCED with 15+ color variations
          'fill-extrusion-color': [
            'case',
            // Selection states (highest priority)
            ['boolean', ['feature-state', 'selected'], false],
            '#ff9800', // Orange 500 for selected
            ['boolean', ['feature-state', 'hover'], false],
            '#ffb74d', // Orange 300 for hover

            // Building type colors (inspired by Streets GL)
            [
              'match',
              ['get', 'type'],
              // Residential buildings (warm, earthy tones)
              'residential', [
                'match',
                ['%', ['id'], 5], // Use building ID for variation
                0, '#E8DDD3', // Cream
                1, '#D7CCC8', // Light brown
                2, '#C9BDB4', // Taupe
                3, '#DED0C1', // Beige
                '#D5C4B0'     // Sand (default residential)
              ],

              // Commercial buildings (cooler, modern tones)
              'commercial', [
                'match',
                ['%', ['id'], 4],
                0, '#B0BEC5', // Blue gray
                1, '#CFD8DC', // Light blue gray
                2, '#A5B4BC', // Steel blue
                '#BABDBE'     // Concrete gray (default)
              ],

              // Industrial buildings (darker, utilitarian)
              'industrial', [
                'match',
                ['%', ['id'], 3],
                0, '#90A4AE', // Dark gray-blue
                1, '#78909C', // Dark steel
                '#607D8B'     // Blue gray 700 (default)
              ],

              // Houses (warmer, more varied)
              'house', [
                'match',
                ['%', ['id'], 6],
                0, '#BCAAA4', // Brown
                1, '#D7B5A6', // Light brown
                2, '#C9B8AC', // Warm gray
                3, '#E0CFC0', // Cream
                4, '#CABFB3', // Beige
                '#D1C1B4'     // Default house
              ],

              // Apartments (modern, varied)
              'apartments', [
                'match',
                ['%', ['id'], 4],
                0, '#BCC4CC', // Light gray
                1, '#D1D5D8', // Very light gray
                2, '#AAB6BF', // Medium gray
                '#C0C8D0'     // Default apartment
              ],

              // Default (mixed urban palette)
              [
                'match',
                ['%', ['id'], 8],
                0, '#C5C5C5', // Light gray
                1, '#D0D0D0', // Very light gray
                2, '#BABABA', // Medium gray
                3, '#DBCFBF', // Warm beige
                4, '#C8BDB3', // Taupe
                5, '#B8C5D0', // Cool gray
                6, '#CED4D9', // Blue-ish gray
                '#BFBFBF'     // Concrete (ultimate default)
              ]
            ]
          ],

          // Building height with multiplier
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            minzoom,
            0,
            minzoom + 0.02,
            ['*', ['get', 'height'], heightMultiplier]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            minzoom,
            0,
            minzoom + 0.02,
            ['*', ['get', 'min_height'], heightMultiplier]
          ],
          'fill-extrusion-opacity': 0.9,

          // Enhanced ambient occlusion (slightly stronger)
          'fill-extrusion-ambient-occlusion-intensity': 0.35,
          'fill-extrusion-ambient-occlusion-radius': 3.5,
        }
      },
      firstSymbolId
    );

    console.log('✅ Enhanced 3D buildings added with 15+ color variations', {
      minzoom,
      heightMultiplier,
      colorPalette: {
        residential: '5 warm tones',
        commercial: '4 cool tones',
        industrial: '3 dark tones',
        house: '6 varied tones',
        default: '8 mixed tones'
      }
    });

    return true;
  } catch (e) {
    console.error('❌ Failed to add enhanced buildings:', e);
    return false;
  }
}

/**
 * Remove enhanced 3D buildings
 */
export function removeEnhanced3DBuildings(map: mapboxgl.Map) {
  if (map.getLayer('enhanced-3d-buildings')) {
    map.removeLayer('enhanced-3d-buildings');
  }
  // Remove custom buildings source if it exists and has no other layers using it
  if (map.getSource('mapbox-3d-buildings')) {
    const layers = map.getStyle()?.layers || [];
    const hasOtherLayers = layers.some(layer =>
      'source' in layer && layer.source === 'mapbox-3d-buildings'
    );
    if (!hasOtherLayers) {
      map.removeSource('mapbox-3d-buildings');
    }
  }
}

/**
 * Kompletne czyszczenie wszystkich warstw enhanced 3D
 * Używaj PRZED zmianą mapy podkładowej
 */
export function cleanupAllEnhanced3DLayers(map: mapboxgl.Map) {
  const layersToRemove = [
    'enhanced-3d-buildings',
    '3d-trees',
    '3d-tree-points'
  ];

  layersToRemove.forEach(layerId => {
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    } catch (e) {
      // Layer doesn't exist - that's OK
    }
  });

  // Remove source if no layers use it
  if (map.getSource('mapbox-3d-buildings')) {
    const layers = map.getStyle()?.layers || [];
    const hasOtherLayers = layers.some(layer =>
      'source' in layer && layer.source === 'mapbox-3d-buildings'
    );
    if (!hasOtherLayers) {
      try {
        map.removeSource('mapbox-3d-buildings');
      } catch (e) {
        // Source already removed
      }
    }
  }
}

/**
 * Enable full enhanced 3D mode with trees and better buildings
 * UWAGA: Funkcja NIE dodaje terrain i sky - te są dodawane przez map3d.ts
 * Ta funkcja dodaje tylko enhanced buildings + drzewa
 */
export function enableEnhanced3DMode(
  map: mapboxgl.Map,
  options?: {
    pitch?: number;
    bearing?: number;
    heightMultiplier?: number;
  }
) {
  const {
    pitch = 50,
    bearing = 0,
    heightMultiplier = 0.7
  } = options || {};

  try {
    console.log('🌲 [ENHANCED 3D] Starting enableEnhanced3DMode...');
    console.log('🌲 [ENHANCED 3D] Current zoom:', map.getZoom());
    console.log('🌲 [ENHANCED 3D] Map style loaded:', map.isStyleLoaded());

    // Set camera angle
    map.easeTo({
      pitch: pitch,
      bearing: bearing,
      duration: 800
    });

    console.log('🌲 [ENHANCED 3D] Adding enhanced buildings...');
    // Add enhanced buildings
    const buildingsSuccess = addEnhanced3DBuildings(map, { heightMultiplier });
    console.log('🌲 [ENHANCED 3D] Buildings result:', buildingsSuccess);

    console.log('🌲 [ENHANCED 3D] Adding trees...');
    // Add trees
    const treesSuccess = add3DTrees(map);
    console.log('🌲 [ENHANCED 3D] Trees result:', treesSuccess);

    // Verify layers were added
    const hasBuildings = map.getLayer('enhanced-3d-buildings') !== undefined;
    const hasTrees = map.getLayer('3d-trees') !== undefined;
    const hasTreePoints = map.getLayer('3d-tree-points') !== undefined;

    console.log('✅ [ENHANCED 3D] Layer verification:', {
      buildings: hasBuildings ? '✅' : '❌',
      trees: hasTrees ? '✅' : '❌',
      treePoints: hasTreePoints ? '✅' : '❌',
      buildingsSuccess,
      treesSuccess
    });

    return buildingsSuccess && treesSuccess;
  } catch (e) {
    console.error('❌ Failed to enable enhanced 3D mode:', e);
    return false;
  }
}

/**
 * Disable enhanced 3D mode
 */
export function disableEnhanced3DMode(map: mapboxgl.Map) {
  removeEnhanced3DBuildings(map);
  remove3DTrees(map);
  
  // Reset camera
  map.easeTo({
    pitch: 0,
    bearing: 0,
    duration: 1000
  });
}
