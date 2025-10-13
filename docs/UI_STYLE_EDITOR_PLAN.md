# Plan UI: Edytor stylów warstw (FAZA 3)

## Przegląd

System edycji stylów warstw zintegrowany z LeftPanel, pozwalający na:
- Zmianę kolorów warstw (fill, stroke)
- Zmianę grubości linii
- Zmianę typu renderera (Single Symbol, Categorized, Graduated)
- Automatyczną klasyfikację wartości według symboli
- Podgląd miniaturki symbolu

## Komponenty UI

### 1. LayerStylePanel (`src/features/warstwy/komponenty/LayerStylePanel.tsx`)

Panel stylowania wyświetlany w LeftPanel pod drzewem warstw.

**Struktura:**
```
┌─────────────────────────────────────┐
│ 🎨 Styl warstwy: Działki            │
│ ─────────────────────────────────── │
│                                     │
│ Renderer: [Single Symbol ▼]        │
│                                     │
│ Kolor wypełnienia:                  │
│ [████████] #ff0000                  │
│                                     │
│ Kolor obrysu:                       │
│ [████████] #000000                  │
│                                     │
│ Grubość obrysu:                     │
│ [━━━━━●────────] 2.5                │
│                                     │
│ Przezroczystość:                    │
│ [━━━━━━━━●──────] 80%               │
│                                     │
│ [Zapisz]  [Resetuj]  [Anuluj]      │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface LayerStylePanelProps {
  layer: LayerNode;
  projectName: string;
  onClose: () => void;
  onStyleChanged: (layerId: string, newStyle: LayerStyle) => void;
}
```

**Features:**
- ✅ Color picker dla fill i stroke
- ✅ Slider dla grubości i opacity
- ✅ Dropdown dla typu renderera
- ✅ Live preview na mapie (opcjonalnie)
- ✅ Zapisanie do backendu przez API

### 2. ColorPicker (`src/features/warstwy/komponenty/ColorPicker.tsx`)

Komponent wyboru koloru z podglądem.

**Wygląd:**
```
┌─────────────────┐
│ Kolor:          │
│ [████] #ff0000  │  ← Kliknięcie otwiera picker
└─────────────────┘

Po kliknięciu:
┌─────────────────────────────┐
│ Wybierz kolor               │
│ ┌─────────────────────────┐ │
│ │   [Paleta kolorów]      │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ RGB: 255, 0, 0              │
│ Hex: #ff0000                │
│ Alpha: [━━━━━━━━●──] 100%   │
│                             │
│ [OK]  [Anuluj]              │
└─────────────────────────────┘
```

**Props:**
```typescript
interface ColorPickerProps {
  label: string;
  value: string;  // hex color
  alpha?: number;  // 0-1
  onChange: (color: string, alpha?: number) => void;
}
```

**Biblioteka:** `react-color` lub `@mui/material` (ColorPicker w MUI X)

### 3. RendererSelector (`src/features/warstwy/komponenty/RendererSelector.tsx`)

Dropdown z wyborem typu renderera + konfiguracja.

**Single Symbol:**
```
┌────────────────────────────────┐
│ Typ: [Single Symbol ▼]        │
│                                │
│ [████] Kolor: #ff0000          │
│ [━━━━●────] Grubość: 2.5       │
└────────────────────────────────┘
```

**Categorized:**
```
┌────────────────────────────────┐
│ Typ: [Categorized ▼]           │
│                                │
│ Klasyfikuj według: [typ ▼]    │
│                                │
│ Kategorie:                     │
│ ┌────────────────────────────┐ │
│ │ [████] mieszkalny      [×] │ │
│ │ [████] usługowy        [×] │ │
│ │ [████] przemysłowy     [×] │ │
│ └────────────────────────────┘ │
│                                │
│ [+ Dodaj kategorię]            │
│ [🎲 Automatyczna klasyfikacja] │
└────────────────────────────────┘
```

