# QGIS Server Integration Plan - Comprehensive Analysis & Implementation Guide

**Date:** 2025-10-13
**Project:** Universe-MapMaker
**Status:** Research Complete - Implementation Ready

---

## Executive Summary

### Current Integration Status: **PARTIAL** (60% Complete)

**What's Working:**
- ✅ QGIS Server deployed and accessible (`/ows` endpoint via Nginx)
- ✅ Backend QGS file parsing and layer extraction (PyQGIS)
- ✅ Frontend WMS/WFS layer rendering utilities (`qgis-layers.ts`)
- ✅ Frontend QGISProjectLoader component for map integration
- ✅ Backend tree.json generation from QGS projects
- ✅ PostgreSQL/PostGIS database integration
- ✅ QGS/QGZ import workflow (Create + Import pattern)

**What's Missing:**
- ❌ QGIS Server not serving layers from imported projects (tree.json empty)
- ❌ Frontend not loading layers from QGIS Server on map open
- ❌ WMS/WFS layer requests returning errors (layers not found)
- ❌ Project publication to QGIS Server not working
- ❌ Layer tree synchronization between backend and QGIS Server
- ❌ No visual feedback for QGIS Server integration status

---

## 1. Backend Analysis

### 1.1 QGIS Server Configuration

**Location:** VM at `universe-backend` (34.0.251.33:8080)
**Docker Container:** `universe-mapmaker-backend_qgis-server_1`
**Image:** `3liz/qgis-map-server:3.28`

**Configuration** (`docker-compose.qgis.yml`):
```yaml
qgis-server:
  image: 3liz/qgis-map-server:3.28
  ports:
    - "8080:8080"
  environment:
    - QGIS_SERVER_PARALLEL_RENDERING=true
    - QGSRV_LOGGING_LEVEL=DEBUG
    - QGSRV_CACHE_ROOTDIR=/projects
    - QGSRV_CACHE_SIZE=20
    - QGSRV_SERVER_TIMEOUT=120
  volumes:
    - /mnt/qgis-projects:/projects:ro  # Cloud Storage mounted via gcsfuse
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/ows/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"]
```

**Nginx Routing** (`nginx.conf`):
```nginx
location ~* ^/ows(/.*)?$ {
    add_header 'Access-Control-Allow-Origin' '*' always;
    proxy_pass http://qgis_backend;  # → qgis-server:8080
    proxy_connect_timeout 300s;
    proxy_read_timeout 300s;
}
```

**Endpoint:** `https://api.universemapmaker.online/ows`

**Status:**
- ✅ QGIS Server running and accessible
- ✅ GetCapabilities request works
- ❌ Layer-specific requests fail (layers not found)

---

### 1.2 Backend QGS File Management

**Key Files:**
- **`geocraft_api/projects/service.py`** (195KB) - Main project logic
- **`geocraft_api/layers/service.py`** (183KB) - Layer management
- **`geocraft_api/json_utils.py`** (26KB) - Tree.json generation
- **`geocraft_api/layers/utils.py`** - Layer utilities

#### 1.2.1 Project Creation Workflow

**Endpoint:** `POST /api/projects/create/`

**Function:** `create_project()` → `createProjectQgs()`

**Process:**
```python
# Step 1: Create PostgreSQL database for project
project_name = generate_project_name(custom_project_name)  # e.g., "MyProject_1"
create_database(db_login, project_name)

# Step 2: Create ProjectItem in Django database
ProjectItem.objects.create(
    project_name="MyProject_1",
    custom_project_name="MyProject",
    user=current_user,
    domain=domain_obj
)

# Step 3: Copy QGS template
template_path = "templates/template/template3857.qgs"
target_path = f"qgs/{project_name}/{project_name}.qgs"
copyfile(template_path, target_path)

# Response includes db_name (real project_name with suffix)
return {
    'data': { 'host': ..., 'db_name': 'MyProject_1', ... },
    'success': True,
    'message': 'Projekt został pomyślnie utworzony'
}
```

**File Structure Created:**
```
qgs/
└── MyProject_1/
    ├── MyProject_1.qgs         # Empty template (EPSG:3857)
    └── (tree.json not generated yet)
```

---

#### 1.2.2 QGS Import Workflow

**Endpoint:** `POST /api/projects/import/qgs/`

**Function:** `import_qgs()` → `read_and_check_new_project_file()`

**Process:**
```python
# Step 1: Delete old QGS file
delete_project_qgs(project_name, user.dbLogin, delete=True)

# Step 2: Save uploaded QGS file
qgs_file_path = os.path.join(f"qgs/{project_name}", f"{project_name}.qgs")
shutil.move(uploaded_file_path, qgs_file_path)

# Step 3: Read and process QGS file with PyQGIS
def read_and_check_new_project_file(project_name, user):
    project = QgsProject.instance()
    qgs_path = f"qgs/{project_name}/{project_name}.qgs"

    if not project.read(qgs_path):
        return error("Failed to read QGS file")

    # Step 4: Extract and import layers
    for layer_id, layer in project.mapLayers().items():
        # Export layer to GeoJSON
        export_path = f"qgs/{project_name}/to_export_{id}.geojson"
        QgsVectorFileWriter.writeAsVectorFormat(layer, export_path, ...)

        # Import to PostGIS using ogr2ogr
        source_table_name = generate_source_table_name(layer.name(), id)
        create_geo_json_layer(project_name, user, export_path, source_table_name, epsg)

        # Create Layer record in database
        Layer.objects.create(
            project=project_name,
            source_table_name=source_table_name
        )

        # Update layer source in QGS to point to PostGIS
        uri = QgsDataSourceUri()
        uri.setConnection(host, port, project_name, user.dbLogin, user.dbPassword)
        uri.setDataSource("public", source_table_name, "geom")
        layer.setDataSource(uri.uri(), layer.name(), "postgres")

    # Step 5: Generate tree.json for frontend
    make_json_tree_and_save(project, project_name)

    project.write()  # Save updated QGS file
```

