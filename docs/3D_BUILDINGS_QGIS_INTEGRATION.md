# 3D Buildings QGIS Integration - Complete Implementation Guide

**Status:** ✅ Phase 1 Complete (Frontend) | ⏳ Phase 2 Pending (Backend Integration)

## Overview

This document describes the complete implementation of 3D buildings editing with QGIS Server integration for Universe-MapMaker. The system allows users to click on 3D buildings, edit their attributes, and store data that will eventually be synchronized with QGIS Server via PostGIS backend.

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Redux)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  1. MapContainer.tsx                                                    │
│     - Mapbox GL JS map with 3D buildings layer                          │
│     - Camera controls (pitch, bearing)                                  │
│                                                                         │
│  2. IdentifyTool.tsx (3D PICKING)                                       │
│     - Ray-casting detection (works with any camera angle)               │
│     - 12px tolerance, dynamic for pitch > 45°                           │
│     - Uses src/mapbox/3d-picking.ts utility                             │
│                                                                         │
│  3. FeatureAttributesModal.tsx (EDITING)                                │
│     - Edit building name, coordinates                                   │
│     - Add/edit/delete custom attributes                                 │
│     - Auto-save to localStorage on every change                         │
│                                                                         │
│  4. Redux Store (featuresSlice.ts)                                      │
│     - Universal store for all map features                              │
│     - Building type: 'building'                                         │
│     - Attributes: [{ key, value }, ...]                                 │
│                                                                         │
│  5. buildings-storage.ts (GEOJSON EXPORT)                               │
│     - Export to GeoJSON FeatureCollection                               │
│     - Save to localStorage (temporary)                                  │
│     - Download as .geojson file                                         │
│     - Import from GeoJSON                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                           GeoJSON Export
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Django REST)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Endpoint: POST /api/layers/create-from-geojson/                        │
│                                                                         │
│  Request Body:                                                          │
│  {                                                                      │
│    "project": "MyProject_1",                                            │
│    "layer_name": "Buildings_3D_Edited",                                 │
│    "geojson": { ... },                                                  │
│    "style": {                                                           │
│      "fillColor": "#ff9800",                                            │
│      "strokeColor": "#ffffff"                                           │
│    }                                                                    │
│  }                                                                      │
│                                                                         │
│  Backend Processing:                                                    │
│  1. Save GeoJSON to temp file                                           │
│  2. Import to PostGIS using ogr2ogr                                     │
│  3. Create Layer record in database                                     │
│  4. Add layer to QGS file (PyQGIS)                                      │
│  5. Regenerate tree.json                                                │
│  6. Return layer_id, source_table_name                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         POSTGIS DATABASE                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Table: buildings_3d_edited_abc123                                      │
│  Columns:                                                               │
│    - id (serial)                                                        │
│    - name (varchar)                                                     │
│    - geometry (geometry(Polygon, 3857))                                 │
│    - height (numeric)                                                   │
│    - ... (custom attributes)                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          QGIS SERVER (WMS/WFS)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Project File: /app/qgs/MyProject_1/MyProject_1.qgs                     │
│  Layer: Buildings_3D_Edited                                             │
│  Source: PostGIS connection → buildings_3d_edited_abc123                │
│                                                                         │
│  WMS URL: https://api.universemapmaker.online/ows?                      │
│    SERVICE=WMS&REQUEST=GetMap&                                          │
│    LAYERS=Buildings_3D_Edited&                                          │
│    WIDTH=512&HEIGHT=512&BBOX=...                                        │
│                                                                         │
│  → Frontend loads WMS tiles → displays in layer tree                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Frontend Implementation (✅ COMPLETED)

### 1.1 Orange Highlight for Selected Buildings

**File:** `src/mapbox/map3d.ts`

**Changes:**
- Changed selected building color from `#f75e4c` (red) to `#ff9800` (Material Orange 500)
- Added hover color `#ffb74d` (Orange 300) for lighter feedback
- Updated feature-state paint expression to support both `selected` and `hover` states

**Result:**
```typescript
'fill-extrusion-color': [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  '#ff9800', // Orange 500 for selected
  ['boolean', ['feature-state', 'hover'], false],
  '#ffb74d', // Orange 300 for hover
  '#aaa' // Default gray
],
```

### 1.2 3D Picking with Ray-Casting

**New File:** `src/mapbox/3d-picking.ts`

**Purpose:** Enable accurate building selection from any camera angle (pitch/bearing).

