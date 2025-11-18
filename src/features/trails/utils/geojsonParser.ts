/**
 * GeoJSON Parser - Validate and extract trails from GeoJSON (Frontend only)
 *
 * Supports:
 * - Standard GeoJSON FeatureCollection
 * - Single Feature objects
 * - LineString geometry (routes/tracks)
 *
 * Validation runs in browser (JSON.parse)
 */

import { FeatureCollection, Feature, LineString, Geometry } from 'geojson';
import type { TrailFeature, ParsedTrailFile } from '../types';

/**
 * Parse GeoJSON file to TrailFeature array
 *
 * @param file - GeoJSON file from user upload
 * @returns Parsed trails with errors/warnings
 */
export async function parseGeoJSON(file: File): Promise<ParsedTrailFile> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trails: TrailFeature[] = [];

  try {
    // 1. Read file as text
    const text = await file.text();

    // 2. Parse JSON
    let geojson: any;
    try {
      geojson = JSON.parse(text);
    } catch (jsonError) {
      errors.push('Plik nie jest poprawnym plikiem JSON');
      return { trails: [], errors, warnings };
    }

    // 3. Validate GeoJSON structure
    if (!geojson || typeof geojson !== 'object') {
      errors.push('Nieprawidłowa struktura GeoJSON');
      return { trails: [], errors, warnings };
    }

    // 4. Handle different GeoJSON formats
    let features: Feature<Geometry>[] = [];

    if (geojson.type === 'FeatureCollection') {
      // Standard FeatureCollection
      if (!Array.isArray(geojson.features)) {
        errors.push('FeatureCollection nie zawiera tablicy features');
        return { trails: [], errors, warnings };
      }
      features = geojson.features;
    } else if (geojson.type === 'Feature') {
      // Single Feature
      features = [geojson];
    } else if (geojson.type === 'LineString') {
      // Direct LineString geometry (wrap in Feature)
      features = [
        {
          type: 'Feature',
          geometry: geojson,
          properties: {},
        },
      ];
    } else {
      errors.push(
        `Nieobsługiwany typ GeoJSON: ${geojson.type}. Oczekiwano FeatureCollection, Feature lub LineString.`
      );
      return { trails: [], errors, warnings };
    }

    if (features.length === 0) {
      errors.push('Plik GeoJSON nie zawiera żadnych obiektów');
      return { trails: [], errors, warnings };
    }

    // 5. Extract LineString features (trails)
    const lineStrings = features.filter(
      (feature): feature is Feature<LineString> =>
        feature.geometry && feature.geometry.type === 'LineString'
    );

    if (lineStrings.length === 0) {
      errors.push(
        'Plik GeoJSON nie zawiera tras (LineString). Sprawdź czy to właściwy plik z trasą turystyczną.'
      );

      // Info about found geometries
      const geometryTypes = features
        .map((f) => f.geometry?.type)
        .filter(Boolean);
      if (geometryTypes.length > 0) {
        warnings.push(
          `Znaleziono geometrie: ${Array.from(new Set(geometryTypes)).join(', ')}`
        );
      }

      return { trails: [], errors, warnings };
    }

    // 6. Convert to TrailFeature format
    lineStrings.forEach((feature, index) => {
      const coords = feature.geometry.coordinates;

      // Validate coordinates
      if (!coords || coords.length < 2) {
        warnings.push(
          `Trasa ${index + 1}: Za mało punktów (minimum 2 wymagane)`
        );
        return;
      }

      // Validate coordinate format [lng, lat]
      const invalidCoords = coords.some(
        (coord) =>
          !Array.isArray(coord) ||
          coord.length < 2 ||
          typeof coord[0] !== 'number' ||
          typeof coord[1] !== 'number' ||
          Math.abs(coord[0]) > 180 || // longitude range
          Math.abs(coord[1]) > 90 // latitude range
      );

      if (invalidCoords) {
        warnings.push(
          `Trasa ${index + 1}: Nieprawidłowe współrzędne (lng: -180 do 180, lat: -90 do 90)`
        );
        return;
      }

      // Extract metadata from GeoJSON properties
      const props = feature.properties || {};
      const name = props.name || props.title || `Trasa ${index + 1}`;
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
          // Distance/duration will be calculated later
          distance: props.distance || undefined,
          duration: props.duration || undefined,
          elevationGain: props.elevationGain || undefined,
          elevationLoss: props.elevationLoss || undefined,
          difficulty: props.difficulty || undefined,
          category: props.category || 'hiking',
          color: props.color || props.stroke || '#FF5722', // Default coral/red
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
    errors.push(`Błąd podczas parsowania GeoJSON: ${error.message}`);
    return { trails: [], errors, warnings };
  }
}

/**
 * Validate GeoJSON file before parsing
 *
 * @param file - File to validate
 * @returns true if file is valid GeoJSON
 */
export function isValidGeoJSONFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'geojson' || ext === 'json';
}

/**
 * Quick validation of GeoJSON structure (without full parsing)
 *
 * @param text - GeoJSON text content
 * @returns true if structure looks valid
 */
export function isValidGeoJSONStructure(text: string): boolean {
  try {
    const json = JSON.parse(text);
    return (
      json &&
      typeof json === 'object' &&
      (json.type === 'FeatureCollection' ||
        json.type === 'Feature' ||
        json.type === 'LineString')
    );
  } catch {
    return false;
  }
}
