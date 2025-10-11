# Backend Integration Status
**Last Updated:** 2025-10-11
**Purpose:** Quick reference for backend integration progress

> 📊 **Full Analysis:** See [`docs/FRONTEND-BACKEND-ANALYSIS.md`](../docs/FRONTEND-BACKEND-ANALYSIS.md) for comprehensive details

---

## Quick Stats

| Metric | Value | Progress |
|--------|-------|----------|
| **Total Backend Endpoints** | 60 | - |
| **RTK Query Implemented** | 11 | 18% |
| **Legacy Services** | 49 | 82% |
| **Duplicates (Both)** | 8 | - |
| **Migration Remaining** | 49 | - |

---

## API Coverage by Module

### Projects API

| Status | Count | Details |
|--------|-------|---------|
| ✅ RTK Query | 11 | getProjects, createProject, deleteProject, togglePublish, importQGS, exportProject, etc. |
| ⚠️ Duplicates | 8 | Same endpoints in both RTK and Legacy |
| ❌ Missing | 12 | importQGZ, updateLogo, setMetadata, getLayersOrder, etc. |
| **Total** | **23** | - |

**Recommendation:** Add 12 missing endpoints, remove 8 duplicates

---

### Layers API

| Status | Count | Details |
|--------|-------|---------|
| ✅ RTK Query | 0 | None implemented |
| ❌ Missing | 29 | addGeoJsonLayer, updateLayerStyle, deleteLayer, addFeature, etc. |
| **Total** | **29** | - |

**Recommendation:** Create `src/redux/api/layersApi.ts` with all 29 endpoints

---

### Authentication API

| Status | Count | Details |
|--------|-------|---------|
| ✅ RTK Query | 0 | None implemented |
| ❌ Missing | 4 | register, login, logout, getProfile |
| **Total** | **4** | - |

**Recommendation:** Create `src/redux/api/authApi.ts` with all 4 endpoints

---

### User Settings API

| Status | Count | Details |
|--------|-------|---------|
| ✅ RTK Query | 0 | None implemented |
| ❌ Missing | 4 | getProfile, updateProfile, changePassword, sendContactForm |
| **Total** | **4** | - |

**Recommendation:** Create `src/redux/api/userApi.ts` with all 4 endpoints

---

## Migration Priority

### 🔴 Phase 1: Critical (Week 1)

**Layers API - 9 High-Priority Endpoints**

Used by core map features:

1. `addGeoJsonLayer` - FeatureEditor
2. `addShapefileLayer` - AddDatasetModal
3. `updateLayerStyle` - LayerProperties
4. `deleteLayer` - LayerTree
5. `getLayerAttributes` - FeatureEditor
6. `setLayerVisibility` - LayerTree
7. `getFeatures` - MapContainer
8. `addFeature` - DrawingTools
9. `updateFeature` - FeatureEditor
10. `deleteFeature` - FeatureEditor

**Impact:** Fixes cache invalidation, enables optimistic updates

---

### 🟡 Phase 2: Important (Week 2, Days 1-3)

**Auth & User APIs - 8 Endpoints**

Used by login/register/settings:

1. `register` - RegisterPage
2. `login` - LoginPage
3. `logout` - DashboardLayout
4. `getProfile` - UserSettings (auth)
5. `getProfile` - UserSettings (user)
6. `updateProfile` - UserSettings
7. `changePassword` - UserSettings
8. `sendContactForm` - ContactForm

**Impact:** Consistent auth state, better UX

---

### 🟢 Phase 3: Enhancement (Week 2, Days 4-7)

**Projects API Completion - 12 Endpoints**

Currently only in legacy service:

1. `importQGZ` - Compressed QGIS import
2. `updateLogo` - Project logo
3. `setMetadata` - Project metadata
4. `getLayersOrder` - Layer tree order
5. `changeLayersOrder` - Reorder layers
6. `getProjectSpace` - Storage usage
7. `searchProjects` - Project search
8. `reloadProject` - Reload from QGIS
9. `repairProject` - Repair corrupted
10. `restoreProject` - Restore backup
11. `setBasemap` - Project basemap
12. `preparePrintImage` - Print preview

**Impact:** Feature completeness, unified API

---

### ⚪ Phase 4: Cleanup (Week 3, Days 1-2)

**Remove Legacy Services**

Delete these files after migration:

- `src/api/endpointy/unified-projects.ts` (407 lines)
- `src/api/endpointy/layers.ts` (517 lines)
- `src/api/endpointy/auth.ts` (90 lines)
- `src/api/endpointy/unified-user.ts` (89 lines)

**Total:** 1,103 lines of legacy code removed

**Impact:** Code maintainability, reduced bundle size

