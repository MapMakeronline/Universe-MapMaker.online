# Manual Backend Deployment Guide

## Summary

The backend changes for the Shapefile import feature have been successfully implemented and pushed to GitHub:

- **Branch:** `feature/create-from-shapefile`
- **Commit:** `187f716`
- **GitHub URL:** https://github.com/MapMakeronline/Universe-Mapmaker-Backend/tree/feature/create-from-shapefile

## Changes Made

### 1. Serializer (geocraft_api/projects/serializers.py)
Added `CreateProjectFromShapefileSerializer` for validating incoming requests with domain uniqueness check.

### 2. View (geocraft_api/projects/views.py)
Added `create_project_from_shapefile` function (~230 lines) that handles:
- Atomic project creation with Shapefiles
- QGIS processing (Shapefile → GeoJSON → PostGIS)
- QGS file generation with all layers
- tree.json generation with layer hierarchy

### 3. URL Routing (geocraft_api/projects/urls.py)
Added route: `/api/projects/create-from-shp/`

## Deployment Location

**Production Backend:** VM instance `universe-backend` (34.0.251.33, europe-central2-a)

The backend runs on a Compute Engine VM, **not** Cloud Run.

## Manual Deployment Steps

### Option 1: SSH to VM and Pull Changes

```bash
# 1. SSH to backend VM
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker

# 2. Navigate to backend directory
cd ~/mapmaker/backend  # Adjust path as needed
# OR find it with:
sudo find / -name "geocraft" -type d 2>/dev/null | grep -v venv

# 3. Fetch and checkout feature branch
git fetch origin
git checkout feature/create-from-shapefile
git pull origin feature/create-from-shapefile

# 4. Restart Django server
# If using Docker:
sudo docker-compose restart django

# OR if using systemd:
sudo systemctl restart django-backend

# OR if using manual process:
# Find Django process: ps aux | grep runserver
# Kill it: sudo kill -9 <PID>
# Restart: python manage.py runserver 0.0.0.0:8000
```

### Option 2: Direct File Update (if Git not available)

If the VM doesn't have the Git repository:

1. **Copy the new view code** from `/tmp/backend-fix/new_view.py` (Windows machine)
2. **SSH to VM** and append to views.py:
   ```bash
   gcloud compute scp C:\Users\mestw\Downloads\Universe-MapMaker.online-dev (2)\Universe-MapMaker.online-dev\backend_view_code.py universe-backend:/tmp/new_view.py --zone=europe-central2-a

   gcloud compute ssh universe-backend --zone=europe-central2-a --command="cat /tmp/new_view.py >> /path/to/geocraft_api/projects/views.py"
   ```

3. **Update serializers.py** similarly
4. **Update urls.py** with the new route
5. **Restart Django server**

### Option 3: Merge to Main and Deploy

```bash
# 1. Merge feature branch to main (locally or via GitHub PR)
git checkout main
git merge feature/create-from-shapefile
git push origin main

# 2. SSH to VM and pull main
gcloud compute ssh universe-backend --zone=europe-central2-a
cd ~/mapmaker/backend
git pull origin main

# 3. Restart Django server
sudo systemctl restart django-backend
```

## Verification Steps

After deployment, test the endpoint:

### 1. Test with curl
```bash
curl -X POST https://api.universemapmaker.online/api/projects/create-from-shp/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "project=TestProject" \
  -F "domain=testproject" \
  -F "projectDescription=Test Shapefile Import" \
  -F "shapefiles[0].name=test_layer" \
  -F "shapefiles[0].shp=@/path/to/file.shp" \
  -F "shapefiles[0].shx=@/path/to/file.shx" \
  -F "shapefiles[0].dbf=@/path/to/file.dbf"
```

### 2. Check Response
Expected response:
```json
{
  "success": true,
  "message": "Projekt 'TestProject' został utworzony z 1 warstwami",
  "data": {
    "project_name": "TestProject",
    "db_name": "TestProject",
    "domain": "testproject",
    "layers": [
      {
        "layer_name": "test_layer",
        "source_table_name": "TestProject_test_layer",
        "geometry_type": "Point",
        "feature_count": 10,
        "extent": [lng_min, lat_min, lng_max, lat_max]
      }
    ],
    "qgs_path": "/app/qgs/TestProject/TestProject.qgs",
    "tree_json_path": "/app/qgs/TestProject/tree.json"
  }
}
```

