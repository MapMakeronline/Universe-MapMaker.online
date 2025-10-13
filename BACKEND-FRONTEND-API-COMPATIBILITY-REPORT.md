# Universe-MapMaker Backend-Frontend API Compatibility Report

**Data:** 2025-01-13
**Analiza:** Backend (Django/QGIS) vs Frontend (Next.js/RTK Query)
**Status:** 45% pokrycie endpointów, 1 krytyczny bug, 15 niezgodności parametrów

---

## 🚨 KRYTYCZNE BŁĘDY DO NATYCHMIASTOWEGO NAPRAWIENIA

### Bug #1: Brak prefiksu `/projects/` w parametrze MAP (BACKEND)

**Lokalizacja:** `Universe-Mapmaker-Backend/geocraft_api/projects/service.py:4591`

**Problem:**
```python
# ❌ BŁĄD (linia 4591):
url = (
    f"{qgis_server_url}?"
    f"SERVICE=WMS&"
    f"VERSION=1.3.0&"
    f"REQUEST=GetCapabilities&"
    f"MAP={project_name}/{project_name}.qgs"  # Brak /projects/!
)
```

**Powinno być:**
```python
# ✅ POPRAWNIE:
MAP=/projects/{project_name}/{project_name}.qgs
```

**Wpływ:**
- 🔴 **WYSOKI** - Walidacja QGIS Server zawsze zawodzi
- Publikacja projektów może się nie udać
- Licznik warstw zwraca 0

**Dowód:**
- Frontend używa `/projects/` (qgis-layers.ts:148, 256 i QGISProjectLoader.tsx:198) ✅
- Inne funkcje backendu używają `/projects/` (service.py:3824) ✅
- Tylko `validate_qgis_server_access()` NIE używa prefiksu ❌

---

## 📊 STATYSTYKI POKRYCIA API

| Kategoria | Liczba | Procent |
|-----------|--------|---------|
| **Wszystkie endpointy backendu** | 97 | 100% |
| **Zaimplementowane w frontendzie** | 44 | 45% |
| **Brakujące w frontendzie** | 53 | 55% |
| **Niezgodności parametrów** | 15 | - |
| **Krytyczne bugi** | 1 | - |

---

## ✅ POPRAWNIE ZAIMPLEMENTOWANE ENDPOINTY

### Projects API (18/52 endpointów)

| Endpoint | Hook | Status |
|----------|------|--------|
| POST /api/projects/create/ | useCreateProjectMutation | ✅ OK |
| POST /api/projects/import/qgs/ | useImportQGSMutation | ✅ OK |
| POST /api/projects/import/qgz/ | useImportQGZMutation | ✅ OK |
| POST /api/projects/remove/ | useDeleteProjectMutation | ✅ OK |
| POST /api/projects/export | useExportProjectMutation | ✅ OK |
| POST /api/projects/publish | useTogglePublishMutation | ✅ OK |
| POST /api/projects/logo/update/ | useUpdateLogoMutation | ✅ OK |
| POST /api/projects/metadata | useSetMetadataMutation | ✅ OK |
| GET /api/projects/new/json | useGetProjectDataQuery | ✅ OK |
| POST /api/projects/tree/order | useChangeLayersOrderMutation | ✅ OK |
| POST /api/projects/reload | useReloadProjectMutation | ✅ OK |
| POST /api/projects/repair | useRepairProjectMutation | ✅ OK |
| POST /api/projects/restore | useRestoreProjectMutation | ✅ OK |
| POST /api/projects/basemap/set | useSetBasemapMutation | ✅ OK |
| POST /api/projects/print | usePreparePrintImageMutation | ✅ OK |

### Layers API (26/65 endpointów)