**Key Features:**
- Dynamic tolerance based on pitch angle (2x tolerance when pitch > 45°)
- Distance-based sorting (closest building selected first)
- Separate functions for click and hover detection
- Source detection utility (`composite` vs `mapbox-3d-buildings`)

**Usage:**
```typescript
import { query3DBuildingsAtPoint, get3DBuildingsSource } from '@/mapbox/3d-picking';

const building3DFeatures = query3DBuildingsAtPoint(map, e.point, 12);
const closestBuilding = building3DFeatures[0];
const source = get3DBuildingsSource(map);
```

**Why This Works:**
- Traditional bbox query fails at high pitch angles (buildings appear smaller/distorted)
- Ray-casting approach projects building polygons to screen space
- Calculates distance from click to building centroid
- Returns sorted list (closest first)

### 1.3 Updated IdentifyTool

**File:** `src/features/mapa/komponenty/IdentifyTool.tsx`

**Changes:**
- Integrated 3D picking utility
- Increased tolerance to 12px (from 8px)
- Added logging for pitch/bearing/building count
- Uses closest building from sorted results
- Auto-detects building source for feature-state

**Flow:**
1. User clicks/taps on map
2. Check if 3D buildings layer exists
3. Use `query3DBuildingsAtPoint()` for ray-casting
4. If building found → create/update MapFeature in Redux
5. Set feature-state `selected: true` → triggers orange highlight
6. Open FeatureAttributesModal

### 1.4 GeoJSON Storage System

**New File:** `src/mapbox/buildings-storage.ts`

**Functions:**

#### Export to GeoJSON
```typescript
exportBuildingsToGeoJSON(buildings: MapFeature[], projectName?: string): BuildingGeoJSON
```
- Converts Redux features to GeoJSON FeatureCollection
- Includes metadata (project name, export date, count)
- Flattens attributes array to properties object

#### Save to localStorage
```typescript
saveBuildingsToLocalStorage(projectName: string, buildings: MapFeature[]): void
```
- Key format: `buildings_{projectName}`
- Auto-called on every attribute change
- Enables recovery after page refresh

#### Load from localStorage
```typescript
loadBuildingsFromLocalStorage(projectName: string): MapFeature[] | null
```
- Restores buildings on page load
- Converts GeoJSON back to MapFeature format

#### Download GeoJSON
```typescript
downloadBuildingsGeoJSON(projectName: string, buildings: MapFeature[]): void
```
- Creates downloadable `.geojson` file
- Filename: `{projectName}_buildings_{timestamp}.geojson`
- Pretty-printed JSON (2-space indent)

#### Upload to Backend (Placeholder)
```typescript
uploadBuildingsToBackend(projectName: string, buildings: MapFeature[]): Promise<...>
```
- **Currently not implemented** (logs warning)
- Ready for Phase 2 backend integration

### 1.5 Auto-Save on Attribute Changes

**File:** `src/features/warstwy/modale/FeatureAttributesModal.tsx`

**Changes:**
- Added `autoSaveBuildings()` function
- Called after every change:
  - Name edit
  - Attribute add
  - Attribute edit
  - Attribute delete
- Uses `useSearchParams()` to get project name
- Filters features by type `'building'`
- Logs save operations to console

**Benefits:**
- No manual save required
- Data persists across page refreshes
- Instant backup to localStorage
- Ready for backend sync

---

## Phase 2: Backend Integration (⏳ PENDING)

### 2.1 Backend Endpoint Specification

**Endpoint:** `POST /api/layers/create-from-geojson/`