---

## Known Issues

### 1. Backend Bug: togglePublish Returns 500

**Status:** ⚠️ Workaround in place
**Location:** `ProjectSettingsDialog.tsx:122-156`
**Description:** Backend returns HTTP 500 error even when publish succeeds

**Current Workaround:**
```typescript
try {
  await togglePublish({ project, publish: true }).unwrap();
  setIsPublished(true); // Success
} catch (error) {
  // Backend bug: treat 500 as success
  setIsPublished(true); // Optimistic
  console.warn('Publish API returned error but operation may have succeeded');
}
```

**Action Required:** Backend team to fix endpoint, then remove workaround

---

### 2. Dual API System

**Status:** ❌ Critical
**Impact:** Cache doesn't invalidate across systems

**Example Problem:**
```typescript
// Component A uses RTK Query
const { data } = useGetProjectsQuery();

// Component B uses Legacy Service
await unifiedProjectsApi.createProject({ ... });

// Component A cache NOT invalidated!
// User doesn't see new project until manual refresh
```

**Solution:** Complete RTK Query migration

---

### 3. Missing Layer Cache Invalidation

**Status:** ❌ Critical
**Impact:** Map doesn't refresh after layer changes

**Example:**
```typescript
// Add layer via legacy service
await layersApi.addGeoJsonLayer({ ... });

// Map doesn't update!
// Layer tree doesn't update!
// No cache invalidation!
```

**Solution:** Migrate layers API to RTK Query with proper tags

---

## Migration Checklist

### Week 1: Layers API

- [ ] Create `src/redux/api/layersApi.ts`
- [ ] Add tag types: `['Layers', 'Layer', 'Project']`
- [ ] Implement 9 high-priority endpoints
- [ ] Update components:
  - [ ] FeatureEditor
  - [ ] DrawingTools
  - [ ] LayerTree
  - [ ] MapContainer
- [ ] Test all layer operations
- [ ] Verify cache invalidation works

### Week 2: Auth, User, Projects

- [ ] Day 1-2: Auth API
  - [ ] Create `src/redux/api/authApi.ts`
  - [ ] Implement 4 endpoints
  - [ ] Update LoginPage, RegisterPage
  - [ ] Test auth flow

- [ ] Day 3: User API
  - [ ] Create `src/redux/api/userApi.ts`
  - [ ] Implement 4 endpoints
  - [ ] Update UserSettings
  - [ ] Test profile updates

- [ ] Day 4-7: Projects API
  - [ ] Add 12 missing endpoints to projectsApi
  - [ ] Remove 8 duplicates
  - [ ] Test all features

### Week 3: Cleanup

- [ ] Day 1:
  - [ ] Delete legacy service files
  - [ ] Update all imports
  - [ ] Fix any broken references

- [ ] Day 2:
  - [ ] Full regression test
  - [ ] Update documentation
  - [ ] Create migration summary

---

## Testing Checklist

After each phase, verify:

### Functionality
- [ ] All features work as before
- [ ] No broken UI
- [ ] Error handling works
- [ ] Loading states display

### Performance
- [ ] Cache working (check Network tab)
- [ ] No duplicate requests
- [ ] Background refetch works
- [ ] Optimistic updates smooth

### Developer Experience
- [ ] TypeScript types correct
- [ ] Auto-generated hooks work
- [ ] Redux DevTools shows actions
- [ ] Console logs clean

---

## Resources

- **Full Analysis:** [`docs/FRONTEND-BACKEND-ANALYSIS.md`](../docs/FRONTEND-BACKEND-ANALYSIS.md)
- **Original Plan:** [`Dokumentacja/BACKEND-INTEGRATION.md`](./BACKEND-INTEGRATION.md)
- **RTK Query Docs:** https://redux-toolkit.js.org/rtk-query/overview
- **Backend API:** `https://api.universemapmaker.online`

---

## Timeline Summary

| Phase | Duration | Endpoints | Impact |
|-------|----------|-----------|--------|
| **Phase 1: Layers** | 1 week | 9 | Cache invalidation fixes |
| **Phase 2: Auth/User** | 3 days | 8 | Consistent auth state |
| **Phase 3: Projects** | 1 week | 12 | Feature completeness |
| **Phase 4: Cleanup** | 2 days | - | Remove 1,103 lines |
| **Total** | **3 weeks** | **29** | **Full RTK Query migration** |

**Effort:** ~120 hours
**Benefit:** 85% less boilerplate, automatic caching, better UX

---

**Status:** 📝 Planning Complete - Ready for Phase 1 implementation
**Next Step:** Create `src/redux/api/layersApi.ts` and migrate first 9 endpoints
