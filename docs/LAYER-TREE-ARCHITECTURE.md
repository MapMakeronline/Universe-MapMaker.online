# Architektura Drzewa Warstw - Kompletna Analiza

**Data:** 2025-01-11
**Status:** ✅ Kompletna analiza działania systemu warstw

---

## 📋 Spis Treści

1. [Przegląd Systemu](#przegląd-systemu)
2. [Przepływ Danych](#przepływ-danych)
3. [Komponenty i Hooki](#komponenty-i-hooki)
4. [Logika Drag & Drop](#logika-drag--drop)
5. [Funkcje i Handlery](#funkcje-i-handlery)
6. [Plan Refaktoringu](#plan-refaktoringu)

---

## 1. Przegląd Systemu

### 1.1 Architektura Wysokopoziomowa

```
┌─────────────────────────────────────────────────────────┐
│                    Redux Store                          │
│                 (state.layers.layers)                   │
│                   LayerNode[] from                      │
│                    Backend API                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 LeftPanel Component                     │
│  - Konwertuje LayerNode → Warstwa (local state)        │
│  - Zarządza stanem UI (selected, expanded, etc.)       │
│  - Obsługuje modals (Add, Import, Delete, etc.)        │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌────────────────────┐
│   LayerTree      │  │  useDragDrop Hook  │
│   Component      │  │                    │
│                  │  │  Drag & Drop Logic │
└──────────────────┘  └────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│            renderWarstwaItem (Recursive)                │
│  - Renderuje pojedynczy element + dzieci rekurencyjnie  │
│  - Wizualne wskaźniki drag & drop                      │
│  - Obsługa eventów (click, drag, visibility)           │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Typy Danych

**Redux LayerNode** (z backendu):
```typescript
interface LayerNode {
  id: string;
  name: string;
  type: 'group' | 'VectorLayer' | 'RasterLayer' | 'WMS';
  visible?: boolean;
  children?: LayerNode[];
  childrenVisible?: boolean;
  // ... inne właściwości z backendu
}
```

**Local Warstwa** (UI state):
```typescript
interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}
```

**DragDropState**:
```typescript
interface DragDropState {
  draggedItem: string | null;      // ID przeciąganego elementu
  dropTarget: string | null;        // ID targetu drop
  dropPosition: DropPosition;       // 'before' | 'after' | 'inside'
  showMainLevelZone: boolean;       // Czy pokazać strefę głównego poziomu
}
```

---

## 2. Przepływ Danych

### 2.1 Inicjalizacja (Backend → Redux → UI)

```
Backend API (testnumr1.qgs)
    │
    │ GET /api/projects/{project_name}/json
    │
    ▼
Redux Store (layersApi.ts)
    │ RTK Query - automatyczne cache
    │
    ▼
LeftPanel useEffect (line 170-176)
    │ if (reduxLayers && reduxLayers.length > 0)
    │
    ▼
convertLayerNodeToWarstwa() (line 153-167)
    │ Konwersja: LayerNode → Warstwa
    │ - type: 'group' → typ: 'grupa'
    │ - name → nazwa
    │ - visible → widoczna
    │ - REKURENCYJNIE dla children → dzieci
    │
    ▼
setWarstwy(convertedLayers)
    │ Local state update
    │
    ▼
LayerTree Component (warstwy prop)
    │
    ▼
filterWarstwy() (if searchFilter)
    │ Filtrowanie hierarchiczne
    │
    ▼
filteredWarstwy.map() → renderWarstwaItem()
    │ REKURENCYJNE renderowanie
    │
    ▼
DOM Render ✅
```

### 2.2 Interakcje Użytkownika

#### 2.2.1 Kliknięcie w Warstwę

```
User Click on Layer
    │
    ▼
onClick={() => onLayerSelect(warstwa.id)} (LayerTree.tsx:369)
    │
    ▼
handleLayerSelect(id) (LeftPanel.tsx:202-205)
    │ const layer = findLayerById(warstwy, id);
    │ setSelectedLayer(layer);
    │
    ▼
PropertiesPanel opens (shows layer details)
```

#### 2.2.2 Toggle Visibility (Checkbox)

```
User Checkbox Click
    │
    ▼
onChange={() => onToggleVisibility(warstwa.id)} (LayerTree.tsx:455)
    │
    ▼
toggleVisibility(id) (LeftPanel.tsx:207-227)
    │ updateWarstwy() - REKURENCYJNE update
    │ - Znajduje warstwę po ID
    │ - Zmienia widoczna: !warstwa.widoczna
    │ - Jeśli grupa: aktualizuje dzieci na ten sam stan
    │
    ▼
setWarstwy(updateWarstwy(warstwy))
    │
    ▼
Re-render LayerTree ✅
```

#### 2.2.3 Expand/Collapse Grupy

```
User Click on Arrow (group expand button)
    │
    ▼
onClick={(e) => { e.stopPropagation(); onToggleExpansion(warstwa.id); }}
(LayerTree.tsx:414-417)
    │
    ▼
toggleExpansion(id) (LeftPanel.tsx:229-242)
    │ updateExpansion() - REKURENCYJNE
    │ - Znajduje grupę po ID
    │ - Zmienia rozwinięta: !warstwa.rozwinięta
    │
    ▼
setWarstwy(updateExpansion(warstwy))
    │
    ▼
Re-render LayerTree with children visible/hidden ✅
```

---

## 3. Komponenty i Hooki

### 3.1 LeftPanel.tsx

**Odpowiedzialności:**
- ✅ Zarządzanie stanem lokalnym warstw (`warstwy`)
- ✅ Synchronizacja z Redux (`useEffect` linia 170-176)
- ✅ Konwersja typów: `LayerNode → Warstwa`
- ✅ Obsługa modalów (Add Dataset, Import, Delete, etc.)
- ✅ Helper functions: `findLayerById`, `findParentGroup`
- ✅ Event handlers: `toggleVisibility`, `toggleExpansion`, `handleLayerSelect`
- ✅ Drag & Drop state management (`useDragDrop` hook)

**Kluczowe Funkcje:**

| Funkcja | Linia | Opis |
|---------|-------|------|
| `convertLayerNodeToWarstwa` | 153-167 | Konwersja Redux → Local state |
| `useEffect (Redux sync)` | 170-176 | Automatyczna synchronizacja |
| `findLayerById` | 179-188 | Rekurencyjne wyszukiwanie warstwy |
| `findParentGroup` | 190-200 | Znajdź rodzica dla warstwy |
| `toggleVisibility` | 207-227 | Toggle widoczności + cascade dzieci |
| `toggleExpansion` | 229-242 | Toggle rozwinięcia grupy |
| `expandAll` | 258-267 | Rozwiń wszystkie grupy |
| `collapseAll` | 269-278 | Zwiń wszystkie grupy |
| `handleAddDataset` | 281-290 | Dodaj nową warstwę INSPIRE |
| `handleDeleteLayer` | 396-416 | Usuń warstwę z hierarchii |

**Props przekazywane do LayerTree:**
```typescript
<LayerTree
  warstwy={warstwy}                           // Dane warstw
  selectedLayer={selectedLayer}                // Aktualnie wybrana warstwa
  searchFilter={searchFilter}                  // Filtr wyszukiwania
  dragDropState={dragDropHandlers.dragDropState}  // Stan drag & drop
  onLayerSelect={handleLayerSelect}            // Callback: wybór warstwy
  onToggleVisibility={toggleVisibility}        // Callback: toggle visibility
  onToggleExpansion={toggleExpansion}          // Callback: toggle expansion
  onDragStart={dragDropHandlers.handleDragStart}      // Drag & Drop
  onDragEnd={dragDropHandlers.handleDragEnd}          // handlers
  onDragEnter={dragDropHandlers.handleDragEnter}      // z hooka
  onDragLeave={dragDropHandlers.handleDragLeave}      // useDragDrop
  onDragOver={dragDropHandlers.handleDragOver}
  onDrop={dragDropHandlers.handleDrop}
  onDropAtEnd={dragDropHandlers.handleDropAtEnd}
  onLayerTreeDragOver={dragDropHandlers.handleLayerTreeDragOver}
  onMainLevelDragOver={dragDropHandlers.handleMainLevelDragOver}
/>
```

### 3.2 LayerTree.tsx

**Odpowiedzialności:**
- ✅ Renderowanie hierarchicznej struktury warstw
- ✅ Wizualne wskaźniki drag & drop (animacje, kolory, strefy)
- ✅ Obsługa eventów: click, drag, hover
- ✅ Filtrowanie warstw (`filterWarstwy`)
- ✅ Rekurencyjne renderowanie (`renderWarstwaItem`)
- ✅ Ikony typów warstw (folder, layers)
- ✅ Action buttons (zoom to layer, show attributes)

**Kluczowe Funkcje:**

| Funkcja | Linia | Opis |
|---------|-------|------|
| `getWarstwaIcon` | 227-235 | Zwraca ikonę dla typu warstwy |
| `filterWarstwy` | 237-248 | Rekurencyjne filtrowanie (search) |
| `renderWarstwaItem` | 250-586 | **GŁÓWNA FUNKCJA** - rekurencyjne renderowanie elementu + dzieci |

**Struktura renderWarstwaItem:**

```typescript
renderWarstwaItem(warstwa, level = 0) {
  // 1. Stan drag & drop
  const isDragged = draggedItem === warstwa.id;
  const isDropTarget = dropTarget === warstwa.id;

  return (
    <Box> {/* Outer wrapper */}

      {/* 2. Drop indicators (linie 262-364) */}
      {isDropTarget && dropPosition === 'inside' && <AnimatedGroupDropZone />}
      {isDropTarget && (before/after) && <AnimatedLineIndicator />}

      {/* 3. Main layer item (linie 366-538) */}
      <Box
        draggable
        onClick={onLayerSelect}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        sx={{ /* Conditional styles based on isDragged, isDropTarget */ }}
      >
        {/* 3a. Expand arrow (tylko dla grup) */}
        {warstwa.typ === 'grupa' ? <ExpandArrow /> : <Placeholder />}

        {/* 3b. Visibility checkbox */}
        <Checkbox checked={warstwa.widoczna} onChange={onToggleVisibility} />

        {/* 3c. Icon */}
        <Icon type={warstwa.typ} />

        {/* 3d. Nazwa warstwy */}
        <Typography>{warstwa.nazwa}</Typography>

        {/* 3e. Action buttons */}
        <IconButton onClick={zoomToLayer} />  {/* GPS icon */}
        <IconButton onClick={showAttributes} />  {/* Calendar icon - tylko dla warstw */}
      </Box>

      {/* 4. REKURENCYJNE RENDEROWANIE DZIECI (linie 540-583) */}
      {warstwa.dzieci && warstwa.rozwinięta && (
        <Box sx={{ ml: 1 }}>
          {warstwa.dzieci.map(dziecko => (
            <Box key={dziecko.id}>
              {renderWarstwaItem(dziecko, level + 1)}  {/* ← REKURENCJA */}
            </Box>
          ))}

          {/* 5. Drop zone na końcu grupy (linie 549-581) */}
          <DropAtEndZone groupId={warstwa.id} />
        </Box>
      )}
    </Box>
  );
}
```

**Główny kontener (linie 590-670):**
```typescript
return (
  <Box className="layer-tree" onDragOver={onLayerTreeDragOver}>

    {/* Strefa drop głównego poziomu (linie 613-662) */}
    {showMainLevelZone && draggedItem && <MainLevelDropZone />}

    {/* Mapowanie wszystkich warstw na głównym poziomie */}
    {filteredWarstwy.map(warstwa => (
      <Box key={warstwa.id}>
        {renderWarstwaItem(warstwa)}
      </Box>
    ))}
  </Box>
);
```

### 3.3 useDragDrop Hook

**Odpowiedzialności:**
- ✅ Zarządzanie stanem drag & drop (`dragDropState`)
- ✅ Walidacja dozwolonych operacji (nie można wrzucić grupy do swojego dziecka)
- ✅ Znajdowanie ścieżek elementów w hierarchii
- ✅ Manipulacja hierarchią: usuwanie, wstawianie elementów
- ✅ Wykrywanie pozycji drop: before, after, inside
- ✅ Cleanup po zakończeniu drag & drop

**Kluczowe Funkcje:**

| Funkcja | Linia | Opis |
|---------|-------|------|
| `findElementPath` | 44-55 | Znajduje ścieżkę [0, 2, 1] do elementu w hierarchii |
| `findElementById` | 58-69 | Rekurencyjnie znajduje element po ID |
| `removeElementAtPath` | 72-95 | Usuwa element z hierarchii po ścieżce |
| `insertElementAtPath` | 98-140 | Wstawia element w hierarchii (before/after/inside) |
| `isDescendant` | 143-167 | Sprawdza czy childId jest potomkiem parentId |
| `cleanupDragState` | 169-176 | Resetuje stan drag & drop |
| `handleDragStart` | 178-182 | Rozpoczęcie przeciągania |
| `handleDragEnd` | 184-186 | Zakończenie przeciągania (cleanup) |
| `handleDragEnter` | 188-215 | Wejście nad element (walidacja + set dropTarget) |
| `handleDragLeave` | 217-235 | Opuszczenie elementu (clear dropTarget) |
| `handleDragOver` | 237-279 | **KLUCZOWA** - wykrywa pozycję drop (before/after/inside) |
| `handleLayerTreeDragOver` | 281-298 | Wykrywa czy mysz jest w lewej strefie (main level zone) |
| `handleMainLevelDragOver` | 300-315 | Obsługa drag nad strefą głównego poziomu |
| `handleDrop` | 317-410 | **NAJWAŻNIEJSZA** - wykonuje finalną operację drop |
| `handleDropAtEnd` | 412-467 | Drop na koniec grupy (specjalny przypadek) |

**Algorytm handleDragOver (linie 237-279):**

```typescript
1. Walidacja: czy target nie jest potomkiem dragged item
2. Pobierz rect elementu i pozycję myszy (mouseY)
3. Oblicz relativeY = (mouseY - elementTop) / elementHeight
4. Jeśli target to grupa i mysz w środku (25%-75%):
     → dropPosition = 'inside'  (wrzuć DO grupy)
   Inaczej:
     → dropPosition = relativeY < 0.5 ? 'before' : 'after'  (reorder)
5. Update dragDropState
```

**Algorytm handleDrop (linie 317-410):**

```typescript
1. Walidacja: czy draggedItem istnieje i nie równa się targetId
2. Jeśli target === MAIN_LEVEL_DROP_ID (strefa głównego poziomu):
     a. Znajdź ścieżkę draggedItem
     b. Usuń z obecnej pozycji
     c. Dodaj na koniec głównego poziomu
     d. Cleanup i return
3. Sprawdź czy target nie jest potomkiem draggedItem (circular reference)
4. Znajdź ścieżki: draggedPath i targetPath
5. Usuń draggedItem z obecnej pozycji → removedElement
6. Znajdź nową ścieżkę targetPath (po usunięciu)
7. Wstaw removedElement w nowym miejscu:
     - Jeśli dropPosition === 'inside': wstaw do grupy jako last child
     - Jeśli dropPosition === 'before': wstaw PRZED target
     - Jeśli dropPosition === 'after': wstaw PO target
8. setItems(newItems)
9. Cleanup
```

---

## 4. Logika Drag & Drop

### 4.1 Typy Operacji Drop

#### A. **Reordering** (before/after)

```
Przed:
├── Layer A
├── Layer B  ← przeciągamy
└── Layer C

Po drop Layer B BEFORE Layer A:
├── Layer B  ← dropped here
├── Layer A
└── Layer C

Po drop Layer B AFTER Layer C:
├── Layer A
├── Layer C
└── Layer B  ← dropped here
```

#### B. **Group Drop** (inside)

```
Przed:
├── Group 1
│   └── Layer A
└── Layer B  ← przeciągamy

Po drop Layer B INSIDE Group 1:
├── Group 1
│   ├── Layer A
│   └── Layer B  ← dropped here (now child of Group 1)
```

#### C. **Main Level Drop**

```
Przed:
├── Group 1
│   ├── Layer A
│   └── Layer B  ← przeciągamy (nested)

Po drag Layer B do lewej strefy (main level zone):
├── Group 1
│   └── Layer A
└── Layer B  ← dropped here (pulled to main level)
```

### 4.2 Wizualne Wskaźniki

#### A. Dragged Item
- Opacity: 0.6
- Transform: scale(1.02) rotate(2deg)
- Border: 2px dashed #4fc3f7 (cyan)
- BoxShadow: 0 8px 16px rgba(0,0,0,0.3)

#### B. Drop Target - Before/After
- Animowana linia (3px height)
- Color: theme.palette.primary.main
- BoxShadow: 0 0 8px rgba(25, 118, 210, 0.8)
- Position: absolute (top lub bottom)
- Animation: preciseDropIndicator (pulsing)

#### C. Drop Target - Inside (Group)
- Border: 2px dashed #4caf50 (green)
- Background: rgba(76, 175, 80, 0.1)
- Ikona: 📁 (centered)
- Animation: groupDropIndicator (color cycling)

#### D. Main Level Zone
- Width: 25px (lewa strefa)
- Background: rgba(255, 152, 0, 0.1) (orange)
- Border: 2px dashed rgba(255, 152, 0, 0.5)
- Text: "Poziom główny" (vertical)
- Active animation: mainLevelActive

### 4.3 Walidacje Drag & Drop

**1. Circular Reference Prevention:**
```typescript
isDescendant(parentId, childId): boolean
// Sprawdza czy childId jest potomkiem parentId
// Zapobiega: przeciągnięciu grupy do swojego własnego dziecka
```

**2. Self-Drop Prevention:**
```typescript
if (draggedItem === targetId) {
  return; // Nie można upuścić na samego siebie
}
```

**3. Valid Target Check:**
```typescript
const isValidTarget = !isDescendant(draggedItem, targetId);
if (!isValidTarget) {
  console.log('❌ Invalid target (descendant)');
  return;
}
```

---

## 5. Funkcje i Handlery

### 5.1 Mapowanie Event Flow

```
USER ACTION                    EVENT HANDLER                    STATE UPDATE

Click Layer                 → handleLayerSelect(id)          → setSelectedLayer(layer)
Click Checkbox              → toggleVisibility(id)           → setWarstwy(updated)
Click Expand Arrow          → toggleExpansion(id)            → setWarstwy(updated)
Start Drag                  → handleDragStart(e, id)         → setDragDropState({draggedItem: id})
Drag Over Layer             → handleDragOver(e, id)          → setDragDropState({dropTarget, dropPosition})
Drag Enter Layer            → handleDragEnter(e, id)         → setDragDropState({dropTarget})
Drag Leave Layer            → handleDragLeave(e)             → setDragDropState({dropTarget: null})
Drop on Layer               → handleDrop(e, targetId)        → setWarstwy(newHierarchy) + cleanup
Drop at End of Group        → handleDropAtEnd(e, groupId)    → setWarstwy(newHierarchy) + cleanup
Drag Over Main Level Zone   → handleMainLevelDragOver(e)     → setDragDropState({dropTarget: MAIN_LEVEL})
End Drag                    → handleDragEnd()                → cleanupDragState()
```

### 5.2 Helper Functions (LeftPanel)

**findLayerById(layers, id):**
```typescript
// Rekurencyjne wyszukiwanie warstwy po ID
// Przeszukuje całe drzewo (parent → children → children's children...)
// Returns: Warstwa | null
```

**findParentGroup(layers, childId):**
```typescript
// Znajduje grupę rodzica dla danego childId
// Używane przy operacjach przenoszenia/usuwania
// Returns: Warstwa | null
```

**updateWarstwy(warstwy):**
```typescript
// Rekurencyjnie aktualizuje stan warstw
// Używane w toggleVisibility
// Returns: Warstwa[]
```

**expandAllRecursive(warstwy):**
```typescript
// Rekurencyjnie rozwija wszystkie grupy
// Returns: Warstwa[]
```

**collapseAllRecursive(warstwy):**
```typescript
// Rekurencyjnie zwija wszystkie grupy
// Returns: Warstwa[]
```

### 5.3 Helper Functions (useDragDrop)

**findElementPath(nodes, targetId):**
```typescript
// Znajduje ścieżkę do elementu w hierarchii
// Example: [0, 2, 1] = główny poziom[0] → dzieci[2] → dzieci[1]
// Returns: number[] | null
```

**removeElementAtPath(nodes, path):**
```typescript
// Usuwa element z hierarchii po ścieżce
// Returns: { newItems, removedElement }
```

**insertElementAtPath(nodes, element, path, position):**
```typescript
// Wstawia element w hierarchii
// position: 'before' | 'after' | 'inside'
// Returns: T[]
```

---

## 6. Plan Refaktoringu

### 6.1 Problemy Obecnej Architektury

#### ❌ **Problem 1: Duplikacja Stanu (Redux + Local)**

**Obecny Stan:**
```typescript
// Redux Store
const reduxLayers = useAppSelector((state) => state.layers.layers);

// Local State (duplikat!)
const [warstwy, setWarstwy] = useState<Warstwa[]>([]);

// Synchronizacja ręczna
React.useEffect(() => {
  if (reduxLayers && reduxLayers.length > 0) {
    const convertedLayers = reduxLayers.map(convertLayerNodeToWarstwa);
    setWarstwy(convertedLayers);
  }
}, [reduxLayers]);
```

**Problemy:**
- Duplikacja danych (Redux + Local state)
- Ręczna synchronizacja (useEffect)
- Potencjalne race conditions
- Trudność w zarządzaniu stanem

#### ❌ **Problem 2: Brak Integracji z Backend API**

**Obecny Stan:**
- Local state modifications (toggleVisibility, drag & drop) NIE są synchronizowane z backendem
- Zmiany gubią się po refresh strony
- Brak persystencji

**Co się dzieje:**
```
User drag & drops layer → setWarstwy(newHierarchy) → State update ✅
User refreshes page → Redux fetches from backend → Old hierarchy restored ❌
```

#### ❌ **Problem 3: Brak Type Safety**

**Obecny Stan:**
```typescript
// Dwa różne typy dla tych samych danych
interface LayerNode { ... }  // Redux
interface Warstwa { ... }    // Local
```

**Problemy:**
- Manualna konwersja typów
- Możliwość błędów w konwersji
- Brak shared types

#### ❌ **Problem 4: Zbyt Duży LeftPanel Component**

**Obecny Stan:**
- 693 linie kodu
- 30+ funkcji helper
- 8 różnych modalów
- Mieszanie concerns (UI, state, modals, handlers)

#### ❌ **Problem 5: Brak Error Handling**

**Obecny Stan:**
```typescript
const draggedPath = findElementPath(items, dragDropState.draggedItem);
if (!draggedPath) {
  console.log('❌ Could not find dragged element path');
  return; // Co się stało? User nie widzi błędu!
}
```

**Problemy:**
- Tylko console.log
- Brak user-friendly error messages
- Brak error recovery

---

### 6.2 Proponowana Architektura (Refaktor)

#### ✅ **Faza 1: Redux jako Single Source of Truth**

**Cel:** Eliminacja local state, wszystkie dane w Redux

**Zmiany:**
```typescript
// BEFORE (LeftPanel.tsx)
const [warstwy, setWarstwy] = useState<Warstwa[]>([]);
React.useEffect(() => { /* sync */ }, [reduxLayers]);

// AFTER
const layers = useAppSelector((state) => state.layers.layers);
const dispatch = useAppDispatch();

// Wszystkie modyfikacje poprzez Redux actions
dispatch(updateLayerVisibility({ layerId, visible: true }));
dispatch(moveLayer({ layerId, targetId, position: 'before' }));
```

**Nowe Redux Actions (layersSlice.ts):**
```typescript
export const layersSlice = createSlice({
  name: 'layers',
  initialState,
  reducers: {
    // Existing
    setLayers: (state, action) => { ... },

    // NEW
    toggleLayerVisibility: (state, action: { layerId: string }) => {
      // Find layer recursively
      // Toggle visible
      // If group: cascade to children
    },

    toggleLayerExpansion: (state, action: { layerId: string }) => {
      // Find group
      // Toggle childrenVisible
    },

    moveLayer: (state, action: {
      layerId: string,
      targetId: string,
      position: 'before' | 'after' | 'inside'
    }) => {
      // Remove layer from current position
      // Insert at new position
      // Maintain hierarchy
    },

    reorderLayers: (state, action: { newHierarchy: LayerNode[] }) => {
      state.layers = action.payload.newHierarchy;
    }
  }
});
```

**Benefity:**
- ✅ Single source of truth
- ✅ No manual sync
- ✅ Redux DevTools for debugging
- ✅ Easier testing (pure reducers)

#### ✅ **Faza 2: RTK Query Mutations dla Backend Sync**

**Cel:** Automatyczna synchronizacja zmian z backendem

**Nowe API Endpoints:**
```typescript
// layersApi.ts (RTK Query)
export const layersApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // Existing
    getProjectLayers: builder.query({ ... }),

    // NEW
    updateLayerVisibility: builder.mutation<void, {
      projectId: string;
      layerId: string;
      visible: boolean;
    }>({
      query: ({ projectId, layerId, visible }) => ({
        url: `/api/projects/${projectId}/layers/${layerId}/visibility`,
        method: 'PATCH',
        body: { visible }
      }),
      // Optimistic update
      onQueryStarted: async ({ projectId, layerId, visible }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          layersApi.util.updateQueryData('getProjectLayers', projectId, (draft) => {
            // Update cache optimistically
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo(); // Rollback on error
        }
      }
    }),

    updateLayerHierarchy: builder.mutation<void, {
      projectId: string;
      hierarchy: LayerNode[];
    }>({
      query: ({ projectId, hierarchy }) => ({
        url: `/api/projects/${projectId}/layers/hierarchy`,
        method: 'PUT',
        body: { hierarchy }
      }),
      invalidatesTags: ['Layers'] // Refetch after success
    })
  })
});
```

**Backend API Endpoints (Django):**
```python
# geocraft_api/projects/urls.py
urlpatterns = [
    # Existing
    path('api/projects/<str:project_name>/json', ...),

    # NEW
    path('api/projects/<str:project_id>/layers/<str:layer_id>/visibility',
         UpdateLayerVisibilityView.as_view()),

    path('api/projects/<str:project_id>/layers/hierarchy',
         UpdateLayerHierarchyView.as_view()),
]

# geocraft_api/projects/views.py
class UpdateLayerVisibilityView(APIView):
    def patch(self, request, project_id, layer_id):
        # Update layer visibility in database
        # Update QGS file
        # Return success/error
        pass

class UpdateLayerHierarchyView(APIView):
    def put(self, request, project_id):
        # Validate hierarchy
        # Update database
        # Regenerate QGS file with new order
        # Return success/error
        pass
```

**Benefity:**
- ✅ Persystencja danych
- ✅ Optimistic updates (instant UI feedback)
- ✅ Automatic rollback on error
- ✅ Cache invalidation

#### ✅ **Faza 3: Type Safety & Shared Types**

**Cel:** Jeden typ danych, koniec konwersji

**Nowy Unified Type:**
```typescript
// src/typy/layers.ts
export interface Layer {
  id: string;
  name: string;
  type: 'group' | 'vector' | 'raster' | 'wms';
  visible: boolean;
  expanded?: boolean; // Only for groups
  children?: Layer[];

  // Backend metadata
  source?: string;
  style?: string;
  opacity?: number;
  minZoom?: number;
  maxZoom?: number;

  // UI metadata
  selected?: boolean;
  locked?: boolean;
}

// Typy pomocnicze
export type LayerType = Layer['type'];
export type LayerHierarchy = Layer[];
```

**Migration:**
```typescript
// BEFORE
interface LayerNode { ... }     // Redux
interface Warstwa { ... }       // Local
convertLayerNodeToWarstwa()     // Manual conversion

// AFTER
interface Layer { ... }         // Everywhere!
```

**Benefity:**
- ✅ No manual conversions
- ✅ Type safety across frontend/backend
- ✅ Easier to maintain
- ✅ Better DX (Developer Experience)

#### ✅ **Faza 4: Component Split & Separation of Concerns**

**Cel:** Mniejsze, łatwiejsze w utrzymaniu komponenty

**Nowa Struktura Folderów:**
```
src/features/layers/
├── components/
│   ├── LayerTree/
│   │   ├── LayerTree.tsx              (Główny komponent)
│   │   ├── LayerItem.tsx              (Pojedynczy item - extracted!)
│   │   ├── LayerGroupItem.tsx         (Grupa - extracted!)
│   │   ├── DropIndicators.tsx         (Wskaźniki drag & drop)
│   │   ├── MainLevelZone.tsx          (Strefa głównego poziomu)
│   │   └── types.ts                   (Local types)
│   │
│   ├── LayerControls/
│   │   ├── LayerToolbar.tsx           (Toolbar z akcjami)
│   │   ├── SearchBar.tsx              (Wyszukiwarka)
│   │   └── ExpandCollapseButtons.tsx  (Expand/Collapse all)
│   │
│   ├── LayerModals/
│   │   ├── AddDatasetModal.tsx
│   │   ├── AddLayerModal.tsx
│   │   ├── ImportLayerModal.tsx
│   │   ├── AddGroupModal.tsx
│   │   └── ... (inne modaly)
│   │
│   └── LeftPanel.tsx                  (Orchestration component)
│
├── hooks/
│   ├── useDragDrop.ts                 (Existing)
│   ├── useLayerActions.ts             (NEW - extracted from LeftPanel)
│   └── useLayerSelection.ts           (NEW)
│
├── store/
│   ├── layersSlice.ts                 (Redux state)
│   └── layersApi.ts                   (RTK Query)
│
└── utils/
    ├── layerHelpers.ts                (Helper functions)
    └── layerValidation.ts             (Validation logic)
```

**Extracted Components:**

**A. LayerItem.tsx** (Single Responsibility: render ONE layer)
```typescript
interface LayerItemProps {
  layer: Layer;
  level: number;
  selected: boolean;
  dragState: DragDropState;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onZoomTo: () => void;
  onShowAttributes: () => void;
  // Drag & drop handlers
}

export const LayerItem: React.FC<LayerItemProps> = ({ ... }) => {
  return (
    <Box draggable onDragStart={...} onDrop={...}>
      <Checkbox checked={layer.visible} onChange={onToggleVisibility} />
      <LayerIcon type={layer.type} />
      <Typography>{layer.name}</Typography>
      <ActionButtons onZoomTo={onZoomTo} onShowAttributes={onShowAttributes} />
    </Box>
  );
};
```

**B. LayerGroupItem.tsx** (Single Responsibility: render ONE group + children)
```typescript
interface LayerGroupItemProps {
  group: Layer;
  level: number;
  expanded: boolean;
  onToggleExpansion: () => void;
  children: React.ReactNode;
  // ... other props
}

export const LayerGroupItem: React.FC<LayerGroupItemProps> = ({ ... }) => {
  return (
    <Box>
      {/* Group header */}
      <Box onClick={onToggleExpansion}>
        <ExpandArrow expanded={expanded} />
        <FolderIcon />
        <Typography>{group.name}</Typography>
      </Box>

      {/* Children (rendered recursively) */}
      {expanded && (
        <Box sx={{ ml: 2 }}>
          {children}
        </Box>
      )}
    </Box>
  );
};
```

**C. useLayerActions.ts** (Custom hook for actions)
```typescript
export const useLayerActions = (projectId: string) => {
  const [updateVisibility] = useUpdateLayerVisibilityMutation();
  const [updateHierarchy] = useUpdateLayerHierarchyMutation();
  const dispatch = useAppDispatch();

  const toggleVisibility = useCallback((layerId: string) => {
    // Optimistic update (Redux)
    dispatch(toggleLayerVisibility({ layerId }));

    // Backend sync (RTK Query mutation)
    updateVisibility({ projectId, layerId });
  }, [projectId, dispatch, updateVisibility]);

  const moveLayer = useCallback((
    layerId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => {
    // Optimistic update
    dispatch(moveLayerAction({ layerId, targetId, position }));

    // Get new hierarchy
    const newHierarchy = selectLayers(store.getState());

    // Backend sync
    updateHierarchy({ projectId, hierarchy: newHierarchy });
  }, [projectId, dispatch, updateHierarchy]);

  return {
    toggleVisibility,
    toggleExpansion: ...,
    moveLayer,
    deleteLayer: ...,
    addLayer: ...
  };
};
```

**D. LeftPanel.tsx** (Simplified - only orchestration)
```typescript
export const LeftPanel: React.FC = () => {
  const projectId = useProjectId();
  const layers = useAppSelector(selectLayers);
  const layerActions = useLayerActions(projectId);

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Modals state
  const [addDatasetOpen, setAddDatasetOpen] = useState(false);
  // ...

  return (
    <>
      <Box sx={{ /* sidebar styles */ }}>
        {/* Header */}
        <Box>
          <LayerToolbar onAdd={() => setAddDatasetOpen(true)} />
          <SearchBar value={searchFilter} onChange={setSearchFilter} />
        </Box>

        {/* Content */}
        <LayerTree
          layers={layers}
          selectedLayerId={selectedLayerId}
          searchFilter={searchFilter}
          onLayerSelect={setSelectedLayerId}
          onToggleVisibility={layerActions.toggleVisibility}
          onMoveLayer={layerActions.moveLayer}
        />

        {/* Properties Panel */}
        {selectedLayerId && (
          <PropertiesPanel layerId={selectedLayerId} />
        )}
      </Box>

      {/* Modals */}
      <AddDatasetModal open={addDatasetOpen} onClose={() => setAddDatasetOpen(false)} />
      {/* ... other modals */}
    </>
  );
};
```

**Benefity:**
- ✅ Mniejsze komponenty (< 200 linii każdy)
- ✅ Łatwiejsze testowanie (unit tests dla każdego)
- ✅ Lepsze DX (łatwiej znaleźć kod)
- ✅ Reusability (komponenty można użyć gdzie indziej)

#### ✅ **Faza 5: Error Handling & User Feedback**

**Cel:** User-friendly error messages i loading states

**A. Error Boundaries:**
```typescript
// src/components/ErrorBoundary.tsx
export class LayerTreeErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          <AlertTitle>Błąd ładowania drzewa warstw</AlertTitle>
          {this.state.error.message}
          <Button onClick={() => window.location.reload()}>
            Odśwież stronę
          </Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}

// Usage
<LayerTreeErrorBoundary>
  <LayerTree ... />
</LayerTreeErrorBoundary>
```

**B. Loading States (RTK Query):**
```typescript
const { data: layers, isLoading, isError, error } = useGetProjectLayersQuery(projectId);

if (isLoading) {
  return (
    <Box sx={{ p: 3 }}>
      <CircularProgress />
      <Typography>Ładowanie warstw...</Typography>
    </Box>
  );
}

if (isError) {
  return (
    <Alert severity="error">
      Błąd ładowania warstw: {error.message}
      <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
    </Alert>
  );
}

return <LayerTree layers={layers} />;
```

**C. Mutation Feedback (Toast Notifications):**
```typescript
import { useSnackbar } from 'notistack';

const { enqueueSnackbar } = useSnackbar();

const [moveLayer] = useMoveLayerMutation();

const handleMove = async (layerId, targetId, position) => {
  try {
    await moveLayer({ layerId, targetId, position }).unwrap();
    enqueueSnackbar('Warstwa przeniesiona pomyślnie', { variant: 'success' });
  } catch (error) {
    enqueueSnackbar(`Błąd: ${error.message}`, { variant: 'error' });
  }
};
```

**Benefity:**
- ✅ User widzi co się dzieje
- ✅ Graceful error recovery
- ✅ Better UX

---

### 6.3 Migration Plan (Step-by-Step)

#### **Krok 1: Przygotowanie (Week 1)**

**Zadania:**
- [ ] Stwórz nowe typy: `src/typy/layers.ts` (unified Layer type)
- [ ] Dodaj nowe Redux actions do `layersSlice.ts`:
  - `toggleLayerVisibility`
  - `toggleLayerExpansion`
  - `moveLayer`
  - `reorderLayers`
- [ ] Napisz testy jednostkowe dla nowych reducers
- [ ] Code review + merge to `main`

**Deliverable:** Redux state management gotowy (bez backend sync)

#### **Krok 2: Backend API (Week 2)**

**Zadania:**
- [ ] Backend: Dodaj endpoint `PATCH /api/projects/{id}/layers/{layerId}/visibility`
- [ ] Backend: Dodaj endpoint `PUT /api/projects/{id}/layers/hierarchy`
- [ ] Backend: Napisz testy API (Postman/curl)
- [ ] Frontend: Dodaj RTK Query mutations do `layersApi.ts`
- [ ] Frontend: Napisz testy integracyjne
- [ ] Code review + merge to `main`

**Deliverable:** Backend API gotowy i przetestowany

#### **Krok 3: Refactor LeftPanel (Week 3)**

**Zadania:**
- [ ] Extract components:
  - [ ] `LayerItem.tsx`
  - [ ] `LayerGroupItem.tsx`
  - [ ] `DropIndicators.tsx`
- [ ] Extract hooks:
  - [ ] `useLayerActions.ts`
  - [ ] `useLayerSelection.ts`
- [ ] Refactor `LeftPanel.tsx` → orchestration only
- [ ] Update all imports
- [ ] Verify functionality (manual testing)
- [ ] Code review + merge to `main`

**Deliverable:** Komponenty rozdzielone, łatwiejsze w utrzymaniu

#### **Krok 4: Connect Redux to Components (Week 4)**

**Zadania:**
- [ ] Replace local state with Redux selectors
- [ ] Connect mutations to UI actions
- [ ] Remove `convertLayerNodeToWarstwa` (no longer needed)
- [ ] Add optimistic updates
- [ ] Add error handling (ErrorBoundary, Toast notifications)
- [ ] Comprehensive testing (E2E)
- [ ] Code review + merge to `main`

**Deliverable:** Fully integrated Redux + Backend sync

#### **Krok 5: Polish & Documentation (Week 5)**

**Zadania:**
- [ ] Add Storybook stories for all components
- [ ] Write comprehensive documentation (this file + JSDoc comments)
- [ ] Performance optimization (React.memo, useMemo, useCallback)
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Final code review
- [ ] Deploy to production

**Deliverable:** Production-ready refactored Layer Tree

---

### 6.4 Testing Strategy

#### **Unit Tests (Jest + React Testing Library)**

```typescript
// layersSlice.test.ts
describe('layersSlice', () => {
  describe('toggleLayerVisibility', () => {
    it('should toggle visibility for single layer', () => {
      const state = {
        layers: [
          { id: '1', name: 'Layer 1', visible: true, type: 'vector' }
        ]
      };

      const newState = layersSlice.reducer(
        state,
        toggleLayerVisibility({ layerId: '1' })
      );

      expect(newState.layers[0].visible).toBe(false);
    });

    it('should cascade visibility to children when toggling group', () => {
      const state = {
        layers: [
          {
            id: 'group1',
            name: 'Group 1',
            type: 'group',
            visible: true,
            children: [
              { id: 'layer1', name: 'Layer 1', type: 'vector', visible: true }
            ]
          }
        ]
      };

      const newState = layersSlice.reducer(
        state,
        toggleLayerVisibility({ layerId: 'group1' })
      );

      expect(newState.layers[0].visible).toBe(false);
      expect(newState.layers[0].children[0].visible).toBe(false);
    });
  });

  describe('moveLayer', () => {
    it('should move layer before target', () => { ... });
    it('should move layer after target', () => { ... });
    it('should move layer inside group', () => { ... });
    it('should prevent circular references', () => { ... });
  });
});

// LayerItem.test.tsx
describe('LayerItem', () => {
  it('should render layer name', () => { ... });
  it('should call onToggleVisibility when checkbox clicked', () => { ... });
  it('should call onSelect when layer clicked', () => { ... });
  it('should show action buttons on hover', () => { ... });
});

// useDragDrop.test.ts
describe('useDragDrop', () => {
  describe('findElementPath', () => {
    it('should find path for nested element', () => { ... });
    it('should return null for non-existent element', () => { ... });
  });

  describe('isDescendant', () => {
    it('should detect descendant correctly', () => { ... });
    it('should return false for non-descendant', () => { ... });
  });
});
```

#### **Integration Tests (Cypress)**

```typescript
// cypress/e2e/layer-tree.cy.ts
describe('Layer Tree Integration', () => {
  beforeEach(() => {
    cy.visit('/map?project=testnumr1');
    cy.wait('@getProjectLayers'); // Wait for API
  });

  it('should load and display layers from backend', () => {
    cy.get('[data-testid="layer-tree"]').should('be.visible');
    cy.get('[data-testid="layer-item"]').should('have.length.greaterThan', 0);
  });

  it('should toggle layer visibility', () => {
    // Find first layer checkbox
    cy.get('[data-testid="layer-item"]').first()
      .find('input[type="checkbox"]').as('checkbox');

    // Checkbox should be checked initially
    cy.get('@checkbox').should('be.checked');

    // Click to toggle
    cy.get('@checkbox').click();

    // Should be unchecked
    cy.get('@checkbox').should('not.be.checked');

    // Backend should be called
    cy.wait('@updateLayerVisibility');
  });

  it('should expand/collapse groups', () => {
    // Find first group
    cy.get('[data-testid="layer-group"]').first().as('group');

    // Initially expanded (children visible)
    cy.get('@group').find('[data-testid="layer-item"]').should('be.visible');

    // Click arrow to collapse
    cy.get('@group').find('[data-testid="expand-arrow"]').click();

    // Children should be hidden
    cy.get('@group').find('[data-testid="layer-item"]').should('not.be.visible');
  });

  it('should drag and drop layer to reorder', () => {
    cy.get('[data-testid="layer-item"]').eq(0).as('source');
    cy.get('[data-testid="layer-item"]').eq(1).as('target');

    // Drag source to target
    cy.get('@source').drag('@target', { position: 'top' });

    // Should show drop indicator
    cy.get('[data-testid="drop-indicator"]').should('be.visible');

    // Drop
    cy.get('@source').trigger('drop');

    // Backend should be called
    cy.wait('@updateLayerHierarchy');

    // Order should change
    cy.get('[data-testid="layer-item"]').eq(0).should('have.text', 'Original Layer 2');
  });

  it('should prevent circular drop (group into its own child)', () => {
    cy.get('[data-testid="layer-group"]').first().as('group');
    cy.get('@group').find('[data-testid="layer-item"]').first().as('child');

    // Try to drag group into its own child
    cy.get('@group').drag('@child');

    // Should not show drop indicator (invalid target)
    cy.get('[data-testid="drop-indicator"]').should('not.exist');
  });
});
```

#### **E2E Tests (Playwright)**

```typescript
// tests/e2e/layer-tree-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Layer Tree Complete Workflow', () => {
  test('should perform complete layer management workflow', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Open project
    await page.goto('/map?project=testnumr1');
    await expect(page.locator('[data-testid="layer-tree"]')).toBeVisible();

    // 3. Verify initial layer count
    const initialLayerCount = await page.locator('[data-testid="layer-item"]').count();
    expect(initialLayerCount).toBeGreaterThan(0);

    // 4. Add new layer
    await page.click('[data-testid="add-layer-button"]');
    await page.fill('input[name="layerName"]', 'Test Layer E2E');
    await page.selectOption('select[name="geometryType"]', 'polygon');
    await page.click('button[type="submit"]');

    // Wait for layer to appear
    await expect(page.locator('text=Test Layer E2E')).toBeVisible();

    // 5. Toggle visibility
    const testLayer = page.locator('[data-testid="layer-item"]:has-text("Test Layer E2E")');
    const checkbox = testLayer.locator('input[type="checkbox"]');
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // 6. Drag & drop to reorder
    const sourceLayer = page.locator('[data-testid="layer-item"]').first();
    const targetLayer = page.locator('[data-testid="layer-item"]').nth(1);
    await sourceLayer.dragTo(targetLayer, { targetPosition: { x: 10, y: 10 } });

    // 7. Delete layer
    await testLayer.click();
    await page.click('[data-testid="delete-layer-button"]');
    await page.click('button:has-text("Potwierdź")');
    await expect(page.locator('text=Test Layer E2E')).not.toBeVisible();

    // 8. Verify final state matches backend
    await page.reload();
    const finalLayerCount = await page.locator('[data-testid="layer-item"]').count();
    expect(finalLayerCount).toBe(initialLayerCount); // Back to original
  });
});
```

---

### 6.5 Performance Optimization

#### **React.memo dla Components**

```typescript
// LayerItem.tsx
export const LayerItem = React.memo<LayerItemProps>(({ layer, ... }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.layer.id === nextProps.layer.id &&
    prevProps.layer.visible === nextProps.layer.visible &&
    prevProps.selected === nextProps.selected &&
    prevProps.dragState.draggedItem === nextProps.dragState.draggedItem
  );
});
```

#### **useMemo dla Drogich Obliczeń**

```typescript
const filteredLayers = useMemo(() => {
  if (!searchFilter) return layers;
  return filterLayersRecursive(layers, searchFilter);
}, [layers, searchFilter]);
```

#### **useCallback dla Event Handlers**

```typescript
const handleToggleVisibility = useCallback((layerId: string) => {
  dispatch(toggleLayerVisibility({ layerId }));
}, [dispatch]);

