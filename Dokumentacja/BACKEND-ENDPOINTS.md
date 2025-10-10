# Backend API Endpoints - Status Integracji

**Dokument śledzi status integracji 243+ endpointów Django REST API z frontendem Universe-MapMaker.**

**Base URL:** `https://api.universemapmaker.online`

**Postęp ogólny:** 28.8% (70/243 endpointów zintegrowanych)

## 📚 Backend Documentation Reference

**IMPORTANT:** Complete backend documentation available at:
- **`Universe-Mapmaker-Backend/README.md`** - Full system architecture, deployment, modules
- `geocraft_api/*/service.py` - Business logic for each module (projects, layers, groups)
- `geocraft_api/*/serializers.py` - Request/response formats for all endpoints
- `geocraft_api/models/` - Database schema (ProjectItem, Layer, CustomUser, etc.)

**Production Infrastructure (from README.md):**
- **VM**: universe-backend (34.0.251.33, europe-central2-a)
- **Database**: Railway PostgreSQL (centerbeam.proxy.rlwy.net:38178) with PostGIS
- **Storage FASE**: Cloud Storage `gs://universe-qgis-projects` mounted at `/mnt/qgis-projects`
- **Django API**: Port 8000 → `https://api.universemapmaker.online/api/*`
- **QGIS Server**: Port 8080 → `https://api.universemapmaker.online/ows`
- **Frontend**: Cloud Run → `https://universemapmaker.online`

**Key Backend Modules:**
| Module | File | Size | Description |
|--------|------|------|-------------|
| Projects | `geocraft_api/projects/service.py` | 195KB | Project CRUD, QGS generation, import/export |
| Layers | `geocraft_api/layers/service.py` | 183KB | Layer import, styling, PostGIS operations |
| Groups | `geocraft_api/groups/service.py` | 144KB | Group management, INSPIRE groups |
| Layer DB | `geocraft_api/layers/db_utils.py` | 80KB | PostGIS operations, spatial queries |
| Serializers | `geocraft_api/serializers.py` | 77KB | Main API serializers |
| DAO | `geocraft_api/dao.py` | 41KB | Database access layer |

## 📊 Statystyki Integracji

| Kategoria | Zintegrowane | Planowane | Razem | Postęp |
|-----------|--------------|-----------|-------|--------|
| **Authentication** | 5/5 | 0 | 5 | 100% ✅ |
| **Projects Core** | 6/10 | 4 | 10 | 60% |
| **Projects Advanced** | 22/50+ | 28+ | 50+ | 44% |
| **Layers Core** | 7/15 | 8 | 15 | 47% |
| **Layers Advanced** | 23/30+ | 7+ | 30+ | 77% |
| **User Profile** | 4/10 | 6 | 10 | 40% |
| **Dashboard** | 3/5 | 2 | 5 | 60% |
| **Groups** | 0/9 | 9 | 9 | 0% |
| **Documents** | 0/15 | 15 | 15 | 0% |
| **Wypis** | 0/20 | 20 | 20 | 0% |
| **Admin** | 0/50+ | 50+ | 50+ | 0% |
| **RAZEM** | **70/243+** | **173+** | **243+** | **28.8%** |

## Legend

- ✅ **Zintegrowane** - Endpoint zaimplementowany w `src/api/endpointy/`
- 🔨 **W trakcie** - Obecnie testowane
- ⏳ **Planowane** - Czeka na implementację
- ❌ **Nie działa** - Backend endpoint ma problemy
- 📝 **Wymaga wyjaśnienia** - Niejasne zachowanie

---

## 1. 🔐 Authentication (`src/api/endpointy/auth.ts`)

**Status:** ✅ **100% Zintegrowane (5/5)**

| Endpoint | Metoda | Status | Funkcja | Komponenty |
|----------|--------|--------|---------|------------|
| `/auth/register` | POST | ✅ | `authService.register()` | RegisterPage.tsx |
| `/auth/login` | POST | ✅ | `authService.login()` | LoginPage.tsx |
| `/auth/logout` | POST | ✅ | `authService.logout()` | DashboardLayout.tsx |
| `/auth/profile` | GET | ✅ | `authService.getProfile()` | UserSettings.tsx |
| Token management | - | ✅ | `isAuthenticated()`, `setToken()`, `removeToken()` | localStorage |

