# Backend API Endpoints - Complete List

**Dokument zawiera kompletną listę wszystkich 128 endpointów Django REST API.**

**Base URL:** `https://api.universemapmaker.online`

**Łączna liczba endpointów:** 128

---

## 📚 Podział według modułów

| Moduł | Liczba endpointów | Prefix |
|-------|-------------------|--------|
| **Auth** | 4 | `/auth/*` |
| **Groups** | 9 | `/api/groups/*` |
| **Layers** | 58 | `/api/layer/*` |
| **Styles** | 7 | `/api/styles/*` |
| **Dashboard** | 5 | `/dashboard/*` |
| **Projects** | 45 | `/api/projects/*` |

---

## 📌 1. Moduł Auth (Autoryzacja)

**Prefix:** `/auth/`

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 1 | `/auth/register` | POST | Rejestracja użytkownika |
| 2 | `/auth/login` | POST | Logowanie |
| 3 | `/auth/logout` | POST | Wylogowanie |
| 4 | `/auth/profile` | GET | Profil użytkownika |

**Autoryzacja:**
- `/auth/register` i `/auth/login` - bez tokenu
- Pozostałe - wymagają tokenu w nagłówku: `Authorization: Token {token}`

---

## 📌 2. Moduł Groups (Grupy)

**Prefix:** `/api/groups/`

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 5 | `/api/groups/add` | POST | Dodawanie grupy |
| 6 | `/api/groups/layer/remove` | POST | Usuwanie grupy i warstw |
| 7 | `/api/groups/inspire/add` | POST | Dodawanie grupy INSPIRE |
| 8 | `/api/groups/name` | POST | Zmiana nazwy grupy |
| 9 | `/api/groups/export` | GET | Eksport grupy |
| 10 | `/api/groups/krajowy/version/add` | POST | Dodawanie wersji aplikacji |
| 11 | `/api/groups/krajowy/version/get` | GET | Pobieranie historii aplikacji |
| 12 | `/api/groups/krajowy/restore` | POST | Przywracanie aplikacji |
| 13 | `/api/groups/selection` | POST | Ustawianie widoczności grupy |

---

## 📌 3. Moduł Layers (Warstwy)

**Prefix:** `/api/layer/`

### Zarządzanie warstwami (11 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 14 | `/api/layer/add` | POST | Dodawanie nowej warstwy |
| 15 | `/api/layer/add/existing` | POST | Dodawanie istniejącej warstwy |
| 16 | `/api/layer/clone` | POST | Klonowanie warstwy |
| 17 | `/api/layer/remove/database` | POST | Usuwanie warstw z bazy danych |
| 18 | `/api/layer/name` | POST | Zmiana nazwy warstwy |
| 19 | `/api/layer/selection` | POST | Ustawianie widoczności |
| 20 | `/api/layer/scale` | POST | Ustawianie skali widoczności |
| 21 | `/api/layer/export` | GET | Eksport warstwy |
| 22 | `/api/layer/published/set` | POST | Ustawianie statusu publikacji |
| 23 | `/api/layer/get/layers_subusers` | GET | Pobieranie warstw podużytkowników |
| 24 | `/api/layer/get/layers_subusers_to_append` | GET | Pobieranie warstw do przypisania |

### Import warstw (7 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 25 | `/api/layer/add/shp/` | POST | Import pliku SHP |
| 26 | `/api/layer/add/geojson/` | POST | Import pliku GeoJSON |
| 27 | `/api/layer/add/gml/` | POST | Import pliku GML |
| 28 | `/api/layer/add/app` | POST | Import aplikacji krajowej |
| 29 | `/api/layer/add/raster/` | POST | Import pliku TIF (raster) |
| 30 | `/api/layer/georefer` | POST | Georeferencja obrazu |
| 31 | `/api/layer/mask` | POST | Obcinanie rastru |

### Stylowanie (7 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 32 | `/api/layer/style` | GET/POST | Pobieranie/ustawianie stylu warstwy |
| 33 | `/api/layer/style/reset` | POST | Resetowanie stylu |
| 34 | `/api/layer/style/add` | POST | Import stylu (QML/SLD) |
| 35 | `/api/layer/style/export` | GET | Eksport stylu |
| 36 | `/api/layer/opacity/set` | POST | Zmiana przezroczystości warstwy |
| 37 | `/api/layer/transparency` | POST | Ustawienie przezroczystości rastru |
| 38 | `/api/layer/label` | POST | Dodawanie etykiet |

### Zarządzanie kolumnami (9 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 39 | `/api/layer/column/add` | POST | Dodawanie kolumny |
| 40 | `/api/layer/column/rename` | POST | Zmiana nazwy kolumny |
| 41 | `/api/layer/column/remove` | POST | Usuwanie kolumny |
| 42 | `/api/layer/columns/remove` | POST | Usuwanie wielu kolumn |
| 43 | `/api/layer/column/exclude` | POST | Wykluczanie kolumn |
| 44 | `/api/layer/column/merge` | POST | Scalanie kolumn |
| 45 | `/api/layer/column/values` | GET | Pobieranie wartości kolumny |
| 46 | `/api/layer/label/remove` | POST | Usuwanie etykiet |
| 47 | `/api/layer/insert_sub_users_to_layer` | POST | Dodawanie podużytkowników do warstwy |

