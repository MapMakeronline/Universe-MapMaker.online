# Map Renderer Abstraction Layer - Complete Guide

## 🎯 Cel

**Problem:** Aplikacja jest mocno zależna od Mapbox GL JS. Zmiana silnika mapowego wymaga przepisywania dużej części kodu.

**Rozwiązanie:** Warstwa abstrakcji która oddziela logikę aplikacji od silnika renderowania. Łatwa zmiana między:
- **Mapbox GL JS** / MapLibre GL - Zaawansowane 3D, vector tiles
- **Leaflet.js** - Lekki, prosty, darmowy
- **Blank Canvas** - Własny renderer, brak mapy podkładowej, pełna kontrola
- **deck.gl** (przyszłość) - WebGL, zaawansowana wizualizacja 3D

---

## 📐 Architektura

### Przed (Mapbox-dependent):

```
┌──────────────┐
│  LeftPanel   │ → dispatch(toggleVisibility)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redux State  │ layers[id].visible = !layers[id].visible
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ LayerVisibilitySync │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ updateQGISLayerVisibility()      │ ← MAPBOX-SPECIFIC!
│ map.setLayoutProperty(layerId)   │
└──────────────────────────────────┘
```

**Problem:** Zmiana z Mapbox na Leaflet → przepisz `updateQGISLayerVisibility()`, `addWMSLayer()`, wszystkie event handlery, itp.

---

### Po (Renderer-agnostic):

```
┌──────────────┐
│  LeftPanel   │ → dispatch(toggleVisibility)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redux State  │ layers[id].visible = !layers[id].visible
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ useMapRendererSync  │ ← React Hook
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ MapRenderer Interface            │ ← GENERIC!
│ renderer.setLayerVisibility()    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────┴───────┬────────────┬──────────────┐
│              │            │              │
▼              ▼            ▼              ▼
MapboxRenderer LeafletRenderer CanvasRenderer DeckGLRenderer
```

**Korzyść:** Zmiana z Mapbox na Leaflet → **zmień 1 linię kodu**:
```tsx
// Before:
<MapComponent renderer="mapbox" />

// After:
<MapComponent renderer="leaflet" />
```

---

## 🚀 Szybki Start

### 1. Przykład z Mapbox (jak teraz):

```tsx
'use client';

import { useMapRenderer, useMapRendererSync } from '@/lib/map-renderer';
import { useAppSelector } from '@/redux/hooks';

function MapWithMapbox() {
  const { renderer, isReady, containerRef } = useMapRenderer({
    type: 'mapbox',
    container: 'map-container',
    center: { lng: 19.0, lat: 52.0 },
    zoom: 6,
  });

  const layers = useAppSelector((state) => state.layers.layers);
  const projectName = useAppSelector((state) => state.projects.currentProject?.project_name);

  // Auto-sync Redux state with map layers
  useMapRendererSync(renderer, layers, projectName || '');

  if (!isReady) return <div>Loading map...</div>;

  return (
    <div
      id="map-container"
      ref={containerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```

### 2. Przykład z Leaflet (alternatywny silnik):

```tsx
// Identyczny kod, tylko zmień `type`:
function MapWithLeaflet() {
  const { renderer, isReady, containerRef } = useMapRenderer({
    type: 'leaflet', // ← JEDYNA ZMIANA!
    container: 'map-container',
    center: { lng: 19.0, lat: 52.0 },
    zoom: 6,
    basemapStyle: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  });

  // Reszta identyczna jak powyżej...
}
```

### 3. Przykład bez mapy podkładowej (Blank Canvas):

```tsx
function MapWithoutBasemap() {
  const { renderer, isReady, containerRef } = useMapRenderer({
    type: 'canvas', // ← Pure Canvas, no basemap
    container: 'map-container',
    center: { lng: 19.0, lat: 52.0 },
    zoom: 6,
  });

  // Tylko Twoje dane GeoJSON, bez tła mapy!
}
```

---