**Wykorzystanie:**
- `src/features/autoryzacja/` - Login/Register komponenty
- Token przechowywany w `localStorage` jako `authToken`
- Automatyczna autoryzacja wszystkich requestów przez `apiClient`

**Source:** `geocraft_api/auth/urls.py`

---

## 2. Dashboard (`/dashboard/*`)

Base: `/dashboard/`

| Endpoint | Method | Status | RTK Slice | Description | Notes |
|----------|--------|--------|-----------|-------------|-------|
| `projects/` | GET | ✅ | `projectsApi` | Get user's projects | RTK Query implemented |
| `projects/create/` | POST | ✅ | `projectsApi` | Create new project | RTK Query implemented |
| `projects/update/` | PUT | ⏳ | - | Update project | Need to implement |
| `projects/delete/` | DELETE | ✅ | `projectsApi` | Delete project | RTK Query implemented |
| `projects/public/` | GET | ✅ | `projectsApi` | Get public projects | RTK Query implemented |
| `projects/<project_name>/` | GET | ⏳ | - | Get project details | Need to implement |
| `profile/` | GET | ⏳ | - | Get user profile | Duplicate of /auth/profile? |
| `settings/profile/` | PUT | ⏳ | - | Update profile | Need to implement |
| `settings/password/` | POST | ⏳ | - | Change password | Need to implement |
| `contact/` | POST | ⏳ | - | Contact form | Need to implement |

**Source:** `geocraft_api/dashboard/urls.py`

---

## 3. 📁 Projects API (`src/api/endpointy/unified-projects.ts`)

**Status:** ✅ **47% Zintegrowane (28/60+)**

### 📌 Core Operations (✅ 6/10)

| Endpoint | Metoda | Status | Funkcja | Komponenty |
|----------|--------|--------|---------|------------|
| `/dashboard/projects/` | GET | ✅ | `getProjects()` | OwnProjects.tsx |
| `/dashboard/projects/public/` | GET | ✅ | `getPublicProjects()` | PublicProjects.tsx |
| `/dashboard/projects/{name}/` | GET | ✅ | `getProjectData()` | MapContainer.tsx |
| `/dashboard/projects/create/` | POST | ✅ | `createProject()` | CreateProjectModal.tsx |
| `/dashboard/projects/update/` | PUT | ✅ | `updateProject()` | EditProjectModal.tsx |
| `/dashboard/projects/delete/` | DELETE | ✅ | `deleteProject()` | OwnProjects.tsx |
| `/api/projects/duplicate` | POST | ⏳ | - | Clone project |
| `/api/projects/archive` | POST | ⏳ | - | Archive project |
| `/api/projects/recent` | GET | ⏳ | - | Recently viewed |
| `/api/projects/favorites` | POST | ⏳ | - | Toggle favorite |

### 📤 Import & Export (✅ 3/5)

