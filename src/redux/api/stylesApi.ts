// Styles API - RTK Query Implementation
// Handles layer styling operations: get renderer, set style, classify, symbols

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ============================================================================
// TypeScript Types for Styles API
// ============================================================================

/** RGBA color array [R, G, B, A] where each value is 0-255 */
export type RGBAColor = [number, number, number, number];

/** Unit types for measurements */
export type UnitType = 0 | 1 | 2 | 3; // 0=MM, 1=MapUnit, 2=Pixels, 3=Percentage

/** Fill style types */
export type FillStyleType = 0 | 1 | 2 | 3; // 0=None, 1=Solid, 2=Dense, 3=Sparse

/** Stroke style types */
export type StrokeStyleType = 0 | 1 | 2 | 3 | 4 | 5; // 0=None, 1=Solid, 2=Dash, 3=Dot, 4=DashDot, 5=DashDotDot

/** Join style types */
export type JoinStyleType = 0 | 64 | 128; // 0=Miter, 64=Bevel, 128=Round

/** Symbol type (geometry) */
export type SymbolType = 'fill' | 'line' | 'marker';

/** Symbol layer type */
export type SymbolLayerType = 'Simple Fill' | 'Line Pattern Fill' | 'Simple Line' | 'Simple Marker';

/** Stroke width structure */
export interface StrokeWidth {
  width_value: number;
  unit: UnitType;
}

/** Offset structure */
export interface Offset {
  x: number;
  y: number;
  unit: UnitType;
}

/** Simple Fill attributes */
export interface SimpleFillAttributes {
  fill_color: RGBAColor;
  fill_style: FillStyleType;
  stroke_color: RGBAColor;
  stroke_width: StrokeWidth;
  stroke_style: StrokeStyleType;
  join_style: JoinStyleType;
  offset: Offset;
}

/** Symbol layer (e.g., Simple Fill) */
export interface SymbolLayer {
  symbol_type: SymbolLayerType;
  id: string;
  enabled: boolean;
  attributes: SimpleFillAttributes; // Can be extended for other types
}

/** Fill configuration */
export interface FillConfig {
  color: RGBAColor;
  opacity: number;
  unit: UnitType;
}

/** Main symbol structure */
export interface Symbol {
  symbol_type: SymbolType;
  fill: FillConfig;
  fills: SymbolLayer[];
}

/** Single Symbol renderer configuration */
export interface SingleSymbolRenderer {
  renderer: 'Single Symbol';
  symbols: Symbol;
}

/** Category in Categorized renderer */
export interface Category {
  symbol: Symbol;
  value: string;
  label: string;
}

/** Categorized renderer configuration */
export interface CategorizedRenderer {
  renderer: 'Categorized';
  value: string; // column name
  source_symbol?: Symbol;
  color_ramp?: null;
  categories: Category[];
}

/** Style configuration (union type) */
export type StyleConfiguration = SingleSymbolRenderer | CategorizedRenderer;

/** Response from GET /api/styles/renderer */
export interface GetRendererResponse {
  data: SingleSymbolRenderer | CategorizedRenderer;
  success: boolean;
  message: string;
}

/** Response from GET /api/styles/renderer/possible */
export interface GetPossibleRenderersResponse {
  data: string[];
  success: boolean;
  message: string;
}

/** Request body for POST /api/styles/set */
export interface SetStyleRequest {
  project: string;
  id: string; // layer_id
  style_configuration: StyleConfiguration;
}

/** Response from POST /api/styles/set */
export interface SetStyleResponse {
  data: SingleSymbolRenderer | CategorizedRenderer;
  success: boolean;
  message: string;
}

/** Request query params for GET /api/styles/symbol */
export interface GetSymbolRequest {
  symbol_type: SymbolType;
  symbol_layer_type?: SymbolLayerType;
}

