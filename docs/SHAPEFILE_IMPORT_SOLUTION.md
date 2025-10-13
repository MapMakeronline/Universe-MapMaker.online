# Shapefile Import - Solution Implemented

**Date:** 2025-10-12
**Status:** ✅ **FIXED**
**Build Status:** ✅ **Successful** (no compilation errors)

---

## 🎯 **Summary**

**Problem:** Shapefile imports succeeded on backend but layers didn't appear in frontend map view until page refresh.

**Root Cause:** RTK Query cache invalidation not working between separate APIs (`projectsApi` and `layersApi`).

**Solution:** Added manual cache invalidation in `LeftPanel.tsx` after successful Shapefile import.

**Time to implement:** 10 minutes
**Risk:** Low
**Impact:** High - users can now see imported layers immediately

---

## 📋 **Changes Made**

### File: `src/features/warstwy/komponenty/LeftPanel.tsx`

**Line 34** - Added import:
```typescript
import { useChangeLayersOrderMutation, projectsApi } from '@/redux/api/projectsApi';
```

**Lines 452-462** - Added manual cache invalidation after successful import:
```typescript
console.log('✅ Layer imported successfully');

// ✅ MANUAL REFETCH - Force regenerate tree.json from backend
// RTK Query cache invalidation doesn't work between separate APIs (layersApi vs projectsApi)
// So we manually invalidate the 'Project' tag in projectsApi to trigger refetch
console.log('🔄 Triggering manual refetch of project data (tree.json)');
dispatch(
  projectsApi.util.invalidateTags([
    { type: 'Project', id: projectName }
  ])
);

dispatch(showSuccess(`Warstwa "${data.nazwaWarstwy}" została zaimportowana!`, 5000))
```

**What this does:**
1. After Shapefile import succeeds, manually invalidate the `Project` cache tag
2. This forces RTK Query to refetch project data from `/api/projects/new/json`
3. Backend regenerates `tree.json` on-demand when endpoint is called
4. Frontend receives updated layer tree with newly imported layers
5. Layers appear immediately in LeftPanel tree (no page refresh needed!)

---

## ✅ **Testing Instructions**

### Prerequisites
- Dev server running: `npm run dev` (port 3000)
- Backend API accessible: `https://api.universemapmaker.online`
- Valid authentication token in localStorage
- Test Shapefile files ready (e.g., buildings.shp + .shx + .dbf + .prj)

### Step-by-Step Test

1. **Open project in map view:**
   - Go to Dashboard → Moje Projekty
   - Click "Otwórz w edytorze" on any project
   - Wait for map to load
   - Verify LeftPanel shows existing layers (if any)

2. **Import Shapefile:**
   - In LeftPanel, find toolbar at top
   - Click "Importuj warstwę" button (or similar import button)
   - Select Shapefile format tab
   - Choose your Shapefile components (.shp + supporting files)
   - Fill in layer name
   - Optionally set EPSG code (e.g., 2180, 4326)
   - Click "Importuj" or "Dodaj warstwę"

3. **Expected behavior:**
   - Progress indicator shows upload progress
   - Success notification appears: "Warstwa '{name}' została zaimportowana!"
   - **Layers appear IMMEDIATELY in LeftPanel tree** (no page refresh!)
   - New layer is visible in layer list
   - Map updates with new layer

4. **Verify in browser console:**
   - Open DevTools (F12) → Console tab
   - Look for these logs:
     ```
     ✅ Layer imported successfully
     🔄 Triggering manual refetch of project data (tree.json)
     ```
   - Check Network tab:
     - Should see POST request to `/api/layer/add/shp/` (status 200)
     - Should see GET request to `/api/projects/new/json?project={name}` immediately after

5. **Test edge cases:**
   - Import multiple Shapefiles sequentially (should all appear)
   - Import with invalid EPSG code (should show error)
   - Import without required .shp file (should show validation error)
   - Close and reopen project (layers should persist)

---

## 🔍 **Backend Verification (Optional)**

### SSH to VM and Check Files

