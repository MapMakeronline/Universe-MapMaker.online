# Testing Guide - QGS Import End-to-End
**Date:** 2025-10-11
**Purpose:** Verify RTK Query integration with Django backend

---

## 🎯 Cel Testowania

Przetestować pełną funkcjonalność importu pliku QGS:
1. ✅ Frontend wysyła request do Django (RTK Query)
2. ✅ Django przetwarza plik QGS
3. ✅ Dane zapisują się w PostgreSQL
4. ✅ Warstwy importują się do bazy danych
5. ✅ Projekt pojawia się w dashboard

---

## 🚀 Przygotowanie do Testów

### Krok 1: Uruchom Frontend Lokalnie

Frontend już działa na: **http://localhost:3000**

```bash
# Sprawdź status:
curl http://localhost:3000
# Powinno zwrócić: HTTP 200
```

### Krok 2: Otwórz Przeglądarkę

1. Otwórz Chrome/Edge
2. Przejdź do: **http://localhost:3000**
3. Otwórz DevTools (F12)
4. Przejdź do zakładki **Network**
5. Zaznacz **Preserve log** (zachowaj logi między nawigacjami)

### Krok 3: Zaloguj Się

1. Kliknij **Login** (jeśli nie jesteś zalogowany)
2. Wpisz dane logowania:
   - Email: [twój email]
   - Password: [twoje hasło]
3. Zaloguj się

**WAŻNE:** Po zalogowaniu sprawdź w DevTools → Network:
- Powinien być request do `/auth/login`
- Status: **200 OK**
- Response powinien zawierać `token`

---

## 🧪 Scenariusz Testowy

### Test 1: Sprawdź Obecne Projekty

**Cel:** Zidentyfikować projekty do usunięcia

**Kroki:**
1. Po zalogowaniu automatycznie jesteś w Dashboard
2. Przejdź do zakładki **"Moje Projekty"**
3. Zobacz listę projektów

**DevTools - Network:**
- Request: `GET /dashboard/projects/`
- Status: **200 OK**
- Response: Lista projektów JSON

**Zapisz:**
- Ile projektów jest w bazie: ______
- Nazwy projektów: ______

---

### Test 2: Usuń Testowe Projekty

**Cel:** Wyczyścić bazę przed testem importu

**Kroki:**
1. Dla każdego projektu testowego:
   - Kliknij ikonę **Delete** (🗑️)
   - Potwierdź usunięcie
   - Poczekaj na komunikat sukcesu

**DevTools - Network (dla każdego delete):**
```
Request: POST /api/projects/delete/
Body: { "project": "nazwa_projektu" }
Status: 200 OK
Response: { "success": true }
```

**RTK Query DevTools:**
- Otwórz Redux DevTools (jeśli zainstalowane)
- Sprawdź `projectsApi/deleteProject/fulfilled`
- Cache invalidation: Tags `['Projects', 'Project']`

**Weryfikacja:**
- Lista projektów powinna być pusta
- Lub zostały tylko te, które chcesz zachować

---

### Test 3: Importuj Plik QGS

**Cel:** Zaimportować nowy projekt z pliku QGS

**Przygotowanie - Pobierz Testowy Plik QGS:**

Opcja A - Użyj istniejącego pliku (jeśli masz):
- Znajdź plik `.qgs` lub `.qgz` na dysku
- Przykład: `C:\Users\...\moj_projekt.qgs`

Opcja B - Pobierz z serwera (jeśli dostępny):
```bash
# SSH do VM i pobierz przykładowy plik
scp user@vm:/path/to/sample.qgs ./sample.qgs
```

Opcja C - Utwórz w QGIS Desktop:
1. Otwórz QGIS Desktop
2. Dodaj warstwę (np. OpenStreetMap)
3. Zapisz projekt jako `.qgs`

**Import przez Dashboard:**

1. Kliknij przycisk **"+ Nowy Projekt"**
2. Wybierz zakładkę **"Import QGS/QGZ"**
3. Wypełnij formularz:
   - **Nazwa projektu:** `test-import-2025-10-11`
   - **Kategoria:** Wybierz dowolną (np. "Planowanie przestrzenne")
   - **Plik QGS:** Wybierz plik `.qgs` lub `.qgz`
4. Kliknij **"Importuj"**

**WAŻNE - Obserwuj Network Tab:**

