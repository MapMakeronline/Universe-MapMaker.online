/**
 * Mapbox Search & Geocoding utilities
 * Uses Mapbox Geocoding API v5 for searching places, addresses, and POI
 */

// Use the same token as configured in .env.local
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ';

export interface SearchResult {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    foursquare?: string;
    landmark?: boolean;
    address?: string;
    category?: string;
  };
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface SearchOptions {
  proximity?: [number, number]; // [longitude, latitude]
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  country?: string[]; // ISO 3166 alpha 2 country codes
  language?: string; // IETF language tag
  limit?: number; // Max results (1-10)
  types?: string[]; // Feature types to filter
}

/**
 * Search for places, addresses, and POI using Mapbox Geocoding API
 */
export async function searchPlaces(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    proximity,
    bbox,
    country = ['pl'],
    language = 'pl',
    limit = 5,
    types,
  } = options;

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    language,
    limit: limit.toString(),
  });

  if (proximity) {
    params.append('proximity', proximity.join(','));
  }

  if (bbox) {
    params.append('bbox', bbox.join(','));
  }

  if (country.length > 0) {
    params.append('country', country.join(','));
  }

  if (types && types.length > 0) {
    params.append('types', types.join(','));
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mapbox Geocoding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.features || [];
}

/**
 * Reverse geocode - convert coordinates to address
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number,
  options: Omit<SearchOptions, 'proximity'> = {}
): Promise<SearchResult[]> {
  const {
    country = ['pl'],
    language = 'pl',
    limit = 1,
    types,
  } = options;

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    language,
    limit: limit.toString(),
  });

  if (country.length > 0) {
    params.append('country', country.join(','));
  }

  if (types && types.length > 0) {
    params.append('types', types.join(','));
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mapbox Reverse Geocoding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.features || [];
}

/**
 * Search for places by category (POI types)
 * Common categories: restaurant, cafe, hotel, museum, park, etc.
 */
export async function searchByCategory(
  category: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  // For category search, we use the search with types filter
  return searchPlaces(category, {
    ...options,
    types: ['poi'], // Points of Interest
  });
}

/**
 * Get popular categories for autocomplete
 */
export const POPULAR_CATEGORIES = [
  { id: 'restaurant', label: 'Restauracje', icon: '🍽️' },
  { id: 'cafe', label: 'Kawiarnie', icon: '☕' },
  { id: 'hotel', label: 'Hotele', icon: '🏨' },
  { id: 'museum', label: 'Muzea', icon: '🏛️' },
  { id: 'park', label: 'Parki', icon: '🌳' },
  { id: 'hospital', label: 'Szpitale', icon: '🏥' },
  { id: 'school', label: 'Szkoły', icon: '🏫' },
  { id: 'bank', label: 'Banki', icon: '🏦' },
  { id: 'pharmacy', label: 'Apteki', icon: '💊' },
  { id: 'gas_station', label: 'Stacje benzynowe', icon: '⛽' },
  { id: 'supermarket', label: 'Supermarkety', icon: '🛒' },
  { id: 'shopping_mall', label: 'Centra handlowe', icon: '🛍️' },
] as const;

/**
 * Place types available in Mapbox Geocoding API
 */
export const PLACE_TYPES = {
  COUNTRY: 'country',
  REGION: 'region',
  POSTCODE: 'postcode',
  DISTRICT: 'district',
  PLACE: 'place',
  LOCALITY: 'locality',
  NEIGHBORHOOD: 'neighborhood',
  ADDRESS: 'address',
  POI: 'poi',
} as const;
