# Backend Integration Migration Guide

## Overview

This guide documents the migration from scattered API imports to the centralized `src/backend/` structure using RTK Query baseApi.

**Migration Date:** 2025-01-19
**Status:** Phase 1 Complete (Dashboard + Projects API)

---

## 🎯 Goals

1. **Single Source of Truth** - One baseApi for all backend communication
2. **Automatic Token Management** - No manual Authorization headers
3. **Cache Invalidation** - Proper RTK Query tags for automatic refetching
4. **Type Safety** - Shared TypeScript types across all modules
5. **Developer Experience** - Simple imports from `@/backend`

---

## 📁 New Structure

```
src/backend/
├── client/
│   └── base-api.ts              # Single RTK Query API instance
│       - Token injection (localStorage)
│       - Error handling (401 → redirect)
│       - 30s timeout
│       - Tag types: Projects, Project, PublicProjects, etc.
│
├── auth/
│   ├── auth.api.ts              # Login, register, password reset
│   └── index.ts
│
├── projects/
│   ├── projects.api.ts          # 25+ endpoints (CRUD, QGS, publish)
│   └── index.ts
│
├── users/
│   ├── users.api.ts             # Profile, settings
│   └── index.ts
│
├── dashboard/
│   ├── own-projects/            # Migrated ✅
│   │   ├── OwnProjects.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── CreateProjectDialog.tsx
│   │   ├── DeleteProjectDialog.tsx
│   │   ├── ProjectSettingsDialog.tsx
│   │   └── index.ts
│   ├── public-projects/         # Migrated ✅
│   │   ├── PublicProjects.tsx
│   │   ├── PublicProjectCard.tsx
│   │   └── index.ts
│   ├── shared/
│   │   ├── ProjectCardSkeleton.tsx
│   │   └── index.ts
│   └── index.ts
│
├── types.ts                     # Shared types (Project, User, DbInfo, etc.)
├── index.ts                     # Central export point
└── README.md                    # Integration docs
```

---

## 🔄 Migration Process

### Phase 1: Dashboard Migration (✅ COMPLETED)

#### What Was Migrated:

1. **OwnProjects Component**
   - From: `src/features/dashboard/komponenty/OwnProjects.tsx`
   - To: `src/backend/dashboard/own-projects/OwnProjects.tsx`
   - Changed: Import from `@/redux/api/projectsApi` → `@/backend/projects`

2. **PublicProjects Component**
   - From: `src/features/dashboard/komponenty/PublicProjects.tsx`
   - To: `src/backend/dashboard/public-projects/PublicProjects.tsx`
   - Changed: Import from `@/redux/api/projectsApi` → `@/backend/projects`

3. **Supporting Dialogs**
   - CreateProjectDialog.tsx
   - DeleteProjectDialog.tsx
   - ProjectSettingsDialog.tsx

4. **Project Cards**
   - ProjectCard.tsx - Removed old `unifiedProjectsApi.getThumbnailUrl()`
   - PublicProjectCard.tsx

#### Changes Made:

**Before (Old):**
```typescript
import { useGetProjectsQuery } from '@/redux/api/projectsApi';
import { unifiedProjectsApi } from '@/api/endpointy/unified-projects';

const { data: projectsData } = useGetProjectsQuery();
const thumbnailUrl = unifiedProjectsApi.getThumbnailUrl(project.project_name);
```

**After (New):**
```typescript
import { useGetProjectsQuery } from '@/backend/projects';

const { data: projectsData } = useGetProjectsQuery();
const thumbnailUrl = project.logoExists
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/projects/logo/${project.project_name}`
  : '';