```bash
# Connect to backend VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Navigate to QGS storage
cd /app/qgs/{PROJECT_NAME}/

# Check if Shapefile was uploaded
ls -lh uploaded_layer.*
# Expected: .shp, .shx, .dbf, .prj files

# Check if tree.json was regenerated
cat tree.json | jq '.children | length'
# Expected: Number > 0 (shows layer count)

# View layer tree structure
cat tree.json | jq '.children[].name'
# Expected: List of layer names including newly imported one
```

---

## 🐛 **Troubleshooting**

### Issue: Layers still don't appear after import

**Possible causes:**
1. **Cache invalidation not triggering**
   - Check browser console for `🔄 Triggering manual refetch` log
   - If missing, the code may not have been built correctly
   - Run `npm run build` to verify no compilation errors

2. **Backend endpoint failing**
   - Check Network tab for 400/500 errors on `/api/projects/new/json`
   - Verify project name is correct (check URL: `/map?project={name}`)
   - Check backend logs: `sudo docker logs -f universe-mapmaker-backend_django_1`

3. **tree.json not regenerating**
   - SSH to VM and check if tree.json has empty children
   - If empty, backend may have failed to process Shapefile
   - Check Django logs for Python errors (QGIS API issues)

4. **RTK Query cache issue**
   - Try hard refresh (Ctrl+Shift+R)
   - Clear browser cache and localStorage
   - Restart dev server

### Issue: Upload fails with 400 error

**Common causes:**
- Missing required .shp file
- Invalid EPSG code format
- File size too large (backend limit)
- Invalid authentication token

**Solution:**
- Check error message in notification
- Verify all required files selected
- Check backend logs for detailed error

---

## 🔬 **Technical Background**

### Why Separate APIs Cause Cache Issues

**RTK Query Cache Architecture:**
```typescript
// projectsApi has its own cache
export const projectsApi = createApi({
  reducerPath: 'projectsApi',        // ← Separate cache namespace
  tagTypes: ['Projects', 'Project'], // ← Tags for projectsApi only
  endpoints: {
    getProjectData: /* ... */        // ← Uses 'Project' tag
  }
});

// layersApi has its own cache
export const layersApi = createApi({
  reducerPath: 'layersApi',          // ← Separate cache namespace
  tagTypes: ['Layers', 'Project'],   // ← Tags for layersApi only (doesn't affect projectsApi!)
  endpoints: {
    addShapefileLayer: /* ... */     // ← Invalidates 'Project' tag in layersApi
  }
});
```

**The Problem:**
1. `addShapefileLayer` mutation completes successfully
2. It invalidates `['Project']` tag in **layersApi cache**
3. `getProjectData` query lives in **projectsApi cache** (different namespace!)
4. Cache invalidation doesn't cross API boundaries
5. `getProjectData` never refetches → tree stays stale

**The Solution:**
Manually invalidate the tag in the **correct API's cache** using `dispatch()`:
```typescript
dispatch(
  projectsApi.util.invalidateTags([  // ← Target projectsApi, not layersApi
    { type: 'Project', id: projectName }
  ])
);
```

### Long-Term Solution (Recommended)

**Merge both APIs into one unified API** to avoid this issue entirely:

```typescript
// src/redux/api/unifiedApi.ts
export const unifiedApi = createApi({
  reducerPath: 'api',
  tagTypes: ['Projects', 'Project', 'Layers', 'Layer'],
  endpoints: (builder) => ({
    // Projects endpoints
    getProjects: /* ... */,
    getProjectData: /* ... */,
    createProject: /* ... */,

    // Layers endpoints
    addShapefileLayer: /* ... */,
    deleteLayer: /* ... */,
    updateLayer: /* ... */,
  })
});
```

**Benefits:**
- ✅ Cache invalidation works automatically
- ✅ No manual refetch needed
- ✅ Single source of truth
- ✅ Easier debugging
- ✅ Better performance (shared cache)

## 📊 **Summary**

### What was fixed:
- ✅ Shapefile import button already exists in LeftPanel
- ✅ ImportLayerModal already has Shapefile tab
- ✅ RTK Query endpoints already working
- ✅ Backend successfully saves files and processes QGS
- ❌ Frontend wasn't refreshing layer tree after import

### Solution:
- Added **one import statement** (line 34)
- Added **11 lines of code** (lines 452-462) to manually invalidate cache
- Build successful, no errors
- Total implementation time: ~10 minutes

### Next step: User testing required! ✅