/** Response from GET /api/styles/symbol */
export interface GetSymbolResponse {
  data: {
    possible: SymbolLayerType[];
    symbol_layer: SymbolLayer;
  };
  success: boolean;
  message: string;
}

/** Request body for POST /api/styles/symbol/image */
export interface GetSymbolImageRequest {
  symbols: Symbol;
}

/** Request body for POST /api/styles/symbol/random/color */
export interface GetRandomColorSymbolRequest {
  project: string;
  layer_id: string;
}

/** Response from POST /api/styles/symbol/random/color */
export interface GetRandomColorSymbolResponse {
  data: {
    symbol: Symbol;
    value: string;
    label: string;
  };
  success: boolean;
  message: string;
}

/** Request body for POST /api/styles/classify */
export interface ClassifyRequest {
  project: string;
  layer_id: string;
  column: string;
  rgb_colors?: RGBAColor[];
}

/** Response from POST /api/styles/classify */
export interface ClassifyResponse {
  data: Category[];
  success: boolean;
  message: string;
}

// ============================================================================
// Helper function to get auth token
// ============================================================================

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// ============================================================================
// Base query with auth headers
// ============================================================================

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online',
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }
    return headers;
  },
});

// ============================================================================
// Styles API Definition
// ============================================================================

export const stylesApi = createApi({
  reducerPath: 'stylesApi',
  baseQuery,
  tagTypes: ['LayerStyle'],
  endpoints: (builder) => ({

    /**
     * Get layer renderer (style)
     * GET /api/styles/renderer
     */
    getRenderer: builder.query<GetRendererResponse, { project: string; layer_id: string; renderer?: 'Single Symbol' | 'Categorized' }>({
      query: ({ project, layer_id, renderer }) => ({
        url: '/api/styles/renderer',
        params: { project, layer_id, renderer },
      }),
      providesTags: (result, error, { layer_id }) => [{ type: 'LayerStyle', id: layer_id }],
    }),

    /**
     * Get possible renderers
     * GET /api/styles/renderer/possible
     */
    getPossibleRenderers: builder.query<GetPossibleRenderersResponse, void>({
      query: () => '/api/styles/renderer/possible',
    }),

    /**
     * Set layer style
     * POST /api/styles/set
     */
    setStyle: builder.mutation<SetStyleResponse, SetStyleRequest>({
      query: (data) => ({
        url: '/api/styles/set',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LayerStyle', id }],
    }),

    /**
     * Get base symbol for type
     * GET /api/styles/symbol
     */
    getSymbol: builder.query<GetSymbolResponse, GetSymbolRequest>({
      query: ({ symbol_type, symbol_layer_type }) => ({
        url: '/api/styles/symbol',
        params: { symbol_type, symbol_layer_type },
      }),
    }),

    /**
     * Generate symbol thumbnail
     * POST /api/styles/symbol/image
     * Returns PNG image blob
     */
    getSymbolImage: builder.mutation<Blob, GetSymbolImageRequest>({
      query: (data) => ({
        url: '/api/styles/symbol/image',
        method: 'POST',
        body: data,
        responseHandler: (response) => response.blob(),
      }),
    }),

    /**
     * Generate symbol with random color
     * POST /api/styles/symbol/random/color
     */
    getRandomColorSymbol: builder.mutation<GetRandomColorSymbolResponse, GetRandomColorSymbolRequest>({
      query: (data) => ({
        url: '/api/styles/symbol/random/color',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Classify layer by column
     * POST /api/styles/classify
     */
    classify: builder.mutation<ClassifyResponse, ClassifyRequest>({
      query: (data) => ({
        url: '/api/styles/classify',
        method: 'POST',
        body: data,
      }),
    }),

  }),
});

// Export hooks
export const {
  useGetRendererQuery,
  useGetPossibleRenderersQuery,
  useSetStyleMutation,
  useGetSymbolQuery,
  useGetSymbolImageMutation,
  useGetRandomColorSymbolMutation,
  useClassifyMutation,
} = stylesApi;
