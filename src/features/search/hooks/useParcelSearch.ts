/**
 * useParcelSearch Hook - Business Logic for Parcel Search
 *
 * Handles:
 * - Loading layer attributes (client-side buffering)
 * - Filtering precincts and plot numbers
 * - Searching by feature IDs
 * - Coordinate transformations
 *
 * Documentation: SEARCH_DOCUMENTATION.md (lines 21-79)
 */

import { useState, useEffect, useMemo } from 'react';
import { useLazyGetLayerAttributesQuery, useSearchPlotByIdsMutation } from '@/backend/plot';
import { getUniqueValues } from '../utils/mapUtils';

interface UseParcelSearchParams {
  projectName: string | null;
  layerId: string;
  precinctColumn: string;
  plotNumberColumn: string;
}

interface UseParcelSearchReturn {
  // Data
  allAttributes: any[];
  precinctOptions: string[];
  plotNumberOptions: string[];

  // Loading states
  isLoading: boolean;
  isSearching: boolean;

  // Actions
  loadAllData: () => Promise<void>;
  searchPlot: (precinct: string, plotNumber: string) => Promise<any>;

  // Errors
  error: any;
}

/**
 * Custom hook for parcel search
 * Implements client-side buffering and filtering strategy
 */
export const useParcelSearch = ({
  projectName,
  layerId,
  precinctColumn,
  plotNumberColumn,
}: UseParcelSearchParams): UseParcelSearchReturn => {
  // State
  const [allAttributes, setAllAttributes] = useState<any[]>([]);
  const [precinctOptions, setPrecinctOptions] = useState<string[]>([]);
  const [plotNumberOptions, setPlotNumberOptions] = useState<string[]>([]);

  // RTK Query
  const [fetchAttributes, { isLoading, error }] = useLazyGetLayerAttributesQuery();
  const [searchPlotByIds, { isLoading: isSearching }] = useSearchPlotByIdsMutation();

  /**
   * Load all layer attributes (one-time fetch)
   * Buffers data in state for client-side filtering
   */
  const loadAllData = async () => {
    if (!projectName || !layerId) return;

    try {
      const response = await fetchAttributes({
        project: projectName,
        layer_id: layerId,
      }).unwrap();

      const attributes = response.data?.Attributes || [];
      setAllAttributes(attributes);

      // Extract unique precincts
      const precincts = attributes
        .map(attr => attr[precinctColumn])
        .filter(value => value !== null && value !== undefined);

      const uniquePrecincts = getUniqueValues(precincts);
      setPrecinctOptions(uniquePrecincts);

      // Extract all plot numbers (unfiltered)
      const plotNumbers = attributes
        .map(attr => attr[plotNumberColumn])
        .filter(value => value !== null && value !== undefined);

      const uniquePlotNumbers = getUniqueValues(plotNumbers);
      setPlotNumberOptions(uniquePlotNumbers);
    } catch (error) {
      console.error('Failed to load layer attributes:', error);
    }
  };

  /**
   * Update plot numbers based on selected precinct
   * Filters allAttributes client-side (fast!)
   */
  const updatePlotNumbersForPrecinct = (precinct: string) => {
    const plotNumbers = allAttributes
      .filter(attr => attr[precinctColumn] === precinct)
      .map(attr => attr[plotNumberColumn]);

    const uniquePlots = getUniqueValues(plotNumbers);
    setPlotNumberOptions(uniquePlots);
  };

  /**
   * Search for plot by precinct and/or plot number
   * Returns GeoJSON with bbox and features
   */
  const searchPlot = async (precinct: string, plotNumber: string) => {
    if (!projectName || !layerId) {
      throw new Error('Missing project name or layer ID');
    }

    // Find matching features in buffered data
    const matchingFeatures = allAttributes.filter(attr => {
      const precinctMatch = !precinct || attr[precinctColumn] === precinct;
      const plotNumberMatch = !plotNumber || attr[plotNumberColumn] === plotNumber;
      return precinctMatch && plotNumberMatch;
    });

    if (matchingFeatures.length === 0) {
      throw new Error('No matching plots found');
    }

    // Extract feature IDs (ogc_fid, id, or fid)
    const featureIds = matchingFeatures.map(attr =>
      attr.ogc_fid || attr.id || attr.fid
    ).filter(id => id != null);

    if (featureIds.length === 0) {
      throw new Error('No valid feature IDs found');
    }

    // Fetch geometries from backend
    const result = await searchPlotByIds({
      project: projectName,
      layer_id: layerId,
      label: featureIds,
    }).unwrap();

    return result;
  };

  return {
    // Data
    allAttributes,
    precinctOptions,
    plotNumberOptions,

    // Loading states
    isLoading,
    isSearching,

    // Actions
    loadAllData,
    searchPlot,

    // Errors
    error,
  };
};
