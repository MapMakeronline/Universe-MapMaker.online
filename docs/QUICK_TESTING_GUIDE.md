# Quick Testing Guide - Shapefile Import

**Use this guide to quickly test the Shapefile import feature end-to-end.**

---

## Prerequisites

1. ✅ Backend running: `https://api.universemapmaker.online`
2. ✅ Frontend running: `http://localhost:3000` (or production)
3. ✅ User account with login credentials
4. ✅ Test Shapefile ready (.shp + .shx + .dbf + .prj)

---

## Step 1: Get Your Auth Token

### Option A: From Browser (Easiest)

1. Open `http://localhost:3000/login`
2. Login with your credentials
3. Press F12 (DevTools)
4. Go to Console tab
5. Type: `localStorage.getItem('authToken')`
6. Copy the token (without quotes)

### Option B: Via curl

```bash
curl -X POST "https://api.universemapmaker.online/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
  }'

# Copy the "token" from response
```

**Save your token for later steps!**

---

## Step 2: Test Backend Directly (curl)

### 2.1 Create Test Project

```bash
# Replace <YOUR_TOKEN> with actual token
curl -X POST "https://api.universemapmaker.online/api/projects/create/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <YOUR_TOKEN>" \
  -d '{
    "project": "ShapefileTestProject",
    "domain": "shp-test",
    "projectDescription": "Test Shapefile import",
    "keywords": "test"
  }' \
  -v

# Look for "db_name" in response - this is your REAL project name!
# Example: "db_name": "ShapefileTestProject" or "ShapefileTestProject_1"
```

**✅ Expected:** Response with `success: true` and `db_name` field

**❌ If fails:** Check if token is valid, check backend logs

---

### 2.2 Import Shapefile

```bash
# Replace:
# - <YOUR_TOKEN> with actual token
# - <PROJECT_NAME> with db_name from step 2.1
# - Paths to your Shapefile

curl -X POST "https://api.universemapmaker.online/api/layer/add/shp/" \
  -H "Authorization: Token <YOUR_TOKEN>" \
  -F "project=<PROJECT_NAME>" \
  -F "layer_name=TestShapefileLayer" \
  -F "parent=" \
  -F "epsg=4326" \
  -F "shp=@/path/to/test.shp" \
  -F "shx=@/path/to/test.shx" \
  -F "dbf=@/path/to/test.dbf" \
  -F "prj=@/path/to/test.prj" \
  -v

# Example:
curl -X POST "https://api.universemapmaker.online/api/layer/add/shp/" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" \
  -F "project=ShapefileTestProject" \
  -F "layer_name=Buildings" \
  -F "parent=" \
  -F "epsg=4326" \
  -F "shp=@C:/Users/mestw/Desktop/buildings.shp" \
  -F "shx=@C:/Users/mestw/Desktop/buildings.shx" \
  -F "dbf=@C:/Users/mestw/Desktop/buildings.dbf" \
  -F "prj=@C:/Users/mestw/Desktop/buildings.prj" \
  -v
```

**✅ Expected:**
```json
{
  "success": true,
  "message": "Warstwa została pomyślnie zaimportowana",
  "data": {
    "layer_name": "TestShapefileLayer",
    "source_table_name": "shapefiletestproject_testshapefilelayer_abc123",
    "geometry_type": "MultiPolygon",
    "feature_count": 150
  }
}
```

**❌ Common errors:**
- `"message": "Nie znaleziono projektu"` → Wrong project name
- `401 Unauthorized` → Wrong or expired token
- `400 Bad Request` → Missing required file (.shp)

---

## Step 3: Verify Database

### 3.1 Connect to Database

```bash
gcloud sql connect geocraft-postgres --user=postgres --project=universe-mapmaker
# Enter password when prompted
```

### 3.2 Check Records

```sql
-- Check if project exists
SELECT id, project_name, custom_project_name, creationDate
FROM geocraft_api_projectitem
WHERE project_name = 'ShapefileTestProject';

-- Check if layer was created
SELECT id, project, source_table_name, geometry_type, creationDateOfLayer
FROM geocraft_api_layer
WHERE project = 'ShapefileTestProject'
ORDER BY creationDateOfLayer DESC;

-- Check if PostGIS table exists
SELECT tablename
FROM pg_tables
WHERE tablename LIKE 'shapefiletestproject%';

-- Count features in layer
-- Replace table name with actual source_table_name from above
SELECT COUNT(*) FROM shapefiletestproject_testshapefilelayer_abc123;

-- View sample features
SELECT fid, ST_AsText(ST_Centroid(geom)) as center
FROM shapefiletestproject_testshapefilelayer_abc123
LIMIT 5;

-- Exit
\q
```

**✅ Expected:**
- 1 row in `geocraft_api_projectitem`
- 1+ rows in `geocraft_api_layer`
- PostGIS table exists with features
- Feature count matches imported data

---

## Step 4: Verify File System

### 4.1 SSH to Backend

```bash
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker
```

### 4.2 Check Files

```bash
# Check project folder
ls -lh ~/mapmaker/server/qgs/ShapefileTestProject/

# Expected files:
# - ShapefileTestProject.qgs (larger than 8.6KB if layer imported)
# - tree.json (exists only after import)
# - uploaded_layer.shp
# - uploaded_layer.shx
# - uploaded_layer.dbf
# - uploaded_layer.prj (if provided)
# - styles/ (folder)

# View tree.json content
cat ~/mapmaker/server/qgs/ShapefileTestProject/tree.json

# Expected: JSON with "children" array containing imported layer
# {
#   "name": "ShapefileTestProject.qgs",
#   "children": [
#     {
#       "name": "TestShapefileLayer",
#       "id": "layer_uuid",
#       "type": "VectorLayer"
#     }
#   ]
# }

# Exit
exit
```