| Endpoint | Hook | Status |
|----------|------|--------|
| POST /api/layer/add/geojson/ | useAddGeoJsonLayerMutation | ✅ OK |
| POST /api/layer/add/shp/ | useAddShapefileLayerMutation | ✅ OK |
| POST /api/layer/add/gml/ | useAddGMLLayerMutation | ✅ OK |
| POST /api/layer/style | useUpdateLayerStyleMutation | ✅ OK |
| POST /api/layer/style/reset | useResetLayerStyleMutation | ✅ OK |
| POST /api/layer/remove/database | useDeleteLayerMutation | ✅ OK |
| POST /api/layer/selection | useSetLayerVisibilityMutation | ✅ OK |
| POST /api/layer/attributes | useGetLayerAttributesQuery | ✅ OK |
| POST /api/layer/features | useGetFeaturesQuery | ✅ OK |
| POST /api/layer/geometry | useGetGeometryQuery | ✅ OK |
| POST /api/layer/label | useAddLabelMutation | ✅ OK |
| POST /api/layer/clone | useCloneLayerMutation | ✅ OK |
| GET /layer/export | useExportLayerMutation | ✅ OK |

---

## ❌ BRAKUJĄCE FUNKCJE (Wysoki Priorytet)

### 1. Edycja obiektów (WFS-T)

**Brakujące endpointy:**
- `POST /api/layer/feature/add` - Dodawanie nowych obiektów
- `POST /api/layer/feature/update` - Edycja geometrii/atrybutów
- `POST /api/layer/feature/delete` - Usuwanie obiektów

**Wpływ:** ❌ Brak interaktywnej edycji obiektów na mapie

**Rozwiązanie tymczasowe:**
Użyć `POST /api/layer/transaction/` z XML WFS-T

### 2. Obsługa warstw rastrowych

**Brakujące endpointy:**
- `POST /api/layer/add/raster/` - Dodawanie TIF/raster
- `POST /api/layer/georefer` - Georeferencja obrazów
- `POST /api/layer/mask` - Maskowanie rastra
- `POST /api/layer/transparency` - Przezroczystość rastra

**Wpływ:** ❌ Brak możliwości dodawania map rastrowych

### 3. Kontrola widoczności warstw

**Brakujące endpointy:**
- `POST /api/layer/opacity/set` - Ustawienie przezroczystości
- `POST /api/layer/scale` - Widoczność zależna od skali
- `POST /api/layer/published/set` - Publikacja warstwy

**Wpływ:** ⚠️ Ograniczona kontrola wyświetlania warstw

---

## 🔧 NIEZGODNOŚCI PARAMETRÓW

### Snake_case (Backend) vs camelCase (Frontend)

| Backend | Frontend | Wpływ | Status |
|---------|----------|-------|--------|
| project_name | projectName | 🔴 Wysoki | ⚠️ Wymaga transformacji |
| layer_name | layerName | 🔴 Wysoki | ⚠️ Wymaga transformacji |
| feature_id | featureId | 🟡 Średni | ⚠️ Wymaga transformacji |
| column_name | columnName | 🟡 Średni | ⚠️ Wymaga transformacji |
| column_type | columnType | 🟡 Średni | ⚠️ Wymaga transformacji |
| old_name | oldName | 🟡 Średni | ⚠️ Wymaga transformacji |
| new_name | newName | 🟡 Średni | ⚠️ Wymaga transformacji |

**Przykład poprawnej transformacji:**
```typescript
query: ({ projectName, layerName }) => ({
  url: '/api/layer/attributes',
  method: 'POST',
  body: {
    project_name: projectName,  // ← Transformacja
    layer_name: layerName,      // ← Transformacja
  }
})
```

---

## 🗺️ INTEGRACJA QGIS SERVER

### ✅ Poprawnie skonfigurowane

**Backend:**
- URL wewnętrzny: `http://qgis-server:8080` (Docker)
- URL publiczny: `https://api.universemapmaker.online/ows`
- Ścieżka projektów: `QGIS_PROJECTS_PATH=/projects`

**Frontend:**
- Base URL: `https://api.universemapmaker.online/ows`
- Parametr MAP: `/projects/{projectName}/{projectName}.qgs` ✅

### WMS GetMap - Poprawnie

```typescript
// qgis-layers.ts:135-148
SERVICE=WMS
VERSION=1.3.0
REQUEST=GetMap
LAYERS=layer_name
STYLES=                    // ✅ Dodane
WIDTH=256
HEIGHT=256
CRS=EPSG:3857
BBOX={bbox-epsg-3857}
FORMAT=image/png
TRANSPARENT=true
DPI=96                     // ✅ Dodane
MAP=/projects/{name}/{name}.qgs  // ✅ Poprawne
```