| Endpoint | Metoda | Status | Funkcja | Notatki |
|----------|--------|--------|---------|---------|
| `/api/projects/export` | POST | ✅ | `exportProject()` | QGS/QGZ export |
| `/api/projects/import/qgs/` | POST | ✅ | `importQGS()` | **Fully integrated!** |
| `/api/projects/import/qgz/` | POST | ✅ | `importQGZ()` | **Fully integrated!** |
| `missing-layer/add/` | POST | ⏳ | - | Add missing layer | Need clarification |
| `remove/` | POST | ⏳ | - | Remove project | Different from dashboard delete? |
| `export` | GET | ⏳ | - | Export project | Format? QGS/QGZ? |
| `order` | GET/POST | ⏳ | - | Get/set layer order | Need clarification |
| `publish` | POST | ⏳ | - | Publish project | Set published=True? |
| `document/import` | POST | ⏳ | - | Upload document | File upload |
| `document` | GET/DELETE | ⏳ | - | Get/delete document | Need clarification |
| `documentsAll` | GET | ⏳ | - | Get all documents | For project? |
| `remove/database` | DELETE | ⏳ | - | Remove from database | Hard delete? |
| `subdomainAvailability` | POST | ⏳ | - | Check subdomain available | Validation |
| `domain/change` | POST | ⏳ | - | Change project domain | Update subdomain |
| `wypis/add/documents` | POST | ⏳ | - | Add wypis documents | Polish land registry feature |
| `wypis/add/configuration` | POST | ⏳ | - | Add wypis config | Polish land registry feature |
| `wypis/get/configuration` | GET | ⏳ | - | Get wypis config | Polish land registry feature |
| `wypis/precinct_and_number` | GET | ⏳ | - | Get precinct and number | Polish land registry feature |
| `wypis/plotspatialdevelopment` | GET | ⏳ | - | Get plot spatial dev | Polish land registry feature |
| `wypis/create` | POST | ⏳ | - | Create wypis | Polish land registry feature |
| `wypis/remove` | DELETE | ⏳ | - | Remove wypis | Polish land registry feature |
| `new/json` | POST | ⏳ | - | Create new JSON | Need clarification |
| `tree/order` | POST | ⏳ | - | Change tree order | Layer tree reordering |
| `space/get` | GET | ⏳ | - | Get project space | Disk usage? |
| `print` | POST | ⏳ | - | Prepare image | Map screenshot/export |
| `thumbnail/<project_name>/` | GET | ⏳ | - | Get project thumbnail | Image preview |
| `logo/update/` | POST | ⏳ | - | Update project logo | File upload |
| `app/set` | POST | ⏳ | - | Set app config | Need clarification |
| `metadata` | POST | ⏳ | - | Set project metadata | INSPIRE metadata |
| `restore` | POST | ⏳ | - | Restore project | From backup? |
| `plot` | POST | ⏳ | - | Add plots config | Cadastral plots |
| `plot/reset` | POST | ⏳ | - | Reset plots config | Cadastral plots |
| `search` | GET | ⏳ | - | Search projects | Full-text search |
| `sort/app` | POST | ⏳ | - | Sort app | Need clarification |
| `app/publish` | POST | ⏳ | - | Publish app | Need clarification |
| `app/unpublish` | POST | ⏳ | - | Unpublish app | Need clarification |
| `services/publish` | POST | ⏳ | - | Publish services | WMS/WFS publishing |
| `logs/error/send` | POST | ⏳ | - | Send error log | Error reporting |
| `basemap/set` | POST | ⏳ | - | Set project basemap | Default basemap |
| `repair` | POST | ⏳ | - | Repair project | Fix corrupted data? |
| `reload` | POST | ⏳ | - | Reload project | Refresh QGIS cache? |
| `distinct` | GET | ⏳ | - | Filter distinct values | For columns |
| `filter/min-max` | GET | ⏳ | - | Filter min-max | For numeric columns |
| `filter/numeric-columns` | GET | ⏳ | - | Get numeric columns | For filtering |
| `global-search` | GET | ⏳ | - | Global search | Cross-project search |

**Source:** `geocraft_api/projects/urls.py`

**Questions for User:**
1. What's the difference between `/api/projects/create/` and `/dashboard/projects/create/`?
2. What's the difference between `/api/projects/remove/` and `/dashboard/projects/delete/`?
3. What format does `/api/projects/export` return? QGS/QGZ/ZIP?
4. Are "wypis" endpoints only for Polish land registry features?

---

## 4. Layers (`/api/layer/*`)

Base: `/api/layer/`

