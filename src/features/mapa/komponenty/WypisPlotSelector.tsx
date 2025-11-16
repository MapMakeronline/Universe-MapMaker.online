'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectGenerateModalOpen, selectSelectedConfigId } from '@/redux/slices/wypisSlice';
import { addPlot } from '@/redux/slices/wypisSlice';
import { setIdentifyMode } from '@/redux/slices/drawSlice';
import { useGetWypisConfigurationQuery, useGetPrecinctAndNumberMutation, useGetPlotSpatialDevelopmentMutation } from '@/backend/wypis';
import { mapLogger } from '@/tools/logger';
import { showError, showSuccess } from '@/redux/slices/notificationSlice';
import proj4 from 'proj4';

/**
 * WypisPlotSelector - Component for selecting plots (parcels) from map for wypis generation
 *
 * Workflow:
 * 1. User clicks "Wypis i Wyrys" FAB → Generate modal opens
 * 2. User selects wypis configuration from dropdown
 * 3. User clicks on map → Component captures click coordinates (WGS84)
 * 4. Transform coordinates: WGS84 (lng/lat) → EPSG:3857 (meters) for backend
 * 5. Query backend: POST /api/projects/wypis/precinct_and_number → {precinct, number}
 * 6. Transform to backend format: {key_column_name, key_column_value} using config column names
 * 7. Query backend: POST /api/projects/wypis/plotspatialdevelopment → planning zones with % coverage
 * 8. Add plot with destinations to Redux
 * 9. WypisGenerateDialog displays selected plots with checkboxes for planning zones
 * 10. User selects which zones/documents to include (all selected by default)
 * 11. User clicks "Generuj" → POST /api/projects/wypis/create (generate PDF)
 *
 * Features:
 * - Active only when generate modal is open AND config is selected
 * - Visual feedback on click (cursor change, toast notifications)
 * - Automatic deduplication (same plot can't be added twice)
 * - Shows planning zone coverage percentage (e.g., "SN (100.0%)")
 * - Coordinate transformation: WGS84 → EPSG:3857 (backend uses PostGIS ST_Contains with SRID 3857)
 * - Backend format transformation: {precinct, number} → {key_column_name, key_column_value}
 * - Error handling for invalid plots or API failures
 */