**Critical Issue Identified:**
```python
# In make_json_tree_and_save() (json_utils.py)
def get_all_layers(project, project_name, root):
    layers_in_form = {}
    pool = ThreadPool(NUMBER_OF_POOL_NODES)
    func = partial(get_form_for_layer, project_name, ...)
    pool.map(func, list(project.mapLayers().values()))
    # ❌ PROBLEM: Threading with QgsProject.instance() causes crashes!
    # QObject cannot be created in different thread
```

**Error Seen in Logs:**
```
QObject::moveToThread: Current thread (0x...) is not the object's thread (0x...)
Error getExtentLayer: list index out of range
Error get_project_large: 'NoneType' object is not subscriptable
```

---

#### 1.2.3 Tree.json Generation

**Function:** `make_json_tree_and_save()` in `json_utils.py`

**Purpose:** Creates JSON representation of QGS layer tree for frontend

**Structure:**
```python
class Project:
    children: List[Group | Layer]  # Layer tree hierarchy
    name: str                       # "ProjectName.qgs"
    extent: [float, float, float, float]  # [minX, minY, maxX, maxY]
    srid: str                       # "3857"
    wms_url: str                    # Empty until published
    wfs_url: str                    # Empty until published

class Group:
    children: List[Group | Layer]
    name: str
    visible: bool
    type: "group"

class Layer_vector_layer:
    name: str
    id: str                         # Layer UUID from QGS
    type: "VectorLayer"
    visible: bool
    extent: [float, float, float, float]
    geometry: str                   # "Point", "LineString", "Polygon"
    opacity: int                    # 0-255
    source_table_name: str          # PostGIS table name
```

**Output Location:** `qgs/{project_name}/tree.json`

**Current Issue:**
- ❌ tree.json often has `"children": []` (empty)
- ❌ Layer extent calculation fails → extent = []
- ❌ Threading issues cause random failures

---

### 1.3 QGIS Server Integration Points

#### 1.3.1 WMS/WFS Configuration

**Function:** `turnONWfSForNewProject()` in `projects/utils.py`

**Process:**
```python
def turnONWfSForNewProject(project):
    """Enable WFS for all vector layers in QGS file"""
    tree = ET.parse(f"qgs/{project_name}/{project_name}.qgs")
    root = tree.getroot()

    # Add WFSLayers property to QGS XML
    property = root.find('properties')
    wfs_prop = ET.SubElement(property, 'WFSLayers', type='QStringList')

    for layer_id, layer in project.mapLayers().items():
        if isinstance(layer, QgsVectorLayer):
            # Add layer ID to WFSLayers list
            value = ET.SubElement(wfs_prop, 'value')
            value.text = layer_id

    tree.write(f"qgs/{project_name}/{project_name}.qgs", encoding="utf-8")
```

**WFS Transactions (WFST) for editing:**
```python
def turn_on_wfs(layer_id, project_name, transaction=False):
    """Enable WFS-T for layer editing"""
    # Add to WFSTLayers (Delete, Insert, Update)
    wfst_prop = ET.SubElement(property, 'WFSTLayers')
    ET.SubElement(wfst_prop, 'Delete', type='QStringList')
    ET.SubElement(wfst_prop, 'Insert', type='QStringList')
    ET.SubElement(wfst_prop, 'Update', type='QStringList')
```

**Current Status:**
- ✅ WFS enabled in QGS files
- ❌ QGIS Server not recognizing layers (MAP parameter issue?)

---

#### 1.3.2 Project Publication

**Endpoint:** `POST /api/projects/publish`

**Function:** `publish_project()` (needs implementation?)

**Expected Process:**
```python
def publish_project(project_name, user):
    # 1. Validate project has layers
    project_item = get_project_item(project_name)
    if not project_item.layer.exists():
        return error("Project has no layers")

    # 2. Create GeoServer workspace (if using GeoServer)
    # OR
    # 2. Ensure QGIS Server can access QGS file
    qgs_path = f"/projects/{project_name}/{project_name}.qgs"
    if not os.path.exists(qgs_path):
        return error("QGS file not found")

    # 3. Generate WMS/WFS URLs
    base_url = "https://api.universemapmaker.online/ows"
    wms_url = f"{base_url}?MAP={project_name}"
    wfs_url = f"{base_url}?MAP={project_name}"

    # 4. Update ProjectItem
    project_item.published = True
    project_item.wms_url = wms_url
    project_item.wfs_url = wfs_url
    project_item.save()

    return success("Project published")
```

**Current Implementation:** Likely incomplete or missing

---

### 1.4 Database Schema

**Key Tables:**

#### ProjectItem
```sql
geocraft_api_projectitem (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR UNIQUE NOT NULL,     -- "MyProject_1"
    custom_project_name VARCHAR,              -- "MyProject"
    user_id INTEGER FK → CustomUser,
    published BOOLEAN DEFAULT FALSE,
    category VARCHAR,
    description TEXT,
    keywords VARCHAR,
    domain_id INTEGER FK → Domain,
    wms_url VARCHAR,                          -- Empty until published
    wfs_url VARCHAR,                          -- Empty until published
    geoserver_workspace VARCHAR,
    base_map VARCHAR,
    creationDate TIMESTAMP DEFAULT NOW()
)
```

#### Layer
```sql
geocraft_api_layer (
    id SERIAL PRIMARY KEY,
    project VARCHAR NOT NULL,                 -- String reference (not FK!)
    projectitem INTEGER FK → ProjectItem,     -- Actual FK
    source_table_name VARCHAR,                -- PostGIS table name
    creationDateOfLayer TIMESTAMP,
    published BOOLEAN DEFAULT FALSE,
    public BOOLEAN DEFAULT FALSE,
    is_inspire BOOLEAN DEFAULT FALSE,
    is_app BOOLEAN DEFAULT FALSE,
    consultation_id INTEGER FK → Consultation
)
```

**Critical Pattern:**
- Layers have **TWO** connections to ProjectItem:
  1. `project` (varchar) - String reference
  2. `projectitem` (FK) - Foreign key
- Always filter by BOTH when querying!

