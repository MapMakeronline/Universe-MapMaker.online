// TypeScript types for GeoCraft Backend API
// Based on Django models and API responses

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  zip_code?: string;
  nip?: string;
  company_name?: string;
  theme?: string;
  dbLogin?: string;
  dbPassword?: string;
  avatar?: string; // Google profile picture URL
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  zip_code?: string;
  nip?: string;
  company_name?: string;
}

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  project_name: string;
  custom_project_name: string;
  published: boolean;
  logoExists: boolean;
  description: string;
  keywords: string;
  project_date: string; // Format: DD-MM-YY (from backend)
  project_time: string; // Format: HH:MM (from backend)
  domain_name: string;
  domain_url: string;
  categories: string;
  qgs_exists: boolean;
  user?: User; // Deprecated - use owner instead
  owner?: {
    id: number | null;
    username: string;
    email: string;
  };
  thumbnail_url?: string;
  created_at?: string; // Computed field: ISO 8601 timestamp from project_date + project_time
}

/**
 * Helper function: Convert backend project_date + project_time to ISO timestamp
 * Backend format: project_date="15-01-25", project_time="14:30"
 * Output: ISO 8601 string "2025-01-15T14:30:00.000Z"
 */
export function getProjectCreatedAt(project: Project): string {
  if (!project.project_date || !project.project_time) {
    return new Date(0).toISOString(); // Fallback to epoch
  }

  try {
    // Parse DD-MM-YY format
    const [day, month, year] = project.project_date.split('-').map(Number);
    const [hours, minutes] = project.project_time.split(':').map(Number);

    // Assume 21st century (20YY instead of 19YY)
    const fullYear = year < 100 ? 2000 + year : year;

    // Create date object (month is 0-indexed in JavaScript)
    const date = new Date(fullYear, month - 1, day, hours, minutes);

    return date.toISOString();
  } catch (e) {
    console.error('Failed to parse project date:', project.project_date, project.project_time, e);
    return new Date(0).toISOString(); // Fallback to epoch
  }
}

export interface CreateProjectData {
  project: string; // Backend expects "project" not "project_name"
  domain: string; // Backend expects "domain" not "custom_project_name"
  projectDescription?: string; // Backend expects "projectDescription" not "description"
  keywords?: string;
  categories?: string[]; // Frontend uses array, but backend expects single string (ChoiceField)
}

export interface UpdateProjectData {
  project: string; // project_name
  custom_project_name?: string;
  domain?: string;
  keywords?: string;
  description?: string;
  category?: string;
}

export interface ProjectsResponse {
  list_of_projects: Project[];
  db_info: DbInfo;
}

export interface DbInfo {
  login: string;
  password: string;
  host: string;
  port: string;
  db_name: string; // CRITICAL: Real project_name from backend (with suffix _1, _2, etc.)
}

// ============================================================================
// Layer Types
// ============================================================================