**Props:**
```typescript
interface RendererSelectorProps {
  layer: LayerNode;
  projectName: string;
  currentRenderer: string;
  onRendererChange: (renderer: string, config: any) => void;
}
```

### 4. CategoryList (`src/features/warstwy/komponenty/CategoryList.tsx`)

Lista kategorii dla renderera Categorized.

**Wygląd:**
```
┌────────────────────────────────┐
│ Kategorie (5):                 │
│ ─────────────────────────────  │
│                                │
│ [████] mieszkalny         [✏] │
│ [████] usługowy           [✏] │
│ [████] przemysłowy        [✏] │
│ [████] rolny              [✏] │
│ [████] pozostałe          [✏] │
│                                │
│ [+ Dodaj kategorię]            │
└────────────────────────────────┘
```

Kliknięcie [✏] otwiera modal do edycji kategorii:
```
┌─────────────────────────────────┐
│ Edytuj kategorię                │
│ ─────────────────────────────   │
│                                 │
│ Wartość: [mieszkalny_______]    │
│ Etykieta: [Budynek mieszkalny]  │
│                                 │
│ Kolor: [████] #ff0000           │
│ Grubość: [━━●────] 2.0          │
│                                 │
│ [Zapisz]  [Anuluj]  [Usuń]     │
└─────────────────────────────────┘
```

**Props:**
```typescript
interface CategoryListProps {
  categories: Category[];
  onCategoryChange: (index: number, category: Category) => void;
  onCategoryDelete: (index: number) => void;
  onCategoryAdd: () => void;
}

interface Category {
  value: string;
  label: string;
  symbol: {
    fill_color: [number, number, number, number];
    stroke_color: [number, number, number, number];
    stroke_width: number;
  };
}
```

### 5. AutoClassifyDialog (`src/features/warstwy/komponenty/AutoClassifyDialog.tsx`)

Dialog automatycznej klasyfikacji wartości.

**Wygląd:**
```
┌────────────────────────────────────┐
│ 🎲 Automatyczna klasyfikacja       │
│ ─────────────────────────────────  │
│                                    │
│ Klasyfikuj według kolumny:         │
│ [typ ▼]                            │
│                                    │
│ Zakres kolorów:                    │
│ Od: [████] #ff0000                 │
│ Do: [████] #0000ff                 │
│                                    │
│ Podgląd:                           │
│ ┌────────────────────────────────┐ │
│ │ [████] mieszkalny (12)         │ │
│ │ [████] usługowy (8)            │ │
│ │ [████] przemysłowy (5)         │ │
│ │ [████] pozostałe (3)           │ │
│ └────────────────────────────────┘ │
│                                    │
│ Znaleziono 4 unikalne wartości     │
│                                    │
│ [Zastosuj]  [Anuluj]               │
└────────────────────────────────────┘
```

**Props:**
```typescript
interface AutoClassifyDialogProps {
  layer: LayerNode;
  projectName: string;
  open: boolean;
  onClose: () => void;
  onApply: (categories: Category[]) => void;
}
```

## Integracja z LeftPanel

### Dodanie przycisku "Styluj" do kontekstowego menu warstwy

**Przed (obecne):**
```
Warstwa
  ├── Zoom do warstwy
  ├── Usuń warstwę
  └── Właściwości
```

**Po (nowe):**
```
Warstwa
  ├── Zoom do warstwy
  ├── 🎨 Styluj warstwę         ← NOWE!
  ├── Usuń warstwę
  └── Właściwości
```

**Implementacja w LeftPanel.tsx:**
```typescript
const handleStyleLayer = (layerId: string) => {
  const layer = findLayerById(layers, layerId);
  if (layer) {
    setActiveStyleLayer(layer);  // Otwiera LayerStylePanel
  }
};

// W render:
{activeStyleLayer && (
  <LayerStylePanel
    layer={activeStyleLayer}
    projectName={projectName}
    onClose={() => setActiveStyleLayer(null)}
    onStyleChanged={handleStyleChanged}
  />
)}
```

### Alternatywa: Panel obok drzewa warstw

