# QGS Import Fix - Action Plan

## Problem Analysis

### Current Situation (2025-10-10)

**✅ What Works:**
1. Frontend QGS upload with progress bar
2. File successfully uploaded to backend
3. ProjectItem created in database (ID: 33)
4. Domain assigned (ID: 35, name: "dziwneniemanadjango")
5. QgsFile record created (uploaded_at: 2025-10-10 18:58:14)
6. Project visible in Dashboard → Moje Projekty

**❌ What's Broken:**
1. **Zero layers created** - Layer table empty for this project
2. **WMS/WFS URLs empty** - Cannot display map layers
3. **GeoServer workspace empty** - Not published
4. **tree.json missing** - `/api/projects/new/json` returns 400 error
5. **Map view timeout** - Frontend cannot load project data
6. **Backend errors in logs:**
   - `ERROR:root:Error getExtentLayer: list index out of range`
   - `ERROR:geocraft_api.projects.service:Error get_project_large: 'NoneType' object is not subscriptable`
   - `QObject: Cannot create children for a parent that is in a different thread` (QGIS threading issues)

### Root Cause

**Backend QGS import process incomplete:**
- `/api/projects/import/qgs/` endpoint receives file ✅
- Saves QgsFile metadata ✅
- **BUT fails to extract layers to PostGIS** ❌
- **Does not generate tree.json** ❌
- **Does not create Layer records** ❌

## Database State

### ProjectItem (ID: 33)
```
project_name: UniejowMwSuikzp_2023_03_28_07_21_26_1
user_id: contact@mapmaker.online
published: False
category: Inne
creationDate: 2025-10-10 18:58:12
wms_url: (empty)
wfs_url: (empty)
geoserver_workspace: (empty)
logoExists: False
```

### Layer (for project_name = UniejowMwSuikzp_2023_03_28_07_21_26_1)
```
COUNT: 0 (EXPECTED: ~10-20 layers based on QGS file)
```

### QgsFile (ID: 4)
```
project: UniejowMwSuikzp_2023_03_28_07_21_26
qgs: UniejowMwSuikzp_2023_03_28_07_21_26/UniejowMwSuikzp_2023_03_28_07_21_26.qgs
uploaded_at: 2025-10-10 18:58:14
```

## Frontend-Backend Integration Issues

### 1. Map Page Workflow (`/map?project=...`)

**Current Flow:**
```
User clicks project → Navigate to /map?project=X
↓
useGetProjectDataQuery() calls /api/projects/new/json
↓
Backend tries to read tree.json (MISSING!)
↓
Returns 400: "Nie znaleziono projektu"
↓
Frontend shows error, map fails to load
```

**Expected Flow:**
```
User clicks project → Navigate to /map?project=X
↓
useGetProjectDataQuery() calls /api/projects/new/json
↓
Backend reads tree.json from QGS file
↓
Returns layer tree structure + extent + logo
↓
Frontend loads layers as WMS tiles from QGIS Server
↓
Map displays with all layers
```

### 2. Missing Components

**Backend:**
- ❌ Layer extraction from QGS to PostGIS
- ❌ tree.json generation
- ❌ WMS/WFS URL configuration
- ❌ Layer records in database

**Frontend:**
- ✅ RTK Query endpoint exists (`useGetProjectDataQuery`)
- ✅ QGISProjectLoader component ready
- ✅ Layer tree rendering prepared
- ⚠️ Waiting for backend data

## Action Plan

### Phase 1: Backend Investigation (PRIORITY 1)

**Goal:** Find out why layer extraction fails

**Steps:**
1. **Check backend import service logic**
   - SSH to VM: `gcloud compute ssh universe-backend --zone=europe-central2-a`
   - Navigate to backend: `cd Universe-Mapmaker-Backend`
   - Read import service: `geocraft_api/projects/service.py`
   - Find QGS import function (likely `import_qgs_file()` or similar)

2. **Check QGIS Server logs**
   ```bash
   sudo docker logs -f universe-mapmaker-backend_qgis-server_1 | grep -i uniejow
   ```

3. **Check Django logs with full traceback**
   ```bash
   sudo docker logs --tail=500 universe-mapmaker-backend_django_1 | grep -A 20 "UniejowMwSuikzp"
   ```

4. **Test QGS file manually with QGIS Python**
   - Access Django shell: `sudo docker exec -it universe-mapmaker-backend_django_1 python manage.py shell`
   - Load QGS file with PyQGIS
   - Extract layer list
   - Check for threading issues

**Expected Findings:**
- Threading issue preventing layer creation
- Missing PostGIS connection in import function
- QGS file parsing error
- QGIS Server version incompatibility

### Phase 2: Backend Fix (PRIORITY 1)

**Option A: Fix Threading Issue**
- Modify `geocraft_api/projects/service.py`
- Move QGIS operations to main thread
- Use QgsApplication.processEvents()
- Test with same QGS file

