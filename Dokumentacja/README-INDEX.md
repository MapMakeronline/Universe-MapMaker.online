# 📚 Indeks Dokumentacji Universe MapMaker

**Kompletna dokumentacja projektu** - backend API, deployment, infrastruktura, testy, quality audits.

**Łącznie:** 24 pliki dokumentacji + pliki przykładowe (412KB)

---

## 📂 Kategorie

### 🔌 Backend API (6 plików - 157KB)
- **[README.md](README.md)** (21KB) - Plan 9-fazowej integracji + checklist
- **[BACKEND-ENDPOINTS.md](BACKEND-ENDPOINTS.md)** (16KB) - Mapa 350+ endpointów
- **[auth_api_docs.md](auth_api_docs.md)** (9.5KB) - Autoryzacja
- **[projects_api_docs.md](projects_api_docs.md)** (45KB) - Projekty (60+ endpoints)
- **[groups_api_docs.md](groups_api_docs.md)** (9.8KB) - Grupy warstw + INSPIRE
- **[layer_api_docs.md](layer_api_docs.md)** (60KB) - Warstwy (65+ endpoints)
- **[styles_api_docs.md](styles_api_docs.md)** (15KB) - Stylowanie

### 🚀 Deployment & Infrastructure (4 pliki - 48KB)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** (18KB) - Proces deployment GCP
- **[GCP-DEPLOYMENT.md](GCP-DEPLOYMENT.md)** (13KB) - Cloud Run, Cloud Build
- **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)** (9.8KB) - Architektura systemu
- **[DEPLOYMENT-STATUS.md](DEPLOYMENT-STATUS.md)** (4.9KB) - Status deploymentu

### 🧪 Quality & Testing (4 pliki - 67KB)
- **[CODE-QUALITY-AUDIT.md](CODE-QUALITY-AUDIT.md)** (36KB) - Code quality audit
- **[UI-AUDIT-REPORT.md](UI-AUDIT-REPORT.md)** (14KB) - UI/UX audit
- **[REFACTORING-COMPLETE.md](REFACTORING-COMPLETE.md)** (16KB) - Refactoring summary
- **[TESTING-GUIDE.md](TESTING-GUIDE.md)** (7.4KB) - Testing guidelines
- **[TESTING.md](TESTING.md)** (8.5KB) - Testing documentation
- **[TEST-REPORT.md](TEST-REPORT.md)** (7.6KB) - Test results

### 📋 Backend Integration & Fixes (4 pliki - 50KB)
- **[BACKEND-INTEGRATION.md](BACKEND-INTEGRATION.md)** (9.4KB) - Backend integration guide
- **[BACKEND-API-REFERENCE.md](BACKEND-API-REFERENCE.md)** (18KB) - API reference
- **[BACKEND-FIX-SUMMARY.md](BACKEND-FIX-SUMMARY.md)** (8.8KB) - Backend fixes
- **[AUTH-FLOW-GUIDE.md](AUTH-FLOW-GUIDE.md)** (9.6KB) - Authentication flow

### 🔧 Admin & Diagnostics (2 pliki - 13.4KB)
- **[ADMIN-ACCESS.md](ADMIN-ACCESS.md)** (11KB) - Admin access guide
- **[DIAGNOSTIC-REPORT.md](DIAGNOSTIC-REPORT.md)** (2.4KB) - System diagnostics

### 📁 Przykładowe Pliki
- **[przykładowe-pliki/](przykładowe-pliki/)** - Testowe pliki QGIS
  - `ogrodzieniecsip.qgs` (5MB) - Przykładowy projekt QGIS do testowania importu

---

## 🔥 Start Here - Najważniejsze Dokumenty

### Dla Developerów Frontend:
1. **[README.md](README.md)** - Plan integracji + checklist ⭐
2. **[BACKEND-ENDPOINTS.md](BACKEND-ENDPOINTS.md)** - Wszystkie endpointy
3. **[projects_api_docs.md](projects_api_docs.md)** - Najczęściej używane API

### Dla DevOps:
1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
2. **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)** - System architecture
3. **[GCP-DEPLOYMENT.md](GCP-DEPLOYMENT.md)** - GCP config

### Dla QA/Testers:
1. **[TESTING-GUIDE.md](TESTING-GUIDE.md)** - Testing guidelines
2. **[TEST-REPORT.md](TEST-REPORT.md)** - Latest test results
3. **[UI-AUDIT-REPORT.md](UI-AUDIT-REPORT.md)** - UI issues

---

## 📖 Szczegółowy Opis Dokumentów

### 🔌 Backend API Documentation

#### 1. README.md - Master Plan Integracji ⭐
**Najważniejszy dokument dla developerów!**

