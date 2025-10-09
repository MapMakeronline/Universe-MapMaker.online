# Dokumentacja API - Moduł Groups

## Spis treści
- [Dodawanie grupy](#dodawanie-grupy)
- [Usuwanie grupy i warstw](#usuwanie-grupy-i-warstw)
- [Dodawanie grupy INSPIRE](#dodawanie-grupy-inspire)
- [Zmiana nazwy grupy](#zmiana-nazwy-grupy)
- [Eksport grupy](#eksport-grupy)
- [Dodawanie wersji aplikacji](#dodawanie-wersji-aplikacji)
- [Pobieranie historii aplikacji](#pobieranie-historii-aplikacji)
- [Przywracanie aplikacji](#przywracanie-aplikacji)
- [Ustawianie widoczności grupy](#ustawianie-widoczności-grupy)

---

## Dodawanie grupy

Tworzy nową grupę w projekcie QGIS.

**Endpoint:** `/api/groups/add`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Nazwa tworzonej grupy |
| `parent` | string | Nie | Nazwa grupy nadrzędnej (jeśli ma być podgrupą) |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "group_name": "Nowa grupa",
  "parent": "Grupa nadrzędna"
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "id": "grupa_id",
    "name": "Nowa grupa",
    ...
  },
  "success": true,
  "message": "Grupa została pomyślnie utworzona"
}
```

### Możliwe błędy

- **400**: Błąd podczas dodawania grupy
- **403**: Akcja niedozwolona dla podużytkowników

---

## Usuwanie grupy i warstw

Usuwa wybrane grupy i warstwy z projektu, opcjonalnie również z bazy danych.

**Endpoint:** `/api/groups/layer/remove`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `groups` | array | Nie | Lista nazw grup do usunięcia |
| `layers` | array | Nie | Lista ID warstw do usunięcia |
| `remove_from_database` | boolean | Nie | Czy usunąć również z bazy danych (domyślnie: false) |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "groups": ["Grupa 1", "Grupa 2"],
  "layers": ["layer_id_1", "layer_id_2"],
  "remove_from_database": true
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Grupy i warstwy zostały pomyślnie usunięte"
}
```

### Możliwe błędy

- **400**: Błąd podczas usuwania grup i warstw
- **403**: Akcja niedozwolona dla podużytkowników

---

## Dodawanie grupy INSPIRE

Tworzy grupę INSPIRE z odpowiednimi warstwami zgodnie ze standardem INSPIRE.

**Endpoint:** `/api/groups/inspire/add`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Nazwa grupy INSPIRE |
| `parent` | string | Nie | Nazwa grupy nadrzędnej |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "group_name": "INSPIRE Plan",
  "parent": ""
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "layers": [...]
  },
  "success": true,
  "message": "Grupa INSPIRE została utworzona"
}
```

### Warstwy tworzone automatycznie

Funkcja tworzy następujące warstwy:
- OfficialDocumentation (MultiPolygon)
- SpatialPlan (MultiPolygon)
- SuplementaryRegulation (MultiLineString)
- ZoningElement (MultiPolygon)

### Możliwe błędy

- **400**: Warstwa INSPIRE jest nieprawidłowa / Błąd podczas dodawania grupy INSPIRE
- **403**: Akcja niedozwolona dla podużytkowników

---

## Zmiana nazwy grupy

Zmienia nazwę istniejącej grupy w projekcie.

**Endpoint:** `/api/groups/name`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Aktualna nazwa grupy |
| `new_name` | string | Tak | Nowa nazwa grupy |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "group_name": "Stara nazwa",
  "new_name": "Nowa nazwa"
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "group_name": "Nowa nazwa"
  },
  "success": true,
  "message": "Nazwa grupy została zmieniona"
}
```

### Możliwe błędy

- **400**: Nowa nazwa grupy jest taka sama jak stara / Nazwa grupy nie istnieje / Błąd podczas zmiany nazwy grupy

---

## Eksport grupy

Eksportuje grupę wraz z warstwami do formatu GML/GPKG w pliku ZIP.

**Endpoint:** `/api/groups/export`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group` | string | Tak | Nazwa grupy do eksportu |
| `epsg` | integer | Tak | Kod EPSG układu współrzędnych (np. 2180, 3857) |

### Przykład żądania

```
GET /api/groups/export?project=moj_projekt&group=Nazwa%20grupy&epsg=2180
```

### Odpowiedź sukcesu (200)

Zwraca plik ZIP zawierający wyeksportowane warstwy w formacie GML lub GPKG.

**Content-Type:** `application/zip`

### Możliwe błędy

- **400**: Nieobsługiwane EPSG / Nie odnaleziono wskazanej grupy / Pobierana grupa nie posiada żadnych warstw / Nie znaleziono projektu qgs

---

## Dodawanie wersji aplikacji

Tworzy wersję historyczną aplikacji krajowej (plan zagospodarowania przestrzennego).

**Endpoint:** `/api/groups/krajowy/version/add`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Nazwa grupy aplikacji krajowej |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "group_name": "Plan krajowy 2024"
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": {
    "poczatekWersjiObiektu": "30/09/2025 14:30:00",
    "wersjaId": "20250930T143000"
  },
  "success": true,
  "message": "Wersja aplikacji została utworzona"
}
```

### Opis działania

Funkcja:
1. Eksportuje aktualne warstwy grupy do formatu GML
2. Tworzy kopię zapasową w formacie GeoJSON
3. Zapisuje wersję z datą i godziną
4. Aktualizuje pole `app_confirmed` dla warstw

### Możliwe błędy

- **400**: Błąd wersji aplikacji / Błąd podczas tworzenia wersji aplikacji

---

## Pobieranie historii aplikacji

Pobiera wszystkie wersje historyczne aplikacji krajowej jako archiwum ZIP.

**Endpoint:** `/api/groups/krajowy/version/get`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Nazwa grupy aplikacji krajowej |
| `epsg` | integer | Nie | Kod EPSG układu współrzędnych (domyślnie: 2180) |

### Przykład żądania

```
GET /api/groups/krajowy/version/get?project=moj_projekt&group_name=Plan%20krajowy%202024&epsg=2180
```

### Odpowiedź sukcesu (200)

Zwraca plik ZIP zawierający wszystkie wersje historyczne w formacie GML.

**Content-Type:** `application/zip`

### Możliwe błędy

- **400**: Błąd pakowania historii aplikacji / Błąd historii aplikacji

---

## Przywracanie aplikacji

Przywraca aplikację krajową do poprzedniej wersji z kopii zapasowej.

**Endpoint:** `/api/groups/krajowy/restore`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `group_name` | string | Tak | Nazwa grupy aplikacji krajowej |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "group_name": "Plan krajowy 2024"
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Aplikacja została przywrócona"
}
```

### Opis działania

Funkcja:
1. Odczytuje kopię zapasową z folderu backup
2. Przywraca warstwy do PostgreSQL używając ogr2ogr
3. Usuwa ostatnią zapisaną wersję GML
4. Czyści folder backup

### Możliwe błędy

- **400**: Nie znaleziono kopii zapasowej aplikacji / Błąd przywracania aplikacji

---

## Ustawianie widoczności grupy

Ustawia widoczność grupy i jej warstw w projekcie.

**Endpoint:** `/api/groups/selection`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu |
| `layer_id` | string | Nie | ID warstwy do zmiany widoczności |
| `layers` | array | Nie | Lista ID warstw |
| `checked` | boolean | Tak | Widoczność (true/false) |
| `group_name` | string | Nie | Nazwa grupy |
| `groups` | array | Nie | Lista nazw grup |

### Przykład żądania

```json
{
  "project": "moj_projekt",
  "group_name": "Moja grupa",
  "checked": true
}
```

### Odpowiedź sukcesu (200)

```json
{
  "data": "",
  "success": true,
  "message": "Widoczność została zmieniona"
}
```

### Możliwe błędy

- **400**: Projekt nie istnieje / ID warstwy nie istnieje / Błąd podczas ustawiania widoczności grupy

---

## Uwagi ogólne

### Autoryzacja

Wszystkie endpointy wymagają autoryzacji. W nagłówku żądania należy umieścić:

```
Authorization: Bearer {token}
```

### Formaty dat

Daty są zwracane w formacie zależnym od strefy czasowej użytkownika:
- Format wyświetlany: `DD/MM/YYYY HH:MM:SS`
- Format ID wersji: `YYYYMMDDTHHmmss`

### Obsługa błędów

Standardowy format odpowiedzi błędu:

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
- **403**: Brak uprawnień (dla podużytkowników)

### Uprawnienia

Większość operacji wymaga uprawnień właściciela projektu. Podużytkownicy otrzymają błąd 403.