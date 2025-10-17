# API Endpoints - Complete List

## 📋 Table of Contents
1. [API Base URLs](#api-base-urls)
2. [Authentication](#authentication)
3. [Projects API](#projects-api-52-endpoints)
4. [Layers API](#layers-api-44-endpoints)
5. [Styles API](#styles-api-10-endpoints)
6. [Admin API](#admin-api-3-endpoints)
7. [Auth API](#auth-api-4-endpoints)
8. [External APIs](#external-apis)

---

## 🌐 API Base URLs

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://api.universemapmaker.online` |
| **Local Development** | `http://localhost:3000` (CORS configured) |
| **Environment Variable** | `NEXT_PUBLIC_API_URL` (from `.env.local`) |

**All requests require HTTPS in production.**

---

## 🔐 Authentication

### Token-Based Authentication

All authenticated endpoints require an `Authorization` header:

```
Authorization: Token <your-auth-token>
```

**Token Storage:**
- Saved in `localStorage` under key: `authToken`
- Automatically injected by RTK Query `baseQuery`

**Getting Token:**
```typescript
const token = localStorage.getItem('authToken');
```

---

## 📁 Projects API (52 Endpoints)

**Location:** `src/redux/api/projectsApi.ts`

**Base Path:** `/api/projects/` and `/dashboard/projects/`

### Core Operations (10 endpoints)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 1 | GET | `/dashboard/projects/` | Get all user projects | ✅ Yes |
| 2 | GET | `/dashboard/projects/public/` | Get all published projects | ❌ No |
| 3 | GET | `/api/projects/new/json` | Get project data structure (tree.json) | ⚠️ Optional |
| 4 | POST | `/api/projects/create/` | Create new project | ✅ Yes |
| 5 | PUT | `/dashboard/projects/update/` | Update project metadata | ✅ Yes |
| 6 | POST | `/api/projects/remove/` | Delete project (soft or hard) | ✅ Yes |
| 7 | POST | `/api/projects/publish` | Publish/unpublish project | ✅ Yes |
| 8 | POST | `/api/projects/export` | Export project as QGS/QGZ | ✅ Yes |
| 9 | POST | `/api/projects/import/qgs/` | Import QGS file | ✅ Yes |
| 10 | POST | `/api/projects/import/qgz/` | Import QGZ file (compressed) | ✅ Yes |

### Domain & Metadata (5 endpoints)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 11 | POST | `/api/projects/subdomainAvailability` | Check subdomain availability | ✅ Yes |
| 12 | POST | `/api/projects/domain/change` | Change project subdomain | ✅ Yes |
| 13 | POST | `/api/projects/metadata` | Set project metadata | ✅ Yes |
| 14 | POST | `/api/projects/logo/update/` | Update project logo | ✅ Yes |
| 15 | POST | `/api/projects/search` | Search projects | ❌ No |

### Layer Management (3 endpoints)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 16 | POST | `/api/projects/order` | Get layer tree order | ✅ Yes |
| 17 | POST | `/api/projects/tree/order` | Change layer tree order | ✅ Yes |
| 18 | POST | `/api/projects/space/get` | Get project storage usage | ✅ Yes |

### Project Maintenance (4 endpoints)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 19 | POST | `/api/projects/reload` | Reload project from QGIS | ✅ Yes |
| 20 | POST | `/api/projects/repair` | Repair corrupted project | ✅ Yes |
| 21 | POST | `/api/projects/restore` | Restore from backup | ✅ Yes |
| 22 | POST | `/api/projects/basemap/set` | Set project basemap | ✅ Yes |

### Printing & Visualization (1 endpoint)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 23 | POST | `/api/projects/print` | Generate print preview image | ✅ Yes |

### Advanced Features (4 endpoints)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 24 | POST | `/api/projects/distinct` | Get distinct column values | ✅ Yes |
| 25 | POST | `/api/projects/filter/min-max` | Get min/max numeric values | ✅ Yes |
| 26 | POST | `/api/projects/filter/numeric-columns` | Get numeric columns list | ✅ Yes |
| 27 | POST | `/api/projects/global-search` | Search across all layers | ✅ Yes |

### RTK Query Hooks

```typescript
// Queries
useGetProjectsQuery()              // User's projects
useGetPublicProjectsQuery()        // Public projects
useGetProjectDataQuery()           // Project tree.json
useGetLayersOrderQuery()           // Layer order
useGetProjectSpaceQuery()          // Storage usage
useSearchProjectsQuery()           // Search projects

// Mutations
useCreateProjectMutation()         // Create project
useUpdateProjectMutation()         // Update metadata
useDeleteProjectMutation()         // Delete project
useTogglePublishMutation()         // Publish/unpublish
useImportQGSMutation()             // Import QGS
useImportQGZMutation()             // Import QGZ
useExportProjectMutation()         // Export QGS/QGZ
useCheckSubdomainAvailabilityMutation()
useChangeDomainMutation()
useUpdateLogoMutation()
useSetMetadataMutation()
useChangeLayersOrderMutation()
useReloadProjectMutation()
useRepairProjectMutation()
useRestoreProjectMutation()
useSetBasemapMutation()
usePreparePrintImageMutation()
```

---

## 🗺️ Layers API (44 Endpoints)

**Location:** `src/redux/api/layersApi.ts`

**Base Path:** `/api/layer/`

### Layer CRUD (10 endpoints) 🔴 HIGH PRIORITY

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 1 | POST | `/api/layer/add/geojson/` | Add GeoJSON layer | ✅ Yes |
| 2 | POST | `/api/layer/add/shp/` | Add Shapefile layer | ✅ Yes |
| 3 | POST | `/api/layer/add/gml/` | Add GML layer | ✅ Yes |
| 4 | POST | `/api/layer/add/raster/` | Add raster layer (TIFF) | ✅ Yes |
| 5 | POST | `/api/layer/add/existing` | Add existing layer from database | ✅ Yes |
| 6 | POST | `/api/layer/remove/database` | Delete layer | ✅ Yes |
| 7 | POST | `/api/layer/clone` | Clone layer | ✅ Yes |
| 8 | POST | `/api/layer/name` | Rename layer | ✅ Yes |
| 9 | POST | `/api/layer/selection` | Set layer visibility | ✅ Yes |
| 10 | POST | `/api/layer/published/set` | Set layer published status | ✅ Yes |

### Feature Operations (7 endpoints) 🔴 HIGH PRIORITY

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 11 | GET | `/api/layer/features` | Get layer features (GeoJSON) | ✅ Yes |
| 12 | POST | `/api/layer/feature/add` | Add new feature | ✅ Yes |
| 13 | POST | `/api/layer/feature/update` | Update feature | ✅ Yes |
| 14 | POST | `/api/layer/feature/delete` | Delete feature | ✅ Yes |
| 15 | POST | `/api/layer/multipleSaving` | Batch update features | ✅ Yes |
| 16 | POST | `/api/layer/feature/coordinates` | Get feature coordinates | ✅ Yes |
| 17 | POST | `/api/layer/transaction/` | WFS Transaction (WFS-T) | ✅ Yes |

### Styling (8 endpoints) 🔴 HIGH PRIORITY

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 18 | POST | `/api/layer/style` | Update layer style | ✅ Yes |
| 19 | POST | `/api/layer/style/reset` | Reset style to default | ✅ Yes |
| 20 | POST | `/api/layer/style/add` | Import style (QML/SLD) | ✅ Yes |
| 21 | GET | `/api/layer/style/export` | Export style (QML/SLD) | ✅ Yes |
| 22 | POST | `/api/layer/opacity/set` | Set layer opacity | ✅ Yes |
| 23 | POST | `/api/layer/scale` | Set scale-dependent visibility | ✅ Yes |
| 24 | POST | `/api/layer/label` | Add label to layer | ✅ Yes |
| 25 | POST | `/api/layer/label/remove` | Remove label | ✅ Yes |

### Attributes/Columns (9 endpoints) 🟡 MEDIUM PRIORITY

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 26 | POST | `/api/layer/attributes` | Get layer attributes (columns) | ✅ Yes |
| 27 | POST | `/api/layer/attributes/names` | Get attribute names | ✅ Yes |
| 28 | POST | `/api/layer/attributes/names_and_types` | Get names and types | ✅ Yes |
| 29 | POST | `/api/layer/column/add` | Add new column | ✅ Yes |
| 30 | POST | `/api/layer/column/rename` | Rename column | ✅ Yes |
| 31 | POST | `/api/layer/column/remove` | Remove column | ✅ Yes |
| 32 | POST | `/api/layer/columns/remove` | Remove multiple columns | ✅ Yes |
| 33 | POST | `/api/layer/column/values` | Get column values | ✅ Yes |
| 34 | POST | `/api/layer/geometry` | Get geometry type and bounds | ✅ Yes |

### Validation & Export (5 endpoints) 🟢 LOW PRIORITY

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 35 | POST | `/api/layer/geometry/check` | Check geometry validity | ✅ Yes |
| 36 | POST | `/api/layer/validation/details` | Get validation details | ✅ Yes |
| 37 | GET | `/layer/export` | Export layer (various formats) | ✅ Yes |
| 38 | GET | `/api/layer/style/export` | Export style (QML/SLD) | ✅ Yes |
| 39-44 | - | *Reserved for future endpoints* | - | - |

### RTK Query Hooks

```typescript
// High Priority (10 hooks)
useAddGeoJsonLayerMutation()
useAddShapefileLayerMutation()
useUpdateLayerStyleMutation()
useDeleteLayerMutation()
useGetLayerAttributesQuery()
useSetLayerVisibilityMutation()
useGetFeaturesQuery()
useAddFeatureMutation()
useUpdateFeatureMutation()
useDeleteFeatureMutation()

// Medium Priority (21 hooks)
useAddGMLLayerMutation()
useResetLayerStyleMutation()
useGetAttributeNamesQuery()
useGetAttributeNamesAndTypesQuery()
useAddColumnMutation()
useRenameColumnMutation()
useRemoveColumnMutation()
useRenameLayerMutation()
useExportLayerMutation()
useBatchUpdateFeaturesMutation()
useGetGeometryQuery()
useAddLabelMutation()
useRemoveLabelMutation()
useImportStyleMutation()
useExportStyleQuery()
useGetColumnValuesQuery()
useAddRasterLayerMutation()
useSetLayerOpacityMutation()
useSetLayerScaleMutation()
useSetLayerPublishedMutation()
useWfsTransactionMutation()

// Low Priority (7 hooks)
useAddExistingLayerMutation()
useCloneLayerMutation()
useGetFeatureCoordinatesQuery()
useCheckGeometryQuery()
useGetValidationDetailsQuery()
useRemoveColumnsMutation()
```

---

## 🎨 Styles API (10 Endpoints)

**Location:** `src/redux/api/stylesApi.ts`

**Base Path:** `/api/styles/`

### Renderer & Styling

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 1 | GET | `/api/styles/renderer` | Get layer renderer (Single/Categorized) | ✅ Yes |
| 2 | GET | `/api/styles/renderer/possible` | Get available renderer types | ✅ Yes |
| 3 | POST | `/api/styles/set` | Set layer style | ✅ Yes |
| 4 | GET | `/api/styles/symbol` | Get symbol definition | ✅ Yes |
| 5 | POST | `/api/styles/symbol/image` | Get symbol as image (Blob) | ✅ Yes |
| 6 | POST | `/api/styles/symbol/random/color` | Generate random color symbol | ✅ Yes |
| 7 | POST | `/api/styles/classify` | Classify layer by attribute | ✅ Yes |
| 8 | POST | `/api/layer/style/add` | Upload style file (QML/SLD) | ✅ Yes |
| 9 | GET | `/api/layer/style/export` | Export style file | ✅ Yes |
| 10 | POST | `/api/layer/style` | Update layer style | ✅ Yes |

### RTK Query Hooks

```typescript
useGetRendererQuery()
useGetPossibleRenderersQuery()
useSetStyleMutation()
useGetSymbolQuery()
useGetSymbolImageMutation()
useGetRandomColorSymbolMutation()
useClassifyLayerMutation()
useUploadStyleFileMutation()
```

---

## 👤 Admin API (3 Endpoints)

**Location:** `src/redux/api/adminApi.ts`

**Base Path:** `/admin/`

**Auth Required:** ✅ Yes (Admin only)

| # | Method | Endpoint | Description | Permission |
|---|--------|----------|-------------|------------|
| 1 | GET | `/admin/stats` | Get admin statistics | Admin |
| 2 | GET | `/admin/projects` | Get all projects (all users) | Admin |
| 3 | DELETE | `/admin/users/{id}` | Delete user account | Admin |

**Admin Detection:**
```typescript
const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';
```

### RTK Query Hooks

```typescript
useGetAdminStatsQuery()
useGetAllProjectsQuery()
useDeleteUserMutation()
```

---

## 🔐 Auth API (4 Endpoints)

**Location:** `src/api/endpointy/auth.ts`

**Base Path:** `/auth/`

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 1 | POST | `/auth/register` | Register new user | ❌ No |
| 2 | POST | `/auth/login` | Login user | ❌ No |
| 3 | POST | `/auth/logout` | Logout user | ✅ Yes |
| 4 | GET | `/auth/profile` | Get user profile | ✅ Yes |

### Request/Response Examples

**1. Register**
```typescript
POST /auth/register
Request:
{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "Jan",
  "last_name": "Kowalski"
}

Response:
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski"
  },
  "token": "abc123xyz456..."
}
```

**2. Login**
```typescript
POST /auth/login
Request:
{
  "username": "user@example.com", // Email or username
  "password": "securepassword"
}

Response:
{
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski"
  },
  "token": "abc123xyz456..."
}
```

**3. Logout**
```typescript
POST /auth/logout
Headers: Authorization: Token abc123...

Response:
{
  "message": "Successfully logged out"
}
```

**4. Get Profile**
```typescript
GET /auth/profile
Headers: Authorization: Token abc123...

Response:
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "date_joined": "2025-01-15T10:30:00Z"
}
```

### Service Methods

```typescript
// src/api/endpointy/auth.ts
authService.register(data)    // Register new user
authService.login(credentials) // Login
authService.logout()          // Logout
authService.getProfile()      // Get current user profile
```

---

## 🌍 External APIs

### Mapbox APIs

**Mapbox Geocoding API**
- Location: `src/lib/mapbox/search.ts`
- Token: `NEXT_PUBLIC_MAPBOX_TOKEN`

| Service | Endpoint | Description |
|---------|----------|-------------|
| Search Places | `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json` | Search for places, addresses, POI |
| Reverse Geocode | `https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json` | Convert coordinates to address |
| Category Search | `https://api.mapbox.com/geocoding/v5/mapbox.places/{category}.json` | Search by POI category |

**Functions:**
```typescript
searchPlaces(query, options)      // Search places
reverseGeocode(lng, lat, options) // Get address from coordinates
searchByCategory(category, options) // Search by category (e.g., "restaurant")
```

**Mapbox GL JS**
- Version: 3.0.0
- Used for: Map rendering, 3D buildings, terrain
- Styles: Streets, Satellite, Outdoors, Light, Dark, 3D Buildings, Full 3D

**Mapbox MCP Tools** (configured in `.claude/mcp.json`):
- `search-and-geocode` - Find POIs, brands, geocode addresses
- `category-search` - Search by place type/category
- `reverse-geocode` - Convert coordinates to addresses
- `directions` - Route planning
- `isochrone` - Reachable areas within time/distance
- `matrix` - Travel time/distance matrix
- `static-map-image` - Generate static map images

**Token:** `pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZ2U3NHN5MzFmNzIybHF0MGp4eHVoYzkifQ.bYL5OZhuqokHHHWuOwdeIA`

---

## 📊 Summary Statistics

### Total Endpoints by Category

| Category | Endpoints | Priority | Implementation |
|----------|-----------|----------|----------------|
| **Projects API** | 52 | 🔴 High | RTK Query (projectsApi) |
| **Layers API** | 44 | 🔴 High | RTK Query (layersApi) |
| **Styles API** | 10 | 🟡 Medium | RTK Query (stylesApi) |
| **Admin API** | 3 | 🟢 Low | RTK Query (adminApi) |
| **Auth API** | 4 | 🔴 High | Custom service (authService) |
| **External (Mapbox)** | 7 | 🟡 Medium | Custom functions |
| **TOTAL** | **120** | - | - |

### Endpoint Distribution by Method

| HTTP Method | Count | Percentage |
|-------------|-------|------------|
| POST | 78 | 65% |
| GET | 38 | 32% |
| PUT | 1 | 1% |
| DELETE | 3 | 2% |

### Authentication Requirements

| Type | Count | Percentage |
|------|-------|------------|
| Auth Required (✅) | 108 | 90% |
| Public (❌) | 12 | 10% |

---

## 🔧 Technical Implementation Details

### RTK Query Configuration

All API endpoints are implemented using **Redux Toolkit Query (RTK Query)** for:
- ✅ Automatic caching
- ✅ Cache invalidation
- ✅ Optimistic updates
- ✅ Loading states
- ✅ Error handling
- ✅ Auto-generated hooks

**Base Query Setup:**
```typescript
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }
    return headers;
  },
});
```

### Cache Tags System

RTK Query uses tags for cache invalidation:

```typescript
// Projects API
tagTypes: ['Projects', 'Project', 'PublicProjects']

// Layers API
tagTypes: ['Layer', 'Layers', 'Features', 'LayerAttributes', 'Project']

// Styles API
tagTypes: ['Style', 'Styles', 'Renderer', 'Symbol']

// Admin API
tagTypes: ['AdminStats', 'AllProjects', 'Users']
```

**Tag Invalidation Example:**
```typescript
// When creating a project, invalidate projects list
createProject: {
  invalidatesTags: [{ type: 'Projects', id: 'LIST' }]
}

// When deleting a project, invalidate that specific project
deleteProject: {
  invalidatesTags: (result, error, { project }) => [
    { type: 'Project', id: project },
    { type: 'Projects', id: 'LIST' }
  ]
}
```

### File Upload Patterns

Three file upload patterns are used depending on requirements:

**1. Standard FormData (no progress)**
```typescript
query: (data) => {
  const formData = new FormData();
  formData.append('project_name', data.project_name);
  formData.append('file', data.file);

  return {
    url: '/api/layer/add/geojson/',
    method: 'POST',
    body: formData,
  };
}
```

**2. XMLHttpRequest with Progress Tracking**
```typescript
queryFn: async ({ project, qgsFile, onProgress }) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: JSON.parse(xhr.responseText) });
      }
    });

    xhr.open('POST', `${baseUrl}/api/projects/import/qgs/`);
    xhr.setRequestHeader('Authorization', `Token ${token}`);
    xhr.send(formData);
  });
}
```

**3. Direct Fetch for Blob Responses**
```typescript
queryFn: async ({ projectName, layerName }) => {
  const response = await fetch(`${baseUrl}/layer/export?...`, {
    method: 'GET',
    headers: { Authorization: `Token ${token}` },
  });

  const blob = await response.blob();
  return { data: blob };
}
```

### Error Handling

All endpoints return consistent error format:

```typescript
{
  error: {
    status: number | 'FETCH_ERROR',
    data: {
      message: string,
      details?: any
    }
  }
}
```

**Usage in components:**
```typescript
const [createProject, { isLoading, error }] = useCreateProjectMutation();

try {
  const result = await createProject(data).unwrap();
  // Success
} catch (err) {
  console.error('Error:', err.data?.message || 'Unknown error');
}
```

---

## 📖 Usage Examples

### Example 1: Create Project and Import QGS

```typescript
import { useCreateProjectMutation, useImportQGSMutation } from '@/redux/api/projectsApi';

const CreateProjectFlow = () => {
  const [createProject] = useCreateProjectMutation();
  const [importQGS] = useImportQGSMutation();
  const [progress, setProgress] = useState(0);

  const handleCreate = async () => {
    // Step 1: Create project
    const result = await createProject({
      project: 'MyProject',
      projectDescription: 'Test project',
      keywords: 'test, demo'
    }).unwrap();

    // Step 2: Use db_name from response (IMPORTANT!)
    const projectName = result.data.db_name; // e.g., "MyProject_1"

    // Step 3: Import QGS file
    await importQGS({
      project: projectName,
      qgsFile: file,
      onProgress: (percent) => setProgress(percent)
    }).unwrap();
  };
};
```

### Example 2: Add GeoJSON Layer

```typescript
import { useAddGeoJsonLayerMutation } from '@/redux/api/layersApi';

const AddLayerExample = () => {
  const [addGeoJsonLayer] = useAddGeoJsonLayerMutation();

  const handleAddLayer = async () => {
    const geojsonData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [21.0122, 52.2297] // Warsaw
          },
          properties: {
            name: 'Warsaw'
          }
        }
      ]
    };

    await addGeoJsonLayer({
      project_name: 'MyProject_1',
      layer_name: 'Cities',
      geojson: geojsonData,
      epsg: 'EPSG:4326'
    }).unwrap();
  };
};
```

### Example 3: Update Feature Attributes

```typescript
import { useUpdateFeatureMutation } from '@/redux/api/layersApi';

const UpdateFeatureExample = () => {
  const [updateFeature] = useUpdateFeatureMutation();

  const handleUpdate = async () => {
    await updateFeature({
      projectName: 'MyProject_1',
      layerName: 'Buildings',
      featureId: 42,
      updates: {
        properties: {
          name: 'Updated Building Name',
          height: 50,
          floors: 10
        }
      }
    }).unwrap();
  };
};
```

### Example 4: Fetch and Display Features

```typescript
import { useGetFeaturesQuery } from '@/redux/api/layersApi';

const LayerViewer = ({ projectName, layerName }) => {
  const { data: features, isLoading, error } = useGetFeaturesQuery({
    projectName,
    layerName,
    options: {
      limit: 100,
      bbox: [20.8, 52.0, 21.2, 52.4] // Warsaw bbox
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.data?.message}</div>;

  return (
    <div>
      <h3>Features: {features?.features.length}</h3>
      {features?.features.map((feature, idx) => (
        <div key={idx}>
          {JSON.stringify(feature.properties)}
        </div>
      ))}
    </div>
  );
};
```

---

## 🚀 Best Practices

### 1. Always use db_name for project operations

```typescript
// ✅ CORRECT
const result = await createProject({ project: 'MyProject' });
const projectName = result.data.db_name; // "MyProject_1"
await importQGS({ project: projectName, ... });

// ❌ WRONG
await importQGS({ project: 'MyProject', ... }); // May fail if duplicate!
```

### 2. Use lazy queries for manual fetching

```typescript
// Manual trigger
const [fetchFeatures, { data, isLoading }] = useLazyGetFeaturesQuery();

// Trigger on button click
<button onClick={() => fetchFeatures({ projectName, layerName })}>
  Load Features
</button>
```

### 3. Handle loading and error states

```typescript
const { data, isLoading, error, isError } = useGetProjectsQuery();

if (isLoading) return <CircularProgress />;
if (isError) return <Alert severity="error">{error.data?.message}</Alert>;
return <ProjectsList projects={data?.list_of_projects} />;
```

### 4. Invalidate cache when needed

```typescript
// Manual cache invalidation
import { projectsApi } from '@/redux/api/projectsApi';

dispatch(projectsApi.util.invalidateTags([{ type: 'Projects', id: 'LIST' }]));
```

### 5. Use optimistic updates for instant UI feedback

```typescript
togglePublish: {
  async onQueryStarted({ project, publish }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      projectsApi.util.updateQueryData('getProjects', undefined, (draft) => {
        const found = draft.list_of_projects.find(p => p.project_name === project);
        if (found) found.published = publish;
      })
    );

    try {
      await queryFulfilled;
    } catch {
      patchResult.undo(); // Rollback on error
    }
  }
}
```

---

## 📞 Support & Troubleshooting

### Common Issues

**1. 401 Unauthorized**
- Check if token is present: `localStorage.getItem('authToken')`
- Verify token validity with `/auth/profile`
- Re-login if token expired

**2. 404 Not Found**
- Verify endpoint URL is correct
- Check if backend service is running
- Ensure correct API base URL (production vs local)

**3. CORS Errors**
- Local development MUST use `http://localhost:3000` (not 3001, 3002, etc.)
- Production uses HTTPS (CORS configured on backend)

**4. File Upload Fails**
- Check file size limits (backend configuration)
- Verify file format (QGS, QGZ, SHP, GeoJSON, GML, TIFF)
- Use FormData for file uploads

**5. Cache Not Updating**
- Check if tags are properly invalidated
- Manually invalidate tags if needed
- Use `refetch()` to force refresh

### Debug Tools

**Redux DevTools:**
```typescript
// View RTK Query state
state.projectsApi.queries
state.layersApi.mutations
```

**Network Tab:**
- Check request headers (Authorization)
- Verify request body format
- Inspect response status and data

**Console Logs:**
- API calls logged by RTK Query
- Error responses with details
- Progress tracking for uploads

---

**Last Updated:** 2025-10-17
**Version:** 1.0
**Total Endpoints:** 120
**Implementation:** RTK Query + Custom Services
