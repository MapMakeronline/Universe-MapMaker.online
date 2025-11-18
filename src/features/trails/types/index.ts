/**
 * Trail Types - Definicje typów dla modułu tras turystycznych
 *
 * Obsługuje:
 * - Import tras z plików (KML, GeoJSON, GPX)
 * - Ręczne rysowanie tras na mapie
 * - Animację kamery wzdłuż trasy
 * - Wyświetlanie paska postępu (Timeline)
 */

import { Feature, LineString, FeatureCollection } from 'geojson';

/**
 * Typ GeoJSON trasy (LineString)
 */
export interface TrailFeature extends Feature<LineString> {
  properties: {
    name: string;
    description?: string;
    distance?: number; // metry
    duration?: number; // minuty
    elevationGain?: number; // metry
    elevationLoss?: number; // metry
    difficulty?: 'easy' | 'moderate' | 'hard';
    category?: string;
    color?: string; // hex color dla linii trasy
  };
}

/**
 * Kompletna trasa
 */
export interface Trail {
  id: string;
  feature: TrailFeature;
  metadata: {
    createdAt: string; // ISO string instead of Date object (for Redux serialization)
    source: 'upload' | 'manual' | 'import';
    fileName?: string;
    fileType?: 'kml' | 'geojson' | 'gpx';
  };
}

/**
 * Stan animacji trasy
 */
export interface TrailAnimationState {
  isPlaying: boolean;
  progress: number; // 0-1 (0% - 100%)
  speed: number; // 0.5x, 1x, 2x, 5x
  currentPoint: [number, number] | null; // [lng, lat]
  currentBearing: number; // stopnie (0-360)
  currentDistance: number; // metry od początku
  totalDistance: number; // całkowita długość trasy
}

/**
 * Konfiguracja Timeline (pasek postępu)
 */
export interface TimelineConfig {
  showPlayButton: boolean;
  showSpeedControl: boolean;
  showProgressBar: boolean;
  autoPlay: boolean;
  loop: boolean;
  smoothAnimation: boolean;
}

/**
 * Dane wysokościowe (elevation profile)
 */
export interface ElevationPoint {
  distance: number; // metry od początku
  elevation: number; // metry npm
  coordinates: [number, number]; // [lng, lat]
}

export interface ElevationProfile {
  points: ElevationPoint[];
  minElevation: number;
  maxElevation: number;
  totalGain: number;
  totalLoss: number;
}

/**
 * Opcje importu pliku
 */
export interface FileImportOptions {
  parseElevation: boolean; // czy parsować dane wysokościowe
  simplifyTolerance?: number; // uproszczenie geometrii (Douglas-Peucker)
  defaultColor?: string; // domyślny kolor trasy
}

/**
 * Rezultat parsowania pliku
 */
export interface ParsedTrailFile {
  trails: TrailFeature[];
  errors: string[];
  warnings: string[];
}
