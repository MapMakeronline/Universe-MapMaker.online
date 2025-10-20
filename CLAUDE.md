# CLAUDE.md - Universe MapMaker Frontend

**Instrukcje dla Claude Code przy pracy z tym projektem.**

---

## 📋 Metodologia Pracy

**KRYTYCZNE:** Przeczytaj i stosuj zasady z [METHODOLOGY.md](./METHODOLOGY.md) przy każdym refaktorze!

### Kluczowe zasady:

1. **Backend-First Integration** - Zawsze weryfikuj endpoint w dokumentacji PRZED implementacją frontendu
2. **@/backend Pattern ONLY** - Jedna metoda komunikacji z API (RTK Query + baseApi)
3. **Small Iterations** - Małe kroki, częste commity, częste testy
4. **Mock Missing APIs** - Nie blokuj się brakiem endpointów - dodaj mock + TODO
5. **Clear Cache When Needed** - `rm -rf .next` po zmianach struktury folderów

**Szczegółowe zasady:** Zobacz [METHODOLOGY.md](./METHODOLOGY.md)

---

## 🏗️ Architektura Projektu

### Backend API Integration

**Centralized API Pattern:**
```
src/backend/
├── client/base-api.ts       # Single baseApi (RTK Query)
├── projects/projects.api.ts # Projects endpoints
├── users/users.api.ts       # Users endpoints
├── auth/auth.api.ts         # Auth endpoints (TODO)
└── types.ts                 # Shared TypeScript types
```

**Zawsze używaj:**
```typescript
import { useGetProjectsQuery } from '@/backend/projects';
import { useUpdateProfileMutation } from '@/backend/users';
```

**Dokumentacja API:**
- Dashboard API: `docs/backend/dashboard_api_docs.md`
- Projects API: `docs/backend/projects_api_docs.md`

---

### Frontend UI Components

**Feature-Based Structure:**
```
src/features/dashboard/components/
├── own-projects/            # Moje Projekty tab
├── public-projects/         # Publiczne Projekty tab
├── settings/                # Ustawienia tab
└── shared/                  # Wspólne komponenty
```

**Importy przez barrel exports:**
```typescript
import { OwnProjects, PublicProjects } from '@/features/dashboard/components';
```

---

## 🔧 Development Workflow

### Dodawanie nowego endpointu

1. **Sprawdź dokumentację backend**
   ```bash
   # Zobacz docs/backend/dashboard_api_docs.md
   ```

2. **Przetestuj endpoint curl/Postman**
   ```bash
   curl -X GET "https://api.universemapmaker.online/dashboard/projects/" \
     -H "Authorization: Token YOUR_TOKEN"
   ```

3. **Dodaj RTK Query endpoint**
   ```typescript
   // src/backend/projects/projects.api.ts
   getProjects: builder.query<ProjectsResponse, void>({
     query: () => '/dashboard/projects/',
     providesTags: [{ type: 'Projects', id: 'LIST' }],
   }),
   ```

4. **Użyj w komponencie**
   ```typescript
   import { useGetProjectsQuery } from '@/backend/projects';

   const { data, isLoading, error } = useGetProjectsQuery();
   ```

5. **Test → Verify → Commit**
   ```bash
   npm run dev
   # Test w przeglądarce
   git add .
   git commit -m "feat: add getProjects endpoint"
   ```

---

## 🚫 Co USUNĘLIŚMY podczas refaktoru (2025-01-20)

**NIE używaj tych ścieżek - zostały usunięte:**

❌ `src/api/endpointy/` - stare API
❌ `src/redux/api/` - stare RTK Query
❌ `src/backend/dashboard/` - UI komponenty (przeniesione do features)

**Jeśli widzisz import z tych lokalizacji → BŁĄD → Zmień na @/backend!**

---

## 📦 Dependencies & Tools

- **Next.js** 15.5.4 - Frontend framework
- **Redux Toolkit** - State management
- **RTK Query** - API calls (baseApi pattern)
- **Material-UI v5** - UI components
- **TypeScript** - Type safety

---

## 🧪 Testing

**Minimum test przed commitem:**
```bash
# 1. Serwer dev bez błędów
npm run dev

# 2. Dashboard działa
curl http://localhost:3000/dashboard  # 200 OK

# 3. Console bez czerwonych błędów
# Sprawdź w przeglądarce: F12 → Console
```

**Kompletny test:**
```bash
# 1. Wszystkie endpointy Dashboard
- GET /dashboard/projects/ (lista projektów)
- PUT /dashboard/projects/update/ (edycja metadanych)
- PUT /dashboard/settings/profile/ (edycja profilu)

# 2. UI działa
- localhost:3000/dashboard - lista projektów się ładuje
- Kliknij "Ustawienia" projektu → zmień nazwę → zapisz
- Zakładka "Ustawienia" → zmień imię → zapisz
```

---

## 🔄 Refactoring Checklist

Przed każdym refaktorem:

- [ ] ✅ Przeczytaj [METHODOLOGY.md](./METHODOLOGY.md)
- [ ] ✅ Sprawdź dokumentację backend endpoint
- [ ] ✅ Przetestuj endpoint curl/Postman
- [ ] ✅ Dodaj RTK Query w @/backend
- [ ] ✅ Użyj w komponencie UI
- [ ] ✅ Test w przeglądarce
- [ ] ✅ Commit małych zmian
- [ ] ✅ Wyczyść .next cache jeśli potrzeba

---

## 📚 Dokumentacja

### Backend API
- **Dashboard API:** `docs/backend/dashboard_api_docs.md` (45 endpointów)
- **Projects API:** `docs/backend/projects_api_docs.md` (szczegóły projektów)

### Frontend
- **Metodologia:** [METHODOLOGY.md](./METHODOLOGY.md) - **PRZECZYTAJ TO PIERWSZE!**
- **UI Audit:** `UI-AUDIT-REPORT.md` (analiza komponentów)
- **Architecture:** Ten plik (CLAUDE.md)

---

## 🎯 Current Status (2025-01-20)

### ✅ Zakończone
- Refaktor Dashboard do @/backend pattern
- Usunięcie 3000+ linii duplikatów
- Migracja 3 endpointów Dashboard
- Dokumentacja metodologii (METHODOLOGY.md)

### 🚧 W toku
- Endpoint #4: PUT /dashboard/settings/password/
- Endpoint #5: POST /dashboard/contact/

### ⏳ Kolejka
- Layers API (strona /map)
- Styles API (stylowanie warstw)
- Admin Panel (migracja do @/backend)

---

## 💡 Tips for Claude Code

1. **Zawsze czytaj METHODOLOGY.md przed refaktorem**
2. **Nie zgaduj struktury API - sprawdź docs/backend/**
3. **Mockuj brakujące API zamiast blokować postęp**
4. **rm -rf .next po zmianach folderów**
5. **Małe commity > wielkie zmiany**
6. **Test PRZED commitem, nie PO**

---

**Ostatnia aktualizacja:** 2025-01-20
**Refaktor Dashboard:** ✅ Zakończony
**Metodologia:** ✅ Udokumentowana w METHODOLOGY.md