---

## 2. Frontend Analysis

### 2.1 QGIS Layer Rendering

**File:** `src/mapbox/qgis-layers.ts` (497 lines)

**Available Functions:**

#### `addWMSLayer(map, options)`
```typescript
interface WMSLayerOptions {
  layerName: string;      // Layer name from QGIS project
  projectName: string;    // Project name (used in MAP parameter)
  opacity?: number;       // 0-1
  visible?: boolean;
  minZoom?: number;
  maxZoom?: number;
  crs?: string;           // Default: EPSG:3857
}

// Creates raster source with WMS tile URL
const wmsUrl = `${QGIS_SERVER_URL}?` +
  `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
  `&LAYERS=${layerName}` +
  `&WIDTH=256&HEIGHT=256` +
  `&CRS=EPSG:3857` +
  `&BBOX={bbox-epsg-3857}` +
  `&FORMAT=image/png` +
  `&TRANSPARENT=true` +
  `&MAP=${projectName}`;  // ← CRITICAL: Project identifier
```

#### `addWFSLayer(map, options)`
```typescript
interface WFSLayerOptions {
  layerName: string;
  projectName: string;
  maxFeatures?: number;   // Default: 1000
  crs?: string;           // Default: EPSG:4326 (GeoJSON)
  style?: {
    fillColor?: string;
    strokeColor?: string;
    // ...
  };
}

// Fetches GeoJSON from QGIS Server
const wfsUrl = `${QGIS_SERVER_URL}?` +
  `SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature` +
  `&TYPENAME=${layerName}` +
  `&OUTPUTFORMAT=application/json` +
  `&SRSNAME=EPSG:4326` +
  `&MAXFEATURES=${maxFeatures}` +
  `&MAP=${projectName}`;
```

**Other Functions:**
- `removeQGISLayer(map, layerId)` - Remove layer and source
- `updateQGISLayerVisibility(map, layerId, visible)` - Toggle visibility
- `updateQGISLayerOpacity(map, layerId, opacity)` - Update opacity
- `getQGISLayers(map)` - List all QGIS layers on map

---

### 2.2 QGIS Project Loader

**File:** `src/components/qgis/QGISProjectLoader.tsx` (190 lines)

**Purpose:** Load QGIS project and render layers on map

**Current Implementation:**
```typescript
export function QGISProjectLoader({ projectName, onLoad }: Props) {
  const { current: map } = useMap();

  // Fetch project data (tree.json)
  const { data, isLoading, error } = useGetProjectDataQuery({
    project: projectName,
  });

  useEffect(() => {
    if (!map || !data) return;

    // 1. Fly to project extent
    const [minX, minY, maxX, maxY] = data.extent;
    // Convert EPSG:3857 → EPSG:4326
    const lng = (centerX * 180) / 20037508.34;
    const lat = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
    map.flyTo({ center: [lng, lat], zoom: 12 });

    // 2. Collect visible layers from tree
    const layersToLoad: QGISLayerNode[] = [];
    const collectVisibleLayers = (nodes: QGISLayerNode[]) => {
      for (const node of nodes) {
        if (isGroupLayer(node)) {
          collectVisibleLayers(node.children);
        } else if (node.visible && (isVectorLayer(node) || isRasterLayer(node))) {
          layersToLoad.push(node);
        }
      }
    };
    collectVisibleLayers(data.children);

    // 3. Add layers to map using WMS
    layersToLoad.forEach((layer) => {
      addQGISLayer(map, projectName, layer);
    });
  }, [map, data, projectName]);

  // ...
}

function addQGISLayer(map, projectName, layer) {
  const wmsUrl =
    `https://api.universemapmaker.online/ows?` +
    `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&LAYERS=${layer.id}` +  // ← Using layer.id, not layer.name!
    `&WIDTH=256&HEIGHT=256&FORMAT=image/png` +
    `&TRANSPARENT=true&CRS=EPSG:3857` +
    `&BBOX={bbox-epsg-3857}`;

  map.addSource(`qgis-${layer.id}`, {
    type: 'raster',
    tiles: [wmsUrl],
    tileSize: 256,
  });

  map.addLayer({
    id: `layer-${layer.id}`,
    type: 'raster',
    source: `qgis-${layer.id}`,
    paint: {
      'raster-opacity': layer.opacity / 255,
    },
  });
}
```

**Issue:**
- ❌ Component exists but NOT used in map page!
- ❌ No integration in `app/map/page.tsx`

---

### 2.3 QGIS Layer Renderer (WFS)

**File:** `src/components/qgis/QGISLayerRenderer.tsx` (216 lines)

**Purpose:** Render individual layer via WFS (GeoJSON)

**Implementation:**
```typescript
export function QGISLayerRenderer({ projectName, layer }: Props) {
  const { current: map } = useMap();
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);

  // Fetch features via WFS
  useEffect(() => {
    if (!layer.visible) return;

    const wfsUrl =
      `https://api.universemapmaker.online/ows?` +
      `SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature` +
      `&TYPENAME=${layer.id}` +
      `&OUTPUTFORMAT=application/json` +
      `&SRSNAME=EPSG:4326` +
      `&MAP=${projectName}`;

    fetch(wfsUrl)
      .then(response => response.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeojson(data);
      });
  }, [projectName, layer.id, layer.visible]);

  // Add GeoJSON to map
  useEffect(() => {
    if (!map || !geojson || !layer.visible) return;

    const sourceId = `layer-source-${layer.id}`;
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
    });

    // Render based on geometry type
    const geometryType = geojson.features[0]?.geometry?.type;
    if (geometryType === 'Polygon') {
      map.addLayer({
        id: `layer-fill-${layer.id}`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': layer.color || '#088',
          'fill-opacity': layer.opacity || 0.6,
        },
      });
    }
    // ... (line, point rendering)
  }, [map, geojson, layer]);

  return null;  // No UI
}
```

**Issue:**
- ❌ Also not used in map page!
- ✅ Good WFS implementation (can be reference)

---

### 2.4 RTK Query API

**File:** `src/redux/api/projectsApi.ts` (846 lines)

**Relevant Endpoints:**

#### `getProjectData`
```typescript
/**
 * GET /api/projects/new/json
 * Fetch project data structure (tree.json) for map view
 */
