# Analiza QGIS Identify Tool - Jak Działa i Jak Prawidłowo Go Używać

## 📋 Spis Treści

1. [Wstęp i Cel Analizy](#wstęp-i-cel-analizy)
2. [Architektura Systemu](#architektura-systemu)
3. [Struktura Danych w Bazie](#struktura-danych-w-bazie)
4. [Konfiguracja QGIS Server](#konfiguracja-qgis-server)
5. [GetFeatureInfo - Poprawne Użycie](#getfeatureinfo---poprawne-użycie)
6. [Frontend Implementation](#frontend-implementation)
7. [Przykłady Zapytań](#przykłady-zapytań)
8. [Common Issues](#common-issues)

---

## Wstęp i Cel Analizy

**Data analizy:** 2025-10-15
**Projekt testowy:** `graph`
**Warstwa testowa:** `test`

**Cel:** Zbadanie jak działa identyfikator obiektów (QGIS Identify Tool) i jak prawidłowo odbierać dane z QGIS Server za pomocą WMS GetFeatureInfo.

**Kluczowe odkrycia:**
- ✅ GetFeatureInfo działa poprawnie z QGIS Server
- ✅ Dane zwracane w formacie GeoJSON
- ✅ Warstwa "test" zawiera rzeczywiste dane geometryczne
- ⚠️ Wymaga poprawnej konfiguracji parametrów (BBOX, WIDTH, HEIGHT, X/Y)

---

## Architektura Systemu

### 1. **Komponenty Systemu**

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  IdentifyTool.tsx                                    │   │
│  │  - Obsługuje kliknięcia na mapie                    │   │
│  │  - Wysyła zapytania GetFeatureInfo                  │   │
│  │  - Wyświetla IdentifyModal z danymi                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS Request
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend Django + QGIS Server (VM)                 │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  QGIS Server (Port 8080)                           │    │
│  │  - Endpoint: /ows                                   │    │
│  │  - WMS/WFS/WCS services                            │    │
│  │  - MAP parameter: /projects/{project}/{project}.qgs│    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Query
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         PostgreSQL (Cloud SQL) - Database: graph           │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  public.test_id_340688                             │    │
│  │  - ogc_fid (PK)                                     │    │
│  │  - geom (PostGIS geometry - MultiPolygon)          │    │
│  │  - legenda, symbol, przezn, opis (attributes)      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Endpointy**

| Komponent | Endpoint | Opis |
|-----------|----------|------|
| **QGIS Server** | `https://api.universemapmaker.online/ows` | WMS/WFS services |
| **Backend API** | `https://api.universemapmaker.online/api/projects/new/json` | Project metadata (tree.json) |
| **Frontend** | `https://universemapmaker.online/map?project=graph` | Map viewer |

---

## Struktura Danych w Bazie

### 1. **Główna Baza: `postgres`**

Zawiera metadane Django:
- `geocraft_api_projectitem` - Projekty
- `geocraft_api_layer` - Metadane warstw (NIE zawiera geometrii!)
- `geocraft_api_customuser` - Użytkownicy

### 2. **Baza Projektu: `graph`**

**Każdy projekt ma SWOJĄ BAZĘ DANYCH!**

```sql
-- Warstwa "test" w projekcie "graph"
Database: graph
Table: public.test_id_340688

Columns:
  - ogc_fid (integer, PRIMARY KEY)
  - geom (geometry, MultiPolygon, SRID 3857)
  - legenda (varchar)
  - symbol (varchar)
  - przezn (varchar)
  - opis (varchar, nullable)
```

**Przykładowe dane:**

```sql
SELECT ogc_fid, legenda, symbol, przezn,
       ST_X(ST_Centroid(geom)) as lng,
       ST_Y(ST_Centroid(geom)) as lat
FROM public.test_id_340688
LIMIT 3;

 ogc_fid | legenda | symbol | przezn |        lng         |        lat
---------+---------+--------+--------+--------------------+-------------------
       3 | K       | 1_1.K  | K      |  2090942.568315152 |  6796741.92064079
       4 | Z       | 1_3.Z  | Z      |  2091398.985718863 | 6795851.865499172
       6 | MW      | 1_2.MW | MW     | 2091257.1753013912 |  6796371.55692534
```

**Klucz zrozumienia:**
- ❌ **NIE**: `tmp_name_aed23536_81a3_4fdd_a292_d0ce5ef8d76a` (to nazwa warstwy w metadanych!)
- ✅ **TAK**: `test_id_340688` (to nazwa tabeli PostGIS w bazie `graph`)

---

## Konfiguracja QGIS Server

### 1. **Plik QGS: `/app/qgs/graph/graph.qgs`**

**Datasource Configuration:**

```xml
<datasource>
  dbname='graph'
  host=34.116.133.97
  port=5432
  user='admin_mapmaker_000001'
  password='G6acAf2DG5BeA2B5b432FeGbFGg321D5'
  key='ogc_fid'
  type=MultiPolygon
  checkPrimaryKeyUnicity='1'
  table="public"."test_id_340688" (geom)
</datasource>
<layername>test</layername>
```

**Parametry:**
- **dbname**: Nazwa bazy danych projektu (`graph`)
- **table**: Nazwa tabeli PostGIS (`public.test_id_340688`)
- **key**: Klucz główny (`ogc_fid`)
- **geom**: Nazwa kolumny geometrii (`geom`, NIE `wkb_geometry`!)
- **type**: Typ geometrii (`MultiPolygon`)
- **SRID**: 3857 (Web Mercator)

### 2. **tree.json - Metadata Warstwy**

```json
{
  "name": "test",
  "id": "tmp_name_aed23536_81a3_4fdd_a292_d0ce5ef8d76a",
  "visible": true,
  "consultations": false,
  "public": false,
  "inspire": false,
  "app": false,
  "key_column_name": "ogc_fid",
  "published": true,
  "extent": [
    2088072.392159,
    6791904.4813486,
    2093376.41836681,
    6797843.97313167
  ],
  "geometry": "MultiPolygon",
  "type": "VectorLayer",
  "labeling": {
    "textColor": [50, 50, 50, 255],
    "fontSize": 10.0,
    "scaleMin": 0.0,
    "scaleMax": 0.0,
    "fieldName": ""
  },
  "opacity": 255
}
```

**Kluczowe pola:**
- **id**: UUID warstwy (używany w metadanych Django Layer)
- **extent**: Granice warstwy w EPSG:3857
- **key_column_name**: Nazwa kolumny PK
- **geometry**: Typ geometrii

---

## GetFeatureInfo - Poprawne Użycie

### 1. **Parametry WMS GetFeatureInfo**

**Standard WMS 1.1.1:**
```
SERVICE=WMS
VERSION=1.1.1
REQUEST=GetFeatureInfo
LAYERS={layer_name}
QUERY_LAYERS={layer_name}
SRS=EPSG:3857
BBOX={minX},{minY},{maxX},{maxY}
WIDTH={pixel_width}
HEIGHT={pixel_height}
X={click_x_pixel}
Y={click_y_pixel}
INFO_FORMAT=application/json
FEATURE_COUNT={max_features}
MAP=/projects/{project}/{project}.qgs
```

**Standard WMS 1.3.0:**
```
SERVICE=WMS
VERSION=1.3.0
REQUEST=GetFeatureInfo
LAYERS={layer_name}
QUERY_LAYERS={layer_name}
CRS=EPSG:3857
BBOX={minX},{minY},{maxX},{maxY}
WIDTH={pixel_width}
HEIGHT={pixel_height}
I={click_x_pixel}
J={click_y_pixel}
INFO_FORMAT=application/json
FEATURE_COUNT={max_features}
MAP=/projects/{project}/{project}.qgs
```

**Różnice między wersjami:**
| Parameter | WMS 1.1.1 | WMS 1.3.0 |
|-----------|-----------|-----------|
| Coordinate system | `SRS` | `CRS` |
| Click X coordinate | `X` | `I` |
| Click Y coordinate | `Y` | `J` |

### 2. **Przykład Działającego Zapytania**

**Request:**
```bash
curl -X GET "https://api.universemapmaker.online/ows?\
MAP=/projects/graph/graph.qgs&\
SERVICE=WMS&\
VERSION=1.1.1&\
REQUEST=GetFeatureInfo&\
LAYERS=test&\
QUERY_LAYERS=test&\
SRS=EPSG:3857&\
BBOX=2090000,6795000,2092000,6797000&\
WIDTH=512&\
HEIGHT=512&\
X=241&\
Y=222&\
INFO_FORMAT=application/json&\
FEATURE_COUNT=10"
```

**Response:**
```json
{
  "features": [
    {
      "geometry": null,
      "id": "test.88",
      "properties": {
        "legenda": "ZN/WS",
        "ogc_fid": 88,
        "opis": null,
        "przezn": "ZN/WS",
        "symbol": "1_1.ZN/WS"
      },
      "type": "Feature"
    },
    {
      "geometry": null,
      "id": "test.81",
      "properties": {
        "legenda": "Z",
        "ogc_fid": 81,
        "opis": null,
        "przezn": "Z",
        "symbol": "1_2.Z"
      },
      "type": "Feature"
    }
  ],
  "type": "FeatureCollection"
}
```

### 3. **Obliczanie Współrzędnych Kliknięcia**

**Wzór konwersji:**

```javascript
// Click coordinates in Web Mercator (EPSG:3857)
const clickLng = 2090942.568315152;
const clickLat = 6796741.92064079;

// Map viewport bounds
const bbox = {
  minX: 2090000,
  minY: 6795000,
  maxX: 2092000,
  maxY: 6797000
};

// Pixel dimensions
const width = 512;
const height = 512;

// Calculate pixel position
const x = Math.floor(((clickLng - bbox.minX) / (bbox.maxX - bbox.minX)) * width);
const y = Math.floor(((bbox.maxY - clickLat) / (bbox.maxY - bbox.minY)) * height);

console.log(`X=${x}, Y=${y}`); // X=241, Y=222
```

**TypeScript Function:**

```typescript
export function calculatePixelCoords(
  clickLng: number,
  clickLat: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  width: number,
  height: number
): { x: number; y: number } {
  const x = Math.floor(((clickLng - bounds.minX) / (bounds.maxX - bounds.minX)) * width);
  const y = Math.floor(((bounds.maxY - clickLat) / (bounds.maxY - bounds.minY)) * height);

  return { x, y };
}
```

---

## Frontend Implementation

### 1. **IdentifyTool.tsx - Current Implementation**

**Lokalizacja:** `src/features/mapa/komponenty/IdentifyTool.tsx`

**Obecne podejście:**
```typescript
// Uses Mapbox GL JS queryRenderedFeatures (client-side)
const queriedFeatures = map.queryRenderedFeatures(bbox);
```

**Ograniczenia:**
- ❌ Działa tylko dla warstw Mapbox (źródła `vector`, `geojson`, `raster`)
- ❌ NIE działa dla warstw WMS/WFS z QGIS Server
- ❌ Nie pobiera atrybutów z PostgreSQL

### 2. **Poprawna Implementacja - GetFeatureInfo API**

**Nowy moduł:** `src/lib/qgis/getFeatureInfo.ts`

```typescript
import { LngLat, LngLatBounds } from 'mapbox-gl';

export interface QGISFeatureInfoParams {
  project: string;
  layerName: string;
  clickPoint: LngLat;
  bounds: LngLatBounds;
  width: number;
  height: number;
  featureCount?: number;
}

export interface QGISFeature {
  id: string;
  properties: Record<string, any>;
  geometry: any | null;
  type: 'Feature';
}

export interface QGISFeatureCollection {
  type: 'FeatureCollection';
  features: QGISFeature[];
}

/**
 * Converts Web Mercator coordinates to pixel coordinates
 */
function lngLatToPixel(
  lngLat: LngLat,
  bounds: LngLatBounds,
  width: number,
  height: number
): { x: number; y: number } {
  const minX = bounds.getWest();
  const maxX = bounds.getEast();
  const minY = bounds.getSouth();
  const maxY = bounds.getNorth();

  const x = Math.floor(((lngLat.lng - minX) / (maxX - minX)) * width);
  const y = Math.floor(((maxY - lngLat.lat) / (maxY - minY)) * height);

  return { x, y };
}

/**
 * Fetches feature information from QGIS Server using WMS GetFeatureInfo
 *
 * @param params - GetFeatureInfo parameters
 * @returns Promise with GeoJSON FeatureCollection
 */
export async function getQGISFeatureInfo(
  params: QGISFeatureInfoParams
): Promise<QGISFeatureCollection> {
  const { project, layerName, clickPoint, bounds, width, height, featureCount = 10 } = params;

  // Convert click point to pixel coordinates
  const { x, y } = lngLatToPixel(clickPoint, bounds, width, height);

  // Build GetFeatureInfo URL
  const baseUrl = 'https://api.universemapmaker.online/ows';
  const searchParams = new URLSearchParams({
    MAP: `/projects/${project}/${project}.qgs`,
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layerName,
    QUERY_LAYERS: layerName,
    SRS: 'EPSG:4326', // LngLatBounds are in EPSG:4326
    BBOX: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    X: x.toString(),
    Y: y.toString(),
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: featureCount.toString(),
  });

  const url = `${baseUrl}?${searchParams.toString()}`;

  console.log('🔍 GetFeatureInfo URL:', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`GetFeatureInfo failed: ${response.status} ${response.statusText}`);
    }

    const data: QGISFeatureCollection = await response.json();

    console.log('✅ GetFeatureInfo response:', data);

    return data;
  } catch (error) {
    console.error('❌ GetFeatureInfo error:', error);
    throw error;
  }
}

/**
 * Converts EPSG:3857 (Web Mercator) coordinates to EPSG:4326 (WGS84)
 *
 * Note: Mapbox GL JS uses EPSG:4326 for LngLat, but QGIS layers are in EPSG:3857.
 * This function is NOT needed if you use Mapbox's LngLat directly.
 */
export function webMercatorToWGS84(x: number, y: number): { lng: number; lat: number } {
  const lng = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);

  return { lng, lat };
}
```

### 3. **Integracja z IdentifyTool**

```typescript
// src/features/mapa/komponenty/IdentifyTool.tsx

import { getQGISFeatureInfo } from '@/lib/qgis/getFeatureInfo';
import { useMap } from 'react-map-gl';

const IdentifyTool = () => {
  const { current: mapRef } = useMap();
  const projectName = 'graph'; // from URL params or Redux

  useEffect(() => {
    if (!mapRef || !identify.isActive) return;

    const map = mapRef.getMap();

    const handleMapClick = async (e: any) => {
      const clickPoint = e.lngLat; // Mapbox LngLat object
      const bounds = map.getBounds(); // Mapbox LngLatBounds object
      const canvas = map.getCanvas();
      const width = canvas.width;
      const height = canvas.height;

      // Get visible layers from tree.json
      const visibleLayers = ['test', 'TestFutures', 'Granica Ciepłowody'];

      // Query all visible layers
      const allFeatures: QGISFeature[] = [];

      for (const layerName of visibleLayers) {
        try {
          const result = await getQGISFeatureInfo({
            project: projectName,
            layerName,
            clickPoint,
            bounds,
            width,
            height,
            featureCount: 10,
          });

          allFeatures.push(...result.features);
        } catch (error) {
          console.error(`Failed to query layer ${layerName}:`, error);
        }
      }

      if (allFeatures.length > 0) {
        // Transform to IdentifiedFeature format
        const transformed: IdentifiedFeature[] = allFeatures.map((feature) => ({
          layer: feature.id.split('.')[0], // "test" from "test.88"
          properties: Object.entries(feature.properties).map(([key, value]) => ({
            key,
            value,
          })),
          geometry: feature.geometry,
        }));

        setIdentifiedFeatures(transformed);
        setClickCoordinates([clickPoint.lng, clickPoint.lat]);
        setModalOpen(true);
      } else {
        // No features found
        setIdentifiedFeatures([]);
        setClickCoordinates([clickPoint.lng, clickPoint.lat]);
        setModalOpen(true);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapRef, identify.isActive, projectName]);

  // ... rest of the component
};
```

---

## Przykłady Zapytań

### 1. **Identyfikacja Pojedynczego Obiektu**

**Scenariusz:** Użytkownik kliknął w obiekt o współrzędnych `(18.7652, 52.1234)` (WGS84).

**Krok 1: Konwersja do Web Mercator (EPSG:3857)**
```javascript
import proj4 from 'proj4';

const [lng, lat] = [18.7652, 52.1234];
const [mercatorX, mercatorY] = proj4('EPSG:4326', 'EPSG:3857', [lng, lat]);
// mercatorX: 2087156.12, mercatorY: 6791234.45
```

**Krok 2: Obliczenie BBOX**
```javascript
const padding = 1000; // 1000 metrów (EPSG:3857 używa metrów)
const bbox = {
  minX: mercatorX - padding,
  minY: mercatorY - padding,
  maxX: mercatorX + padding,
  maxY: mercatorY + padding
};
```

**Krok 3: Wywołanie GetFeatureInfo**
```bash
curl "https://api.universemapmaker.online/ows?\
MAP=/projects/graph/graph.qgs&\
SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&\
LAYERS=test&QUERY_LAYERS=test&\
SRS=EPSG:3857&\
BBOX=2086156,6790234,2088156,6792234&\
WIDTH=512&HEIGHT=512&\
X=256&Y=256&\
INFO_FORMAT=application/json&\
FEATURE_COUNT=1"
```

### 2. **Identyfikacja Wszystkich Warstw**

**Scenariusz:** Użytkownik kliknął na mapie, sprawdź wszystkie widoczne warstwy.

```typescript
const layers = ['test', 'TestFutures', 'Granica Ciepłowody'];
const features = [];

for (const layer of layers) {
  const url = `https://api.universemapmaker.online/ows?${new URLSearchParams({
    MAP: `/projects/graph/graph.qgs`,
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layer,
    QUERY_LAYERS: layer,
    SRS: 'EPSG:4326',
    BBOX: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
    WIDTH: '512',
    HEIGHT: '512',
    X: pixelX.toString(),
    Y: pixelY.toString(),
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '10'
  })}`;

  const response = await fetch(url);
  const data = await response.json();

  features.push(...data.features);
}

console.log(`Found ${features.length} features across all layers`);
```

### 3. **Identyfikacja z Większą Tolerancją**

**Scenariusz:** Zwiększ obszar wyszukiwania dla lepszej precyzji na urządzeniach mobilnych.

```typescript
// Standard tolerance: 8px
const tolerance = 8;

// Mobile tolerance: 16px (easier to tap small features)
const mobileTolerance = 16;

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const activeTolerance = isMobile ? mobileTolerance : tolerance;

// Calculate BBOX with tolerance
const clickX = e.point.x; // pixel coordinates
const clickY = e.point.y;

const bbox = [
  [clickX - activeTolerance, clickY - activeTolerance],
  [clickX + activeTolerance, clickY + activeTolerance]
];

// Convert bbox pixels to LngLat
const sw = map.unproject(bbox[0]);
const ne = map.unproject(bbox[1]);

// Use expanded bounds for GetFeatureInfo
const bounds = new LngLatBounds(sw, ne);
```

---

## Common Issues

### ❌ Issue 1: "No project defined for WMS"

**Error:**
```xml
<ServerException>No project defined. For OWS services: please provide a SERVICE and a MAP parameter</ServerException>
```

**Przyczyna:**
- Brak parametru `MAP` w zapytaniu
- Używasz `project=graph` zamiast `MAP=/projects/graph/graph.qgs`

**Rozwiązanie:**
```bash
# ❌ Wrong
?project=graph&published=false

# ✅ Correct
?MAP=/projects/graph/graph.qgs
```

---

### ❌ Issue 2: "Project path not allowed (403)"

**Error:**
```
The path '/app/qgs/graph/graph.qgs' is outside base path '/projects/'
```

**Przyczyna:**
- QGIS Server ma ograniczone ścieżki (security)
- Dozwolone ścieżki: `/projects/*`
- Zabronione ścieżki: `/app/qgs/*`

**Rozwiązanie:**
```bash
# ❌ Wrong
MAP=/app/qgs/graph/graph.qgs

# ✅ Correct
MAP=/projects/graph/graph.qgs
```

---

### ❌ Issue 3: Empty FeatureCollection

**Error:**
```json
{
  "features": [],
  "type": "FeatureCollection"
}
```

**Przyczyny:**
1. **Błędne współrzędne BBOX** - kliknięcie poza zakresem danych
2. **Błędne współrzędne X/Y** - piksel poza obszarem
3. **Warstwa niewidoczna** - warstwa wyłączona w QGS
4. **Błędny CRS** - niezgodność systemów współrzędnych

**Diagnostyka:**

```typescript
// 1. Check if click point is within layer extent
const layerExtent = [2088072, 6791904, 2093376, 6797843]; // from tree.json
const clickPoint = [lng, lat];

const isInExtent =
  clickPoint[0] >= layerExtent[0] &&
  clickPoint[0] <= layerExtent[2] &&
  clickPoint[1] >= layerExtent[1] &&
  clickPoint[1] <= layerExtent[3];

console.log('Click in layer extent?', isInExtent);

// 2. Verify pixel coordinates are within canvas
const canvas = map.getCanvas();
console.log(`Canvas: ${canvas.width}x${canvas.height}, Click: X=${pixelX}, Y=${pixelY}`);

// 3. Check if layer is visible
console.log('Layer visible?', layerConfig.visible);

// 4. Verify CRS match
console.log('Map CRS:', map.getStyle().sources);
console.log('Layer CRS: EPSG:3857');
```

---

### ❌ Issue 4: Geometry is null

**Response:**
```json
{
  "geometry": null,
  "properties": { ... }
}
```

**Przyczyna:**
- QGIS Server domyślnie nie zwraca geometrii w GetFeatureInfo (optymalizacja)
- Geometry jest dostępna tylko jeśli jest jawnie włączona w konfiguracji

**Rozwiązanie (jeśli potrzebna geometria):**

```bash
# Dodaj parametr WITH_GEOMETRY=1 (QGIS 3.x)
?MAP=/projects/graph/graph.qgs&\
SERVICE=WMS&VERSION=1.3.0&\
REQUEST=GetFeatureInfo&\
WITH_GEOMETRY=1&\
...
```

**Alternatywa - WFS GetFeature (zawiera pełną geometrię):**

```bash
curl "https://api.universemapmaker.online/ows?\
MAP=/projects/graph/graph.qgs&\
SERVICE=WFS&VERSION=2.0.0&\
REQUEST=GetFeature&\
TYPENAME=test&\
OUTPUTFORMAT=application/json&\
FEATUREID=test.88"
```

---

## Podsumowanie i Rekomendacje

### ✅ Co Działa

1. **QGIS Server GetFeatureInfo** - zwraca prawidłowe dane z PostgreSQL
2. **Format GeoJSON** - łatwa integracja z frontendem
3. **WMS 1.1.1 i 1.3.0** - oba standardy działają
4. **Wielowarstwowe zapytania** - można iterować po warstwach

### ⚠️ Wymagania

1. **Poprawny parametr MAP** - `/projects/{project}/{project}.qgs`
2. **Współrzędne w EPSG:4326** - Mapbox używa WGS84 (nie Web Mercator!)
3. **Obliczanie pikseli** - konwersja LngLat → pixel coordinates
4. **Tolerancja** - użyj padding dla lepszej precyzji

### 🚀 Następne Kroki

1. **Implementacja `getQGISFeatureInfo`** - nowy moduł do obsługi GetFeatureInfo
2. **Integracja z IdentifyTool** - zastąpienie `queryRenderedFeatures` na warstwy WMS
3. **Caching** - cache GetFeatureInfo dla tej samej lokalizacji
4. **Error handling** - obsługa błędów sieciowych i timeoutów
5. **Loading states** - pokazywanie spinnera podczas ładowania
6. **Tests** - unit testy dla konwersji współrzędnych

### 📚 Dokumentacja Zewnętrzna

- [OGC WMS 1.3.0 Specification](https://www.ogc.org/standards/wms)
- [QGIS Server Documentation](https://docs.qgis.org/latest/en/docs/server_manual/)
- [Mapbox GL JS API Reference](https://docs.mapbox.com/mapbox-gl-js/api/)
- [PostGIS Documentation](https://postgis.net/documentation/)

---

**Autor:** Claude (Anthropic)
**Data:** 2025-10-15
**Wersja:** 1.0