### 3. Verify in Database
```bash
# SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Connect to PostgreSQL
psql -h /cloudsql/universe-mapmaker:europe-central2:geocraft-postgres -U postgres -d geocraft_db

# Check if project was created
SELECT project_name, domain_id FROM geocraft_api_projectitem WHERE project_name LIKE 'TestProject%';

# Check if layers were created
SELECT id, project, source_table_name FROM geocraft_api_layer WHERE project LIKE 'TestProject%';

# Check if QGS file record exists
SELECT project, qgs FROM geocraft_api_qgsfile WHERE project LIKE 'TestProject%';
```

### 4. Verify Files on VM
```bash
# Check QGS file
ls -lh /app/qgs/TestProject/

# Should show:
# - TestProject.qgs (not empty, >8KB)
# - tree.json (with populated children array)

# Verify tree.json content
cat /app/qgs/TestProject/tree.json | python3 -m json.tool | grep -A5 children
```

### 5. Test from Frontend
1. Open dashboard: https://universemapmaker.online/dashboard
2. Click "Utwórz i Importuj QGS" (or use new Shapefile import dialog)
3. Select Shapefile components (.shp, .shx, .dbf, .prj)
4. Create project
5. Verify project appears in dashboard with layers
6. Open project in map view
7. Confirm layers are visible in layer tree

## Troubleshooting

### Issue: Endpoint not found (404)
**Cause:** URL routing not updated or Django not restarted
**Fix:**
```bash
# Verify urls.py has new route
cat geocraft_api/projects/urls.py | grep create-from-shp

# Restart Django
sudo systemctl restart django-backend
```

### Issue: Import error (500)
**Cause:** Missing imports in views.py
**Fix:**
```bash
# Check if all imports are present
head -50 geocraft_api/projects/views.py | grep -E "import|from"

# Should include:
# from .serializers import CreateProjectFromShapefileSerializer
# from qgis.core import QgsProject, QgsVectorLayer, QgsCoordinateReferenceSystem, QgsVectorFileWriter
```

### Issue: Empty layers array
**Cause:** Shapefile processing failed
**Fix:**
```bash
# Check Django logs
sudo journalctl -u django-backend -n 100

# Look for errors related to:
# - QgsVectorLayer.isValid() failures
# - GeoJSON export errors
# - PostGIS import errors
```

### Issue: Database connection error
**Cause:** Cloud SQL proxy not running
**Fix:**
```bash
# Check if Cloud SQL proxy is running
ps aux | grep cloud_sql_proxy

# Restart if needed
sudo systemctl restart cloud-sql-proxy
```

## Backend Infrastructure

- **VM:** `universe-backend` (34.0.251.33, europe-central2-a)
- **Django:** Port 8000 (via Nginx at `https://api.universemapmaker.online`)
- **QGIS Server:** Port 8080 (via Nginx at `https://api.universemapmaker.online/ows`)
- **Database:** Cloud SQL PostgreSQL (`/cloudsql/universe-mapmaker:europe-central2:geocraft-postgres`)
- **Storage FASE:** Cloud Storage `gs://universe-qgis-projects` mounted at `/mnt/qgis-projects`

## Next Steps

1. **Deploy to production** using one of the methods above
2. **Test the endpoint** with curl and frontend
3. **Merge to main** once verified working
4. **Update frontend** to use the new atomic workflow (already implemented)
5. **Document for users** in production release notes

## Support

If deployment fails:

1. Check Django logs: `sudo journalctl -u django-backend -n 100`
2. Check QGIS Server logs: `sudo docker logs qgis-server`
3. Check database connectivity: `psql -h /cloudsql/... -U postgres -d geocraft_db`
4. Verify Cloud SQL proxy: `sudo systemctl status cloud-sql-proxy`
5. Check backend process: `ps aux | grep django`

Contact repository maintainer if issues persist.
