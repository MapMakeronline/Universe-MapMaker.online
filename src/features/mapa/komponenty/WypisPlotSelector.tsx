'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectGenerateModalOpen, selectSelectedConfigId } from '@/redux/slices/wypisSlice';
import { addPlot } from '@/redux/slices/wypisSlice';
import { setIdentifyMode } from '@/redux/slices/drawSlice';
import { useGetPlotSpatialDevelopmentMutation, useGetWypisConfigurationQuery } from '@/backend/wypis';
import { getQGISFeatureInfoMultiLayer } from '@/lib/qgis/getFeatureInfo';
import { mapLogger } from '@/tools/logger';
import { showError, showSuccess } from '@/redux/slices/notificationSlice';

/**
 * WypisPlotSelector - Component for selecting plots (parcels) from map for wypis generation
 *
 * Workflow:
 * 1. User clicks "Wypis i Wyrys" FAB → Generate modal opens
 * 2. User clicks on map → This component captures click
 * 3. Identify feature via QGIS OWS GetFeatureInfo
 * 4. Extract precinct + number from feature properties
 * 5. Query backend for planning zones: POST /api/projects/wypis/plotspatialdevelopment
 * 6. Add plot with destinations to Redux
 * 7. WypisGenerateDialog displays selected plots
 *
 * Features:
 * - Active only when generate modal is open
 * - Visual feedback on click (cursor change, toast notifications)
 * - Automatic deduplication (same plot can't be added twice)
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
  const [getPlotSpatialDevelopment, { isLoading: isLoadingSpatialData }] =
    useGetPlotSpatialDevelopmentMutation();

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

  // Disable Identify tool when modal is open
  useEffect(() => {
    if (generateModalOpen) {
      // Dispatch action to disable identify mode
      dispatch(setIdentifyMode(false));
      mapLogger.log('🗺️ Wypis: Disabled Identify tool for plot selection');
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
        // 1. Get parcel layer name from configuration
        let parcelLayerName: string | undefined;

        // Backend returns: { data: { plotsLayer: "tmp_name_...", plotsLayerName: "Działki 29_10_25" }, success: true }
        // We need plotsLayerName (QGIS layer name), NOT plotsLayer (database internal ID)
        if ('data' in configResponse && configResponse.data) {
          const config = configResponse.data as any;
          parcelLayerName = config.plotsLayerName || config.parcel_layer_name;
          mapLogger.log('🗺️ Wypis: Using parcel layer from config', {
            parcelLayerName,
            plotsLayer: config.plotsLayer,
            plotsLayerName: config.plotsLayerName,
            fullConfig: config
          });
        }

        if (!parcelLayerName) {
          dispatch(showError('Brak warstwy działek w konfiguracji. Wybierz konfigurację.'));
          return;
        }

        // 2. Query QGIS OWS GetFeatureInfo at click point
        const canvas = map.getCanvas();

        mapLogger.log('🗺️ Wypis: Querying QGIS Server for parcel', {
          layer: parcelLayerName,
          point: [e.lngLat.lng, e.lngLat.lat],
        });

        const qgisResult = await getQGISFeatureInfoMultiLayer(
          {
            project: projectName,
            clickPoint: e.lngLat,
            bounds: map.getBounds(),
            width: canvas.width,
            height: canvas.height,
            featureCount: 1, // Only get first feature
          },
          [parcelLayerName]
        );

        if (qgisResult.features.length === 0) {
          dispatch(showError('Nie znaleziono działki w tym miejscu. Kliknij na działkę.'));
          return;
        }

        const feature = qgisResult.features[0];
        mapLogger.log('✅ Wypis: Found parcel feature', {
          id: feature.id,
          properties: feature.properties,
        });

        // 3. Extract precinct (obręb) and number from properties
        // Use column names from configuration
        const properties = feature.properties;
        const config = configResponse.data as any;

        // Get column names from configuration
        const precinctColumn = config.precinctColumn || 'NAZWA_OBRE';
        const plotNumberColumn = config.plotNumberColumn || 'NUMER_DZIA';

        mapLogger.log('🗺️ Wypis: Column names from config', {
          precinctColumn,
          plotNumberColumn,
          properties
        });

        // Try different property name variations (config + fallbacks)
        const precinct =
          properties[precinctColumn] ||
          properties.obreb ||
          properties.obręb ||
          properties.precinct ||
          properties.OBREB ||
          properties.OBRĘB ||
          properties.NAZWA_OBRE ||
          '';

        const number =
          properties[plotNumberColumn] ||
          properties.numer ||
          properties.nr_dzialki ||
          properties.number ||
          properties.NUMER ||
          properties.NR_DZIALKI ||
          properties.NUMER_DZIA ||
          '';

        if (!precinct || !number) {
          mapLogger.error('❌ Wypis: Missing precinct or number in properties', { properties });
          dispatch(showError(`Nieprawidłowe dane działki. Brak obrębu lub numeru. Właściwości: ${Object.keys(properties).join(', ')}`));
          return;
        }

        const plotData = {
          precinct: String(precinct),
          number: String(number),
        };

        mapLogger.log('✅ Wypis: Extracted plot data', plotData);

        // 4. Query spatial development endpoint
        dispatch(showSuccess(`Pobieranie informacji o przeznaczeniu działki ${precinct}/${number}...`));

        const result = await getPlotSpatialDevelopment({
          project: projectName,
          plot: plotData,
        }).unwrap();

        if (!result.success || !result.data || result.data.length === 0) {
          dispatch(showError(`Nie znaleziono informacji o przeznaczeniu działki ${precinct}/${number}`));
          return;
        }

        // 5. Dispatch addPlot() with full data
        const plotWithDestinations = result.data[0];
        dispatch(addPlot(plotWithDestinations));

        mapLogger.log('✅ Wypis: Added plot to selection', {
          plot: plotData,
          destinationsCount: plotWithDestinations.plot_destinations.length,
        });

        dispatch(showSuccess(`Dodano działkę ${precinct}/${number} do wypisu`));

      } catch (error: any) {
        mapLogger.error('❌ Wypis: Error selecting plot', error);
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
  }, [mapRef, generateModalOpen, projectName, dispatch, configResponse, getPlotSpatialDevelopment, selectedConfigId]);

  // This component doesn't render anything - it's just a click handler
  return null;
};

export default WypisPlotSelector;