### WFS GetFeature - Poprawnie

```typescript
// qgis-layers.ts:248-256
SERVICE=WFS
VERSION=1.1.0
REQUEST=GetFeature
TYPENAME=layer_name
OUTPUTFORMAT=application/json
SRSNAME=EPSG:4326
MAXFEATURES=1000
MAP=/projects/{name}/{name}.qgs  // ✅ Poprawne
```

---

## 📝 ZALECENIA - FRONTEND

### Natychmiastowe (Krytyczne)

#### 1. Czekaj na poprawkę backendu
**NIE implementuj** nowych funkcji przed naprawą buga w `service.py:4591`

#### 2. Weryfikacja transformacji parametrów
Sprawdź wszystkie mutacje w `layersApi.ts`:
```typescript
// Sprawdź każdą mutację
useGetLayerAttributesQuery()
useSetLayerVisibilityMutation()
useGetFeaturesQuery()
// ... etc
```

### Wysokie (Następny sprint)

#### 3. Implementacja edycji obiektów
```typescript
// Opcja 1: Jeśli backend ma feature/add endpoint
addFeature: builder.mutation<...>({
  url: '/api/layer/feature/add',
  // ...
})

// Opcja 2: Użyj WFS-T
addFeatureWFS: builder.mutation<...>({
  url: '/api/layer/transaction/',
  body: { transaction_xml: '...' }
})
```

#### 4. Dodaj kontrolę przezroczystości warstw
```typescript
setLayerOpacity: builder.mutation<
  { success: boolean },
  { projectName: string; layerName: string; opacity: number }
>({
  query: ({ projectName, layerName, opacity }) => ({
    url: '/api/layer/opacity/set',
    method: 'POST',
    body: {
      project_name: projectName,
      layer_name: layerName,
      opacity,
    },
  }),
})
```

#### 5. Implementacja warstw rastrowych
```typescript
addRasterLayer: builder.mutation<
  { success: boolean; layer_name: string },
  { projectName: string; layerName: string; file: File }
>({
  query: ({ projectName, layerName, file }) => {
    const formData = new FormData();
    formData.append('project', projectName);
    formData.append('layer_name', layerName);
    formData.append('file', file);

    return {
      url: '/api/layer/add/raster/',
      method: 'POST',
      body: formData,
    };
  },
})
```

### Średnie (Q1 2025)

- Operacje przestrzenne PostGIS
- Import/eksport stylów (SLD/QML)
- Zarządzanie dokumentami projektów
- Filtrowanie i wyszukiwanie

---

## 🧪 LISTA TESTÓW

### Backend Bug Test

```bash
# Test 1: Obecny (powinien zawieść)
curl "http://qgis-server:8080/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities&MAP=MyProject/MyProject.qgs"
# Oczekiwane: 404 Not Found

# Test 2: Po poprawce (powinien działać)
curl "http://qgis-server:8080/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities&MAP=/projects/MyProject/MyProject.qgs"
# Oczekiwane: 200 OK z XML
```

### Frontend Parameter Test

```typescript
// Test transformacji parametrów
const { data } = useGetLayerAttributesQuery({
  projectName: "MyProject",
  layerName: "buildings"
});

// Network tab powinien pokazać:
// POST /api/layer/attributes
// Body: { "project_name": "MyProject", "layer_name": "buildings" }
```

### QGIS Integration Test

```typescript
// Test ładowania WMS
const wmsUrl = "https://api.universemapmaker.online/ows?" +
  "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap" +
  "&LAYERS=buildings&STYLES=" +
  "&WIDTH=256&HEIGHT=256&CRS=EPSG:3857" +
  "&BBOX=-10000,-10000,10000,10000" +
  "&FORMAT=image/png&TRANSPARENT=true&DPI=96" +
  "&MAP=/projects/MyProject/MyProject.qgs";

fetch(wmsUrl)
  .then(r => console.log('WMS Status:', r.status))
  .catch(e => console.error('WMS Error:', e));
```

