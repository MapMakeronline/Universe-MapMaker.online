# Dokumentacja API - Moduł Dashboard

## Spis treści
- [Lista projektów użytkownika](#lista-projektów-użytkownika)
- [Aktualizacja projektu](#aktualizacja-projektu)
- [Aktualizacja profilu](#aktualizacja-profilu)
- [Zmiana hasła](#zmiana-hasła)
- [Formularz kontaktowy](#formularz-kontaktowy)

---

## Lista projektów użytkownika

Pobiera listę wszystkich projektów użytkownika oraz informacje o bazie danych.

**Endpoint:** `/dashboard/projects/`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

### Parametry

Brak parametrów. Użytkownik identyfikowany jest na podstawie tokenu autoryzacyjnego.

### Przykład żądania

```
GET /dashboard/projects/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "list_of_projects": [
    {
      "project_name": "projekt_01",
      "custom_project_name": "Mój pierwszy projekt",
      "published": true,
      "logoExists": false,
      "description": "Opis projektu",
      "keywords": "gis, mapa, planowanie",
      "project_date": "15-01-25",
      "project_time": "14:30",
      "domain_name": "mojprojekt",
      "domain_url": "mojprojekt.localhost",
      "categories": "Planowanie przestrzenne",
      "qgs_exists": true
    },
    {
      "project_name": "projekt_02",
      "custom_project_name": "Projekt testowy",
      "published": false,
      "logoExists": true,
      "description": "",
      "keywords": "",
      "project_date": "20-01-25",
      "project_time": "10:15",
      "domain_name": "testowy",
      "domain_url": "testowy.localhost",
      "categories": "Inne",
      "qgs_exists": true
    }
  ],
  "db_info": {
    "login": "jan_kowalski_123456",
    "password": "aB3dEf7gH9jK2lM4nP6q",
    "host": "localhost",
    "port": "5432"
  }
}
```

### Struktura projektu

| Pole | Typ | Opis |
|------|-----|------|
| `project_name` | string | Unikalna nazwa projektu (identyfikator) |
| `custom_project_name` | string | Nazwa wyświetlana projektu |
| `published` | boolean | Czy projekt jest opublikowany |
| `logoExists` | boolean | Czy projekt posiada logo |
| `description` | string | Opis projektu |
| `keywords` | string | Słowa kluczowe |
| `project_date` | string | Data utworzenia (format: DD-MM-YY) |
| `project_time` | string | Czas utworzenia (format: HH:MM) |
| `domain_name` | string | Nazwa domeny |
| `domain_url` | string | Pełny adres URL domeny |
| `categories` | string | Kategoria projektu |
| `qgs_exists` | boolean | Czy istnieje plik .qgs projektu |

### Struktura db_info

| Pole | Typ | Opis |
|------|-----|------|
| `login` | string | Login do bazy danych PostgreSQL |
| `password` | string | Hasło do bazy danych PostgreSQL |
| `host` | string | Host bazy danych |
| `port` | string | Port bazy danych |

### Opis działania

Funkcja:
1. Pobiera wszystkie projekty należące do zalogowanego użytkownika
2. Pobiera projekty wszystkich podużytkowników powiązanych z użytkownikiem
3. Automatycznie tworzy domenę dla projektów, które jej nie posiadają (format: `nazwaprojektu2{timestamp}.localhost`)
4. Zwraca informacje o połączeniu z bazą danych użytkownika
5. Data i czas są konwertowane do strefy czasowej użytkownika

### Możliwe błędy

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve user projects"
}
```

---

## Aktualizacja projektu

Aktualizuje dane projektu użytkownika.

**Endpoint:** `/dashboard/projects/update/`  
**Metoda:** `PUT`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project` | string | Tak | Nazwa projektu do zaktualizowania |
| `custom_project_name` | string | Nie | Nowa nazwa wyświetlana projektu |
| `domain` | string | Nie | Nowa nazwa domeny |
| `keywords` | string | Nie | Słowa kluczowe |
| `description` | string | Nie | Opis projektu |
| `category` | string | Nie | Kategoria projektu (domyślnie: "Inne") |

### Przykład żądania

```json
{
  "project": "projekt_01",
  "custom_project_name": "Mój zaktualizowany projekt",
  "domain": "nowa_domena",
  "keywords": "gis, mapy, geodezja, planowanie",
  "description": "Zaktualizowany opis projektu",
  "category": "Planowanie przestrzenne"
}
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "success": true,
  "message": "Projekt został pomyślnie zaktualizowany"
}
```

### Opis działania

Funkcja:
1. Weryfikuje, czy użytkownik jest właścicielem projektu
2. Aktualizuje podane pola projektu
3. Jeśli zmieniono nazwę domeny, aktualizuje też pełny URL domeny (dodaje `.localhost`)
4. Zapisuje zmiany w bazie danych

### Możliwe błędy

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Nazwa projektu jest wymagana"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Projekt nie został znaleziony lub nie masz uprawnień do jego edycji"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Błąd podczas aktualizacji projektu"
}
```

---

## Aktualizacja profilu

Aktualizuje dane profilu zalogowanego użytkownika.

**Endpoint:** `/dashboard/settings/profile/`  
**Metoda:** `PUT`  
**Wymagana autoryzacja:** Tak

### Parametry

Wszystkie parametry są opcjonalne. Można zaktualizować tylko wybrane pola.

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `email` | string | Nie | Adres email |
| `first_name` | string | Nie | Imię |
| `last_name` | string | Nie | Nazwisko |
| `company_name` | string | Nie | Nazwa firmy |
| `nip` | string | Nie | NIP |
| `address` | string | Nie | Adres |
| `city` | string | Nie | Miasto |
| `zip_code` | string | Nie | Kod pocztowy |
| `theme` | string | Nie | Motyw interfejsu |

### Przykład żądania

```json
{
  "first_name": "Jan",
  "last_name": "Kowalski",
  "company_name": "Firma XYZ Sp. z o.o.",
  "nip": "1234567890",
  "address": "ul. Przykładowa 123",
  "city": "Warszawa",
  "zip_code": "00-001",
  "theme": "dark"
}
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "message": "Profil zaktualizowany pomyślnie",
  "user": {
    "id": 42,
    "username": "jan_kowalski",
    "email": "jan.kowalski@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "company_name": "Firma XYZ Sp. z o.o.",
    "nip": "1234567890",
    "address": "ul. Przykładowa 123",
    "city": "Warszawa",
    "zip_code": "00-001",
    "theme": "dark"
  }
}
```

### Opis działania

Funkcja:
1. Aktualizuje wybrane pola profilu użytkownika
2. Wykorzystuje partial update (można zaktualizować tylko wybrane pola)
3. Zwraca zaktualizowane dane użytkownika

### Możliwe błędy

**400 Bad Request:**
```json
{
  "message": "Nie udało się zaktualizować profilu",
  "errors": {
    "email": ["Wprowadź poprawny adres email."],
    "nip": ["To pole nie może być puste."]
  }
}
```

---

## Zmiana hasła

Zmienia hasło zalogowanego użytkownika.

**Endpoint:** `/dashboard/settings/password/`  
**Metoda:** `PUT`  
**Wymagana autoryzacja:** Tak

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `old_password` | string | Tak | Aktualne hasło użytkownika |
| `new_password` | string | Tak | Nowe hasło |

### Przykład żądania

```json
{
  "old_password": "stare_haslo123",
  "new_password": "nowe_bezpieczne_haslo456"
}
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "message": "Password updated successfully"
}
```

### Opis działania

Funkcja:
1. Weryfikuje poprawność aktualnego hasła
2. Waliduje nowe hasło zgodnie z zasadami Django (minimalna długość, złożoność itp.)
3. Ustawia nowe hasło (automatycznie hashowane)
4. Aktualizuje sesję użytkownika, aby nie został wylogowany

### Walidacja hasła

Django domyślnie wymaga, aby hasło:
- Miało co najmniej 8 znaków
- Nie było zbyt podobne do danych użytkownika
- Nie było powszechnie używanym hasłem
- Nie składało się tylko z cyfr

### Możliwe błędy

**400 Bad Request - Niepoprawne aktualne hasło:**
```json
{
  "message": "Current password is incorrect"
}
```

**400 Bad Request - Walidacja nowego hasła:**
```json
{
  "message": "To hasło jest zbyt krótkie. Musi zawierać co najmniej 8 znaków."
}
```
lub
```json
{
  "message": "To hasło jest zbyt powszechne."
}
```
lub
```json
{
  "message": "To hasło składa się tylko z cyfr."
}
```

---

## Formularz kontaktowy

Wysyła wiadomość kontaktową do administratorów systemu.

**Endpoint:** `/dashboard/contact/`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `subject` | string | Tak | Temat wiadomości |
| `name` | string | Tak | Imię i nazwisko nadawcy |
| `email` | string | Tak | Adres email nadawcy |
| `message` | string | Tak | Treść wiadomości |

### Przykład żądania

```json
{
  "subject": "Pytanie o funkcjonalności",
  "name": "Jan Kowalski",
  "email": "jan.kowalski@example.com",
  "message": "Dzień dobry, chciałbym zapytać o możliwość dodania..."
}
```

### Odpowiedź sukcesu (201 Created)

```json
{
  "message": "Wiadomość została wysłana pomyślnie"
}
```

### Opis działania

Funkcja:
1. Zapisuje wiadomość w bazie danych
2. Wysyła powiadomienie email do administratorów systemu
3. Wysyła email potwierdzający do nadawcy (jeśli podał email)
4. Wszystkie emaile są wysyłane asynchronicznie

### Możliwe błędy

**400 Bad Request:**
```json
{
  "message": "Błąd w formularzu",
  "errors": {
    "email": ["Wprowadź poprawny adres email."],
    "message": ["To pole nie może być puste."]
  }
}
```

**500 Internal Server Error:**
```json
{
  "message": "Wystąpił błąd podczas przetwarzania wiadomości"
}
```

---

## Kategorie projektów

System obsługuje następujące kategorie projektów:

- Planowanie przestrzenne
- Infrastruktura
- Transport
- Środowisko
- Budownictwo
- Geodezja
- Rolnictwo
- Leśnictwo
- Gospodarka wodna
- Ochrona przyrody
- Inne (domyślna)

---

## Strefy czasowe

### Konwersja czasu

Wszystkie daty i czasy zwracane przez API są automatycznie konwertowane do strefy czasowej użytkownika, jeśli jest ona ustawiona w profilu.

### Format dat i czasu

- **Data:** `DD-MM-YY` (np. "15-01-25")
- **Czas:** `HH:MM` (np. "14:30")

---

## Domeny projektów

### Automatyczne tworzenie domen

Jeśli projekt nie posiada przypisanej domeny, system automatycznie tworzy ją podczas pobierania listy projektów.

### Format domeny

```
nazwaprojektu2{timestamp}.localhost
```

Gdzie:
- `nazwaprojektu2` - stały prefix
- `{timestamp}` - mikrosekund znacznik czasowy
- `.localhost` - domena lokalna

### Aktualizacja domeny

Podczas aktualizacji projektu można zmienić nazwę domeny. System automatycznie doda suffix `.localhost`.

**Przykład:**
- Podana nazwa: `mojprojekt`
- Zapisana domena: `mojprojekt.localhost`

---

## Podużytkownicy (SubUsers)

### Dostęp do projektów

Główny użytkownik ma dostęp do:
1. Własnych projektów
2. Projektów wszystkich powiązanych podużytkowników

### Struktura powiązań

Powiązania między użytkownikami są przechowywane w modelu `SubUsers`:
- `customuser1` - użytkownik główny
- `customuser2` - podużytkownik

---

## Przykładowe przepływy

### Przepływ 1: Przeglądanie i aktualizacja projektu

```
1. GET /dashboard/projects/
   ← Otrzymuje listę projektów

2. Użytkownik wybiera projekt do edycji

3. PUT /dashboard/projects/update/
   Body: {
     "project": "projekt_01",
     "custom_project_name": "Nowa nazwa",
     "description": "Nowy opis"
   }
   ← Projekt zaktualizowany
```

### Przepływ 2: Aktualizacja profilu i zmiana hasła

```
1. PUT /dashboard/settings/profile/
   Body: {
     "first_name": "Jan",
     "last_name": "Nowak"
   }
   ← Profil zaktualizowany

2. PUT /dashboard/settings/password/
   Body: {
     "old_password": "stare123",
     "new_password": "nowe_bezpieczne456"
   }
   ← Hasło zmienione
```

### Przepływ 3: Kontakt z administracją

```
1. POST /dashboard/contact/
   Body: {
     "subject": "Pytanie",
     "name": "Jan Kowalski",
     "email": "jan@example.com",
     "message": "Treść pytania..."
   }
   ← Wiadomość wysłana
   ← Email wysłany do admina
   ← Potwierdzenie wysłane do użytkownika
```

---

## Bezpieczeństwo

### Autoryzacja

- Większość endpointów wymaga tokenu autoryzacyjnego
- Tylko właściciel projektu może go aktualizować
- System weryfikuje uprawnienia przed każdą operacją

### Walidacja danych

- Wszystkie dane wejściowe są walidowane przez serializery Django REST Framework
- Hasła są walidowane zgodnie z zasadami Django
- Adresy email są weryfikowane formatem

### Hasła

- Hasła są hashowane przed zapisem do bazy
- Zmiana hasła wymaga podania aktualnego hasła
- Po zmianie hasła sesja jest aktualizowana

---

## Kody statusu HTTP

| Kod | Znaczenie |
|-----|-----------|
| 200 | OK - Żądanie wykonane pomyślnie |
| 201 | Created - Zasób utworzony pomyślnie |
| 400 | Bad Request - Błędne dane wejściowe |
| 401 | Unauthorized - Brak autoryzacji |
| 404 | Not Found - Zasób nie został znaleziony |
| 500 | Internal Server Error - Błąd serwera |

---

## Uwagi końcowe

### Informacje o bazie danych

Endpoint `/dashboard/projects/` zwraca dane dostępowe do bazy PostgreSQL użytkownika. Te dane można wykorzystać do bezpośredniego połączenia z bazą danych dla zaawansowanych operacji.

### Emaile

System automatycznie wysyła emaile w następujących sytuacjach:
- Po rejestracji (email powitalny)
- Po wysłaniu wiadomości kontaktowej (do admina i użytkownika)

### Pliki QGS

Pole `qgs_exists` w projekcie informuje, czy istnieje plik `.qgs` (QGIS) dla danego projektu. Plik powinien znajdować się w lokalizacji:
```
qgs/{project_name}/{project_name}.qgs
```

### Wydajność

- Lista projektów jest pobierana efektywnie z użyciem relacji ORM
- Automatyczne tworzenie domen odbywa się tylko dla projektów bez domeny
- Wszystkie operacje bazodanowe są zoptymalizowane