# State Management Contract

## Redux Store Structure

### Co przechowujemy w Redux:
- **UI State** (`uiSlice`): leftPanelOpen, rightPanelOpen, themeMode, activePanel
- **Layers State** (`layersSlice`): warstwy map, grupy, widoczność, style
- **Parcels State** (`parcelsSlice`): dane działek, filtry, paginacja
- **Measurements State** (`measurementSlice`): pomiary, historia, aktywne narzędzie

### Co przechowujemy w RTK Query:
- **API Cache**: dane z Google Sheets, GeoServer capabilities
- **Mutations**: operacje CRUD na danych zewnętrznych
- **Background Sync**: automatyczne odświeżanie danych

### Co przechowujemy w Runtime (refs/map):
- **Mapbox GL Instance**: instancja mapy (nie-serializowalna)
- **Map Event Handlers**: listenery zdarzeń mapy
- **3D Scene Objects**: obiekty Three.js (gdy używane)
- **Temporary UI State**: hover states, tooltips

## Zasady Serializacji

### ✅ Dozwolone w Redux:
\`\`\`typescript
// Proste typy
string | number | boolean | null | undefined

// Obiekty i tablice z prostymi typami
{ id: string, name: string, visible: boolean }
Array<SimpleObject>

// GeoJSON (jest serializowalny)
FeatureCollection | Feature | Geometry
\`\`\`

### ❌ Zabronione w Redux:
\`\`\`typescript
// Instancje klas
new Map() | new Set() | new Date()

// Funkcje
() => void | Promise<any>

// DOM Elements
HTMLElement | SVGElement

// Mapbox/Three.js Objects
mapboxgl.Map | THREE.Scene | THREE.Mesh
\`\`\`

## Selektory z Reselect

Wszystkie selektory używają `createSelector` dla memoizacji:

\`\`\`typescript
// ✅ Poprawnie
export const selectVisibleLayers = createSelector(
  [selectAllLayers],
  (layers) => layers.filter(layer => layer.visible)
);

// ❌ Niepoprawnie - bez memoizacji
export const selectVisibleLayers = (state: RootState) => 
  state.layers.items.filter(layer => layer.visible);
\`\`\`

## Persistence Strategy

- **UI State**: persystowany lokalnie (theme, panel states)
- **Layers/Parcels**: cache z TTL, synchronizacja z backend
- **Measurements**: persystowane lokalnie z opcją eksportu
- **Map State**: nie persystowany (viewport, zoom odtwarzane z URL)
