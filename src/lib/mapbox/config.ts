import { MapStyles } from '@/types/map';

// Token will be fetched from API at runtime
export let MAPBOX_TOKEN = '';

// Function to fetch token from API
export const fetchMapboxToken = async (): Promise<string> => {
  try {
    const response = await fetch('/api/token');
    const data = await response.json();

    if (!response.ok || !data.token) {
      throw new Error('Failed to get Mapbox token');
    }

    MAPBOX_TOKEN = data.token;
    return data.token;
  } catch (error) {
    console.error('Error fetching Mapbox token:', error);
    throw error;
  }
};

export const DEFAULT_VIEW_STATE = {
  longitude: 21.0122, // Warszawa
  latitude: 52.2297,
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

export const MAP_STYLES: MapStyles = {
  streets: {
    name: 'Ulice',
    style: 'mapbox://styles/mapbox/streets-v12',
  },
  satellite: {
    name: 'Satelita',
    style: 'mapbox://styles/mapbox/satellite-v9',
  },
  outdoors: {
    name: 'Outdoor',
    style: 'mapbox://styles/mapbox/outdoors-v12',
  },
  light: {
    name: 'Jasny',
    style: 'mapbox://styles/mapbox/light-v11',
  },
  dark: {
    name: 'Ciemny',
    style: 'mapbox://styles/mapbox/dark-v11',
  },
};

export const MAP_CONFIG = {
  antialias: true,
  attributionControl: false,
  doubleClickZoom: false,
  dragRotate: true,
  dragPan: true,
  keyboard: true,
  scrollZoom: true,
  touchZoom: true,
  touchRotate: true,
};