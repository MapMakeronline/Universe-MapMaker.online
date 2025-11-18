/**
 * KML Parser - Convert KML files to GeoJSON (Frontend only)
 *
 * Supports:
 * - Google My Maps exports (.kml)
 * - GPS device exports (.kml)
 * - LineString geometry (routes/tracks)
 *
 * Uses @mapbox/togeojson for conversion (runs in browser)
 */

import toGeoJSON from '@mapbox/togeojson';
import { FeatureCollection, Feature, LineString } from 'geojson';
import type { TrailFeature, ParsedTrailFile } from '../types';

/**
 * Parse KML file to TrailFeature array
 *
 * @param file - KML file from user upload
 * @returns Parsed trails with errors/warnings
 */
export async function parseKML(file: File): Promise<ParsedTrailFile> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trails: TrailFeature[] = [];

  try {
    // 1. Read file as text
    const text = await file.text();

    // 2. Parse XML using browser DOMParser
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    // Check for XML parsing errors
    const parserError = xml.querySelector('parsererror');
    if (parserError) {
      errors.push('Plik KML jest uszkodzony (błąd parsowania XML)');
      return { trails: [], errors, warnings };
    }

    // 3. Convert KML to GeoJSON using @mapbox/togeojson
    const geojson = toGeoJSON.kml(xml) as FeatureCollection;

    if (!geojson || !geojson.features || geojson.features.length === 0) {
      errors.push('Plik KML nie zawiera żadnych obiektów geograficznych');
      return { trails: [], errors, warnings };
    }

    // 4. Extract LineString features (trails)
    const lineStrings = geojson.features.filter(
      (feature): feature is Feature<LineString> =>
        feature.geometry.type === 'LineString'
    );

    if (lineStrings.length === 0) {
      errors.push(
        'Plik KML nie zawiera tras (LineString). Sprawdź czy to właściwy plik z trasą turystyczną.'
      );
      return { trails: [], errors, warnings };
    }

    // 5. Convert to TrailFeature format
    lineStrings.forEach((feature, index) => {
      const coords = feature.geometry.coordinates;

      // Validate coordinates
      if (!coords || coords.length < 2) {
        warnings.push(
          `Trasa ${index + 1}: Za mało punktów (minimum 2 wymagane)`
        );
        return;
      }

      // Extract metadata from KML properties
      const props = feature.properties || {};
      const name =
        props.name ||
        props.title ||
        props.description ||
        `Trasa ${index + 1}`;
      const description = props.description || props.desc || '';

      // Create TrailFeature
      const trail: TrailFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords as [number, number][],
        },
        properties: {
          name,
          description,
          // Distance/duration will be calculated later by trailCalculations.ts
          distance: undefined,
          duration: undefined,
          elevationGain: undefined,
          elevationLoss: undefined,
          difficulty: undefined,
          category: props.category || 'hiking',
          color: props.stroke || props.color || '#FF5722', // Default coral/red
        },
      };

      trails.push(trail);
    });

    // Success
    if (trails.length > 1) {
      warnings.push(
        `Znaleziono ${trails.length} tras. Zostanie załadowana pierwsza trasa: "${trails[0].properties.name}"`
      );
    }

    return { trails, errors, warnings };
  } catch (error: any) {
    errors.push(`Błąd podczas parsowania KML: ${error.message}`);
    return { trails: [], errors, warnings };
  }
}

/**
 * Validate KML file before parsing
 *
 * @param file - File to validate
 * @returns true if file is valid KML
 */
export function isValidKMLFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'kml';
}

/**
 * Extract metadata from KML (without full parsing)
 * Useful for quick preview before parsing
 *
 * @param file - KML file
 * @returns Basic metadata (name, feature count)
 */
export async function extractKMLMetadata(file: File): Promise<{
  name: string;
  featureCount: number;
  hasLineStrings: boolean;
}> {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    // Extract document name
    const nameEl = xml.querySelector('Document > name');
    const name = nameEl?.textContent || file.name.replace('.kml', '');

    // Count Placemarks (features)
    const placemarks = xml.querySelectorAll('Placemark');
    const featureCount = placemarks.length;

    // Check if any LineString exists
    const lineStrings = xml.querySelectorAll('LineString');
    const hasLineStrings = lineStrings.length > 0;

    return { name, featureCount, hasLineStrings };
  } catch (error) {
    return {
      name: file.name.replace('.kml', ''),
      featureCount: 0,
      hasLineStrings: false,
    };
  }
}
