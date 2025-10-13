# Dokumentacja: Hybrydowe renderowanie WMS/WFS

## Przegląd

System automatycznie wybiera optymalne renderowanie dla każdej warstwy:
- **WMS (raster tiles)** - dla warstw ze złożonymi stylami QGIS
- **WFS (GeoJSON)** - dla prostych warstw wymagających interakcji

## Komponenty

### 1. WMSLayerRenderer (`src/components/qgis/WMSLayerRenderer.tsx`)

Renderuje warstwy jako rastrowe kafelki WMS z QGIS Server.

**Zalety:**
- ✅ Zachowuje oryginalne style QGIS (kolory, symbole, etykiety)
- ✅ Obsługuje wszystkie typy rendererów (Single Symbol, Categorized, Graduated, Rule-based)
- ✅ Szybkie dla dużych zbiorów danych (renderowanie serwerowe)
- ✅ Niskie obciążenie klienta

**Wady:**
- ⚠️ Brak interakcji (nie można klikać w features)
- ⚠️ Rastrowe kafelki (pixelation przy dużym zoom)
- ⚠️ Nie można edytować stylu na kliencie

**Przykład użycia:**
```typescript
<WMSLayerRenderer
  projectName="MyProject_1"
  layer={layer}
/>
```

### 2. QGISLayerRenderer (`src/components/qgis/QGISLayerRenderer.tsx`)

Renderuje warstwy jako wektory GeoJSON przez WFS.

**Zalety:**
- ✅ Interaktywne (click, hover, identify)
- ✅ Smooth zoom (skalowanie wektorowe)
- ✅ Możliwość edycji stylu w czasie rzeczywistym

**Wady:**
- ⚠️ Utrata oryginalnych stylów QGIS
- ⚠️ Wolne dla dużych zbiorów (>10,000 features)
- ⚠️ Limit features (domyślnie 1000)

**Przykład użycia:**
```typescript
<QGISLayerRenderer
  projectName="MyProject_1"
  layer={layer}
/>
```

### 3. shouldUseWMS() (`src/components/qgis/layerRenderingUtils.ts`)

Funkcja decyzyjna - określa czy warstwa powinna używać WMS czy WFS.

**Kryteria decyzji:**

1. **RasterLayer** → WMS (ortofotomapy, mapy wysokościowe)
2. **Polygon/MultiPolygon** → WMS (często mają kategoryzację)
3. **Słowa kluczowe w nazwie:**
   - `mpzp`, `plan` → WMS (plany zagospodarowania)
   - `obszar`, `rewitalizacj` → WMS (obszary stylizowane)
   - `działk` → WMS (działki z kategoryzacją)
   - `przeznaczenie`, `kategori`, `klasyfikacj` → WMS
   - `budynek`, `building` → WMS
4. **Point/LineString** → WFS (proste geometrie, interakcja)
5. **Domyślnie** → WFS (bezpieczniejsze)

**Przykład:**
```typescript
import { shouldUseWMS } from '@/src/components/qgis/layerRenderingUtils';

const useWMS = shouldUseWMS(layer);

if (useWMS) {
  // Użyj WMSLayerRenderer
} else {
  // Użyj QGISLayerRenderer
}
```

## Integracja w app/map/page.tsx

```typescript
import { WMSLayerRenderer } from '@/src/components/qgis/WMSLayerRenderer';
import { QGISLayerRenderer } from '@/src/components/qgis/QGISLayerRenderer';
import { shouldUseWMS } from '@/src/components/qgis/layerRenderingUtils';

// Renderowanie hybrydowe
{projectName && layers && collectAllLayers(layers).map((layer) => {
  const useWMS = shouldUseWMS(layer);
  return useWMS ? (
    <WMSLayerRenderer
      key={layer.id}
      projectName={projectName}
      layer={layer}
    />
  ) : (
    <QGISLayerRenderer
      key={layer.id}
      projectName={projectName}
      layer={layer}
    />
  );
})}
```

## Testowanie

### Test 1: Sprawdzenie konsoli przeglądarki

Po otwarciu projektu, konsola powinna pokazać:

```
📍 [WMS] MPZP Strefa A: Keyword match
📍 [WMS] Działki ewidencyjne: Polygon geometry
📍 [WFS] Punkty adresowe: Point geometry
📍 [WFS] Drogi: Line geometry

🗺️ Adding WMS layer: MPZP Strefa A
✅ WMS layer added: qgis-wms-layer-MyProject_1-layer_uuid

📡 Fetching WFS features: Punkty adresowe
✅ WFS features loaded: Punkty adresowe (245 features)
```

### Test 2: Wizualna inspekcja stylów

**Warstwy WMS (z oryginalnym stylem QGIS):**
- Kolory zgodne z QGIS
- Etykiety widoczne
- Kategoryzacja zachowana
- Symbole złożone (wzory, linie przerywane)

**Warstwy WFS (domyślny styl Mapbox):**
- Kolor: niebieski (#088)
- Brak etykiet
- Jednolity styl

### Test 3: Interakcja

**Warstwy WMS:**
- ❌ Kliknięcie: brak reakcji
- ❌ Hover: brak podświetlenia

**Warstwy WFS:**
- ✅ Kliknięcie: otwiera modal Identify
- ✅ Hover: podświetlenie features

### Test 4: Performance przy zoom

**Warstwy WMS:**
- Przy dużym zoom: pixelation (widoczne kwadratowe kafelki)
- Ładowanie nowych kafelków przy przesuwaniu

**Warstwy WFS:**
- Smooth zoom (wektory)
- Features zawsze ostre

## Przykłady użycia

### Przykład 1: Projekt urbanistyczny (mixed rendering)

```
Projekt: "Plan miasta"
├── MPZP Strefa A (Polygon) → WMS (zachowuje kategoryzację użytkowania)
├── MPZP Strefa B (Polygon) → WMS (zachowuje kolory stref)
├── Działki (Polygon) → WMS (zachowuje numery działek jako etykiety)
├── Budynki (Polygon) → WMS (zachowuje symbole budynków)
├── Drogi (LineString) → WFS (interaktywne, proste linie)
└── Punkty adresowe (Point) → WFS (interaktywne, można klikać)
```

### Przykład 2: Projekt z ortofotomapą

```
Projekt: "Analiza terenu"
├── Ortofotomapa 2024 (Raster) → WMS (jedyny sposób dla rasterów)
├── Granice działek (Polygon) → WMS (kategoryzacja właścicieli)
└── Punkty pomiarowe (Point) → WFS (interaktywne, edycja)
```

### Przykład 3: Projekt z wieloma kategoriami

```
Projekt: "Rewitalizacja"
├── Obszar rewitalizacji (Polygon) → WMS (graduated symbol - kolor według priorytetu)
├── Wnioski mieszkańców (Polygon) → WMS (categorized - kolor według statusu)
├── Działki KOWR (Polygon) → WMS (rule-based - różne style dla różnych właścicieli)
└── Pomiary terenowe (Point) → WFS (proste punkty, interakcja)
```

## Rozwiązywanie problemów

### Problem: Wszystkie warstwy są niebieskie (#088)

**Przyczyna:** Warstwy renderowane jako WFS bez oryginalnych stylów QGIS.

**Rozwiązanie:**
1. Sprawdź czy `shouldUseWMS(layer)` zwraca `true` dla warstw ze stylami
2. Dodaj słowa kluczowe do `wmsKeywords` w `layerRenderingUtils.ts`
3. Manualnie ustaw `useWMS = true` dla konkretnych warstw

### Problem: Brak interakcji z warstwami

**Przyczyna:** Warstwy renderowane jako WMS (raster).

**Rozwiązanie:**
1. Sprawdź czy warstwa rzeczywiście wymaga WMS (czy ma skomplikowane style?)
2. Jeśli nie: zmień `shouldUseWMS()` aby zwracała `false`
3. Użyj WFS dla interaktywności

### Problem: Pixelation przy dużym zoom (WMS)

**Przyczyna:** Rastrowe kafelki WMS.

**Rozwiązanie:**
1. To normalne dla WMS - kafelki są obrazkami PNG
2. QGIS Server renderuje w rozdzielczości 256x256px
3. Jeśli pixelation jest problemem: użyj WFS

### Problem: Wolne ładowanie dużych zbiorów (WFS)

**Przyczyna:** Pobieranie wszystkich features jako GeoJSON.

**Rozwiązanie:**
1. Przełącz na WMS: `shouldUseWMS(layer) = true`
2. Lub zwiększ `maxFeatures` w WFS (domyślnie 1000)
3. Lub dodaj paginację WFS

## API QGIS Server

### WMS GetMap (dla WMSLayerRenderer)

```
https://api.universemapmaker.online/ows?
  SERVICE=WMS
  &VERSION=1.3.0
  &REQUEST=GetMap
  &LAYERS=layer_uuid
  &WIDTH=256
  &HEIGHT=256
  &CRS=EPSG:3857
  &BBOX={bbox-epsg-3857}
  &FORMAT=image/png
  &TRANSPARENT=true
  &MAP=ProjectName_1
```

### WFS GetFeature (dla QGISLayerRenderer)

```
https://api.universemapmaker.online/ows?
  SERVICE=WFS
  &VERSION=2.0.0
  &REQUEST=GetFeature
  &TYPENAME=layer_uuid
  &OUTPUTFORMAT=application/json
  &SRSNAME=EPSG:4326
  &MAP=ProjectName_1
```

## Następne kroki (FAZA 2 i 3)

### FAZA 2: Rozszerzenie tree.json o style

**Backend (Django):**
```python
# geocraft_api/projects/service.py
def serialize_layer_style(layer):
    renderer = layer.renderer()
    if renderer.type() == 'singleSymbol':
        symbol = renderer.symbol()
        return {
            "renderer": "Single Symbol",
            "fill_color": symbol.color().getRgb(),
            "stroke_color": symbol.symbolLayer(0).strokeColor().getRgb(),
            "stroke_width": symbol.symbolLayer(0).strokeWidth()
        }
    return None

# W make_json_tree_and_save():
layer_dict["style"] = serialize_layer_style(layer)
```

**Frontend (TypeScript):**
```typescript
// src/types/qgis.ts
export interface QGISVectorLayer {
  // ... existing fields ...
  style?: {
    renderer: string;
    fill_color: [number, number, number, number];
    stroke_color: [number, number, number, number];
    stroke_width: number;
  };
}
```

### FAZA 3: UI do edycji stylów

**Komponenty:**
1. `LayerStylePanel.tsx` - Panel stylowania w LeftPanel
2. `ColorPicker.tsx` - Wybór koloru
3. `StrokeWidthSlider.tsx` - Suwak grubości linii
4. `RendererSelector.tsx` - Wybór typu renderera

**API Integration:**
```typescript
// src/redux/api/stylesApi.ts
export const stylesApi = createApi({
  endpoints: (builder) => ({
    getLayerStyle: builder.query({
      query: ({ project, layer_id }) => ({
        url: '/api/styles/renderer',
        params: { project, layer_id }
      })
    }),
    setLayerStyle: builder.mutation({
      query: ({ project, id, style_configuration }) => ({
        url: '/api/styles/set',
        method: 'POST',
        body: { project, id, style_configuration }
      })
    })
  })
});
```

## Podsumowanie

**FAZA 1 (current): Hybrydowe renderowanie ✅**
- WMSLayerRenderer: zachowuje style QGIS (raster)
- QGISLayerRenderer: interaktywność (vector)
- shouldUseWMS(): automatyczny wybór

**FAZA 2 (planned): Style w tree.json**
- Backend: serialize QGIS styles
- Frontend: konwersja QGIS → Mapbox
- WFS warstwy z poprawnymi kolorami

**FAZA 3 (planned): UI edycji stylów**
- Panel stylowania w LeftPanel
- Integracja z `/api/styles/*`
- Color picker, stroke width, renderer type

**Rezultat końcowy:**
- ✅ Zachowane style QGIS (WMS lub tree.json)
- ✅ Interaktywność (WFS z prawidłowymi stylami)
- ✅ Możliwość edycji stylów w UI
- ✅ Optymalna wydajność (WMS dla dużych, WFS dla małych)
