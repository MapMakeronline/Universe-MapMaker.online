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

/**
 * WypisPlotSelector - Component for selecting plots (parcels) from map for wypis generation
 *
 * Workflow:
 * 1. User clicks "Wypis i Wyrys" FAB → Generate modal opens
 * 2. User selects wypis configuration from dropdown
 * 3. User clicks on map → This component captures click coordinates
 * 4. Query backend: POST /api/projects/wypis/precinct_and_number (identify plot)
 * 5. Query backend: POST /api/projects/wypis/plotspatialdevelopment (get planning zones with % coverage)
 * 6. Add plot with destinations to Redux
 * 7. WypisGenerateDialog displays selected plots with checkboxes for planning zones
 * 8. User selects which zones/documents to include (all selected by default)
 * 9. User clicks "Generuj" → POST /api/projects/wypis/create (generate PDF)
 *
 * Features:
 * - Active only when generate modal is open AND config is selected
 * - Visual feedback on click (cursor change, toast notifications)
 * - Automatic deduplication (same plot can't be added twice)
 * - Shows planning zone coverage percentage (e.g., "SN (100.0%)")
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

        // 2. Query backend for precinct and plot number from map coordinates
        // Endpoint: POST /api/projects/wypis/precinct_and_number
        const lngLat = [e.lngLat.lng, e.lngLat.lat];
        mapLogger.log('🗺️ Wypis: Querying backend for precinct and number', {
          point: lngLat,
          project: projectName,
          config_id: selectedConfigId,
        });

        dispatch(showSuccess('Identyfikowanie działki...'));

        const precinctResult = await getPrecinctAndNumber({
          project: projectName,
          config_id: selectedConfigId,
          point: [lngLat[0], lngLat[1]], // [x, y] coordinates
        }).unwrap();

        if (!precinctResult.success || !precinctResult.data) {
          mapLogger.error('❌ Wypis: Failed to get precinct and number', precinctResult);
          dispatch(showError('Nie znaleziono działki w tym miejscu. Kliknij na działkę.'));
          return;
        }

        const { precinct, number } = precinctResult.data;
        mapLogger.log('✅ Wypis: Got precinct and number from backend', { precinct, number });

        // 3. Query spatial development endpoint to get planning zones with coverage %
        // Endpoint: POST /api/projects/wypis/plotspatialdevelopment
        dispatch(showSuccess(`Pobieranie informacji o przeznaczeniu działki ${precinct}/${number}...`));

        const spatialResult = await getPlotSpatialDevelopment({
          project: projectName,
          config_id: selectedConfigId,
          plot: [{ precinct: String(precinct), number: String(number) }],
        }).unwrap();

        if (!spatialResult.success || !spatialResult.data || spatialResult.data.length === 0) {
          mapLogger.error('❌ Wypis: Failed to get spatial development', spatialResult);
          dispatch(showError(`Nie znaleziono informacji o przeznaczeniu działki ${precinct}/${number}`));
          return;
        }

        // 4. Add plot with destinations to Redux
        const plotWithDestinations = spatialResult.data[0];
        dispatch(addPlot(plotWithDestinations));

        mapLogger.log('✅ Wypis: Added plot to selection', {
          plot: plotWithDestinations.plot,
          destinationsCount: plotWithDestinations.plot_destinations?.length || 0,
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
  }, [mapRef, generateModalOpen, projectName, dispatch, configResponse, getPrecinctAndNumber, getPlotSpatialDevelopment, selectedConfigId]);

  // This component doesn't render anything - it's just a click handler
  return null;
};

export default WypisPlotSelector;