## 🔧 Konfiguracja

### Auto-detect (zalecane):

```tsx
const { renderer } = useMapRenderer({
  type: 'auto', // Automatycznie wybiera najlepszy dostępny silnik
  container: 'map',
  center: { lng: 19, lat: 52 },
  zoom: 6,
});

// Kolejność auto-detect:
// 1. Mapbox (jeśli NEXT_PUBLIC_MAPBOX_TOKEN dostępny)
// 2. Leaflet (jeśli basemapStyle podany)
// 3. BlankCanvas (fallback, zawsze dostępny)
```

### Środowiska (.env.local):

```env
# Renderer type (mapbox | leaflet | canvas | auto)
NEXT_PUBLIC_MAP_RENDERER=auto

# Mapbox token (wymagany dla Mapbox)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ

# Leaflet basemap (wymagany dla Leaflet)
NEXT_PUBLIC_LEAFLET_BASEMAP=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 📚 API Reference

### MapRenderer Interface

Wszystkie adaptery implementują ten sam interfejs:

```typescript
interface MapRenderer {
  // Lifecycle
  initialize(container: HTMLElement, options: { center, zoom, style }): Promise<void>;
  destroy(): void;
  isReady(): boolean;

  // Viewport
  getViewState(): ViewState;
  setViewState(state: Partial<ViewState>): void;
  flyTo(state: Partial<ViewState>, options?: { duration }): Promise<void>;
  fitBounds(bbox: BBox, options?: { padding }): Promise<void>;

  // Layers
  addLayer(config: WMSLayerConfig | GeoJSONLayerConfig): string;
  removeLayer(layerId: string): void;
  hasLayer(layerId: string): boolean;
  getLayers(): string[];

  // Layer Properties
  setLayerVisibility(layerId: string, visible: boolean): void;
  getLayerVisibility(layerId: string): boolean;
  setLayerOpacity(layerId: string, opacity: number): void;
  getLayerOpacity(layerId: string): number;
  moveLayer(layerId: string, beforeId?: string): void;

  // Interaction
  queryRenderedFeatures(point: [x, y], options?: { layers, radius }): Feature[];
  queryRenderedFeaturesInBBox(bbox: [x1, y1, x2, y2], options?: { layers }): Feature[];

  // Coordinates
  project(lngLat: LngLat): [x, y];
  unproject(point: [x, y]): LngLat;

  // Events
  on(event: string, handler: (e: any) => void): void;
  off(event: string, handler: (e: any) => void): void;
  once(event: string, handler: (e: any) => void): void;

  // Advanced
  setTerrain?(enabled: boolean): void;
  getNativeInstance(): any; // Escape hatch for engine-specific features
  getRendererType(): 'mapbox' | 'leaflet' | 'canvas' | 'deckgl';
}
```

---

## 🎨 Przykłady Użycia

### Dodawanie Warstw WMS (QGIS Server):

```tsx
function MapWithWMSLayer() {
  const { renderer, isReady } = useMapRenderer({
    type: 'auto',
    container: 'map',
    center: { lng: 19, lat: 52 },
    zoom: 6,
  });

  useEffect(() => {
    if (!renderer || !isReady) return;

    // Dodaj warstwę WMS z QGIS Server
    renderer.addLayer({
      id: 'buildings-layer',
      name: 'Buildings',
      type: 'raster',
      url: 'https://api.universemapmaker.online/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=buildings&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&FORMAT=image/png&TRANSPARENT=true&MAP=/projects/MyProject/MyProject.qgs',
      layers: ['buildings'],
      visible: true,
      opacity: 1,
      transparent: true,
    });
  }, [renderer, isReady]);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
```

### Dodawanie GeoJSON:

```tsx
function MapWithGeoJSON() {
  const { renderer, isReady } = useMapRenderer({ type: 'auto', container: 'map', center: { lng: 19, lat: 52 }, zoom: 6 });

  useEffect(() => {
    if (!renderer || !isReady) return;

    // Dodaj warstwę GeoJSON
    renderer.addLayer({
      id: 'poi-layer',
      name: 'Points of Interest',
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [19.0, 52.0] },
            properties: { name: 'Warsaw' },
          },
        ],
      },
      visible: true,
      opacity: 1,
      style: {
        fillColor: '#f75e4c',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        circleRadius: 8,
      },
    });
  }, [renderer, isReady]);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