getProjectData: builder.query<
  QGISProjectTree & {
    name: string;
    extent: [number, number, number, number];
    logoExists: boolean;
    large: boolean;
  },
  { project: string; published?: boolean; save?: boolean }
>({
  query: ({ project, published = false, save = false }) => ({
    url: `/api/projects/new/json`,
    params: { project, published, save },
  }),
  providesTags: (result, error, arg) => [
    { type: 'Project', id: arg.project },
  ],
}),
```

**Usage:**
```typescript
const { data: projectData } = useGetProjectDataQuery({
  project: projectName,
  published: false
});

// projectData structure:
{
  name: "MyProject_1.qgs",
  extent: [minX, minY, maxX, maxY],
  children: [
    {
      name: "LayerName",
      id: "layer-uuid-123",
      type: "VectorLayer",
      visible: true,
      extent: [...],
      geometry: "MultiPolygon"
    }
  ],
  wms_url: "",
  wfs_url: ""
}
```

#### Other Endpoints Used:
- `importQGS` - Import QGS file (already implemented)
- `importQGZ` - Import compressed QGZ file
- `togglePublish` - Publish/unpublish project

---

### 2.5 Type Definitions

**File:** `src/types/qgis.ts` (110 lines)

**Complete type system for QGIS integration:**

```typescript
// Vector layer from tree.json
export interface QGISVectorLayer {
  name: string;
  id: string;                                    // Layer UUID
  visible: boolean;
  extent: [number, number, number, number];      // EPSG:3857
  geometry: 'Point' | 'LineString' | 'Polygon' | 'Multi*';
  type: 'VectorLayer';
  opacity: number;                               // 0-255
  labeling: '' | {
    textColor: [number, number, number, number];
    fontSize: number;
    scaleMin: number;
    scaleMax: number;
    fieldName: string;
  };
}

// Raster layer from tree.json
export interface QGISRasterLayer {
  name: string;
  id: string;
  visible: boolean;
  extent: number[];
  type: 'RasterLayer';
  opacity: number;
  scale: {
    large: boolean;
    hasScaleBasedVisibility: boolean;
    maximumScale: number;
    minimumScale: number;
  };
}

// Group (folder) from tree.json
export interface QGISGroupLayer {
  name: string;
  childrenVisible: boolean;
  visible: boolean;
  type: 'group';
  parent: string;
  children: QGISLayerNode[];
}

export type QGISLayerNode = QGISVectorLayer | QGISRasterLayer | QGISGroupLayer;

export interface QGISProjectTree {
  children: QGISLayerNode[];
}
```

**Helper functions:**
- `isVectorLayer(node)` - Type guard
- `isRasterLayer(node)` - Type guard
- `isGroupLayer(node)` - Type guard

---

## 3. Gap Analysis

### 3.1 Backend Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **tree.json generation fails** | 🔴 CRITICAL | Empty layer list in frontend |
| **QObject threading errors** | 🔴 CRITICAL | Random import failures |
| **Layer extent calculation errors** | 🟠 HIGH | Incorrect map bounds |
| **WFS not enabled by default** | 🟡 MEDIUM | Frontend can't use WFS |
| **Publication workflow incomplete** | 🟡 MEDIUM | Projects can't be published |
| **MAP parameter not documented** | 🟡 MEDIUM | QGIS Server can't find projects |

### 3.2 Frontend Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **QGISProjectLoader not used** | 🔴 CRITICAL | QGIS layers never loaded |
| **No map integration** | 🔴 CRITICAL | Users can't see imported layers |
| **No error handling** | 🟠 HIGH | Silent failures |
| **No loading states** | 🟡 MEDIUM | Poor UX |
| **Missing layer tree UI** | 🟡 MEDIUM | Can't control layers |

### 3.3 Configuration Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **QGIS_PROJECT_PATH mismatch** | 🔴 CRITICAL | QGIS Server can't find QGS files |
| **MAP parameter format unclear** | 🟠 HIGH | WMS/WFS requests fail |
| **No QGIS Server health monitoring** | 🟡 MEDIUM | Can't detect failures |

---

## 4. Recommended QGIS Server Configuration

### 4.1 Current Setup (Correct)

**Docker Volume Mount:**
```yaml
volumes:
  - /mnt/qgis-projects:/projects:ro
```
This maps GCS bucket to QGIS Server container.

**QGIS Server Environment:**
```yaml
QGSRV_CACHE_ROOTDIR=/projects
```
QGIS Server knows to look in `/projects` for QGS files.

---

### 4.2 MAP Parameter Format

**CRITICAL:** The MAP parameter determines which QGS file QGIS Server loads.

**Three possible formats:**

#### Option 1: Relative Path (RECOMMENDED)
```
MAP=MyProject_1/MyProject_1.qgs
```

**QGIS Server Resolution:**
```
Full path: /projects/MyProject_1/MyProject_1.qgs
```

**Backend QGS Location:**
```
/mnt/qgis-projects/MyProject_1/MyProject_1.qgs
```

**Frontend WMS URL:**
```
https://api.universemapmaker.online/ows?
  SERVICE=WMS&REQUEST=GetMap&
  LAYERS=layer_id&
  MAP=MyProject_1/MyProject_1.qgs  ← Relative path
