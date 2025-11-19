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
import { useLazyGetPlotLayerAttributesQuery, useLazyGetPlotConfigQuery, useSearchPlotByIdsMutation } from '@/backend/plot';
import type { PlotConfig } from '@/backend/plot';
import { useAppSelector } from '@/redux/hooks';
import { getUniqueValues } from '../utils/mapUtils';
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
  const [fetchPlotConfig, { data: configData, error: configError }] = useLazyGetPlotConfigQuery();
  const [fetchAttributes, { isLoading: attributesLoading, error: attributesError }] = useLazyGetPlotLayerAttributesQuery();
  const [searchPlotByIds, { isLoading: isSearching }] = useSearchPlotByIdsMutation();

  // Load configuration from backend on mount
  // Backend should allow public access to GET /api/projects/plot (no auth required for reading)
  useEffect(() => {
    console.log('📡 ParcelSearchTab mounted, projectName:', projectName);
    if (!projectName) return;

    // Try to fetch config for all users (guests + authenticated)
    // If backend returns 401, guest users will see "configuration required" message
    console.log('📡 Fetching plot config for project:', projectName);
    fetchPlotConfig({ project: projectName });
  }, [projectName, fetchPlotConfig]);

  // Update plotConfig when configData changes
  useEffect(() => {
    if (configError) {
      console.error('❌ Plot config error:', configError);
      console.log('ℹ️ This is expected for guest users if backend requires auth');
    }

    if (configData?.data) {
      console.log('🔧 Plot config loaded:', configData.data);
      setPlotConfig(configData.data);
    } else if (configData) {
      console.warn('⚠️ Config response has no data:', configData);
    }
  }, [configData, configError]);

  // Load all layer attributes when config is available
  // Backend endpoint /api/layer/attributes now works for guests (AllowAny permission)
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
        console.log('ℹ️ Error details:', {
          status: error?.status,
          message: error?.data?.message,
          full: error
        });
        alert('Błąd podczas ładowania danych działek. Sprawdź konfigurację lub spróbuj ponownie.');
      }
    };

    loadData();
  }, [projectName, plotConfig, fetchAttributes]);

  // Log attributes error
  useEffect(() => {
    if (attributesError) {
      console.error('❌ Attributes error:', attributesError);
    }
  }, [attributesError]);

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

  // Handle search using ogc_fid (same as SearchToolbox.tsx)
  const handleSearch = async () => {
    if (!projectName || !plotConfig) {
      alert('Brak konfiguracji wyszukiwania');
      return;
    }

    if (!selectedPrecinct || !selectedPlotNumber) {
      alert('Proszę wybrać obręb i numer działki');
      return;
    }

    try {
      console.log('🔍 Starting search:', { selectedPrecinct, selectedPlotNumber });

      // Filter matching features from allAttributes (client-side)
      const matchingFeatures = allAttributes.filter((attr: any) => {
        return attr[plotConfig.plot_precinct_column] === selectedPrecinct &&
               attr[plotConfig.plot_number_column] === selectedPlotNumber;
      });

      console.log('✅ Matching features found:', matchingFeatures.length, matchingFeatures);

      if (matchingFeatures.length === 0) {
        alert('Nie znaleziono działki');
        return;
      }

      // Extract feature IDs (ogc_fid, id, or fid)
      const featureIds = matchingFeatures.map((attr: any) => attr.ogc_fid || attr.id || attr.fid);
      console.log('📋 Feature IDs:', featureIds);

      // Call backend endpoint /api/layer/features/selected
      const result = await searchPlotByIds({
        project: projectName,
        layer_id: plotConfig.plot_layer,
        label: featureIds,
      }).unwrap();

      console.log('✅ Search result:', result);

      if (!result.data || !result.data.bbox || !result.data.features || result.data.features.length === 0) {
        alert('Nie znaleziono działki');
        return;
      }

      // Backend returns bbox in EPSG:3857 (Web Mercator)
      const bbox = result.data.bbox; // [minX, minY, maxX, maxY]
      const features = result.data.features;

      // Transform bbox from EPSG:3857 to EPSG:4326 (WGS84)
      const [minX, minY, maxX, maxY] = bbox;
      const [minLng, minLat] = proj4('EPSG:3857', 'EPSG:4326', [minX, minY]);
      const [maxLng, maxLat] = proj4('EPSG:3857', 'EPSG:4326', [maxX, maxY]);

      const bounds: [[number, number], [number, number]] = [
        [minLng, minLat],
        [maxLng, maxLat],
      ];

      console.log('📍 Bounds (WGS84):', bounds);

      // Transform feature geometries from EPSG:3857 to EPSG:4326
      const wgs84Features = features.map((feature: any) => ({
        ...feature,
        geometry: transformGeometry(feature.geometry),
      }));

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

      // Add GeoJSON source with transformed features
      map.addSource(highlightSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: wgs84Features,
        },
      });

      // Add fill layer (purple, semi-transparent)
      map.addLayer({
        id: highlightFillLayerId,
        type: 'fill',
        source: highlightSourceId,
        paint: {
          'fill-color': '#DDA0DD', // Plum (fioletowy)
          'fill-opacity': 0.6,
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

      console.log('✅ Map zoomed and highlighted');

      // Close search modal
      onClose?.();
    } catch (error: any) {
      console.error('❌ Search error:', error);
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