**Zawartość:**
- 📋 Plan 9-fazowej integracji backendu (Fazy 1-9)
- ✅ Checklist dla każdego endpointu
- ❓ Pytania do wyjaśnienia z użytkownikiem
- 🎯 Priorytety implementacji
- 📊 Status ukończenia każdej fazy

**Fazy integracji:**
1. ✅ Import QGIS (ukończenie) - **PRIORYTET 1**
2. ⏳ Zarządzanie projektem (CRUD + publikacja)
3. ⏳ Import warstw (SHP, GeoJSON, GML, raster)
4. ⏳ Zarządzanie warstwami (edycja, stylowanie)
5. ⏳ Grupy i INSPIRE
6. ⏳ Transakcje (edycja obiektów)
7. ⏳ PostGIS operations
8. ⏳ Wypis (Polish land registry)
9. ⏳ Współpraca i administracja

#### 2. BACKEND-ENDPOINTS.md - Mapa Endpointów
**Kompletna lista 350+ endpointów backendu**

**Kategorie:**
- Authentication (`/auth/*`) - 4 endpointy
- Dashboard (`/dashboard/*`) - 9 endpointów
- Projects (`/api/projects/*`) - 60+ endpointów
- Layers (`/api/layer/*`) - 65+ endpointów
- Groups (`/api/groups/*`) - 9 endpointów
- Styles (`/api/styles/*`) - do dokumentacji
- Parcels (`/api/parcel/*`) - do dokumentacji
- Admin (`/api/admin/*`) - do dokumentacji

**Format:**
```
| Endpoint | Method | Status | RTK Slice | Description | Notes |
| create/  | POST   | 🔨     | -         | Create proj | Testing |
```

**Statusy:**
- ✅ Integrated - RTK Query implemented
- 🔨 In Progress - Currently working
- ⏳ Pending - Not started
- ❌ Not Working - Backend issues
- 📝 Needs Clarification - Ask user

#### 3. auth_api_docs.md - Autoryzacja
**4 endpointy autoryzacji**

**Kluczowe koncepty:**
- Token authentication (`Token <token>` format)
- PostgreSQL user creation (dbLogin, dbPassword)
- Email powitalny po rejestracji
- Transakcje atomowe

**Endpointy:**
- `POST /auth/register` - Rejestracja + utworzenie DB user
- `POST /auth/login` - Logowanie (zwraca token)
- `POST /auth/logout` - Wylogowanie (invalidate token)
- `GET /auth/profile` - Profil użytkownika

#### 4. projects_api_docs.md - Projekty (45KB)
**NAJWAŻNIEJSZY - 60+ endpointów zarządzania projektami**

**Kluczowe operacje:**
1. **Tworzenie projektu** - PostgreSQL DB + QGS file
2. **Import QGIS** - .qgs/.qgz import → PostGIS
3. **Publikacja** - GeoServer WMS/WFS
4. **Subdomeny** - Unikalna subdomena per projekt
5. **Wypis** - Generowanie DOCX/PDF (Polish land registry)
6. **Wyszukiwanie** - Full-text search, filtering

**Struktura projektu:**
```
~/mapmaker/server/qgs/<username>/<project_name>/
├── project.qgs     # QGIS project file
├── tree.json       # Layer tree structure
├── logo.png        # Project thumbnail
├── styles/         # QML/SLD styles
└── documents/      # Attached documents
```

**Przykładowe endpointy:**
- `POST /api/projects/import/qgs/` - Import .qgs
- `GET /api/projects/export` - Export project
- `POST /api/projects/publish` - Publish to GeoServer
- `POST /api/projects/domain/change` - Change subdomain
- `GET /api/projects/search` - Full-text search

#### 5. groups_api_docs.md - Grupy Warstw (9.8KB)
**Zarządzanie grupami warstw + standardy INSPIRE/Krajowy**

**Typy grup:**
- **Regular groups** - Zwykłe grupy organizacyjne
- **INSPIRE groups** - Zgodne ze standardem UE (spatial planning)
- **Krajowy groups** - Polski standard mapping (Plan Zagospodarowania)

**Wersjonowanie (krajowy):**
- Snapshoty GML z timestampem
- Historia wersji z przywracaniem
- Format: `YYYYMMDDTHH:mm:ss`

**Endpointy:**
- `POST /api/groups/add` - Dodaj grupę
- `POST /api/groups/inspire/add` - INSPIRE group
- `POST /api/groups/krajowy/version/add` - Zapisz wersję
- `GET /api/groups/krajowy/version/get` - Historia
- `POST /api/groups/krajowy/restore` - Przywróć

#### 6. layer_api_docs.md - Warstwy (60KB)
**NAJWIĘKSZY - 65+ endpointów operacji na warstwach**

