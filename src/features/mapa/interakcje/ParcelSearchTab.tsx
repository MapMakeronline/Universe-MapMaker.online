/**
 * Parcel Search Tab - Cadastral Parcel Search
 *
 * Searches for cadastral parcels (działki) by:
 * - Obręb (precinct) - dropdown with unique values
 * - Numer działki (plot number) - dropdown with unique values
 *
 * Uses backend APIs:
 * - GET /api/layer/column/values - Get unique column values
 * - GET /api/projects/search - Search for parcel by criteria
 */

'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import LocationIcon from '@mui/icons-material/LocationOn';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import { MapRef } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import proj4 from 'proj4';
import { useLazyGetColumnValuesQuery, useLazyGetLayerAttributesWithTypesQuery } from '@/backend/layers';
import { useLazySearchInProjectQuery } from '@/backend/search';
import { useAppSelector } from '@/redux/hooks';
import IdentifyModal from '@/features/layers/modals/IdentifyModal';

// Coordinate system definitions for transformation
const EPSG_2180 = 'EPSG:2180'; // ETRS89 / Poland CS92 (Polish National Grid)
const EPSG_3857 = 'EPSG:3857'; // Web Mercator (meters)
const EPSG_4326 = 'EPSG:4326'; // WGS84 (degrees long/lat)

