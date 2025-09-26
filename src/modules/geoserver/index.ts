/**
 * GeoServer Module - Main exports
 */

export {
  createGeoServerClient,
  getWmsUrl,
  wfsGetFeatures,
  wfsGetFeaturesGml,
  parseGml,
  getWmsCapabilities,
  testGeoServerConnection,
} from "./client"

export type {
  GeoServerConfig,
  WmsUrlParams,
  WfsParams,
  GeoServerCapabilities,
} from "./client"

// Integration helpers for mapRuntime
export { addWmsLayerFromGeoServer, addWfsLayerFromGeoServer } from "./integration"
