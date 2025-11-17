'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import { selectSelectedPlots, selectSelectedConfigId, selectGenerateModalOpen } from '@/redux/slices/wypisSlice';
import { useGetWypisConfigurationQuery } from '@/backend/wypis';
import proj4 from 'proj4';

/**
 * WypisPlotHighlighter - Highlights selected plots on the map during wypis generation
 *
 * Features:
 * - Shows yellow outline for all selected plots in wypis modal
 * - Updates highlight when plots are added/removed
 * - Clears highlight when modal is closed
 * - Uses WMS GetFeatureInfo to fetch plot geometry
 * - Transforms coordinates from EPSG:3857 to EPSG:4326 for Mapbox
 *
 * Visual:
 * - Yellow (#FFFF00) outline, 4px width
 * - Works with multiple plots (MultiPolygon GeoJSON)
 * - Auto-updates when plots change in Redux
 */
const WypisPlotHighlighter = () => {
  const { current: mapRef } = useMap();
  const searchParams = useSearchParams();
  const projectName = searchParams.get('project') || '';

  // Redux state
  const selectedPlots = useAppSelector(selectSelectedPlots);
  const selectedConfigId = useAppSelector(selectSelectedConfigId);
  const generateModalOpen = useAppSelector(selectGenerateModalOpen);

  // Get wypis configuration to identify parcel layer
  const { data: configResponse } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: selectedConfigId || '' },
    { skip: !projectName || !selectedConfigId }
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || !generateModalOpen || !selectedConfigId || !configResponse) {
      // Clear highlight when modal closed or no config
      if (map) {
        const highlightLayerId = 'wypis-plot-highlight-layer';
        const highlightSourceId = 'wypis-plot-highlight';

        if (map.getLayer(highlightLayerId)) {
          map.removeLayer(highlightLayerId);
        }
        if (map.getSource(highlightSourceId)) {
          map.removeSource(highlightSourceId);
        }
      }
      return;
    }

    // No plots selected - clear highlight
    if (selectedPlots.length === 0) {
      const highlightLayerId = 'wypis-plot-highlight-layer';
      const highlightSourceId = 'wypis-plot-highlight';

      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      if (map.getSource(highlightSourceId)) {
        map.removeSource(highlightSourceId);
      }
      return;
    }

    // Fetch geometries for all selected plots
    const fetchPlotGeometries = async () => {
      const config = (configResponse as any).data;
      const plotsLayerName = config?.plotsLayerName;
      const precinctColumn = config?.precinctColumn || 'NAZWA_OBRE';
      const plotNumberColumn = config?.plotNumberColumn || 'NUMER_DZIA';

      if (!plotsLayerName) {
        console.warn('⚠️ WypisPlotHighlighter: No plotsLayerName in config');
        return;
      }

      const geometries: any[] = [];

      // Fetch geometry for each plot using WMS GetFeatureInfo
      for (const plot of selectedPlots) {
        try {
          // Build WFS GetFeature request filtered by precinct and plot number
          const filter = `<Filter>
            <And>
              <PropertyIsEqualTo>
                <PropertyName>${precinctColumn}</PropertyName>
                <Literal>${plot.plot.precinct}</Literal>
              </PropertyIsEqualTo>
              <PropertyIsEqualTo>
                <PropertyName>${plotNumberColumn}</PropertyName>
                <Literal>${plot.plot.number}</Literal>
              </PropertyIsEqualTo>
            </And>
          </Filter>`;

          const wfsUrl = `https://api.universemapmaker.online/ows?` +
            `SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&` +
            `TYPENAME=${encodeURIComponent(plotsLayerName)}&` +
            `MAP=/projects/${projectName}/${projectName}.qgs&` +
            `OUTPUTFORMAT=application/json&` +
            `FILTER=${encodeURIComponent(filter)}`;

          const response = await fetch(wfsUrl);

          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch geometry for plot ${plot.plot.precinct}/${plot.plot.number}`);
            continue;
          }

          const geojson = await response.json();

          if (geojson.features && geojson.features.length > 0) {
            const feature = geojson.features[0];

            // Transform geometry from EPSG:3857 (backend) to EPSG:4326 (Mapbox)
            const transformedGeometry = transformGeometry(feature.geometry);
            geometries.push(transformedGeometry);
          }
        } catch (error) {
          console.error(`Error fetching geometry for plot ${plot.plot.precinct}/${plot.plot.number}:`, error);
        }
      }

      if (geometries.length === 0) {
        console.warn('⚠️ WypisPlotHighlighter: No geometries fetched');
        return;
      }

      // Create MultiPolygon GeoJSON from all plot geometries
      const multiGeometry: any = {
        type: 'GeometryCollection',
        geometries: geometries,
      };

      // Add/update highlight layer
      const highlightSourceId = 'wypis-plot-highlight';
      const highlightLayerId = 'wypis-plot-highlight-layer';

      // Remove existing highlight if any
      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      if (map.getSource(highlightSourceId)) {
        map.removeSource(highlightSourceId);
      }

      // Add new yellow highlight
      map.addSource(highlightSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: multiGeometry,
          properties: {},
        },
      });

      map.addLayer({
        id: highlightLayerId,
        type: 'line',
        source: highlightSourceId,
        paint: {
          'line-color': '#FFFF00',    // Yellow (żółty obrys)
          'line-width': 4,
          'line-opacity': 1,
        },
      });

      console.log(`✅ WypisPlotHighlighter: Highlighted ${geometries.length} plots`);
    };

    fetchPlotGeometries();
  }, [mapRef, selectedPlots, selectedConfigId, configResponse, generateModalOpen, projectName]);

  // This component doesn't render anything - it's just a map effect
  return null;
};

/**
 * Transform entire GeoJSON geometry to EPSG:4326 (WGS84)
 * Auto-detects source CRS from first coordinate
 */
const transformGeometry = (geometry: any): any => {
  if (!geometry || !geometry.coordinates) return geometry;

  let detectedCRS: string | null = null;

  const transformCoordArray = (coords: any): any => {
    if (typeof coords[0] === 'number') {
      // Single point [x, y] → transform
      // Auto-detect CRS from first coordinate if not already detected
      if (!detectedCRS) {
        const [x, y] = coords;

        // PRIORITY 1: Already EPSG:4326 (WGS84)
        if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
          detectedCRS = 'EPSG:4326';
        }
        // PRIORITY 2: EPSG:3857 (Web Mercator) - most common for QGIS Server
        else if (Math.abs(x) < 40000000 && Math.abs(y) < 40000000) {
          detectedCRS = 'EPSG:3857';
        }
        // PRIORITY 3: EPSG:2180 (Polish Grid)
        else if (x > 100000 && x < 1000000 && y < -4000000 && y > -6000000) {
          detectedCRS = 'EPSG:2180';
        }
        else {
          detectedCRS = 'EPSG:3857'; // Fallback
        }
      }

      // Transform if not already WGS84
      if (detectedCRS === 'EPSG:4326') {
        return coords;
      }

      return proj4(detectedCRS, 'EPSG:4326', coords) as [number, number];
    } else {
      // Array of points → recurse
      return coords.map((coord: any) => transformCoordArray(coord));
    }
  };

  return {
    ...geometry,
    coordinates: transformCoordArray(geometry.coordinates)
  };
};

export default WypisPlotHighlighter;
