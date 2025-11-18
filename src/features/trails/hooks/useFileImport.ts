/**
 * useFileImport - React Hook for importing trail files (Frontend only)
 *
 * Handles:
 * - File type detection (KML/GeoJSON)
 * - Parsing with appropriate parser
 * - Distance/duration calculation
 * - Loading states
 * - Error handling
 *
 * All operations run in browser
 */

import { useState, useCallback } from 'react';
import { parseKML } from '../utils/kmlParser';
import { parseGeoJSON } from '../utils/geojsonParser';
import {
  calculateDistance,
  calculateDuration,
  calculateTrailStats,
} from '../utils/trailCalculations';
import type { ParsedTrailFile, TrailFeature } from '../types';

interface UseFileImportResult {
  importFile: (file: File) => Promise<ParsedTrailFile | null>;
  isLoading: boolean;
  error: string | null;
  result: ParsedTrailFile | null;
  clearError: () => void;
  clearResult: () => void;
}

/**
 * Hook for importing trail files
 *
 * @returns Import function, loading state, error, and result
 *
 * @example
 * const { importFile, isLoading, error, result } = useFileImport();
 *
 * const handleFileChange = async (e) => {
 *   const file = e.target.files[0];
 *   const parsed = await importFile(file);
 *   if (parsed && parsed.trails.length > 0) {
 *     // Success - use parsed.trails[0]
 *   }
 * };
 */
export function useFileImport(): UseFileImportResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedTrailFile | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const importFile = useCallback(async (file: File): Promise<ParsedTrailFile | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Detect file type
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (!ext) {
        throw new Error('Nie można określić typu pliku');
      }

      // 2. Parse file based on type
      let parsed: ParsedTrailFile;

      if (ext === 'kml') {
        console.log('📁 Parsing KML file:', file.name);
        parsed = await parseKML(file);
      } else if (ext === 'geojson' || ext === 'json') {
        console.log('📁 Parsing GeoJSON file:', file.name);
        parsed = await parseGeoJSON(file);
      } else {
        throw new Error(
          `Nieobsługiwany format pliku: .${ext}\n\nObsługiwane formaty:\n- .kml (Google My Maps, Garmin)\n- .geojson lub .json (GeoJSON)`
        );
      }

      // 3. Check for parsing errors
      if (parsed.errors.length > 0) {
        const errorMessage = parsed.errors.join('\n');
        setError(errorMessage);
        setResult(parsed);
        return parsed;
      }

      // 4. Check if any trails were found
      if (parsed.trails.length === 0) {
        throw new Error('Nie znaleziono żadnych tras w pliku');
      }

      // 5. Calculate distance and duration for each trail
      parsed.trails.forEach((trail: TrailFeature) => {
        const distance = calculateDistance(trail);
        const duration = calculateDuration(
          distance,
          trail.properties.elevationGain
        );

        // Update trail properties
        trail.properties.distance = distance;
        trail.properties.duration = duration;

        console.log('✅ Trail parsed:', {
          name: trail.properties.name,
          distance: `${(distance / 1000).toFixed(2)} km`,
          duration: `${duration} min`,
          points: trail.geometry.coordinates.length,
        });
      });

      // 6. Calculate detailed stats for first trail (active trail)
      if (parsed.trails.length > 0) {
        const stats = calculateTrailStats(parsed.trails[0]);
        console.log('📊 Trail statistics:', stats);
      }

      // Success
      setResult(parsed);
      return parsed;
    } catch (err: any) {
      const errorMessage = err.message || 'Nieznany błąd podczas importu pliku';
      console.error('❌ File import error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    importFile,
    isLoading,
    error,
    result,
    clearError,
    clearResult,
  };
}

/**
 * Validate file before import
 *
 * @param file - File to validate
 * @returns Error message or null if valid
 */
export function validateTrailFile(file: File): string | null {
  // Check file size (max 10MB)
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Plik jest za duży (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksymalny rozmiar: ${maxSizeMB} MB`;
  }

  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['kml', 'geojson', 'json'];
  if (!ext || !allowedExtensions.includes(ext)) {
    return `Nieobsługiwany format pliku: .${ext}\n\nObsługiwane formaty: .kml, .geojson, .json`;
  }

  return null;
}