**Django View (geocraft_api/layers/views.py):**
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.storage import default_storage
import subprocess
import json
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_layer_from_geojson(request):
    """
    Create a new layer from GeoJSON uploaded by frontend
    """
    project_name = request.data.get('project')
    layer_name = request.data.get('layer_name')
    geojson_data = request.data.get('geojson')
    style = request.data.get('style', {})

    # Validate inputs
    if not all([project_name, layer_name, geojson_data]):
        return Response({
            'success': False,
            'message': 'Missing required fields'
        }, status=400)

    # Check if project exists
    try:
        project = ProjectItem.objects.get(project_name=project_name)
    except ProjectItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Project not found'
        }, status=404)

    # Save GeoJSON to temp file
    temp_filename = f"{layer_name}_{uuid.uuid4().hex[:8]}.geojson"
    temp_path = f"/tmp/{temp_filename}"
    with open(temp_path, 'w') as f:
        json.dump(geojson_data, f)

    # Generate unique table name
    source_table_name = f"{layer_name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:8]}"

    # Import to PostGIS using ogr2ogr
    db_config = {
        'host': settings.DATABASES['default']['HOST'],
        'port': settings.DATABASES['default']['PORT'],
        'dbname': project_name,
        'user': settings.DATABASES['default']['USER'],
        'password': settings.DATABASES['default']['PASSWORD']
    }

    pg_conn = f"PG:host={db_config['host']} port={db_config['port']} dbname={db_config['dbname']} user={db_config['user']} password={db_config['password']}"

    cmd = [
        'ogr2ogr',
        '-f', 'PostgreSQL',
        pg_conn,
        temp_path,
        '-nln', source_table_name,
        '-t_srs', 'EPSG:3857',
        '-overwrite'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        return Response({
            'success': False,
            'message': f'ogr2ogr failed: {result.stderr}'
        }, status=500)

    # Create Layer record in database
    layer = Layer.objects.create(
        project=project_name,
        projectitem=project,
        name=layer_name,
        source_table_name=source_table_name,
        geometry_type='Polygon',
        is_app=True,  # Mark as app-created layer
        published=False
    )

    # Add layer to QGS file
    qgs_path = f"qgs/{project_name}/{project_name}.qgs"
    add_layer_to_qgs_file(qgs_path, source_table_name, layer_name, style, db_config)

    # Regenerate tree.json
    make_json_tree_and_save(project_name)

    # Clean up temp file
    os.remove(temp_path)

    return Response({
        'success': True,
        'layer_id': layer.id,
        'source_table_name': source_table_name,
        'message': 'Layer created successfully'
    })
```

**Helper Function (geocraft_api/layers/service.py):**
```python
from qgis.core import QgsProject, QgsVectorLayer, QgsDataSourceUri

def add_layer_to_qgs_file(qgs_path, table_name, layer_name, style, db_config):
    """
    Add a PostGIS layer to existing QGS file using PyQGIS
    """
    # Load project
    project = QgsProject.instance()
    project.read(qgs_path)

    # Create PostGIS connection URI
    uri = QgsDataSourceUri()
    uri.setConnection(
        db_config['host'],
        db_config['port'],
        db_config['dbname'],
        db_config['user'],
        db_config['password']
    )
    uri.setDataSource('public', table_name, 'geometry')

    # Create vector layer
    layer = QgsVectorLayer(uri.uri(), layer_name, 'postgres')

    if not layer.isValid():
        raise Exception(f"Failed to create layer from {table_name}")

    # Apply style
    if style:
        from qgis.core import QgsSimpleFillSymbolLayer, QgsFillSymbol
        symbol = QgsFillSymbol.createSimple({
            'color': style.get('fillColor', '#ff9800'),
            'outline_color': style.get('strokeColor', '#ffffff'),
            'outline_width': str(style.get('strokeWidth', 1))
        })
        layer.renderer().setSymbol(symbol)

    # Add layer to project
    project.addMapLayer(layer)

    # Save project
    project.write(qgs_path)

    return True
```

### 2.2 Frontend Integration

**Update `src/mapbox/buildings-storage.ts`:**
```typescript
export const uploadBuildingsToBackend = async (
  projectName: string,
  buildings: MapFeature[]
): Promise<{ success: boolean; layerId?: number; message?: string }> => {
  const geojson = exportBuildingsToGeoJSON(buildings, projectName);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/layers/create-from-geojson/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${getAuthToken()}` // From Redux auth state
      },
      body: JSON.stringify({
        project: projectName,
        layer_name: 'Buildings_3D_Edited',
        geojson,
        style: {
          fillColor: '#ff9800',
          strokeColor: '#ffffff',
          strokeWidth: 1
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Buildings uploaded to backend', {
        layerId: data.layer_id,
        sourceTable: data.source_table_name
      });
    }

    return data;
  } catch (error) {
    console.error('Failed to upload buildings to backend:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
```

**Add sync button to FeatureAttributesModal:**
```typescript
// In DialogActions
<Button
  onClick={async () => {
    const allBuildings = Object.values(features).filter(f => f.type === 'building');
    const result = await uploadBuildingsToBackend(projectName, allBuildings);

    if (result.success) {
      alert('Buildings synchronized with QGIS Server!');
    } else {
      alert(`Sync failed: ${result.message}`);
    }
  }}
  variant="outlined"
  startIcon={<CloudUploadIcon />}
>
  Sync to QGIS
</Button>
```

### 2.3 QGIS Server WMS Loading

After backend creates layer, frontend can load it as WMS:

**File:** `src/features/warstwy/komponenty/LayerTree.tsx` (or new component)

```typescript
import { useGetProjectDataQuery } from '@/redux/api/projectsApi';
import { addWMSLayer } from '@/mapbox/qgis-layers';

const LayerTreeWithWMS = () => {
  const { current: mapRef } = useMap();
  const searchParams = useSearchParams();
  const projectName = searchParams.get('project');

  // Fetch project data (includes tree.json)
  const { data: projectData } = useGetProjectDataQuery({
    project: projectName,
    published: false
  });

  useEffect(() => {
    if (!mapRef || !projectData?.children) return;

    const map = mapRef.getMap();

    // Add all WMS layers from tree.json
    projectData.children.forEach((layer: any) => {
      if (layer.name === 'Buildings_3D_Edited') {
        addWMSLayer(map, {
          layerName: layer.name,
          projectName: projectName,
          wmsUrl: `https://api.universemapmaker.online/ows?SERVICE=WMS&REQUEST=GetMap&LAYERS=${layer.name}&WIDTH=512&HEIGHT=512&BBOX={bbox-epsg-3857}&SRS=EPSG:3857&FORMAT=image/png&TRANSPARENT=true`,
          opacity: 0.8,
          visible: true
        });
      }
    });
  }, [mapRef, projectData]);

  return <div>Layer Tree UI with WMS layers...</div>;
};
```

---

## Testing Guide

### Test 1: Orange Highlight
**Steps:**
1. Open map in full 3D mode (buildings3d or full3d style)
2. Enable Identify tool
3. Click on any building
4. **Expected:** Building turns orange (#ff9800)
5. Click another building
6. **Expected:** Previous building returns to gray, new one turns orange

### Test 2: 3D Picking from Different Angles
**Steps:**
1. Set pitch to 60°
2. Set bearing to 45° (rotate map)
3. Click on building from the side
4. **Expected:** Building should still be selected (ray-casting works!)
5. Open console, check for `🎯 3D Picking: Found X buildings` log
6. Verify log shows pitch, bearing, and closest building distance

### Test 3: GeoJSON Export
**Steps:**
1. Click on 3 different buildings
2. Edit attributes for each (add "floor_count", "year_built", etc.)
3. Open browser console
4. Run: `localStorage.getItem('buildings_MyProject_1')`
5. **Expected:** See GeoJSON with 3 features
6. Open DevTools → Application → Local Storage
7. **Expected:** Key `buildings_MyProject_1` exists with JSON data

### Test 4: Auto-Save
**Steps:**
1. Click on building
2. Edit name to "Building A"
3. **Expected:** Console log `💾 Auto-saved buildings to localStorage`
4. Add attribute "color" = "blue"
5. **Expected:** Console log auto-save again
6. Refresh page
7. Load buildings from localStorage
8. **Expected:** Building A still has name and "color" attribute

### Test 5: GeoJSON Download
**Steps:**
1. Edit 2-3 buildings with attributes
2. Add to `FeatureAttributesModal.tsx` (temp test button):
   ```typescript
   <Button onClick={() => downloadBuildingsGeoJSON(projectName, Object.values(features))}>
     Download GeoJSON
   </Button>
   ```
3. Click download button
4. **Expected:** File downloads as `MyProject_1_buildings_{timestamp}.geojson`
5. Open file in text editor
6. **Expected:** Valid GeoJSON with FeatureCollection and metadata

### Test 6: WMS Loading (Phase 2)
**Steps:**
1. Upload buildings to backend (sync button)
2. Backend creates layer in PostGIS
3. Backend adds layer to QGS file
4. Backend regenerates tree.json
5. Frontend refetches `/api/projects/new/json?project=MyProject_1`
6. **Expected:** tree.json includes "Buildings_3D_Edited" layer
7. Frontend adds WMS layer to map
8. **Expected:** Buildings appear as WMS tiles on map

---

## Troubleshooting

### Building Not Selected When Clicked

**Symptoms:**
- Click on building → nothing happens
- Console shows `🔍 Identify: Found 0 buildings`

**Possible Causes:**
1. **3D buildings layer not loaded:** Check if `map.getLayer('3d-buildings')` exists
2. **Pitch too low:** Buildings don't render at zoom < 15
3. **Click tolerance too small:** Try increasing to 16px in `query3DBuildingsAtPoint()`

**Fix:**
```typescript
// In IdentifyTool.tsx
const building3DFeatures = has3DBuildings
  ? query3DBuildingsAtPoint(map, e.point, 16) // Increased from 12px
  : [];
