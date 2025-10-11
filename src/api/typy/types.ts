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
  project_date: string;
  project_time: string;
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
}

export interface CreateProjectData {
  project: string; // Backend expects "project" not "project_name"
  domain: string; // Backend expects "domain" not "custom_project_name"
  projectDescription?: string; // Backend expects "projectDescription" not "description"
  keywords?: string;
  categories?: string[]; // Backend serializers.py uses ListField (array of strings)
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
