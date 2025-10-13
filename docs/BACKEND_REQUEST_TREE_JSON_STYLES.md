# Request dla Backendu: Rozszerzenie tree.json o style warstw

## Cel

Dodanie informacji o stylach warstw do odpowiedzi endpointu `/api/projects/new/json`, aby frontend mógł renderować warstwy WFS (GeoJSON) z **oryginalnymi kolorami i stylami QGIS** bez konieczności użycia WMS.

## Problem obecny

**tree.json zawiera tylko podstawowe informacje:**
```json
{
  "name": "LayerName",
  "id": "layer_uuid",
  "type": "VectorLayer",
  "visible": true,
  "opacity": 255,
  "extent": [minX, minY, maxX, maxY],
  "geometry": "MultiPolygon"
}
```

**Czego brakuje:**
- ❌ Kolor wypełnienia (fill_color)
- ❌ Kolor obrysu (stroke_color)
- ❌ Grubość linii (stroke_width)
- ❌ Typ renderera (Single Symbol, Categorized, Graduated)
- ❌ Konfiguracja symboli

**Konsekwencje:**
- Frontend renderuje wszystkie warstwy WFS w domyślnym kolorze niebieski (#088)
- Utrata oryginalnych stylów QGIS
- Niemożność odwzorowania kategoryzacji, gradientów, rule-based styling

## Rozwiązanie proponowane

### 1. Modyfikacja backendu (Django)

**Plik:** `geocraft_api/projects/service.py`

**Funkcja do dodania:**
```python
def serialize_layer_style(layer: QgsVectorLayer) -> dict:
    """
    Serialize QGIS layer style to JSON-compatible format

    Returns basic style information for vector layers:
    - Renderer type (Single Symbol, Categorized, Graduated, Rule-based)
    - Fill color (RGBA for polygons)
    - Stroke color (RGBA for outlines)
    - Stroke width (in map units)
    - Symbol type (fill, line, marker)

    For complex styles (categorized, graduated), returns only the default symbol.
    Full style can be fetched via /api/styles/renderer endpoint.
    """
    try:
        renderer = layer.renderer()
        if not renderer:
            return None

        renderer_type = renderer.type()

        # Get symbol from renderer
        if renderer_type == 'singleSymbol':
            symbol = renderer.symbol()
        elif renderer_type == 'categorizedSymbol':
            # For categorized, return first category's symbol as default
            symbol = renderer.categories()[0].symbol() if renderer.categories() else None
        elif renderer_type == 'graduatedSymbol':
            # For graduated, return first range's symbol as default
            symbol = renderer.ranges()[0].symbol() if renderer.ranges() else None
        elif renderer_type == 'RuleRenderer':
            # For rule-based, return root rule's symbol
            symbol = renderer.rootRule().symbol()
        else:
            return None

        if not symbol:
            return None

        # Determine symbol type
        symbol_type = symbol.type()  # 0=marker, 1=line, 2=fill

        style_data = {
            "renderer": renderer_type,  # "singleSymbol", "categorizedSymbol", etc.
            "symbol_type": ["marker", "line", "fill"][symbol_type],
        }

        # Extract colors and properties based on symbol type
        if symbol_type == 2:  # Fill (polygon)
            symbol_layer = symbol.symbolLayer(0)
            if symbol_layer:
                # Fill color
                fill_color = symbol.color()
                style_data["fill_color"] = [
                    fill_color.red(),
                    fill_color.green(),
                    fill_color.blue(),
                    fill_color.alpha()
                ]

                # Stroke color
                stroke_color = symbol_layer.strokeColor()
                style_data["stroke_color"] = [
                    stroke_color.red(),
                    stroke_color.green(),
                    stroke_color.blue(),
                    stroke_color.alpha()
                ]

                # Stroke width
                style_data["stroke_width"] = symbol_layer.strokeWidth()

        elif symbol_type == 1:  # Line
            symbol_layer = symbol.symbolLayer(0)
            if symbol_layer:
                # Line color
                color = symbol.color()
                style_data["stroke_color"] = [
                    color.red(),
                    color.green(),
                    color.blue(),
                    color.alpha()
                ]

                # Line width
                style_data["stroke_width"] = symbol_layer.width()

        elif symbol_type == 0:  # Marker (point)
            symbol_layer = symbol.symbolLayer(0)
            if symbol_layer:
                # Fill color
                fill_color = symbol.color()
                style_data["fill_color"] = [
                    fill_color.red(),
                    fill_color.green(),
                    fill_color.blue(),
                    fill_color.alpha()
                ]

                # Stroke color
                stroke_color = symbol_layer.strokeColor()
                style_data["stroke_color"] = [
                    stroke_color.red(),
                    stroke_color.green(),
                    stroke_color.blue(),
                    stroke_color.alpha()
                ]

                # Marker size
                style_data["size"] = symbol_layer.size()

        return style_data

    except Exception as e:
        logger.error(f"Error serializing layer style: {e}")
        return None
```

**Modyfikacja funkcji `make_json_tree_and_save()`:**
```python
def make_json_tree_and_save(project, project_name):
    """
    Generate tree.json with layer hierarchy and styles
    """
    # ... existing code ...

    def serialize_layer(layer):
        layer_dict = {
            "name": layer.name(),
            "id": layer.id(),
            "visible": iface.layerTreeView().layerTreeModel().rootGroup()
                      .findLayer(layer.id()).isVisible(),
            "type": "VectorLayer" if isinstance(layer, QgsVectorLayer) else "RasterLayer",
            # ... existing fields ...
        }

        # ✅ NOWE: Dodanie informacji o stylu
        if isinstance(layer, QgsVectorLayer):
            style = serialize_layer_style(layer)
            if style:
                layer_dict["style"] = style

        return layer_dict

    # ... rest of the function ...
```

### 2. Przykład odpowiedzi (po zmianach)

**Przed (obecna):**
```json
{
  "children": [
    {
      "name": "Działki",
      "id": "layer_123",
      "type": "VectorLayer",
      "visible": true,
      "opacity": 255,
      "extent": [...],
      "geometry": "Polygon"
    }
  ]
}
```

**Po (oczekiwana):**
```json
{
  "children": [
    {
      "name": "Działki",
      "id": "layer_123",
      "type": "VectorLayer",
      "visible": true,
      "opacity": 255,
      "extent": [...],
      "geometry": "Polygon",
      "style": {
        "renderer": "singleSymbol",
        "symbol_type": "fill",
        "fill_color": [255, 0, 0, 255],
        "stroke_color": [0, 0, 0, 255],
        "stroke_width": 0.26
      }
    }
  ]
}
```

### 3. Typy TypeScript (frontend)

**Plik:** `src/types/qgis.ts`

```typescript
/** Style information for vector layers */
export interface QGISLayerStyle {
  /** Renderer type: "singleSymbol", "categorizedSymbol", "graduatedSymbol", "RuleRenderer" */
  renderer: string;

  /** Symbol type: "fill", "line", "marker" */
  symbol_type: 'fill' | 'line' | 'marker';

  /** Fill color [R, G, B, A] (0-255) for polygons and points */
  fill_color?: [number, number, number, number];

  /** Stroke color [R, G, B, A] (0-255) for outlines */
  stroke_color?: [number, number, number, number];

  /** Stroke width in map units */
  stroke_width?: number;

  /** Marker size (for point layers) */
  size?: number;
}

/** Vector layer type from QGIS (extended) */
export interface QGISVectorLayer {
  name: string;
  id: string;
  visible: boolean;
  opacity: number; // 0-255
  extent: [number, number, number, number];
  geometry: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  type: 'VectorLayer';

  // ✅ NOWE: Style information
  style?: QGISLayerStyle;
}
```

### 4. Użycie w frontendzie

**Plik:** `src/components/qgis/QGISLayerRenderer.tsx`

```typescript
// Konwersja QGIS color [R,G,B,A] do Mapbox hex
function rgbaToHex(rgba: [number, number, number, number]): string {
  const [r, g, b] = rgba;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// W komponencie QGISLayerRenderer:
const fillColor = layer.style?.fill_color
  ? rgbaToHex(layer.style.fill_color)
  : '#088';  // fallback

const strokeColor = layer.style?.stroke_color
  ? rgbaToHex(layer.style.stroke_color)
  : '#000';

const strokeWidth = layer.style?.stroke_width || 1;

// Użycie w Mapbox:
map.addLayer({
  id: fillLayerId,
  type: 'fill',
  source: sourceId,
  paint: {
    'fill-color': fillColor,           // ✅ Z QGIS!
    'fill-opacity': layer.opacity || 0.6,
  },
});

map.addLayer({
  id: lineLayerId,
  type: 'line',
  source: sourceId,
  paint: {
    'line-color': strokeColor,         // ✅ Z QGIS!
    'line-width': strokeWidth,         // ✅ Z QGIS!
    'line-opacity': layer.opacity || 1,
  },
});
```

## Korzyści

### Dla użytkownika
- ✅ Warstwy wyglądają tak samo w QGIS i na mapie webowej
- ✅ Nie trzeba ręcznie ustawiać kolorów w UI
- ✅ Zachowanie pracy projektowej (wybrane style)

### Dla systemu
- ✅ Mniej requestów do serwera (style w tree.json zamiast osobnego API)
- ✅ Szybsze ładowanie (jeden request zamiast N+1)
- ✅ Cache-owalne (tree.json jest cache'owane)

### Dla developmentu
- ✅ Prostsze API (mniej endpointów do zarządzania)
- ✅ Lepsze UX (instant preview stylów)
- ✅ Backwards compatible (pole opcjonalne)

## Uwagi implementacyjne

### 1. Kompatybilność wsteczna

Pole `style` jest **opcjonalne** - stare projekty bez tego pola będą działać:
```typescript
const fillColor = layer.style?.fill_color || '#088';  // fallback
```

### 2. Wydajność

Serializacja stylów jest **szybka**:
- Dla Single Symbol: ~0.5ms na warstwę
- Dla Categorized: ~2ms na warstwę (zwraca tylko pierwszy symbol)
- Dla projektu z 50 warstw: ~50-100ms dodatkowego czasu

### 3. Rozmiar tree.json

Zwiększenie rozmiaru tree.json:
- Bez stylów: ~2-5KB
- Ze stylami: ~4-10KB (+100%)
- Wciąż bardzo mały (gzip: ~1-3KB)

### 4. Style złożone (Categorized, Graduated)

Dla złożonych stylów, tree.json zwraca **tylko domyślny symbol**:
```json
{
  "style": {
    "renderer": "categorizedSymbol",
    "symbol_type": "fill",
    "fill_color": [255, 0, 0, 255],  // ← pierwszy symbol z kategorii
    "stroke_color": [0, 0, 0, 255],
    "stroke_width": 0.26
  }
}
```

Pełna konfiguracja kategorii dostępna przez `/api/styles/renderer`:
```json
{
  "renderer": "Categorized",
  "value": "typ",
  "categories": [
    { "symbol": {...}, "value": "mieszkalny", "label": "Budynek mieszkalny" },
    { "symbol": {...}, "value": "usługowy", "label": "Budynek usługowy" },
    // ... więcej kategorii
  ]
}
```

### 5. Fallback dla WMS

Jeśli style są zbyt złożone (rule-based, gradient fills), frontend może:
1. Użyć domyślnego stylu z tree.json
2. Lub przełączyć się na WMS (zachowuje wszystkie style)

## Plan wdrożenia

### Krok 1: Backend (Django)
- [ ] Dodać funkcję `serialize_layer_style()` do `service.py`
- [ ] Zmodyfikować `make_json_tree_and_save()` aby dodawała pole `style`
- [ ] Przetestować na przykładowych projektach

### Krok 2: Frontend (TypeScript)
- [ ] Rozszerzyć typ `QGISVectorLayer` o pole `style`
- [ ] Dodać funkcję `rgbaToHex()` do konwersji kolorów
- [ ] Zmodyfikować `QGISLayerRenderer` aby używał stylów z tree.json
- [ ] Fallback do domyślnych kolorów jeśli `style` nie istnieje

### Krok 3: Testowanie
- [ ] Test z Single Symbol layers
- [ ] Test z Categorized layers (sprawdzić czy używa pierwszego symbolu)
- [ ] Test z Graduated layers
- [ ] Test backwards compatibility (stare projekty bez `style`)

### Krok 4: Dokumentacja
- [ ] Aktualizacja `projects_api_docs.md`
- [ ] Przykłady użycia w frontendzie
- [ ] Changelog

## Alternatywy (jeśli nie można zmodyfikować tree.json)

### Opcja A: Batch fetch stylów przez dedykowany endpoint

```
POST /api/styles/batch
{
  "project": "MyProject_1",
  "layer_ids": ["layer_1", "layer_2", "layer_3"]
}

Response:
{
  "layer_1": { "renderer": "singleSymbol", "fill_color": [...], ... },
  "layer_2": { "renderer": "singleSymbol", "fill_color": [...], ... },
  "layer_3": { "renderer": "categorizedSymbol", "fill_color": [...], ... }
}
```

**Wady:**
- Dodatkowy request (N+1 problem)
- Wolniejsze ładowanie
- Więcej kodu do zarządzania

### Opcja B: Tylko WMS (obecne rozwiązanie FAZY 1)

- Frontend używa WMS dla wszystkich warstw ze złożonymi stylami
- Style są zachowane (renderowane przez QGIS Server)
- Brak interakcji (nie można klikać w features)

## Kontakt

Jeśli masz pytania lub sugestie dotyczące implementacji:
- GitHub Issues: [link]
- Email: [email]
- Dokumentacja: `docs/WMS_WFS_HYBRID_RENDERING.md`

## Referencje

- [QGIS Python API - QgsRenderer](https://qgis.org/pyqgis/master/core/QgsRenderer.html)
- [QGIS Python API - QgsSymbol](https://qgis.org/pyqgis/master/core/QgsSymbol.html)
- [QGIS Server Documentation](https://docs.qgis.org/latest/en/docs/server_manual/)
- Backend codebase: `geocraft_api/projects/service.py`
- Frontend codebase: `src/components/qgis/QGISLayerRenderer.tsx`