```
┌─────────────────────────────────┐
│ Warstwy             [🎨] [+]    │
├─────────────────────────────────┤
│ 📁 Moje warstwy                 │
│   ├── 📊 Działki          [✓]  │  ← Wybrana
│   ├── 🏘️ Budynki          [✓]  │
│   └── 🚗 Drogi            [ ]  │
├─────────────────────────────────┤
│ 🎨 Styl: Działki                │  ← Panel stylowania
│ ────────────────────────────    │
│ Kolor: [████] #ff0000           │
│ Obrys: [████] #000000           │
│ Grubość: [━━●────] 2.5          │
│ Opacity: [━━━━━●──] 80%         │
│                                 │
│ [Zapisz]  [Resetuj]             │
└─────────────────────────────────┘
```

## API Integration (Redux RTK Query)

### StylesApi (`src/redux/api/stylesApi.ts`)

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/lib/api/client';

export const stylesApi = createApi({
  reducerPath: 'stylesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Token ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['LayerStyle'],
  endpoints: (builder) => ({
    /**
     * GET /api/styles/renderer
     * Fetch current layer style
     */
    getLayerStyle: builder.query<LayerStyleResponse, GetLayerStyleRequest>({
      query: ({ project, layer_id, renderer }) => ({
        url: '/api/styles/renderer',
        params: { project, layer_id, renderer },
      }),
      providesTags: (result, error, arg) => [
        { type: 'LayerStyle', id: arg.layer_id },
      ],
    }),

    /**
     * POST /api/styles/set
     * Update layer style
     */
    setLayerStyle: builder.mutation<LayerStyleResponse, SetLayerStyleRequest>({
      query: ({ project, id, style_configuration }) => ({
        url: '/api/styles/set',
        method: 'POST',
        body: { project, id, style_configuration },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LayerStyle', id: arg.id },
        { type: 'Project', id: arg.project },  // Invalidate tree.json
      ],
    }),

    /**
     * POST /api/styles/classify
     * Auto-classify values by column
     */
    classifyValues: builder.mutation<ClassifyResponse, ClassifyRequest>({
      query: ({ project, layer_id, column, rgb_colors }) => ({
        url: '/api/styles/classify',
        method: 'POST',
        body: { project, layer_id, column, rgb_colors },
      }),
    }),

    /**
     * POST /api/styles/symbol/random/color
     * Generate random color symbol
     */
    generateRandomSymbol: builder.mutation<RandomSymbolResponse, RandomSymbolRequest>({
      query: ({ project, layer_id }) => ({
        url: '/api/styles/symbol/random/color',
        method: 'POST',
        body: { project, layer_id },
      }),
    }),

    /**
     * GET /api/styles/renderer/possible
     * Get list of available renderers
     */
    getPossibleRenderers: builder.query<string[], void>({
      query: () => '/api/styles/renderer/possible',
    }),
  }),
});

export const {
  useGetLayerStyleQuery,
  useSetLayerStyleMutation,
  useClassifyValuesMutation,
  useGenerateRandomSymbolMutation,
  useGetPossibleRenderersQuery,
} = stylesApi;
```

### Types

```typescript
// src/api/typy/styles.ts

export interface LayerStyleResponse {
  data: {
    renderer: string;
    symbols?: {
      symbol_type: 'fill' | 'line' | 'marker';
      fill?: {
        color: [number, number, number, number];
        opacity: number;
        unit: number;
      };
      fills?: SymbolLayerConfig[];
    };
    categories?: CategoryConfig[];
    value?: string;  // Column name for categorized
  };
  success: boolean;
  message: string;
}

export interface SymbolLayerConfig {
  symbol_type: string;
  id: string;
  enabled: boolean;
  attributes: {
    fill_color?: [number, number, number, number];
    stroke_color?: [number, number, number, number];
    stroke_width?: {
      width_value: number;
      unit: number;
    };
    fill_style?: number;
    stroke_style?: number;
    join_style?: number;
    offset?: {
      x: number;
      y: number;
      unit: number;
    };
  };
}

export interface CategoryConfig {
  symbol: any;
  value: string;
  label: string;
}

export interface GetLayerStyleRequest {
  project: string;
  layer_id: string;
  renderer?: string;
}

export interface SetLayerStyleRequest {
  project: string;
  id: string;
  style_configuration: {
    renderer: string;
    symbols?: any;
    categories?: CategoryConfig[];
    value?: string;
  };
}

export interface ClassifyRequest {
  project: string;
  layer_id: string;
  column: string;
  rgb_colors?: [number, number, number, number][];
}

export interface ClassifyResponse {
  data: CategoryConfig[];
  success: boolean;
  message: string;
}

export interface RandomSymbolRequest {
  project: string;
  layer_id: string;
}

export interface RandomSymbolResponse {
  data: {
    symbol: any;
    value: string;
    label: string;
  };
  success: boolean;
  message: string;
}
```

## Workflow użytkownika

### Scenariusz 1: Zmiana koloru warstwy (Single Symbol)

1. Użytkownik klika prawym na warstwę "Działki"
2. Wybiera "🎨 Styluj warstwę"
3. Otwiera się LayerStylePanel z obecnym stylem
4. Użytkownik klika na kolor wypełnienia → ColorPicker
5. Wybiera nowy kolor (np. czerwony)
6. Klika "Zapisz"
7. Frontend:
   - Wywołuje `setLayerStyle` mutation
   - Backend aktualizuje styl w QGIS
   - Cache invalidation → tree.json refresh
   - Mapa się odświeża z nowym stylem

### Scenariusz 2: Automatyczna klasyfikacja według kolumny

1. Użytkownik klika "🎨 Styluj warstwę" na "Działki"
2. Zmienia renderer na "Categorized"
3. Wybiera kolumnę "typ"
4. Klika "🎲 Automatyczna klasyfikacja"
5. Dialog pokazuje podgląd kategorii:
   - mieszkalny (12 obiektów) - kolor czerwony
   - usługowy (8 obiektów) - kolor niebieski
   - przemysłowy (5 obiektów) - kolor zielony
6. Klika "Zastosuj"
7. Frontend:
   - Wywołuje `classifyValues` mutation
   - Backend tworzy kategoryzację
   - Zwraca listę kategorii z symbolami
   - Frontend aplikuje kategorie do warstwy

### Scenariusz 3: Ręczna edycja kategorii

1. Użytkownik ma już warstę z Categorized renderer
2. Klika "🎨 Styluj warstwę"
3. Widzi listę kategorii
4. Klika [✏] przy kategorii "mieszkalny"
5. Otwiera się modal edycji
6. Zmienia kolor z czerwonego na pomarańczowy
7. Klika "Zapisz"
8. Frontend:
   - Aktualizuje konfigurację kategorii
   - Wywołuje `setLayerStyle` mutation
   - Mapa się odświeża

## Plik struktury komponentów

```
src/features/warstwy/
├── komponenty/
│   ├── LeftPanel.tsx                 (istniejący, modyfikacja)
│   ├── LayerStylePanel.tsx           (NOWY)
│   ├── ColorPicker.tsx               (NOWY)
│   ├── RendererSelector.tsx          (NOWY)
│   ├── CategoryList.tsx              (NOWY)
│   ├── CategoryEditModal.tsx         (NOWY)
│   └── AutoClassifyDialog.tsx        (NOWY)
├── hooks/
│   └── useLayerStyle.ts              (NOWY)
└── utils/
    ├── colorUtils.ts                 (NOWY - konwersje RGB/Hex)
    └── styleConverter.ts             (NOWY - QGIS ↔ Mapbox)

src/redux/api/
└── stylesApi.ts                      (NOWY)

src/api/typy/
└── styles.ts                         (NOWY)
```

## Oszacowanie czasu implementacji

| Komponent | Czas | Trudność |
|-----------|------|----------|
| stylesApi.ts | 2h | Średnia |
| ColorPicker.tsx | 3h | Łatwa |
| LayerStylePanel.tsx | 4h | Średnia |
| RendererSelector.tsx | 3h | Średnia |
| CategoryList.tsx | 3h | Średnia |
| CategoryEditModal.tsx | 2h | Łatwa |
| AutoClassifyDialog.tsx | 4h | Trudna |
| Integracja z LeftPanel | 2h | Łatwa |
| Konwersje kolorów/stylów | 3h | Średnia |
| Testy i bugfixy | 4h | - |
| **RAZEM** | **30h** | **~4 dni robocze** |

## Priorytety MVP

### Must have (Minimum Viable Product):
- ✅ LayerStylePanel z podstawową edycją (kolor, grubość)
- ✅ ColorPicker
- ✅ Zapisywanie stylu do backendu
- ✅ Live preview na mapie

### Should have:
- ✅ RendererSelector (Single Symbol tylko)
- ✅ Automatyczna klasyfikacja
- ✅ Miniaturki symboli

### Nice to have:
- CategoryList z pełną edycją
- Graduated renderer
- Rule-based renderer
- Import/export stylów
- Historia zmian stylów

## Przykładowy kod MVP

```typescript
// src/features/warstwy/komponenty/LayerStylePanel.tsx
export function LayerStylePanel({ layer, projectName, onClose, onStyleChanged }: LayerStylePanelProps) {
  const [fillColor, setFillColor] = useState(layer.style?.fill_color || [0, 136, 136, 255]);
  const [strokeColor, setStrokeColor] = useState(layer.style?.stroke_color || [0, 0, 0, 255]);
  const [strokeWidth, setStrokeWidth] = useState(layer.style?.stroke_width || 1);

  const [setLayerStyle, { isLoading }] = useSetLayerStyleMutation();

  const handleSave = async () => {
    const styleConfig = {
      renderer: 'Single Symbol',
      symbols: {
        symbol_type: 'fill',
        fill: {
          color: fillColor,
          opacity: 1.0,
          unit: 0
        },
        fills: [{
          symbol_type: 'Simple Fill',
          attributes: {
            fill_color: fillColor,
            stroke_color: strokeColor,
            stroke_width: { width_value: strokeWidth, unit: 0 }
          }
        }]
      }
    };

    try {
      await setLayerStyle({
        project: projectName,
        id: layer.id,
        style_configuration: styleConfig
      }).unwrap();

      onStyleChanged(layer.id, styleConfig);
      onClose();
    } catch (error) {
      console.error('Failed to save style:', error);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#f7f9fc', borderRadius: 1 }}>
      <Typography variant="h6">🎨 Styl warstwy: {layer.name}</Typography>

      <ColorPicker
        label="Kolor wypełnienia"
        value={rgbaToHex(fillColor)}
        onChange={(color) => setFillColor(hexToRgba(color))}
      />

      <ColorPicker
        label="Kolor obrysu"
        value={rgbaToHex(strokeColor)}
        onChange={(color) => setStrokeColor(hexToRgba(color))}
      />

      <Typography>Grubość obrysu</Typography>
      <Slider
        value={strokeWidth}
        onChange={(e, value) => setStrokeWidth(value as number)}
        min={0}
        max={10}
        step={0.1}
      />

      <Button onClick={handleSave} disabled={isLoading}>
        Zapisz
      </Button>
      <Button onClick={onClose}>
        Anuluj
      </Button>
    </Box>
  );
}
```

## Następne kroki

1. **Zaimplementować MVP** (LayerStylePanel + ColorPicker + API)
2. **Przetestować z Single Symbol** layers
3. **Dodać Categorized renderer** (jeśli potrzebne)
4. **User testing** i feedback
5. **Iterate** na podstawie feedbacku

## Referencje

- [Material-UI Color Picker](https://mui.com/x/react-color-picker/)
- [react-color](https://casesandberg.github.io/react-color/)
- Backend API: `Dokumentacja/styles_api_docs.md`
- Podobne implementacje: QGIS Desktop, ArcGIS Online
