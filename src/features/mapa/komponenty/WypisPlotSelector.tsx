'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectGenerateModalOpen, selectSelectedConfigId } from '@/redux/slices/wypisSlice';
import { addPlot } from '@/redux/slices/wypisSlice';
import { useGetPlotSpatialDevelopmentMutation, useGetWypisConfigurationQuery } from '@/backend/wypis';
import { getQGISFeatureInfoMultiLayer } from '@/lib/qgis/getFeatureInfo';
import { mapLogger } from '@/tools/logger';
import { showError, showSuccess } from '@/redux/slices/snackbarSlice';

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
  const { data: configResponse } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: selectedConfigId || undefined },
    { skip: !projectName || !selectedConfigId }
  );

  useEffect(() => {
    if (!mapRef || !generateModalOpen) return;

    const map = mapRef.getMap();
    if (!map) return;

    // Change cursor to crosshair when selection mode is active
    map.getCanvas().style.cursor = 'crosshair';

    const handleMapClick = async (e: any) => {
      mapLogger.log('🗺️ Wypis: Plot selection click', {
        lngLat: [e.lngLat.lng, e.lngLat.lat],
      });

      try {
        // 1. Get parcel layer name from configuration
        let parcelLayerName: string | undefined;

        if ('data' in configResponse && configResponse.data?.data) {
          // Single config response
          const config = configResponse.data.data;
          parcelLayerName = config.parcel_layer_name;
          mapLogger.log('🗺️ Wypis: Using parcel layer from config', { parcelLayerName });
        }

        if (!parcelLayerName) {
          dispatch(showError({
            message: 'Brak warstwy działek w konfiguracji. Wybierz konfigurację.',
            severity: 'error'
          }));
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
          dispatch(showError({
            message: 'Nie znaleziono działki w tym miejscu. Kliknij na działkę.',
            severity: 'warning'
          }));
          return;
        }

        const feature = qgisResult.features[0];
        mapLogger.log('✅ Wypis: Found parcel feature', {
          id: feature.id,
          properties: feature.properties,
        });

        // 3. Extract precinct (obręb) and number from properties
        // Common property names: "obreb", "numer", "nr_dzialki", etc.
        const properties = feature.properties;

        // Try different property name variations
        const precinct =
          properties.obreb ||
          properties.obręb ||
          properties.precinct ||
          properties.OBREB ||
          properties.OBRĘB ||
          '';

        const number =
          properties.numer ||
          properties.nr_dzialki ||
          properties.number ||
          properties.NUMER ||
          properties.NR_DZIALKI ||
          '';

        if (!precinct || !number) {
          mapLogger.error('❌ Wypis: Missing precinct or number in properties', { properties });
          dispatch(showError({
            message: `Nieprawidłowe dane działki. Brak obrębu lub numeru. Właściwości: ${Object.keys(properties).join(', ')}`,
            severity: 'error'
          }));
          return;
        }

        const plotData = {
          precinct: String(precinct),
          number: String(number),
        };

        mapLogger.log('✅ Wypis: Extracted plot data', plotData);

        // 4. Query spatial development endpoint
        dispatch(showSuccess({
          message: `Pobieranie informacji o przeznaczeniu działki ${precinct}/${number}...`,
          severity: 'info'
        }));

        const result = await getPlotSpatialDevelopment({
          project: projectName,
          plot: plotData,
        }).unwrap();

        if (!result.success || !result.data || result.data.length === 0) {
          dispatch(showError({
            message: `Nie znaleziono informacji o przeznaczeniu działki ${precinct}/${number}`,
            severity: 'warning'
          }));
          return;
        }

        // 5. Dispatch addPlot() with full data
        const plotWithDestinations = result.data[0];
        dispatch(addPlot(plotWithDestinations));

        mapLogger.log('✅ Wypis: Added plot to selection', {
          plot: plotData,
          destinationsCount: plotWithDestinations.plot_destinations.length,
        });

        dispatch(showSuccess({
          message: `Dodano działkę ${precinct}/${number} do wypisu`,
          severity: 'success'
        }));

      } catch (error: any) {
        mapLogger.error('❌ Wypis: Error selecting plot', error);
        dispatch(showError({
          message: error?.data?.message || 'Błąd podczas pobierania informacji o działce',
          severity: 'error'
        }));
      }
    };

    // Add click listener
    map.on('click', handleMapClick);

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, generateModalOpen, projectName, dispatch, configResponse, getPlotSpatialDevelopment]);

  // This component doesn't render anything - it's just a click handler
  return null;
};

export default WypisPlotSelector;