**Option B: Alternative Import Method**
- Use `ogr2ogr` instead of PyQGIS (more reliable)
- Parse QGS XML directly with `xml.etree`
- Import shapefiles/geojson manually to PostGIS
- Generate tree.json from layer metadata

**Option C: Two-Step Import**
- Step 1: Upload QGS file (current, working)
- Step 2: Manual "Process Layers" button in frontend
- Trigger `/api/projects/process-layers/` endpoint
- Run layer extraction in background task (Celery?)

### Phase 3: tree.json Generation (PRIORITY 2)

**Goal:** Create layer tree structure for frontend

**Requirements:**
- Parse QGS file for layer hierarchy
- Extract layer names, types, visibility, order
- Generate JSON structure matching `QGISProjectTree` type
- Save to file system: `{project_name}/tree.json`

**tree.json Structure:**
```json
{
  "name": "Project Name",
  "extent": [minLng, minLat, maxLng, maxLat],
  "logoExists": false,
  "large": false,
  "children": [
    {
      "id": "layer-1",
      "name": "Layer Name",
      "type": "wms",
      "visible": true,
      "opacity": 1.0,
      "url": "https://api.universemapmaker.online/ows?...",
      "layers": "project:layer_name"
    }
  ]
}
```

### Phase 4: WMS/WFS Configuration (PRIORITY 2)

**Goal:** Enable map layer visualization

**Steps:**
1. **Publish project to GeoServer**
   - Create workspace: `{project_name}`
   - Add PostGIS datastore
   - Publish each layer as WMS/WFS

2. **Update ProjectItem**
   ```python
   project.wms_url = f"https://api.universemapmaker.online/ows?service=WMS&project={project_name}"
   project.wfs_url = f"https://api.universemapmaker.online/ows?service=WFS&project={project_name}"
   project.geoserver_workspace = project_name
   project.save()
   ```

3. **Test WMS endpoint**
   ```bash
   curl "https://api.universemapmaker.online/ows?service=WMS&request=GetCapabilities&project=UniejowMwSuikzp_2023_03_28_07_21_26_1"
   ```

### Phase 5: Frontend Integration (PRIORITY 3)

**Goal:** Display layers in map view

**Steps:**
1. **Verify RTK Query endpoint**
   - Test `/api/projects/new/json?project=...` returns valid tree.json
   - Check response matches `QGISProjectTree` type

2. **Test MapPage component**
   - Navigate to `/map?project=UniejowMwSuikzp_2023_03_28_07_21_26_1`
   - Verify loading spinner appears
   - Check layer tree renders in LeftPanel
   - Confirm WMS tiles load in MapContainer

3. **Add error handling**
   - Show user-friendly message if tree.json missing
   - Provide "Retry Import" button
   - Link to project settings

## Testing Checklist

### Backend Tests
- [ ] QGS file uploads successfully
- [ ] Layer records created in database
- [ ] PostGIS tables created for each layer
- [ ] tree.json generated in file system
- [ ] WMS/WFS URLs populated in ProjectItem
- [ ] `/api/projects/new/json` returns valid data
- [ ] No threading errors in Django logs

### Frontend Tests
- [ ] Project appears in Dashboard
- [ ] Click project navigates to /map
- [ ] Loading spinner shows during fetch
- [ ] Layer tree renders in LeftPanel
- [ ] Map tiles load from WMS
- [ ] Layers toggle visibility
- [ ] No console errors
- [ ] Timeout issue resolved

## Alternative Approach: Skip Backend, Use Frontend-Only

**If backend fix takes too long, consider:**

1. **Frontend QGS Parser**
   - Use `fflate` to unzip QGZ files
   - Parse QGS XML with DOMParser
   - Extract layer names, extents, styles
   - Generate tree.json in browser
   - Store in Redux/IndexedDB

2. **Direct QGIS Server Integration**
   - Skip Django layer extraction
   - Use QGIS Server OWS endpoints directly
   - Query GetCapabilities for layer list
   - Build layer tree from WMS response

3. **Pros/Cons**
   - ✅ Faster implementation
   - ✅ No backend changes needed
   - ❌ No PostGIS storage (layers not editable)
   - ❌ Limited layer management features

## Recommended Next Steps

**IMMEDIATE ACTION (User Decision Required):**

1. **Should we fix backend or work around it?**
   - Fix backend: Proper solution, but requires backend access and Django expertise
   - Frontend workaround: Faster, but limited functionality

2. **If fixing backend:**
   - Grant SSH access to backend VM
   - Review `geocraft_api/projects/service.py`
   - Fix threading issue
   - Test with current QGS file

3. **If frontend workaround:**
   - Implement QGS parser in Next.js
   - Use QGIS Server GetCapabilities
   - Skip Layer table entirely

**CURRENT STATUS:**
- Database schema documented in CLAUDE.md ✅
- Problem root cause identified ✅
- Action plan created ✅
- Waiting for user decision on approach ⏳
