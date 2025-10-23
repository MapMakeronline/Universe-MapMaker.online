/**
 * Styles Module - RTK Query API
 *
 * Endpoints for layer styling and symbol management:
 * - getLayerRenderer: Get current layer style (Single Symbol, Categorized)
 * - getPossibleRenderers: Get available renderer types
 * - setLayerStyle: Update layer style configuration
 * - getBaseSymbol: Get default symbol for layer type
 * - generateSymbolImage: Generate symbol thumbnail (Base64 PNG)
 * - generateRandomColorSymbol: Generate symbol with random color
 * - classifyValues: Classify layer values by symbols (Categorized renderer)
 *
 * Documentation: docs/backend/styles_api_docs.md
 */

import { baseApi } from '../client/base-api';

/**
 * RGBA Color type [R, G, B, A] (0-255 for each channel)
 */
export type RGBAColor = [number, number, number, number];

/**
 * Symbol Unit types
 * 0 = MM (millimeters)
 * 1 = MapUnit
 * 2 = Pixel
 */
export type SymbolUnit = 0 | 1 | 2;

/**
 * Fill style types
 * 0 = NoBrush (no fill)
 * 1 = SolidPattern (solid color)
 * 2-15 = various patterns (Dense1Pattern, Dense2Pattern, etc.)
 */
export type FillStyle = number;

/**
 * Stroke style types
 * 0 = NoPen (no stroke)
 * 1 = SolidLine
 * 2 = DashLine
 * 3 = DotLine
 * 4 = DashDotLine
 * 5 = DashDotDotLine
 */
export type StrokeStyle = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Join style types
 * 0 = MiterJoin
 * 64 = BevelJoin
 * 128 = RoundJoin
 */
export type JoinStyle = 0 | 64 | 128;

/**
 * Symbol type for vector layers
 */
export type SymbolType = 'fill' | 'line' | 'marker';

/**
 * Renderer type
 */
export type RendererType = 'Single Symbol' | 'Categorized';

/**
 * Base symbol structure
 */
export interface BaseSymbol {
  symbol_type: SymbolType;
  id?: string;
  fill?: {
    color: RGBAColor;
    opacity: number;
    unit: SymbolUnit;
  };
  fills?: SymbolLayer[];
  line?: {
    color: RGBAColor;
    width: number;
    unit: SymbolUnit;
  };
  lines?: SymbolLayer[];
  marker?: {
    size: number;
    color: RGBAColor;
    unit: SymbolUnit;
  };
  markers?: SymbolLayer[];
}

/**
 * Symbol layer (sublayer within a symbol)
 */
export interface SymbolLayer {
  symbol_type: string; // e.g., "Simple Fill", "Simple Line", "Simple Marker"
  id: string;
  enabled: boolean;
  attributes: Record<string, any>;
}

/**
 * Single Symbol renderer configuration
 */
export interface SingleSymbolRenderer {
  renderer: 'Single Symbol';
  symbols: BaseSymbol;
}

/**
 * Categorized renderer category
 */
export interface CategorizationCategory {
  symbol: BaseSymbol;
  value: string;
  label: string;
}

/**
 * Categorized renderer configuration
 */
export interface CategorizedRenderer {
  renderer: 'Categorized';
  value: string; // Column name to categorize by
  source_symbol?: BaseSymbol;
  color_ramp?: any | null;
  categories: CategorizationCategory[];
}

/**
 * Style configuration (union type)
 */
export type StyleConfiguration = SingleSymbolRenderer | CategorizedRenderer;

/**
 * Response from getLayerRenderer
 */
export interface GetLayerRendererResponse {
  data: StyleConfiguration;
  success: boolean;
  message: string;
}

/**
 * Response from getPossibleRenderers
 */
export interface GetPossibleRenderersResponse {
  data: RendererType[];
  success: boolean;
  message: string;
}

/**
 * Request for setLayerStyle
 */
export interface SetLayerStyleRequest {
  project: string;
  id: string; // Layer ID
  style_configuration: StyleConfiguration;
}

/**
 * Response from setLayerStyle
 */
export interface SetLayerStyleResponse {
  data: StyleConfiguration;
  success: boolean;
  message: string;
}

/**
 * Request for getBaseSymbol
 */
export interface GetBaseSymbolRequest {
  project: string;
  layer_id: string;
}

/**
 * Response from getBaseSymbol
 */
export interface GetBaseSymbolResponse {
  data: BaseSymbol;
  success: boolean;
  message: string;
}

/**
 * Request for generateSymbolImage
 */
