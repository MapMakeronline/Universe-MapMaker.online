# 🧪 Testing Guide - Backend Integration

## ✅ Server Status

**Development Server:** Running at http://localhost:3000

## 📋 Test Pages Created

### 1. API Test Page
**URL:** http://localhost:3000/test-api

**Co testuje:**
- HTTP Client connectivity
- Authentication token presence
- Projects API (fetch projects)
- User profile API

**Jak używać:**
1. Otwórz http://localhost:3000/test-api
2. Najpierw kliknij "Check Token" - sprawdzi czy jesteś zalogowany
3. Jeśli nie ma tokenu, przejdź do `/auth` i zaloguj się
4. Wróć i kliknij "Fetch Projects" - powinno zwrócić listę projektów
5. Sprawdź konsolę przeglądarki (F12) - logi zaczynają się od 🗺️

### 2. Dashboard Test Page
**URL:** http://localhost:3000/test-dashboard

**Co testuje:**
- Pełny komponent Dashboard z integracją backendu
- Create Project (Nowy projekt)
- Delete Project (Usuń projekt)
- Toggle Publish (Publikuj/Ukryj)
- Project Card rendering

**Jak używać:**
1. Otwórz http://localhost:3000/test-dashboard
2. Zaloguj się jeśli jeszcze nie jesteś (link w alertzie)
3. Przetestuj wszystkie operacje CRUD

---

## 🔍 Step-by-Step Testing

### Krok 1: Sprawdź czy backend działa

Otwórz w przeglądarce lub Postman:
```
https://geocraft-production.up.railway.app/
```

Powinno zwrócić status 200 lub Django admin page.

### Krok 2: Rejestracja/Logowanie

1. Otwórz http://localhost:3000/auth
2. Przejdź do zakładki "Rejestracja"
3. Wypełnij formularz:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `TestPass123!`
   - Imię: `Test`
   - Nazwisko: `User`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Redirect na Dashboard
- ✅ W localStorage jest `authToken`
- ✅ W konsoli: `🗺️ [POST] https://geocraft-production.up.railway.app/auth/register`

### Krok 3: Test API Connection

1. Otwórz http://localhost:3000/test-api
2. Kliknij "Check Token"

**Oczekiwany rezultat:**
```json
{
  "test": "Check Auth Token",
  "data": {
    "token": "abc123...",
    "exists": true
  }
}
```

3. Kliknij "Fetch Projects"

**Oczekiwany rezultat:**
```json
{
  "test": "Fetch Projects",
  "data": {
    "list_of_projects": [...],
    "db_info": {
      "login": "user_xxx",
      "password": "xxx",
      "host": "xxx",
      "port": "5432"
    }
  }
}
```

### Krok 4: Test Dashboard CRUD

1. Otwórz http://localhost:3000/test-dashboard
2. Kliknij "Nowy projekt" (przycisk w prawym górnym rogu)
3. Wypełnij formularz:
   - Nazwa projektu: `test-project-1` (min 4 znaki)
   - Nazwa wyświetlana: `Test Project 1`
   - Opis: `This is a test project`
   - Kategorie: zaznacz `Inne`
4. Kliknij "Utwórz projekt"

**Oczekiwany rezultat:**
- ✅ Dialog się zamyka
- ✅ Pojawia się zielony Snackbar: "Projekt został utworzony pomyślnie!"
- ✅ Nowy projekt pojawia się na liście
- ✅ W konsoli: `🗺️ [POST] .../projects/create/`

5. Kliknij menu ⋮ na karcie projektu
6. Wybierz "Opublikuj projekt"

**Oczekiwany rezultat:**
- ✅ Badge zmienia się na "OPUBLIKOWANY"
- ✅ Snackbar: "Projekt został opublikowany!"

7. Kliknij menu ⋮ → "Usuń projekt"
8. Zaznacz checkbox potwierdzenia
9. Kliknij "Usuń projekt"

**Oczekiwany rezultat:**
- ✅ Projekt znika z listy
- ✅ Snackbar: "Projekt został usunięty"

---

## 🐛 Debugging Tips

### Konsola przeglądarki (F12)