| Endpoint | Method | Status | RTK Slice | Description | Notes |
|----------|--------|--------|-----------|-------------|-------|
| `add` | POST | ⏳ | - | Add map layer | From what source? |
| `add/existing` | POST | ⏳ | - | Add existing layer | From another project? |
| `style` | POST | ⏳ | - | Set layer style | SLD/QML format? |
| `style/reset` | POST | ⏳ | - | Reset style to default | |
| `remove/database` | DELETE | ⏳ | - | Remove layer from DB | Hard delete? |
| `add/shp/` | POST | ⏳ | - | Add Shapefile layer | File upload |
| `add/gml/` | POST | ⏳ | - | Add GML layer | File upload |
| `add/app` | POST | ⏳ | - | Add app layer | Need clarification |
| `add/geojson/` | POST | ⏳ | - | Add GeoJSON layer | File upload |
| `column/add` | POST | ⏳ | - | Add column to layer | |
| `column/rename` | POST | ⏳ | - | Rename column | |
| `column/remove` | POST | ⏳ | - | Remove column | |
| `columns/remove` | POST | ⏳ | - | Remove multiple columns | |
| `column/exclude` | POST | ⏳ | - | Exclude columns | Hide from view? |
| `column/merge` | POST | ⏳ | - | Merge columns | Concatenate values? |
| `sql/method/apply` | POST | ⏳ | - | Apply SQL method | Custom SQL query? |
| `create/intersections` | POST | ⏳ | - | Create layer from intersections | PostGIS overlay |
| `get/intersections` | GET | ⏳ | - | Get intersection geometries | |
| `postgis/rpoints/remove` | POST | ⏳ | - | Remove repeated points | Geometry cleaning |
| `postgis/offsetcurve` | POST | ⏳ | - | Offset curve | Buffer operation? |
| `create/postgis/method` | POST | ⏳ | - | Create layer from PostGIS method | |
| `get/postgis/method` | GET | ⏳ | - | Get geoms as GeoJSON | |
| `get/postgis/method/geojson` | GET | ⏳ | - | Get geoms from GeoJSON input | |
| `validation/details` | GET | ⏳ | - | Get geometry validation details | Check topology errors |
| `add/raster/` | POST | ⏳ | - | Add raster layer (TIFF) | File upload |
| `georefer` | POST | ⏳ | - | Georeference raster | Set projection/bounds |
| `name` | POST | ⏳ | - | Change layer name | |
| `selection` | POST | ⏳ | - | Set layer visibility | Show/hide layer |
| `attributes/names` | GET | ⏳ | - | Get attribute names | Column names |
| `attributes/names_and_types` | GET | ⏳ | - | Get attribute names and types | Column schema |
| `label` | POST | ⏳ | - | Add label | Layer labeling |
| `label/remove` | POST | ⏳ | - | Remove label | |
| `attributes` | GET | ⏳ | - | Get layer attributes | All column data? |
| `copy/geometry` | POST | ⏳ | - | Merge layer | Copy features? |
| `clone` | POST | ⏳ | - | Clone layer | Duplicate layer |
| `geometry/check` | POST | ⏳ | - | Check geometry validity | Topology check |
| `constraints` | GET | ⏳ | - | Get layer constraints | DB constraints |
| `export` | GET | ⏳ | - | Export layer | Format? SHP/GeoJSON? |
| `style/add` | POST | ⏳ | - | Add style | Same as `style`? |
| `features` | GET | ⏳ | - | Get features | GeoJSON features |
| `feature/coordinates` | GET | ⏳ | - | Get feature coordinates | Single feature |
| `geometry` | GET | ⏳ | - | Get geometry | GeoJSON geometry |
| `style/export` | GET | ⏳ | - | Export style | SLD/QML file |
| `column/values` | GET | ⏳ | - | Get column values | Unique values |
| `transaction/` | POST | ⏳ | - | Layer transaction | Edit features |
| `transaction/consultation` | POST | ⏳ | - | Transaction for consultations | Need clarification |
| `mask` | POST | ⏳ | - | Mask TIFF | Clip raster |
| `transparency` | POST | ⏳ | - | Set transparency | Layer opacity |
| `features/selected` | GET | ⏳ | - | Get selected features | User selection |
| `multipleSaving` | POST | ⏳ | - | Multiple save | Batch feature edit |
| `scale` | POST | ⏳ | - | Set visibility scale | Min/max scale |
| `opacity/set` | POST | ⏳ | - | Set layer opacity | 0-100? |
| `published/set` | POST | ⏳ | - | Set layer published | Public/private |
| `get/gaps` | GET | ⏳ | - | Get gaps | Topology gaps |
| `get/layers_subusers_to_append` | GET | ⏳ | - | Get layers to append | Collaboration |
| `get/layers_subusers` | GET | ⏳ | - | Get sub-user layers | Collaboration |
| `insert_sub_users_to_layer` | POST | ⏳ | - | Add sub-users to layer | Collaboration |
| `delete_sub_users_from_layer` | DELETE | ⏳ | - | Remove sub-users | Collaboration |

**Source:** `geocraft_api/layers/urls.py`