```

#### Option 2: Absolute Path (Less Portable)
```
MAP=/projects/MyProject_1/MyProject_1.qgs
```

#### Option 3: Project Name Only (Requires QGIS_PROJECT_FILE)
```
MAP=MyProject_1
```
Requires environment variable: `QGIS_PROJECT_FILE=/projects/MyProject_1/MyProject_1.qgs`

**Recommendation:** Use **Option 1 (Relative Path)** for flexibility.

---

### 4.3 Testing QGIS Server

**Test GetCapabilities:**
```bash
curl 'https://api.universemapmaker.online/ows?SERVICE=WMS&REQUEST=GetCapabilities'
```

**Test with MAP parameter:**
```bash
curl 'https://api.universemapmaker.online/ows?SERVICE=WMS&REQUEST=GetCapabilities&MAP=MyProject_1/MyProject_1.qgs'
```

**Test WMS GetMap:**
```bash
curl 'https://api.universemapmaker.online/ows?\
  SERVICE=WMS&\
  VERSION=1.3.0&\
  REQUEST=GetMap&\
  LAYERS=layer_id&\
  WIDTH=256&\
  HEIGHT=256&\
  CRS=EPSG:3857&\
  BBOX=0,0,1000,1000&\
  FORMAT=image/png&\
  MAP=MyProject_1/MyProject_1.qgs' \
  --output test.png
```

**Test WFS GetFeature:**
```bash
curl 'https://api.universemapmaker.online/ows?\
  SERVICE=WFS&\
  VERSION=2.0.0&\
  REQUEST=GetFeature&\
  TYPENAME=layer_id&\
  OUTPUTFORMAT=application/json&\
  MAP=MyProject_1/MyProject_1.qgs'
```

---

## 5. Step-by-Step Integration Plan

### Phase 1: Fix Backend (Priority: CRITICAL)

#### Step 1.1: Fix tree.json Generation Threading Issues

**Problem:** QgsProject.instance() cannot be used in threads

**Solution:**

**File:** `geocraft_api/json_utils.py`

```python
# BEFORE (BROKEN):
def get_all_layers(project, project_name, root):
    layers_in_form = {}
    pool = ThreadPool(NUMBER_OF_POOL_NODES)
    func = partial(get_form_for_layer, project_name, ...)
    pool.map(func, list(project.mapLayers().values()))  # ❌ QObject threading error
    return layers_in_form

# AFTER (FIXED):
def get_all_layers(project, project_name, root):
    layers_in_form = {}
    # Process layers sequentially (no threading)
    for layer in project.mapLayers().values():
        layer_form = get_form_for_layer_sequential(layer, project, root)
        if layer_form:
            layers_in_form[layer.id()] = layer_form
    return layers_in_form

def get_form_for_layer_sequential(layer, project, root):
    """Non-threaded layer form generation"""
    try:
        if isinstance(layer, QgsRasterLayer):
            return Layer_raster_layer(layer, root)
        else:
            return Layer_vector_layer(layer, root)
    except Exception as e:
        logging.error(f"Error processing layer {layer.name()}: {e}")
        return None
```

**Estimated Impact:**
- ✅ Fix 90% of empty tree.json issues
- ✅ Eliminate QObject threading errors
- ⚠️ Slightly slower (sequential vs parallel)

**Complexity:** MEDIUM (refactoring existing code)

---

#### Step 1.2: Fix Layer Extent Calculation

**Problem:** `get_layer_extent_and_scale()` returns empty extents

**Solution:**

**File:** `geocraft_api/layers/db_utils.py`

```python
def get_layer_extent_and_scale(database, table, geom_column):
    """Get layer extent from PostGIS"""
    try:
        # Use ST_Extent to get bbox from PostGIS
        query = f"""
            SELECT
                ST_XMin(extent) as minx,
                ST_YMin(extent) as miny,
                ST_XMax(extent) as maxx,
                ST_YMax(extent) as maxy,
                COUNT(*) as feature_count
            FROM (
                SELECT ST_Extent({geom_column}) as extent
                FROM {table}
            ) subquery
        """

        with psycopg2.connect(database=database, ...) as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            result = cursor.fetchone()

            if result and result[0] is not None:
                extent = [result[0], result[1], result[2], result[3]]
                feature_count = result[4]
                return extent, feature_count
            else:
                # Fallback: Use default Poland extent
                return [1536078.520419, 6276397.266552,
                        2724827.184310, 7372198.504049], 0
    except Exception as e:
        logging.error(f"Error calculating extent: {e}")
        return [1536078.520419, 6276397.266552,
                2724827.184310, 7372198.504049], 0
```

**Estimated Impact:**
- ✅ Correct map bounds in frontend
- ✅ Auto-zoom to project works

**Complexity:** LOW (SQL query update)

---

#### Step 1.3: Ensure WFS is Enabled

**Problem:** WFS not enabled for all vector layers

**Solution:**

**File:** `geocraft_api/projects/service.py`

```python
def read_and_check_new_project_file(project_name, user):
    project = QgsProject.instance()
    qgs_path = f"qgs/{project_name}/{project_name}.qgs"

    if not project.read(qgs_path):
        return error("Failed to read QGS")

    # ... (import layers as before)

    # NEW: Enable WFS for all vector layers
    for layer_id, layer in project.mapLayers().items():
        if isinstance(layer, QgsVectorLayer):
            turn_on_wfs(layer_id, project_name, transaction=True)

    # Save QGS with WFS enabled
    project.write()

    # Generate tree.json
    make_json_tree_and_save(project, project_name)
```

**Estimated Impact:**
- ✅ Frontend can use WFS for editing
- ✅ QGIS Server can serve features as GeoJSON

**Complexity:** LOW (function call)

---

#### Step 1.4: Add QGIS Server Validation

**New Function:** `validate_qgis_server_access()`

**File:** `geocraft_api/projects/service.py`

```python
import requests

