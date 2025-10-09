# Dokumentacja API - Moduł Projects

## Spis treści
- [Zarządzanie projektami](#zarządzanie-projektami)
  - [Tworzenie projektu](#tworzenie-projektu)
  - [Import QGS](#import-qgs)
  - [Import QGZ](#import-qgz)
  - [Eksport projektu](#eksport-projektu)
  - [Usuwanie projektu](#usuwanie-projektu)
  - [Przywracanie projektu](#przywracanie-projektu)
  - [Naprawianie projektu](#naprawianie-projektu)
  - [Odświeżanie projektu](#odświeżanie-projektu)
- [Dane projektu](#dane-projektu)
  - [Pobieranie danych projektu](#pobieranie-danych-projektu)
  - [Pobieranie kolejności warstw](#pobieranie-kolejności-warstw)
  - [Zmiana kolejności w drzewie](#zmiana-kolejności-w-drzewie)
  - [Pobieranie przestrzeni projektu](#pobieranie-przestrzeni-projektu)
- [Publikacja i domeny](#publikacja-i-domeny)
  - [Publikacja projektu](#publikacja-projektu)
  - [Sprawdzanie dostępności subdomeny](#sprawdzanie-dostępności-subdomeny)
  - [Zmiana domeny](#zmiana-domeny)
- [Logo i miniaturki](#logo-i-miniaturki)
  - [Aktualizacja logo](#aktualizacja-logo)
  - [Pobieranie miniaturki](#pobieranie-miniaturki)
- [Wydruki i eksporty](#wydruki-i-eksporty)
  - [Przygotowanie wydruku](#przygotowanie-wydruku)
  - [Pobieranie zestawu aplikacji](#pobieranie-zestawu-aplikacji)
- [Wypis z rejestru gruntów](#wypis-z-rejestru-gruntów)
- [Dokumenty projektu](#dokumenty-projektu)
- [Wyszukiwanie i filtrowanie](#wyszukiwanie-i-filtrowanie)
- [Publikacja usług](#publikacja-usług)
- [Metadane i konfiguracja](#metadane-i-konfiguracja)

---

## Zarządzanie projektami

### Tworzenie projektu

Tworzy nowy projekt QGIS z bazą danych PostgreSQL.

**Endpoint:** `/api/projects/create/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu (custom_project_name) |
| `domain` | string | Tak | Subdomena dla projektu |
| `category` | string | Nie | Kategoria projektu |
| `projectDescription` | string | Nie | Opis projektu |
| `keywords` | string | Nie | Słowa kluczowe |

#### Przykład żądania

```json
{
  "project": "Moj_Nowy_Projekt",
  "domain": "moj-projekt",
  "category": "urban_planning",
  "projectDescription": "Projekt planu zagospodarowania",
  "keywords": "mpzp, planowanie, urbanistyka"
}
```

#### Odpowiedź sukcesu (201)

```json
{
  "data": {
    "host": "localhost",
    "port": "5432",
    "db_name": "projekt_nazwa_20250101",
    "login": "user_login",
    "password": "encrypted_password"
  },
  "success": true,
  "message": "Projekt został pomyślnie utworzony"
}
```

#### Kategorie projektów

- `urban_planning` - Planowanie przestrzenne
- `infrastructure` - Infrastruktura
- `environmental` - Środowisko
- `cadastral` - Kataster
- `other` - Inne

#### Możliwe błędy

- **400**: Błąd podczas tworzenia projektu
- **500**: Nieoczekiwany błąd serwera

---

### Import QGS

Importuje plik projektu QGIS (.qgs) do istniejącego projektu.

**Endpoint:** `/api/projects/import/qgs/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `qgs` | file | Tak | Plik QGS do zaimportowania |

#### Przykład żądania

```http
POST /api/projects/import/qgs/
Content-Type: multipart/form-data

project=moj_projekt
qgs=@projekt.qgs
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Projekt został pomyślnie zaimportowany"
}
```

#### Proces importu

1. Usunięcie starego pliku QGS (przeniesienie do deleted_projects)
2. Zapisanie nowego pliku QGS
3. Odczyt i walidacja projektu
4. Import warstw wektorowych i rastrowych do bazy danych
5. Konfiguracja WFS i stylów
6. Generowanie drzewa warstw (tree.json)

#### Możliwe błędy

- **400**: Nie znaleziono pliku QGS / Nieprawidłowy formularz / Plik uszkodzony
- **412**: Brakujące warstwy w projekcie
- **500**: Błąd podczas importowania

---

### Import QGZ

Importuje skompresowany projekt QGIS (.qgz).

**Endpoint:** `/api/projects/import/qgz/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `qgz` | file | Tak | Plik QGZ (archiwum ZIP) |

#### Przykład żądania

```http
POST /api/projects/import/qgz/
Content-Type: multipart/form-data

project=moj_projekt
qgz=@projekt.qgz
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Projekt został pomyślnie zaimportowany"
}
```

#### Proces importu QGZ

1. Rozpakowanie archiwum QGZ
2. Znalezienie pliku QGS wewnątrz archiwum
3. Zmiana nazwy pliku na {project_name}.qgs
4. Import jak w przypadku QGS

#### Możliwe błędy

- **400**: Uszkodzony plik QGZ / Nie znaleziono pliku QGS w archiwum
- **500**: Błąd podczas importowania

---

### Eksport projektu

Eksportuje projekt w formacie QGS lub QGZANTML (skompresowany).

**Endpoint:** `/api/projects/export`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `project_type` | string | Tak | Format eksportu: "qgs" lub "qgz" |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "project_type": "qgz"
}
```

#### Odpowiedź sukcesu (200)

Zwraca plik do pobrania:
- **QGS**: Content-Type: `text/xml`
- **QGZ**: Content-Type: `application/zip`

#### Zawartość eksportu

**Format QGS:**
- Plik {project_name}.qgs

**Format QGZ:**
- Plik {project_name}.qgs
- Plik {project_name}.qgd (baza danych projektu)
- Spakowane w archiwum ZIP

#### Możliwe błędy

- **400**: Nie znaleziono pliku QGS projektu
- **500**: Błąd podczas eksportowania

---

### Usuwanie projektu

Usuwa projekt (przenosi do kosza lub usuwa trwale).

**Endpoint:** `/api/projects/remove/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `remove_permanently` | boolean | Nie | Czy usunąć trwale (domyślnie: false) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "remove_permanently": false
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Projekt QGS został pomyślnie usunięty"
}
```

#### Proces usuwania

**Usuwanie do kosza (remove_permanently=false):**
1. Przeniesienie folderu do `qgs/deleted_projects/{project_name}_{dbLogin}`
2. Usunięcie workspace z GeoServer
3. Usunięcie plików rastrowych z GeoServer

**Usuwanie trwałe (remove_permanently=true):**
1. Sprawdzenie czy plik QGS nie istnieje
2. Usunięcie folderu deleted_projects
3. Usunięcie folderu wypis
4. Usunięcie bazy danych PostgreSQL
5. Usunięcie rekordów z Django (ProjectItem, Layer, Domain)

#### Możliwe błędy

- **400**: Błąd podczas usuwania / Nie można trwale usunąć - plik QGS istnieje
- **403**: Brak uprawnień do tego projektu
- **500**: Nieoczekiwany błąd

---

### Przywracanie projektu

Przywraca projekt z kosza.

**Endpoint:** `/api/projects/restore`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu do przywrócenia |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
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

#### Proces przywracania

1. Znalezienie projektu w `qgs/deleted_projects/{project_name}_{dbLogin}`
2. Przeniesienie z powrotem do `qgs/{project_name}`

#### Możliwe błędy

- **400**: Nieoczekiwany błąd podczas przywracania projektu

---

### Naprawianie projektu

Naprawia uszkodzone pliki projektu.

**Endpoint:** `/api/projects/repair`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "OK",
  "success": true,
  "message": ""
}
```

#### Proces naprawy

1. Usunięcie duplikatów plików QGS
2. Usunięcie plików core.python
3. Przywrócenie z pliku backup ({project_name}.qgs~)

---

### Odświeżanie projektu

Odświeża dane projektu i regeneruje tree.json.

**Endpoint:** `/api/projects/reload`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
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

---

## Dane projektu

### Pobieranie danych projektu

Pobiera strukturę projektu w formacie JSON (drzewo warstw).

**Endpoint:** `/api/projects/new/json`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie (AllowAny)

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu lub subdomena |
| `published` | boolean | Nie | Czy projekt jest opublikowany |
| `save` | boolean | Nie | Czy zapisać tree.json |

#### Przykład żądania

```
GET /api/projects/new/json?project=moj_projekt&published=false&save=false
```

#### Odpowiedź sukcesu (200)

```json
{
  "name": "moj_projekt",
  "extent": [-180, -90, 180, 90],
  "logoExists": true,
  "large": false,
  "children": [
    {
      "type": "group",
      "name": "Warstwa podstawowa",
      "visible": true,
      "children": [...]
    }
  ]
}
```

#### Struktura drzewa

**Grupa:**
```json
{
  "type": "group",
  "name": "Nazwa grupy",
  "visible": true,
  "children": [...]
}
```

**Warstwa wektorowa:**
```json
{
  "type": "VectorLayer",
  "id": "layer_id",
  "name": "Nazwa warstwy",
  "visible": true,
  "geometry": "MultiPolygon",
  "scale": {
    "large": false,
    "minScale": 100,
    "maxScale": 10000
  }
}
```

**Warstwa rastrowa:**
```json
{
  "type": "RasterLayer",
  "id": "layer_id",
  "name": "Nazwa warstwy",
  "visible": true
}
```

#### Możliwe błędy

- **400**: Błąd podczas odczytu danych projektu
- **404**: Projekt nie znaleziony

---

### Pobieranie kolejności warstw

Pobiera kolejność warstw w projekcie.

**Endpoint:** `/api/projects/order`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie (AllowAny)

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```
GET /api/projects/order?project=moj_projekt
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": [
    ["warstwa_1", 255],
    ["warstwa_2", 200],
    ["warstwa_3", 150]
  ],
  "success": true,
  "message": ""
}
```

Format: `[nazwa_warstwy, opacity]`

#### Możliwe błędy

- **400**: Nieoczekiwany błąd podczas pobierania kolejności warstw

---

### Zmiana kolejności w drzewie

Zmienia kolejność warstw lub grup w drzewie projektu.

**Endpoint:** `/api/projects/tree/order`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `object_type` | string | Tak | Typ: "group" lub "layer" |
| `object_id` | string | Tak | ID grupy lub warstwy |
| `new_parent_name` | string | Tak | Nazwa nowej grupy nadrzędnej (pusty string dla root) |
| `position` | integer | Tak | Pozycja w nowej grupie (0-based) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "object_type": "layer",
  "object_id": "layer_123abc",
  "new_parent_name": "Nowa grupa",
  "position": 0
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Kolejność została pomyślnie zmieniona"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono pliku QGS / Nie znaleziono nowej grupy nadrzędnej / Nie znaleziono przenoszonego obiektu
- **500**: Błąd podczas zmiany kolejności w drzewie

---

### Pobieranie przestrzeni projektu

Zwraca informacje o zajmowanej przestrzeni przez projekt.

**Endpoint:** `/api/projects/space/get`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```
GET /api/projects/space/get?project=moj_projekt
```

#### Odpowiedź sukcesu (200)

```json
{
  "layers": [
    {
      "layer_id": "layer_123",
      "source_table_name": "warstwa_tabela",
      "properties": {
        "size": "15.5 MB",
        "layer_type": "Vector",
        "layer_name": "Moja warstwa"
      }
    }
  ],
  "all_size": 125.75
}
```

#### Typy warstw

- `Vector` - warstwa wektorowa w PostgreSQL
- `Raster` - warstwa rastrowa (plik .tif)
- `""` - Metadane projektu

#### Możliwe błędy

- **400**: Błąd podczas pobierania informacji o przestrzeni

---

## Publikacja i domeny

### Publikacja projektu

Zmienia status publikacji projektu (publiczny/prywatny).

**Endpoint:** `/api/projects/publish`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `publish` | boolean | Tak | Czy opublikować (true/false) |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "publish": true
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Status publikacji projektu został zaktualizowany"
}
```

#### Możliwe błędy

- **400**: Błąd podczas publikowania projektu
- **403**: Akcja niedozwolona dla podużytkowników

---

### Sprawdzanie dostępności subdomeny

Sprawdza czy subdomena jest dostępna.

**Endpoint:** `/api/projects/subdomainAvailability`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `subdomain` | string | Tak | Nazwa subdomeny do sprawdzenia |

#### Przykład żądania

```json
{
  "subdomain": "moj-projekt"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "subdomain": "moj-projekt",
    "available": true
  },
  "success": true,
  "message": "Subdomena jest dostępna"
}
```

#### Walidacja subdomeny

- Nie może zaczynać się od myślnika (-)
- Nie może kończyć się myślnikiem (-)
- Może zawierać tylko litery, cyfry i myślniki
- Musi być unikalna

#### Komunikaty błędów walidacji

```json
{
  "data": {
    "subdomain": "moj-projekt",
    "available": false
  },
  "success": true,
  "message": "Subdomena jest już zajęta"
}
```

---

### Zmiana domeny

Zmienia subdomenę projektu.

**Endpoint:** `/api/projects/domain/change`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `subdomain` | string | Tak | Nowa subdomena |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "subdomain": "nowa-subdomena.mapmaker.online"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Domena została pomyślnie zmieniona"
}
```

#### Możliwe błędy

- **400**: Domena nie jest dostępna / Błąd podczas zmiany domeny
- **403**: Akcja niedozwolona dla podużytkowników

---

## Logo i miniaturki

### Aktualizacja logo

Generuje nowe logo projektu na podstawie widocznych warstw.

**Endpoint:** `/api/projects/logo/update/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Logo zostało pomyślnie zaktualizowane"
}
```

#### Proces generowania logo

1. Pobranie widocznych warstw z tree.json
2. Pobranie bounding box projektu
3. Wygenerowanie obrazu WMS (320x224 px)
4. Zapisanie jako {project_name}.png
5. Utworzenie wersji _simple.png
6. Aktualizacja ProjectItem (logoExists=True, actual_logo=True)

#### Możliwe błędy

- **400**: Błąd podczas aktualizacji logo / Błąd serwera podczas aktualizacji logo
- **500**: Nieoczekiwany błąd

---

### Pobieranie miniaturki

Pobiera miniaturkę logo projektu.

**Endpoint:** `/api/projects/thumbnail/<project_name>/`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie  
**Cache:** No-cache

#### Parametry URL

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_name` | string | Tak | Nazwa projektu (w URL) |

#### Przykład żądania

```
GET /api/projects/thumbnail/moj_projekt/
```

#### Odpowiedź sukcesu (200)

Zwraca obraz PNG:
- **Content-Type:** `image/png`
- **Cache-Control:** `no-cache, no-store, must-revalidate`

#### Możliwe błędy

- **404**: Thumbnail not found

---

## Wydruki i eksporty

### Przygotowanie wydruku

Generuje wydruk PDF z projektu z opcjonalną legendą i skalą.

**Endpoint:** `/api/projects/print`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `margin` | float | Nie | Margines w cm (domyślnie: 0) |
| `scale` | string | Tak | Skala wydruku (np. "1:1000") |
| `add_legend` | boolean | Nie | Czy dodać legendę |
| `bbox` | string | Tak | Bounding box (x1,y1,x2,y2) |
| `layers` | array | Tak | Lista ID warstw do wydruku |
| `title` | string | Nie | Tytuł wydruku |
| `precinct_column` | string | Nie | Wartość obrębu |
| `plot_number_column` | string | Nie | Numer działki |
| `print` | file | Tak | Plik PDF z mapą |
| `base_map` | file | Tak | Plik PDF z mapą podkładową |

#### Przykład żądania

```http
POST /api/projects/print
Content-Type: multipart/form-data

project=moj_projekt
scale=1:1000
bbox=100,200,300,400
layers=["layer1","layer2"]
add_legend=true
title=Moja mapa
print=@print.pdf
base_map=@base_map.pdf
```

#### Odpowiedź sukcesu (200)

Zwraca plik PDF:
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `inline; filename=moj_projekt.pdf`

#### Proces generowania wydruku

1. Połączenie mapy podkładowej z mapą projektu
2. Dodanie skali w lewym dolnym rogu
3. Dodanie tytułu i informacji w prawym górnym rogu
4. Dodanie znaku wodnego dla nie-właścicieli
5. Opcjonalne dodanie legendy na osobnej stronie
6. Kompresja PDF

#### Możliwe błędy

- **400**: Błąd podczas drukowania / Błąd podczas dodawania skali

---

### Pobieranie zestawu aplikacji

Eksportuje wszystkie warstwy aplikacji krajowej jako GML.

**Endpoint:** `/api/projects/app/set`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `epsg` | integer | Tak | Kod EPSG układu współrzędnych |

#### Przykład żądania

```
GET /api/projects/app/set?project=moj_projekt&epsg=2180
```

#### Odpowiedź sukcesu (200)

Zwraca plik ZIP zawierający:
- Plik GML ze wszystkimi warstwami aplikacji
- **Content-Type:** `application/zip`
- **Nazwa pliku:** `{project_name}_set.zip`

#### Warstwy aplikacji

Export obejmuje warstwy:
- `aktplanowaniaprzestrzennego`
- `dokumentformalny`
- `rysunekaktuplanowaniaprzestrzennego`
- `strefaplanistyczna`
- `obszarzabudowysrodmiejskiej`
- `obszaruzupelnieniazabudowy`
- `obszarstandardowdostepnosciinfrastrukturyspolecznej`

#### Proces eksportu

1. Znalezienie wszystkich warstw aplikacji
2. Zapisanie do GPKG
3. Dodanie znacznika czasu `koniecWersjiObiektu`
4. Konwersja do GML w podanym EPSG
5. Pakowanie do ZIP

#### Możliwe błędy

- **400**: Podany układ współrzędnych EPSG nie istnieje / Nie znaleziono aktualnego czasu / Błąd podczas tworzenia pliku GML / Nie znaleziono warstw aplikacji

---

## Wypis z rejestru gruntów

### Dodawanie dokumentów wypisu

Dodaje pliki dokumentów do wypisu.

**Endpoint:** `/api/projects/wypis/add/documents`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Nie | ID konfiguracji (domyślnie: "mpzp") |
| `wypis` | file | Tak | Plik ZIP z dokumentami |

#### Struktura archiwum ZIP

```
wypis.zip
├── plan_id_1/
│   ├── dokument_formalny.docx
│   ├── ustalenia_ogolne.docx
│   └── przeznaczenie_A.docx
└── plan_id_2/
    ├── dokument_formalny.docx
    └── ...
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": ""
}
```

---

### Dodawanie konfiguracji wypisu

Konfiguruje wypis z rejestru gruntów.

**Endpoint:** `/api/projects/wypis/add/configuration`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Nie | ID konfiguracji |
| `configuration` | object | Tak | Obiekt konfiguracji (JSON) |

#### Struktura konfiguracji

```json
{
  "configuration_name": "MPZP",
  "plotsLayer": "layer_id_dzialki",
  "plotsLayerName": "Działki",
  "precinctColumn": "obreb",
  "plotNumberColumn": "numer",
  "planLayers": [
    {
      "id": "plan_id_1",
      "name": "Plan 1",
      "purposeColumn": "przeznaczenie",
      "purposes": [
        {
          "name": "Mieszkaniowe",
          "fileName": "mieszkaniowe.docx"
        }
      ],
      "arrangements": [
        {
          "name": "Ustalenia ogólne",
          "fileName": "ustalenia_ogolne.docx"
        }
      ]
    }
  ]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "config_complete": true
  },
  "success": true,
  "message": "Konfiguracja wypisu została pomyślnie dodana"
}
```

#### Proces konfiguracji

1. Rozpakowanie plików z ZIP
2. Konwersja .odt i .doc do .docx (LibreOffice)
3. Konwersja .docx do .pdf
4. Kompresja PDF i utworzenie wersji ze znakiem wodnym
5. Zapisanie konfiguracji
6. Usunięcie plików nie uwzględnionych w konfiguracji

---

### Pobieranie konfiguracji wypisu

Pobiera konfigurację wypisu dla projektu.

**Endpoint:** `/api/projects/wypis/get/configuration`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Nie | ID konfiguracji (jeśli puste - zwraca listę) |

#### Przykład żądania - lista konfiguracji

```
GET /api/projects/wypis/get/configuration?project=moj_projekt
```

#### Odpowiedź - lista (200)

```json
{
  "data": {
    "config_structure": [
      {"id": "config_123", "name": "MPZP"},
      {"id": "config_456", "name": "SUiKZP"}
    ]
  },
  "success": true,
  "message": ""
}
```

#### Przykład żądania - konkretna konfiguracja

```
GET /api/projects/wypis/get/configuration?project=moj_projekt&config_id=config_123
```

#### Odpowiedź - konfiguracja (200)

```json
{
  "data": {
    "configuration_name": "MPZP",
    "plotsLayer": "layer_id",
    "plotsLayerName": "Działki",
    ...
  },
  "success": true,
  "message": ""
}
```

---

### Pobieranie obrębu i numeru działki

Zwraca obrę i numer działki na podstawie współrzędnych punktu.

**Endpoint:** `/api/projects/wypis/precinct_and_number`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Nie | ID konfiguracji |
| `point` | array | Tak | Współrzędne [x, y] |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "config_id": "mpzp",
  "point": [1234567.89, 7654321.01]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "precinct": "0001",
    "number": "123/4"
  },
  "success": true,
  "message": ""
}
```

---

### Pobieranie przeznaczenia działki

Zwraca informacje o przeznaczeniu działki zgodnie z planami.

**Endpoint:** `/api/projects/wypis/plotspatialdevelopment`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Nie | ID konfiguracji |
| `plot` | array | Tak | Lista działek |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "config_id": "mpzp",
  "plot": [
    {
      "precinct": "0001",
      "number": "123/4"
    }
  ]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": [
    {
      "plot": {
        "precinct": "0001",
        "number": "123/4"
      },
      "plot_destinations": [
        {
          "plan_id": "plan_123",
          "plan_name": "Plan zagospodarowania",
          "covering": "75.5%",
          "includes": true,
          "destinations": [
            {
              "name": "Mieszkaniowe jednorodzinne",
              "symbol": "MN",
              "includes": true
            }
          ]
        }
      ]
    }
  ],
  "success": true,
  "message": ""
}
```

---

### Generowanie wypisu

Generuje wypis z rejestru gruntów w formacie DOCX lub PDF.

**Endpoint:** `/api/projects/wypis/create`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Nie | ID konfiguracji |
| `plot` | array | Tak | Informacje o działce i wybranych dokumentach |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "config_id": "mpzp",
  "plot": [
    {
      "plot": {
        "precinct": "0001",
        "number": "123/4"
      },
      "plot_destinations": [
        {
          "plan_id": "plan_123",
          "includes": true,
          "destinations": [
            {
              "name": "Ustalenia ogólne",
              "includes": true
            },
            {
              "name": "Mieszkaniowe",
              "includes": true
            }
          ]
        }
      ]
    }
  ]
}
```

#### Odpowiedź sukcesu (200)

Zwraca plik do pobrania:
- **DOCX** (dla właściciela projektu): `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **PDF** (dla innych użytkowników): `application/pdf`

#### Zawartość wypisu

1. Nagłówek z obrębem i numerem działki
2. Ustalenia ogólne (jeśli wybrane)
3. Przeznaczenia z wybranych planów
4. Ustalenia końcowe (jeśli wybrane)
5. Rysunek obrysu działki (jeśli dostępny)
6. Legenda (jeśli dostępna)

#### Możliwe błędy

- **400**: Wypis nie został skonfigurowany / Błąd podczas łączenia dokumentów / Nieoczekiwany błąd wypisu

---

### Usuwanie wypisu

Usuwa konfigurację i pliki wypisu.

**Endpoint:** `/api/projects/wypis/remove`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `config_id` | string | Tak | ID konfiguracji do usunięcia |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "config_id": "config_123"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Wypis został pomyślnie usunięty"
}
```

---

## Dokumenty projektu

### Przesyłanie dokumentu

Dodaje dokument do projektu.

**Endpoint:** `/api/projects/document/import`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_name` | string | Tak | Nazwa projektu |
| `document` | file | Tak | Plik dokumentu |

#### Przykład żądania

```http
POST /api/projects/document/import
Content-Type: multipart/form-data

project_name=moj_projekt
document=@dokument.pdf
```

#### Odpowiedź sukcesu (200)

Status 200 bez treści

#### Możliwe błędy

- **400**: Błąd formularza / Nie jesteś właścicielem projektu

---

### Pobieranie lub usuwanie dokumentu

Pobiera lub usuwa dokument z projektu.

**Endpoint:** `/api/projects/document`  
**Metoda:** `GET` lub `DELETE`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `document` | string | Tak | Nazwa pliku dokumentu |

#### Przykład żądania GET

```
GET /api/projects/document?project=moj_projekt&document=dokument.pdf
```

#### Odpowiedź GET (200)

Zwraca plik do pobrania:
- **Content-Type:** `text/plain`
- **Content-Disposition:** `attachment; filename=dokument.pdf`

#### Przykład żądania DELETE

```
DELETE /api/projects/document?project=moj_projekt&document=dokument.pdf
```

#### Odpowiedź DELETE (200)

Status 200 bez treści

---

### Pobieranie listy dokumentów

Zwraca listę wszystkich dokumentów w projekcie.

**Endpoint:** `/api/projects/documentsAll`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```
GET /api/projects/documentsAll?project=moj_projekt
```

#### Odpowiedź sukcesu (200)

```json
[
  "dokument1.pdf",
  "dokument2.docx",
  "dokument3.txt"
]
```

---

## Wyszukiwanie i filtrowanie

### Wyszukiwanie w projekcie

Wyszukuje frazę we wszystkich warstwach wektorowych projektu.

**Endpoint:** `/api/projects/search`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `searched_phrase` | string | Tak | Wyszukiwana fraza |
| `exactly` | boolean | Nie | Dokładne dopasowanie |
| `ignore_capitalization` | boolean | Nie | Ignoruj wielkość liter |

#### Przykład żądania

```
GET /api/projects/search?project=moj_projekt&searched_phrase=test&exactly=false&ignore_capitalization=true
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "layer_id_1": [
      {
        "gid": 1,
        "column_name": "nazwa",
        "value": "Test wartość"
      }
    ],
    "layer_id_2": [...]
  },
  "success": true,
  "message": ""
}
```

---

### Filtrowanie wartości

Filtruje wartości w warstwie według wybranej kolumny i funkcji.

**Endpoint:** `/api/projects/distinct`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `selectedLayer` | object | Tak | Wybrana warstwa |
| `selectedColumn` | object | Tak | Wybrana kolumna |
| `selectedFunction` | object | Tak | Funkcja porównania |
| `value` | any | Tak | Wartość do porównania |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "selectedLayer": {
    "value": {
      "id": "layer_123"
    }
  },
  "selectedColumn": {
    "value": "cena"
  },
  "selectedFunction": {
    "value": "greater_than"
  },
  "value": 100000
}
```

#### Funkcje porównania

- `equal` - równe
- `not_equal` - różne
- `greater_than` - większe niż
- `less_than` - mniejsze niż
- `greater_equal` - większe lub równe
- `less_equal` - mniejsze lub równe

---

### Filtrowanie min-max

Zwraca wartości minimalne i maksymalne dla wybranej kolumny.

**Endpoint:** `/api/projects/filter/min-max`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `selectedLayer` | object | Tak | Wybrana warstwa |
| `selectedColumn` | object | Tak | Wybrana kolumna numeryczna |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "selectedLayer": {
    "value": {
      "id": "layer_123"
    }
  },
  "selectedColumn": {
    "value": "cena"
  }
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "min": 50000,
    "max": 500000
  },
  "success": true,
  "message": ""
}
```

---

### Pobieranie kolumn numerycznych

Zwraca listę kolumn numerycznych dla warstwy.

**Endpoint:** `/api/projects/filter/numeric-columns`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |

#### Przykład żądania

```
GET /api/projects/filter/numeric-columns?project=moj_projekt&layer_id=layer_123
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": ["cena", "powierzchnia", "liczba_pokoi"],
  "success": true,
  "message": ""
}
```

---

### Wyszukiwanie globalne

Wyszukuje według wielu warunków równości i zakresu.

**Endpoint:** `/api/projects/global-search`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `projectName` | string | Tak | Nazwa projektu |
| `equalsConditions` | object | Tak | Warunki równości |
| `rangeConditions` | object | Tak | Warunki zakresowe |

#### Przykład żądania

```json
{
  "projectName": "moj_projekt",
  "equalsConditions": {
    "typ": "mieszkanie",
    "miasto": "Warszawa"
  },
  "rangeConditions": {
    "cena": {
      "min": 300000,
      "max": 500000
    },
    "powierzchnia": {
      "min": 50,
      "max": 80
    }
  }
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "globalData": {
    "layer_id_1": [...],
    "layer_id_2": [...]
  }
}
```

---

## Publikacja usług

### Publikacja aplikacji krajowej

Publikuje aplikację krajową na GeoServer.

**Endpoint:** `/api/projects/app/publish`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "wms_url": "https://geomapmaker.online/geoserver/moj_projekt/wms",
    "wfs_url": "https://geomapmaker.online/geoserver/moj_projekt/wfs"
  },
  "success": true,
  "message": ""
}
```

#### Proces publikacji

1. Usunięcie starego workspace z GeoServer
2. Utworzenie nowego workspace
3. Utworzenie datastore PostgreSQL
4. Publikacja warstw aplikacji jako feature types
5. Utworzenie grup warstw (layer groups)
6. Aktualizacja ProjectItem (wms_url, wfs_url, geoserver_workspace)

---

### Cofnięcie publikacji aplikacji

Cofa publikację aplikacji krajowej z GeoServer.

**Endpoint:** `/api/projects/app/unpublish`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
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

- **400**: Błąd podczas publikacji aplikacji
- **403**: Akcja niedozwolona dla podużytkowników

---

### Publikacja usług WMS/WFS

Publikuje wybrane warstwy i grupy jako usługi WMS/WFS.

**Endpoint:** `/api/projects/services/publish`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_name` | string | Tak | Nazwa projektu |
| `children` | array | Tak | Struktura drzewa do publikacji |

#### Przykład żądania

```json
{
  "project_name": "moj_projekt",
  "children": [
    {
      "type": "group",
      "name": "Grupa 1",
      "children": [
        {
          "type": "VectorLayer",
          "id": "layer_123",
          "name": "Warstwa 1",
          "geometry": "MultiPolygon"
        }
      ]
    }
  ]
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "wms_url": "https://geomapmaker.online/geoserver/moj_projekt/wms",
    "wfs_url": "https://geomapmaker.online/geoserver/moj_projekt/wfs"
  },
  "success": true,
  "message": ""
}
```

#### Proces publikacji

1. Usunięcie starego workspace
2. Utworzenie workspace
3. Utworzenie datastore
4. Publikacja warstw wektorowych (PostgreSQL)
5. Publikacja warstw rastrowych (GeoTIFF)
6. Eksport i publikacja stylów SLD
7. Utworzenie hierarchii grup warstw
8. Usunięcie nieużywanych plików rastrowych

---

## Metadane i konfiguracja

### Ustawianie metadanych

Przypisuje ID metadanych do projektu.

**Endpoint:** `/api/projects/metadata`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `metadata_id` | string | Tak | ID metadanych |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "metadata_id": "uuid-123-456-789"
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

---

### Dodawanie konfiguracji działek

Konfiguruje warstwę działek dla projektu.

**Endpoint:** `/api/projects/plot`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `plot_layer` | string | Tak | ID warstwy działek |
| `plot_number_column` | string | Tak | Nazwa kolumny z numerem działki |
| `plot_precinct_column` | string | Tak | Nazwa kolumny z obrębem |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "plot_layer": "layer_dzialki_123",
  "plot_number_column": "nr_dzialki",
  "plot_precinct_column": "obreb"
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

---

### Resetowanie konfiguracji działek

Resetuje konfigurację działek dla projektu.

**Endpoint:** `/api/projects/plot/reset`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
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

---

### Sortowanie aplikacji

Sortuje grupy aplikacji krajowej według daty obowiązywania.

**Endpoint:** `/api/projects/sort/app`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {...}, 
  "success": true,
  "message": ""
}
```

Zwraca zaktualizowane drzewo projektu (tree.json).

#### Proces sortowania

1. Znalezienie wszystkich grup aplikacji
2. Odczytanie daty obowiązywania z warstwy `aktplanowaniaprzestrzennego`
3. Sortowanie grup według daty (najnowsze na górze)
4. Grupy bez daty na samym dole
5. Zapisanie nowej kolejności

---

### Ustawianie mapy podkładowej

Konfiguruje mapy podkładowe dla projektu.

**Endpoint:** `/api/projects/basemap/set`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `base_map` | array | Tak | Lista map podkładowych |
| `default` | string | Nie | Nazwa domyślnej mapy |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "base_map": [
    {
      "name": "OpenStreetMap",
      "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "layers": ["osm"]
    },
    {
      "name": "Satellite",
      "url": "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer",
      "layers": ["0"]
    }
  ],
  "default": "OpenStreetMap"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "base_map": [
      {"name": "OpenStreetMap", ...},
      {"name": "Satellite", ...}
    ],
    "default_base_map": "OpenStreetMap"
  },
  "success": true,
  "message": ""
}
```

---

### Wysyłanie logów błędów

Wysyła logi błędów mailem do administratora.

**Endpoint:** `/api/projects/logs/error/send`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Nie | Nazwa projektu |
| `log_error` | string | Tak | Treść błędu |

#### Przykład żądania

```json
{
  "project": "moj_projekt",
  "log_error": "Error: Cannot read property 'map' of undefined\n  at Component.render..."
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "Pomyślnie wysłano informację o błędzie.",
  "success": true,
  "message": ""
}
```

---

### Dodawanie brakującej warstwy

Dodaje brakującą warstwę do projektu.

**Endpoint:** `/api/projects/missing-layer/add/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak  
**Content-Type:** `multipart/form-data`

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Tak | ID warstwy |
| `layer_name` | string | Tak | Nazwa warstwy |
| `tif` | file | Warunkowo | Plik .tif (dla warstw rastrowych) |
| `gml` | file | Warunkowo | Plik .gml (dla warstw wektorowych) |
| `geo_json` | file | Warunkowo | Plik .geojson |
| `shp`, `shx`, `dbf`, `prj`, `cpg`, `qpj` | file | Warunkowo | Pliki shapefile |

#### Przykład żądania - warstwa rastrowa

```http
POST /api/projects/missing-layer/add/
Content-Type: multipart/form-data

project=moj_projekt
layer_id=missing_layer_123
layer_name=Ortofotomapa
tif=@ortofoto.tif
```

#### Przykład żądania - warstwa wektorowa (shapefile)

```http
POST /api/projects/missing-layer/add/
Content-Type: multipart/form-data

project=moj_projekt
layer_id=missing_layer_456
layer_name=Działki
shp=@dzialki.shp
shx=@dzialki.shx
dbf=@dzialki.dbf
prj=@dzialki.prj
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Brakująca warstwa wektorowa została dodana"
}
```

lub

```json
{
  "data": "",
  "success": true,
  "message": "Brakująca warstwa rastrowa została dodana"
}
```

#### Możliwe błędy

- **400**: Nie znaleziono elementu projektu / Warstwa jest nieprawidłowa / Nie rozpoznano układu współrzędnych EPSG / Błąd podczas dodawania warstwy do bazy danych
- **500**: Błąd podczas dodawania nowej warstwy

---

### Usuwanie bazy danych projektu

Trwale usuwa bazę danych projektu (po usunięciu do kosza).

**Endpoint:** `/api/projects/remove/database`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

#### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |

#### Przykład żądania

```json
{
  "project": "moj_projekt"
}
```

#### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Projekt został trwale usunięty"
}
```

#### Uwaga

Endpoint można wywołać tylko jeśli plik QGS nie istnieje (projekt musi być wcześniej usunięty do kosza).

---

## Uwagi ogólne

### Autoryzacja

Większość endpointów wymaga autoryzacji. W nagłówku żądania należy umieścić:

```
Authorization: Bearer {token}
```

### Uprawnienia

- Właściciel projektu ma pełne uprawnienia
- Podużytkownicy mają ograniczone uprawnienia (nie mogą usuwać, publikować, zmieniać domeny)

### Formaty plików

**Projekty QGIS:**
- `.qgs` - plik projektu QGIS
- `.qgz` - skompresowany projekt QGIS (ZIP)

**Warstwy wektorowe:**
- `.geojson` - GeoJSON
- `.gml` - Geography Markup Language
- `.shp` + `.shx`, `.dbf`, `.prj`, `.cpg` - Shapefile

**Warstwy rastrowe:**
- `.tif`, `.tiff` - GeoTIFF

**Dokumenty:**
- `.pdf`, `.docx`, `.doc`, `.odt` - dokumenty wypisu

### Układy współrzędnych

Domyślny układ: **EPSG:3857** (Web Mercator)

Wspierane układy:
- `2180` - PUWG 1992
- `3857` - Web Mercator
- inne kody EPSG (walidowane przez QGIS)

### Kody błędów HTTP

- **200**: Sukces
- **201**: Utworzono
- **400**: Błąd walidacji lub wykonania operacji
- **403**: Brak uprawnień
- **404**: Nie znaleziono
- **412**: Warunki wstępne nie spełnione (np. brakujące warstwy)
- **500**: Błąd serwera

### Limity

- Maksymalna liczba warstw na wyświetlanie: ustawiane przez `MAX_FEATURE_PER_LAYER_FOR_VIEW`
- Rozmiar miniaturki logo: 320x224 px
- Format wydruku: PDF z kompresją

### Struktura folderów

```
qgs/
├── {project_name}/
│   ├── {project_name}.qgs
│   ├── {project_name}.qgd
│   ├── tree.json
│   ├── layers_order
│   ├── logo.png
│   ├── styles/
│   ├── app_history/
│   └── wypis/
├── deleted_projects/
├── wypis/
└── thumbnails/
```