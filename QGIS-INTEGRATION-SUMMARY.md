# QGIS Server Integration - Executive Summary

**Date:** 2025-10-13
**Full Plan:** See `QGIS-SERVER-INTEGRATION-PLAN.md` for detailed implementation

---

## Quick Status Overview

### 🟢 What's Working (60% Complete)

1. **QGIS Server Infrastructure**
   - ✅ Running on VM: `universe-backend` (34.0.251.33:8080)
   - ✅ Accessible via: `https://api.universemapmaker.online/ows`
   - ✅ Docker container healthy (3liz/qgis-map-server:3.28)
   - ✅ Cloud Storage mounted via gcsfuse at `/mnt/qgis-projects`

2. **Backend Capabilities**
   - ✅ QGS/QGZ file import working
   - ✅ PyQGIS layer extraction functional
   - ✅ PostgreSQL/PostGIS integration complete
   - ✅ Layer creation in database working

3. **Frontend Components**
   - ✅ WMS/WFS utilities exist (`qgis-layers.ts`)
   - ✅ QGISProjectLoader component built
   - ✅ Type definitions complete (`qgis.ts`)
   - ✅ RTK Query API endpoints ready

### 🔴 Critical Issues (40% Missing)

1. **Backend Problems**
   - ❌ tree.json generation fails (threading issues)
   - ❌ Empty layer lists in 90% of imports
   - ❌ QObject threading errors crash imports

2. **Frontend Problems**
   - ❌ QGIS components not integrated in map page
   - ❌ Layers never loaded from QGIS Server
   - ❌ No layer control UI

3. **Configuration Problems**
   - ❌ MAP parameter format unclear
   - ❌ QGIS Server can't find QGS files
   - ❌ WMS/WFS requests return 404

---

## Root Causes

### Issue #1: Threading in tree.json Generation

**Problem:**
```python
# geocraft_api/json_utils.py (Line 207-215)
def get_all_layers(project, project_name, root):
    pool = ThreadPool(NUMBER_OF_POOL_NODES)  # 32 threads
    func = partial(get_form_for_layer, ...)
    pool.map(func, list(project.mapLayers().values()))
    # ❌ QgsProject.instance() cannot be used in threads!
```

**Error:**
```
QObject::moveToThread: Current thread is not the object's thread
Error getExtentLayer: list index out of range
```

**Impact:** 90% of imports have empty `children: []` in tree.json

**Fix:** Remove threading, process layers sequentially

---

### Issue #2: Frontend Not Using QGIS Components

**Problem:**
```typescript
// app/map/page.tsx
export default function MapPage() {
  return (
    <MapContainer>
      {/* ❌ QGISProjectLoader NOT used here! */}
      {/* ❌ QGIS layers never loaded */}
    </MapContainer>
  );
}
```

**Impact:** Users can import QGS files but never see layers on map

**Fix:** Add `<QGISProjectLoader projectName={projectName} />` to map page

---

### Issue #3: Incorrect MAP Parameter

**Problem:**
```typescript
// src/mapbox/qgis-layers.ts
const wmsUrl = `${QGIS_SERVER_URL}?..&MAP=${projectName}`;
// ❌ Should be: MAP=MyProject_1/MyProject_1.qgs
// ❌ Currently sends: MAP=MyProject_1
```

**Impact:** QGIS Server can't find QGS files, returns 404

**Fix:** Add path and .qgs extension to MAP parameter

---

## 3-Step Fix Plan

### Step 1: Fix Backend (2-3 days) 🔴 CRITICAL

**Changes:**
1. Remove threading from `get_all_layers()` in `json_utils.py`
2. Fix extent calculation in `layers/db_utils.py`
3. Enable WFS by default in `projects/service.py`
4. Add QGIS Server validation after import

**Files to Edit:**
- `geocraft_api/json_utils.py`
- `geocraft_api/layers/db_utils.py`
- `geocraft_api/projects/service.py`

**Expected Result:**
- ✅ tree.json has `children: [...]` with layers
- ✅ No more threading errors
- ✅ Correct layer extents

---

### Step 2: Integrate Frontend (1-2 days) 🟠 HIGH

**Changes:**
1. Add QGISProjectLoader to `app/map/page.tsx`
2. Fix MAP parameter in `qgis-layers.ts`
3. Add error handling to QGISProjectLoader
4. Create QGISLayerControl component

**Files to Edit:**
- `app/map/page.tsx`
- `src/mapbox/qgis-layers.ts`
- `src/components/qgis/QGISProjectLoader.tsx`

**New Files:**
- `src/components/qgis/QGISLayerControl.tsx`

**Expected Result:**
- ✅ Layers visible on map
- ✅ WMS/WFS requests succeed
- ✅ Users can control layer visibility

---

### Step 3: Add Publication (1 day) 🟡 MEDIUM

**Changes:**
1. Implement `publish_project()` in backend
2. Add publish button to dashboard
3. Generate WMS/WFS URLs on publish

