import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react"
import type { GeoJSON } from "geojson"

// Define base query with error handling
const baseQuery = fetchBaseQuery({
  baseUrl: "/api/proxy",
  prepareHeaders: (headers, { getState }) => {
    // Add any auth headers if needed
    headers.set("Content-Type", "application/json")
    return headers
  },
})

// Add retry logic with exponential backoff
const baseQueryWithRetry = retry(baseQuery, {
  maxRetries: 3,
  retryCondition: (error, args) => {
    // Retry on network errors and 5xx server errors
    return error?.status === "FETCH_ERROR" || (typeof error?.status === "number" && error.status >= 500)
  },
})

const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQueryWithRetry(args, api, extraOptions)

  if (result.error) {
    // Handle specific error cases
    if (result.error.status === 401 || result.error.status === 403) {
      // Handle unauthorized access - could integrate with auth slice
      console.warn("Unauthorized access detected")
      // Dispatch logout toast notification
      // api.dispatch(showToast({ type: 'error', message: 'Session expired. Please log in again.' }))
    }

    // Log domain-specific errors
    if (result.error.status === "FETCH_ERROR") {
      console.error("Network error:", result.error)
      // api.dispatch(showToast({ type: 'error', message: 'Network connection failed. Please try again.' }))
    }

    // Handle rate limiting
    if (result.error.status === 429) {
      console.warn("Rate limit exceeded")
      // api.dispatch(showToast({ type: 'warning', message: 'Too many requests. Please wait a moment.' }))
    }
  }

  return result
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Parcel", "Offer", "Layer", "GeoData"],
  endpoints: (builder) => ({
    // Parcel endpoints
    getParcelById: builder.query<any, string>({
      query: (id) => `/parcels/${id}`,
      providesTags: (result, error, id) => [{ type: "Parcel", id }],
    }),

    updateParcel: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/parcels/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Parcel", id }],
    }),

    // Search and offers
    searchOffers: builder.query<any[], { query: string; filters?: any }>({
      query: ({ query, filters }) => ({
        url: "/offers/search",
        params: { q: query, ...filters },
      }),
      providesTags: ["Offer"],
    }),

    // GeoServer endpoints
    getWfsFeatures: builder.query<
      GeoJSON.FeatureCollection,
      {
        baseUrl: string
        typeName: string
        srs?: string
        outputFormat?: string
        filter?: string
      }
    >({
      query: ({ baseUrl, typeName, srs = "EPSG:4326", outputFormat = "application/json", filter }) => ({
        url: "/geoserver/wfs",
        params: {
          service: "WFS",
          version: "2.0.0",
          request: "GetFeature",
          typeName,
          srs,
          outputFormat,
          ...(filter && { filter }),
          baseUrl,
        },
      }),
      providesTags: ["GeoData"],
    }),

    getWmsCapabilities: builder.query<any, { baseUrl: string }>({
      query: ({ baseUrl }) => ({
        url: "/geoserver/wms",
        params: {
          service: "WMS",
          version: "1.3.0",
          request: "GetCapabilities",
          baseUrl,
        },
      }),
      providesTags: ["Layer"],
    }),

    // Google Sheets endpoints
    ensureSpreadsheet: builder.mutation<{ spreadsheetId: string; url: string }, { datasetName: string }>({
      query: ({ datasetName }) => ({
        url: "/sheets/ensure",
        method: "POST",
        body: { datasetName },
      }),
    }),

    syncRowToSheet: builder.mutation<
      any,
      {
        spreadsheetId: string
        sheetTitle: string
        keyColumn: string
        keyValue: string
        row: Record<string, any>
      }
    >({
      query: (data) => ({
        url: "/sheets/sync-row",
        method: "POST",
        body: data,
      }),
    }),

    pullFromSheet: builder.query<
      any[],
      {
        spreadsheetId: string
        sheetTitle: string
      }
    >({
      query: ({ spreadsheetId, sheetTitle }) => ({
        url: "/sheets/pull",
        method: "POST",
        body: { spreadsheetId, sheetTitle },
      }),
    }),
  }),
})

export const {
  useGetParcelByIdQuery,
  useUpdateParcelMutation,
  useSearchOffersQuery,
  useGetWfsFeaturesQuery,
  useGetWmsCapabilitiesQuery,
  useEnsureSpreadsheetMutation,
  useSyncRowToSheetMutation,
  usePullFromSheetQuery,
} = api