```

#### Bug Fixes During Migration:

1. **Missing Tag Type** - Added `'Project'` to baseApi tagTypes (was only `'Projects'`)
2. **Soft Delete Issue** - Changed `remove_permanently: false` → `true` to match modal text "nieodwracalna"
3. **Manual Refetch Workaround** - Added `refetch()` calls after mutations due to dual API cache issue

---

## 📋 API Endpoints Reference

### Projects API (`src/backend/projects/projects.api.ts`)

**Queries:**
- `useGetProjectsQuery()` - Get user's projects (`/dashboard/projects/`)
- `useGetPublicProjectsQuery()` - Get published projects (`/dashboard/public/`)
- `useGetProjectDataQuery({ project, published })` - Get tree.json (`/api/projects/new/json`)

**Mutations:**
- `useCreateProjectMutation()` - Create project (`/api/projects/create/`)
- `useDeleteProjectMutation()` - Delete project (`/api/projects/remove/`)
- `useTogglePublishMutation()` - Publish/unpublish (`/api/projects/publish`)
- `useImportQGSMutation()` - Import QGS file (`/api/projects/import/qgs/`)
- `useImportQGZMutation()` - Import QGZ file (`/api/projects/import/qgz/`)
- `useUpdateProjectMutation()` - Update metadata (`/api/projects/update/`)
- `useChangeDomainMutation()` - Change subdomain (`/api/projects/change_domain/`)
- `useUpdateLogoMutation()` - Upload logo (`/api/projects/logo/update`)

**Cache Tags:**
- `'Projects'` + `'LIST'` - Invalidated by create/delete
- `'Project'` + `id` - Invalidated by update/delete/publish
- `'PublicProjects'` + `'LIST'` - Invalidated by publish/unpublish

---

## 🚨 Important Patterns

### 1. Project Creation + QGS Import

**CRITICAL:** Always use `db_name` from CREATE response, NOT `custom_project_name`!

```typescript
import { useCreateProjectMutation, useImportQGSMutation } from '@/backend/projects';

const [createProject] = useCreateProjectMutation();
const [importQGS] = useImportQGSMutation();

// Step 1: Create project
const response = await createProject({
  project: 'MyProject',
  domain: 'my-project',
  projectDescription: 'Test project',
}).unwrap();

// Step 2: Get REAL project_name (with suffix if duplicate)
const realProjectName = response.data.db_name; // e.g., "MyProject_1"

// Step 3: Import QGS using REAL project_name
await importQGS({
  project: realProjectName,  // ✅ Correct!
  qgsFile: file
}).unwrap();
```

**Why?** Backend generates unique `project_name` with suffix (`_1`, `_2`) if duplicate exists. Using `custom_project_name` will import to WRONG project folder!

### 2. Hard Delete vs Soft Delete

```typescript
import { useDeleteProjectMutation } from '@/backend/projects';

const [deleteProject] = useDeleteProjectMutation();

// Hard delete (permanent removal)
await deleteProject({
  project: 'MyProject',
  remove_permanently: true  // ✅ Matches "nieodwracalna" modal text
}).unwrap();

// Soft delete (move to deleted_projects/)
await deleteProject({
  project: 'MyProject',
  remove_permanently: false  // ⚠️ Project stays in database
}).unwrap();
```

**Current Implementation:** OwnProjects uses **hard delete** (`remove_permanently: true`)

### 3. Cache Invalidation

```typescript
// Automatic cache invalidation via RTK Query tags
deleteProject: builder.mutation({
  query: ({ project, remove_permanently }) => ({
    url: '/api/projects/remove/',
    method: 'POST',
    body: { project, remove_permanently },
  }),
  invalidatesTags: (result, error, { project }) => [
    { type: 'Project', id: project },    // Invalidate single project
    { type: 'Projects', id: 'LIST' },    // Invalidate projects list
  ],
}),
```

**Workaround:** Due to dual API cache (baseApi + old projectsApi), manual `refetch()` is added after mutations.

---

## 🐛 Known Issues

### 1. Dual API Cache Problem

**Issue:** Redux store has both `baseApi` and old `projectsApi` reducers, causing cache coordination issues.

**Workaround:** Manual `refetch()` after mutations:
```typescript
const { refetch } = useGetProjectsQuery();