**✅ Expected:**
- QGS file size > 8.6KB
- tree.json exists
- uploaded_layer.* files present
- tree.json contains layer in children array

---

## Step 5: Test Frontend UI

### 5.1 Create Project via Dashboard

1. Go to `http://localhost:3000/dashboard`
2. Click "Nowy projekt" button
3. Fill form:
   - Nazwa projektu: `UITestProject`
   - Domena: `ui-test`
   - Kategorie: Any
4. Click "Utwórz projekt"
5. ✅ Verify project appears in project list

---

### 5.2 Open Project in Map View

1. Click on "UITestProject" card
2. ✅ Verify redirects to `/map?project=UITestProject`
3. ✅ Verify map loads (even if empty project error appears)

---

### 5.3 Import Shapefile via UI

1. Look for toolbar at top of left panel
2. Click 4th button from left (tooltip: "Importuj warstwę")
3. ✅ Verify dialog opens with title "Importuj warstwę"
4. Click "shp" tab
5. Fill form:
   - Nazwa warstwy: `UITestLayer`
   - Nazwa grupy: `Stwórz poza grupami`
   - EPSG: `4326` (or leave default `3857`)
6. Drag & drop or click to select files:
   - Select .shp, .shx, .dbf, .prj files together
7. ✅ Verify files appear in upload area
8. Click "Import" button
9. ✅ Verify success notification: "Warstwa została zaimportowana!"
10. ✅ Verify layer appears in layer tree (left panel)
11. ✅ Verify layer renders on map

---

### 5.4 Monitor Console

**Open DevTools Console (F12) and look for:**

✅ **Success logs:**
```
📥 Importing Shapefile layer: {...}
✅ Layer imported successfully
```

❌ **Error logs:**
```
❌ Failed to import layer: <error message>
Backend error data: {...}
```

**Network tab:**
- Find request: `POST /api/layer/add/shp/`
- Status: 200
- Response: `{ "success": true, ... }`

---

## Step 6: Monitor Backend Logs

### Django Logs

```bash
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker

# Follow Django logs
sudo docker logs -f universe-mapmaker-backend_django_1

# Look for:
# - [INFO] Shapefile import started: project=..., layer=...
# - [INFO] Shapefile saved to: qgs/.../uploaded_layer.*
# - [INFO] PostGIS import completed: X features
# - [INFO] tree.json updated
# - [INFO] Layer created: id=...
```

**✅ Success indicators:**
- No `[ERROR]` or `[WARNING]` messages
- "Layer created" message
- "tree.json updated" message

**❌ Error indicators:**
- `[ERROR] Failed to import shapefile`
- `[ERROR] PostGIS import failed`
- `[ERROR] tree.json update failed`

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause:** Token invalid or expired

**Fix:**
1. Re-login to get new token
2. Update curl command with new token

---

### Issue: "Nie znaleziono projektu"

**Cause:** Wrong project name

**Fix:**
1. Use `db_name` from CREATE response (not custom_project_name)
2. Check database: `SELECT project_name FROM geocraft_api_projectitem;`

---

### Issue: "Plik .shp jest wymagany"

**Cause:** Missing .shp file in upload

**Fix:**
1. Ensure .shp file is selected/uploaded
2. Check file extension (case-insensitive: .shp or .SHP)

---

### Issue: Empty layer tree after import

**Cause:** Import failed silently

**Fix:**
1. Check backend logs for errors
2. Verify database: `SELECT * FROM geocraft_api_layer WHERE project = 'YourProject';`
3. Check tree.json exists: `cat ~/mapmaker/server/qgs/YourProject/tree.json`

---

### Issue: Layer doesn't render on map

**Cause:** tree.json not updated or invalid geometries

**Fix:**
1. Check tree.json contains layer
2. Check PostGIS table has features: `SELECT COUNT(*) FROM {table};`
3. Check geometry type matches layer type
4. Check EPSG matches project CRS (3857)

---

## Quick Reference

### Auth Token Location
```javascript
localStorage.getItem('authToken')
```

### Backend Endpoints
- Project creation: `POST /api/projects/create/`
- Shapefile import: `POST /api/layer/add/shp/`

### Database Tables
- Projects: `geocraft_api_projectitem`
- Layers: `geocraft_api_layer`
- Features: `{project}_{layer}_{uuid}`

### File System Paths
- QGS files: `~/mapmaker/server/qgs/{project}/`
- tree.json: `~/mapmaker/server/qgs/{project}/tree.json`
- Uploaded files: `~/mapmaker/server/qgs/{project}/uploaded_layer.*`

### Logs
```bash
# Django
sudo docker logs -f universe-mapmaker-backend_django_1

# QGIS Server
sudo docker logs -f universe-mapmaker-backend_qgis-server_1
```

---

## Success Criteria

✅ **Backend Test:**
- curl returns 200 with `success: true`
- Database has ProjectItem record
- Database has Layer record
- PostGIS table exists with features
- tree.json exists with layer

✅ **Frontend Test:**
- Project created in Dashboard
- Dialog opens on "Importuj warstwę" click
- Files uploaded successfully
- Success notification shown
- Layer appears in layer tree
- Layer renders on map

✅ **All verified → Feature is working!** 🎉

---

**Created:** 2025-10-12
**For:** Universe MapMaker - Shapefile Import Testing
