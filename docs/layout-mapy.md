# Layout Mapy - Dokumentacja

## Przegląd

Layout aplikacji Universe MapMaker został zaprojektowany w oparciu o klasyczne aplikacje GIS, z lewym panelem warstw i głównym widokiem mapy.

## Struktura Komponentów

### AppLayout (`app/(app)/layout.tsx`)
- **Responsywny layout** z AppBar i Sidebar
- **Desktop**: Stały drawer 300px szerokości
- **Mobile**: Swipeable drawer z przyciskiem menu
- **Accessibility**: Pełne wsparcie ARIA labels i focus management

### LayerPanel (`src/components/ui/LayerPanel.tsx`)
- **Tree/List struktura** grup i warstw
- **Ikony**: Visibility/VisibilityOff, Info, Folder/FolderOpen, Layers
- **Funkcjonalność**: 
  - Przełączanie widoczności warstw
  - Rozwijanie/zwijanie grup
  - Wyszukiwanie warstw
  - Wybieranie aktywnej warstwy
- **Redux Integration**: Pobiera dane z layersSlice

### MapView (`src/components/ui/MapView.tsx`)
- **Client component** z dynamic import (ssr: false)
- **Kontener mapy** z ref dla Mapbox
- **Kontrolki zoom**: Floating Action Buttons (+/-)
- **Pasek skali**: Placeholder w lewym dolnym rogu
- **Przycisk lokalizacji**: Wyśrodkowanie na pozycji użytkownika

## Redux State Management

### layersSlice.ts
\`\`\`typescript
interface Layer {
  id: string
  name: string
  visible: boolean
  z: number
  type: "geojson" | "wms" | "mvt" | "raster"
  // ... więcej właściwości
}

interface LayerGroup {
  id: string
  name: string
  expanded: boolean
  layers: string[] // Layer IDs
}
\`\`\`

### Akcje
- `toggleLayerVisibility(layerId)` - Przełącza widoczność warstwy
- `toggleGroupExpanded(groupId)` - Rozwijanie/zwijanie grup
- `reorderLayers()` - Zmiana kolejności warstw (drag & drop)
- `setSelectedLayer(layerId)` - Wybór aktywnej warstwy

### Selektory
- `selectVisibleLayers` - Filtruje widoczne warstwy
- `selectSortedLayers` - Sortuje warstwy według z-index
- `selectLayersByGroup` - Grupuje warstwy według grup

## Stylowanie i UX

### Responsive Design
- **Breakpoint**: `md` (900px)
- **Desktop**: Stały sidebar 300px
- **Mobile**: Swipeable drawer pełnej szerokości

### Theme Tokens
- Używa `spacing` z theme.ts (bez magic numbers)
- `zIndex` dla prawidłowego layeringu komponentów
- Semantic colors z Material-UI palette

### Accessibility
- **ARIA labels** na wszystkich interaktywnych elementach
- **Focus management** w drawer navigation
- **Screen reader support** dla stanu warstw
- **Keyboard navigation** w listach warstw

## Integracja z Mapbox

### Environment Variables
\`\`\`env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
\`\`\`

### Dynamic Import
\`\`\`typescript
const MapContainer = dynamic(() => import("@/components/map/MapContainer"), {
  ssr: false,
  loading: () => <LoadingComponent />
})
\`\`\`

## Przykład Użycia

\`\`\`typescript
// Przełączanie widoczności warstwy
const dispatch = useAppDispatch()
dispatch(toggleLayerVisibility("layer-id"))

// Pobieranie widocznych warstw
const visibleLayers = useAppSelector(selectVisibleLayers)

// Obsługa zdarzeń mapy
const handleMapLoad = (runtime: MapRuntime) => {
  // Konfiguracja warstw na mapie
}
\`\`\`

## Rozszerzenia

### Planowane funkcjonalności
1. **Drag & Drop** reordering warstw
2. **Context menu** dla warstw i grup
3. **Layer styling** panel
4. **Import/Export** konfiguracji warstw
5. **Bookmarks** dla widoków mapy

### Customization
Layout można łatwo dostosować poprzez:
- Zmianę `DRAWER_WIDTH` w AppLayout
- Modyfikację breakpointów responsywnych
- Dodanie nowych typów warstw w Redux state
- Rozszerzenie komponentów UI o nowe funkcjonalności
