/**
 * MAPBOX 3D CONFIGURATION
 *
 * Handles:
 * - 3D Terrain (raster-dem)
 * - 3D Buildings (fill-extrusion)
 * - Sky layer (atmosphere)
 *
 * Based on official Mapbox documentation:
 * - https://docs.mapbox.com/mapbox-gl-js/guides/install/
 * - https://docs.mapbox.com/mapbox-gl-js/example/add-terrain/
 * - https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
 */

import mapboxgl from 'mapbox-gl';

/**
 * Initialize 3D terrain on the map
 * Adds elevation data from Mapbox Terrain DEM
 */
export function add3DTerrain(map: mapboxgl.Map, exaggeration: number = 1.4) {
  try {
    // Add DEM source if not already present
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
    }

    // Apply terrain
    map.setTerrain({
      source: 'mapbox-dem',
      exaggeration: exaggeration
    });

    return true;
  } catch (e) {
    console.error('Failed to add 3D terrain:', e);
    return false;
  }
}

/**
 * Add sky layer for atmospheric effect
 */
export function addSkyLayer(map: mapboxgl.Map) {
  try {
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });
    }
    return true;
  } catch (e) {
    console.error('Failed to add sky layer:', e);
    return false;
  }
}

/**
 * Add 3D buildings layer using fill-extrusion
 * Based on: https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
 */
export function add3DBuildings(map: mapboxgl.Map) {
  try {
    // Find the first symbol layer (labels) to insert buildings before it
    const layers = map.getStyle()?.layers;
    const firstSymbolId = layers?.find(layer => layer.type === 'symbol')?.id;

    // Remove existing 3d-buildings layer if present
    if (map.getLayer('3d-buildings')) {
      map.removeLayer('3d-buildings');
    }

    // Check if composite source exists, if not use dedicated Mapbox 3D Buildings tileset
    const sourceId = map.getSource('composite') ? 'composite' : 'mapbox-3d-buildings';

    // Add Mapbox 3D Buildings source if needed (official tileset for 3D buildings)
    if (!map.getSource('mapbox-3d-buildings') && sourceId === 'mapbox-3d-buildings') {
      map.addSource('mapbox-3d-buildings', {
        type: 'vector',
        url: 'mapbox://mapbox.3d-buildings'
      });
    }

    // Add 3D buildings layer with feature state support for selection
    map.addLayer(
      {
        id: '3d-buildings',
        source: sourceId,
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          // Highlight selected building with feature-state
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#f75e4c', // Primary color for selected
            '#aaa' // Default gray
          ],

          // Use an 'interpolate' expression to add a smooth transition effect to
          // the buildings as the user zooms in
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          // Opacity must be a constant value, not a data expression
          'fill-extrusion-opacity': 0.6
        }
      },
      firstSymbolId // Insert layer before labels
    );

    return true;
  } catch (e) {
    console.error('Failed to add 3D buildings:', e);
    return false;
  }
}

/**
 * Remove 3D buildings layer
 */
export function remove3DBuildings(map: mapboxgl.Map) {
  if (map.getLayer('3d-buildings')) {
    map.removeLayer('3d-buildings');
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
 * Remove 3D terrain
 */
export function remove3DTerrain(map: mapboxgl.Map) {
  map.setTerrain(null);
}

/**
 * Remove sky layer
 */
export function removeSkyLayer(map: mapboxgl.Map) {
  if (map.getLayer('sky')) {
    map.removeLayer('sky');
  }
}

/**
 * Enable full 3D mode (terrain + buildings + sky)
 */
export function enableFull3DMode(map: mapboxgl.Map, options?: {
  terrainExaggeration?: number;
  pitch?: number;
  bearing?: number;
}) {
  const { terrainExaggeration = 1.4, pitch = 60, bearing = 0 } = options || {};

  try {
    // Set camera angle for 3D view
    map.easeTo({
      pitch: pitch,
      bearing: bearing,
      duration: 1000
    });

    // Add 3D features with proper error handling
    const terrainSuccess = add3DTerrain(map, terrainExaggeration);
    const skySuccess = addSkyLayer(map);
    const buildingsSuccess = add3DBuildings(map);

    return terrainSuccess && skySuccess && buildingsSuccess;
  } catch (e) {
    console.error('Failed to enable full 3D mode:', e);
    return false;
  }
}

/**
 * Disable full 3D mode
 */
export function disableFull3DMode(map: mapboxgl.Map) {
  // Reset camera
  map.easeTo({
    pitch: 0,
    bearing: 0,
    duration: 1000
  });

  // Remove layers
  remove3DBuildings(map);
  removeSkyLayer(map);
  remove3DTerrain(map);
}
