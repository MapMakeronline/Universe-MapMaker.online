/**
 * Layers Module - RTK Query API
 *
 * TODO: Full migration from src/redux/api/layersApi.ts
 * For now, re-export from old location
 *
 * Endpoints (29 total):
 * - addGeoJsonLayer: Add GeoJSON layer
 * - addShpLayer: Add Shapefile layer
 * - deleteLayer: Delete layer
 * - updateLayerStyle: Update layer styling
 * - getLayerAttributes: Get layer columns
 * - exportLayer: Export layer data
 * ... (23 more endpoints)
 */

// Temporary re-export from old location
// Will be migrated to use baseApi in next phase
export { layersApi } from '@/redux/api/layersApi';
export * from '@/redux/api/layersApi';
