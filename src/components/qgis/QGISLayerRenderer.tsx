'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl';
import type { LayerNode } from '@/typy/layers';

interface QGISLayerRendererProps {
  projectName: string;
  layer: LayerNode;
}

/**
 * QGIS Layer Renderer - renders QGIS layers via WFS as GeoJSON on Mapbox
 *
 * Uses QGIS Server WFS (Web Feature Service) to fetch layer features:
 * 1. Fetches features via WFS GetFeature request
 * 2. Adds them as geojson source to Mapbox
 * 3. Renders with appropriate style based on geometry type
 *
 * Works for both published and unpublished projects!
 */
export function QGISLayerRenderer({ projectName, layer }: QGISLayerRendererProps) {
  const { current: map } = useMap();
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch features via WFS
  useEffect(() => {
    if (!layer.visible || !projectName || !layer.name || !layer.id) return;

    setIsLoading(true);
    setError(null);

    // WFS GetFeature URL (QGIS Server WFS 2.0.0)
    const wfsUrl =
      `https://api.universemapmaker.online/ows?` +
      `SERVICE=WFS&` +
      `VERSION=2.0.0&` +
      `REQUEST=GetFeature&` +
      `TYPENAME=${layer.id}&` +
      `OUTPUTFORMAT=application/json&` +
      `SRSNAME=EPSG:4326&` +
      `MAP=${projectName}`;

    console.log('📡 Fetching WFS features:', layer.name, wfsUrl);

    fetch(wfsUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`WFS request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: GeoJSON.FeatureCollection) => {
        console.log('✅ WFS features loaded:', layer.name, {
          features: data.features?.length || 0,
          type: data.type,
        });
        setGeojson(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('❌ WFS fetch error:', layer.name, err);
        setError(err);
        setIsLoading(false);
      });
  }, [projectName, layer.name, layer.id, layer.visible]);

  useEffect(() => {
    if (!map || !geojson || !layer.visible) return;

    const sourceId = `layer-source-${layer.id}`;
    const fillLayerId = `layer-fill-${layer.id}`;
    const lineLayerId = `layer-line-${layer.id}`;
    const circleLayerId = `layer-circle-${layer.id}`;

    console.log('🗺️ Adding GeoJSON layer:', layer.name, {
      features: geojson.features.length,
      geometry: geojson.features[0]?.geometry?.type,
    });

    // Add source
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });
    }

    // Detect geometry type from first feature
    const geometryType = geojson.features[0]?.geometry?.type;

    // Add layers based on geometry type
    if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      // Fill layer for polygons
      if (!map.getLayer(fillLayerId)) {
        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': layer.color || '#088',
            'fill-opacity': layer.opacity || 0.6,
          },
        });
      }

      // Outline layer for polygons
      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': layer.color || '#088',
            'line-width': 2,
            'line-opacity': layer.opacity || 1,
          },
        });
      }
    } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      // Line layer
      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': layer.color || '#088',
            'line-width': 3,
            'line-opacity': layer.opacity || 1,
          },
        });
      }
    } else if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      // Circle layer for points
      if (!map.getLayer(circleLayerId)) {
        map.addLayer({
          id: circleLayerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 6,
            'circle-color': layer.color || '#088',
            'circle-opacity': layer.opacity || 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });
      }
    }

    console.log('✅ GeoJSON layer added:', layer.name);

    // Cleanup on unmount or when layer becomes invisible
    return () => {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      console.log('🗑️ Removed GeoJSON layer:', layer.name);
    };
  }, [map, geojson, layer, projectName]);

  // Update visibility
  useEffect(() => {
    if (!map) return;

    const fillLayerId = `layer-fill-${layer.id}`;
    const lineLayerId = `layer-line-${layer.id}`;
    const circleLayerId = `layer-circle-${layer.id}`;

    const visibility = layer.visible ? 'visible' : 'none';

    if (map.getLayer(fillLayerId)) {
      map.setLayoutProperty(fillLayerId, 'visibility', visibility);
    }
    if (map.getLayer(lineLayerId)) {
      map.setLayoutProperty(lineLayerId, 'visibility', visibility);
    }
    if (map.getLayer(circleLayerId)) {
      map.setLayoutProperty(circleLayerId, 'visibility', visibility);
    }
  }, [map, layer.visible, layer.id]);

  // Update opacity
  useEffect(() => {
    if (!map) return;

    const fillLayerId = `layer-fill-${layer.id}`;
    const lineLayerId = `layer-line-${layer.id}`;
    const circleLayerId = `layer-circle-${layer.id}`;

    if (map.getLayer(fillLayerId)) {
      map.setPaintProperty(fillLayerId, 'fill-opacity', layer.opacity || 0.6);
    }
    if (map.getLayer(lineLayerId)) {
      map.setPaintProperty(lineLayerId, 'line-opacity', layer.opacity || 1);
    }
    if (map.getLayer(circleLayerId)) {
      map.setPaintProperty(circleLayerId, 'circle-opacity', layer.opacity || 0.8);
    }
  }, [map, layer.opacity, layer.id]);

  if (error) {
    console.error('❌ Error loading layer features:', layer.name, error);
  }

  if (isLoading) {
    console.log('⏳ Loading layer features via WFS:', layer.name);
  }

  return null; // No UI rendering needed
}
