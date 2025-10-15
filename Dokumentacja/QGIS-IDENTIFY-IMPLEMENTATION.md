# QGIS Identify Tool - Implementation Guide

## 🎉 Implementacja Zakończona!

**Data:** 2025-10-15
**Status:** ✅ Ready to Test

---

## 📦 Co Zostało Zaimplementowane

### 1. **Moduł GetFeatureInfo** (`src/lib/qgis/getFeatureInfo.ts`)

Kompletny moduł do komunikacji z QGIS Server przez WMS GetFeatureInfo.

**Funkcje:**
- ✅ `getQGISFeatureInfo()` - zapytanie pojedynczej warstwy
- ✅ `getQGISFeatureInfoMultiLayer()` - zapytanie wielu warstw równolegle
- ✅ `lngLatToPixel()` - konwersja współrzędnych geograficznych na piksele
- ✅ `webMercatorToWGS84()` - konwersja EPSG:3857 → EPSG:4326
- ✅ `wgs84ToWebMercator()` - konwersja EPSG:4326 → EPSG:3857
- ✅ `isPointInExtent()` - sprawdzanie czy punkt jest w zakresie warstwy

**Cechy:**
- 🚀 Równoległe zapytania do wielu warstw
- 📝 Szczegółowe logi w konsoli
- ⚠️ Obsługa błędów
- 📐 Automatyczna konwersja współrzędnych
- 🎯 Wsparcie dla WMS 1.1.1 i 1.3.0

---

### 2. **Integracja z IdentifyTool** (`src/features/mapa/komponenty/IdentifyTool.tsx`)

IdentifyTool został rozszerzony o wsparcie dla warstw QGIS WMS/WFS.

**Workflow:**
1. **Kliknięcie na mapie** → Wykrycie 3D buildings (priorytet)
2. **Query Mapbox layers** → Warstwy Mapbox (vector, geojson)
3. **Query QGIS Server** → Warstwy WMS/WFS z PostgreSQL
4. **Połączenie wyników** → Pokazanie wszystkich obiektów w modalu

**Nowe funkcje:**
- ✅ Automatyczne wykrywanie widocznych warstw QGIS z drzewa warstw
- ✅ Równoległe zapytania do wszystkich widocznych warstw
- ✅ Loading state podczas ładowania danych z QGIS
- ✅ Graceful error handling (jeśli QGIS nie odpowiada, pokazuje tylko Mapbox features)
- ✅ Wsparcie dla projektów bez warstw QGIS (backward compatible)

---

### 3. **UI Updates** (`src/features/warstwy/modale/IdentifyModal.tsx`)

Modal został rozszerzony o obsługę loading state.

**Zmiany:**
- ✅ Nowy prop `isLoading` - pokazuje spinner podczas ładowania
- ✅ Komunikat "Wyszukiwanie w warstwach QGIS..." z CircularProgress
- ✅ Podsumowanie pokazuje "(ładowanie...)" podczas query

---

## 🧪 Jak Przetestować

### Test 1: Podstawowa Identyfikacja (Projekt `graph`)

1. **Uruchom aplikację:**
   ```bash
   npm run dev
   ```

2. **Otwórz projekt `graph`:**
   ```
   http://localhost:3000/map?project=graph
   ```

3. **Włącz Identify Tool:**
   - Kliknij ikonę "lupa" w prawym toolbar

4. **Kliknij na mapie w warstwie "test":**
   - Obszar: Uniejów (~18.7°E, 52.0°N)
   - Spodziewane dane:
     - `ogc_fid`: np. 88, 81, 3
     - `legenda`: np. "ZN/WS", "Z", "K"
     - `symbol`: np. "1_1.ZN/WS", "1_2.Z"
     - `przezn`: przeznaczenie terenu

5. **Sprawdź konsolę przeglądarki:**
   ```
   🔍 Identify: Click/Tap received
   🗺️ Identify: Querying QGIS Server layers { layerCount: 3, layers: ["test", "TestFutures", "Granica Ciepłowody"] }
   🔍 GetFeatureInfo request: { project: "graph", layer: "test", ... }
   ✅ QGIS Server response: { featureCount: 2, features: [...] }
   🔍 Identify: Combined results { mapboxFeatures: 0, qgisFeatures: 2, total: 2 }
   ```

---

