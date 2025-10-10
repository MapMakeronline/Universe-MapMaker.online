'use client';

import { useEffect, useState } from 'react';
import { useGetProjectDataQuery } from '@/redux/api/projectsApi';
import { CircularProgress, Alert, Box, Typography } from '@mui/material';
import { useMap } from 'react-map-gl';
import type { QGISLayerNode, QGISVectorLayer, QGISRasterLayer } from '@/src/types/qgis';
import { isVectorLayer, isRasterLayer, isGroupLayer } from '@/src/types/qgis';

interface QGISProjectLoaderProps {
  projectName: string;
  onLoad?: (extent: [number, number, number, number]) => void;
}

/**
 * QGIS Project Loader Component
 *
 * Loads QGIS project from backend and renders layers on Mapbox map
 * Uses tree.json structure from /api/projects/new/json endpoint
 * Renders WMS layers via QGIS Server at /ows endpoint
 */
export function QGISProjectLoader({ projectName, onLoad }: QGISProjectLoaderProps) {
  const { current: map } = useMap();
  const [loadedLayers, setLoadedLayers] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useGetProjectDataQuery({
    project: projectName,
  });

  useEffect(() => {
    if (!map || !data) return;

    // Fly to project extent on load
    if (data.extent && data.extent.length === 4) {
      const [minX, minY, maxX, maxY] = data.extent;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Convert from EPSG:3857 to EPSG:4326 (WGS84)
      const lng = (centerX * 180) / 20037508.34;
      const lat = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

      map.flyTo({
        center: [lng, lat],
        zoom: 12,
        duration: 2000,
      });

      onLoad?.(data.extent);
    }

    // Render all visible layers
    const layersToLoad: QGISLayerNode[] = [];

    const collectVisibleLayers = (nodes: QGISLayerNode[]) => {
      for (const node of nodes) {
        if (isGroupLayer(node)) {
          if (node.children) {
            collectVisibleLayers(node.children);
          }
        } else if (node.visible && (isVectorLayer(node) || isRasterLayer(node))) {
          layersToLoad.push(node);
        }
      }
    };

    collectVisibleLayers(data.children);

    // Add layers to map
    layersToLoad.forEach((layer) => {
      addQGISLayer(map, projectName, layer);
    });

    setLoadedLayers(new Set(layersToLoad.map(l => l.id)));

    // Cleanup on unmount
    return () => {
      layersToLoad.forEach((layer) => {
        removeQGISLayer(map, layer.id);
      });
    };
  }, [map, data, projectName, onLoad]);

  if (isLoading) {
    return (
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          Ładowanie projektu QGIS: {projectName}...
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, maxWidth: 400 }}>
        <Alert severity="error">
          <Typography variant="body2">Błąd ładowania projektu: {projectName}</Typography>
          <Typography variant="caption">
            {error && 'data' in error ? JSON.stringify(error.data) : 'Nieznany błąd'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
      <Alert severity="success">
        <Typography variant="body2">
          Projekt QGIS: <strong>{data.name}</strong>
        </Typography>
        <Typography variant="caption">
          Załadowano warstw: {loadedLayers.size}
        </Typography>
      </Alert>
    </Box>
  );
}

/**
 * Add QGIS layer to Mapbox map via WMS
 */
function addQGISLayer(
  map: mapboxgl.Map,
  projectName: string,
  layer: QGISVectorLayer | QGISRasterLayer
) {
  const sourceId = `qgis-${layer.id}`;
  const layerId = `layer-${layer.id}`;

  // Check if layer already exists
  if (map.getLayer(layerId)) {
    console.warn(`Layer ${layerId} already exists, skipping`);
    return;
  }

  // WMS GetMap request URL
  const wmsUrl =
    `https://api.universemapmaker.online/ows?` +
    `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&LAYERS=${layer.id}` +
    `&WIDTH=256&HEIGHT=256` +
    `&FORMAT=image/png` +
    `&TRANSPARENT=true` +
    `&CRS=EPSG:3857` +
    `&BBOX={bbox-epsg-3857}`;

  // Add raster source
  map.addSource(sourceId, {
    type: 'raster',
    tiles: [wmsUrl],
    tileSize: 256,
  });

  // Add raster layer with opacity from QGIS
  const opacity = layer.opacity !== undefined ? layer.opacity / 255 : 1;

  map.addLayer({
    id: layerId,
    type: 'raster',
    source: sourceId,
    paint: {
      'raster-opacity': opacity,
    },
  });

  console.log(`✅ Added QGIS layer: ${layer.name} (${layer.id})`);
}

/**
 * Remove QGIS layer from map
 */
function removeQGISLayer(map: mapboxgl.Map, layerId: string) {
  const mapLayerId = `layer-${layerId}`;
  const sourceId = `qgis-${layerId}`;

  if (map.getLayer(mapLayerId)) {
    map.removeLayer(mapLayerId);
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }

  console.log(`🗑️ Removed QGIS layer: ${layerId}`);
}