**Logi API (prefix 🗺️):**
```
🗺️ [GET] https://geocraft-production.up.railway.app/dashboard/projects/
🗺️ [POST] https://geocraft-production.up.railway.app/projects/create/
```

**Redux Actions (w Redux DevTools):**
```
projects/fetchProjects/pending
projects/fetchProjects/fulfilled
projects/createProject/pending
projects/createProject/fulfilled
```

### Network Tab

1. Otwórz DevTools (F12)
2. Przejdź do zakładki "Network"
3. Filtruj: "Fetch/XHR"
4. Kliknij na request → Headers → Request Headers
5. Sprawdź czy jest `Authorization: Token xxx`

### Redux DevTools

1. Zainstaluj extension: [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/)
2. Otwórz DevTools → Redux tab
3. Sprawdź state tree:
   ```
   projects: {
     projects: [...],
     currentProject: null,
     isLoading: false,
     error: null
   }
   ```

### Common Errors

**401 Unauthorized:**
```
Error: HTTP 401: Unauthorized
```
**Rozwiązanie:** Zaloguj się ponownie, token wygasł.

**CORS Error:**
```
Access to fetch at '...' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Rozwiązanie:** Backend musi mieć `http://localhost:3000` w `CORS_ALLOWED_ORIGINS`.

**Network Error:**
```
Failed to fetch
```
**Rozwiązanie:**
- Sprawdź czy backend działa
- Sprawdź `NEXT_PUBLIC_API_URL` w `.env.local`

---

## ✅ Test Checklist

### API Client
- [ ] HTTP Client działa (GET, POST, PUT, DELETE)
- [ ] Tokeny są automatycznie dodawane do requestów
- [ ] Error handling działa (ApiError class)
- [ ] Logi w konsoli są widoczne (🗺️ prefix)

### Projects API
- [ ] `getProjects()` - zwraca listę projektów
- [ ] `createProject()` - tworzy nowy projekt
- [ ] `deleteProject()` - usuwa projekt
- [ ] `togglePublishProject()` - publikuje/ukrywa projekt

### Redux Integration
- [ ] `projectsSlice` jest w store
- [ ] `fetchProjects` thunk działa
- [ ] `createProject` thunk działa
- [ ] `deleteProject` thunk działa
- [ ] Loading states działają (skeleton loaders)
- [ ] Error states działają (error alerts)

### Dashboard UI
- [ ] Projekty się ładują po zalogowaniu
- [ ] "Nowy projekt" dialog działa
- [ ] Tworzenie projektu działa
- [ ] Usuwanie projektu działa
- [ ] Publikacja projektu działa
- [ ] Snackbar notifications działają

---

## 📊 Expected Backend Responses

### POST /auth/login
```json
{
  "token": "abc123def456...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }
}
```

### GET /dashboard/projects/
```json
{
  "list_of_projects": [
    {
      "project_name": "test-project-1",
      "custom_project_name": "Test Project 1",
      "published": false,
      "logoExists": false,
      "description": "Test description",
      "keywords": "test",
      "project_date": "2025-10-06",
      "project_time": "18:00:00",
      "domain_name": "test-project-1.mapmaker.online",
      "domain_url": "https://test-project-1.mapmaker.online",
      "categories": "Inne",
      "qgs_exists": false
    }
  ],
  "db_info": {
    "login": "user_xxx",
    "password": "xxx",
    "host": "localhost",
    "port": "5432"
  }
}
```

### POST /projects/create/
```json
{
  "project_name": "test-project-1",
  "custom_project_name": "Test Project 1",
  "published": false,
  "description": "Test description",
  ...
}
```

---

## 🎯 Next Steps After Testing

Jeśli wszystko działa:
1. ✅ Zakończ testowanie Fazy 1
2. 🚀 Rozpocznij Fazę 2: Core Features
   - Full layer management (Shapefile, KML, GML)
   - Style editor
   - QGIS Server integration

Jeśli są błędy:
1. 🐛 Zgłoś błędy w konsoli
2. 🔧 Napraw błędy
3. 🔄 Przetestuj ponownie

---

## 📞 Support

**Backend Repo:** `Universe-Mapmaker-Backend/`
**Integration Docs:** `BACKEND-INTEGRATION.md`
**Project Docs:** `CLAUDE.md`

Powodzenia w testach! 🚀