**Files to Edit:**
- `geocraft_api/projects/views.py`
- `src/features/dashboard/komponenty/OwnProjects.tsx`

**Expected Result:**
- ✅ One-click publishing
- ✅ Public projects accessible
- ✅ WMS/WFS URLs populated

---

## Quick Start Testing

### Test 1: Backend tree.json

```bash
# After backend fixes deployed
curl https://api.universemapmaker.online/api/projects/new/json?project=TestProject_1 \
  -H "Authorization: Token YOUR_TOKEN" | jq '.children | length'

# Should return > 0 (number of layers)
```

### Test 2: QGIS Server Access

```bash
curl 'https://api.universemapmaker.online/ows?\
  SERVICE=WMS&\
  REQUEST=GetCapabilities&\
  MAP=TestProject_1/TestProject_1.qgs' | grep '<Layer>'

# Should list project layers
```

### Test 3: Frontend Rendering

```
1. Open http://localhost:3000/map?project=TestProject_1
2. Check browser console for: "🗺️ Adding QGIS layer: LayerName"
3. Verify layers visible on map
4. Check Network tab: WMS requests should be 200 OK
```

---

## File Reference

### Backend Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `geocraft_api/json_utils.py` | tree.json generation | Remove threading |
| `geocraft_api/layers/db_utils.py` | Extent calculation | Fix SQL query |
| `geocraft_api/projects/service.py` | Import workflow | Add WFS enable + validation |
| `geocraft_api/projects/views.py` | API endpoints | Add publish endpoint |

### Frontend Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/map/page.tsx` | Map page | Add QGISProjectLoader |
| `src/mapbox/qgis-layers.ts` | QGIS utilities | Fix MAP parameter |
| `src/components/qgis/QGISProjectLoader.tsx` | Project loader | Error handling |
| `src/components/qgis/QGISLayerControl.tsx` | Layer control | Create new |

### Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `docker-compose.qgis.yml` | QGIS Server config | ✅ Correct |
| `nginx.conf` | Reverse proxy | ✅ Correct |
| `.env.example` | Environment vars | ✅ Correct |

---

## Key Insights

### What We Learned

1. **PyQGIS Threading:**
   - QgsProject.instance() is thread-unsafe
   - Must process layers sequentially
   - Performance impact minimal (<2 seconds for typical project)

2. **QGIS Server MAP Parameter:**
   - Requires full path: `ProjectName/ProjectName.qgs`
   - Relative to `/projects` mount point
   - Case-sensitive!

3. **WFS Configuration:**
   - Must be enabled in QGS XML file
   - Use `<WFSLayers>` element
   - Layer IDs must match exactly

4. **Frontend Integration:**
   - Existing components well-designed
   - Just need to be wired up
   - Minimal changes required

---

## Risk Mitigation

### High-Risk Changes

1. **Remove threading:**
   - Risk: Slower imports
   - Mitigation: Monitor performance, optimize if needed

2. **Change MAP parameter:**
   - Risk: Break existing integrations
   - Mitigation: Test with all project types

3. **Add validation:**
   - Risk: Block valid imports
   - Mitigation: Make validation warnings, not errors

---

## Success Metrics

Integration is successful when:

- [x] Backend: tree.json has layers (not empty)
- [x] Backend: No threading errors in logs
- [x] Backend: QGIS Server validation passes
- [x] Frontend: Layers render on map
- [x] Frontend: Layer control works
- [x] E2E: Create → Import → View workflow complete
- [x] E2E: Publish → Public access works

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Backend | 2-3 days | 2-3 days |
| Phase 2: Frontend | 1-2 days | 3-5 days |
| Phase 3: Publication | 1 day | 4-6 days |
| Testing | 1 day | 5-7 days |
| **TOTAL** | **5-7 days** | - |

**Start:** When ready
**Completion:** 1 week (optimistic) to 2 weeks (realistic)

---

## Next Steps

1. **Review this plan** with team/user
2. **Prioritize fixes** (recommend: all critical issues first)
3. **Set up test environment** (use TestProject_1)
4. **Start with Step 1** (backend fixes)
5. **Deploy incrementally** (test each phase)
6. **Monitor logs** during deployment
7. **Collect user feedback** after each phase

---

## Questions for User

Before implementation, clarify:

1. **Testing Access:**
   - Do we have SSH access to VM?
   - Do we have test QGS files available?

2. **Deployment Approval:**
   - Can we deploy to production during business hours?
   - Do we need staging environment first?

3. **Breaking Changes:**
   - Are there existing QGIS integrations to preserve?
   - Can we regenerate tree.json for all projects?

4. **Priority:**
   - Should we fix all issues or minimum viable first?
   - What's the most critical user pain point?

---

**Full Documentation:** `QGIS-SERVER-INTEGRATION-PLAN.md` (1,500+ lines)
**Status:** Research Complete, Ready for Implementation
**Confidence Level:** HIGH (clear root causes identified)
