'use client';

import { useEffect, useState } from 'react';
import { useGetProjectDataQuery } from '@/redux/api/projectsApi';
import { CircularProgress, Alert, Box, Typography } from '@mui/material';
import { useMap } from 'react-map-gl';
import type { QGISLayerNode, QGISVectorLayer, QGISRasterLayer } from '@/src/types/qgis';
import { isVectorLayer, isRasterLayer, isGroupLayer } from '@/src/types/qgis';
import { useAppSelector } from '@/redux/hooks';
import type { LayerNode } from '@/typy/layers';

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
  const mapContext = useMap();
  const [loadedLayers, setLoadedLayers] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get Redux layer state for visibility sync
  const reduxLayers = useAppSelector((state) => state.layers.layers);

  const { data, isLoading, error } = useGetProjectDataQuery({
    project: projectName,
    published: false,
  });

  useEffect(() => {
    // Get native Mapbox GL instance from React Map GL context
    const mapInstance = mapContext.current?.getMap();
    if (!mapInstance || !data) return;

    const map = mapInstance;

    try {
      setLoadError(null);

      // Validate project data
      if (!data.children || data.children.length === 0) {
        console.warn(`⚠️ Project "${projectName}" has no layers`);
        return;
      }

      // Fly to project extent on load
      if (data.extent && data.extent.length === 4) {
        const [minX, minY, maxX, maxY] = data.extent;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Convert from EPSG:3857 to EPSG:4326 (WGS84)
        const lng = (centerX * 180) / 20037508.34;
        const lat = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

        // Validate coordinates
        if (isNaN(lng) || isNaN(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
          console.error('❌ Invalid extent coordinates:', { lng, lat, extent: data.extent });
          setLoadError('Nieprawidłowe współrzędne projektu');
          return;
        }

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

      if (layersToLoad.length === 0) {
        console.warn(`⚠️ No visible layers found in project "${projectName}"`);
      }

      // Add layers to map
      let successCount = 0;
      layersToLoad.forEach((layer) => {
        try {
          addQGISLayer(map, projectName, layer);
          successCount++;
        } catch (err) {
          console.error(`❌ Failed to add layer ${layer.name}:`, err);
        }
      });

      setLoadedLayers(new Set(layersToLoad.map(l => l.id)));
      console.log(`✅ Loaded ${successCount}/${layersToLoad.length} QGIS layers for project "${projectName}"`);

      // Cleanup on unmount
      return () => {
        const cleanupMap = mapContext.current?.getMap();
        if (!cleanupMap) return;

        layersToLoad.forEach((layer) => {
          try {
            removeQGISLayer(cleanupMap, layer.id);
          } catch (err) {
            console.error(`❌ Failed to remove layer ${layer.id}:`, err);
          }
        });
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      console.error('❌ Failed to load QGIS project:', err);
      setLoadError(errorMessage);
    }
  }, [mapContext, data, projectName, onLoad]);

  // Sync visibility from Redux to Mapbox layers
  useEffect(() => {
    const mapInstance = mapContext.current?.getMap();
    if (!mapInstance || reduxLayers.length === 0 || !data) return;

    const map = mapInstance;

    // Create a flat map of layer name → visibility from Redux
    const layerVisibilityMap = new Map<string, boolean>();

    const flattenLayers = (layers: LayerNode[]) => {
      for (const layer of layers) {
        if (layer.type === 'group' && layer.children) {
          flattenLayers(layer.children);
        } else {
          layerVisibilityMap.set(layer.name, layer.visible);
        }
      }
    };

    flattenLayers(reduxLayers);

    // Create mapping from QGIS layer name → layer ID (UUID)
    const qgisLayerMap = new Map<string, string>();

    const mapQGISLayers = (nodes: QGISLayerNode[]) => {
      for (const node of nodes) {
        if (isGroupLayer(node)) {
          if (node.children) {
            mapQGISLayers(node.children);
          }
        } else {
          qgisLayerMap.set(node.name, node.id);
        }
      }
    };

    if (data.children) {
      mapQGISLayers(data.children);
    }

    // Update visibility for all layers by matching name → ID → Mapbox layer
    layerVisibilityMap.forEach((visible, layerName) => {
      const qgisLayerId = qgisLayerMap.get(layerName);
      if (!qgisLayerId) return;

      const mapLayerId = `layer-${qgisLayerId}`;

      if (map.getLayer(mapLayerId)) {
        const visibility = visible ? 'visible' : 'none';
        map.setLayoutProperty(mapLayerId, 'visibility', visibility);
        console.log(`👁️ Toggling layer visibility: ${layerName} (${qgisLayerId}) → ${visibility}`);
      }
    });
  }, [mapContext, reduxLayers, data]);

  if (isLoading) {
    return (
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          Ładowanie projektu QGIS: {projectName}...
        </Alert>
      </Box>
    );
  }

  if (error || loadError) {
    // Enhanced error messages with backend context
    let errorTitle = 'Błąd ładowania projektu QGIS';
    let errorMessage = 'Nieznany błąd połączenia z serwerem';
    let errorSeverity: 'error' | 'warning' = 'error';

    if (loadError) {
      errorMessage = loadError;
    } else if (error && 'status' in error) {
      if (error.status === 404) {
        errorMessage = 'Projekt nie został znaleziony w bazie danych';
      } else if (error.status === 400) {
        errorTitle = 'Problem z odczytem projektu na serwerze';
        errorMessage =
          'Backend nie może odczytać projektu z powodu problemu wielowątkowości PyQGIS. ' +
          'Jest to znany problem backendowy związany z QObject threading. ' +
          'Spróbuj odświeżyć stronę (F5) lub poczekać chwilę.';
        errorSeverity = 'warning';
      } else if (error.status === 401) {
        errorMessage = 'Brak autoryzacji - zaloguj się ponownie';
      } else if (error.status === 500) {
        errorMessage = 'Błąd serwera (500) - skontaktuj się z administratorem';
      }
    } else if (error && 'data' in error) {
      try {
        const errorData = error.data as any;
        errorMessage = errorData?.message || JSON.stringify(errorData);
      } catch {
        errorMessage = 'Błąd parsowania odpowiedzi serwera';
      }
    }

    return (
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, maxWidth: 500 }}>
        <Alert severity={errorSeverity}>
          <Typography variant="body2" fontWeight={600}>
            {errorTitle}: {projectName}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            {errorMessage}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Project loaded successfully - no visual indicator needed
  // Layers are shown in LeftPanel layer tree
  return null;
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
  // CRITICAL: LAYERS parameter must use layer NAME, not layer ID (UUID)!
  // QGIS Server matches by layer name, not database UUID.
  // MAP parameter uses absolute path: /projects/{project_name}/{project_name}.qgs
  const wmsUrl =
    `https://api.universemapmaker.online/ows?` +
    `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&LAYERS=${encodeURIComponent(layer.name)}` +
    `&STYLES=` +
    `&WIDTH=256&HEIGHT=256` +
    `&FORMAT=image/png` +
    `&TRANSPARENT=true` +
    `&CRS=EPSG:3857` +
    `&BBOX={bbox-epsg-3857}` +
    `&DPI=96` +
    `&MAP=/projects/${encodeURIComponent(projectName)}/${encodeURIComponent(projectName)}.qgs`;

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