const WypisPlotSelector = () => {
  const { current: mapRef } = useMap();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const projectName = searchParams.get('project') || '';

  // Check if wypis selection mode is active
  const generateModalOpen = useAppSelector(selectGenerateModalOpen);
  const selectedConfigId = useAppSelector(selectSelectedConfigId);

  // RTK Query mutations
  const [getPrecinctAndNumber] = useGetPrecinctAndNumberMutation();
  const [getPlotSpatialDevelopment] = useGetPlotSpatialDevelopmentMutation();

  // Get wypis configuration to identify parcel layer
  const { data: configResponse, isLoading: isLoadingConfig, error: configError } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: selectedConfigId || undefined },
    { skip: !projectName || !selectedConfigId }
  );

  // Debug logging
  useEffect(() => {
    if (generateModalOpen) {
      mapLogger.log('🗺️ Wypis: Modal opened', {
        generateModalOpen,
        selectedConfigId,
        projectName,
        hasConfigResponse: !!configResponse,
        isLoadingConfig,
        configError,
        configResponseData: configResponse,
      });
    }
  }, [generateModalOpen, selectedConfigId, configResponse, isLoadingConfig, configError, projectName]);

  // Disable Identify tool when modal is open, re-enable when closed
  useEffect(() => {
    if (generateModalOpen) {
      // Dispatch action to disable identify mode
      dispatch(setIdentifyMode(false));
      mapLogger.log('🗺️ Wypis: Disabled Identify tool for plot selection');
    } else {
      // Re-enable Identify mode when modal closes
      dispatch(setIdentifyMode(true));
      mapLogger.log('🗺️ Wypis: Re-enabled Identify tool after modal close');
    }
  }, [generateModalOpen, dispatch]);

  useEffect(() => {
    if (!mapRef || !generateModalOpen) {
      mapLogger.log('🗺️ Wypis: Click handler NOT attached - missing mapRef or modal closed', {
        hasMapRef: !!mapRef,
        generateModalOpen,
      });
      return;
    }

    const map = mapRef.getMap();
    if (!map) {
      mapLogger.log('🗺️ Wypis: Click handler NOT attached - map instance not ready');
      return;
    }

    // CRITICAL: Check if we have config data before attaching listener
    if (!selectedConfigId) {
      mapLogger.log('🗺️ Wypis: Click handler NOT attached - no config selected', {
        selectedConfigId,
      });
      return;
    }

    if (!configResponse) {
      mapLogger.log('🗺️ Wypis: Click handler NOT attached - config not loaded yet', {
        hasConfigResponse: !!configResponse,
      });
      return;
    }

    mapLogger.log('🗺️ Wypis: Attaching click handler', {
      hasMap: !!map,
      generateModalOpen,
      selectedConfigId,
      hasConfigResponse: !!configResponse,
    });

    // Change cursor to crosshair when selection mode is active
    map.getCanvas().style.cursor = 'crosshair';
    mapLogger.log('🗺️ Wypis: Cursor changed to crosshair');

    const handleMapClick = async (e: any) => {
      mapLogger.log('🗺️ Wypis: Plot selection click FIRED!!!', {
        lngLat: [e.lngLat.lng, e.lngLat.lat],
      });

      try {
        // 1. Check if we have config_id before querying
        if (!selectedConfigId) {
          dispatch(showError('Wybierz konfigurację wypisu przed zaznaczaniem działek'));
          return;
        }

        // 2. Transform coordinates from WGS84 (Mapbox) to EPSG:3857 (backend)
        // Mapbox returns WGS84 (lng/lat), but backend expects EPSG:3857 (meters)
        const lngLat = [e.lngLat.lng, e.lngLat.lat];
        const [x, y] = proj4('EPSG:4326', 'EPSG:3857', lngLat);

        mapLogger.log('🗺️ Wypis: Transformed coordinates', {
          wgs84: lngLat,
          epsg3857: [x, y],
        });

        // 3. Query backend for precinct and plot number
        // Endpoint: POST /api/projects/wypis/precinct_and_number
        mapLogger.log('🗺️ Wypis: Querying backend for precinct and number', {
          point: [x, y],
          project: projectName,
          config_id: selectedConfigId,
        });

        dispatch(showSuccess('Identyfikowanie działki...'));

        let precinct: string;
        let number: string;

        try {
          // Try backend endpoint first (requires auth)
          const precinctResult = await getPrecinctAndNumber({
            project: projectName,
            config_id: selectedConfigId,
            point: [x, y], // EPSG:3857 coordinates (meters)
          }).unwrap();

          if (!precinctResult.success || !precinctResult.data) {
            mapLogger.error('❌ Wypis: Failed to get precinct and number', precinctResult);
            dispatch(showError('Nie znaleziono działki w tym miejscu. Kliknij na działkę.'));
            return;
          }

          precinct = precinctResult.data.precinct;
          number = precinctResult.data.number;
          mapLogger.log('✅ Wypis: Got precinct and number from backend', { precinct, number });
        } catch (error: any) {
          // If 401 (guest user), fallback to WFS GetFeature query
          if (error?.status === 401) {
            mapLogger.log('🔄 Wypis: Guest user detected, using WFS fallback', error);

            const config = (configResponse as any).data;
            const plotsLayer = config?.plotsLayer;
            const precinctColumn = config?.precinctColumn || 'NAZWA_OBRE';
            const plotNumberColumn = config?.plotNumberColumn || 'NUMER_DZIA';

            if (!plotsLayer) {
              dispatch(showError('Brak konfiguracji warstwy działek'));
              return;
            }

            // WFS GetFeature request to identify plot at coordinates
            // Use WMS GetFeatureInfo instead (simpler than WFS with XML filters)
            const bbox = `${x - 10},${y - 10},${x + 10},${y + 10}`; // 20m buffer around click
            const wmsUrl = `https://api.universemapmaker.online/ows?` +
              `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&` +
              `MAP=/projects/${projectName}/${projectName}.qgs&` +
              `LAYERS=${plotsLayer}&` +
              `QUERY_LAYERS=${plotsLayer}&` +
              `INFO_FORMAT=application/json&` +
              `I=0&J=0&WIDTH=1&HEIGHT=1&` +
              `CRS=EPSG:3857&` +
              `BBOX=${bbox}`;

            mapLogger.log('🔄 Wypis: WMS GetFeatureInfo request (guest fallback)', { wmsUrl, bbox, plotsLayer });

            const wfsResponse = await fetch(wmsUrl);
            const wfsData = await wfsResponse.json();

            if (!wfsData.features || wfsData.features.length === 0) {
              dispatch(showError('Nie znaleziono działki w tym miejscu. Kliknij na działkę.'));
              return;
            }

            const feature = wfsData.features[0];
            precinct = feature.properties[precinctColumn];
            number = feature.properties[plotNumberColumn];

            if (!precinct || !number) {
              dispatch(showError('Nie udało się odczytać numeru działki'));
              return;
            }

            mapLogger.log('✅ Wypis: Got precinct and number from WFS (guest)', { precinct, number });
          } else {
            // Other error - rethrow
            throw error;
          }
        }

        // 4. Transform to backend format using column names from wypis config
        // Backend expects: {key_column_name, key_column_value, precinct, number}
        const config = (configResponse as any).data;
        const precinctColumn = config?.precinctColumn || 'NAZWA_OBRE';
        const plotNumberColumn = config?.plotNumberColumn || 'NUMER_DZIA';

        mapLogger.log('🗺️ Wypis: Column names from config', {
          precinctColumn,
          plotNumberColumn,
        });

        // 5. Query spatial development endpoint to get planning zones with coverage %
        // Endpoint: POST /api/projects/wypis/plotspatialdevelopment
        dispatch(showSuccess(`Pobieranie informacji o przeznaczeniu działki ${precinct}/${number}...`));

        const spatialResult = await getPlotSpatialDevelopment({
          project: projectName,
          config_id: selectedConfigId,
          plot: [
            {
              key_column_name: plotNumberColumn,      // Backend format (DB column name)
              key_column_value: String(number),       // Plot number value
              precinct: String(precinct),             // Keep for response mapping
              number: String(number),                 // Keep for response mapping
            }
          ],
        }).unwrap();

        if (!spatialResult.success || !spatialResult.data || spatialResult.data.length === 0) {
          mapLogger.error('❌ Wypis: Failed to get spatial development', spatialResult);
          dispatch(showError(`Nie znaleziono informacji o przeznaczeniu działki ${precinct}/${number}`));
          return;
        }

        // 6. Add plot with destinations to Redux
        const plotWithDestinations = spatialResult.data[0];
        dispatch(addPlot(plotWithDestinations));

        mapLogger.log('✅ Wypis: Added plot to selection', {
          plot: plotWithDestinations.plot,
          destinationsCount: plotWithDestinations.plot_destinations?.length || 0,
        });

        dispatch(showSuccess(`Dodano działkę ${precinct}/${number} do wypisu`));

      } catch (error: any) {
        mapLogger.error('❌ Wypis: Error selecting plot', error);
        mapLogger.error('❌ Wypis: Error details', {
          status: error?.status,
          data: error?.data,
          message: error?.data?.message,
          fullError: JSON.stringify(error, null, 2),
        });
        dispatch(showError(error?.data?.message || 'Błąd podczas pobierania informacji o działce'));
      }
    };

    // Add click listener
    map.on('click', handleMapClick);
    mapLogger.log('🗺️ Wypis: Click listener ATTACHED successfully');

    // Cleanup
    return () => {
      mapLogger.log('🗺️ Wypis: Removing click listener');
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, generateModalOpen, projectName, dispatch, configResponse, getPrecinctAndNumber, getPlotSpatialDevelopment, selectedConfigId]);

  // This component doesn't render anything - it's just a click handler
  return null;
};

export default WypisPlotSelector;