**Request #1 - Import Start:**
```http
POST https://api.universemapmaker.online/api/projects/import-qgs/
Content-Type: multipart/form-data

Headers:
  Authorization: Token abc123...

Body (FormData):
  project: test-import-2025-10-11
  qgs: [File object]
  onProgress: [Function] (opcjonalnie)
```

**Request #2 - Poller (opcjonalnie, jeśli backend zwraca task ID):**
```http
GET https://api.universemapmaker.online/api/projects/import-status/?task_id=xyz
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "db_name": "test-import-2025-10-11_1",  // ← Backend dodaje suffix!
    "message": "Project imported successfully",
    "layers_count": 5
  }
}
```

**Weryfikacja w DevTools:**
- Status: **200 OK** (lub 201 Created)
- Response time: Zwykle 10-30 sekund (zależy od rozmiaru)
- Response zawiera `db_name` (nazwa w bazie)

**RTK Query Cache Invalidation:**
- Sprawdź Redux DevTools:
  - `projectsApi/importQGS/fulfilled`
  - Tags invalidated: `['Projects', 'LIST']`
- Lista projektów powinna automatycznie się odświeżyć

**UI Feedback:**
- Progress bar powinien pokazywać postęp uploadu (0-100%)
- Po zakończeniu: komunikat sukcesu
- Automatyczne przekierowanie do listy projektów (opcjonalnie)

---

### Test 4: Weryfikacja w Dashboard

**Cel:** Sprawdzić czy projekt pojawił się na liście

**Kroki:**
1. Po imporcie lista projektów powinna automatycznie się odświeżyć
2. Znajdź projekt: `test-import-2025-10-11` (lub z suffixem `_1`)
3. Sprawdź detale:
   - ✅ Nazwa projektu
   - ✅ Miniatura (thumbnail) - może być placeholder
   - ✅ Data utworzenia
   - ✅ Status publikacji (unpublished)

**DevTools - Automatic Refetch:**
```http
GET /dashboard/projects/
Status: 200 OK
Response: [
  {
    "project_name": "test-import-2025-10-11_1",
    "published": false,
    "created_at": "2025-10-11T...",
    "thumbnail": "/api/projects/thumbnail/...",
    "layers_count": 5
  }
]
```

---

### Test 5: Otwórz Projekt na Mapie

**Cel:** Zweryfikować czy warstwy zostały zaimportowane

**Kroki:**
1. Kliknij na kartę projektu
2. Kliknij **"Otwórz"** lub **"Edytuj"**
3. Projekt powinien otworzyć się na mapie

**DevTools - Map Load:**
```http
Request #1 - Get Project Data:
GET /api/projects/data/?project=test-import-2025-10-11_1
Status: 200 OK
Response: {
  "tree": { /* QGIS project tree */ },
  "layers": [
    { "name": "layer1", "type": "vector", "geometry_type": "Polygon" },
    { "name": "layer2", "type": "raster" },
    ...
  ]
}

Request #2 - Get Layer Features (dla każdej warstwy):
POST /api/layer/features
Body: {
  "project_name": "test-import-2025-10-11_1",
  "layer_name": "layer1"
}
Status: 200 OK
Response: {
  "type": "FeatureCollection",
  "features": [...]
}
```

**Weryfikacja na Mapie:**
- ✅ Warstwy widoczne w drzewie warstw (LeftPanel)
- ✅ Geometrie renderują się na mapie
- ✅ Można kliknąć feature → Identify tool pokazuje atrybuty
- ✅ Można edytować feature (jeśli włączone)

---

## 🔍 Weryfikacja w Bazie Danych

### Opcja A: Przez Django Admin

1. Przejdź do: **https://api.universemapmaker.online/admin/**
2. Zaloguj się jako superuser
3. Przejdź do: **Geocraft API → Project Items**
4. Znajdź projekt: `test-import-2025-10-11_1`
5. Sprawdź:
   - ✅ `project_name`: test-import-2025-10-11_1
   - ✅ `published`: False
   - ✅ `owner`: Twój user
   - ✅ `created_at`: Dzisiejsza data

6. Przejdź do: **Geocraft API → Layers**
7. Filtruj po projekcie: `test-import-2025-10-11_1`
8. Sprawdź liczbę warstw (powinno być tyle ile w pliku QGS)

### Opcja B: Przez SQL Query (jeśli masz dostęp)

