import {
  lineString,
  polygon,
  area,
  featureCollection,
  point,
  bbox
} from '@turf/turf';
import { default as length } from '@turf/length';
import { Measurement } from '@/types-app/geometry';

export function calculateDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;

  const line = lineString(coordinates);
  return length(line, { units: 'kilometers' });
}

export function calculateArea(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;

  // Zamknij polygon jeśli nie jest zamknięty
  const closedCoordinates = [...coordinates];
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedCoordinates.push(first);
  }

  const polygonFeature = polygon([closedCoordinates]);
  return area(polygonFeature) / 1000000; // Konwersja na km²
}

export function formatDistance(distance: number): { value: number; unit: string; label: string } {
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return {
      value: meters,
      unit: 'm',
      label: `${meters} m`
    };
  } else {
    const kilometers = Math.round(distance * 100) / 100;
    return {
      value: kilometers,
      unit: 'km',
      label: `${kilometers} km`
    };
  }
}

export function formatArea(area: number): { value: number; unit: string; label: string } {
  if (area < 1) {
    const hectares = Math.round(area * 100 * 100) / 100;
    return {
      value: hectares,
      unit: 'ha',
      label: `${hectares} ha`
    };
  } else {
    const kilometers = Math.round(area * 100) / 100;
    return {
      value: kilometers,
      unit: 'km²',
      label: `${kilometers} km²`
    };
  }
}

export function createDistanceMeasurement(
  id: string,
  coordinates: [number, number][]
): Measurement {
  const distance = calculateDistance(coordinates);
  const formatted = formatDistance(distance);

  return {
    id,
    type: 'distance',
    coordinates,
    value: formatted.value,
    unit: formatted.unit,
    label: formatted.label,
  };
}

export function createAreaMeasurement(
  id: string,
  coordinates: [number, number][]
): Measurement {
  const area = calculateArea(coordinates);
  const formatted = formatArea(area);

  return {
    id,
    type: 'area',
    coordinates,
    value: formatted.value,
    unit: formatted.unit,
    label: formatted.label,
  };
}

export function getBounds(coordinates: [number, number][]): [[number, number], [number, number]] {
  if (coordinates.length === 0) {
    return [[0, 0], [0, 0]];
  }

  const points = featureCollection(coordinates.map(coord => point(coord)));
  const bboxCoords = bbox(points);

  return [
    [bboxCoords[0], bboxCoords[1]], // southwest
    [bboxCoords[2], bboxCoords[3]]  // northeast
  ];
}