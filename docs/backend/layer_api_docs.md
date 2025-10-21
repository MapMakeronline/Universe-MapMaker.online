# Dokumentacja API - Moduł Layers (Warstwy)

## Spis treści

### Zarządzanie warstwami
- [Dodawanie nowej warstwy](#dodawanie-nowej-warstwy)
- [Dodawanie istniejącej warstwy](#dodawanie-istniejącej-warstwy)
- [Klonowanie warstwy](#klonowanie-warstwy)
- [Usuwanie warstw z bazy danych](#usuwanie-warstw-z-bazy-danych)
- [Zmiana nazwy warstwy](#zmiana-nazwy-warstwy)

### Import warstw
- [Import pliku SHP](#import-pliku-shp)
- [Import pliku GeoJSON](#import-pliku-geojson)
- [Import pliku GML](#import-pliku-gml)
- [Import aplikacji krajowej](#import-aplikacji-krajowej)
- [Import pliku TIF (raster)](#import-pliku-tif-raster)
- [Georeferencja obrazu](#georeferencja-obrazu)

### Stylowanie
- [Pobieranie/ustawianie stylu warstwy](#pobieranieustawianie-stylu-warstwy)
- [Resetowanie stylu](#resetowanie-stylu)
- [Import stylu (QML/SLD)](#import-stylu-qmlsld)
- [Eksport stylu](#eksport-stylu)
- [Zmiana przezroczystości warstwy](#zmiana-przezroczystości-warstwy)
- [Ustawienie przezroczystości rastru](#ustawienie-przezroczystości-rastru)

### Zarządzanie kolumnami
- [Dodawanie kolumny](#dodawanie-kolumny)
- [Zmiana nazwy kolumny](#zmiana-nazwy-kolumny)
- [Usuwanie kolumny](#usuwanie-kolumny)
- [Usuwanie wielu kolumn](#usuwanie-wielu-kolumn)
- [Wykluczanie kolumn](#wykluczanie-kolumn)
- [Scalanie kolumn](#scalanie-kolumn)

### Atrybuty i dane
- [Pobieranie nazw atrybutów](#pobieranie-nazw-atrybutów)
- [Pobieranie nazw i typów atrybutów](#pobieranie-nazw-i-typów-atrybutów)
- [Pobieranie atrybutów](#pobieranie-atrybutów)
- [Pobieranie ograniczeń](#pobieranie-ograniczeń)
- [Pobieranie wartości kolumny](#pobieranie-wartości-kolumny)
- [Pobieranie obiektów](#pobieranie-obiektów)
- [Pobieranie geometrii](#pobieranie-geometrii)
- [Pobieranie współrzędnych](#pobieranie-współrzędnych)
- [Zapis wielu rekordów](#zapis-wielu-rekordów)

### Etykiety
- [Dodawanie etykiet](#dodawanie-etykiet)
- [Usuwanie etykiet](#usuwanie-etykiet)

### Geometria i operacje przestrzenne
- [Sprawdzanie geometrii](#sprawdzanie-geometrii)
- [Walidacja geometrii](#walidacja-geometrii)
- [Kopiowanie geometrii](#kopiowanie-geometrii)
- [Tworzenie warstwy z przecięć](#tworzenie-warstwy-z-przecięć)
- [Pobieranie geometrii przecięć](#pobieranie-geometrii-przecięć)
- [Usuwanie powtarzających się punktów](#usuwanie-powtarzających-się-punktów)
- [Krzywa przesunięcia (offset curve)](#krzywa-przesunięcia-offset-curve)
- [Metody PostGIS](#metody-postgis)
- [Wykrywanie luk](#wykrywanie-luk)
- [Obcinanie rastru](#obcinanie-rastru)

### Inne operacje
- [Ustawianie widoczności](#ustawianie-widoczności)
- [Ustawianie skali widoczności](#ustawianie-skali-widoczności)
- [Eksport warstwy](#eksport-warstwy)
- [Transakcje WFS](#transakcje-wfs)
- [Zastosowanie metody SQL](#zastosowanie-metody-sql)
- [Zaznaczone obiekty](#zaznaczone-obiekty)
- [Ustawianie statusu publikacji](#ustawianie-statusu-publikacji)
- [Zarządzanie podużytkownikami](#zarządzanie-podużytkownikami)

---

## Zarządzanie warstwami

### Dodawanie nowej warstwy

Tworzy nową pustą warstwę wektorową w projekcie.

**Endpoint:** `/api/layer/add`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `name` | string | Tak | Nazwa warstwy |
| `geometry_type` | string | Tak | Typ geometrii ("Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon") |
| `properties` | array | Nie | Lista właściwości/kolumn do dodania |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |
| `union` | boolean | Nie | Czy połączyć z geometrią z innej warstwy |
| `layer_id_from` | string | Nie | ID warstwy źródłowej (jeśli union=true) |
| `consultations` | boolean | Nie | Czy warstwa jest konsultacją |
| `resolution` | string | Nie | Kod uchwały (dla konsultacji) |
| `startDate` | string | Nie | Data rozpoczęcia konsultacji |
| `endDate` | string | Nie | Data zakończenia konsultacji |
| `description` | string | Nie | Opis konsultacji |
| `selected_features` | array | Nie | Lista wybranych obiektów do połączenia |
| `name_column_with_selected_feature` | string | Nie | Nazwa kolumny z wybranymi obiektami |
| `owner_email` | string | Nie | Email właściciela konsultacji |
| `gaps` | boolean | Nie | Czy tworzyć warstwę z luk |
| `buffer` | number | Nie | Bufor dla wykrywania luk |

#### Struktura properties

```json
[
  {
    "column_name": "nazwa_kolumny",
    "column_type": 10
  }
]
```

**Typy kolumn:**
- 1 - Boolean
- 2 - Integer
- 4 - Integer64
- 6 - Double
- 10 - String
- 14 - Date
- 16 - DateTime

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "name": "Nowa warstwa",
  "geometry_type": "MultiPolygon",
  "properties": [
    {
      "column_name": "nazwa",
      "column_type": 10
    },
    {
      "column_name": "powierzchnia",
      "column_type": 6
    }
  ],
  "parent": ""
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "layer_id_123",
    "name": "Nowa warstwa",
    "type": "vector",
    ...
  },
  "success": true,
  "message": "Nowa warstwa została pomyślnie utworzona"
}
```

#### Możliwe błędy

- **400**: Błąd podczas dodawania nowej warstwy / Uszkodzona geometria / Nieprawidłowe punkty georeferencji
- **403**: Akcja niedozwolona dla podużytkowników

---

### Dodawanie istniejącej warstwy

Dodaje istniejącą warstwę z bazy danych do projektu.

**Endpoint:** `/api/layer/add/existing`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `name` | string | Tak | Nazwa warstwy |
| `source_table` | string | Tak | Nazwa tabeli źródłowej w bazie danych |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |
| `host` | string | Nie | Host bazy danych |
| `port` | string | Nie | Port bazy danych |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "name": "Istniejąca warstwa",
  "source_table": "tabela_warstwy_id_123",
  "parent": ""
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "layer": {...},
    "database": {
      "used": 123.45,
      "total": 5000
    }
  },
  "success": true,
  "message": "Istniejąca warstwa została pomyślnie dodana"
}
```

#### Możliwe błędy

- **400**: Warstwa jest nieprawidłowa / Nie znaleziono pliku QGS projektu
- **403**: Akcja niedozwolona dla podużytkowników

---

### Klonowanie warstwy

Tworzy kopię istniejącej warstwy wraz z jej danymi.

**Endpoint:** `/api/layer/clone`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy do sklonowania |
| `new_layer_name` | string | Tak | Nazwa nowej warstwy |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "new_layer_name": "Kopia warstwy",
  "parent": ""
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "new_layer_id",
    "name": "Kopia warstwy",
    ...
  },
  "success": true,
  "message": "Warstwa została pomyślnie sklonowana"
}
```

#### Możliwe błędy

- **400**: Błąd podczas klonowania warstwy

---

### Usuwanie warstw z bazy danych

Usuwa warstwy z projektu i opcjonalnie z bazy danych.

**Endpoint:** `/api/layer/remove/database`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layers` | array | Tak | Lista warstw do usunięcia |

#### Struktura layers

```json
[
  {
    "id": "layer_id_1",
    "source_table": "table_name_1"
  },
  {
    "id": null,
    "source_table": "raster_layer.tif"
  }
]
```

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layers": [
    {
      "id": "layer_123",
      "source_table": "warstwa_id_123"
    }
  ]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "used": 95.3,
    "total": 5000
  },
  "success": true,
  "message": "Warstwy zostały pomyślnie usunięte"
}
```

#### Możliwe błędy

- **400**: Projekt o podanej nazwie nie istnieje / Nieoczekiwany błąd podczas usuwania warstwy

---

### Zmiana nazwy warstwy

Zmienia nazwę warstwy w projekcie.

**Endpoint:** `/api/layer/name`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `new_name` | string | Tak | Nowa nazwa warstwy |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "new_name": "Nowa nazwa warstwy"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "layer_name": "Nowa nazwa warstwy"
  },
  "success": true,
  "message": "Nazwa warstwy została pomyślnie zmieniona"
}
```

#### Możliwe błędy

- **400**: Nowa nazwa warstwy jest taka sama jak stara / Błąd podczas zmiany nazwy warstwy

---

## Import warstw

### Import pliku SHP

Importuje plik Shapefile do projektu.

**Endpoint:** `/api/layer/add/shp/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_name` | string | Tak | Nazwa warstwy |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |
| `epsg` | integer | Nie | Kod EPSG układu współrzędnych |
| `encoding` | string | Nie | Kodowanie pliku (domyślnie UTF-8) |

#### Pliki

**UWAGA:** Backend oczekuje prostych nazw pól (bez prefiksu `uploaded_layer.`)

- `shp` - plik główny (wymagany)
- `shx` - plik indeksu (wymagany)
- `dbf` - plik atrybutów (wymagany)
- `prj` - plik projekcji (opcjonalny)
- `cpg` - plik kodowania (opcjonalny)

#### Przykład żądania (form-data)

```
project: moj_projekt
layer_name: Warstwa SHP
epsg: 2180
encoding: UTF-8
[pliki SHP]
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "layer_id",
    "name": "Warstwa SHP",
    ...
  },
  "success": true,
  "message": "Warstwa wektorowa została pomyślnie zaimportowana"
}
```

#### Możliwe błędy

- **400**: Warstwa jest nieprawidłowa / Układ współrzędnych EPSG nie istnieje / Nieobsługiwany typ warstwy

---

### Import pliku GeoJSON

Importuje plik GeoJSON do projektu.

**Endpoint:** `/api/layer/add/geojson/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_name` | string | Tak | Nazwa warstwy |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

#### Pliki

- `geojson` - plik GeoJSON (wymagany)

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "layer_id",
    "name": "Warstwa GeoJSON",
    ...
  },
  "success": true,
  "message": "Warstwa wektorowa została pomyślnie zaimportowana"
}
```

#### Możliwe błędy

- **400**: Nie rozpoznano układu współrzędnych EPSG / Błąd podczas dodawania pliku GeoJSON

---

### Import pliku GML

Importuje plik GML do projektu.

**Endpoint:** `/api/layer/add/gml/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_name` | string | Tak | Nazwa warstwy |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

#### Pliki

- `gml` - plik GML (wymagany)

#### Odpowiedź sukcesu (200)

Dla pojedynczej warstwy:
```json
{
  "data": {
    "id": "layer_id",
    ...
  },
  "success": true,
  "message": "Warstwa wektorowa została pomyślnie zaimportowana"
}
```

Dla wielu warstw:
```json
{
  "data": [
    {"id": "layer_1", ...},
    {"id": "layer_2", ...}
  ],
  "success": true,
  "message": "Warstwy GML zostały pomyślnie dodane"
}
```

#### Możliwe błędy

- **400**: Nie rozpoznano układu współrzędnych EPSG / Błąd podczas dodawania pliku GML

---

### Import aplikacji krajowej

Importuje aplikację krajową (plan zagospodarowania przestrzennego) w formacie GML.

**Endpoint:** `/api/layer/add/app`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Nazwa grupy dla aplikacji |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

#### Pliki

- `uploaded_layer.gml` - plik GML aplikacji (wymagany)

#### Wymagane warstwy w GML

Aplikacja musi zawierać 2 lub 3 warstwy:
- **Dla 2 warstw:** DokumentFormalny + AktPlanowaniaPrzestrzennego
- **Dla 3 warstw:** DokumentFormalny + AktPlanowaniaPrzestrzennego + RysunekAktuPlanowaniaPrzestrzennego

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "group": {...},
    "layers": [...]
  },
  "success": true,
  "message": "Aplikacja została pomyślnie dodana"
}
```

#### Możliwe błędy

- **400**: Nieprawidłowe warstwy aplikacji / Niewystarczająca liczba warstw dla aplikacji

---

### Import pliku TIF (raster)

Importuje warstwę rastrową w formacie TIFF.

**Endpoint:** `/api/layer/add/raster/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_name` | string | Tak | Nazwa warstwy |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

#### Pliki

- `raster` - plik TIFF/GeoTIFF (wymagany)

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "layer_id",
    "name": "Warstwa rastrowa",
    "type": "raster",
    ...
  },
  "success": true,
  "message": "Warstwa rastrowa została pomyślnie dodana"
}
```

#### Opis działania

Funkcja automatycznie:
1. Reprojektuje raster do EPSG:3857
2. Usuwa tło używając `nearblack`
3. Kompresuje używając LZW lub JPEG
4. Tworzy pirami dy (overviews) dla szybszego wyświetlania

#### Możliwe błędy

- **400**: Błąd podczas reprojekcji warstwy rastrowej / Błąd podczas dodawania warstwy TIF

---

### Georeferencja obrazu

Georeferencjonuje obraz używając punktów kontrolnych.

**Endpoint:** `/api/layer/georefer`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_name` | string | Tak | Nazwa warstwy |
| `points_on_map` | string (JSON) | Tak | Punkty na mapie [[lon, lat], ...] |
| `points_on_image` | string (JSON) | Tak | Punkty na obrazie [[x, y], ...] |
| `quality` | string | Nie | Jakość (domyślnie: 70) |
| `sampling` | string | Nie | Metoda próbkowania ("near", "bilinear", "cubic", "cubicspline", "lanczos") |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

#### Pliki

- `image` - plik obrazu (JPG, PNG, TIF)

#### Przykład żądania (form-data)

```
project: moj_projekt
layer_name: Zgeoreferencjonowany obraz
points_on_map: [[21.0, 52.0], [21.1, 52.0], [21.1, 52.1], [21.0, 52.1]]
points_on_image: [[0, 0], [1000, 0], [1000, 1000], [0, 1000]]
sampling: bilinear
[plik obrazu]
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "layer_id",
    "name": "Zgeoreferencjonowany obraz",
    ...
  },
  "success": true,
  "message": "Warstwa rastrowa została pomyślnie dodana"
}
```

#### Wymagania

- Minimum 3 punkty kontrolne
- Liczba punktów na mapie musi być równa liczbie punktów na obrazie

#### Możliwe błędy

- **400**: Nieprawidłowe punkty georeferencji / Niewystarczająca przestrzeń dyskowa / Błąd podczas georeferencji obrazu
- **403**: Akcja niedozwolona dla podużytkowników

---

## Stylowanie

### Pobieranie/ustawianie stylu warstwy

Pobiera lub ustawia styl warstwy.

**Endpoint:** `/api/layer/style`  
**Metoda:** `GET` / `POST`  
**Wymagana autoryzacja:** Tak

#### GET - Pobieranie stylu obiektu

##### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `feature_id` | integer | Tak | ID obiektu |

##### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "color": [255, 0, 0, 255],
    "outline_color": [0, 0, 0, 255],
    "outline_style": 1,
    "outline_width": 0.26
  },
  "success": true,
  "message": ""
}
```

#### POST - Ustawianie stylu warstwy

##### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `color` | array | Tak | Kolor wypełnienia [R, G, B, A] |
| `outline_color` | array | Tak | Kolor obrysu [R, G, B, A] |
| `outline_style` | string | Tak | Styl obrysu |
| `outline_width` | float | Tak | Szerokość obrysu |
| `outline_unit` | string | Nie | Jednostka obrysu ("MM", "MapUnit") |
| `label` | string/array | Nie | Kolumna dla kategorii lub lista wartości |
| `feature` | string | Nie | Kolumna do kategoryzacji |

##### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "color": [255, 0, 0, 102],
  "outline_color": [0, 0, 0, 255],
  "outline_style": "solid",
  "outline_width": 0.26,
  "outline_unit": "MM",
  "label": "",
  "feature": "gid"
}
```

##### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Styl warstwy został pomyślnie zaktualizowany"
}
```

#### Możliwe błędy

- **400**: Błąd podczas odczytu renderera warstwy / Błąd podczas dodawania stylu warstwy
- **403**: Akcja niedozwolona dla podużytkowników (POST)

---

### Resetowanie stylu

Resetuje styl warstwy do domyślnego.

**Endpoint:** `/api/layer/style/reset`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `label` | string/array | Nie | Kategorie do zresetowania |
| `feature` | string | Nie | Kolumna kategoryzacji |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "label": "",
  "feature": "gid"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Styl warstwy został pomyślnie zresetowany"
}
```

#### Możliwe błędy

- **400**: Błąd podczas resetowania stylu warstwy
- **403**: Akcja niedozwolona dla podużytkowników

---

### Import stylu (QML/SLD)

Importuje styl warstwy z pliku QML lub SLD.

**Endpoint:** `/api/layer/style/add`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Pliki

- `new_style.qml` lub `new_style.sld` - plik stylu (wymagany)

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "layer_123",
    ...
  },
  "success": true,
  "message": "Styl został pomyślnie załadowany"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono pliku stylu / Błąd podczas ładowania stylu / Funkcja dostępna wyłącznie dla właściciela projektu

---

### Eksport stylu

Eksportuje styl warstwy do pliku QML lub SLD.

**Endpoint:** `/api/layer/style/export`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `style_format` | string | Tak | Format stylu ("qml", "sld") |

#### Przykład żądania

```
GET /api/layer/style/export?project=moj_projekt&layer_id=layer_123&style_format=qml
```

#### Odpowiedź sukcesu (200)

Zwraca plik XML ze stylem.

**Content-Type:** `text/xml`  
**Content-Disposition:** `inline; filename=nazwa_warstwy.qml`

#### Możliwe błędy

- **400**: Warstwa nie posiada stylu do eksportu / Nieoczekiwany błąd podczas eksportu stylu / Funkcja dostępna wyłącznie dla właściciela projektu

---

### Zmiana przezroczystości warstwy

Zmienia przezroczystość warstwy wektorowej lub rastrowej.

**Endpoint:** `/api/layer/opacity/set`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `opacity` | integer | Tak | Przezroczystość (0-255) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "opacity": 128
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "opacity": 128
  },
  "success": true,
  "message": "Przezroczystość warstwy została pomyślnie zmieniona"
}
```

#### Możliwe błędy

- **400**: Warstwa jest nieprawidłowa / Błąd podczas zmiany przezroczystości warstwy

---

### Ustawienie przezroczystości rastru

Ustawia przezroczystość dla konkretnego koloru w rastrze.

**Endpoint:** `/api/layer/transparency`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy rastrowej |
| `red` | integer | Tak | Wartość czerwonego kanału (0-255) |
| `green` | integer | Tak | Wartość zielonego kanału (0-255) |
| `blue` | integer | Tak | Wartość niebieskiego kanału (0-255) |
| `transparency` | integer | Tak | Poziom przezroczystości (0-100) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "raster_layer_123",
  "red": 255,
  "green": 255,
  "blue": 255,
  "transparency": 0
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Przezroczystość rastru została pomyślnie ustawiona"
}
```

#### Opis działania

Ustawia dany kolor RGB jako przezroczysty w określonym stopniu. Używane typowo do usuwania białego tła z rastrów.

#### Możliwe błędy

- **400**: Nie znaleziono warstwy rastrowej / Błąd podczas ustawiania przezroczystości rastru

---

## Zarządzanie kolumnami

### Dodawanie kolumny

Dodaje nową kolumnę do tabeli atrybutów warstwy.

**Endpoint:** `/api/layer/column/add`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `column_name` | string | Tak | Nazwa nowej kolumny |
| `column_type` | integer | Tak | Typ kolumny |

#### Typy kolumn

- **1** - Boolean
- **2** - Integer
- **4** - Integer64
- **6** - Double
- **10** - String (domyślnie 254 znaki)
- **14** - Date
- **16** - DateTime

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "column_name": "nowa_kolumna",
  "column_type": 10
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Kolumna o danej nazwie już istnieje / Nieoczekiwany błąd podczas dodawania kolumny

---

### Zmiana nazwy kolumny

Zmienia nazwę istniejącej kolumny.

**Endpoint:** `/api/layer/column/rename`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `old_column_name` | string | Tak | Aktualna nazwa kolumny |
| `new_column_name` | string | Tak | Nowa nazwa kolumny |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "old_column_name": "stara_nazwa",
  "new_column_name": "nowa_nazwa"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Kolumna o danej nazwie już istnieje / Stara nazwa kolumny nie istnieje

---

### Usuwanie kolumny

Usuwa kolumnę z tabeli atrybutów.

**Endpoint:** `/api/layer/column/remove`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `name` | string | Tak | Nazwa kolumny do usunięcia |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "name": "kolumna_do_usuniecia"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Nieoczekiwany błąd podczas usuwania kolumny

---

### Usuwanie wielu kolumn

Usuwa wiele kolumn jednocześnie.

**Endpoint:** `/api/layer/columns/remove`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `id` | string | Tak | ID warstwy |
| `names` | array | Tak | Lista nazw kolumn do usunięcia |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "id": "layer_123",
  "names": ["kolumna1", "kolumna2", "kolumna3"]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono elementu projektu / Nieoczekiwany błąd podczas usuwania kolumn

---

### Wykluczanie kolumn

Wyklucza kolumny z wyświetlania w WMS/WFS.

**Endpoint:** `/api/layer/column/exclude`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `excluded_columns` | array | Tak | Lista nazw kolumn do wykluczenia |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "excluded_columns": ["kolumna1", "kolumna2"]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": ["kolumna1", "kolumna2"],
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Nieoczekiwany błąd podczas wykluczania kolumn

---

### Scalanie kolumn

Scala wiele kolumn w jedną, łącząc ich wartości separatorami.

**Endpoint:** `/api/layer/column/merge`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `columns_to_merge` | array | Tak | Lista nazw kolumn do scalenia |
| `separators` | array | Tak | Lista separatorów (o 1 mniej niż kolumn) |
| `merged_column_name` | string | Nie | Nazwa nowej kolumny (autogenerowana jeśli brak) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "columns_to_merge": ["ulica", "numer", "miasto"],
  "separators": [" ", ", "],
  "merged_column_name": "adres_pelny"
}
```

Wynik: "Krótka 5, Warszawa"

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Niedozwolony znak apostrofu w separatorze / Nieoczekiwany błąd podczas scalania kolumn

---

## Atrybuty i dane

### Pobieranie nazw atrybutów

Pobiera listę nazw kolumn atrybutów wraz z liczbą rekordów.

**Endpoint:** `/api/layer/attributes/names`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/layer/attributes/names?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "feature_names": ["gid", "nazwa", "powierzchnia", "geom"],
    "layer_id": "layer_123",
    "record_count": 150
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania nazw atrybutów

---

### Pobieranie nazw i typów atrybutów

Pobiera listę kolumn wraz z ich typami danych.

**Endpoint:** `/api/layer/attributes/names_and_types`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/layer/attributes/names_and_types?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "gid": "integer",
    "nazwa": "text",
    "powierzchnia": "double precision",
    "data_utworzenia": "date",
    "geom": "geometry"
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania atrybutów z typami

---

### Pobieranie atrybutów

Pobiera wszystkie atrybuty warstwy w formacie JSON.

**Endpoint:** `/api/layer/attributes`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `search` | boolean | Nie | Czy uwzględnić wykluczone kolumny |

#### Przykład żądania

```
GET /api/layer/attributes?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "Types": {
      "gid": "Integer",
      "nazwa": "String",
      "powierzchnia": "Real"
    },
    "Attributes": {
      "gid": [1, 2, 3, ...],
      "nazwa": ["Działka A", "Działka B", ...],
      "powierzchnia": [100.5, 250.3, ...]
    }
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania atrybutów

---

### Pobieranie ograniczeń

Pobiera informacje o ograniczeniach kolumn (NOT NULL, UNIQUE, sekwencje).

**Endpoint:** `/api/layer/constraints`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/layer/constraints?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "not_null_fields": ["gid", "nazwa"],
    "unique_fields": ["gid"],
    "sequence_fields": ["gid"]
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania ograniczeń

---

### Pobieranie wartości kolumny

Pobiera wszystkie unikalne wartości z wybranej kolumny.

**Endpoint:** `/api/layer/column/values`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `column_name` | string | Tak | Nazwa kolumny |

#### Przykład żądania

```
GET /api/layer/column/values?project=moj_projekt&layer_id=layer_123&column_name=typ
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": ["A", "B", "C", "D"],
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Projekt o podanej nazwie nie istnieje / Błąd podczas pobierania wartości kolumny

---

### Pobieranie obiektów

Pobiera wszystkie obiekty warstwy w formacie JSON.

**Endpoint:** `/api/layer/features`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/layer/features?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": [
    {
      "gid": 1,
      "nazwa": "Działka A",
      "powierzchnia": 100.5
    },
    {
      "gid": 2,
      "nazwa": "Działka B",
      "powierzchnia": 250.3
    }
  ],
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania obiektów

---

### Pobieranie geometrii

Pobiera wszystkie geometrie warstwy w formacie GeoJSON.

**Endpoint:** `/api/layer/geometry`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/layer/geometry?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[...]]
        },
        "properties": {"gid": 1}
      }
    ]
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania geometrii

---

### Pobieranie współrzędnych

Pobiera współrzędne obiektów na podstawie punktu lub obszaru.

**Endpoint:** `/api/layer/feature/coordinates`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `point` | array | Nie | Współrzędne punktu [lon, lat] |
| `bbox` | array | Nie | Obszar [[lon1, lat1], [lon2, lat2], ...] |
| `layer_type` | string | Tak | Typ warstwy ("point", "line", "polygon") |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "point": [21.0, 52.0],
  "layer_type": "polygon"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "coordinates": [...],
    "features": [...]
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania współrzędnych obiektu

---

### Zapis wielu rekordów

Zapisuje lub aktualizuje wiele rekordów jednocześnie.

**Endpoint:** `/api/layer/multipleSaving`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer` | string | Tak | ID warstwy |
| `data` | array | Tak | Lista rekordów do zapisania |

#### Struktura data

```json
[
  {
    "gid": 1,
    "nazwa": "Nowa nazwa",
    "powierzchnia": 150.5
  },
  {
    "gid": 2,
    "nazwa": "Inna nazwa",
    "powierzchnia": 200.3
  }
]
```

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer": "layer_123",
  "data": [
    {"gid": 1, "nazwa": "Zaktualizowana"},
    {"gid": 2, "nazwa": "Również zaktualizowana"}
  ]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Rekordy zostały pomyślnie zapisane"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas modyfikacji rekordów

---

## Etykiety

### Dodawanie etykiet

Dodaje etykiety do warstwy na podstawie wartości kolumny.

**Endpoint:** `/api/layer/label`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `textColor` | array | Tak | Kolor tekstu [R, G, B, A] |
| `fontSize` | float | Tak | Rozmiar czcionki |
| `minScale` | integer | Tak | Minimalna skala widoczności |
| `maxScale` | integer | Tak | Maksymalna skala widoczności |
| `columnName` | string | Tak | Nazwa kolumny z tekstem etykiety |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "textColor": [0, 0, 0, 255],
  "fontSize": 10,
  "minScale": 100,
  "maxScale": 10000,
  "columnName": "nazwa"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Etykiety zostały pomyślnie dodane"
}
```

#### Opis działania

Funkcja automatycznie:
- Dodaje białą obwódkę (buffer) wokół tekstu dla lepszej czytelności
- Dla linii ustawia centralne rozmieszczenie
- Dla polygonów centruje etykiety wewnątrz
- Ustawia widoczność na podstawie skali

#### Możliwe błędy

- **400**: Nieprawidłowe wartości skali / Błąd podczas dodawania etykiet

---

### Usuwanie etykiet

Usuwa etykiety z warstwy.

**Endpoint:** `/api/layer/label/remove`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Etykiety zostały pomyślnie usunięte"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono pliku QGS projektu / Błąd podczas usuwania etykiet

---

## Geometria i operacje przestrzenne

### Sprawdzanie geometrii

Sprawdza i naprawia geometrię warstwy.

**Endpoint:** `/api/layer/geometry/check`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "layer_id": "layer_123",
    "extent": [20.9, 51.9, 21.1, 52.1],
    "deleted_shapes": 3
  },
  "success": true,
  "message": "Geometria warstwy została pomyślnie sprawdzona i naprawiona"
}
```

#### Opis działania

Funkcja:
1. Sprawdza poprawność geometrii używając `ST_IsValid`
2. Naprawia nieprawidłowe geometrie używając `ST_MakeValid`
3. Usuwa puste geometrie
4. Zwraca nowy zasięg warstwy i liczbę usuniętych obiektów

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas sprawdzania geometrii warstwy

---

### Walidacja geometrii

Pobiera szczegóły walidacji geometrii warstwy.

**Endpoint:** `/api/layer/validation/details`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/layer/validation/details?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": [
    {
      "id": 5,
      "reason": "Self-intersection",
      "location": "POINT(21.0 52.0)"
    },
    {
      "id": 12,
      "reason": "Ring Self-intersection",
      "location": "POINT(21.1 52.1)"
    }
  ],
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas walidacji geometrii warstwy

---

### Kopiowanie geometrii

Kopiuje geometrię i opcjonalnie atrybuty z jednej warstwy do drugiej.

**Endpoint:** `/api/layer/copy/geometry`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id_from` | string | Tak | ID warstwy źródłowej |
| `layer_id_to` | string | Tak | ID warstwy docelowej |
| `only_geometry` | boolean | Tak | Czy kopiować tylko geometrię (true) czy również atrybuty (false) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id_from": "source_layer",
  "layer_id_to": "target_layer",
  "only_geometry": false
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Geometria została pomyślnie skopiowana"
}
```

#### Warunki

- Obie warstwy muszą mieć ten sam typ geometrii (WKB Type)
- Jeśli `only_geometry=false`, kopiowane są wszystkie kolumny o takich samych nazwach

#### Możliwe błędy

- **400**: Nieprawidłowy typ warstwy / Błąd podczas kopiowania geometrii warstwy

---

### Tworzenie warstwy z przecięć

Tworzy nową warstwę zawierającą przecięcia obiektów z tej samej warstwy.

**Endpoint:** `/api/layer/create/intersections`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy źródłowej |
| `new_layer_name` | string | Tak | Nazwa nowej warstwy |
| `records_ids` | array | Nie | Lista ID rekordów do sprawdzenia |
| `buffer` | number | Nie | Minimalny bufor powierzchni (w m²) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "new_layer_name": "Przecięcia",
  "records_ids": [1, 2, 3, 4, 5],
  "buffer": 0.5
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "new_layer_id",
    "name": "Przecięcia",
    "extent": [20.9, 51.9, 21.1, 52.1],
    ...
  },
  "success": true,
  "message": "Warstwa z przecięciami została pomyślnie utworzona"
}
```

#### Opis działania

Funkcja:
1. Znajduje wszystkie przecięcia między obiektami w warstwie
2. Filtruje przecięcia mniejsze niż `buffer` (w EPSG:2180)
3. Tworzy nową warstwę z geometriami przecięć
4. Zwraca informacje o nowej warstwie

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas tworzenia warstwy z przecięć
- **403**: Akcja niedozwolona dla podużytkowników

---

### Pobieranie geometrii przecięć

Pobiera geometrie przecięć w formacie GeoJSON bez tworzenia nowej warstwy.

**Endpoint:** `/api/layer/get/intersections`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `records_ids` | array | Nie | Lista ID rekordów |
| `buffer` | number | Nie | Minimalny bufor powierzchni (w m²) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "records_ids": [1, 2, 3],
  "buffer": 1.0
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "geoms": [
      {
        "type": "MultiPolygon",
        "coordinates": [[[[...]]], [[[...]]]]
      }
    ]
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas pobierania geometrii przecięć

---

### Usuwanie powtarzających się punktów

Usuwa powtarzające się punkty z geometrii.

**Endpoint:** `/api/layer/postgis/rpoints/remove`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `records_ids` | array | Nie | Lista ID rekordów |
| `tolerance` | number | Nie | Tolerancja odległości |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "records_ids": [1, 2, 3],
  "tolerance": 0.001
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Powtarzające się punkty zostały pomyślnie usunięte"
}
```

#### Opis działania

Używa funkcji PostGIS `ST_RemoveRepeatedPoints` do usunięcia punktów, które są bliżej siebie niż `tolerance`.

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas usuwania powtarzających się punktów

---

### Krzywa przesunięcia (offset curve)

Tworzy krzywą przesuniętą o określoną odległość od oryginalnej linii.

**Endpoint:** `/api/layer/postgis/offsetcurve`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `offset` | number | Tak | Odległość przesunięcia |
| `records_ids` | array | Nie | Lista ID rekordów |
| `quad_segs` | integer | Nie | Liczba segmentów dla zaokrągleń |
| `join` | string | Nie | Styl połączeń ("round", "mitre", "bevel") |
| `mitre_limit` | number | Nie | Limit dla stylu mitre |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "offset": 5.0,
  "records_ids": [1, 2, 3],
  "join": "round",
  "quad_segs": 8
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": [
    "{\"type\":\"MultiLineString\",\"coordinates\":[[...]]}",
    "{\"type\":\"MultiLineString\",\"coordinates\":[[[...]]]}"
  ],
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas tworzenia krzywej przesunięcia

---

### Metody PostGIS

Tworzy nową warstwę lub pobiera geometrie używając metod PostGIS.

**Tworzenie warstwy:**  
**Endpoint:** `/api/layer/create/postgis/method`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

**Pobieranie geometrii:**  
**Endpoint:** `/api/layer/get/postgis/method`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

**Geometrie z GeoJSON:**  
**Endpoint:** `/api/layer/get/postgis/method/geojson`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry (wspólne)

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak/Nie | ID warstwy (nie dla geojson) |
| `postgis_method` | string | Tak | Nazwa metody PostGIS |
| `parameters` | object | Tak | Parametry dla metody |
| `new_layer_name` | string | Tak/Nie | Nazwa nowej warstwy (tylko create) |
| `geojson_geoms` | array | Tak/Nie | Geometrie GeoJSON (tylko geojson) |

#### Dostępne metody PostGIS

- `ST_Buffer` - bufor wokół geometrii
- `ST_ConvexHull` - otoczka wypukła
- `ST_Envelope` - prostokąt otaczający
- `ST_Centroid` - środek ciężkości
- `ST_Simplify` - uproszczenie geometrii
- `ST_Union` - połączenie geometrii
- `ST_Difference` - różnica geometrii
- `ST_Intersection` - przecięcie geometrii
- I wiele innych...

#### Przykład żądania (buffer)

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "postgis_method": "ST_Buffer",
  "parameters": {
    "distance": 10.0,
    "records_ids": [1, 2, 3]
  },
  "new_layer_name": "Bufor 10m"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "new_layer_id",
    "name": "Bufor 10m",
    "extent": [...]
  },
  "success": true,
  "message": "Nowa warstwa została pomyślnie utworzona"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Brak nowych rekordów do utworzenia / Błąd podczas tworzenia warstwy z metody PostGIS

---

### Wykrywanie luk

Wykrywa luki (gaps) między geometriami w warstwie.

**Endpoint:** `/api/layer/get/gaps`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id_from` | string | Tak | ID warstwy |
| `selected_features` | array | Nie | Lista wybranych obiektów |
| `name_column_with_selected_feature` | string | Nie | Nazwa kolumny z wybranymi obiektami |
| `buffer` | number | Nie | Minimalny rozmiar luki |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id_from": "layer_123",
  "buffer": 1.0
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "MULTIPOLYGON(((21.0 52.0, 21.1 52.0, ...)))",
  "success": true,
  "message": ""
}
```

#### Opis działania

Funkcja:
1. Łączy wszystkie wybrane geometrie
2. Tworzy otoczkę (envelope)
3. Odejmuje połączone geometrie od otoczki
4. Zwraca geometrie luk w formacie WKT

#### Możliwe błędy

- **400**: Brak luk w podanej geometrii / Błąd podczas wyszukiwania luk

---

### Obcinanie rastru

Obcina raster używając maski wektorowej.

**Endpoint:** `/api/layer/mask`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `mask_layer` | string | Tak | ID warstwy maski (wektorowej) |
| `raster_layer` | string | Tak | ID warstwy rastrowej |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "mask_layer": "vector_mask",
  "raster_layer": "raster_to_clip"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "raster_to_clip",
    "name": "Obcięty raster",
    ...
  },
  "success": true,
  "message": "Raster został pomyślnie obcięty"
}
```

#### Opis działania

Funkcja:
1. Eksportuje warstwę maski do Shapefile
2. Używa `rasterio.mask` do obcięcia rastru
3. Reprojektuje wynik do EPSG:3857
4. Zastępuje oryginalny raster obciętą wersją

#### Możliwe błędy

- **400**: Nie znaleziono maski lub warstwy rastrowej / Maska nie nakłada się na raster / Błąd podczas obcinania rastru

---

## Inne operacje

### Ustawianie widoczności

Ustawia widoczność warstwy w projekcie.

**Endpoint:** `/api/layer/selection`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `layers` | array | Nie | Lista dodatkowych ID warstw |
| `checked` | boolean | Tak | Widoczność (true/false) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "checked": true
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Widoczność warstwy została pomyślnie zmieniona"
}
```

#### Możliwe błędy

- **400**: Projekt o podanej nazwie nie istnieje / Błąd podczas zmiany widoczności warstwy
- **403**: Akcja niedozwolona dla podużytkowników

---

### Ustawianie skali widoczności

Ustawia zakres skal, w których warstwa jest widoczna.

**Endpoint:** `/api/layer/scale`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `max_scale` | integer | Tak | Maksymalna skala (np. 100) |
| `min_scale` | integer | Tak | Minimalna skala (np. 10000) |
| `turn_off` | boolean | Nie | Wyłącz ograniczenie skali |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "max_scale": 100,
  "min_scale": 10000,
  "turn_off": false
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "scale_visibility": true,
    "max_scale": 100,
    "min_scale": 10000
  },
  "success": true,
  "message": "Masštab warstwy został pomyślnie ustawiony"
}
```

#### Warunki

- Maksymalna skala musi być mniejsza od minimalnej
- Dla warstw z ponad 10000 obiektami, minimalna skala nie może przekraczać 10000

#### Możliwe błędy

- **400**: Nieprawidłowy masštab warstwy / Błąd podczas ustawiania Масштаба

---

### Eksport warstwy

Eksportuje warstwę do różnych formatów.

**Endpoint:** `/api/layer/export`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `epsg` | integer | Tak | Kod EPSG układu współrzędnych |
| `layer_format` | string | Tak | Format eksportu |

#### Formaty eksportu

**Warstwy wektorowe:**
- `ESRI SHAPEFILE` - Shapefile (zwraca ZIP)
- `GML` - Geography Markup Language
- `KML` - Keyhole Markup Language
- `GEOJSON` - GeoJSON

**Warstwy rastrowe:**
- Automatycznie eksportuje do TIFF

#### Przykład żądania

```
GET /api/layer/export?project=moj_projekt&layer_id=layer_123&epsg=2180&layer_format=GEOJSON
```

#### Odpowiedź sukcesu (200)

Zwraca plik w wybranym formacie.

**Content-Type:**
- `application/zip` (SHP)
- `application/gml+xml` (GML)
- `application/kml+xml` (KML)
- `application/geo+json` (GeoJSON)
- `image/tiff` (TIF)

#### Możliwe błędy

- **400**: Nieobsługiwany format eksportu / Układ współrzędnych EPSG nie istnieje / Błąd podczas eksportowania warstwy

---

### Transakcje WFS

Wykonuje transakcje WFS (dodawanie, modyfikacja, usuwanie obiektów).

**Endpoint:** `/api/layer/transaction/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `application/xml`

**Endpoint dla konsultacji:** `/api/layer/transaction/consultation`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry (query string)

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Body

XML w formacie WFS Transaction (zgodny ze standardem OGC WFS)

#### Przykład żądania

```xml
<?xml version="1.0"?>
<wfs:Transaction
  service="WFS"
  version="1.1.0"
  xmlns:wfs="http://www.opengis.net/wfs"
  xmlns:gml="http://www.opengis.net/gml">
  <wfs:Insert>
    <feature>
      <property name="nazwa">Nowy obiekt</property>
      <property name="geom">
        <gml:Point>
          <gml:coordinates>21.0,52.0</gml:coordinates>
        </gml:Point>
      </property>
    </feature>
  </wfs:Insert>
</wfs:Transaction>
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "inserted": 1,
    "updated": 0,
    "deleted": 0,
    "extent": [20.9, 51.9, 21.1, 52.1]
  },
  "success": true,
  "message": ""
}
```

#### Operacje

- **Insert** - dodawanie nowych obiektów
- **Update** - modyfikacja istniejących obiektów
- **Delete** - usuwanie obiektów

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas wykonywania transakcji / Funkcja dostępna wyłącznie dla nadzorcy projektu

---

### Zastosowanie metody SQL

Wykonuje operacje SQL na kolumnach warstwy (obliczenia, aktualizacje).

**Endpoint:** `/api/layer/sql/method/apply`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `sql_operations` | array | Tak | Lista operacji SQL |

#### Struktura sql_operations

```json
[
  {
    "target_column": "nazwa_kolumny",
    "operation": "=",
    "source_columns": ["kolumna1", "kolumna2"],
    "operator": "+",
    "value": null
  }
]
```

**Dostępne operacje:**
- `=` - przypisanie
- `+=` - dodawanie
- `-=` - odejmowanie
- `*=` - mnożenie
- `/=` - dzielenie

**Dostępne operatory:**
- `+` - dodawanie
- `-` - odejmowanie
- `*` - mnożenie
- `/` - dzielenie

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "sql_operations": [
    {
      "target_column": "powierzchnia_ha",
      "operation": "=",
      "source_columns": ["powierzchnia_m2"],
      "operator": "/",
      "value": 10000
    }
  ]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Zapytania SQL zostały pomyślnie zastosowane"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Błąd podczas wykonywania zapytań SQL / Funkcja dostępna wyłącznie dla nadzorcy projektu

---

### Zaznaczone obiekty

Pobiera obiekty na podstawie wartości z kolumny.

**Endpoint:** `/api/layer/features/selected`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `label` | array | Tak | Lista wartości do wyszukania |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "label": ["wartość1", "wartość2", "wartość3"]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "success": true,
  "message": ""
}
```

#### Możliwe błędy

- **400**: Nie znaleziono warstwy / Nie znaleziono kolumny geometrii / Błąd podczas wyszukiwania

---

### Ustawianie statusu publikacji

Ustawia czy warstwa jest opublikowana.

**Endpoint:** `/api/layer/published/set`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `published` | boolean | Tak | Status publikacji |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "layer_id": "layer_123",
  "published": true
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "layer_id": "layer_123",
    "published": true
  },
  "success": true,
  "message": "Status publikacji warstwy został pomyślnie zmieniony"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono pliku QGS projektu / Błąd podczas zmiany statusu publikacji warstwy
- **403**: Akcja niedozwolona dla podużytkowników

---

## Zarządzanie podużytkownikami

### Pobieranie podużytkowników warstwy

Pobiera listę podużytkowników przypisanych do warstwy.

**Endpoint:** `/api/layer/get/layers_subusers`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_name` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Odpowiedź sukcesu (200)

```json
{
  "data": [
    {
      "id": 1,
      "username": "poduzytkownik1"
    },
    {
      "id": 2,
      "username": "poduzytkownik2"
    }
  ],
  "success": true,
  "message": ""
}
```

### Pobieranie dostępnych podużytkowników

Pobiera listę podużytkowników, którzy mogą być dodani do warstwy.

**Endpoint:** `/api/layer/get/layers_subusers_to_append`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

Takie same jak dla `/api/layer/get/layers_subusers`

### Dodawanie podużytkowników

Dodaje podużytkowników do warstwy.

**Endpoint:** `/api/layer/insert_sub_users_to_layer`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_name` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `users` | array | Tak | Lista ID podużytkowników |

#### Przykład żądania

```json
{
  "project_name": "moj_projekt",
  "layer_id": "layer_123",
  "users": [1, 2, 3]
}
```

### Usuwanie podużytkowników

Usuwa podużytkowników z warstwy.

**Endpoint:** `/api/layer/delete_sub_users_from_layer`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

Takie same jak dla `/api/layer/insert_sub_users_to_layer`

#### Możliwe błędy

- **400**: Funkcja dostępna wyłącznie dla właściciela projektu / Błąd podczas zarządzania podużytkownikami

---

## Uwagi ogólne

### Autoryzacja

Większość endpointów wymaga autoryzacji. W nagłówku żądania:

```
Authorization: Bearer {token}
```

### Limity i wydajność

- Warstwy z ponad 10000 obiektami automatycznie otrzymują ograniczenia skali widoczności
- Operacje na dużych warstwach mogą wymagać więcej czasu
- Import plików jest ograniczony limitem przestrzeni dyskowej użytkownika

### Obsługa błędów

Format odpowiedzi błędu:

```json
{
  "data": "",
  "success": false,
  "message": "Opis błędu"
}
```

### Kody statusu HTTP

- **200**: Sukces
- **400**: Błąd walidacji lub wykonania operacji
- **403**: Brak uprawnień
- **500**: Błąd serwera

### Uprawnienia

- Właściciel projektu: pełny dostęp
- Podużytkownicy: ograniczony dostęp do niektórych operacji
- Niektóre operacje nie wymagają autoryzacji (odczyt danych)

### Formaty geometrii

System obsługuje następujące typy geometrii:
- Point, MultiPoint
- LineString, MultiLineString
- Polygon, MultiPolygon

Wszystkie geometrie są przechowywane w EPSG:3857 (Web Mercator).