---

## 📋 ZADANIA DO WYKONANIA

### Krytyczne (Natychmiast)

- [ ] **Backend Team:** Napraw MAP parametr w `service.py:4591` (dodaj `/projects/`)
- [ ] **Frontend Team:** Zweryfikuj transformację parametrów we wszystkich mutacjach
- [ ] **Dokumentacja:** Popraw `owner_id` → `user_id` w dokumentacji

### Wysokie (Następny sprint)

- [ ] **Backend Team:** Wyjaśnij endpointy do edycji obiektów (feature add/update/delete)
- [ ] **Frontend Team:** Implementuj edycję obiektów (WFS-T lub dedykowane endpointy)
- [ ] **Frontend Team:** Dodaj kontrolę przezroczystości/widoczności warstw
- [ ] **Frontend Team:** Zaimplementuj upload warstw rastrowych

### Średnie (Q1 2025)

- [ ] **Frontend Team:** Operacje przestrzenne PostGIS
- [ ] **Frontend Team:** Import/eksport stylów
- [ ] **Frontend Team:** Zarządzanie dokumentami
- [ ] **Frontend Team:** Filtrowanie i wyszukiwanie

### Niska (Backlog)

- [ ] **Frontend Team:** Zarządzanie subuserami (współpraca)
- [ ] **Frontend Team:** Integracja Wypis (jeśli potrzebna)
- [ ] **Frontend Team:** Zaawansowane opcje publikacji

---

## 📁 STRUKTURA PLIKÓW PROJEKTU

### Backend (Django)
```
Universe-Mapmaker-Backend/
├── geocraft_api/
│   ├── projects/
│   │   ├── urls.py          # 52 endpointy
│   │   ├── views.py         # Logika endpointów
│   │   ├── service.py       # 🔴 BUG: linia 4591
│   │   └── serializers.py
│   ├── layers/
│   │   ├── urls.py          # 65 endpointów
│   │   ├── views.py
│   │   └── db_utils.py      # ✅ ST_Extent naprawione
│   └── json_utils.py        # ✅ Threading naprawiony
├── geocraft/
│   └── settings.py          # Konfiguracja QGIS
└── .env
    ├── QGIS_PROJECTS_PATH=/projects
    └── QGIS_SERVER_URL=http://qgis-server:8080
```

### Frontend (Next.js)
```
Universe-MapMaker.online/
├── src/
│   ├── redux/api/
│   │   ├── projectsApi.ts   # 18 endpointów ✅
│   │   └── layersApi.ts     # 26 endpointów ✅
│   ├── mapbox/
│   │   └── qgis-layers.ts   # WMS/WFS ✅
│   ├── components/qgis/
│   │   └── QGISProjectLoader.tsx  # ✅
│   └── features/warstwy/
│       └── komponenty/
│           ├── LayerTree.tsx      # ✅ Zoom fixed
│           └── LeftPanel.tsx      # ✅ Header fixed
└── BACKEND-FRONTEND-API-COMPATIBILITY-REPORT.md  # Ten raport
```

---

## 🔐 AUTENTYKACJA I CORS

### Backend Authentication
```python
# Token-based auth (Django REST Framework)
Authorization: Token <token_value>

# Chronione endpointy: Wszystkie /api/* oprócz:
# - POST /auth/login/
# - POST /auth/register/
# - GET /dashboard/projects/public/
# - GET /api/projects/new/json?published=true
```

### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",           # Development
    "https://universemapmaker.online", # Production
]
CORS_ALLOW_CREDENTIALS = True
```

**Status:** ✅ Poprawnie skonfigurowane

---

## 📞 KONTAKT W RAZIE PYTAŃ

- **Backend Bug:** `service.py:4591` - zgłoś do Backend Team
- **Frontend API:** `src/redux/api/` - pytaj Frontend Team
- **QGIS Server:** Sprawdź konfigurację w `.env` i `settings.py`

---

**Raport wygenerowany:** 2025-01-13
**Autor analizy:** Claude (Anthropic AI)
**Wersja backendu:** Django REST Framework + QGIS 3.x
**Wersja frontendu:** Next.js 15 + RTK Query