proj4.defs(EPSG_2180, '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
proj4.defs(EPSG_3857, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs');
proj4.defs(EPSG_4326, '+proj=longlat +datum=WGS84 +no_defs +type=crs');

/**
 * Fetch full GeoJSON from WFS for guest users (no authentication required)
 * Uses QGIS OWS GetFeature endpoint which works without auth for public projects
 * Returns full GeoJSON FeatureCollection for client-side filtering
 */
const fetchWFSFeatures = async (
  projectName: string,
  layerName: string
): Promise<any> => {
  try {
    // URL encode layer name (replace spaces with underscores)
    const encodedLayerName = encodeURIComponent(layerName.replace(/ /g, '_'));

    // Build WFS GetFeature request
    const url = `https://api.universemapmaker.online/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAME=${encodedLayerName}&OUTPUTFORMAT=application/json&MAP=/projects/${projectName}/${projectName}.qgs`;

    console.log(`🌐 Fetching WFS features for ${layerName}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WFS request failed: ${response.status}`);
    }

    const geojson = await response.json();

    // Log CRS information
    const crs = geojson.crs?.properties?.name || 'unknown';
    console.log(`✅ Fetched ${geojson.features?.length || 0} features from WFS (CRS: ${crs})`);

    // Log sample coordinates to help debug
    if (geojson.features && geojson.features[0]) {
      const sampleCoords = geojson.features[0].geometry?.coordinates;
      console.log('📍 Sample coordinates:', sampleCoords);
    }

    return geojson;
  } catch (error) {
    console.error('❌ Error fetching WFS data:', error);
    return { type: 'FeatureCollection', features: [] };
  }
};

/**
 * Extract unique values from GeoJSON FeatureCollection
 */
const extractUniqueValues = (geojson: any, columnName: string): string[] => {
  const values = new Set<string>();
  if (geojson.features && Array.isArray(geojson.features)) {
    geojson.features.forEach((feature: any) => {
      const value = feature.properties?.[columnName];
      if (value != null && value !== '') {
        values.add(String(value));
      }
    });
  }
  return Array.from(values).sort();
};

/**
 * Smart sort comparator for plot numbers (handles formats like "1", "1/2", "308/13")
 * Sorts numerically, treating "/" as decimal separator
 * Examples: 1, 1/2, 2, 9, 9/1, 9/2, 10, 19, 29/1, 29/2, 32/9, 99, 99/1, 999
 */
const sortPlotNumbers = (a: string, b: string): number => {
  // Parse plot number format: "123" or "123/456"
  const parseNumber = (str: string): [number, number] => {
    const parts = str.split('/');
    const main = parseInt(parts[0]) || 0;
    const sub = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
    return [main, sub];
  };

  const [aMain, aSub] = parseNumber(a);
  const [bMain, bSub] = parseNumber(b);

  // Sort by main number first
  if (aMain !== bMain) {
    return aMain - bMain;
  }

  // If main numbers equal, sort by sub-number
  // Numbers without "/" come before numbers with "/" (e.g., "9" before "9/1")
  if (aSub === 0 && bSub === 0) return 0;
  if (aSub === 0) return -1;
  if (bSub === 0) return 1;

  return aSub - bSub;
};

interface ParcelSearchTabProps {
  projectName: string | null;
  mapRef: React.RefObject<MapRef>;
}

const ParcelSearchTab: React.FC<ParcelSearchTabProps> = ({ projectName, mapRef }) => {
  const theme = useTheme();

  // Get layers from Redux (tree.json loaded layers)
  const { layers } = useAppSelector((state) => state.layers);

  // Check if user is authenticated (to show/hide settings button)
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Map reference for zoom/highlight
  // ✅ Use mapRef.current instead of useMap() hook (ParcelSearchTab is rendered outside <Map> component)
  const map = mapRef.current?.getMap();

  // Configuration modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Configuration state (saved in modal)
  const [parcelLayerId, setParcelLayerId] = useState<string>('');
  const [precinctColumn, setPrecinctColumn] = useState<string>('NAZWA_OBRE'); // Default column name
  const [plotNumberColumn, setPlotNumberColumn] = useState<string>('NUMER_DZIA'); // Default column name

  // Temporary config state (edited in modal)
  const [tempParcelLayerId, setTempParcelLayerId] = useState<string>('');
  const [tempPrecinctColumn, setTempPrecinctColumn] = useState<string>('');
  const [tempPlotNumberColumn, setTempPlotNumberColumn] = useState<string>('');

  // Search state
  const [selectedPrecinct, setSelectedPrecinct] = useState<string>('');
  const [selectedPlotNumber, setSelectedPlotNumber] = useState<string>('');

  // Highlighted feature state (for map interaction)
  const [highlightedFeatureGeoJSON, setHighlightedFeatureGeoJSON] = useState<any>(null);

  // Identify modal state
  const [identifyModalOpen, setIdentifyModalOpen] = useState(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<any[]>([]);
  const [identifyCoordinates, setIdentifyCoordinates] = useState<[number, number] | undefined>();

  // WFS state for guest users (unauthenticated)
  const [wfsFeatures, setWfsFeatures] = useState<any>(null); // Full GeoJSON FeatureCollection
  const [wfsLoading, setWfsLoading] = useState(false);

  // RTK Query
  const [fetchPrecincts, { data: precinctsData, isLoading: precinctsLoading }] =
    useLazyGetColumnValuesQuery();
  const [fetchPlotNumbers, { data: plotNumbersData, isLoading: plotNumbersLoading }] =
    useLazyGetColumnValuesQuery();
  const [fetchLayerAttributes, {
    data: layerAttributesData,
    isLoading: layerAttributesLoading,
    error: layerAttributesError,
    isError: isLayerAttributesError
  }] = useLazyGetLayerAttributesWithTypesQuery();
  const [triggerSearch, { data: searchData, isLoading: searchLoading, error: searchError }] =
    useLazySearchInProjectQuery();

  // Second lazy query for dual-criteria search (plot number search)
  const [triggerSecondSearch, { data: secondSearchData, isLoading: secondSearchLoading }] =
    useLazySearchInProjectQuery();

  // Combined loading state for both searches
  const isSearching = searchLoading || secondSearchLoading;

  // Load configuration from localStorage on mount OR auto-detect for guests
  useEffect(() => {
    if (!projectName) return;

    const storageKey = `parcelSearchConfig_${projectName}`;
    const savedConfig = localStorage.getItem(storageKey);

    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.parcelLayerId) setParcelLayerId(config.parcelLayerId);
        if (config.precinctColumn) setPrecinctColumn(config.precinctColumn);
        if (config.plotNumberColumn) setPlotNumberColumn(config.plotNumberColumn);
        console.log('✅ Loaded parcel search config from localStorage:', config);
      } catch (error) {
        console.error('Error loading parcel search config:', error);
      }
    } else {
      // No saved config - try auto-detect "Działki" layer
      console.log('⚠️ No saved config found, will auto-detect "Działki" layer');
    }
  }, [projectName]);

  // Auto-detect "Działki" layer for guests when layers are loaded
  useEffect(() => {
    if (!projectName || parcelLayerId || !layers || layers.length === 0) return;

    // Flatten layers to handle groups
    const allLayers = flattenLayers(layers);
    const vectorLayers = allLayers.filter((layer: any) =>
      layer.type === 'vector' ||
      layer.geometry ||
      layer.geometryType ||
      (layer.type !== 'raster' && layer.type !== 'group' && layer.type !== 'wms')
    );

    // Try to find "Działki" layer by name
    const dzialki = vectorLayers.find((layer: any) =>
      layer.name === 'Działki' ||
      layer.name.toLowerCase().includes('działki') ||
      layer.name.toLowerCase().includes('dzialki')
    );

    if (dzialki) {
      console.log('✅ Auto-detected "Działki" layer:', dzialki);
      setParcelLayerId(dzialki.id);
      // Use default column names (most common in Polish cadastral data)
      setPrecinctColumn('NAZWA_OBRE');
      setPlotNumberColumn('NUMER_DZIA');
    } else {
      console.log('⚠️ Could not auto-detect "Działki" layer. Available layers:', vectorLayers.map((l: any) => l.name));
    }
  }, [projectName, parcelLayerId, layers]);

  // Fetch WFS data for guest users (one-time fetch of full GeoJSON)
  useEffect(() => {
    if (!projectName || !parcelLayerId) return;
    if (isAuthenticated) return; // Only for guests

    setWfsLoading(true);
    const allLayers = flattenLayers(layers);
    const layer = allLayers.find((l: any) => l.id === parcelLayerId);

    if (layer) {
      fetchWFSFeatures(projectName, layer.name)
        .then((geojson) => {
          setWfsFeatures(geojson);
          setWfsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching WFS features:', error);
          setWfsLoading(false);
        });
    } else {
      setWfsLoading(false);
    }
  }, [projectName, parcelLayerId, isAuthenticated, layers]);

  // Fetch precincts for authenticated users (Django API)
  useEffect(() => {
    if (!projectName || !parcelLayerId || !precinctColumn) return;
    if (!isAuthenticated) return; // Only for authenticated users

    fetchPrecincts({
      project: projectName,
      layer_id: parcelLayerId,
      column_name: precinctColumn,
    });
  }, [projectName, parcelLayerId, precinctColumn, isAuthenticated, fetchPrecincts]);

  // Fetch plot numbers for authenticated users (Django API)
  useEffect(() => {
    if (!projectName || !parcelLayerId || !plotNumberColumn) return;
    if (!isAuthenticated) return; // Only for authenticated users

    if (selectedPrecinct && precinctColumn) {
      // Search by precinct to get filtered plot numbers
      triggerSearch({
        project: projectName,
        searched_phrase: selectedPrecinct,
        exactly: false,
        ignore_capitalization: true,
      });
    } else {
      // Get all plot numbers
      fetchPlotNumbers({
        project: projectName,
        layer_id: parcelLayerId,
        column_name: plotNumberColumn,
      });
    }
  }, [projectName, parcelLayerId, plotNumberColumn, selectedPrecinct, precinctColumn, isAuthenticated, fetchPlotNumbers, triggerSearch]);

  // Fetch layer attributes when temp layer is selected in config modal
  useEffect(() => {
    if (projectName && tempParcelLayerId && configModalOpen) {

      fetchLayerAttributes({
        project: projectName,
        layer_id: tempParcelLayerId,
      });
    }
  }, [projectName, tempParcelLayerId, configModalOpen, fetchLayerAttributes]);

  // Log API response/error when it changes
  useEffect(() => {  }, [layerAttributesData, layerAttributesLoading, isLayerAttributesError, layerAttributesError]);

  // Handle search
  const handleSearch = async () => {
    if (!projectName) return;

    // Validate at least one search criterion is selected
    if (!selectedPrecinct && !selectedPlotNumber) {
      alert('Wybierz obręb lub numer działki');
      return;
    }

    try {
      // FOR GUEST USERS: Client-side filtering of WFS features
      if (!isAuthenticated && wfsFeatures) {
        console.log('🔍 Guest search:', { selectedPrecinct, selectedPlotNumber });

        const matchedFeatures: any[] = [];

        if (wfsFeatures.features && Array.isArray(wfsFeatures.features)) {
          for (const feature of wfsFeatures.features) {
            const precinctValue = feature.properties?.[precinctColumn];
            const plotNumberValue = feature.properties?.[plotNumberColumn];

            const precinctStr = precinctValue ? String(precinctValue).trim().toLowerCase() : '';
            const plotNumberStr = plotNumberValue ? String(plotNumberValue).trim().toLowerCase() : '';

            const selectedPrecinctStr = selectedPrecinct ? selectedPrecinct.trim().toLowerCase() : '';
            const selectedPlotNumberStr = selectedPlotNumber ? selectedPlotNumber.trim().toLowerCase() : '';

            // Check if feature matches both criteria (if both provided) or single criterion
            const precinctMatches = selectedPrecinct ? precinctStr === selectedPrecinctStr : true;
            const plotNumberMatches = selectedPlotNumber ? plotNumberStr === selectedPlotNumberStr : true;

            if (precinctMatches && plotNumberMatches) {
              matchedFeatures.push(feature);
            }
          }
        }

        console.log(`✅ Found ${matchedFeatures.length} matching parcels in WFS data`);

        // Display matched features (show first match geometry, list all in identify modal)
        if (matchedFeatures.length > 0) {
          const firstFeature = matchedFeatures[0];

          // Show geometry on map
          if (firstFeature.geometry) {
            // Transform geometry from EPSG:3857 to EPSG:4326 for Mapbox
            const transformedGeometry = transformGeometry(firstFeature.geometry);

            // Calculate bounds and zoom to feature
            const bounds = getGeometryBounds(transformedGeometry);
            mapRef.current?.fitBounds(
              [
                [bounds[0], bounds[1]], // Southwest
                [bounds[2], bounds[3]]  // Northeast
              ],
              {
                padding: 100,
                duration: 1000,
              }
            );

            // Show all matched features in identify modal
            setIdentifiedFeatures(matchedFeatures);
            setIdentifyModalOpen(true);
          }
        } else {
          alert('Nie znaleziono działki spełniającej kryteria');
        }

        return; // Exit early for guests
      }

      // FOR AUTHENTICATED USERS: Use Django API
      // STRATEGY: If both criteria selected, make TWO API calls and intersect results
      if (selectedPrecinct && selectedPlotNumber) {
        // Call 1: Search for precinct (fuzzy match)
        const precinctResult = await triggerSearch({
          project: projectName,
          searched_phrase: selectedPrecinct,
          exactly: false,
          ignore_capitalization: true,
        });

        // Call 2: Search for plot number (EXACT match)
        const plotNumberResult = await triggerSecondSearch({
          project: projectName,
          searched_phrase: selectedPlotNumber,
          exactly: true,
          ignore_capitalization: true,
        });
      } else {
        // Single criterion: search for precinct OR plot number
        const searchPhrase = selectedPrecinct || selectedPlotNumber || '';

        const result = await triggerSearch({
          project: projectName,
          searched_phrase: searchPhrase,
          exactly: false,
          ignore_capitalization: true,
        });
      }
    } catch (error) {
      console.error('❌ ParcelSearchTab - Search failed:', error);
    }
  };

  // Handle config modal open
  const handleConfigOpen = () => {
    // Copy current config to temp state
    setTempParcelLayerId(parcelLayerId);
    setTempPrecinctColumn(precinctColumn);
    setTempPlotNumberColumn(plotNumberColumn);
    setConfigModalOpen(true);

    // Auto-select "Działki" layer if not already selected
    if (!parcelLayerId && vectorLayers.length > 0) {
      const dzialki = vectorLayers.find(layer => layer.name === 'Działki');
      if (dzialki) {

        setTempParcelLayerId(dzialki.id);
      }
    }
  };

  // Handle config modal save
  const handleConfigSave = () => {
    // Save temp config to actual config
    setParcelLayerId(tempParcelLayerId);
    setPrecinctColumn(tempPrecinctColumn);
    setPlotNumberColumn(tempPlotNumberColumn);
    setConfigModalOpen(false);

    // Save configuration to localStorage (persistent across page reloads)
    if (projectName) {
      const storageKey = `parcelSearchConfig_${projectName}`;
      const config = {
        parcelLayerId: tempParcelLayerId,
        precinctColumn: tempPrecinctColumn,
        plotNumberColumn: tempPlotNumberColumn,
      };
      localStorage.setItem(storageKey, JSON.stringify(config));

    }

    // Reset search state when config changes
    setSelectedPrecinct('');
    setSelectedPlotNumber('');
  };

  // Handle config modal cancel
  const handleConfigCancel = () => {
    setConfigModalOpen(false);
  };

  /**
   * Transform coordinates from any CRS to EPSG:4326 (WGS84)
   * Auto-detects source CRS based on coordinate ranges
   * @param coords [x, y] in source CRS
   * @returns [lng, lat] in EPSG:4326 (degrees)
   */
  const transformCoordinates = (coords: [number, number], sourceCRS?: string): [number, number] => {
    // Auto-detect CRS if not provided
    let fromCRS = sourceCRS;
    if (!fromCRS) {
      const [x, y] = coords;
      // EPSG:2180 (Polish Grid): x ~200000-900000, y ~-5800000 to -5000000
      if (x > 100000 && x < 1000000 && y < -4000000 && y > -6000000) {
        fromCRS = EPSG_2180;
      }
      // EPSG:3857 (Web Mercator): x ~-20000000 to 20000000, y ~-20000000 to 20000000
      else if (Math.abs(x) < 40000000 && Math.abs(y) < 40000000) {
        fromCRS = EPSG_3857;
      }
      // Already EPSG:4326: x ~-180 to 180, y ~-90 to 90
      else if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
        return coords; // Already in WGS84
      }
      else {
        console.warn('⚠️ Could not auto-detect CRS for coordinates:', coords);
        fromCRS = EPSG_3857; // Fallback
      }
    }

    console.log(`🔄 Transforming from ${fromCRS} to ${EPSG_4326}:`, coords);
    const result = proj4(fromCRS, EPSG_4326, coords) as [number, number];
    console.log(`✅ Transformed to:`, result);
    return result;
  };

  /**
   * Transform entire GeoJSON geometry to EPSG:4326
   * Auto-detects source CRS from first coordinate
   * @param geometry GeoJSON geometry in any CRS
   * @returns GeoJSON geometry in EPSG:4326
   */
  const transformGeometry = (geometry: any, sourceCRS?: string): any => {
    if (!geometry || !geometry.coordinates) return geometry;

    let detectedCRS = sourceCRS;

    const transformCoordArray = (coords: any): any => {
      if (typeof coords[0] === 'number') {
        // Single point [x, y] → transform
        // Auto-detect CRS from first coordinate if not already detected
        if (!detectedCRS) {
          const [x, y] = coords;
          if (x > 100000 && x < 1000000 && y < -4000000 && y > -6000000) {
            detectedCRS = EPSG_2180;
            console.log('🔍 Auto-detected CRS: EPSG:2180 (Polish Grid)');
          } else {
            detectedCRS = EPSG_3857;
            console.log('🔍 Auto-detected CRS: EPSG:3857 (Web Mercator)');
          }
        }
        return transformCoordinates(coords as [number, number], detectedCRS);
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

  /**
   * Calculate bounding box for GeoJSON geometry
   * @returns [minLng, minLat, maxLng, maxLat]
   */
  const getGeometryBounds = (geometry: any): [number, number, number, number] => {
    if (!geometry || !geometry.coordinates) {
      throw new Error('Invalid geometry');
    }

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    function processCoords(coords: any) {
      if (typeof coords[0] === 'number') {
        // Single point [lng, lat]
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      } else {
        // Array of points or multidimensional
        coords.forEach((coord: any) => processCoords(coord));
      }
    }

    processCoords(geometry.coordinates);

    return [minLng, minLat, maxLng, maxLat];
  };

  /**
   * Handle click on search result
   * - Uses geometry from search results (no WFS request needed!)
   * - Zooms map to feature
   * - Highlights feature on map
   */
  const handleResultClick = async (layerId: string, gid: number) => {
    if (!projectName) {
      console.error('❌ Missing projectName');
      return;
    }

    if (!map) {
      console.error('❌ Missing map reference');
      return;
    }

    // ✅ Krok 1: Znajdź feature w danych wyszukiwania (już mamy geometrię!)
    let featureGeometry: any = null;
    let featureProperties: any = {};

    // Szukaj w wynikach wyszukiwania (filteredSearchData zawiera wyniki po przecięciu)
    if (filteredSearchData?.data) {
      for (const [searchLayerId, layerData] of Object.entries(filteredSearchData.data)) {
        if (layerData && typeof layerData === 'object' && layerData.type === 'FeatureCollection' && Array.isArray(layerData.features)) {
          const foundFeature = layerData.features.find((f: any) => {
            const featureId = f.properties?.ogc_fid || f.id;
            return featureId === gid;
          });

          if (foundFeature) {
            featureGeometry = foundFeature.geometry;
            featureProperties = foundFeature.properties || {};
            break;
          }
        }
      }
    }

    if (!featureGeometry) {
      console.error('❌ Feature geometry not found in search results');
      alert('Nie znaleziono geometrii działki w wynikach wyszukiwania');
      return;
    }

    try {
      // ✅ Krok 2: Oblicz bounds (bbox) z geometrii (EPSG:3857)
      const bbox = getGeometryBounds(featureGeometry);
      const [minX, minY, maxX, maxY] = bbox;

      // ✅ Krok 2.5: Transformuj współrzędne z EPSG:3857 → EPSG:4326
      const [minLng, minLat] = transformCoordinates([minX, minY]);
      const [maxLng, maxLat] = transformCoordinates([maxX, maxY]);

      console.log('🗺️ Transformed coordinates:', {
        original: { minX, minY, maxX, maxY },
        wgs84: { minLng, minLat, maxLng, maxLat }
      });

      // ✅ Krok 3: Przybliż mapę do działki (używając WGS84 coordinates)
      map.fitBounds(
        [
          [minLng, minLat], // southwest (WGS84)
          [maxLng, maxLat]  // northeast (WGS84)
        ],
        {
          padding: 100,        // 100px padding wokół działki
          maxZoom: 17,         // Max zoom level
          duration: 1500,      // 1.5 sekundy animacji (smooth)
        }
      );



      // ✅ Krok 4: Podświetl działkę (pomarańczowy outline)
      const highlightSourceId = `highlight-parcel-${gid}`;
      const highlightLayerId = `highlight-parcel-layer-${gid}`;

      // Usuń poprzednie podświetlenie jeśli istnieje
      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      if (map.getSource(highlightSourceId)) {
        map.removeSource(highlightSourceId);
      }

      // Dodaj nowe podświetlenie (pomarańczowy outline)
      // ✅ Przetransformuj geometrię do WGS84 przed dodaniem do mapy
      const transformedGeometry = transformGeometry(featureGeometry);

      map.addSource(highlightSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: transformedGeometry, // ✅ Używamy przetransformowanej geometrii (WGS84)
          properties: featureProperties,
        },
      });

      map.addLayer({
        id: highlightLayerId,
        type: 'line',
        source: highlightSourceId,
        paint: {
          'line-color': '#ff9800',    // Pomarańczowy (zgodnie z backendem)
          'line-width': 4,
          'line-opacity': 1,
        },
      });



      // ✅ Krok 5: Otwórz modal identyfikacji z danymi działki
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      setIdentifyCoordinates([centerLng, centerLat]);

      // Format feature properties for IdentifyModal
      const formattedFeatures = [{
        layer: 'Działki',
        sourceLayer: 'QGIS Server',
        properties: Object.entries(featureProperties).map(([key, value]) => ({
          key,
          value,
        })),
        geometry: transformedGeometry,
      }];

      setIdentifiedFeatures(formattedFeatures);
      setIdentifyModalOpen(true);




    } catch (error) {
      console.error('❌ Error handling parcel click:', error);
      alert('Błąd podczas wyświetlania działki');
    }
  };

  // Extract precincts and plot numbers arrays
  // Use WFS data for guests, Django API data for authenticated users
  const precincts = isAuthenticated
    ? (precinctsData?.data || [])
    : (wfsFeatures && precinctColumn ? extractUniqueValues(wfsFeatures, precinctColumn) : []);

  // Plot numbers: If precinct selected, extract from search results (filtered)
  // Otherwise, use all plot numbers from API or WFS
  const plotNumbers = React.useMemo(() => {
    // For authenticated users with precinct selected: filter from search results
    if (isAuthenticated && selectedPrecinct && searchData?.data) {
      const numbers = new Set<string>();

      for (const [layerId, layerData] of Object.entries(searchData.data)) {
        if (layerData && typeof layerData === 'object' && layerData.type === 'FeatureCollection' && Array.isArray(layerData.features)) {
          for (const feature of layerData.features) {
            const precinctValue = feature.properties?.[precinctColumn];
            const plotNumberValue = feature.properties?.[plotNumberColumn];

            // Only include if precinct matches (exact match, case-insensitive)
            if (precinctValue && plotNumberValue) {
              const precinctStr = String(precinctValue).trim().toLowerCase();
              const selectedPrecinctStr = selectedPrecinct.trim().toLowerCase();

              if (precinctStr === selectedPrecinctStr) {
                numbers.add(String(plotNumberValue));
              }
            }
          }
        }
      }

      return Array.from(numbers).sort(sortPlotNumbers);
    }

    // For guests: filter WFS features by selected precinct (client-side filtering)
    if (!isAuthenticated && wfsFeatures) {
      const numbers = new Set<string>();

      if (wfsFeatures.features && Array.isArray(wfsFeatures.features)) {
        for (const feature of wfsFeatures.features) {
          const precinctValue = feature.properties?.[precinctColumn];
          const plotNumberValue = feature.properties?.[plotNumberColumn];

          // If precinct selected, filter by it
          if (selectedPrecinct && precinctValue && plotNumberValue) {
            const precinctStr = String(precinctValue).trim().toLowerCase();
            const selectedPrecinctStr = selectedPrecinct.trim().toLowerCase();

            if (precinctStr === selectedPrecinctStr) {
              numbers.add(String(plotNumberValue));
            }
          }
          // If no precinct selected, return all plot numbers
          else if (!selectedPrecinct && plotNumberValue) {
            numbers.add(String(plotNumberValue));
          }
        }
      }

      return Array.from(numbers).sort(sortPlotNumbers);
    }

    // No precinct selected or no filtering: return all plot numbers (authenticated users only)
    return isAuthenticated ? (plotNumbersData?.data || []) : [];
  }, [isAuthenticated, selectedPrecinct, searchData, plotNumbersData, wfsFeatures, precinctColumn, plotNumberColumn]);

  // Filter search results based on selected criteria
  // If both precinct AND plot number are selected, intersect results from TWO API calls
  const filteredSearchData = React.useMemo(() => {
    // Dual-criteria search: Intersect results from two API calls
    if (selectedPrecinct && selectedPlotNumber && searchData?.data && secondSearchData?.data) {
      // Extract features from precinct search (GeoJSON FeatureCollection format)
      const precinctFeatures: any[] = [];
      for (const [layerId, layerData] of Object.entries(searchData.data)) {
        // ✅ Backend zwraca GeoJSON FeatureCollection: { type: "FeatureCollection", features: [...] }
        if (layerData && typeof layerData === 'object' && layerData.type === 'FeatureCollection' && Array.isArray(layerData.features)) {
          precinctFeatures.push(...layerData.features);
        }
        // Fallback dla starszych formatów (jeśli backend kiedyś zwracał tablicę)
        else if (Array.isArray(layerData)) {
          precinctFeatures.push(...layerData);
        }
        else {
          console.warn(`  Precinct layer ${layerId}: unexpected format`, {
            type: typeof layerData,
            isFeatureCollection: layerData?.type === 'FeatureCollection',
            keys: Object.keys(layerData || {}),
          });
        }
      }

      // Extract features from plot number search (GeoJSON FeatureCollection format)
      const plotNumberFeatures: any[] = [];
      for (const [layerId, layerData] of Object.entries(secondSearchData.data)) {
        // ✅ Backend zwraca GeoJSON FeatureCollection
        if (layerData && typeof layerData === 'object' && layerData.type === 'FeatureCollection' && Array.isArray(layerData.features)) {
          plotNumberFeatures.push(...layerData.features);
        }
        // Fallback
        else if (Array.isArray(layerData)) {
          plotNumberFeatures.push(...layerData);
        }
        else {
          console.warn(`  Plot number layer ${layerId}: unexpected format`);
        }
      }
      // Extract feature IDs (use ogc_fid or id)
      const precinctIds = new Set<number>(
        precinctFeatures.map(f => f.properties?.ogc_fid || f.id).filter(id => id != null)
      );
      const plotNumberIds = new Set<number>(
        plotNumberFeatures.map(f => f.properties?.ogc_fid || f.id).filter(id => id != null)
      );

      // Find intersection (features that appear in BOTH searches)
      const intersectionIds = new Set<number>();
      for (const id of precinctIds) {
        if (plotNumberIds.has(id)) {
          intersectionIds.add(id);
        }
      }

      // ✅ Krok 1: Zbierz ID działek które mają DOKŁADNIE obwód "Kolbudy"
      // Backend zwraca wszystkie działki zawierające "Kolbudy" (LIKE '%Kolbudy%')
      // Musimy przefiltrować do tylko tych gdzie NAZWA_OBRE dokładnie = "Kolbudy"
      const exactPrecinctMatches = new Set<number>();
      for (const feature of precinctFeatures) {
        const featureId = feature.properties?.ogc_fid || feature.id;
        if (featureId == null) continue;

        // Pobierz wartość obrębu z properties
        const precinctValue = feature.properties?.[precinctColumn];
        if (!precinctValue) continue;

        // Porównaj dokładnie (case-insensitive, trim whitespace)
        const precinctStr = String(precinctValue).trim().toLowerCase();
        const searchPrecinctStr = selectedPrecinct.trim().toLowerCase();

        if (precinctStr === searchPrecinctStr) {
          exactPrecinctMatches.add(featureId);
        }
      }

      // ✅ Krok 2: Zbierz ID działek o DOKŁADNYM numerze "1" (nie LIKE, ale EXACT match)
      // Backend zwraca wszystkie działki zawierające "1" (LIKE '%1%'), np. "1", "10", "308/13"
      // Musimy przefiltrować do tylko tych o dokładnym numerze "1"
      const exactPlotNumberMatches = new Set<number>();

      for (const feature of plotNumberFeatures) {
        const featureId = feature.properties?.ogc_fid || feature.id;
        if (featureId == null) continue;

        // Pobierz numer działki z properties
        const plotNumber = feature.properties?.[plotNumberColumn];
        if (!plotNumber) continue;

        // Porównaj dokładnie (case-insensitive, trim whitespace)
        const plotNumberStr = String(plotNumber).trim().toLowerCase();
        const searchStr = selectedPlotNumber.trim().toLowerCase();

        if (plotNumberStr === searchStr) {
          exactPlotNumberMatches.add(featureId);
        }
      }

      // ✅ Krok 3: PRZECIĘCIE DWÓCH ZBIORÓW (dokładnie "Kolbudy" ∩ dokładnie "1")
      // finalIntersection = (działki gdzie NAZWA_OBRE = "Kolbudy") ∩ (działki gdzie NUMER_DZIA = "1")
      const finalIntersection = new Set<number>();
      for (const id of exactPrecinctMatches) {
        if (exactPlotNumberMatches.has(id)) {
          finalIntersection.add(id);
        }
      }

      // Build filtered FeatureCollection with only exact matches
      const filtered: Record<string, any> = {};
      for (const [layerId, layerData] of Object.entries(searchData.data)) {
        if (layerData && typeof layerData === 'object' && layerData.type === 'FeatureCollection' && Array.isArray(layerData.features)) {
          const matchingFeatures = layerData.features.filter((f: any) => {
            const featureId = f.properties?.ogc_fid || f.id;
            return featureId != null && finalIntersection.has(featureId);
          });

          if (matchingFeatures.length > 0) {
            filtered[layerId] = {
              ...layerData,
              features: matchingFeatures,
            };
          }
        }
      }
      return { ...searchData, data: filtered };
    }

    // Single criterion: return searchData as-is
    if (!searchData?.data) return null;
    return searchData;
  }, [searchData, secondSearchData, selectedPrecinct, selectedPlotNumber]);

  // Count search results (using filtered data - GeoJSON FeatureCollection format)
  const totalResults = filteredSearchData?.data
    ? Object.values(filteredSearchData.data).reduce((sum, layerData: any) => {
        // GeoJSON FeatureCollection format
        if (layerData && typeof layerData === 'object' && layerData.type === 'FeatureCollection' && Array.isArray(layerData.features)) {
          return sum + layerData.features.length;
        }
        // Legacy array format (fallback)
        if (Array.isArray(layerData)) {
          return sum + layerData.length;
        }
        return sum;
      }, 0)
    : 0;

  // Flatten layer tree to get all layers (including nested in groups)
  const flattenLayers = (layerNodes: any[]): any[] => {
    const result: any[] = [];
    for (const node of layerNodes) {
      if (node.type === 'group' && node.children) {
        // Recursively flatten group children
        result.push(...flattenLayers(node.children));
      } else if (node.type !== 'group') {
        // Add non-group layers
        result.push(node);
      }
    }
    return result;
  };

  // Get list of vector layers (only vector layers can have parcels)
  const allLayers = flattenLayers(layers);

  // Filter layers - accept 'vector' or any layer with 'geometry' field
  // Some QGIS layers may have different type names
  const vectorLayers = allLayers.filter((layer) =>
    layer.type === 'vector' ||
    layer.geometry ||
    layer.geometryType ||
    (layer.type !== 'raster' && layer.type !== 'group' && layer.type !== 'wms')
  );

  // Debug: Log processed layers




  // Get available column names (filter out geometry columns)
  const availableColumns = layerAttributesData?.data?.Types
    ? Object.keys(layerAttributesData.data.Types).filter(col => col !== 'geom' && col !== 'ogc_fid')
    : [];

  return (
    <Box>
      {/* Search Input Section */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'white',
        }}
      >
        {!projectName && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mb: 2, textAlign: 'center' }}
          >
            Brak otwartego projektu. Otwórz projekt, aby wyszukiwać działki.
          </Typography>
        )}

        {!parcelLayerId && projectName && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: theme.palette.info.light,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon sx={{ color: theme.palette.info.dark }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Konfiguracja wymagana:</strong>{' '}
                {isAuthenticated
                  ? 'Kliknij ikonę zębatki, aby wybrać warstwę działek.'
                  : 'Administrator projektu musi skonfigurować wyszukiwarkę działek.'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Obręb działki dropdown */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled={!projectName || !parcelLayerId}>
          <InputLabel id="precinct-label">Obręb działki</InputLabel>
          <Select
            labelId="precinct-label"
            value={selectedPrecinct}
            label="Obręb działki"
            onChange={(e) => {
              setSelectedPrecinct(e.target.value);
              // Reset plot number when precinct changes (different precinct = different plot numbers)
              setSelectedPlotNumber('');
            }}
          >
            <MenuItem value="">
              <em>Wybierz listę</em>
            </MenuItem>
            {(precinctsLoading || wfsLoading) && (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Ładowanie...
              </MenuItem>
            )}
            {precincts.map((precinct) => (
              <MenuItem key={String(precinct)} value={String(precinct)}>
                {String(precinct)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Numer działki autocomplete */}
        <Autocomplete
          freeSolo
          fullWidth
          disabled={!projectName || !parcelLayerId}
          options={plotNumbers.map(String)}
          value={selectedPlotNumber || ''}
          onChange={(event, newValue) => setSelectedPlotNumber(newValue || '')}
          onInputChange={(event, newInputValue) => setSelectedPlotNumber(newInputValue || '')}
          loading={plotNumbersLoading || wfsLoading}
          filterOptions={(options, state) => {
            // Filter options based on what user typed
            const inputValue = state.inputValue.toLowerCase();
            return options.filter(option =>
              String(option).toLowerCase().includes(inputValue)
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Numer działki"
              placeholder="Wpisz lub wybierz z listy"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {(plotNumbersLoading || wfsLoading) ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }}
        />

        {/* Search Button with Settings Icon (only for authenticated users) */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={!projectName || !parcelLayerId || isSearching || (!selectedPrecinct && !selectedPlotNumber)}
          >
            {isSearching ? 'Wyszukiwanie...' : 'Wyszukaj'}
          </Button>
          {isAuthenticated && (
            <IconButton
              onClick={handleConfigOpen}
              sx={{
                bgcolor: theme.palette.grey[200],
                '&:hover': { bgcolor: theme.palette.grey[300] },
              }}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Results Section */}
      <Box sx={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto', p: 3 }}>
        {isSearching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {searchError && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="error" gutterBottom>
              {(searchError as any)?.status === 401 && !isAuthenticated
                ? 'Wyszukiwanie działek wymaga uwierzytelnienia. Funkcja wyszukiwania jest dostępna tylko dla zalogowanych użytkowników.'
                : `Błąd wyszukiwania: ${(searchError as any)?.data?.message || (searchError as any)?.data?.detail || 'Nieznany błąd'}`}
            </Typography>
            {(searchError as any)?.status === 401 && !isAuthenticated && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.href = '/auth'}
                sx={{ mt: 2 }}
              >
                Zaloguj się
              </Button>
            )}
          </Box>
        )}

        {!isSearching && filteredSearchData && totalResults === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Nie znaleziono działki spełniającej kryteria
            </Typography>
          </Box>
        )}

        {!isSearching && filteredSearchData && totalResults > 0 && (
          <Box>
            <Typography variant="body2" color="primary" fontWeight={500} gutterBottom>
              Znaleziono {totalResults} {totalResults === 1 ? 'wynik' : 'wyniki'}
            </Typography>

            {Object.entries(filteredSearchData.data).map(([layerId, layerData]: [string, any]) => {
              // Extract features from GeoJSON FeatureCollection
              const features = layerData?.type === 'FeatureCollection' && Array.isArray(layerData.features)
                ? layerData.features
                : (Array.isArray(layerData) ? layerData : []);

              return (
                <Box
                  key={layerId}
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    {layerData.layer_name || layerId}
                  </Typography>
                  {features.map((feature: any, index: number) => {
                    const featureId = feature.properties?.ogc_fid || feature.id || index;
                    const parcelNumber = feature.properties?.NUMER_DZIA || feature.properties?.numer || 'N/A';
                    const precinctName = feature.properties?.NAZWA_GMIN || feature.properties?.NAZWA_OBRE || feature.properties?.nazwa || 'N/A';
                    const displayText = `${precinctName} - Działka ${parcelNumber}`;

                    return (
                      <ListItemButton
                        key={featureId}
                        onClick={() => handleResultClick(layerId, featureId)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            bgcolor: theme.palette.primary.light,
                            color: 'white',
                          },
                        }}
                      >
                        <ListItemText
                          primary={displayText}
                          secondary={`ID: ${featureId}`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <LocationIcon sx={{ ml: 1, fontSize: 20 }} />
                      </ListItemButton>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        )}

        {!filteredSearchData && !isSearching && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Wybierz obręb i/lub numer działki, a następnie kliknij &quot;Wyszukaj&quot;
            </Typography>
          </Box>
        )}
      </Box>

      {/* Configuration Modal */}
      <Dialog
        open={configModalOpen}
        onClose={handleConfigCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            Konfiguracja wyszukiwania działek
          </Box>
          <IconButton
            onClick={handleConfigCancel}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Layer Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="config-layer-label">Wybierz warstwę działek:</InputLabel>
            <Select
              labelId="config-layer-label"
              value={tempParcelLayerId}
              label="Wybierz warstwę działek:"
              onChange={(e) => setTempParcelLayerId(e.target.value)}
            >
              {vectorLayers.length === 0 && (
                <MenuItem disabled>
                  <em>Brak warstw wektorowych w projekcie</em>
                </MenuItem>
              )}
              {vectorLayers.map((layer) => (
                <MenuItem key={layer.id} value={layer.id}>
                  {layer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Precinct Column */}
          <FormControl fullWidth sx={{ mb: 2 }} disabled={!tempParcelLayerId}>
            <InputLabel id="config-precinct-column-label">Kolumna obręb:</InputLabel>
            <Select
              labelId="config-precinct-column-label"
              value={availableColumns.includes(tempPrecinctColumn) ? tempPrecinctColumn : ''}
              label="Kolumna obręb:"
              onChange={(e) => setTempPrecinctColumn(e.target.value)}
            >
              {!tempParcelLayerId && (
                <MenuItem disabled>
                  <em>Najpierw wybierz warstwę</em>
                </MenuItem>
              )}
              {layerAttributesLoading && (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Ładowanie kolumn...
                </MenuItem>
              )}
              {availableColumns.map((columnName) => (
                <MenuItem key={columnName} value={columnName}>
                  {columnName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Plot Number Column */}
          <FormControl fullWidth sx={{ mb: 2 }} disabled={!tempParcelLayerId}>
            <InputLabel id="config-plot-column-label">Kolumna numer działki:</InputLabel>
            <Select
              labelId="config-plot-column-label"
              value={availableColumns.includes(tempPlotNumberColumn) ? tempPlotNumberColumn : ''}
              label="Kolumna numer działki:"
              onChange={(e) => setTempPlotNumberColumn(e.target.value)}
            >
              {!tempParcelLayerId && (
                <MenuItem disabled>
                  <em>Najpierw wybierz warstwę</em>
                </MenuItem>
              )}
              {layerAttributesLoading && (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Ładowanie kolumn...
                </MenuItem>
              )}
              {availableColumns.map((columnName) => (
                <MenuItem key={columnName} value={columnName}>
                  {columnName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Wybierz kolumny zawierające obręb i numer działki
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleConfigCancel} color="inherit">
            Anuluj
          </Button>
          <Button
            onClick={handleConfigSave}
            variant="contained"
            disabled={!tempParcelLayerId || !tempPrecinctColumn || !tempPlotNumberColumn}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      {/* Identify Modal */}
      <IdentifyModal
        open={identifyModalOpen}
        onClose={() => setIdentifyModalOpen(false)}
        features={identifiedFeatures}
        coordinates={identifyCoordinates}
        isLoading={false}
      />
    </Box>
  );
};

export default ParcelSearchTab;