```sql
-- Sprawdź projekt
SELECT project_name, published, created_at, owner_id
FROM geocraft_api_projectitem
WHERE project_name LIKE 'test-import-2025-10-11%';

-- Sprawdź warstwy
SELECT layer_name, geometry_type, feature_count
FROM geocraft_api_layer
WHERE project_name = 'test-import-2025-10-11_1';

-- Sprawdź features (dla konkretnej warstwy)
SELECT COUNT(*) as total_features
FROM layer_features
WHERE project_name = 'test-import-2025-10-11_1'
  AND layer_name = 'nazwa_warstwy';
```

### Opcja C: Przez API Endpoint

```bash
# Get project details
curl -X GET "https://api.universemapmaker.online/api/projects/data/?project=test-import-2025-10-11_1" \
  -H "Authorization: Token YOUR_TOKEN"

# Expected response:
{
  "tree": { /* QGIS tree */ },
  "layers": [ /* Lista warstw */ ],
  "metadata": { /* Metadane */ }
}
```

---

## 📋 Checklist Weryfikacji

### ✅ Frontend (React + RTK Query)

- [ ] Request wysłany do `/api/projects/import-qgs/`
- [ ] Header `Authorization: Token ...` obecny
- [ ] Body zawiera `FormData` z plikiem
- [ ] Progress bar działa (0-100%)
- [ ] Response status: **200 OK**
- [ ] Response zawiera `db_name`
- [ ] Cache invalidation: Tags `['Projects', 'LIST']`
- [ ] Lista projektów auto-refetch
- [ ] Nowy projekt widoczny na liście

### ✅ Backend (Django)

- [ ] Django otrzymał request (sprawdź logi)
- [ ] Plik QGS zapisany w Storage FASE
- [ ] Projekt utworzony w PostgreSQL
- [ ] Warstwy zaimportowane do bazy
- [ ] Features zapisane (geometry + properties)
- [ ] Thumbnail wygenerowany (opcjonalnie)
- [ ] Response zwrócony do frontendu

### ✅ Database (PostgreSQL + PostGIS)

- [ ] Tabela `geocraft_api_projectitem` - nowy rekord
- [ ] Tabela `geocraft_api_layer` - rekordy warstw
- [ ] Tabele `layer_features` - geometry + properties
- [ ] Relacje między tabelami poprawne
- [ ] Indeksy GiST na geometry (dla wydajności)

### ✅ RTK Query Behavior

- [ ] Hook `useImportQGSMutation` zwrócił sukces
- [ ] Loading state działał (`isLoading: true → false`)
- [ ] Error handling nie został wywołany
- [ ] Cache tags były invalidowane
- [ ] Query `useGetProjectsQuery` automatycznie refetch

---

## 🐛 Troubleshooting

### Problem: Request failed - 400 Bad Request

**Przyczyna:** Nieprawidłowy format danych

**Rozwiązanie:**
1. Sprawdź czy plik jest `.qgs` lub `.qgz`
2. Sprawdź czy nazwa projektu jest unikalna
3. Sprawdź logi Django (backend)

**DevTools:**
```
Request failed: 400
Response: {
  "error": "Invalid QGS file format"
}
```

### Problem: Request failed - 401 Unauthorized

**Przyczyna:** Token wygasł lub nieprawidłowy

**Rozwiązanie:**
1. Wyloguj się i zaloguj ponownie
2. Sprawdź localStorage → `authToken`
3. Zweryfikuj token w Django admin

### Problem: Request failed - 500 Internal Server Error

**Przyczyna:** Błąd na backendzie

**Rozwiązanie:**
1. Sprawdź logi Django:
   ```bash
   gcloud compute ssh universe-backend --zone=europe-central2-a \
     --command="sudo docker logs -f universe-mapmaker-backend_django_1"
   ```
2. Szukaj stacktrace błędu
3. Sprawdź czy Storage FASE jest dostępny

### Problem: Projekt nie pojawia się na liście

**Przyczyna:** Cache nie został invalidated

**Rozwiązanie:**
1. Sprawdź Redux DevTools → RTK Query
2. Ręcznie refetch:
   ```javascript
   // W konsoli przeglądarki:
   window.location.reload(); // Force refresh
   ```
3. Lub kliknij "Refresh" w UI

### Problem: Warstwy nie ładują się na mapie

**Przyczyna:** Backend nie zwrócił danych warstw

**Rozwiązanie:**
1. Sprawdź Network tab: `/api/layer/features`
2. Sprawdź czy warstwy są w bazie danych
3. Sprawdź czy geometrie są w poprawnym formacie (WKT/GeoJSON)

---

## 📊 Expected Network Flow

### Pełny flow importu QGS:

```
1. User clicks "Importuj"
   ↓
2. Frontend: useImportQGSMutation() wywołane
   ↓
3. RTK Query: POST /api/projects/import-qgs/
   Headers: Authorization: Token abc...
   Body: FormData { project, qgs }
   ↓
4. Django: Receives request
   - Validate token
   - Validate file
   - Parse QGS XML
   - Extract layers
   ↓
5. Django: Save to database
   - Create ProjectItem record
   - Create Layer records
   - Extract & save features
   - Generate thumbnail (optional)
   ↓
6. Django: Save QGS to Storage FASE
   - Save to /mnt/qgis-projects/project_name.qgs
   ↓
7. Django: Return response
   Response: { success: true, data: { db_name: "..." } }
   ↓
8. RTK Query: Cache invalidation
   - Invalidate tags: ['Projects', 'LIST']
   ↓
9. Frontend: Auto-refetch projects
   - GET /dashboard/projects/ triggered
   ↓
10. UI: Update projects list
   - New project appears
   - User sees success message
```

---

## 📸 Screenshots to Take

**Dla dokumentacji:**

1. **DevTools → Network tab:**
   - Request do `/api/projects/import-qgs/`
   - Response z `db_name`
   - Auto-refetch `/dashboard/projects/`

2. **Redux DevTools:**
   - `projectsApi/importQGS/pending`
   - `projectsApi/importQGS/fulfilled`
   - Cache invalidation tags

3. **Dashboard:**
   - Lista projektów przed importem
   - Progress bar podczas importu
   - Lista projektów po imporcie (nowy projekt widoczny)

4. **Map View:**
   - Drzewo warstw (LeftPanel)
   - Geometrie na mapie
   - Identify tool z atrybutami

5. **Database (opcjonalnie):**
   - Django Admin → ProjectItem
   - Django Admin → Layers
   - SQL query results

---

## ✅ Success Criteria

Test jest **SUKCESEM** jeśli:

1. ✅ Plik QGS został wysłany do Django (Network tab: 200 OK)
2. ✅ Django przetworzył plik i zwrócił `db_name`
3. ✅ Projekt pojawił się w PostgreSQL (można zweryfikować przez API)
4. ✅ Warstwy zostały zaimportowane do bazy
5. ✅ Features (geometrie) są widoczne na mapie
6. ✅ RTK Query automatycznie odświeżył listę projektów
7. ✅ Żadnych błędów w konsoli (frontend/backend)

**Jeśli wszystkie kryteria spełnione → Migracja RTK Query DZIAŁA POPRAWNIE! 🎉**

---

## 📝 Raport z Testów (Wypełnij po teście)

### Informacje Podstawowe

- **Data testu:** _________________
- **Tester:** _________________
- **Przeglądarka:** _________________
- **Plik QGS:** _________________ (nazwa i rozmiar)

### Wyniki

**Test 1 - Sprawdzenie projektów:**
- Liczba projektów przed testem: _____
- Projekty usunięte: _____

**Test 2 - Import QGS:**
- Request status: _____ (200 OK / błąd)
- Response time: _____ sekund
- `db_name` z response: _________________
- Progress bar działał: ☐ TAK ☐ NIE

**Test 3 - Weryfikacja w Dashboard:**
- Projekt pojawił się na liście: ☐ TAK ☐ NIE
- Thumbnail wygenerowany: ☐ TAK ☐ NIE
- Auto-refetch zadziałał: ☐ TAK ☐ NIE

**Test 4 - Weryfikacja na mapie:**
- Liczba warstw zaimportowanych: _____
- Geometrie widoczne: ☐ TAK ☐ NIE
- Identify tool działa: ☐ TAK ☐ NIE

**Test 5 - Weryfikacja w bazie:**
- Projekt w PostgreSQL: ☐ TAK ☐ NIE
- Warstwy w bazie: _____ (liczba)
- Features w bazie: _____ (liczba dla wybranej warstwy)

### Problemy Napotkane

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Notatki Dodatkowe

_________________________________________________________
_________________________________________________________
_________________________________________________________

### Ocena Końcowa

☐ **SUKCES** - Wszystko działa zgodnie z oczekiwaniami
☐ **PARTIAL SUCCESS** - Większość funkcji działa, drobne problemy
☐ **FAILURE** - Poważne problemy wymagające naprawy

---

**Dokument utworzony:** 2025-10-11
**Frontend:** http://localhost:3000
**Backend API:** https://api.universemapmaker.online
**Dokumentacja:** Wszystkie raporty migracji w `docs/`