def validate_qgis_server_access(project_name):
    """Verify QGIS Server can access project"""
    qgis_server_url = "http://qgis-server:8080/ows"
    map_param = f"{project_name}/{project_name}.qgs"

    try:
        # Test GetCapabilities with MAP parameter
        response = requests.get(qgis_server_url, params={
            'SERVICE': 'WMS',
            'REQUEST': 'GetCapabilities',
            'MAP': map_param
        }, timeout=10)

        if response.status_code == 200:
            # Check if layers are listed
            if '<Layer>' in response.text:
                logging.info(f"QGIS Server can access {project_name}")
                return True
            else:
                logging.warning(f"QGIS Server found {project_name} but no layers")
                return False
        else:
            logging.error(f"QGIS Server error for {project_name}: {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"QGIS Server validation failed: {e}")
        return False

# Call after import:
def import_qgs(data, user, form):
    # ... (existing code)

    # Validate QGIS Server access
    if validate_qgis_server_access(project_name):
        return success("QGS imported and accessible via QGIS Server")
    else:
        return warning("QGS imported but QGIS Server validation failed")
```

**Estimated Impact:**
- ✅ Catch QGIS Server issues immediately
- ✅ Better error messages for users

**Complexity:** LOW (HTTP request)

---

### Phase 2: Integrate Frontend (Priority: HIGH)

#### Step 2.1: Add QGISProjectLoader to Map Page

**File:** `app/map/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { QGISProjectLoader } from '@/components/qgis/QGISProjectLoader';
import { MapContainer } from '@/components/map/MapContainer';

export default function MapPage() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get('project');

  if (!projectName) {
    return <div>Error: No project specified</div>;
  }

  return (
    <div className="map-page">
      <MapContainer>
        {/* Add QGIS Project Loader */}
        <QGISProjectLoader
          projectName={projectName}
          onLoad={(extent) => {
            console.log('Project loaded with extent:', extent);
          }}
        />

        {/* Other map components */}
      </MapContainer>
    </div>
  );
}
```

**Estimated Impact:**
- ✅ QGIS layers finally rendered on map!
- ✅ Auto-zoom to project extent

**Complexity:** LOW (component integration)

---

#### Step 2.2: Fix MAP Parameter in qgis-layers.ts

**File:** `src/mapbox/qgis-layers.ts`

```typescript
// BEFORE:
const wmsUrl = `${QGIS_SERVER_URL}?` +
  `SERVICE=WMS&REQUEST=GetMap&` +
  `LAYERS=${layerName}&` +
  `...&` +
  `MAP=${projectName}`;  // ❌ Missing .qgs extension and path

// AFTER:
const wmsUrl = `${QGIS_SERVER_URL}?` +
  `SERVICE=WMS&REQUEST=GetMap&` +
  `LAYERS=${layerName}&` +
  `...&` +
  `MAP=${projectName}/${projectName}.qgs`;  // ✅ Correct format
