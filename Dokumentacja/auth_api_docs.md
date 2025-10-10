# Dokumentacja API - Moduł Auth (Autoryzacja)

## Spis treści
- [Rejestracja użytkownika](#rejestracja-użytkownika)
- [Logowanie](#logowanie)
- [Wylogowanie](#wylogowanie)
- [Profil użytkownika](#profil-użytkownika)

---

## Rejestracja użytkownika

Tworzy nowe konto użytkownika wraz z dedykowaną bazą danych PostgreSQL.

**Endpoint:** `/auth/register`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `username` | string | Tak | Nazwa użytkownika (unikalna) |
| `email` | string | Tak | Adres email użytkownika |
| `password` | string | Tak | Hasło użytkownika |
| `password_confirm` | string | Tak | Potwierdzenie hasła (musi być identyczne z password) |
| `first_name` | string | Tak | Imię użytkownika |
| `last_name` | string | Tak | Nazwisko użytkownika |

### Przykład żądania

```json
{
  "username": "jan_kowalski",
  "email": "jan.kowalski@example.com",
  "password": "bezpieczne_haslo123",
  "password_confirm": "bezpieczne_haslo123",
  "first_name": "Jan",
  "last_name": "Kowalski"
}
```

### Odpowiedź sukcesu (201 Created)

```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 42,
    "username": "jan_kowalski",
    "email": "jan.kowalski@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "address": null,
    "city": null,
    "zip_code": null,
    "nip": null,
    "company_name": null,
    "theme": null
  }
}
```

### Opis działania

Podczas rejestracji system:
1. Waliduje, czy hasła są identyczne
2. Generuje unikalny login do bazy danych (`dbLogin`) na podstawie adresu email i znacznika czasowego
3. Generuje bezpieczne 20-znakowe hasło do bazy danych (`dbPassword`)
4. Tworzy konto użytkownika w systemie
5. Tworzy dedykowanego użytkownika PostgreSQL z uprawnieniami:
   - LOGIN
   - NOSUPERUSER
   - INHERIT
   - NOCREATEDB
   - NOCREATEROLE
   - NOREPLICATION
6. Generuje token autoryzacyjny
7. Wysyła email powitalny na podany adres

### Możliwe błędy

**400 Bad Request:**
```json
{
  "password": ["Hasła nie są identyczne"]
}
```
lub
```json
{
  "username": ["Użytkownik o tej nazwie już istnieje"]
}
```

**500 Internal Server Error:**
```json
{
  "error": "Nie udało się utworzyć użytkownika bazy danych"
}
```

---

## Logowanie

Loguje użytkownika i zwraca token autoryzacyjny.

**Endpoint:** `/auth/login`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Nie

### Parametry

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `username` | string | Tak | Nazwa użytkownika |
| `password` | string | Tak | Hasło użytkownika |

### Przykład żądania

```json
{
  "username": "jan_kowalski",
  "password": "bezpieczne_haslo123"
}
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 42,
    "username": "jan_kowalski",
    "email": "jan.kowalski@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "address": "ul. Główna 123",
    "city": "Warszawa",
    "zip_code": "00-001",
    "nip": "1234567890",
    "company_name": "Firma ABC",
    "theme": "dark"
  }
}
```

### Opis działania

1. System weryfikuje podane dane logowania
2. Sprawdza, czy konto użytkownika jest aktywne
3. Zwraca lub tworzy nowy token autoryzacyjny
4. Zwraca kompletne dane użytkownika

### Możliwe błędy

**400 Bad Request:**
```json
{
  "non_field_errors": ["Nieprawidłowe dane logowania"]
}
```
lub
```json
{
  "non_field_errors": ["Konto użytkownika jest nieaktywne"]
}
```
lub
```json
{
  "non_field_errors": ["Wymagana jest nazwa użytkownika i hasło"]
}
```

---

## Wylogowanie

Wylogowuje użytkownika poprzez usunięcie tokenu autoryzacyjnego.

**Endpoint:** `/auth/logout`  
**Metoda:** `POST`  
**Wymagana autoryzacja:** Tak

### Parametry

Brak parametrów w body żądania. Token autoryzacyjny przekazywany w nagłówku.

### Przykład żądania

```
POST /auth/logout
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

### Opis działania

1. System identyfikuje użytkownika na podstawie tokenu w nagłówku
2. Usuwa token autoryzacyjny z bazy danych
3. Po wylogowaniu token staje się nieważny i nie może być już używany

### Możliwe błędy

**400 Bad Request:**
```json
{
  "error": "Error logging out"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid token."
}
```

---

## Profil użytkownika

Pobiera dane profilu aktualnie zalogowanego użytkownika.

**Endpoint:** `/auth/profile`  
**Metoda:** `GET`  
**Wymagana autoryzacja:** Tak

### Parametry

Brak parametrów. Użytkownik identyfikowany jest na podstawie tokenu.

### Przykład żądania

```
GET /auth/profile
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

### Odpowiedź sukcesu (200 OK)

```json
{
  "id": 42,
  "username": "jan_kowalski",
  "email": "jan.kowalski@example.com",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "address": "ul. Główna 123",
  "city": "Warszawa",
  "zip_code": "00-001",
  "nip": "1234567890",
  "company_name": "Firma ABC",
  "theme": "dark"
}
```

### Pola użytkownika

| Pole | Typ | Opis |
|------|-----|------|
| `id` | integer | Unikalny identyfikator użytkownika |
| `username` | string | Nazwa użytkownika |
| `email` | string | Adres email |
| `first_name` | string | Imię |
| `last_name` | string | Nazwisko |
| `address` | string | Adres (opcjonalny) |
| `city` | string | Miasto (opcjonalny) |
| `zip_code` | string | Kod pocztowy (opcjonalny) |
| `nip` | string | NIP (opcjonalny) |
| `company_name` | string | Nazwa firmy (opcjonalny) |
| `theme` | string | Motyw interfejsu (opcjonalny) |

### Możliwe błędy

**401 Unauthorized:**
```json
{
  "detail": "Invalid token."
}
```
lub
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Autoryzacja w żądaniach

### Token Authentication

System używa tokenowej autoryzacji. Po zalogowaniu lub rejestracji otrzymujesz token, który należy dołączać do każdego żądania wymagającego autoryzacji.

### Nagłówek autoryzacyjny

```
Authorization: Token {twój_token}
```

### Przykład z curl

```bash
curl -X GET https://api.example.com/auth/profile \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

### Przykład z JavaScript (fetch)

```javascript
fetch('https://api.example.com/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Bezpieczeństwo

### Generowanie hasła do bazy danych

System automatycznie generuje bezpieczne 20-znakowe hasło dla użytkownika bazy danych PostgreSQL. Hasło składa się z:
- Wielkich i małych liter (a-z, A-Z)
- Cyfr (0-9)
- Generowane jest kryptograficznie bezpiecznym generatorem `secrets`

### Format dbLogin

Login do bazy danych generowany jest automatycznie według wzoru:
```
{część_przed_@_z_emaila}_{znacznik_czasowy}
```

Przykład:
- Email: `jan.kowalski@example.com`
- dbLogin: `jan_kowalski_123456`

Kropki w emailu są zamieniane na podkreślniki.

### Transakcje atomowe

Proces rejestracji jest wykonywany w transakcji atomowej. Jeśli utworzenie użytkownika bazy danych nie powiedzie się, konto użytkownika w systemie zostanie automatycznie usunięte.

---

## Przepływ użycia

### Typowy przepływ rejestracji i logowania

```
1. Użytkownik → POST /auth/register
   ← Otrzymuje token i dane użytkownika

2. Użytkownik zapisuje token lokalnie

3. Użytkownik → GET /auth/profile (z tokenem)
   ← Otrzymuje dane profilu

4. Użytkownik → POST /auth/logout (z tokenem)
   ← Token zostaje unieważniony
```

### Przechowywanie tokenu

**Zalecane:**
- W aplikacjach webowych: localStorage lub sessionStorage
- W aplikacjach mobilnych: Secure Storage / Keychain
- W aplikacjach desktopowych: Encrypted file storage

**Niezalecane:**
- Przechowywanie w cookies bez flag HttpOnly i Secure
- Przechowywanie w zwykłych plikach tekstowych
- Przechowywanie w kodzie źródłowym

---

## Kody statusu HTTP

| Kod | Znaczenie |
|-----|-----------|
| 200 | OK - Żądanie wykonane pomyślnie |
| 201 | Created - Zasób utworzony pomyślnie (rejestracja) |
| 400 | Bad Request - Błędne dane wejściowe |
| 401 | Unauthorized - Brak autoryzacji lub nieprawidłowy token |
| 500 | Internal Server Error - Błąd serwera (np. problem z bazą danych) |

---

## Uwagi końcowe

### Email powitalny

Po pomyślnej rejestracji system automatycznie wysyła email powitalny na podany adres. Email jest wysyłany asynchronicznie i nie wpływa na czas odpowiedzi API.

### Ważność tokenu

Tokeny w Django REST Framework są domyślnie ważne bezterminowo, dopóki nie zostaną usunięte przez wylogowanie lub ręcznie przez administratora.

### Limity

Należy rozważyć implementację:
- Rate limiting dla endpointu logowania (ochrona przed brute-force)
- Rate limiting dla endpointu rejestracji (ochrona przed spamem)
- Weryfikację emaila przed pełną aktywacją konta

### Bezpieczeństwo haseł

- Hasła są hashowane przez Django przed zapisaniem do bazy danych
- System używa PBKDF2 z SHA256 jako domyślnego algorytmu hashowania
- Nie należy przesyłać haseł przez niezabezpieczone połączenia (tylko HTTPS)