const handleMove = useCallback((layerId: string, targetId: string) => {
  dispatch(moveLayer({ layerId, targetId, position: 'before' }));
}, [dispatch]);
```

#### **Virtualization dla Dużych Drzew (react-window)**

```typescript
import { FixedSizeList } from 'react-window';

// Jeśli layers.length > 100
if (layers.length > 100) {
  return (
    <FixedSizeList
      height={600}
      itemCount={layers.length}
      itemSize={40}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <LayerItem layer={layers[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## 7. Podsumowanie

### 7.1 Obecny Stan Systemu

**Dane:**
- ✅ Redux Store: 14 warstw z backendu (testnumr1.qgs)
- ✅ Local State: Synchronizacja automatyczna przez useEffect
- ✅ Konwersja typów: `LayerNode → Warstwa` działa poprawnie

**Funkcjonalności:**
- ✅ Hierarchiczne renderowanie (grupy + dzieci, rekurencyjnie)
- ✅ Drag & Drop (reorder, group drop, main level drop)
- ✅ Toggle visibility (z cascade do dzieci)
- ✅ Expand/Collapse grup
- ✅ Search/Filter (rekurencyjne)
- ✅ Visual feedback (animacje, kolory, wskaźniki)
- ✅ Action buttons (zoom to layer, show attributes)

**Problemy:**
- ❌ Duplikacja stanu (Redux + Local)
- ❌ Brak backend sync (zmiany gubią się po refresh)
- ❌ Zbyt duży LeftPanel (693 linie)
- ❌ Brak type safety (2 różne typy)
- ❌ Brak error handling

### 7.2 Po Refactorze

**Architektura:**
- ✅ Redux jako Single Source of Truth
- ✅ RTK Query mutations → Backend sync
- ✅ Unified Layer type (no conversions)
- ✅ Smaller components (< 200 lines each)
- ✅ Custom hooks (useLayerActions, useLayerSelection)
- ✅ Error Boundaries + Toast notifications
- ✅ Loading states everywhere

**Benefity:**
- ✅ Persystencja danych (backend sync)
- ✅ Lepszy DX (Developer Experience)
- ✅ Łatwiejsze testowanie
- ✅ Lepszy UX (loading states, error messages)
- ✅ Better performance (React.memo, virtualization)
- ✅ Maintainability (small components, clear structure)

---

## 8. Appendix

### 8.1 Debugging Tips

**Problem: React key warnings**
```typescript
// ZAWSZE dodaj key w .map()
{layers.map(layer => (
  <Box key={layer.id}>  {/* ← KEY TUTAJ */}
    {renderLayerItem(layer)}
  </Box>
))}
```

**Problem: Drag & Drop nie działa**
```typescript
// Sprawdź czy handleDragOver ustawia dropEffect
const handleDragOver = (e: any) => {
  e.preventDefault(); // ← KONIECZNE!
  e.dataTransfer.dropEffect = 'move'; // ← KONIECZNE!
};
```

**Problem: Layers nie ładują się**
```typescript
// Sprawdź console logs:
console.log('🔄 LeftPanel: Updating layers from Redux:', reduxLayers.length);

// Sprawdź Redux DevTools:
// state.layers.layers powinien zawierać dane
```

**Problem: Zmiany gubią się po refresh**
```typescript
// To normalne - brak backend sync!
// Po refactorze (RTK Query mutations) problem zniknie
```

### 8.2 Useful Console Commands

```javascript
// Sprawdź stan Redux w konsoli przeglądarki
window.__REDUX_DEVTOOLS_EXTENSION__.store.getState().layers

// Sprawdź wszystkie warstwy
console.table(layers)

// Znajdź warstwę po ID
const layer = findLayerById(layers, 'some-id');
console.log(layer);

// Sprawdź dragDropState
console.log({
  draggedItem: dragDropState.draggedItem,
  dropTarget: dragDropState.dropTarget,
  dropPosition: dragDropState.dropPosition,
  showMainLevelZone: dragDropState.showMainLevelZone
});
```

### 8.3 Resources & Links

**Dokumentacja:**
- [React Docs - Lists and Keys](https://react.dev/learn/rendering-lists)
- [Redux Toolkit - createSlice](https://redux-toolkit.js.org/api/createSlice)
- [RTK Query - Mutations](https://redux-toolkit.js.org/rtk-query/usage/mutations)
- [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

**Libraries:**
- [react-window](https://github.com/bvaughn/react-window) - Virtualization
- [notistack](https://github.com/iamhosseindhv/notistack) - Toast notifications
- [Playwright](https://playwright.dev/) - E2E testing

**Backend:**
- Django REST Framework: https://www.django-rest-framework.org/
- QGS File Format: https://docs.qgis.org/3.28/en/docs/user_manual/appendices/qgis_file_formats.html

---

**Koniec dokumentacji**

Wersja: 1.0
Data: 2025-01-11
Autor: Claude (Anthropic)
Status: ✅ Kompletna
