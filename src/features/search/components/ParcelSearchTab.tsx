/**
 * ParcelSearchTab - Simplified Parcel Search Interface
 *
 * Features:
 * - Dropdown for precinct (obręb) selection
 * - Autocomplete for plot number (numer działki) - user can type or select from dropdown
 * - Client-side buffering and filtering
 * - Coordinate transformation (EPSG:3857 → EPSG:4326)
 * - Map visualization with zoom and highlight
 *
 * Guest users: Can search using public layers (no auth required)
 * Authenticated users: Can configure search (Settings button)
 *
 * Documentation: SEARCH_DOCUMENTATION.md (lines 9-90, 420-465)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTheme } from '@mui/material/styles';
import { MapRef } from 'react-map-gl';
import { useLazyGetPlotLayerAttributesQuery, useSearchPlotByIdsMutation, useLazyGetPlotConfigQuery } from '@/backend/plot';
import type { PlotConfig } from '@/backend/plot';
import { useAppSelector } from '@/redux/hooks';
import { convertFeaturesToWGS84, convertBboxToWGS84, getUniqueValues } from '../utils/mapUtils';
import SearchConfigurator from './SearchConfigurator';
import proj4 from 'proj4';

interface ParcelSearchTabProps {
  projectName: string | null;
  mapRef: React.RefObject<MapRef>;
  onClose?: () => void; // Optional callback to close search modal
}

const ParcelSearchTab: React.FC<ParcelSearchTabProps> = ({ projectName, mapRef, onClose }) => {
  const theme = useTheme();

  // Get layers from Redux (tree.json loaded layers)
  const { layers } = useAppSelector((state) => state.layers);

  // Check if user is authenticated (to show/hide settings button)
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Configuration state
  const [plotConfig, setPlotConfig] = useState<PlotConfig | null>(null);

  // Search state
  const [selectedPrecinct, setSelectedPrecinct] = useState<string>('');
  const [selectedPlotNumber, setSelectedPlotNumber] = useState<string>('');

  // Buffered data (client-side filtering)
  const [allAttributes, setAllAttributes] = useState<any[]>([]);
  const [precinctOptions, setPrecinctOptions] = useState<string[]>([]);
  const [plotNumberOptions, setPlotNumberOptions] = useState<string[]>([]);

  // Configuration modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // RTK Query
  const [fetchPlotConfig, { data: configData }] = useLazyGetPlotConfigQuery();
  const [fetchAttributes, { isLoading: attributesLoading }] = useLazyGetPlotLayerAttributesQuery();
  const [searchPlotByIds, { isLoading: isSearching }] = useSearchPlotByIdsMutation();

  // Load configuration from backend on mount
  // Backend should allow public access to GET /api/projects/plot (no auth required for reading)
  useEffect(() => {
    if (!projectName) return;

    // Try to fetch config for all users (guests + authenticated)
    // If backend returns 401, guest users will see "configuration required" message
    fetchPlotConfig({ project: projectName });
  }, [projectName, fetchPlotConfig]);

  // Update plotConfig when configData changes
  useEffect(() => {
    if (configData?.data) {
      console.log('🔧 Plot config loaded:', configData.data);
      setPlotConfig(configData.data);
    } else if (configData) {
      console.warn('⚠️ Config response has no data:', configData);
    }
  }, [configData]);

  // Load all layer attributes when config is available
  useEffect(() => {
    if (!projectName || !plotConfig?.plot_layer) {
      console.log('⏸️ Skipping attribute load:', { projectName, plotConfig: plotConfig?.plot_layer });
      return;
    }

    console.log('📡 Loading layer attributes:', {
      project: projectName,
      layer_id: plotConfig.plot_layer,
      precinct_column: plotConfig.plot_precinct_column,
      plot_number_column: plotConfig.plot_number_column,
    });

    const loadData = async () => {
      try {
        const response = await fetchAttributes({
          project: projectName,
          layer_id: plotConfig.plot_layer,
        }).unwrap();

        console.log('✅ Attributes loaded:', response);

        const attributes = response.data?.Attributes || [];
        setAllAttributes(attributes);

        // Extract unique precincts
        const precincts = attributes
          .map(attr => attr[plotConfig.plot_precinct_column])
          .filter(value => value !== null && value !== undefined);

        const uniquePrecincts = getUniqueValues(precincts);
        console.log('📍 Precincts found:', uniquePrecincts.length, uniquePrecincts);
        setPrecinctOptions(uniquePrecincts);

        // Extract all plot numbers (unfiltered)
        const plotNumbers = attributes
          .map(attr => attr[plotConfig.plot_number_column])
          .filter(value => value !== null && value !== undefined);

        const uniquePlotNumbers = getUniqueValues(plotNumbers);
        console.log('📋 Plot numbers found:', uniquePlotNumbers.length);
        setPlotNumberOptions(uniquePlotNumbers);
      } catch (error: any) {
        console.error('❌ Failed to load layer attributes:', error);

        // If 401 Unauthorized, show user-friendly message
        if (error?.status === 401) {
          alert('Wyszukiwarka wymaga zalogowania. Endpoint /api/layer/attributes nie jest publiczny - backend musi dodać @permission_classes([AllowAny])');
        }
      }
    };

    loadData();
  }, [projectName, plotConfig, fetchAttributes]);

  // Update plot numbers when precinct changes
  useEffect(() => {
    if (!plotConfig || !selectedPrecinct) {
      // If no precinct selected, show all plot numbers
      const plotNumbers = allAttributes
        .map(attr => attr[plotConfig?.plot_number_column || ''])
        .filter(value => value !== null && value !== undefined);

      const uniquePlotNumbers = getUniqueValues(plotNumbers);
      setPlotNumberOptions(uniquePlotNumbers);
      return;
    }

    // Filter plot numbers by selected precinct
    const plotNumbers = allAttributes
      .filter(attr => attr[plotConfig.plot_precinct_column] === selectedPrecinct)
      .map(attr => attr[plotConfig.plot_number_column]);

    const uniquePlots = getUniqueValues(plotNumbers);
    setPlotNumberOptions(uniquePlots);
  }, [selectedPrecinct, allAttributes, plotConfig]);

  // Helper to transform geometry from EPSG:3857 to EPSG:4326
  const transformGeometry = (geometry: any): any => {
    if (!geometry || !geometry.coordinates) return geometry;

    const transformCoordArray = (coords: any): any => {
      if (typeof coords[0] === 'number') {
        // Single point [x, y] → transform from EPSG:3857 to EPSG:4326
        const [x, y] = coords;

        // Check if already EPSG:4326
        if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
          return [x, y];
        }

        // Transform from EPSG:3857 (Web Mercator) to EPSG:4326 (WGS84)
        return proj4('EPSG:3857', 'EPSG:4326', [x, y]);
      }

      // Array of coords → recurse
      return coords.map(transformCoordArray);
    };

    return {
      ...geometry,
      coordinates: transformCoordArray(geometry.coordinates),
    };
  };

  // Handle search
  const handleSearch = async () => {
    if (!projectName || !plotConfig) {
      alert('Brak konfiguracji wyszukiwania');
      return;
    }

    if (!selectedPrecinct && !selectedPlotNumber) {
      alert('Wybierz obręb lub numer działki');
      return;
    }

    try {
      console.log('🔍 Starting search:', { selectedPrecinct, selectedPlotNumber });

      // Get layer from tree.json - use layer.id (QGIS internal name) not layer.name (display name)
      const layer = flattenLayers(layers).find(l => l.id === plotConfig.plot_layer);

      // IMPORTANT: Use layer.id (QGIS internal name) for WFS requests, NOT layer.name (display name with spaces)
      // WFS requires the actual layer table name from QGIS, not the pretty display name
      const layerName = plotConfig.plot_layer; // This is already the layer ID

      console.log('📦 Layer info:', {
        layer_id: plotConfig.plot_layer,
        layer_name: layerName,
        layer_object: layer
      });

      // Build WFS GetFeature request using precinct/plot number filters
      const filters: string[] = [];

      if (selectedPrecinct) {
        filters.push(`
          <PropertyIsEqualTo>
            <PropertyName>${plotConfig.plot_precinct_column}</PropertyName>
            <Literal>${selectedPrecinct}</Literal>
          </PropertyIsEqualTo>
        `);
      }

      if (selectedPlotNumber) {
        filters.push(`
          <PropertyIsEqualTo>
            <PropertyName>${plotConfig.plot_number_column}</PropertyName>
            <Literal>${selectedPlotNumber}</Literal>
          </PropertyIsEqualTo>
        `);
      }

      const filterXml = filters.length > 1
        ? `<Filter><And>${filters.join('')}</And></Filter>`
        : `<Filter>${filters[0]}</Filter>`;

      const wfsUrl = `https://api.universemapmaker.online/ows?` +
        `SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&` +
        `TYPENAME=${encodeURIComponent(layerName)}&` +
        `MAP=/projects/${projectName}/${projectName}.qgs&` +
        `OUTPUTFORMAT=application/json&` +
        `FILTER=${encodeURIComponent(filterXml)}`;

      console.log('🌐 WFS Request:', wfsUrl);

      const response = await fetch(wfsUrl);

      if (!response.ok) {
        throw new Error(`WFS request failed: ${response.status} ${response.statusText}`);
      }

      const geojson = await response.json();

      console.log('✅ WFS Response:', geojson);

      if (!geojson.features || geojson.features.length === 0) {
        alert('Nie znaleziono działki');
        return;
      }

      // Transform geometries from EPSG:3857 to EPSG:4326
      const wgs84Features = geojson.features.map((feature: any) => ({
        ...feature,
        geometry: transformGeometry(feature.geometry),
      }));

      // Calculate bounds from transformed features
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

      wgs84Features.forEach((feature: any) => {
        const extractCoords = (coords: any) => {
          if (typeof coords[0] === 'number') {
            const [lng, lat] = coords;
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          } else {
            coords.forEach(extractCoords);
          }
        };
        extractCoords(feature.geometry.coordinates);
      });

      const bounds: [[number, number], [number, number]] = [
        [minLng, minLat],
        [maxLng, maxLat],
      ];

      console.log('📍 Calculated bounds:', bounds);

      // Get map instance
      const map = mapRef.current?.getMap();
      if (!map) {
        alert('Mapa nie jest dostępna');
        return;
      }

      // Remove existing highlight if any
      const highlightSourceId = 'parcel-highlight';
      const highlightFillLayerId = 'parcel-highlight-layer';
      const highlightOutlineLayerId = 'parcel-highlight-layer-outline';

      // Remove layers FIRST (before source)
      if (map.getLayer(highlightOutlineLayerId)) {
        map.removeLayer(highlightOutlineLayerId);
      }
      if (map.getLayer(highlightFillLayerId)) {
        map.removeLayer(highlightFillLayerId);
      }
      // Now remove source
      if (map.getSource(highlightSourceId)) {
        map.removeSource(highlightSourceId);
      }

      // Add GeoJSON source
      map.addSource(highlightSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: wgs84Features,
        },
      });

      // Add fill layer (purple, opaque)
      map.addLayer({
        id: highlightFillLayerId,
        type: 'fill',
        source: highlightSourceId,
        paint: {
          'fill-color': '#DDA0DD', // Plum (fioletowy)
          'fill-opacity': 1.0,
        },
      });

      // Add outline layer (darker purple)
      map.addLayer({
        id: highlightOutlineLayerId,
        type: 'line',
        source: highlightSourceId,
        paint: {
          'line-color': '#9370DB', // Medium purple (ciemnofioletowy)
          'line-width': 3,
        },
      });

      // Zoom to feature with animation
      mapRef.current?.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
      });

      // Close search modal
      onClose?.();
    } catch (error) {
      console.error('Search error:', error);
      alert('Błąd podczas wyszukiwania działki');
    }
  };

  // Handle config save
  const handleConfigSave = (config: PlotConfig) => {
    setPlotConfig(config);
    setConfigModalOpen(false);

    // Reset search state
    setSelectedPrecinct('');
    setSelectedPlotNumber('');
  };

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
  const vectorLayers = allLayers.filter((layer) =>
    layer.type === 'vector' ||
    layer.geometry ||
    layer.geometryType ||
    (layer.type !== 'raster' && layer.type !== 'group' && layer.type !== 'wms')
  );

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

        {!plotConfig && projectName && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: theme.palette.warning.light,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon sx={{ color: theme.palette.warning.dark }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Wyszukiwarka niedostępna:</strong>{' '}
                {isAuthenticated
                  ? 'Kliknij ikonę zębatki (⚙️) w prawym dolnym rogu, aby skonfigurować warstwę działek.'
                  : 'Administrator projektu musi skonfigurować wyszukiwarkę. Zaloguj się, aby uzyskać dostęp do konfiguracji.'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Obręb działki dropdown */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled={!projectName || !plotConfig}>
          <InputLabel id="precinct-label">Obręb działki</InputLabel>
          <Select
            labelId="precinct-label"
            value={selectedPrecinct}
            label="Obręb działki"
            onChange={(e) => {
              setSelectedPrecinct(e.target.value);
              // Reset plot number when precinct changes
              setSelectedPlotNumber('');
            }}
          >
            <MenuItem value="">
              <em>Wybierz z listy</em>
            </MenuItem>
            {attributesLoading && (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Ładowanie...
              </MenuItem>
            )}
            {!attributesLoading && precinctOptions.length === 0 && plotConfig && (
              <MenuItem disabled>
                <em>Brak danych w wybranej kolumnie</em>
              </MenuItem>
            )}
            {precinctOptions.map((precinct) => (
              <MenuItem key={String(precinct)} value={String(precinct)}>
                {String(precinct)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Numer działki - Autocomplete with typing */}
        <Autocomplete
          fullWidth
          options={plotNumberOptions}
          value={selectedPlotNumber || null}
          onChange={(_, newValue) => setSelectedPlotNumber(newValue || '')}
          disabled={!projectName || !plotConfig}
          loading={attributesLoading}
          noOptionsText="Brak danych w wybranej kolumnie"
          sx={{ mb: 2 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Numer działki"
              placeholder="Wpisz lub wybierz z listy"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {attributesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Search Button with Settings Icon (only for authenticated users) */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={!projectName || !plotConfig || isSearching || (!selectedPrecinct && !selectedPlotNumber)}
          >
            {isSearching ? 'Wyszukiwanie...' : 'Wyszukaj'}
          </Button>
          {isAuthenticated && (
            <IconButton
              onClick={() => setConfigModalOpen(true)}
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

      {/* Help Text */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Wybierz obręb i/lub numer działki, a następnie kliknij &quot;Wyszukaj&quot;
        </Typography>
      </Box>

      {/* Configuration Modal */}
      {isAuthenticated && (
        <SearchConfigurator
          open={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          projectName={projectName || ''}
          vectorLayers={vectorLayers}
          currentConfig={plotConfig}
          onSaveSuccess={handleConfigSave}
        />
      )}
    </Box>
  );
};

export default ParcelSearchTab;
