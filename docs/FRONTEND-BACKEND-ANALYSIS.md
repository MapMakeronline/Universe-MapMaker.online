# Frontend-Backend Communication Analysis
**Generated:** 2025-10-11
**Purpose:** Complete audit of all frontend-backend connections

---

## Executive Summary

This document provides a comprehensive analysis of ALL frontend-backend connections in the Universe MapMaker application. It identifies:

1. ✅ **Correctly implemented endpoints** - Working as expected
2. ⚠️ **Potentially problematic patterns** - May cause issues
3. ❌ **Missing or incorrect implementations** - Need fixes
4. 📝 **Recommendations** - Improvements and best practices

---

## Table of Contents

1. [API Architecture Overview](#api-architecture-overview)
2. [RTK Query APIs](#rtk-query-apis)
3. [Legacy API Services](#legacy-api-services)
4. [Component-Level Analysis](#component-level-analysis)
5. [Endpoint Coverage Matrix](#endpoint-coverage-matrix)
6. [Issues & Recommendations](#issues--recommendations)

---

## API Architecture Overview

### Current API Layers

```
┌─────────────────────────────────────────────────┐
│         Components (React)                      │
├─────────────────────────────────────────────────┤
│   RTK Query Hooks          Legacy Services      │
│   - useGetProjectsQuery    - unifiedProjectsApi │
│   - useCreateProjectMutation - layersApi        │
│   - useTogglePublishMutation - authService      │
├─────────────────────────────────────────────────┤
│             RTK Query APIs                      │
│   - projectsApi (RTK)                           │
│   - adminApi (RTK)                              │
├─────────────────────────────────────────────────┤
│         Unified API Services                    │
│   - unifiedProjectsApi                          │
│   - layersApi                                   │
│   - authService                                 │
│   - unifiedUserApi                              │
├─────────────────────────────────────────────────┤
│            apiClient (HTTP)                     │
│   Base URL: NEXT_PUBLIC_API_URL                 │
│   Auth: Token {token}                           │
└─────────────────────────────────────────────────┘
```

### Dual API System Issues

**CRITICAL FINDING:** The application currently has **TWO parallel API systems**:

1. **RTK Query** (`src/redux/api/`) - Modern, with caching and auto-refetch
2. **Legacy Services** (`src/api/endpointy/`) - Manual fetch with apiClient

**Problem:** Components mix both approaches, leading to:
- ❌ Cache invalidation issues
- ❌ Duplicate API logic
- ❌ Inconsistent error handling
- ❌ State management conflicts

**Recommendation:** Migrate ALL endpoints to RTK Query and deprecate legacy services.

---

## RTK Query APIs

### 1. projectsApi (`src/redux/api/projectsApi.ts`)

**Status:** ✅ Modern RTK Query implementation
**Base URL:** `process.env.NEXT_PUBLIC_API_URL` (https://api.universemapmaker.online)

#### Endpoints Implemented

| Endpoint | Method | Backend Path | Status | Notes |
|----------|--------|--------------|--------|-------|
| `getProjects` | GET | `/dashboard/projects/` | ✅ Working | Auto-refetch on mount |
| `getPublicProjects` | GET | `/dashboard/projects/public/` | ✅ Working | Transforms response format |
| `getProjectData` | GET | `/api/projects/new/json` | ✅ Working | Used by MapPage |
| `createProject` | POST | `/api/projects/create/` | ✅ Fixed | Returns db_name in data field |
| `updateProject` | PUT | `/dashboard/projects/update/` | ✅ Working | Invalidates cache |
| `deleteProject` | POST | `/api/projects/remove/` | ✅ Working | Supports permanent delete |
| `togglePublish` | POST | `/api/projects/publish` | ⚠️ Backend bug | Returns 500 but succeeds |
| `exportProject` | POST | `/api/projects/export` | ✅ Working | Returns Blob for download |
| `importQGS` | POST | `/api/projects/import/qgs/` | ✅ Working | Custom queryFn with progress |
| `checkSubdomainAvailability` | POST | `/api/projects/subdomainAvailability` | ✅ Working | - |
| `changeDomain` | POST | `/api/projects/domain/change` | ✅ Working | - |

#### Cache Invalidation Tags

```typescript
tagTypes: ['Projects', 'Project', 'PublicProjects']

// Example invalidation:
invalidatesTags: (result, error, arg) => [
  { type: 'Project', id: arg.project },
  { type: 'Projects', id: 'LIST' },
  { type: 'PublicProjects', id: 'LIST' },
]
```

#### Critical Issues Found

**Issue #1: togglePublish Backend Bug**
```typescript
// Location: ProjectSettingsDialog.tsx:122-156
// Problem: Backend returns 500 error even on success
// Workaround: Optimistic update + catch block treats errors as success
try {
  await togglePublish({ project, publish: targetStatus }).unwrap();
  setIsPublished(targetStatus); // ✅
} catch (error) {
  // Backend bug: 500 error but operation succeeds
  setIsPublished(targetStatus); // ⚠️ Optimistic
  console.warn('Publish API returned error but operation may have succeeded');
}
```

**Recommendation:** Fix backend to return 200 on success, remove workaround.

**Issue #2: importQGS Progress Tracking**
```typescript
// Location: projectsApi.ts:300-399
// Uses custom queryFn with XMLHttpRequest for upload progress
// ✅ CORRECT: Custom implementation needed for progress callbacks
// No issues found
```

---

### 2. adminApi (`src/redux/api/adminApi.ts`)

**Status:** ✅ RTK Query implementation for admin features
**Base URL:** Same as projectsApi

#### Endpoints Implemented

| Endpoint | Method | Backend Path | Status | Notes |
|----------|--------|--------------|--------|-------|
| `getAdminStats` | GET | `/api/admin-stats/stats` | ⚠️ Untested | Admin panel only |
| `getAllProjects` | GET | `/dashboard/projects/` | ✅ Working | Transforms for admin view |
| `updateUserLicense` | PATCH | `/api/admin-stats/users/{id}/license` | ⚠️ Untested | Admin panel only |
| `deleteUser` | DELETE | `/api/admin-stats/users/{id}/delete` | ⚠️ Untested | Admin panel only |

**Note:** Admin endpoints not currently used in production UI.

---

## Legacy API Services

### 1. unifiedProjectsApi (`src/api/endpointy/unified-projects.ts`)

**Status:** ⚠️ Legacy - Should be migrated to RTK Query
**Lines of Code:** 407

#### Duplicate Endpoints (Also in RTK Query)

| Method | Backend Path | RTK Query Equivalent | Action |
|--------|--------------|---------------------|--------|
| `getProjects()` | `/dashboard/projects/` | `useGetProjectsQuery` | ❌ DELETE |
| `getPublicProjects()` | `/dashboard/projects/public/` | `useGetPublicProjectsQuery` | ❌ DELETE |
| `getProjectData()` | `/dashboard/projects/{name}/` | `useGetProjectDataQuery` | ❌ DELETE |
| `createProject()` | `/dashboard/projects/create/` | `useCreateProjectMutation` | ❌ DELETE |
| `updateProject()` | `/dashboard/projects/update/` | `useUpdateProjectMutation` | ❌ DELETE |
| `deleteProject()` | `/dashboard/projects/delete/` | `useDeleteProjectMutation` | ❌ DELETE |
| `togglePublish()` | `/api/projects/publish` | `useTogglePublishMutation` | ❌ DELETE |
| `exportProject()` | `/api/projects/export` | `useExportProjectMutation` | ❌ DELETE |

#### Unique Endpoints (Not in RTK Query)

| Method | Backend Path | Status | Action |
|--------|--------------|--------|--------|
| `importQGS()` | `/api/projects/import/qgs/` | ✅ In RTK Query | ❌ DELETE |
| `importQGZ()` | `/api/projects/import/qgz/` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `updateLogo()` | `/api/projects/logo/update/` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `setMetadata()` | `/api/projects/metadata` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `getThumbnailUrl()` | Helper method | ✅ Keep | ✅ Keep as helper |
| `checkSubdomainAvailability()` | `/api/projects/subdomainAvailability` | ✅ In RTK Query | ❌ DELETE |
| `changeDomain()` | `/api/projects/domain/change` | ✅ In RTK Query | ❌ DELETE |
| `getLayersOrder()` | `/api/projects/order` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `changeLayersOrder()` | `/api/projects/tree/order` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `getProjectSpace()` | `/api/projects/space/get` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `searchProjects()` | `/api/projects/search` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `reloadProject()` | `/api/projects/reload` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `repairProject()` | `/api/projects/repair` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `restoreProject()` | `/api/projects/restore` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `setBasemap()` | `/api/projects/basemap/set` | ⚠️ Not in RTK | ✅ Migrate to RTK |
| `preparePrintImage()` | `/api/projects/print` | ⚠️ Not in RTK | ✅ Migrate to RTK |

**Action Plan:**
1. Migrate 15 unique endpoints from unifiedProjectsApi to RTK Query
2. Delete 8 duplicate methods
3. Keep `getThumbnailUrl()` as utility helper

---

### 2. layersApi (`src/api/endpointy/layers.ts`)

**Status:** ⚠️ Legacy - Entire service needs RTK Query migration
**Lines of Code:** 517

#### All Endpoints (None in RTK Query)

| Method | Backend Path | Used By | Priority |
|--------|--------------|---------|----------|
| `addGeoJsonLayer()` | `/api/layer/add/geojson/` | FeatureEditor | 🔴 High |
| `addShapefileLayer()` | `/api/layer/add/shp/` | AddDatasetModal | 🔴 High |
| `addGMLLayer()` | `/api/layer/add/gml/` | AddDatasetModal | 🟡 Medium |
| `addExistingLayer()` | `/api/layer/add/existing` | - | 🟢 Low |
| `updateLayerStyle()` | `/api/layer/style` | LayerProperties | 🔴 High |
| `resetLayerStyle()` | `/api/layer/style/reset` | LayerProperties | 🟡 Medium |
| `deleteLayer()` | `/api/layer/remove/database` | LayerTree | 🔴 High |
| `getLayerAttributes()` | `/api/layer/attributes` | FeatureEditor | 🔴 High |
| `getAttributeNames()` | `/api/layer/attributes/names` | - | 🟡 Medium |
| `getAttributeNamesAndTypes()` | `/api/layer/attributes/names_and_types` | - | 🟡 Medium |
| `addColumn()` | `/api/layer/column/add` | - | 🟡 Medium |
| `renameColumn()` | `/api/layer/column/rename` | - | 🟡 Medium |
| `removeColumn()` | `/api/layer/column/remove` | - | 🟡 Medium |
| `setLayerVisibility()` | `/api/layer/selection` | LayerTree | 🔴 High |
| `renameLayer()` | `/api/layer/name` | - | 🟡 Medium |
| `cloneLayer()` | `/api/layer/clone` | - | 🟢 Low |
| `exportLayer()` | `/layer/export` | - | 🟡 Medium |
| `getFeatures()` | `/api/layer/features` | MapContainer | 🔴 High |
| `addFeature()` | `/api/layer/feature/add` | DrawingTools | 🔴 High |
| `updateFeature()` | `/api/layer/feature/update` | FeatureEditor | 🔴 High |
| `deleteFeature()` | `/api/layer/feature/delete` | FeatureEditor | 🔴 High |
| `batchUpdateFeatures()` | `/api/layer/multipleSaving` | - | 🟡 Medium |
| `getFeatureCoordinates()` | `/api/layer/feature/coordinates` | - | 🟢 Low |
| `getGeometry()` | `/api/layer/geometry` | - | 🟡 Medium |
| `checkGeometry()` | `/api/layer/geometry/check` | - | 🟢 Low |
| `getValidationDetails()` | `/api/layer/validation/details` | - | 🟢 Low |
| `addLabel()` | `/api/layer/label` | - | 🟡 Medium |
| `removeLabel()` | `/api/layer/label/remove` | - | 🟡 Medium |
| `getColumnValues()` | `/api/layer/column/values` | - | 🟡 Medium |

**Action Plan:**
1. Create `src/redux/api/layersApi.ts` with RTK Query
2. Migrate 🔴 High priority endpoints first (9 endpoints)
3. Then 🟡 Medium priority (14 endpoints)
4. Finally 🟢 Low priority (6 endpoints)
5. Delete legacy `src/api/endpointy/layers.ts`

---

### 3. authService (`src/api/endpointy/auth.ts`)

**Status:** ⚠️ Legacy - Should be migrated to RTK Query
**Lines of Code:** 90

#### Endpoints

| Method | Backend Path | Used By | Action |
|--------|--------------|---------|--------|
| `register()` | `/auth/register` | RegisterPage | ✅ Migrate to RTK |
| `login()` | `/auth/login` | LoginPage | ✅ Migrate to RTK |
| `logout()` | `/auth/logout` | DashboardLayout | ✅ Migrate to RTK |
| `getProfile()` | `/auth/profile` | UserSettings | ✅ Migrate to RTK |

**Action Plan:**
1. Create `src/redux/api/authApi.ts`
2. Migrate all 4 endpoints
3. Update authSlice to use RTK Query hooks
4. Delete legacy authService

---

### 4. unifiedUserApi (`src/api/endpointy/unified-user.ts`)

**Status:** ⚠️ Legacy - Should be migrated to RTK Query
**Lines of Code:** 89

#### Endpoints

| Method | Backend Path | Used By | Action |
|--------|--------------|---------|--------|
| `getProfile()` | `/dashboard/profile/` | UserSettings | ✅ Migrate to RTK |
| `updateProfile()` | `/dashboard/settings/profile/` | UserSettings | ✅ Migrate to RTK |
| `changePassword()` | `/dashboard/settings/password/` | UserSettings | ✅ Migrate to RTK |
| `sendContactForm()` | `/dashboard/contact/` | ContactForm | ✅ Migrate to RTK |

**Action Plan:**
1. Create `src/redux/api/userApi.ts`
2. Migrate all 4 endpoints
3. Delete legacy unifiedUserApi

---

## Component-Level Analysis

### Dashboard Components

#### OwnProjects.tsx

**RTK Query Hooks Used:**
```typescript
const { data, isLoading, error, refetch } = useGetProjectsQuery();
const [createProject] = useCreateProjectMutation();
const [deleteProject] = useDeleteProjectMutation();
const [togglePublish] = useTogglePublishMutation();
const [importQGS] = useImportQGSMutation();
```

**Legacy API Used:**
```typescript
import { unifiedProjectsApi as projectsApi } from '@/api/endpointy/unified-projects';

// Line 274: getThumbnailUrl helper (✅ OK - not a fetch call)
const thumbnailUrl = projectsApi.getThumbnailUrl(project.project_name);
```

**Status:** ✅ Correct - Only uses RTK Query for data fetching

---

#### PublicProjects.tsx

**RTK Query Hooks Used:**
```typescript
const { data: projectsData, isLoading, error } = useGetPublicProjectsQuery(undefined, {
  pollingInterval: 60000,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
});
```

**Legacy API Used:** None

**Status:** ✅ Perfect - 100% RTK Query

---

#### ProjectSettingsDialog.tsx

**RTK Query Hooks Used:**
```typescript
const [togglePublish, { isLoading: isTogglingPublish }] = useTogglePublishMutation();
const [changeDomain, { isLoading: isChangingDomain }] = useChangeDomainMutation();
const [checkSubdomainAvailability] = useCheckSubdomainAvailabilityMutation();
const [exportProject, { isLoading: isExporting }] = useExportProjectMutation();
```

**Legacy API Used:** None

**Status:** ✅ Perfect - 100% RTK Query

---

### Map Components

#### MapPage (`app/map/page.tsx`)

**RTK Query Hooks Used:**
```typescript
const { data: projectData, isLoading, error, isError } = useGetProjectDataQuery(
  { project: projectName || '', published: false },
  { skip: !projectName }
);
```

**Legacy API Used:** None

**Status:** ✅ Perfect - 100% RTK Query

---

#### FeatureEditor.tsx

**Legacy API Used:**
```typescript
import { layersApi } from '@/api/endpointy/layers';

// Lines using layersApi:
await layersApi.addFeature(projectName, layerName, feature);
await layersApi.updateFeature(projectName, layerName, featureId, updates);
await layersApi.deleteFeature(projectName, layerName, featureId);
await layersApi.getLayerAttributes(projectName, layerName);
```

**Status:** ❌ Needs RTK Query migration

---

### Authentication Components

#### LoginPage (`app/login/page.tsx`)

**Legacy API Used:**
```typescript
import { authService } from '@/api/endpointy/auth';

// Line 58
const response = await authService.login({
  username: formData.usernameOrEmail,
  password: formData.password,
});
```

**Status:** ❌ Needs RTK Query migration

---

## Endpoint Coverage Matrix

### Projects Endpoints

| Backend Endpoint | RTK Query | Legacy Service | Components Using | Status |
|-----------------|-----------|----------------|------------------|--------|
| `GET /dashboard/projects/` | ✅ | ✅ | OwnProjects | ⚠️ Duplicate |
| `GET /dashboard/projects/public/` | ✅ | ✅ | PublicProjects | ⚠️ Duplicate |
| `GET /api/projects/new/json` | ✅ | - | MapPage | ✅ OK |
| `POST /api/projects/create/` | ✅ | ✅ | OwnProjects | ⚠️ Duplicate |
| `PUT /dashboard/projects/update/` | ✅ | ✅ | - | ⚠️ Duplicate |
| `POST /api/projects/remove/` | ✅ | ✅ | OwnProjects | ⚠️ Duplicate |
| `POST /api/projects/publish` | ✅ | ✅ | ProjectSettings | ⚠️ Duplicate |
| `POST /api/projects/export` | ✅ | ✅ | ProjectSettings | ⚠️ Duplicate |
| `POST /api/projects/import/qgs/` | ✅ | ✅ | OwnProjects | ⚠️ Duplicate |
| `POST /api/projects/import/qgz/` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/logo/update/` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/metadata` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/subdomainAvailability` | ✅ | ✅ | ProjectSettings | ⚠️ Duplicate |
| `POST /api/projects/domain/change` | ✅ | ✅ | ProjectSettings | ⚠️ Duplicate |
| `POST /api/projects/order` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/tree/order` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/space/get` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/search` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/reload` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/repair` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/restore` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/basemap/set` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/projects/print` | ❌ | ✅ | - | ❌ Missing RTK |

**Summary:**
- ✅ RTK Query: 11 endpoints
- ⚠️ Duplicates: 8 endpoints
- ❌ Missing: 12 endpoints
- **Total:** 23 project-related endpoints

---

### Layers Endpoints

| Backend Endpoint | RTK Query | Legacy Service | Components Using | Status |
|-----------------|-----------|----------------|------------------|--------|
| `POST /api/layer/add/geojson/` | ❌ | ✅ | FeatureEditor | ❌ Missing RTK |
| `POST /api/layer/add/shp/` | ❌ | ✅ | AddDatasetModal | ❌ Missing RTK |
| `POST /api/layer/add/gml/` | ❌ | ✅ | AddDatasetModal | ❌ Missing RTK |
| `POST /api/layer/add/existing` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/style` | ❌ | ✅ | LayerProperties | ❌ Missing RTK |
| `POST /api/layer/style/reset` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/remove/database` | ❌ | ✅ | LayerTree | ❌ Missing RTK |
| `POST /api/layer/attributes` | ❌ | ✅ | FeatureEditor | ❌ Missing RTK |
| `POST /api/layer/attributes/names` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/attributes/names_and_types` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/column/add` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/column/rename` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/column/remove` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/selection` | ❌ | ✅ | LayerTree | ❌ Missing RTK |
| `POST /api/layer/name` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/clone` | ❌ | ✅ | - | ❌ Missing RTK |
| `GET /layer/export` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/features` | ❌ | ✅ | MapContainer | ❌ Missing RTK |
| `POST /api/layer/feature/add` | ❌ | ✅ | DrawingTools | ❌ Missing RTK |
| `POST /api/layer/feature/update` | ❌ | ✅ | FeatureEditor | ❌ Missing RTK |
| `POST /api/layer/feature/delete` | ❌ | ✅ | FeatureEditor | ❌ Missing RTK |
| `POST /api/layer/multipleSaving` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/feature/coordinates` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/geometry` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/geometry/check` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/validation/details` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/label` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/label/remove` | ❌ | ✅ | - | ❌ Missing RTK |
| `POST /api/layer/column/values` | ❌ | ✅ | - | ❌ Missing RTK |

**Summary:**
- ✅ RTK Query: 0 endpoints
- ❌ Missing: 29 endpoints
- **Total:** 29 layer-related endpoints

---

### Authentication Endpoints

| Backend Endpoint | RTK Query | Legacy Service | Components Using | Status |
|-----------------|-----------|----------------|------------------|--------|
| `POST /auth/register` | ❌ | ✅ | RegisterPage | ❌ Missing RTK |
| `POST /auth/login` | ❌ | ✅ | LoginPage | ❌ Missing RTK |
| `POST /auth/logout` | ❌ | ✅ | DashboardLayout | ❌ Missing RTK |
| `GET /auth/profile` | ❌ | ✅ | UserSettings | ❌ Missing RTK |

**Summary:**
- ✅ RTK Query: 0 endpoints
- ❌ Missing: 4 endpoints
- **Total:** 4 auth-related endpoints

---

### User Settings Endpoints

| Backend Endpoint | RTK Query | Legacy Service | Components Using | Status |
|-----------------|-----------|----------------|------------------|--------|
| `GET /dashboard/profile/` | ❌ | ✅ | UserSettings | ❌ Missing RTK |
| `PUT /dashboard/settings/profile/` | ❌ | ✅ | UserSettings | ❌ Missing RTK |
| `PUT /dashboard/settings/password/` | ❌ | ✅ | UserSettings | ❌ Missing RTK |
| `POST /dashboard/contact/` | ❌ | ✅ | ContactForm | ❌ Missing RTK |

**Summary:**
- ✅ RTK Query: 0 endpoints
- ❌ Missing: 4 endpoints
- **Total:** 4 user-related endpoints

---

## Issues & Recommendations

### Critical Issues

#### 1. Dual API System

**Problem:**
- RTK Query and Legacy Services coexist
- Components can use either approach
- No clear migration strategy

**Impact:**
- Cache invalidation doesn't work across systems
- Duplicate code (RTK + Legacy for same endpoint)
- Inconsistent error handling
- Confusing for developers

**Recommendation:**
```
Priority: 🔴 CRITICAL
Timeline: 2-3 weeks

Phase 1: Layers API (1 week)
- Create src/redux/api/layersApi.ts
- Migrate 9 high-priority endpoints
- Update FeatureEditor, DrawingTools, LayerTree

Phase 2: Auth & User API (3 days)
- Create src/redux/api/authApi.ts
- Create src/redux/api/userApi.ts
- Update LoginPage, RegisterPage, UserSettings

Phase 3: Projects API Completion (1 week)
- Add 12 missing endpoints to projectsApi
- Remove duplicates from unifiedProjectsApi
- Delete legacy service files

Phase 4: Cleanup (2 days)
- Remove all legacy service files
- Update imports in all components
- Test all features
```

---

#### 2. Backend Bug: togglePublish Returns 500

**Problem:**
```typescript
// Backend returns 500 Internal Server Error even on success
POST /api/projects/publish
Response: { status: 500, error: "..." }
// But project IS published in database!
```

**Current Workaround:**
```typescript
// ProjectSettingsDialog.tsx:122-156
try {
  await togglePublish({ project, publish: true }).unwrap();
  setIsPublished(true); // Success path
} catch (error) {
  // Backend bug: treat error as success
  setIsPublished(true); // ⚠️ Optimistic
  console.warn('Publish API returned error but operation may have succeeded');
}
```

**Recommendation:**
```
Priority: 🔴 HIGH
Owner: Backend Team

1. Fix backend endpoint to return:
   - 200 OK on success
   - Proper error response on failure
2. Remove workaround from frontend
3. Add proper error handling
```

---

#### 3. Missing Cache Invalidation for Layers

**Problem:**
```typescript
// When layer is added, updated, or deleted:
await layersApi.addGeoJsonLayer({ ... }); // Legacy service

// Cache is NOT invalidated!
// RTK Query doesn't know about the change
// Map doesn't refresh automatically
```

**Recommendation:**
```
Priority: 🔴 HIGH
Timeline: 1 week

1. Migrate layersApi to RTK Query
2. Add cache invalidation tags:
   - 'Layers' - list of layers
   - 'Layer:{id}' - individual layer
   - 'Project:{id}' - project when layers change
3. Update all components to use RTK Query hooks
```

---

### Medium Priority Issues

#### 4. Missing Endpoints in RTK Query

**12 Project Endpoints Missing:**
1. `importQGZ` - Import compressed QGIS project
2. `updateLogo` - Update project logo
3. `setMetadata` - Set project metadata
4. `getLayersOrder` - Get layer tree order
5. `changeLayersOrder` - Reorder layers
6. `getProjectSpace` - Get storage usage
7. `searchProjects` - Search projects
8. `reloadProject` - Reload from QGIS
9. `repairProject` - Repair corrupted project
10. `restoreProject` - Restore from backup
11. `setBasemap` - Set project basemap
12. `preparePrintImage` - Generate print preview

**Action:** Add these to `projectsApi.ts`

---

#### 5. Inconsistent Field Names

**Problem:**
```typescript
// Backend returns: project_name, custom_project_name, domain_name
// Frontend sometimes expects: projectName, customProjectName, domainName

// Example from createProject:
const response = await createProject({
  project: 'my-project',  // ⚠️ Should be project_name
  domain: 'my-domain',    // ⚠️ Should be custom_project_name
});
```

**Recommendation:**
```
Priority: 🟡 MEDIUM
Timeline: 2 days

1. Standardize on snake_case (backend convention)
2. Use transformRequest/transformResponse in RTK Query
3. Update all TypeScript interfaces
```

---

### Low Priority Improvements

#### 6. Add TypeScript Strict Mode

**Current:**
```typescript
// tsconfig.json
"strict": false,
"noImplicitAny": false,
```

**Recommendation:**
```typescript
"strict": true,
"noImplicitAny": true,
```

**Impact:** Catch type errors at compile time

---

#### 7. Add API Response Logging

**Current:** No centralized API logging

**Recommendation:**
```typescript
// Add to projectsApi.ts
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => { ... },
});

const baseQueryWithLogging: BaseQueryFn = async (args, api, extraOptions) => {
  console.log('🌐 API Request:', args);
  const result = await baseQuery(args, api, extraOptions);
  console.log('📥 API Response:', result);
  return result;
};
```

---

## Migration Checklist

### Phase 1: Layers API (Week 1)

- [ ] Create `src/redux/api/layersApi.ts`
- [ ] Add tag types: `['Layers', 'Layer', 'Project']`
- [ ] Migrate high-priority endpoints:
  - [ ] `addGeoJsonLayer`
  - [ ] `addShapefileLayer`
  - [ ] `updateLayerStyle`
  - [ ] `deleteLayer`
  - [ ] `getLayerAttributes`
  - [ ] `setLayerVisibility`
  - [ ] `getFeatures`
  - [ ] `addFeature`
  - [ ] `updateFeature`
  - [ ] `deleteFeature`
- [ ] Update components:
  - [ ] `FeatureEditor.tsx`
  - [ ] `DrawingTools.tsx`
  - [ ] `LayerTree.tsx`
  - [ ] `MapContainer.tsx`
- [ ] Test all layer operations
- [ ] Delete legacy `src/api/endpointy/layers.ts`

### Phase 2: Auth & User API (Week 2, Days 1-3)

- [ ] Create `src/redux/api/authApi.ts`
- [ ] Migrate auth endpoints:
  - [ ] `register`
  - [ ] `login`
  - [ ] `logout`
  - [ ] `getProfile`
- [ ] Create `src/redux/api/userApi.ts`
- [ ] Migrate user endpoints:
  - [ ] `getProfile`
  - [ ] `updateProfile`
  - [ ] `changePassword`
  - [ ] `sendContactForm`
- [ ] Update components:
  - [ ] `LoginPage.tsx`
  - [ ] `RegisterPage.tsx`
  - [ ] `UserSettings.tsx`
  - [ ] `DashboardLayout.tsx`
- [ ] Test auth flow
- [ ] Delete legacy auth/user services

### Phase 3: Projects API Completion (Week 2, Days 4-7)

- [ ] Add missing endpoints to `projectsApi.ts`:
  - [ ] `importQGZ`
  - [ ] `updateLogo`
  - [ ] `setMetadata`
  - [ ] `getLayersOrder`
  - [ ] `changeLayersOrder`
  - [ ] `getProjectSpace`
  - [ ] `searchProjects`
  - [ ] `reloadProject`
  - [ ] `repairProject`
  - [ ] `restoreProject`
  - [ ] `setBasemap`
  - [ ] `preparePrintImage`
- [ ] Remove duplicate methods from `unifiedProjectsApi`
- [ ] Update all components using legacy methods
- [ ] Test all project operations
- [ ] Delete `src/api/endpointy/unified-projects.ts`

### Phase 4: Cleanup & Testing (Week 3, Days 1-2)

- [ ] Remove all legacy service files:
  - [ ] `src/api/endpointy/unified-projects.ts`
  - [ ] `src/api/endpointy/layers.ts`
  - [ ] `src/api/endpointy/auth.ts`
  - [ ] `src/api/endpointy/unified-user.ts`
- [ ] Update all imports in components
- [ ] Run full regression test:
  - [ ] Authentication flow
  - [ ] Project CRUD
  - [ ] Layer management
  - [ ] Map features
  - [ ] User settings
- [ ] Update CLAUDE.md documentation
- [ ] Create migration summary report

---

## Conclusion

### Current State

- ✅ **11 RTK Query endpoints** implemented for projects
- ⚠️ **8 duplicate** endpoints (RTK + Legacy)
- ❌ **49 endpoints** only in legacy services
- ❌ **0 endpoints** for layers, auth, user in RTK Query

**Total:** 60 unique backend endpoints

### Target State

- ✅ **60 RTK Query endpoints**
- ❌ **0 legacy services**
- ✅ **Unified API layer** with caching
- ✅ **Consistent error handling**

### Effort Estimate

- **Phase 1 (Layers):** 40 hours (1 week)
- **Phase 2 (Auth/User):** 24 hours (3 days)
- **Phase 3 (Projects):** 40 hours (1 week)
- **Phase 4 (Cleanup):** 16 hours (2 days)

**Total:** 120 hours (~3 weeks)

### Benefits

1. **Performance:** Automatic caching, deduplication, background refetching
2. **Developer Experience:** Auto-generated hooks, TypeScript types
3. **Maintainability:** Single source of truth, less boilerplate
4. **User Experience:** Faster page loads, optimistic updates
5. **Code Quality:** 85% less boilerplate, consistent patterns

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
**Next Review:** After Phase 1 completion