### Atrybuty i dane (7 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 48 | `/api/layer/attributes/names` | GET | Pobieranie nazw atrybutów |
| 49 | `/api/layer/attributes/names_and_types` | GET | Pobieranie nazw i typów atrybutów |
| 50 | `/api/layer/attributes` | GET | Pobieranie atrybutów |
| 51 | `/api/layer/constraints` | GET | Pobieranie ograniczeń |
| 52 | `/api/layer/features` | GET | Pobieranie obiektów |
| 53 | `/api/layer/geometry` | GET | Pobieranie geometrii |
| 54 | `/api/layer/feature/coordinates` | GET | Pobieranie współrzędnych |

### Geometria i operacje przestrzenne (11 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 55 | `/api/layer/geometry/check` | GET | Sprawdzanie geometrii |
| 56 | `/api/layer/validation/details` | GET | Walidacja geometrii |
| 57 | `/api/layer/copy/geometry` | POST | Kopiowanie geometrii |
| 58 | `/api/layer/create/intersections` | POST | Tworzenie warstwy z przecięć |
| 59 | `/api/layer/get/intersections` | GET | Pobieranie geometrii przecięć |
| 60 | `/api/layer/postgis/rpoints/remove` | POST | Usuwanie powtarzających się punktów |
| 61 | `/api/layer/postgis/offsetcurve` | POST | Krzywa przesunięcia (offset curve) |
| 62 | `/api/layer/create/postgis/method` | POST | Tworzenie metodą PostGIS |
| 63 | `/api/layer/get/postgis/method` | GET | Pobieranie metodą PostGIS |
| 64 | `/api/layer/get/postgis/method/geojson` | GET | Pobieranie metodą PostGIS (GeoJSON) |
| 65 | `/api/layer/get/gaps` | GET | Wykrywanie luk |

### Inne operacje (6 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 66 | `/api/layer/multipleSaving` | POST | Zapis wielu rekordów |
| 67 | `/api/layer/transaction/` | POST | Transakcje WFS |
| 68 | `/api/layer/transaction/consultation` | POST | Transakcje WFS dla konsultacji |
| 69 | `/api/layer/sql/method/apply` | POST | Zastosowanie metody SQL |
| 70 | `/api/layer/features/selected` | GET | Zaznaczone obiekty |
| 71 | `/api/layer/delete_sub_users_from_layer` | POST | Usuwanie podużytkowników z warstwy |

---

## 📌 4. Moduł Styles (Style)

**Prefix:** `/api/styles/`

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 72 | `/api/styles/renderer` | POST | Ustawienie renderera |
| 73 | `/api/styles/renderer/possible` | GET | Pobieranie możliwych rendererów |
| 74 | `/api/styles/set` | POST | Ustawienie stylu |
| 75 | `/api/styles/symbol` | POST | Ustawienie symbolu |
| 76 | `/api/styles/symbol/image` | POST | Ustawienie obrazu symbolu |
| 77 | `/api/styles/symbol/random/color` | GET | Generowanie losowych kolorów |
| 78 | `/api/styles/classify` | POST | Klasyfikacja stylów |

---

## 📌 5. Moduł Dashboard

**Prefix:** `/dashboard/`

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 79 | `/dashboard/projects/` | GET | Lista projektów użytkownika |
| 80 | `/dashboard/projects/update/` | POST | Aktualizacja projektu |
| 81 | `/dashboard/settings/profile/` | POST | Aktualizacja profilu |
| 82 | `/dashboard/settings/password/` | POST | Zmiana hasła |
| 83 | `/dashboard/contact/` | POST | Formularz kontaktowy |

---

## 📌 6. Moduł Projects (Projekty)

**Prefix:** `/api/projects/`

### Zarządzanie projektami (10 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 84 | `/api/projects/create/` | POST | Tworzenie projektu |
| 85 | `/api/projects/import/qgs/` | POST | Import pliku QGS |
| 86 | `/api/projects/import/qgz/` | POST | Import pliku QGZ |
| 87 | `/api/projects/export` | GET | Eksport projektu |
| 88 | `/api/projects/remove/` | POST | Usuwanie projektu |
| 89 | `/api/projects/restore` | POST | Przywracanie projektu |
| 90 | `/api/projects/repair` | POST | Naprawa projektu |
| 91 | `/api/projects/reload` | POST | Przeładowanie projektu |
| 92 | `/api/projects/new/json` | GET | Pobieranie struktury nowego projektu |
| 93 | `/api/projects/remove/database` | POST | Usunięcie projektu z bazy danych |

### Kolejność warstw (2 endpointy)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 94 | `/api/projects/order` | POST | Kolejność warstw |
| 95 | `/api/projects/tree/order` | POST | Kolejność drzewa warstw |

### Informacje o przestrzeni (1 endpoint)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 96 | `/api/projects/space/get` | GET | Informacja o przestrzeni dyskowej |