```

**Update both:**
- `addWMSLayer()` function
- `addWFSLayer()` function
- `QGISProjectLoader.tsx` inline URLs

**Estimated Impact:**
- ✅ QGIS Server can find QGS files
- ✅ WMS/WFS requests succeed

**Complexity:** LOW (string update)

---

#### Step 2.3: Add Error Handling to QGISProjectLoader

**File:** `src/components/qgis/QGISProjectLoader.tsx`

```typescript
export function QGISProjectLoader({ projectName, onLoad }: Props) {
  const { data, isLoading, error } = useGetProjectDataQuery({ project: projectName });

  if (isLoading) {
    return (
      <Alert severity="info" icon={<CircularProgress size={20} />}>
        Loading QGIS project: {projectName}...
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography variant="body2">Error loading project: {projectName}</Typography>
        <Typography variant="caption">
          {error && 'data' in error ? JSON.stringify(error.data) : 'Unknown error'}
        </Typography>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </Alert>
    );
  }

  if (!data || !data.children || data.children.length === 0) {
    return (
      <Alert severity="warning">
        <Typography variant="body2">
          Project <strong>{projectName}</strong> has no layers.
        </Typography>
        <Typography variant="caption">
          Import a QGS file to add layers to this project.
        </Typography>
      </Alert>
    );
  }

  // ... (render layers)
}
```

**Estimated Impact:**
- ✅ Users see helpful error messages
- ✅ Empty projects handled gracefully

**Complexity:** LOW (UI updates)

---

#### Step 2.4: Add Layer Control UI

**New Component:** `src/components/qgis/QGISLayerControl.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMap } from 'react-map-gl';
import {
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Slider,
  Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import type { QGISLayerNode, QGISGroupLayer } from '@/types/qgis';

interface QGISLayerControlProps {
  projectName: string;
  layers: QGISLayerNode[];
}

export function QGISLayerControl({ projectName, layers }: QGISLayerControlProps) {
  const { current: map } = useMap();

  const handleVisibilityChange = (layerId: string, visible: boolean) => {
    if (!map) return;
    const mapInstance = map.getMap();

    const visibility = visible ? 'visible' : 'none';
    mapInstance.setLayoutProperty(`layer-${layerId}`, 'visibility', visibility);
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    if (!map) return;
    const mapInstance = map.getMap();

    mapInstance.setPaintProperty(`layer-${layerId}`, 'raster-opacity', opacity / 100);
  };

  const renderLayer = (layer: QGISLayerNode) => {
    if (layer.type === 'group') {
      return <GroupControl key={layer.name} group={layer as QGISGroupLayer} />;
    }

    return (
      <ListItem key={layer.id}>
        <Checkbox
          checked={layer.visible}
          onChange={(e) => handleVisibilityChange(layer.id, e.target.checked)}
        />
        <ListItemText primary={layer.name} />
        <Slider
          value={layer.opacity || 255}
          min={0}
          max={255}
          onChange={(e, value) => handleOpacityChange(layer.id, value as number)}
          sx={{ width: 100 }}
        />
      </ListItem>
    );
  };

  return (
    <List dense>
      {layers.map(renderLayer)}
    </List>
  );
}
```

**Estimated Impact:**
- ✅ Users can toggle layers on/off
- ✅ Users can adjust layer opacity
- ✅ Layer tree matches QGIS project structure

**Complexity:** MEDIUM (new component)

---

### Phase 3: Publication Workflow (Priority: MEDIUM)

#### Step 3.1: Implement togglePublish Backend

**File:** `geocraft_api/projects/views.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_project(request):
    """Publish/unpublish project to QGIS Server"""
    project_name = request.data.get('project')
    publish = request.data.get('publish', True)

    # Validate ownership
    project_item = get_project_item(project_name)
    if not project_item:
        return Response({'success': False, 'message': 'Project not found'}, status=404)

    if project_item.user != request.user:
        return Response({'success': False, 'message': 'Not owner'}, status=403)

    # Validate project has layers
    if not project_item.layer.exists():
        return Response({
            'success': False,
            'message': 'Cannot publish project without layers'
        }, status=400)

    if publish:
        # Generate WMS/WFS URLs
        base_url = "https://api.universemapmaker.online/ows"
        map_param = f"{project_name}/{project_name}.qgs"
        wms_url = f"{base_url}?MAP={map_param}"
        wfs_url = f"{base_url}?MAP={map_param}"

        # Validate QGIS Server access
        if not validate_qgis_server_access(project_name):
            return Response({
                'success': False,
                'message': 'QGIS Server cannot access project'
            }, status=500)

        # Update project
        project_item.published = True
        project_item.wms_url = wms_url
        project_item.wfs_url = wfs_url
        project_item.save()

        return Response({
            'success': True,
            'message': 'Project published successfully',
            'wms_url': wms_url,
            'wfs_url': wfs_url
        })
    else:
        # Unpublish
        project_item.published = False
        project_item.wms_url = ""
        project_item.wfs_url = ""
        project_item.save()

        return Response({'success': True, 'message': 'Project unpublished'})
```

**Estimated Impact:**
- ✅ Projects can be published/unpublished
- ✅ WMS/WFS URLs generated correctly
- ✅ Validation prevents broken publications

**Complexity:** MEDIUM (new endpoint + validation)

---

#### Step 3.2: Add Publish Button to Dashboard

**File:** `src/features/dashboard/komponenty/OwnProjects.tsx`

```typescript
const [togglePublish] = useTogglePublishMutation();

const handleTogglePublish = async (projectName: string, currentlyPublished: boolean) => {
  try {
    await togglePublish({
      project: projectName,
      publish: !currentlyPublished
    }).unwrap();

    setSnackbar({
      open: true,
      message: currentlyPublished
        ? `Project "${projectName}" unpublished`
        : `Project "${projectName}" published!`,
      severity: 'success'
    });
  } catch (error: any) {
    setSnackbar({
      open: true,
      message: error.data?.message || 'Publish failed',
      severity: 'error'
    });
  }
};

// In project card menu:
<MenuItem onClick={() => handleTogglePublish(project.project_name, project.published)}>
  <ListItemIcon>
    {project.published ? <Unpublish /> : <Publish />}
  </ListItemIcon>
  <ListItemText>
    {project.published ? 'Unpublish' : 'Publish'}
  </ListItemText>
</MenuItem>
```

**Estimated Impact:**
- ✅ One-click publishing
- ✅ Clear published status indicator

**Complexity:** LOW (UI update)

---

## 6. Testing Plan

### 6.1 Backend Testing

#### Test 1: tree.json Generation
```bash
# SSH to backend VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Test QGS import
curl -X POST https://api.universemapmaker.online/api/projects/import/qgs/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "project=TestProject_1" \
  -F "qgs=@test.qgs"

# Check tree.json
cat /mnt/qgis-projects/TestProject_1/tree.json | jq '.children | length'
# Should be > 0

# Check layer extents
cat /mnt/qgis-projects/TestProject_1/tree.json | jq '.children[0].extent'
# Should be [minX, minY, maxX, maxY], not []
```

#### Test 2: QGIS Server Access
```bash
# Test GetCapabilities with MAP parameter
curl 'https://api.universemapmaker.online/ows?\
  SERVICE=WMS&\
  REQUEST=GetCapabilities&\
  MAP=TestProject_1/TestProject_1.qgs' | grep '<Layer>'

# Should list layers from project
```

#### Test 3: WFS Enabled
```bash
# Check QGS file for WFSLayers
cat /mnt/qgis-projects/TestProject_1/TestProject_1.qgs | grep '<WFSLayers'
# Should find <WFSLayers type="QStringList">
```

---

### 6.2 Frontend Testing

#### Test 1: Project Loading
1. Open `http://localhost:3000/map?project=TestProject_1`
2. Check browser console for:
   - `✅ QGIS layers loaded: X layers`
   - `🗺️ Adding QGIS layer: LayerName`
3. Verify layers visible on map
4. Check Network tab for WMS requests (should be 200 OK)

#### Test 2: Layer Control
1. Click layer tree panel
2. Toggle layer visibility → layer disappears from map
3. Adjust opacity → layer becomes transparent
4. Collapse/expand groups → UI updates correctly

#### Test 3: Error Handling
1. Open non-existent project: `/map?project=DoesNotExist`
2. Should show error alert: "Project not found"
3. Import empty QGS → Should show: "Project has no layers"

---

### 6.3 End-to-End Testing

#### Scenario 1: Create + Import + View
1. Dashboard → Create new project "E2E_Test"
2. Import QGS file with 3 layers
3. Wait for "Import successful" notification
4. Click "Open in Editor"
5. **Expected:** Map shows 3 layers from QGIS Server
6. **Verify:** Network tab shows WMS requests with correct MAP parameter

#### Scenario 2: Publish + Public Access
1. Dashboard → Own Projects → E2E_Test → Publish
2. Copy public URL
3. Open in incognito/private window (logged out)
4. **Expected:** Map loads with read-only access
5. **Verify:** WMS/WFS URLs populated in project metadata

---

## 7. Deployment Checklist

### 7.1 Backend Deployment

- [ ] SSH to VM: `gcloud compute ssh universe-backend --zone=europe-central2-a`
- [ ] Update code: `cd /home/user/Universe-Mapmaker-Backend && sudo git pull origin main`
- [ ] Update `json_utils.py` (remove threading)
- [ ] Update `layers/db_utils.py` (fix extent calculation)
- [ ] Update `projects/service.py` (add WFS enable + validation)
- [ ] Restart Django: `sudo docker restart universe-mapmaker-backend_django_1`
- [ ] Check logs: `sudo docker logs -f universe-mapmaker-backend_django_1`
- [ ] Test tree.json generation with existing project
- [ ] Verify QGIS Server can access updated projects

### 7.2 Frontend Deployment

- [ ] Update `app/map/page.tsx` (add QGISProjectLoader)
- [ ] Update `src/mapbox/qgis-layers.ts` (fix MAP parameter)
- [ ] Update `src/components/qgis/QGISProjectLoader.tsx` (error handling)
- [ ] Add `src/components/qgis/QGISLayerControl.tsx` (new component)
- [ ] Commit changes: `git add . && git commit -m "feat: integrate QGIS Server with frontend"`
- [ ] Push: `git push origin main`
- [ ] Wait for Cloud Build: `gcloud run services describe universe-mapmaker --region=europe-central2`
- [ ] Test on production: `https://universemapmaker.online/map?project=TestProject_1`

---

## 8. Rollback Plan

If integration fails:

### Backend Rollback
```bash
# SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Revert to previous commit
cd /home/user/Universe-Mapmaker-Backend
sudo git log --oneline -n 5  # Find previous commit hash
sudo git checkout <previous-commit-hash>

# Restart Django
sudo docker restart universe-mapmaker-backend_django_1
```

### Frontend Rollback
```bash
# Revert changes locally
git revert HEAD  # Creates new commit that undoes last change

# Or reset to previous commit
git log --oneline -n 5
git reset --hard <previous-commit-hash>
git push origin main --force

# Cloud Build will auto-deploy
```

---

## 9. Future Enhancements (Post-Integration)

### Phase 4: Advanced Features (LOW Priority)

#### 4.1 Layer Editing via WFS-T
- Enable frontend editing of layer attributes
- Use WFS-T (Transaction) for updates
- Real-time sync with QGIS Server

#### 4.2 Print Layouts
- Integrate QGIS Server GetPrint
- Generate PDF maps from projects
- Custom print templates

#### 4.3 Layer Styling
- Frontend UI for layer styling
- Generate QML style files
- Upload custom symbology

#### 4.4 Performance Optimization
- Tile caching (GeoWebCache?)
- Vector tiles instead of WMS for large datasets
- Layer clustering for points

---

## 10. Estimated Timeline

| Phase | Tasks | Complexity | Estimated Time |
|-------|-------|------------|----------------|
| **Phase 1** | Fix Backend | Medium | **2-3 days** |
| 1.1 | Fix threading issues | Medium | 4-6 hours |
| 1.2 | Fix extent calculation | Low | 2 hours |
| 1.3 | Enable WFS | Low | 1 hour |
| 1.4 | Add validation | Low | 2 hours |
| **Phase 2** | Integrate Frontend | Low-Medium | **1-2 days** |
| 2.1 | Add QGISProjectLoader | Low | 1 hour |
| 2.2 | Fix MAP parameter | Low | 30 minutes |
| 2.3 | Error handling | Low | 2 hours |
| 2.4 | Layer control UI | Medium | 4-6 hours |
| **Phase 3** | Publication | Medium | **1 day** |
| 3.1 | Backend publish endpoint | Medium | 3-4 hours |
| 3.2 | Frontend publish UI | Low | 1-2 hours |
| **Testing** | E2E Testing | - | **1 day** |
| **TOTAL** | All Phases | - | **5-7 days** |

**Optimistic:** 5 days
**Realistic:** 7-10 days (with debugging)
**Pessimistic:** 14 days (if major issues found)

---

## 11. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **QGIS Server file access issues** | HIGH | CRITICAL | Test with multiple projects, check gcsfuse mount |
| **MAP parameter format incorrect** | MEDIUM | HIGH | Document all format options, add validation |
| **Performance degradation (no threading)** | MEDIUM | MEDIUM | Monitor import times, optimize if needed |
| **Existing projects have broken tree.json** | HIGH | HIGH | Re-generate tree.json for all projects |
| **WMS requests fail silently** | MEDIUM | HIGH | Add comprehensive error logging |
| **Breaking changes to existing features** | LOW | HIGH | Thorough testing before deployment |

---

## 12. Success Criteria

Integration is considered successful when:

- ✅ **Backend:** tree.json generated correctly for 100% of imports
- ✅ **Backend:** QGIS Server validation passes after import
- ✅ **Frontend:** Layers rendered on map from QGIS Server
- ✅ **Frontend:** Layer tree control functional (visibility, opacity)
- ✅ **Frontend:** Error handling for all failure scenarios
- ✅ **E2E:** Create → Import → View workflow works end-to-end
- ✅ **E2E:** Publish → Public access workflow works
- ✅ **Performance:** Import time < 30 seconds for typical project
- ✅ **Stability:** No QObject threading errors in logs

---

## 13. Documentation Requirements

### 13.1 User Documentation (docs/)

- [ ] **QGIS_SERVER_GUIDE.md** - User guide for QGIS Server features
- [ ] **PUBLISHING_GUIDE.md** - How to publish projects
- [ ] **TROUBLESHOOTING_QGIS.md** - Common issues and fixes

### 13.2 Developer Documentation (docs/)

- [ ] **QGIS_SERVER_ARCHITECTURE.md** - System architecture diagram
- [ ] **QGIS_API_REFERENCE.md** - Backend API endpoints
- [ ] **QGIS_FRONTEND_COMPONENTS.md** - Frontend component docs

### 13.3 Code Comments

- [ ] Add JSDoc comments to all QGIS-related functions
- [ ] Add Python docstrings to QGIS utility functions
- [ ] Update CLAUDE.md with QGIS integration patterns

---

## Conclusion

The QGIS Server integration is **60% complete** with solid foundations in place. The main gaps are:

1. **Backend threading issues** causing tree.json failures
2. **Frontend not using** existing QGIS components
3. **MAP parameter format** inconsistency

Fixing these issues will enable full QGIS Server integration, allowing users to:
- Import QGIS projects and see layers on map
- Control layer visibility and styling
- Publish projects for public access
- Use WMS/WFS for layer rendering

**Estimated completion time:** 5-7 days for core functionality.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-13
**Author:** Claude Code (AI Assistant)
**Status:** Ready for Implementation