### Test 2: Multiple Layers

1. **W projekcie `graph`:**
   - Włącz wszystkie warstwy w LeftPanel
   - Kliknij w miejscu gdzie nakładają się warstwy

2. **Spodziewany wynik:**
   - Modal pokazuje obiekty z WSZYSTKICH warstw
   - Każda warstwa ma osobną sekcję z nazwą

3. **Sprawdź sourceLayer:**
   - Obiekty z QGIS mają `sourceLayer: "QGIS WMS"`
   - Obiekty z Mapbox mają swoje oryginalne sourceLayer

---

### Test 3: Loading State

1. **Otwórz DevTools → Network Tab**
2. **Throttling: Slow 3G**
3. **Kliknij na mapie**

**Spodziewane zachowanie:**
- ✅ Modal otwiera się natychmiast
- ✅ Pokazuje "Wyszukiwanie w warstwach QGIS..." ze spinnerem
- ✅ Po załadowaniu danych spinner znika
- ✅ Pokazuje znalezione obiekty

---

### Test 4: Error Handling

1. **Symulacja błędu QGIS Server:**
   - Otwórz `getFeatureInfo.ts`
   - Zmień `QGIS_OWS_ENDPOINT` na niepoprawny URL
   - Lub wyłącz Docker container z QGIS Server

2. **Kliknij na mapie**

**Spodziewane zachowanie:**
- ✅ Modal otwiera się
- ✅ Konsola pokazuje: `❌ QGIS Server query failed:`
- ✅ Modal pokazuje tylko Mapbox features (jeśli są)
- ✅ Brak crashu aplikacji

---

### Test 5: Backward Compatibility (bez QGIS)

1. **Otwórz mapę bez parametru `project`:**
   ```
   http://localhost:3000/map
   ```

2. **Kliknij na mapie (tylko Mapbox basemap)**

**Spodziewane zachowanie:**
- ✅ Identify działa normalnie dla warstw Mapbox
- ✅ Nie próbuje query QGIS Server
- ✅ Brak błędów w konsoli

---

## 📊 Debugging Console Logs

### Pomyślne Zapytanie

```javascript
🔍 Identify: Click/Tap received
  isActive: true
  point: { x: 512, y: 384 }
  lngLat: { lng: 18.765234, lat: 52.123456 }

🗺️ Identify: Querying QGIS Server layers
  projectName: "graph"
  layerCount: 3
  layers: ["test", "TestFutures", "Granica Ciepłowody"]

🔍 GetFeatureInfo request:
  project: "graph"
  layer: "test"
  clickPoint: { lng: 18.765234, lat: 52.123456 }
  pixelCoords: { x: 241, y: 222 }
  url: "https://api.universemapmaker.online/ows?MAP=/projects/graph/graph.qgs&..."

✅ QGIS Server response:
  featureCount: 2
  features: [
    { id: "test.88", properties: ["ogc_fid", "legenda", "symbol", "przezn", "opis"] },
    { id: "test.81", properties: ["ogc_fid", "legenda", "symbol", "przezn", "opis"] }
  ]

🔍 Identify: Combined results
  mapboxFeatures: 0
  qgisFeatures: 2
  total: 2
```

### Błąd QGIS Server

```javascript
🔍 GetFeatureInfo request: { ... }

❌ GetFeatureInfo error: Error: GetFeatureInfo failed: 400 Bad Request
<ServerException>No project defined...</ServerException>

⚠️ Some layers failed to query: [
  { layer: "test", error: Error(...) }
]

❌ QGIS Server query failed: Error(...)

🔍 Identify: Combined results
  mapboxFeatures: 0
  qgisFeatures: 0
  total: 0
```

---

## 🐛 Known Issues & Workarounds

### Issue 1: Empty FeatureCollection

**Problem:** GetFeatureInfo zwraca `{ features: [] }`

**Możliwe przyczyny:**
1. Kliknięcie poza zakresem warstwy
2. Warstwa wyłączona w QGIS
3. Błędne współrzędne (CRS mismatch)