```

### Orange Highlight Not Appearing

**Symptoms:**
- Building selected (modal opens) but stays gray
- Feature-state set correctly in console

**Possible Causes:**
1. **Wrong source ID:** Using 'composite' when should be 'mapbox-3d-buildings' (or vice versa)
2. **Feature ID mismatch:** Building feature has no ID or wrong ID format

**Fix:**
```typescript
// Check which source is being used
console.log('Building source:', get3DBuildingsSource(map));

// Check if feature has ID
console.log('Building feature ID:', buildingFeature.id);
```

### localStorage Full Error

**Symptoms:**
- Console error: `QuotaExceededError: localStorage is full`
- Buildings not saving

**Possible Causes:**
- Too many buildings (>5000)
- Each building has large attributes
- localStorage limit: ~5-10 MB per domain

**Fix:**
```typescript
// In buildings-storage.ts, add compression
import pako from 'pako'; // Install: npm install pako

export const saveBuildingsToLocalStorage = (projectName, buildings) => {
  const geojson = exportBuildingsToGeoJSON(buildings, projectName);
  const json = JSON.stringify(geojson);

  // Compress with gzip
  const compressed = pako.gzip(json);
  const key = `buildings_${projectName}`;
  localStorage.setItem(key, btoa(String.fromCharCode(...compressed)));
};
```

### Backend Upload Fails with 500 Error

**Symptoms:**
- Frontend shows "Sync failed: Internal Server Error"
- Backend logs show `ogr2ogr failed`

**Possible Causes:**
1. **ogr2ogr not installed:** Django container missing GDAL
2. **PostGIS database doesn't exist:** Project database not created
3. **Invalid GeoJSON:** Frontend sending malformed data

**Fix:**
```python
# In Django view, add detailed error logging
import logging
logger = logging.getLogger(__name__)