**Kategorie:**
1. **Import** - SHP, GeoJSON, GML, TIFF
2. **Stylowanie** - QML/SLD, transparency, opacity
3. **Kolumny** - add, rename, remove, merge
4. **Geometria** - validation, intersections, PostGIS ops
5. **Atrybuty** - schema, values, features
6. **Transakcje** - WFS Insert/Update/Delete
7. **Eksport** - SHP, GeoJSON, GML, GPKG
8. **Zarządzanie** - name, visibility, clone, scale
9. **Raster** - georeference, mask TIFF
10. **Współpraca** - sub-users, permissions

**Przykładowe endpointy:**
- `POST /api/layer/add/shp/` - Import Shapefile
- `POST /api/layer/style` - Apply style
- `GET /api/layer/features` - Get all features (GeoJSON)
- `POST /api/layer/transaction/` - WFS Transaction
- `POST /api/layer/create/intersections` - PostGIS overlay
- `GET /api/layer/export` - Export layer

#### 7. styles_api_docs.md - Stylowanie (15KB)
**Dokumentacja stylowania i symboli**

**Zawartość:**
- Style management dla warstw
- Definicje symboli (markers, fills, borders)
- Palety kolorów
- Style kategoryzowane i gradowane
- Integracja QML/SLD

---

### 🚀 Deployment & Infrastructure

#### 1. DEPLOYMENT.md (18KB)
**Kompleksowy guide deploymentu na GCP**

**Zawartość:**
- ☁️ Cloud Build configuration
- 🐳 Dockerfile multi-stage build
- 🌍 Environment variables
- 📦 Next.js standalone build
- 🚀 Cloud Run deployment
- 🔧 Troubleshooting

**Proces deployment:**
1. Git push → Cloud Build trigger
2. Build image with Mapbox tokens
3. Push to Artifact Registry
4. Deploy to Cloud Run
5. Update environment variables

#### 2. GCP-DEPLOYMENT.md (13KB)
**Google Cloud Platform configuration**

**Infrastruktura:**
- **Cloud Run** - Frontend hosting
- **Cloud Build** - CI/CD pipeline
- **Artifact Registry** - Docker images
- **Cloud Storage** - Static assets
- **Secret Manager** - API keys

**Regiony:**
- `europe-central2` - Wszystkie zasoby

#### 3. INFRASTRUCTURE.md (9.8KB)
**Architektura systemu**

**Komponenty:**
- **VM** - universe-backend (34.0.251.33)
- **Database** - Railway PostgreSQL + PostGIS
- **Storage FASE** - Cloud Storage mounted `/mnt/qgis-projects`
- **Django API** - Port 8000
- **QGIS Server** - Port 8080
- **Frontend** - Cloud Run

**Networking:**
- Load balancer → frontend/backend routing
- SSL certificates (Google-managed)
- Domain: `universemapmaker.online`

#### 4. DEPLOYMENT-STATUS.md (4.9KB)
**Current deployment status**

**Production URLs:**
- Frontend: `https://universemapmaker.online`
- Backend API: `https://api.universemapmaker.online/api/`
- QGIS Server: `https://api.universemapmaker.online/ows`

---

### 🧪 Quality & Testing

#### 1. CODE-QUALITY-AUDIT.md (36KB)
**Comprehensive code quality audit**

**Kategorie:**
- ⚠️ Duplicate code (components, API clients)
- 🐛 Bugs and issues
- 🎨 UI/UX improvements
- 📦 Bundle size optimization
- ♿ Accessibility (WCAG compliance)
- 🚀 Performance (React profiling)

**Rekomendacje:**
- Usunąć duplikaty (unified API client)
- Lazy loading dla modals
- Code splitting
- Memoization dla expensive components

#### 2. UI-AUDIT-REPORT.md (14KB)
**UI/UX audit findings**

**Issues:**
- Inconsistent styling
- Duplicate modals
- Accessibility gaps (ARIA labels missing)
- Mobile responsiveness issues

**Fixes:**
- Global theme standardization
- Component consolidation
- WCAG 2.1 compliance
- Responsive design patterns

#### 3. REFACTORING-COMPLETE.md (16KB)
**4-phase refactoring summary**

**Phases:**
- ✅ Phase 1: API Consolidation (23% code reduction)
- ✅ Phase 2: Entity Adapter (O(1) lookups)
- ✅ Phase 3: RTK Query Migration (85% less boilerplate)
- ✅ Phase 4: Dead Code Removal (~2945 lines deleted)

**Results:**
- Cleaner codebase
- Better performance
- Type safety
- Easier maintenance

#### 4. TESTING-GUIDE.md (7.4KB)
**Testing best practices**

**Types of tests:**
- Unit tests (Jest + React Testing Library)
- Integration tests (API endpoints)
- E2E tests (Playwright)
- Visual regression (screenshot.bat)

**Coverage targets:**
- Critical paths: 80%+
- Utilities: 90%+
- Components: 70%+