await deleteProject({ project: 'MyProject', remove_permanently: true }).unwrap();
refetch(); // Force cache update
```

**Permanent Fix:** Remove old `projectsApi` from `src/redux/store.ts` after all components are migrated.

### 2. Empty Project Error (400 Bad Request)

**Issue:** `/api/projects/new/json?project=Mestwin` returns 400 if project is empty (no tree.json).

**Cause:** Project created without QGS import.

**Solution:**
1. Import QGS file to project via Dashboard
2. OR create project with immediate QGS import
3. OR handle 400 error gracefully in UI (show "Empty project" message)

---

## 📊 Migration Statistics

### Code Reduction:
- **OwnProjects.tsx:** 402 lines (no change, imports updated)
- **PublicProjects.tsx:** 358 lines (no change, imports updated)
- **Removed:** Old fetch API for thumbnails (`unifiedProjectsApi`)
- **Centralized:** All project API calls through `@/backend/projects`

### Files Changed:
1. `src/backend/dashboard/own-projects/OwnProjects.tsx`
2. `src/backend/dashboard/own-projects/ProjectCard.tsx`
3. `src/backend/dashboard/public-projects/PublicProjects.tsx`
4. `src/features/dashboard/komponenty/Dashboard.tsx` (imports only)
5. `app/map/page.tsx` (changed to `@/backend/projects`)
6. `tsconfig.json` (added `@/backend/dashboard` alias)
7. `CLAUDE.md` (updated documentation)

---

## 🔜 Phase 2: Remaining Migrations

### TODO: Dashboard Tabs

Still in old location (`src/features/dashboard/komponenty/`):
- [ ] **AdminPanel** → `src/backend/dashboard/admin-panel/`
- [ ] **UserProfile** → `src/backend/dashboard/profile/`
- [ ] **UserSettings** → `src/backend/dashboard/settings/`
- [ ] **Contact** → `src/backend/dashboard/contact/`
- [ ] **Payments** → `src/backend/dashboard/payments/`

### TODO: Other Modules

Still using old API:
- [ ] **Map Page** - Partially migrated (projects query done, need layers API)
- [ ] **Layers API** - Still in `@/redux/api/layersApi`
- [ ] **Styles API** - Still in `@/redux/api/stylesApi`
- [ ] **Admin API** - Still in `@/redux/api/adminApi`

---

## ✅ Testing Checklist

### Dashboard Features:
- [x] Create empty project
- [x] Create project + import QGS
- [x] Delete project (hard delete works)
- [x] Toggle publish/unpublish
- [x] Open project in map (owner = edit mode)
- [x] View public project (read-only mode)
- [x] Manual refetch works
- [ ] Project settings dialog (not tested with backend)

### Map View:
- [x] Authentication token injected
- [x] Owner detection works (isOwner = true)
- [x] Edit mode enabled for owner
- [x] Read-only mode for viewers
- [ ] Empty project shows proper error

---

## 📚 Resources

- **Backend API Docs:** `docs/backend/projects_api_docs.md`
- **Backend README:** `Universe-Mapmaker-Backend/README.md`
- **Frontend Integration:** `src/backend/README.md`
- **Migration Summary:** `docs/DASHBOARD_MIGRATION_SUMMARY.md`

---

## 🎓 Best Practices

1. **Always use `@/backend` imports** - Never use old `@/redux/api`
2. **Use `db_name` from responses** - Never assume `project_name = custom_project_name`
3. **Check endpoint exists** - Verify in `geocraft_api/*/urls.py` before implementing
4. **Test with curl first** - Ensure backend endpoint works before frontend integration
5. **Handle empty projects** - Show proper error message for 400 responses
6. **Use proper tags** - Ensure cache invalidation works correctly
7. **Manual refetch if needed** - Workaround for dual API cache issue

---

## 📝 Notes

- **Token Storage:** localStorage key `'authToken'`
- **API Base URL:** `process.env.NEXT_PUBLIC_API_URL` or `https://api.universemapmaker.online`
- **Timeout:** 30 seconds for all requests
- **Error Handling:** 401 → auto-redirect to `/login`
- **Port Requirement:** Development MUST run on `localhost:3000` (backend CORS)

---

**Last Updated:** 2025-01-19
**Next Review:** After Phase 2 migration (layers, styles, admin)