**Questions for User:**
1. What's the difference between `style` and `style/add`?
2. What format does `export` return by default?
3. Are "sub-users" for layer-level permissions?
4. What's the "app" in `add/app`?

---

## 5. Groups (`/api/groups/*`)

Base: `/api/groups/`

| Endpoint | Method | Status | RTK Slice | Description | Notes |
|----------|--------|--------|-----------|-------------|-------|
| `add` | POST | ⏳ | - | Add layer group | |
| `export` | GET | ⏳ | - | Export group | |
| `layer/remove` | DELETE | ⏳ | - | Remove layer from group | |
| `inspire/add` | POST | ⏳ | - | Add INSPIRE group | EU standard |
| `name` | POST | ⏳ | - | Change group name | |
| `krajowy/version/add` | POST | ⏳ | - | Add krajowy version | Polish national standard |
| `krajowy/version/get` | GET | ⏳ | - | Get krajowy history | Version history |
| `krajowy/restore` | POST | ⏳ | - | Restore krajowy version | Rollback |
| `selection` | POST | ⏳ | - | Set group visibility | Show/hide group |

**Source:** `geocraft_api/groups/urls.py`

**Questions for User:**
1. What's "krajowy"? Polish national mapping standard?
2. Is INSPIRE group different from regular group?

---

## 6. Styles (`/api/styles/*`)

Base: `/api/styles/`

| Endpoint | Method | Status | RTK Slice | Description | Notes |
|----------|--------|--------|-----------|-------------|-------|
| (To be documented) | - | ⏳ | - | - | Need to read styles/urls.py |

**Source:** `geocraft_api/styles/urls.py` (not yet read)

---

## 7. Parcels (`/api/parcel/*`)

Base: `/api/parcel/`

| Endpoint | Method | Status | RTK Slice | Description | Notes |
|----------|--------|--------|-----------|-------------|-------|
| (To be documented) | - | ⏳ | - | - | Need to read parcel/urls.py |

**Source:** `geocraft_api/parcel/urls.py` (not yet read)

---

## 8. Admin Stats (`/api/admin/*`)

Base: `/api/admin/`

| Endpoint | Method | Status | RTK Slice | Description | Notes |
|----------|--------|--------|-----------|-------------|-------|
| (To be documented) | - | ⏳ | - | - | Need to read admin_stats/urls.py |

**Source:** `geocraft_api/admin_stats/urls.py` (not yet read)

---

## Integration Priority

**Phase 1: Core Features (Current)**
1. ✅ Authentication (login, register, profile)
2. ✅ Dashboard projects list (GET /dashboard/projects/)
3. ✅ Public projects (GET /dashboard/projects/public/)
4. ✅ Create project (POST /dashboard/projects/create/)
5. ✅ Delete project (DELETE /dashboard/projects/delete/)
6. 🔨 QGIS Import (POST /api/projects/import/qgs/, /api/projects/import/qgz/)

**Phase 2: Project Management**
1. Update project (PUT /dashboard/projects/update/)
2. Get project details (GET /dashboard/projects/<name>/)
3. Publish/unpublish project
4. Change domain
5. Project metadata

**Phase 3: Layer Management**
1. Add layers (Shapefile, GeoJSON, GML, Raster)
2. Layer styling
3. Layer visibility/opacity
4. Get features
5. Export layers

**Phase 4: Advanced Features**
1. Groups and INSPIRE
2. PostGIS operations
3. Wypis (land registry)
4. Collaboration (sub-users)
5. Admin statistics

---

## Testing Checklist

For each endpoint integration:

- [ ] Read backend view implementation
- [ ] Document request payload format
- [ ] Document response format
- [ ] Create RTK Query mutation/query
- [ ] Create UI component for testing
- [ ] Test with real data
- [ ] Handle errors gracefully
- [ ] Ask user if behavior unclear
- [ ] Commit and push to GitHub
- [ ] Update this document with ✅ status

---

## Notes

- **Always use `/api/` prefix** for projects, layers, groups, styles endpoints
- **Use `/dashboard/` prefix** for dashboard-specific endpoints
- **Use `/auth/` prefix** for authentication endpoints
- **Check CORS** - only `localhost:3000` is allowed
- **Token authentication** - Use `Token <token>` format (not `Bearer`)
