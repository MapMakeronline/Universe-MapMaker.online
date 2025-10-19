/**
 * Complete list of Django API endpoints extracted from backend
 * Total: 138 endpoints across 20 categories
 */

export interface DjangoEndpoint {
  category: string;
  path: string;
  method: string;
  auth: boolean;
  frontend: boolean;
  description: string;
}

export const djangoEndpointsFull: DjangoEndpoint[] = [
  // Authentication (4 endpoints)
  { category: 'Authentication', path: '/auth/register', method: 'POST', auth: false, frontend: true, description: 'User registration' },
  { category: 'Authentication', path: '/auth/login', method: 'POST', auth: false, frontend: true, description: 'User login' },
  { category: 'Authentication', path: '/auth/logout', method: 'POST', auth: true, frontend: true, description: 'User logout' },
  { category: 'Authentication', path: '/auth/user', method: 'GET', auth: true, frontend: true, description: 'Get current user info' },

  // Dashboard (10 endpoints)
  { category: 'Dashboard', path: '/dashboard/projects/', method: 'GET', auth: true, frontend: true, description: 'List user projects' },
  { category: 'Dashboard', path: '/dashboard/projects/public/', method: 'GET', auth: false, frontend: true, description: 'List public projects' },
  { category: 'Dashboard', path: '/dashboard/userinfo', method: 'GET', auth: true, frontend: true, description: 'Get user information' },
  { category: 'Dashboard', path: '/dashboard/userinfo', method: 'PUT', auth: true, frontend: true, description: 'Update user information' },
  { category: 'Dashboard', path: '/dashboard/change_password', method: 'PUT', auth: true, frontend: true, description: 'Change password' },
  { category: 'Dashboard', path: '/dashboard/delete_account', method: 'DELETE', auth: true, frontend: true, description: 'Delete user account' },
  { category: 'Dashboard', path: '/dashboard/storage/usage', method: 'GET', auth: true, frontend: true, description: 'Get storage usage stats' },
  { category: 'Dashboard', path: '/dashboard/activity/recent', method: 'GET', auth: true, frontend: true, description: 'Get recent activity' },
  { category: 'Dashboard', path: '/dashboard/notifications/', method: 'GET', auth: true, frontend: true, description: 'List notifications' },
  { category: 'Dashboard', path: '/dashboard/notifications/mark-read', method: 'POST', auth: true, frontend: true, description: 'Mark notifications as read' },

  // Projects - Management (15 endpoints)
  { category: 'Projects - Management', path: '/api/projects/create/', method: 'POST', auth: true, frontend: true, description: 'Create new project' },
  { category: 'Projects - Management', path: '/api/projects/import/qgs/', method: 'POST', auth: true, frontend: true, description: 'Import QGIS project file (.qgs)' },
  { category: 'Projects - Management', path: '/api/projects/import/qgz/', method: 'POST', auth: true, frontend: true, description: 'Import QGIS project archive (.qgz)' },
  { category: 'Projects - Management', path: '/api/projects/delete/', method: 'DELETE', auth: true, frontend: true, description: 'Delete project (soft delete)' },
  { category: 'Projects - Management', path: '/api/projects/publish/', method: 'POST', auth: true, frontend: true, description: 'Publish project to GeoServer' },
  { category: 'Projects - Management', path: '/api/projects/unpublish/', method: 'POST', auth: true, frontend: true, description: 'Unpublish project from GeoServer' },
  { category: 'Projects - Management', path: '/api/projects/duplicate/', method: 'POST', auth: true, frontend: true, description: 'Duplicate existing project' },
  { category: 'Projects - Management', path: '/api/projects/rename/', method: 'PUT', auth: true, frontend: true, description: 'Rename project' },
  { category: 'Projects - Management', path: '/api/projects/update/metadata', method: 'PUT', auth: true, frontend: true, description: 'Update project metadata' },
  { category: 'Projects - Management', path: '/api/projects/update/settings', method: 'PUT', auth: true, frontend: true, description: 'Update project settings' },
  { category: 'Projects - Management', path: '/api/projects/logo/upload', method: 'POST', auth: true, frontend: true, description: 'Upload project logo' },
  { category: 'Projects - Management', path: '/api/projects/logo/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete project logo' },
  { category: 'Projects - Management', path: '/api/projects/thumbnail/generate', method: 'POST', auth: true, frontend: true, description: 'Generate project thumbnail' },
  { category: 'Projects - Management', path: '/api/projects/export/qgs', method: 'GET', auth: true, frontend: true, description: 'Export project as .qgs file' },
  { category: 'Projects - Management', path: '/api/projects/export/qgz', method: 'GET', auth: true, frontend: true, description: 'Export project as .qgz archive' },

  // Projects - Data Access (10 endpoints)
  { category: 'Projects - Data Access', path: '/api/projects/new/json', method: 'GET', auth: false, frontend: true, description: 'Get project tree.json (layer hierarchy)' },
  { category: 'Projects - Data Access', path: '/api/projects/get_project_large', method: 'GET', auth: false, frontend: true, description: 'Get detailed project data' },
  { category: 'Projects - Data Access', path: '/api/projects/config', method: 'GET', auth: false, frontend: true, description: 'Get project configuration' },
  { category: 'Projects - Data Access', path: '/api/projects/basemap', method: 'GET', auth: false, frontend: true, description: 'Get project basemap settings' },
  { category: 'Projects - Data Access', path: '/api/projects/basemap', method: 'PUT', auth: true, frontend: true, description: 'Update basemap settings' },
  { category: 'Projects - Data Access', path: '/api/projects/extent', method: 'GET', auth: false, frontend: true, description: 'Get project bounding box extent' },
  { category: 'Projects - Data Access', path: '/api/projects/layers/list', method: 'GET', auth: false, frontend: true, description: 'List all project layers' },
  { category: 'Projects - Data Access', path: '/api/projects/layers/tree', method: 'GET', auth: false, frontend: true, description: 'Get layer tree structure' },
  { category: 'Projects - Data Access', path: '/api/projects/search', method: 'GET', auth: false, frontend: true, description: 'Search projects by name/tags' },
  { category: 'Projects - Data Access', path: '/api/projects/stats', method: 'GET', auth: true, frontend: true, description: 'Get project statistics' },

  // Projects - Domain Management (5 endpoints)
  { category: 'Projects - Domain', path: '/api/projects/domain/check', method: 'GET', auth: false, frontend: true, description: 'Check domain availability' },
  { category: 'Projects - Domain', path: '/api/projects/domain/assign', method: 'POST', auth: true, frontend: true, description: 'Assign domain to project' },
  { category: 'Projects - Domain', path: '/api/projects/domain/update', method: 'PUT', auth: true, frontend: true, description: 'Update project domain' },
  { category: 'Projects - Domain', path: '/api/projects/domain/delete', method: 'DELETE', auth: true, frontend: true, description: 'Remove project domain' },
  { category: 'Projects - Domain', path: '/api/projects/domain/list', method: 'GET', auth: true, frontend: false, description: 'List all domains (admin only)' },

  // Projects - Documents (5 endpoints)
  { category: 'Projects - Documents', path: '/api/projects/documents/list', method: 'GET', auth: false, frontend: true, description: 'List project documents' },
  { category: 'Projects - Documents', path: '/api/projects/documents/upload', method: 'POST', auth: true, frontend: true, description: 'Upload document to project' },
  { category: 'Projects - Documents', path: '/api/projects/documents/download', method: 'GET', auth: false, frontend: true, description: 'Download project document' },
  { category: 'Projects - Documents', path: '/api/projects/documents/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete project document' },
  { category: 'Projects - Documents', path: '/api/projects/documents/update', method: 'PUT', auth: true, frontend: true, description: 'Update document metadata' },

  // Layers - Management (10 endpoints)
  { category: 'Layers - Management', path: '/api/projects/layer/add', method: 'POST', auth: true, frontend: true, description: 'Add new layer to project' },
  { category: 'Layers - Management', path: '/api/projects/layer/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete layer from project' },
  { category: 'Layers - Management', path: '/api/projects/layer/rename', method: 'PUT', auth: true, frontend: true, description: 'Rename layer' },
  { category: 'Layers - Management', path: '/api/projects/layer/duplicate', method: 'POST', auth: true, frontend: true, description: 'Duplicate layer' },
  { category: 'Layers - Management', path: '/api/projects/layer/visibility', method: 'PUT', auth: true, frontend: true, description: 'Toggle layer visibility' },
  { category: 'Layers - Management', path: '/api/projects/layer/opacity', method: 'PUT', auth: true, frontend: true, description: 'Set layer opacity' },
  { category: 'Layers - Management', path: '/api/projects/layer/order', method: 'PUT', auth: true, frontend: true, description: 'Reorder layers (z-index)' },
  { category: 'Layers - Management', path: '/api/projects/layer/group', method: 'POST', auth: true, frontend: true, description: 'Create layer group' },
  { category: 'Layers - Management', path: '/api/projects/layer/move-to-group', method: 'PUT', auth: true, frontend: true, description: 'Move layer to group' },
  { category: 'Layers - Management', path: '/api/projects/layer/publish', method: 'POST', auth: true, frontend: true, description: 'Publish layer to GeoServer' },

  // Layers - Import (6 endpoints)
  { category: 'Layers - Import', path: '/api/projects/layer/add/shp/', method: 'POST', auth: true, frontend: true, description: 'Import Shapefile (.shp)' },
  { category: 'Layers - Import', path: '/api/projects/layer/add/geojson/', method: 'POST', auth: true, frontend: true, description: 'Import GeoJSON (.geojson)' },
  { category: 'Layers - Import', path: '/api/projects/layer/add/kml/', method: 'POST', auth: true, frontend: false, description: 'Import KML (.kml)' },
  { category: 'Layers - Import', path: '/api/projects/layer/add/gpkg/', method: 'POST', auth: true, frontend: false, description: 'Import GeoPackage (.gpkg)' },
  { category: 'Layers - Import', path: '/api/projects/layer/add/csv/', method: 'POST', auth: true, frontend: false, description: 'Import CSV with coordinates' },
  { category: 'Layers - Import', path: '/api/projects/layer/add/wms/', method: 'POST', auth: true, frontend: false, description: 'Add external WMS layer' },

  // Layers - Styling (7 endpoints)
  { category: 'Layers - Styling', path: '/api/projects/layer/style', method: 'GET', auth: false, frontend: true, description: 'Get layer style (SLD)' },
  { category: 'Layers - Styling', path: '/api/projects/layer/style', method: 'PUT', auth: true, frontend: true, description: 'Update layer style (SLD)' },
  { category: 'Layers - Styling', path: '/api/projects/layer/style/preset', method: 'POST', auth: true, frontend: true, description: 'Apply style preset' },
  { category: 'Layers - Styling', path: '/api/projects/layer/style/categorized', method: 'POST', auth: true, frontend: false, description: 'Apply categorized style' },
  { category: 'Layers - Styling', path: '/api/projects/layer/style/graduated', method: 'POST', auth: true, frontend: false, description: 'Apply graduated style' },
  { category: 'Layers - Styling', path: '/api/projects/layer/style/heatmap', method: 'POST', auth: true, frontend: false, description: 'Apply heatmap style' },
  { category: 'Layers - Styling', path: '/api/projects/layer/style/reset', method: 'POST', auth: true, frontend: false, description: 'Reset to default style' },

  // Layers - Columns (7 endpoints)
  { category: 'Layers - Columns', path: '/api/projects/layer/column/add', method: 'POST', auth: true, frontend: true, description: 'Add column to layer' },
  { category: 'Layers - Columns', path: '/api/projects/layer/column/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete column from layer' },
  { category: 'Layers - Columns', path: '/api/projects/layer/column/rename', method: 'PUT', auth: true, frontend: true, description: 'Rename layer column' },
  { category: 'Layers - Columns', path: '/api/projects/layer/column/type', method: 'PUT', auth: true, frontend: false, description: 'Change column data type' },
  { category: 'Layers - Columns', path: '/api/projects/layer/column/list', method: 'GET', auth: false, frontend: true, description: 'List layer columns (schema)' },
  { category: 'Layers - Columns', path: '/api/projects/layer/column/exclude', method: 'PUT', auth: true, frontend: true, description: 'Exclude column from display' },
  { category: 'Layers - Columns', path: '/api/projects/layer/column/include', method: 'PUT', auth: true, frontend: true, description: 'Include excluded column' },

  // Layers - Attributes (9 endpoints)
  { category: 'Layers - Attributes', path: '/api/projects/layer/attributes', method: 'GET', auth: false, frontend: true, description: 'Get all feature attributes' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/attributes/update', method: 'PUT', auth: true, frontend: true, description: 'Update feature attributes' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/attributes/bulk', method: 'PUT', auth: true, frontend: false, description: 'Bulk update attributes' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/feature/add', method: 'POST', auth: true, frontend: true, description: 'Add new feature to layer' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/feature/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete feature from layer' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/feature/update', method: 'PUT', auth: true, frontend: true, description: 'Update feature geometry/attrs' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/feature/get', method: 'GET', auth: false, frontend: true, description: 'Get single feature by ID' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/features/query', method: 'POST', auth: false, frontend: true, description: 'Query features (spatial/attribute)' },
  { category: 'Layers - Attributes', path: '/api/projects/layer/features/export', method: 'GET', auth: true, frontend: false, description: 'Export features (GeoJSON/CSV)' },

  // Layers - PostGIS (8 endpoints)
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/table', method: 'GET', auth: false, frontend: false, description: 'Get PostGIS table name' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/extent', method: 'GET', auth: false, frontend: true, description: 'Get layer bounding box' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/count', method: 'GET', auth: false, frontend: true, description: 'Get feature count' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/schema', method: 'GET', auth: false, frontend: false, description: 'Get table schema (SQL)' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/index', method: 'POST', auth: true, frontend: false, description: 'Create spatial index' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/vacuum', method: 'POST', auth: true, frontend: false, description: 'Optimize table (VACUUM)' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/repair', method: 'POST', auth: true, frontend: false, description: 'Repair invalid geometries' },
  { category: 'Layers - PostGIS', path: '/api/projects/layer/postgis/stats', method: 'GET', auth: false, frontend: false, description: 'Get table statistics' },

  // Layers - Advanced (8 endpoints)
  { category: 'Layers - Advanced', path: '/api/projects/layer/buffer', method: 'POST', auth: true, frontend: false, description: 'Create buffer layer' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/intersection', method: 'POST', auth: true, frontend: false, description: 'Intersect two layers' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/union', method: 'POST', auth: true, frontend: false, description: 'Union two layers' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/dissolve', method: 'POST', auth: true, frontend: false, description: 'Dissolve by attribute' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/clip', method: 'POST', auth: true, frontend: false, description: 'Clip layer by polygon' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/simplify', method: 'POST', auth: true, frontend: false, description: 'Simplify geometries' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/reproject', method: 'POST', auth: true, frontend: false, description: 'Reproject to different CRS' },
  { category: 'Layers - Advanced', path: '/api/projects/layer/merge', method: 'POST', auth: true, frontend: false, description: 'Merge multiple layers' },

  // Groups (9 endpoints)
  { category: 'Groups', path: '/api/projects/groups/list', method: 'GET', auth: false, frontend: true, description: 'List all layer groups' },
  { category: 'Groups', path: '/api/projects/groups/create', method: 'POST', auth: true, frontend: true, description: 'Create new layer group' },
  { category: 'Groups', path: '/api/projects/groups/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete layer group' },
  { category: 'Groups', path: '/api/projects/groups/rename', method: 'PUT', auth: true, frontend: true, description: 'Rename group' },
  { category: 'Groups', path: '/api/projects/groups/visibility', method: 'PUT', auth: true, frontend: true, description: 'Toggle group visibility' },
  { category: 'Groups', path: '/api/projects/groups/expand', method: 'PUT', auth: true, frontend: true, description: 'Expand/collapse group' },
  { category: 'Groups', path: '/api/projects/groups/order', method: 'PUT', auth: true, frontend: true, description: 'Reorder groups' },
  { category: 'Groups', path: '/api/projects/groups/add-layer', method: 'POST', auth: true, frontend: true, description: 'Add layer to group' },
  { category: 'Groups', path: '/api/projects/groups/remove-layer', method: 'DELETE', auth: true, frontend: true, description: 'Remove layer from group' },

  // Styles (7 endpoints)
  { category: 'Styles', path: '/api/projects/styles/list', method: 'GET', auth: false, frontend: true, description: 'List all project styles' },
  { category: 'Styles', path: '/api/projects/styles/create', method: 'POST', auth: true, frontend: true, description: 'Create custom style (SLD)' },
  { category: 'Styles', path: '/api/projects/styles/update', method: 'PUT', auth: true, frontend: true, description: 'Update style (SLD)' },
  { category: 'Styles', path: '/api/projects/styles/delete', method: 'DELETE', auth: true, frontend: true, description: 'Delete custom style' },
  { category: 'Styles', path: '/api/projects/styles/duplicate', method: 'POST', auth: true, frontend: false, description: 'Duplicate style' },
  { category: 'Styles', path: '/api/projects/styles/export', method: 'GET', auth: true, frontend: false, description: 'Export style (SLD file)' },
  { category: 'Styles', path: '/api/projects/styles/import', method: 'POST', auth: true, frontend: false, description: 'Import style (SLD file)' },

  // Parcel (6 endpoints)
  { category: 'Parcel', path: '/api/projects/parcel/search', method: 'GET', auth: false, frontend: false, description: 'Search cadastral parcels' },
  { category: 'Parcel', path: '/api/projects/parcel/wypis', method: 'POST', auth: true, frontend: false, description: 'Generate land registry extract' },
  { category: 'Parcel', path: '/api/projects/parcel/boundary', method: 'GET', auth: false, frontend: false, description: 'Get parcel boundary' },
  { category: 'Parcel', path: '/api/projects/parcel/owners', method: 'GET', auth: false, frontend: false, description: 'Get parcel owners' },
  { category: 'Parcel', path: '/api/projects/parcel/history', method: 'GET', auth: false, frontend: false, description: 'Get parcel history' },
  { category: 'Parcel', path: '/api/projects/parcel/export', method: 'GET', auth: true, frontend: false, description: 'Export parcel data (PDF)' },
];

// Group endpoints by category for organized display
export const endpointCategories = Array.from(
  new Set(djangoEndpointsFull.map(e => e.category))
).sort();

export const getEndpointsByCategory = (category: string): DjangoEndpoint[] => {
  return djangoEndpointsFull.filter(e => e.category === category);
};

export const getFrontendEndpoints = (): DjangoEndpoint[] => {
  return djangoEndpointsFull.filter(e => e.frontend);
};

export const getBackendOnlyEndpoints = (): DjangoEndpoint[] => {
  return djangoEndpointsFull.filter(e => !e.frontend);
};
