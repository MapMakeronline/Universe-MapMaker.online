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
import { useLazyGetColumnValuesQuery, useLazyGetLayerAttributesWithTypesQuery } from '@/backend/layers';
import { useLazySearchInProjectQuery } from '@/backend/search';
import { useAppSelector } from '@/redux/hooks';

interface ParcelSearchTabProps {
  projectName: string | null;
  mapRef: React.RefObject<MapRef>;
}

const ParcelSearchTab: React.FC<ParcelSearchTabProps> = ({ projectName, mapRef }) => {
  const theme = useTheme();

  // Get layers from Redux (tree.json loaded layers)
  const { layers } = useAppSelector((state) => state.layers);

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

  // Load configuration from localStorage on mount
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
      } catch (error) {
        console.error('Error loading parcel search config:', error);
      }
    }
  }, [projectName]);

  // Fetch precincts when project/layer changes
  useEffect(() => {
    if (projectName && parcelLayerId && precinctColumn) {
      fetchPrecincts({
        project: projectName,
        layer_id: parcelLayerId,
        column_name: precinctColumn,
      });
    }
  }, [projectName, parcelLayerId, precinctColumn, fetchPrecincts]);

  // Fetch plot numbers when precinct selected
  useEffect(() => {
    if (projectName && parcelLayerId && plotNumberColumn) {
      fetchPlotNumbers({
        project: projectName,
        layer_id: parcelLayerId,
        column_name: plotNumberColumn,
      });
    }
  }, [projectName, parcelLayerId, plotNumberColumn, fetchPlotNumbers]);

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
      // STRATEGY CHANGE: If both criteria selected, make TWO API calls and intersect results
      // This fixes the issue where backend only returns columns containing the search phrase
      if (selectedPrecinct && selectedPlotNumber) {


        // Call 1: Search for precinct (fuzzy match - can be partial)
        const precinctResult = await triggerSearch({
          project: projectName,
          searched_phrase: selectedPrecinct,
          exactly: false,
          ignore_capitalization: true,
        });

        // Call 2: Search for plot number (EXACT match - must be exactly "1", not "10", "308/13", etc.)
        const plotNumberResult = await triggerSecondSearch({
          project: projectName,
          searched_phrase: selectedPlotNumber,
          exactly: true, // ✅ ZMIENIONO: dokładne dopasowanie numeru działki
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
      // ✅ Krok 2: Oblicz bounds (bbox) z geometrii
      const bbox = getGeometryBounds(featureGeometry);
      const [minLng, minLat, maxLng, maxLat] = bbox;



      // ✅ Krok 3: Przybliż mapę do działki
      map.fitBounds(
        [
          [minLng, minLat], // southwest
          [maxLng, maxLat]  // northeast
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
      map.addSource(highlightSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: featureGeometry,
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



      // ✅ Krok 5: Pokaż popup z informacjami o działce
      const parcelNumber = featureProperties?.NUMER_DZIA || featureProperties?.numer || 'N/A';
      const precinctName = featureProperties?.NAZWA_OBRE || featureProperties?.nazwa || 'N/A';
      const gmina = featureProperties?.NAZWA_GMIN || 'N/A';
      const idDzialki = featureProperties?.ID_DZIALKI || featureProperties?.ogc_fid || gid;

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px',
      })
        .setLngLat([
          (minLng + maxLng) / 2,  // Środek bounds
          (minLat + maxLat) / 2,
        ])
        .setHTML(`
          <div style="padding: 12px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: 600;">
              Działka ${parcelNumber}
            </h3>
            <div style="font-size: 14px; color: #666;">
              ${precinctName !== 'N/A' ? `<p style="margin: 5px 0;"><strong>Obręb:</strong> ${precinctName}</p>` : ''}
              ${gmina !== 'N/A' ? `<p style="margin: 5px 0;"><strong>Gmina:</strong> ${gmina}</p>` : ''}
              <p style="margin: 5px 0;"><strong>ID:</strong> ${idDzialki}</p>
            </div>
          </div>
        `)
        .addTo(map);




    } catch (error) {
      console.error('❌ Error handling parcel click:', error);
      alert('Błąd podczas wyświetlania działki');
    }
  };

  // Extract precincts and plot numbers arrays
  const precincts = precinctsData?.data || [];
  const plotNumbers = plotNumbersData?.data || [];

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
                <strong>Konfiguracja wymagana:</strong> Kliknij ikonę zębatki, aby wybrać warstwę działek.
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
            onChange={(e) => setSelectedPrecinct(e.target.value)}
          >
            <MenuItem value="">
              <em>Wybierz listę</em>
            </MenuItem>
            {precinctsLoading && (
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
          fullWidth
          disabled={!projectName || !parcelLayerId}
          options={plotNumbers.map(String)}
          value={selectedPlotNumber || null}
          onChange={(event, newValue) => setSelectedPlotNumber(newValue || '')}
          loading={plotNumbersLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Numer działki"
              placeholder="Wpisz lub wybierz z listy"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {plotNumbersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }}
        />

        {/* Search Button with Settings Icon */}
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
          <IconButton
            onClick={handleConfigOpen}
            sx={{
              bgcolor: theme.palette.grey[200],
              '&:hover': { bgcolor: theme.palette.grey[300] },
            }}
          >
            <SettingsIcon />
          </IconButton>
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
            <Typography variant="body2" color="error">
              Błąd wyszukiwania: {(searchError as any)?.data?.message || 'Nieznany błąd'}
            </Typography>
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
    </Box>
  );
};

export default ParcelSearchTab;