```

### Toggle Visibility (Redux Integration):

```tsx
function MapWithReduxSync() {
  const { renderer, isReady } = useMapRenderer({ type: 'auto', container: 'map', center: { lng: 19, lat: 52 }, zoom: 6 });
  const dispatch = useAppDispatch();
  const layers = useAppSelector((state) => state.layers.layers);

  // Auto-sync Redux → Mapbox
  useMapRendererSync(renderer, layers, 'MyProject');

  const handleToggleLayer = (layerId: string) => {
    // Update Redux (useMapRendererSync automatically updates map)
    dispatch(toggleLayerVisibility(layerId));
  };

  return (
    <>
      <div id="map" style={{ width: '100%', height: '100vh' }} />
      <button onClick={() => handleToggleLayer('buildings-layer')}>
        Toggle Buildings
      </button>
    </>
  );
}
```

### Viewport Controls:

```tsx
function MapWithControls() {
  const { renderer, isReady } = useMapRenderer({ type: 'auto', container: 'map', center: { lng: 19, lat: 52 }, zoom: 6 });
  const { flyTo, fitBounds } = useMapRendererControls(renderer);

  return (
    <>
      <div id="map" style={{ width: '100%', height: '100vh' }} />
      <button onClick={() => flyTo({ center: { lng: 21, lat: 52 }, zoom: 10 })}>
        Fly to Warsaw
      </button>
      <button onClick={() => fitBounds([18.5, 51.5, 19.5, 52.5], { padding: 50 })}>
        Fit Poland Bounds
      </button>
    </>
  );
}
```

### Blank Canvas (No Basemap):

```tsx
function DataOnlyMap() {
  const { renderer, isReady } = useMapRenderer({
    type: 'canvas', // No basemap!
    container: 'map',
    center: { lng: 19, lat: 52 },
    zoom: 6,
  });

  useEffect(() => {
    if (!renderer || !isReady) return;

    // Add background color (optional)
    renderer.addLayer({
      id: 'background',
      name: 'Background',
      type: 'background',
      color: '#f5f5f5', // Light gray
      visible: true,
      opacity: 1,
    });

    // Add your data
    renderer.addLayer({
      id: 'data-layer',
      name: 'My Data',
      type: 'geojson',
      data: myGeoJSON,
      visible: true,
      opacity: 1,
    });
  }, [renderer, isReady]);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
```

---

## 🔄 Migracja z Obecnego Kodu

### Krok 1: Zastąp `MapContainer` nowym hookiem

**Przed:**
```tsx
import MapContainer from '@/features/mapa/komponenty/MapContainer';

<MapContainer projectName={projectName}>
  <QGISProjectLayersLoader ... />
  <LayerVisibilitySync ... />
</MapContainer>
```

**Po:**
```tsx
import { useMapRenderer, useMapRendererSync } from '@/lib/map-renderer';

function MapPage() {
  const { renderer, isReady } = useMapRenderer({
    type: 'mapbox', // lub 'auto'
    container: 'map',
    center: { lng: 19, lat: 52 },
    zoom: 6,
  });

  const layers = useAppSelector((state) => state.layers.layers);
  useMapRendererSync(renderer, layers, projectName);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
```

### Krok 2: Usuń stare komponenty

- ❌ `QGISProjectLayersLoader` → ✅ `renderer.addLayer()`
- ❌ `LayerVisibilitySync` → ✅ `useMapRendererSync()`
- ❌ `updateQGISLayerVisibility()` → ✅ `renderer.setLayerVisibility()`

### Krok 3: Test z różnymi silnikami

```tsx
// Test 1: Mapbox (current)
<MapComponent renderer="mapbox" />

// Test 2: Leaflet (alternative)
<MapComponent renderer="leaflet" />

// Test 3: Blank Canvas (no basemap)
<MapComponent renderer="canvas" />
```

---

## ✅ Korzyści

| Aspekt | Przed | Po |
|--------|-------|-----|
| **Zmiana silnika** | Przepisz 50+ plików | Zmień 1 linię kodu |
| **Bundle size** | 500KB (Mapbox zawsze) | 50KB (Canvas) / 500KB (Mapbox) |
| **Testowanie** | Trudne (mocka Mapbox) | Łatwe (mock interface) |
| **Dependency** | Mapbox GL JS required | Optional (wybór silnika) |
| **Kod** | Mapbox API wszędzie | Generic API (clean) |
| **Flexibility** | Mapbox-only | Mapbox/Leaflet/Canvas/deck.gl |

---

## 🎓 Najlepsze Praktyki

### 1. Używaj `'auto'` dla Production:

```tsx
const { renderer } = useMapRenderer({
  type: 'auto', // Automatycznie dobierze najlepszy
  // ...
});
```

### 2. Zawsze sprawdzaj `isReady`:

```tsx
const { renderer, isReady } = useMapRenderer({ ... });

useEffect(() => {
  if (!renderer || !isReady) return; // ← WAŻNE!

  renderer.addLayer({ ... });
}, [renderer, isReady]);
```

### 3. Cleanup w useEffect:

```tsx
useEffect(() => {
  if (!renderer || !isReady) return;

  const layerId = renderer.addLayer({ ... });

  return () => {
    renderer.removeLayer(layerId); // Cleanup on unmount
  };
}, [renderer, isReady]);
```

### 4. Escape Hatch dla Advanced Features:

```tsx
const { renderer } = useMapRenderer({ type: 'mapbox', ... });

// Jeśli MUSISZ użyć Mapbox-specific feature:
if (renderer?.getRendererType() === 'mapbox') {
  const mapboxInstance = renderer.getNativeInstance();
  mapboxInstance.addControl(new mapboxgl.NavigationControl());
}
```

---

## 🚧 Ograniczenia

### Mapbox Adapter:
- ✅ WMS, GeoJSON, vector tiles
- ✅ 3D terrain, buildings, sky
- ✅ Advanced styling
- ⚠️ Wymaga Mapbox token

### Leaflet Adapter:
- ✅ WMS, GeoJSON
- ✅ Lekki (150KB)
- ✅ Darmowy
- ❌ Brak 3D
- ❌ Brak vector tiles

### Blank Canvas Adapter:
- ✅ Tylko GeoJSON (client-side)
- ✅ Pełna kontrola renderowania
- ✅ Minimalny bundle (0 dependencies)
- ❌ Brak WMS/raster tiles
- ❌ Brak 3D
- ❌ Brak zaawansowanych gestów

---

## 📦 Instalacja Dodatkowych Silników

```bash
# Mapbox (już zainstalowany)
npm install mapbox-gl

# Leaflet (opcjonalny)
npm install leaflet @types/leaflet

# deck.gl (przyszłość)
npm install deck.gl @deck.gl/layers
```

---

## 🔮 Roadmap

- [ ] **deck.gl adapter** - WebGL 3D visualization
- [ ] **OpenLayers adapter** - Advanced OGC support
- [ ] **MapLibre GL adapter** - Open-source Mapbox alternative
- [ ] **Layer ordering** - Full z-index control
- [ ] **Feature clustering** - Auto-cluster points
- [ ] **Animation API** - Timeline/playback for temporal data

---

## 📚 Więcej Przykładów

Zobacz:
- [`src/lib/map-renderer/examples/`](../src/lib/map-renderer/examples/) - Przykłady kodu
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) - Szczegółowy przewodnik migracji
- [`API.md`](./API.md) - Pełna dokumentacja API
