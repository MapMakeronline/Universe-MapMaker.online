# Dokumentacja API - Moduł Styles (Stylowanie warstw)

## Spis treści
- [Pobieranie stylu warstwy](#pobieranie-stylu-warstwy)
- [Pobieranie możliwych rendererów](#pobieranie-możliwych-rendererów)
- [Ustawianie stylu warstwy](#ustawianie-stylu-warstwy)
- [Pobieranie bazowego symbolu](#pobieranie-bazowego-symbolu)
- [Generowanie miniaturki symbolu](#generowanie-miniaturki-symbolu)
- [Generowanie symbolu z losowym kolorem](#generowanie-symbolu-z-losowym-kolorem)
- [Klasyfikacja wartości według symboli](#klasyfikacja-wartości-według-symboli)

---

## Pobieranie stylu warstwy

Pobiera aktualny styl renderowania dla warstwy wektorowej.

**Endpoint:** `/api/styles/renderer`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `renderer` | string | Nie | Typ renderera do pobrania ("Single Symbol", "Categorized") |

### Przykład żądania

```
GET /api/styles/renderer?project=moj_projekt&layer_id=layer_123&renderer=Single%20Symbol
```

### Odpowiedź sukcesu (200)

#### Dla Single Symbol:

```json
{
  "data": {
    "renderer": "Single Symbol",
    "symbols": {
      "symbol_type": "fill",
      "id": "0",
      "fill": {
        "color": [255, 0, 0, 255],
        "opacity": 1.0,
        "unit": 0
      },
      "fills": [
        {
          "symbol_type": "Simple Fill",
          "id": "0.0",
          "enabled": true,
          "attributes": {
            "fill_color": [255, 0, 0, 255],
            "fill_style": 1,
            "stroke_color": [0, 0, 0, 255],
            "stroke_width": {
              "width_value": 0.26,
              "unit": 0
            },
            "stroke_style": 1,
            "join_style": 128,
            "offset": {
              "x": 0.0,
              "y": 0.0,
              "unit": 0
            }
          }
        }
      ]
    }
  },
  "success": true,
  "message": "Styl warstwy został pobrany"
}
```

#### Dla Categorized:

```json
{
  "data": {
    "renderer": "Categorized",
    "value": "typ",
    "source_symbol": { ... },
    "color_ramp": null,
    "categories": [
      {
        "symbol": { ... },
        "value": "wartość1",
        "label": "Kategoria 1"
      }
    ]
  },
  "success": true,
  "message": "Styl warstwy został pobrany"
}
```

### Możliwe błędy

- **400**: Niepowodzenie podczas pobierania stylu warstwy

---

## Pobieranie możliwych rendererów

Zwraca listę dostępnych typów rendererów.

**Endpoint:** `/api/styles/renderer/possible`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

### Parametry

Brak parametrów

### Przykład żądania

```
GET /api/styles/renderer/possible
```

### Odpowiedź sukcesu (200)

```json
{
  "data": ["Single Symbol", "Categorized"],
  "success": true,
  "message": ""
}
```

---

## Ustawianie stylu warstwy

Ustawia nowy styl dla warstwy wektorowej, w tym renderer i konfigurację symboli.

**Endpoint:** `/api/styles/set`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `style_configuration` | object | Tak | Konfiguracja stylu warstwy |

### Struktura style_configuration

#### Dla Single Symbol:

```json
{
  "renderer": "Single Symbol",
  "symbols": {
    "symbol_type": "fill",
    "fill": {
      "color": [255, 0, 0, 255],
      "opacity": 1.0,
      "unit": 0
    },
    "fills": [
      {
        "symbol_type": "Simple Fill",
        "id": "0.0",
        "enabled": true,
        "attributes": {
          "fill_color": [255, 0, 0, 255],
          "fill_style": 1,
          "stroke_color": [0, 0, 0, 255],
          "stroke_width": {
            "width_value": 0.26,
            "unit": 0
          },
          "stroke_style": 1,
          "join_style": 128,
          "offset": {
            "x": 0.0,
            "y": 0.0,
            "unit": 0
          }
        }
      }
    ]
  }
}
```

#### Dla Categorized:

```json
{
  "renderer": "Categorized",
  "value": "nazwa_kolumny",
  "source_symbol": { ... },
  "categories": [
    {
      "symbol": { ... },
      "value": "wartość_kategorii",
      "label": "Etykieta kategorii"
    }
  ]
}
```

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "style_configuration": {
    "renderer": "Single Symbol",
    "symbols": { ... }
  }
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "renderer": "Single Symbol",
    "symbols": { ... }
  },
  "success": true,
  "message": "Styl warstwy został zmieniony"
}
```

### Możliwe błędy

- **400**: Nieobsługiwany typ renderera / Warstwa posiada już ten renderer / Nieoczekiwany błąd
- **403**: Brak uprawnień do stylowania warstwy

### Obsługiwane typy symboli

#### Dla warstw poligonowych (fill):
- **Simple Fill** - wypełnienie z obrysem
- **Line Pattern Fill** - wypełnienie wzorem liniowym

#### Dla warstw liniowych (line):
- **Simple Line** - prosta linia

#### Dla warstw punktowych (marker):
- **Simple Marker** - prosty znacznik

---

## Pobieranie bazowego symbolu

Pobiera bazowy symbol dla określonego typu oraz listę możliwych symboli.

**Endpoint:** `/api/styles/symbol`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `symbol_type` | string | Tak | Typ symbolu ("fill", "line", "marker") |
| `symbol_layer_type` | string | Nie | Konkretny typ warstwy symbolu |

### Przykład żądania

```
GET /api/styles/symbol?symbol_type=fill&symbol_layer_type=Simple%20Fill
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "possible": ["Simple Fill", "Line Pattern Fill"],
    "symbol_layer": {
      "symbol_type": "Simple Fill",
      "id": "new_123456",
      "enabled": true,
      "attributes": {
        "fill_color": [0, 0, 255, 255],
        "fill_style": 1,
        "stroke_color": [35, 35, 35, 255],
        "stroke_width": {
          "width_value": 0.26,
          "unit": 0
        },
        "stroke_style": 1,
        "join_style": 128,
        "offset": {
          "x": 0.0,
          "y": 0.0,
          "unit": 0
        }
      }
    }
  },
  "success": true,
  "message": "Bazowy symbol został pobrany"
}
```

### Możliwe błędy

- **400**: Niepowodzenie przy pobieraniu bazowego symbolu

---

## Generowanie miniaturki symbolu

Generuje obraz PNG miniaturki dla konfiguracji symbolu.

**Endpoint:** `/api/styles/symbol/image`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `symbols` | object | Tak | Konfiguracja symbolu do wizualizacji |

### Przykład żądania

```json
{
  "symbols": {
    "symbol_type": "fill",
    "fill": {
      "color": [255, 0, 0, 255],
      "opacity": 1.0,
      "unit": 0
    },
    "fills": [
      {
        "symbol_type": "Simple Fill",
        "id": "0.0",
        "enabled": true,
        "attributes": { ... }
      }
    ]
  }
}
```

### Odpowiedź sukcesu (200)

Zwraca plik obrazu PNG z miniaturką symbolu.

**Content-Type:** `image/png`  
**Content-Disposition:** `inline; filename=thumbnail.png`

### Rozmiary miniaturek

- Symbol główny (fill/line/marker): 60x60 px
- Warstwa symbolu (Simple Fill, etc.): 60x60 px

### Możliwe błędy

- **400**: Błąd podczas pobierania miniaturki stylu

---

## Generowanie symbolu z losowym kolorem

Generuje konfigurację symbolu z losowo wybranym kolorem.

**Endpoint:** `/api/styles/symbol/random/color`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123"
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "symbol": {
      "symbol_type": "fill",
      "id": "new_789456",
      "fill": {
        "color": [142, 87, 203, 255],
        "opacity": 1.0,
        "unit": 0
      },
      "fills": [
        {
          "symbol_type": "Simple Fill",
          "id": "new_789456.0",
          "enabled": true,
          "attributes": {
            "fill_color": [142, 87, 203, 255],
            ...
          }
        }
      ]
    },
    "value": "",
    "label": ""
  },
  "success": true,
  "message": "Symbol z losowym kolorem został wygenerowany"
}
```

### Możliwe błędy

- **400**: Nieoczekiwany błąd podczas pobierania symbolu z losowym kolorem

---

## Klasyfikacja wartości według symboli

Automatycznie klasyfikuje unikalne wartości z kolumny atrybutów i przypisuje im symbole z określonymi kolorami.

**Endpoint:** `/api/styles/classify`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `column` | string | Tak | Nazwa kolumny do klasyfikacji |
| `rgb_colors` | array | Nie | Zakres kolorów RGB do użycia w gradiencie |

### Struktura rgb_colors

```json
[
  [255, 0, 0, 255],    // Kolor początkowy (czerwony)
  [0, 255, 0, 255],    // Kolor środkowy (zielony)
  [0, 0, 255, 255]     // Kolor końcowy (niebieski)
]
```

Jeśli nie podano `rgb_colors`, kolory będą przypisane losowo.

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "column": "typ_budynku",
  "rgb_colors": [
    [255, 255, 0, 255],
    [255, 0, 255, 255]
  ]
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": [
    {
      "symbol": {
        "symbol_type": "fill",
        "id": "0",
        "fill": {
          "color": [255, 255, 0, 255],
          "opacity": 1.0,
          "unit": 0
        },
        "fills": [ ... ]
      },
      "value": "mieszkalny",
      "label": "mieszkalny"
    },
    {
      "symbol": {
        "symbol_type": "fill",
        "id": "1",
        "fill": {
          "color": [255, 127, 127, 255],
          "opacity": 1.0,
          "unit": 0
        },
        "fills": [ ... ]
      },
      "value": "usługowy",
      "label": "usługowy"
    },
    {
      "symbol": { ... },
      "value": "przemysłowy",
      "label": "przemysłowy"
    }
  ],
  "success": true,
  "message": "Klasyfikacja symboli została wykonana"
}
```

### Opis działania

1. Funkcja pobiera wszystkie unikalne wartości z określonej kolumny
2. Sortuje je w kolejności rosnącej
3. Jeśli podano zakres kolorów:
   - Tworzy gradient między kolorami
   - Przypisuje kolory proporcjonalnie do liczby unikalnych wartości
4. Jeśli nie podano zakresu kolorów:
   - Generuje losowe kolory dla każdej wartości
   - Zapewnia, że kolory się nie powtarzają
5. Dodaje kategorię "all other values" z losowym kolorem

### Możliwe błędy

- **400**: Nieoczekiwany błąd podczas klasyfikacji wartości z kolumny tabeli atrybutów

---

## Struktury danych

### Jednostki (units)

| Wartość | Opis |
|---------|------|
| 0 | Milimetry (MM) |
| 1 | Punkty mapy (MapUnit) |
| 2 | Piksele (Pixels) |
| 3 | Procent (Percentage) |

### Style wypełnienia (fill_style)

| Wartość | Opis |
|---------|------|
| 0 | Brak wypełnienia |
| 1 | Pełne wypełnienie |
| 2 | Gęste wypełnienie |
| 3 | Rzadkie wypełnienia |
| ... | (inne wzory Qt) |

### Style obrysu (stroke_style)

| Wartość | Opis |
|---------|------|
| 0 | Brak linii |
| 1 | Linia ciągła |
| 2 | Linia przerywana |
| 3 | Linia kropkowana |
| 4 | Kreska-kropka |
| 5 | Kreska-kropka-kropka |

### Style połączeń (join_style)

| Wartość | Opis |
|---------|------|
| 0 | Miter (ostre) |
| 64 | Bevel (ścięte) |
| 128 | Round (zaokrąglone) |

### Typy symboli dla warstw

#### Simple Fill

```json
{
  "symbol_type": "Simple Fill",
  "id": "0.0",
  "enabled": true,
  "attributes": {
    "fill_color": [R, G, B, A],
    "fill_style": 1,
    "stroke_color": [R, G, B, A],
    "stroke_width": {
      "width_value": 0.26,
      "unit": 0
    },
    "stroke_style": 1,
    "join_style": 128,
    "offset": {
      "x": 0.0,
      "y": 0.0,
      "unit": 0
    }
  }
}
```

#### Line Pattern Fill

```json
{
  "symbol_type": "Line Pattern Fill",
  "id": "0.0",
  "enabled": true,
  "attributes": {
    "rotation": 45,
    "spacing": {
      "value": 2.0,
      "unit": 0
    },
    "offset": {
      "value": 0.0,
      "unit": 0
    }
  },
  "fills": {
    "symbol_type": "line",
    "line": { ... },
    "fills": [ ... ]
  }
}
```

#### Simple Line

```json
{
  "symbol_type": "Simple Line",
  "id": "0.0",
  "enabled": true,
  "attributes": {
    "color": [R, G, B, A],
    "stroke_width": {
      "width_value": 0.26,
      "unit": 0
    },
    "offset": {
      "value": 0.0,
      "unit": 0
    },
    "stroke_style": 1,
    "join_style": 128,
    "cap_style": 16,
    "use_custom_dash_pattern": {
      "enabled": false,
      "pattern": [5.0, 2.0],
      "unit": 0
    },
    "pattern_offset": {
      "value": 0.0,
      "unit": 0
    },
    "align_dash_pattern_to_line_length": false,
    "tweak_dash_pattern_at_sharp_corners": false
  }
}
```

#### Simple Marker

```json
{
  "symbol_type": "Simple Marker",
  "id": "0.0",
  "enabled": true,
  "attributes": {
    "size": {
      "size_value": 2.0,
      "unit": 0
    },
    "fill_color": [R, G, B, A],
    "stroke_color": [R, G, B, A],
    "stroke_style": 1,
    "stroke_width": {
      "width_value": 0.2,
      "unit": 0
    },
    "join_style": 128,
    "rotation": 0,
    "offset": {
      "x": 0.0,
      "y": 0.0,
      "unit": 0
    },
    "anchor_point": {
      "vertical": 1,
      "horizontal": 1
    }
  }
}
```

---

## Uwagi ogólne

### Autoryzacja

Większość endpointów wymaga autoryzacji. W nagłówku żądania należy umieścić:

```
Authorization: Bearer {token}
```

### Uprawnienia

Operacje stylowania wymagają uprawnień właściciela projektu lub odpowiednich uprawnień podużytkownika do warstwy. Brak uprawnień skutkuje błędem 403.

### Format kolorów

Kolory są reprezentowane jako tablica czterech liczb całkowitych:
```json
[R, G, B, A]
```
gdzie R, G, B, A to wartości 0-255 (czerwony, zielony, niebieski, alfa/przezroczystość).

### Identyfikatory symboli

- Symbole główne mają ID w formacie: `"0"`, `"1"`, `"2"` itd.
- Warstwy symboli mają ID hierarchiczne: `"0.0"`, `"0.1"`, `"0.0.0"` itd.
- Nowe symbole mają prefix `"new_"`: `"new_123456"`

### Typy warstw

System obsługuje trzy główne typy geometrii:
- **fill** - warstwy poligonowe
- **line** - warstwy liniowe  
- **marker** - warstwy punktowe

### Kody statusu HTTP

- **200**: Sukces
- **400**: Błąd walidacji lub wykonania operacji
- **403**: Brak uprawnień

### Obsługa błędów

Standardowy format odpowiedzi błędu:

```json
{
  "data": "",
  "success": false,
  "message": "Opis błędu"
}
```