### Publikacja i domeny (3 endpointy)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 97 | `/api/projects/publish` | POST | Publikacja projektu |
| 98 | `/api/projects/subdomainAvailability` | GET | Sprawdzenie dostępności subdomeny |
| 99 | `/api/projects/domain/change` | POST | Zmiana domeny |

### Logo i miniatura (2 endpointy)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 100 | `/api/projects/logo/update/` | POST | Aktualizacja logo |
| 101 | `/api/projects/thumbnail/<project_name>/` | GET | Pobieranie miniatury |

### Wydruki i eksport (1 endpoint)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 102 | `/api/projects/print` | GET | Wydruk projektu |

### Aplikacje planistyczne (3 endpointy)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 103 | `/api/projects/app/set` | POST | Ustawienie aplikacji |
| 104 | `/api/projects/app/publish` | POST | Publikacja aplikacji |
| 105 | `/api/projects/app/unpublish` | POST | Cofnięcie publikacji aplikacji |

### Publikacja serwisów (1 endpoint)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 106 | `/api/projects/services/publish` | POST | Publikacja serwisów |

### Wypisy i wyrysy (7 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 107 | `/api/projects/wypis/add/documents` | POST | Dodawanie dokumentów do wypisu |
| 108 | `/api/projects/wypis/add/configuration` | POST | Konfiguracja wypisu |
| 109 | `/api/projects/wypis/get/configuration` | GET | Pobieranie konfiguracji wypisu |
| 110 | `/api/projects/wypis/precinct_and_number` | GET | Obręb i numer działki |
| 111 | `/api/projects/wypis/plotspatialdevelopment` | GET | Zagospodarowanie przestrzenne działki |
| 112 | `/api/projects/wypis/create` | POST | Tworzenie wypisu |
| 113 | `/api/projects/wypis/remove` | POST | Usuwanie wypisu |

### Dokumenty (3 endpointy)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 114 | `/api/projects/document/import` | POST | Import dokumentu |
| 115 | `/api/projects/document` | GET | Pobieranie dokumentu |
| 116 | `/api/projects/documentsAll` | GET | Pobieranie wszystkich dokumentów |

### Wyszukiwanie i filtrowanie (6 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 117 | `/api/projects/search` | POST | Wyszukiwanie |
| 118 | `/api/projects/distinct` | GET | Unikalne wartości |
| 119 | `/api/projects/filter/min-max` | GET | Min-max dla kolumn numerycznych |
| 120 | `/api/projects/filter/numeric-columns` | GET | Pobieranie kolumn numerycznych |
| 121 | `/api/projects/global-search` | POST | Wyszukiwanie globalne |
| 122 | `/api/projects/missing-layer/add/` | POST | Dodawanie brakującej warstwy |

### Metadane i ustawienia (6 endpointów)

| # | Endpoint | Metoda | Opis |
|---|----------|--------|------|
| 123 | `/api/projects/metadata` | POST | Ustawienie metadanych |
| 124 | `/api/projects/plot` | POST | Ustawienie działki |
| 125 | `/api/projects/plot/reset` | POST | Reset działki |
| 126 | `/api/projects/sort/app` | POST | Sortowanie aplikacji |
| 127 | `/api/projects/basemap/set` | POST | Ustawienie mapy bazowej |
| 128 | `/api/projects/logs/error/send` | POST | Wysyłanie logów błędów |

---

## 📊 Podsumowanie

**Łączna liczba endpointów:** 128

**Podział według metod HTTP:**
- **GET:** 38 endpointów
- **POST:** 89 endpointów
- **GET/POST:** 1 endpoint (`/api/layer/style`)

**Podział według modułów:**
- **Auth:** 4 endpointy
- **Groups:** 9 endpointów
- **Layers:** 58 endpointów
- **Styles:** 7 endpointów
- **Dashboard:** 5 endpointów
- **Projects:** 45 endpointów

---

## ⚠️ Wymagania autoryzacji

**Większość endpointów (poza `/auth/register` i `/auth/login`) wymaga autoryzacji tokenem:**

```
Authorization: Token {token}
```

lub

```
Authorization: Bearer {token}
```

---

## 📋 Formaty odpowiedzi

- **JSON** dla większości endpointów
- **ZIP** dla eksportów (`groups/export`, `layer/export`, `projects/export`)
- **Pliki binarne** dla obrazów i dokumentów (logo, thumbnail, documents)

---

## 🔗 Powiązane dokumenty

- **CLAUDE.md** - Główne instrukcje dla Claude Code
- **BACKEND-API-REFERENCE.md** - Szczegółowa dokumentacja API z przykładami
- **BACKEND-INTEGRATION.md** - Status integracji z frontendem
- **projects_api_docs.md** - Dokumentacja modułu Projects
- **layers_api_docs.md** - Dokumentacja modułu Layers
- **auth_api_docs.md** - Dokumentacja modułu Auth
- **groups_api_docs.md** - Dokumentacja modułu Groups
- **styles_api_docs.md** - Dokumentacja modułu Styles

---

**Ostatnia aktualizacja:** 15 października 2025