export interface GenerateSymbolImageRequest {
  symbol: BaseSymbol;
}

/**
 * Response from generateSymbolImage (Base64 PNG)
 */
export interface GenerateSymbolImageResponse {
  data: string; // Base64 encoded PNG image
  success: boolean;
  message: string;
}

/**
 * Request for generateRandomColorSymbol
 */
export interface GenerateRandomColorSymbolRequest {
  symbol: BaseSymbol;
}

/**
 * Response from generateRandomColorSymbol
 */
export interface GenerateRandomColorSymbolResponse {
  data: BaseSymbol;
  success: boolean;
  message: string;
}

/**
 * Request for classifyValues
 */
export interface ClassifyValuesRequest {
  project: string;
  layer_id: string;
  column: string;
  rgb_colors: RGBAColor[];
}

/**
 * Response from classifyValues
 */
export interface ClassifyValuesResponse {
  data: {
    categories: CategorizationCategory[];
  };
  success: boolean;
  message: string;
}

export const stylesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get Layer Renderer
     * GET /api/styles/renderer
     * Retrieves the current style configuration for a layer
     */
    getLayerRenderer: builder.query<GetLayerRendererResponse, { project: string; layer_id: string; renderer?: RendererType }>({
      query: ({ project, layer_id, renderer }) => ({
        url: '/api/styles/renderer',
        params: {
          project,
          layer_id,
          ...(renderer && { renderer }),
        },
      }),
      providesTags: (result, error, { layer_id }) => [
        { type: 'LayerStyle', id: layer_id },
      ],
    }),

    /**
     * Get Possible Renderers
     * GET /api/styles/renderer/possible
     * Returns list of available renderer types
     */
    getPossibleRenderers: builder.query<GetPossibleRenderersResponse, void>({
      query: () => '/api/styles/renderer/possible',
      // No tags - this is static data
    }),

    /**
     * Set Layer Style
     * POST /api/styles/set
     * Updates the style configuration for a layer
     */
    setLayerStyle: builder.mutation<SetLayerStyleResponse, SetLayerStyleRequest>({
      query: (body) => ({
        url: '/api/styles/set',
        method: 'POST',
        body,
      }),
      // Invalidate layer style cache after update
      invalidatesTags: (result, error, { id }) => [
        { type: 'LayerStyle', id },
        { type: 'Project', id: 'QGIS' }, // Invalidate QGIS project data (tree.json)
        'Layers',
      ],
    }),

    /**
     * Get Base Symbol
     * GET /api/styles/symbol
     * Returns default symbol for layer type (fill/line/marker)
     */
    getBaseSymbol: builder.query<GetBaseSymbolResponse, GetBaseSymbolRequest>({
      query: ({ project, layer_id }) => ({
        url: '/api/styles/symbol',
        params: { project, layer_id },
      }),
      // No caching - always fetch fresh default symbol
    }),

    /**
     * Generate Symbol Image
     * POST /api/styles/symbol/image
     * Generates a Base64 PNG thumbnail of a symbol
     */
    generateSymbolImage: builder.mutation<GenerateSymbolImageResponse, GenerateSymbolImageRequest>({
      query: (body) => ({
        url: '/api/styles/symbol/image',
        method: 'POST',
        body,
      }),
      // No cache invalidation - image generation doesn't change state
    }),

    /**
     * Generate Random Color Symbol
     * POST /api/styles/symbol/random/color
     * Returns symbol with randomly generated color
     */
    generateRandomColorSymbol: builder.mutation<GenerateRandomColorSymbolResponse, GenerateRandomColorSymbolRequest>({
      query: (body) => ({
        url: '/api/styles/symbol/random/color',
        method: 'POST',
        body,
      }),
      // No cache invalidation - doesn't change backend state
    }),

    /**
     * Classify Values
     * POST /api/styles/classify
     * Generates categories for Categorized renderer based on column values
     */
    classifyValues: builder.mutation<ClassifyValuesResponse, ClassifyValuesRequest>({
      query: (body) => ({
        url: '/api/styles/classify',
        method: 'POST',
        body,
      }),
      // No cache invalidation - doesn't change backend state (returns data for UI)
    }),
  }),
});

// Export auto-generated hooks
export const {
  useGetLayerRendererQuery,
  useLazyGetLayerRendererQuery,
  useGetPossibleRenderersQuery,
  useSetLayerStyleMutation,
  useGetBaseSymbolQuery,
  useLazyGetBaseSymbolQuery,
  useGenerateSymbolImageMutation,
  useGenerateRandomColorSymbolMutation,
  useClassifyValuesMutation,
} = stylesApi;