result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode != 0:
    logger.error(f"ogr2ogr failed for project {project_name}")
    logger.error(f"Command: {' '.join(cmd)}")
    logger.error(f"Stderr: {result.stderr}")
    logger.error(f"GeoJSON: {json.dumps(geojson_data)[:500]}...")
```

---

## Future Enhancements

### 1. Real-Time Collaboration
- WebSocket sync between multiple users editing same project
- Operational Transform (OT) for conflict resolution
- User cursors showing who's editing which building

### 2. Offline Support
- Service Worker caching for map tiles
- IndexedDB for larger storage (>10 MB)
- Sync queue for offline edits

### 3. Advanced 3D Editing
- Height adjustment slider (change building height visually)
- Roof type selector (flat, gabled, hipped)
- 3D model import (COLLADA, glTF)

### 4. Batch Operations
- Select multiple buildings (Shift+Click)
- Bulk attribute editing
- CSV import/export for building data

### 5. AI Integration
- Automatic building attribute inference from satellite imagery
- Height estimation from shadows
- Building type classification (residential, commercial, industrial)

---

## References

### Official Documentation
- **Mapbox GL JS 3D Buildings:** https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
- **Mapbox Feature State:** https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#feature-state
- **QGIS PyQGIS Cookbook:** https://docs.qgis.org/3.28/en/docs/pyqgis_developer_cookbook/
- **PostGIS Documentation:** https://postgis.net/docs/
- **GeoJSON Specification:** https://geojson.org/

### Internal Documentation
- **Backend API Docs:** `Universe-Mapmaker-Backend/README.md`
- **Projects API:** `docs/backend/projects_api_docs.md`
- **Database Schema:** `CLAUDE.md` (Architecture Overview section)

---

## Summary

### ✅ Phase 1 Complete (Frontend)
1. Orange highlight (#ff9800) for selected buildings
2. 3D picking with ray-casting (works from any camera angle)
3. FeatureAttributesModal with inline editing
4. Auto-save to localStorage on every change
5. GeoJSON export/import/download utilities
6. Redux integration for universal feature management

### ⏳ Phase 2 Pending (Backend)
1. Backend endpoint: `/api/layers/create-from-geojson/`
2. Django view + service functions
3. ogr2ogr integration for PostGIS import
4. PyQGIS layer creation in QGS file
5. tree.json regeneration
6. WMS layer loading in frontend

### 🎯 Next Steps
1. Implement backend endpoint (Django)
2. Test GeoJSON upload flow
3. Verify PostGIS table creation
4. Check QGS file layer addition
5. Test WMS tile rendering
6. Add sync button to frontend UI
7. Deploy to production and test end-to-end

---

**Last Updated:** 2025-10-13
**Authors:** Claude (AI Assistant) + User
**Version:** 1.0.0
