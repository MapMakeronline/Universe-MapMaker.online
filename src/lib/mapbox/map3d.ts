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
}

/**
 * Add sky layer for atmospheric effect
 */
export function addSkyLayer(map: mapboxgl.Map) {
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
}

/**
 * Add 3D buildings layer using fill-extrusion
 * Based on: https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
 */
export function add3DBuildings(map: mapboxgl.Map) {
  // Find the first symbol layer (labels) to insert buildings before it
  const layers = map.getStyle()?.layers;
  const firstSymbolId = layers?.find(layer => layer.type === 'symbol')?.id;

  // Remove existing 3d-buildings layer if present
  if (map.getLayer('3d-buildings')) {
    map.removeLayer('3d-buildings');
  }

  // Add 3D buildings layer
  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',

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
        'fill-extrusion-opacity': 0.6
      }
    },
    firstSymbolId // Insert layer before labels
  );
}

/**
 * Remove 3D buildings layer
 */
export function remove3DBuildings(map: mapboxgl.Map) {
  if (map.getLayer('3d-buildings')) {
    map.removeLayer('3d-buildings');
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

  // Set camera angle for 3D view
  map.easeTo({
    pitch: pitch,
    bearing: bearing,
    duration: 1000
  });

  // Add terrain
  add3DTerrain(map, terrainExaggeration);

  // Add sky
  addSkyLayer(map);

  // Add buildings
  add3DBuildings(map);
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