#### 5. TESTING.md (8.5KB)
**Testing documentation**

**Test categories:**
- API tests
- Component tests
- Redux state tests
- Map interaction tests

#### 6. TEST-REPORT.md (7.6KB)
**Latest test results**

**Status:**
- ✅ Auth flow tests passing
- ✅ Project CRUD tests passing
- ⏳ Layer import tests pending
- ⏳ Map interaction tests pending

---

### 📋 Backend Integration & Fixes

#### 1. BACKEND-INTEGRATION.md (9.4KB)
**Backend integration guide**

**Topics:**
- API client configuration
- Authentication flow
- Error handling patterns
- RTK Query setup
- Cache invalidation

#### 2. BACKEND-API-REFERENCE.md (18KB)
**Quick API reference**

**Format:**
```
POST /api/projects/create/
Request: { name, description, category }
Response: { id, name, created_at, ... }
```

**Categories:**
- Projects API
- Layers API
- Groups API
- Auth API

#### 3. BACKEND-FIX-SUMMARY.md (8.8KB)
**Summary of backend fixes**

**Issues Fixed:**
- CORS configuration
- Token authentication format
- API endpoint routing
- Request/response serialization

#### 4. AUTH-FLOW-GUIDE.md (9.6KB)
**Authentication flow documentation**

**Flow:**
1. User submits credentials → `POST /auth/login`
2. Backend validates → Returns token
3. Frontend stores token → localStorage
4. All requests include → `Authorization: Token <token>`
5. Token expires → Redirect to login

**Token management:**
- Storage: `localStorage.getItem('authToken')`
- Format: `Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b`
- Expiration: 24 hours
- Refresh: Re-login required

---

### 🔧 Admin & Diagnostics

#### 1. ADMIN-ACCESS.md (11KB)
**Admin panel access guide**

**Credentials:**
- Django admin: `/admin/`
- Database access: Railway PostgreSQL
- GCP console access
- QGIS Server debugging

#### 2. DIAGNOSTIC-REPORT.md (2.4KB)
**System diagnostics**

**Health checks:**
- Database connectivity
- API response times
- QGIS Server status
- Frontend build status

---

### 📁 Przykładowe Pliki

#### przykładowe-pliki/ogrodzieniecsip.qgs (5MB)
**Testowy projekt QGIS do importu**

**Zawiera:**
- Warstwy wektorowe (ogrodzenia)
- Style QML
- Projekcję EPSG:2180 (Poland CS92)
- Atrybuty i dane

**Użycie:**
1. Otwórz frontend → Dashboard
2. Kliknij "Utwórz projekt" → Tab "Importuj QGIS"
3. Wybierz `ogrodzieniecsip.qgs`
4. Podaj nazwę projektu → Import
5. Weryfikuj w liście projektów

---

## 🔍 Wyszukiwanie w Dokumentacji

### Szukasz informacji o...

**Endpointach API?**
→ `BACKEND-ENDPOINTS.md` (mapa) + `*_api_docs.md` (szczegóły)

**Deploymencie?**
→ `DEPLOYMENT.md` + `GCP-DEPLOYMENT.md`

**Testach?**
→ `TESTING-GUIDE.md` + `TEST-REPORT.md`

**Refactoringu?**
→ `REFACTORING-COMPLETE.md` + `CODE-QUALITY-AUDIT.md`

**Autoryzacji?**
→ `AUTH-FLOW-GUIDE.md` + `auth_api_docs.md`

**Import QGIS?**
→ `README.md` (Faza 1) + `projects_api_docs.md` (Import section)

**Warstwach?**
→ `layer_api_docs.md` (60KB - wszystko!)

**Grupach i INSPIRE?**
→ `groups_api_docs.md`

---

## 🎯 Quick Links - Najczęściej Używane

### Developer Workflow:
1. 📋 [README.md](README.md) - Plan integracji
2. 🔌 [BACKEND-ENDPOINTS.md](BACKEND-ENDPOINTS.md) - Endpoint map
3. 📦 [projects_api_docs.md](projects_api_docs.md) - Projects API
4. 🗺️ [layer_api_docs.md](layer_api_docs.md) - Layers API

### Deployment:
1. 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
2. ☁️ [GCP-DEPLOYMENT.md](GCP-DEPLOYMENT.md) - GCP config

### Quality:
1. 🧪 [TESTING-GUIDE.md](TESTING-GUIDE.md) - Testing
2. 🎨 [CODE-QUALITY-AUDIT.md](CODE-QUALITY-AUDIT.md) - Quality audit

---

**Ostatnia aktualizacja:** 2025-10-09
**Wersja:** 2.0
**Łączna wielkość:** 412KB (24 pliki .md + pliki przykładowe)
**Autor:** Claude Code + Universe MapMaker Team