**Debugging:**
```javascript
// Sprawdź extent warstwy w tree.json
const layerExtent = [2088072, 6791904, 2093376, 6797843];

// Sprawdź czy kliknięcie jest w zakresie
const clickMercator = wgs84ToWebMercator(e.lngLat.lng, e.lngLat.lat);
console.log('Click in extent?',
  clickMercator.x >= layerExtent[0] &&
  clickMercator.x <= layerExtent[2] &&
  clickMercator.y >= layerExtent[1] &&
  clickMercator.y <= layerExtent[3]
);
```

---

### Issue 2: Geometry is null

**Problem:** Features mają `geometry: null`

**Wyjaśnienie:** To normalne zachowanie QGIS Server dla GetFeatureInfo (optymalizacja).

**Rozwiązanie (jeśli potrzebna geometria):**
```typescript
const result = await getQGISFeatureInfo({
  // ...
  withGeometry: true  // ✅ Włącz geometrię (QGIS 3.x)
});
```

---

### Issue 3: Slow Query (>2s)

**Problem:** GetFeatureInfo trwa długo

**Możliwe przyczyny:**
1. Duża liczba warstw (10+)
2. Złożone geometrie
3. Wolna sieć/baza danych

**Optymalizacja:**
```typescript
// Ogranicz liczbę warstw do najważniejszych
const qgisLayers = getVisibleQGISLayers().slice(0, 5); // Top 5 layers

// Zmniejsz FEATURE_COUNT
const result = await getQGISFeatureInfo({
  // ...
  featureCount: 5  // Zamiast 10
});
```

---

## 📈 Performance Tips

### 1. **Cache GetFeatureInfo Requests**

```typescript
const cache = new Map<string, QGISFeatureCollection>();

const cacheKey = `${project}-${layerName}-${lng.toFixed(4)}-${lat.toFixed(4)}`;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey)!;
}

const result = await getQGISFeatureInfo(params);
cache.set(cacheKey, result);
```

### 2. **Debounce Clicks**

```typescript
let clickTimeout: NodeJS.Timeout | null = null;

const handleMapClick = (e) => {
  if (clickTimeout) clearTimeout(clickTimeout);

  clickTimeout = setTimeout(() => {
    // Execute identify after 200ms
    performIdentify(e);
  }, 200);
};
```

### 3. **Limit Layer Count**

```typescript
// Query only top 3 most important layers
const priorityLayers = ['test', 'boundaries', 'poi'];
const qgisLayers = getVisibleQGISLayers()
  .filter(name => priorityLayers.includes(name))
  .slice(0, 3);
```

---

## 🚀 Next Steps

### Recommended Improvements

1. **Unit Tests** (src/lib/qgis/getFeatureInfo.test.ts)
   ```bash
   npm install --save-dev @testing-library/react jest
   ```

2. **E2E Tests** (Playwright/Cypress)
   - Test click → modal open → features displayed
   - Test loading state
   - Test error scenarios

3. **Performance Monitoring**
   ```typescript
   const startTime = performance.now();
   const result = await getQGISFeatureInfo(params);
   const duration = performance.now() - startTime;
   console.log(`GetFeatureInfo took ${duration}ms`);
   ```

4. **Analytics**
   ```typescript
   // Track identify usage
   analytics.track('Identify Feature', {
     project: projectName,
     layerCount: qgisLayers.length,
     featureCount: result.features.length,
     duration: duration
   });
   ```

---

## 📚 Related Documentation

- **Complete Analysis:** [QGIS-IDENTIFY-TOOL-ANALIZA.md](./QGIS-IDENTIFY-TOOL-ANALIZA.md)
- **Backend API:** [BACKEND-API-REFERENCE.md](./BACKEND-API-REFERENCE.md)
- **Architecture:** [../CLAUDE.md](../CLAUDE.md)

---

## ✅ Testing Checklist

- [ ] Test basic identify on project `graph` layer `test`
- [ ] Test multiple layers (3+)
- [ ] Test loading state (slow network)
- [ ] Test error handling (QGIS offline)
- [ ] Test backward compatibility (no QGIS layers)
- [ ] Test on mobile device (touch events)
- [ ] Test with 3D buildings (priority handling)
- [ ] Verify console logs are clean
- [ ] Verify no memory leaks (long session)
- [ ] Test with different projects

---

**Wszystko gotowe do testowania! 🎉**

Jeśli masz pytania lub znajdziesz bugi, sprawdź logi w konsoli i dokumentację w `QGIS-IDENTIFY-TOOL-ANALIZA.md`.
