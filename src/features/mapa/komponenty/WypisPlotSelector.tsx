'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectGenerateModalOpen } from '@/redux/slices/wypisSlice';
import { addPlot } from '@/redux/slices/wypisSlice';
import { useGetPlotSpatialDevelopmentMutation } from '@/backend/wypis';
import { useIdentifyFeatureMutation } from '@/backend/layers';
import { mapLogger } from '@/tools/logger';
import type { WypisPlot } from '@/backend/types';

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

  // RTK Query mutations
  const [identifyFeature] = useIdentifyFeatureMutation();
  const [getPlotSpatialDevelopment, { isLoading: isLoadingSpatialData }] =
    useGetPlotSpatialDevelopmentMutation();

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
        // TODO: Implement feature identification
        // Need to:
        // 1. Query QGIS OWS GetFeatureInfo at click point
        // 2. Find parcel layer (from wypis configuration)
        // 3. Extract precinct (obręb) and number from properties
        // 4. Query spatial development endpoint
        // 5. Dispatch addPlot() with full data

        // Placeholder for now - will implement in next step
        mapLogger.warn('⚠️ Wypis: Plot selection not yet implemented');

      } catch (error) {
        mapLogger.error('❌ Wypis: Error selecting plot', error);
      }
    };

    // Add click listener
    map.on('click', handleMapClick);

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, generateModalOpen, projectName, dispatch]);

  // This component doesn't render anything - it's just a click handler
  return null;
};

export default WypisPlotSelector;
