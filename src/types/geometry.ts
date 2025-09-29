import { Feature, Geometry, GeoJsonProperties } from 'geojson';

export interface DrawState {
  mode: 'simple_select' | 'draw_point' | 'draw_line_string' | 'draw_polygon' | 'draw_rectangle' | 'draw_circle' | 'direct_select';
  isActive: boolean;
  features: Feature<Geometry, GeoJsonProperties>[];
  selectedFeatureId?: string;
}

export interface MeasurementState {
  isDistanceMode: boolean;
  isAreaMode: boolean;
  measurements: Measurement[];
  activePoints: [number, number][];
}

export interface Measurement {
  id: string;
  type: 'distance' | 'area';
  coordinates: [number, number][];
  value: number;
  unit: string;
  label: string;
}

export interface DrawToolConfig {
  mode: string;
  icon: string;
  label: string;
  tooltip: string;
}

export const DrawTools: DrawToolConfig[] = [
  {
    mode: 'draw_point',
    icon: 'LocationOn',
    label: 'Punkt',
    tooltip: 'Dodaj punkt na mapie'
  },
  {
    mode: 'draw_line_string',
    icon: 'Timeline',
    label: 'Linia',
    tooltip: 'Narysuj linię'
  },
  {
    mode: 'draw_polygon',
    icon: 'Pentagon',
    label: 'Polygon',
    tooltip: 'Narysuj polygon'
  },
  {
    mode: 'draw_rectangle',
    icon: 'CropDin',
    label: 'Prostokąt',
    tooltip: 'Narysuj prostokąt'
  },
];