export interface Layer {
  id: string;
  name: string;
  type: 'vector' | 'raster';
  geometry_type?: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  visible: boolean;
  opacity: number;
  project_name: string;
  source_file?: string;
  style?: LayerStyle;
  attributes?: LayerAttribute[];
  feature_count?: number;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface LayerAttribute {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface LayerStyle {
  type: 'simple' | 'categorized' | 'graduated';
  fill_color?: string;
  stroke_color?: string;
  stroke_width?: number;
  opacity?: number;
  symbol?: string;
  rules?: StyleRule[];
}

export interface StyleRule {
  label: string;
  value: string | number;
  color: string;
  symbol?: string;
}

export interface AddLayerData {
  project_name: string;
  layer_name: string;
  file: File;
  epsg?: string; // Coordinate system (default: 'EPSG:4326')
}

export interface AddGeoJsonLayerData {
  project_name: string;
  layer_name: string;
  geojson: File | object;
  epsg?: string;
}

export interface AddShpLayerData {
  project: string; // Backend expects "project" not "project_name"
  layer_name: string;
  parent?: string; // Parent group name (required by backend, can be empty string)
  shpFile: File; // .shp file
  shxFile?: File; // .shx file (optional, but recommended)
  dbfFile?: File; // .dbf file (optional, but recommended)
  prjFile?: File; // .prj file (optional, for projection info)
  cpgFile?: File; // .cpg file (optional, for encoding)
  qpjFile?: File; // .qpj file (optional, for QGIS projection)
  epsg?: string; // Manual EPSG code if .prj is missing
  encoding?: string; // Manual encoding if .cpg is missing (default: UTF-8)
}

export interface UpdateLayerStyleData {
  project_name: string;
  layer_name: string;
  style: LayerStyle;
}

export interface LayerExportOptions {
  format: 'geojson' | 'shapefile' | 'kml' | 'gml';
  epsg?: string;
}

// ============================================================================
// Group Types (for parcels grouping)
// ============================================================================

export interface Group {
  id: string;
  name: string;
  project_name: string;
  layer_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateGroupData {
  project_name: string;
  group_name: string;
  layer_ids: string[];
}

// ============================================================================
// Parcel Types (Cadastral Parcels)
// ============================================================================

export interface Parcel {
  id: string;
  parcel_id: string; // Cadastral ID
  precinct?: string;
  number?: string;
  area?: number;
  perimeter?: number;
  geometry?: GeoJSON.Geometry;
  attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateParcelData {
  parcel_id: string;
  precinct?: string;
  number?: string;
  area?: number;
  geometry: GeoJSON.Geometry;
  attributes?: Record<string, unknown>;
}

// ============================================================================
// Style Types
// ============================================================================

export interface SymbolDefinition {
  id: string;
  name: string;
  type: 'marker' | 'line' | 'fill';
  svg?: string;
  image_url?: string;
}

export interface Renderer {
  type: 'single' | 'categorized' | 'graduated';
  field?: string;
  values?: Array<{ value: string | number; label: string; color: string }>;
}

export interface ClassifyRequest {
  project_name: string;
  layer_name: string;
  field: string;
  method: 'equal_interval' | 'quantile' | 'natural_breaks' | 'unique_values';
  classes?: number; // For numeric classification
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface UserStats {
  total_projects: number;
  total_layers: number;
  total_features: number;
  storage_used: number; // in MB
  last_login?: string;
}

export interface RecentActivity {
  id: string;
  type: 'project_created' | 'layer_added' | 'project_updated' | 'layer_deleted';
  description: string;
  timestamp: string;
  project_name?: string;
}

// ============================================================================
// Contact & Settings Types
// ============================================================================

export interface ContactFormData {
  subject: string;
  name: string;
  email: string;
  message: string;
}

export interface UpdateProfileData {
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  nip?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  theme?: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface ChangePasswordResponse {
  message: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// QGIS Server Types
// ============================================================================

export interface WMSCapabilities {
  version: string;
  title: string;
  abstract?: string;
  layers: WMSLayer[];
}

export interface WMSLayer {
  name: string;
  title: string;
  abstract?: string;
  crs: string[];
  bounds: [number, number, number, number];
}

export interface WMSGetMapParams {
  bbox: string;
  width: number;
  height: number;
  layers: string;
  crs?: string;
  format?: 'image/png' | 'image/jpeg';
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportProjectOptions {
  format: 'pdf' | 'docx' | 'qgz' | 'qgs';
  include_layers?: boolean;
  include_styles?: boolean;
  paper_size?: 'A4' | 'A3' | 'A2' | 'A1';
  orientation?: 'portrait' | 'landscape';
  dpi?: number;
}

export interface ExportLayerOptions {
  format: 'geojson' | 'shapefile' | 'kml' | 'gml' | 'gpkg';
  epsg?: string;
  filter?: string; // SQL filter
  selected_only?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  status: number;
  message: string;
  field_errors?: Record<string, string>;
  detail?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface ProjectFilter {
  search?: string;
  categories?: string[];
  published?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'name' | 'date' | 'updated';
  sort_order?: 'asc' | 'desc';
}

export interface LayerFilter {
  project_name: string;
  type?: 'vector' | 'raster';
  geometry_type?: string;
  visible?: boolean;
  search?: string;
}

// ============================================================================
// Wypis/Wyrys Types (Print Configuration)
// ============================================================================

/**
 * Purpose (przeznaczenie) definition for a plan layer
 * Links a symbol/name to a PDF file with detailed description
 */
export interface WypisPurpose {
  name: string;        // Display name (e.g., "MN - Mieszkaniowe")
  fileName: string;    // PDF filename (e.g., "MN.pdf")
}

/**
 * Arrangement (ustalenie) definition for general documents
 * Links general regulations/rules to PDF files
 */
export interface WypisArrangement {
  name: string;        // Display name (e.g., "Rozdział 1. Ustalenia ogólne")
  fileName: string;    // PDF filename (e.g., "rozdzial_1.pdf")
}

/**
 * Plan layer configuration for wypis
 * Each layer represents a spatial planning document (MPZP, SUiKZP, etc.)
 */
export interface WypisPlanLayer {
  id: string;                       // QGIS layer ID (also used as folder name)
  name: string;                     // Display name
  purposeColumn: string;            // Column name containing purpose symbol
  purposes: WypisPurpose[];         // List of possible purposes
  arrangements: WypisArrangement[]; // List of general documents
}

/**
 * Complete wypis configuration structure
 * Stored as JSON file in backend: /projects/{project}/wypis_configs/{config_id}.json
 */
export interface WypisConfiguration {
  configuration_name: string;       // Configuration name (e.g., "MPZP")
  plotsLayer: string;               // QGIS layer ID for cadastral parcels
  plotsLayerName: string;           // Display name for parcels layer
  precinctColumn: string;           // Column name for precinct (obręb)
  plotNumberColumn: string;         // Column name for plot number
  planLayers: WypisPlanLayer[];     // Array of plan layers (order matters!)
}

/**
 * Request payload for adding/updating wypis configuration
 */
export interface AddWypisConfigurationRequest {
  project: string;                  // Project name (regex: ^[a-zA-Z0-9ąćęłńóśźżĄĘŁŃÓŚŹŻ_]*$)
  config_id?: string;               // Optional config ID (auto-generated if not provided)
  configuration: WypisConfiguration; // Full configuration object
}

/**
 * Response from add/update wypis configuration
 */
export interface WypisConfigurationResponse {
  success: boolean;
  config_complete: boolean;         // True if all required fields are present
  config_id: string;                // Configuration ID
  message?: string;
}

/**
 * Request payload for getting wypis configuration(s)
 */
export interface GetWypisConfigurationRequest {
  project: string;                  // Required: project name
  config_id?: string;               // Optional: specific config ID (if omitted, returns all)
}

/**
 * Response for single configuration
 */
export interface GetWypisConfigurationSingleResponse {
  success: boolean;
  data: WypisConfiguration;
}

/**
 * Response for all configurations
 */
export interface GetWypisConfigurationAllResponse {
  success: boolean;
  configurations: Array<{
    config_id: string;
    configuration_name: string;
    data: WypisConfiguration;
  }>;
}

/**
 * Request payload for removing wypis configuration
 */
export interface RemoveWypisConfigurationRequest {
  project: string;                  // Project name
  config_id: string;                // Configuration ID to remove
}

/**
 * Plot (parcel) identifier for wypis generation
 */
export interface WypisPlot {
  precinct: string;                 // Precinct name (obręb)
  number: string;                   // Plot number
}

/**
 * Plot destination (planning zone) with associated documents
 */
export interface WypisPlotDestination {
  plan_id: string;                  // Planning zone layer ID
  includes: boolean;                // Whether this destination should be included
  covering: string;                 // Percentage of plot covered by this zone (e.g. "75%")
  destinations: Array<{
    name: string;                   // Document type name
    includes: boolean;              // Whether to include this document
  }>;
}

/**
 * Plot with spatial development data (planning zones)
 */
export interface WypisPlotWithDestinations {
  plot: WypisPlot;
  plot_destinations: WypisPlotDestination[];
}

/**
 * Request payload for getting plot spatial development
 */
export interface GetPlotSpatialDevelopmentRequest {
  project: string;                  // Project name
  config_id: string;                // Configuration ID (required by backend)
  plot: WypisPlot[];                // Plots to query (backend expects array)
}

/**
 * Response from plot spatial development endpoint
 */
export interface GetPlotSpatialDevelopmentResponse {
  data: WypisPlotWithDestinations[];
  success: boolean;
  message?: string;
}

/**
 * Request payload for creating wypis PDF
 */
export interface CreateWypisRequest {
  project: string;                  // Project name
  config_id: string;                // Configuration ID to use
  plot: WypisPlotWithDestinations[];  // Array of plots with destinations to include in wypis
}

/**
 * Purpose with optional File object for upload
 */
export interface WypisPurposeWithFile extends WypisPurpose {
  file?: File;  // UI-only: File object for upload
  existingFileName?: string;  // UI-only: Existing file name from backend (if any)
}

/**
 * Arrangement with optional File object for upload
 */
export interface WypisArrangementWithFile extends WypisArrangement {
  file?: File;  // UI-only: File object for upload
  existingFileName?: string;  // UI-only: Existing file name from backend (if any)
}

/**
 * Frontend form state for wypis configuration modal
 * Includes UI-specific fields not sent to backend
 */
export interface WypisConfigFormState {
  configurationName: string;
  plotsLayer: {
    layerId: string;
    layerName: string;
    precinctColumn: string;
    plotNumberColumn: string;
  };
  planLayers: Array<{
    id: string;
    name: string;
    purposeColumn: string;
    purposes: WypisPurposeWithFile[];
    arrangements: WypisArrangementWithFile[];
    enabled: boolean;               // UI-only: checkbox state
    position: number | null;        // UI-only: ordering position (1, 2, 3...)
  }>;
  transparencySettings?: string;    // UI-only: NOT supported by backend!
}
