# Development Methodology - Universe MapMaker Frontend

## Zasady refaktoryzacji i pracy z kodem

### 1. **Backend-First Integration** ✅

**ZAWSZE** sprawdź backend przed implementacją frontendu:

1. ✅ Sprawdź czy endpoint istnieje w `docs/backend/dashboard_api_docs.md`
2. ✅ Zweryfikuj strukturę request/response w dokumentacji
3. ✅ Przetestuj endpoint curl/Postman PRZED integracją
4. ✅ Jeśli endpoint nie działa - zapytaj użytkownika, nie implementuj na ślepo

**Przykład dobrej praktyki:**
```bash
# PRZED napisaniem kodu frontend sprawdź:
curl -X GET "https://api.universemapmaker.online/dashboard/projects/" \
  -H "Authorization: Token YOUR_TOKEN"

# Jeśli 200 OK + poprawne dane → dopiero wtedy twórz RTK Query
```

---

### 2. **Centralized API Pattern (@/backend)** ✅

**JEDNA metoda komunikacji z backendem:**

```
src/backend/
├── client/
│   └── base-api.ts          # Jeden baseApi dla WSZYSTKICH endpointów
├── projects/
│   ├── projects.api.ts      # RTK Query endpoints dla projektów
│   └── index.ts             # Barrel export
├── users/
│   ├── users.api.ts         # RTK Query endpoints dla użytkowników
│   └── index.ts
└── types.ts                 # Wspólne typy TypeScript
```

**Zawsze używaj:**
```typescript
// ✅ POPRAWNIE - import z @/backend
import { useGetProjectsQuery, useCreateProjectMutation } from '@/backend/projects';
import { useUpdateProfileMutation } from '@/backend/users';

// ❌ ŹLE - stare API (usunięte podczas refaktoru)
import { useGetProjectsQuery } from '@/redux/api/projectsApi';
import { unifiedUserApi } from '@/api/endpointy/unified-user';
```

---

### 3. **Feature-Based UI Structure** ✅

**UI komponenty organizowane według funkcjonalności:**

```
src/features/dashboard/components/
├── own-projects/
│   ├── OwnProjects.tsx           # Główny komponent
│   ├── ProjectCard.tsx           # Card projektu
│   ├── CreateProjectDialog.tsx   # Modal tworzenia
│   ├── ProjectSettingsDialog.tsx # Modal ustawień
│   └── index.ts                  # Barrel export
├── public-projects/
│   ├── PublicProjects.tsx
│   └── index.ts
├── settings/
│   ├── UserSettings.tsx
│   └── index.ts
└── index.ts                      # Centralny export
```

**Importy:**
```typescript
// ✅ POPRAWNIE - barrel exports
import { OwnProjects, PublicProjects, UserSettings } from '@/features/dashboard/components';

// ❌ ŹLE - bezpośrednie importy
import OwnProjects from '@/features/dashboard/komponenty/OwnProjects';
```

---

### 4. **Incremental Refactoring** ✅

**Zasada małych kroków:**

1. ✅ **Jeden endpoint na raz** - nie implementuj 5 funkcji naraz
2. ✅ **Test → Verify → Commit** - małe iteracje zamiast wielkich zmian
3. ✅ **Mock what's missing** - jeśli API nie działa, dodaj mock i dokumentuj TODO
4. ✅ **Delete old code immediately** - nie zostawiaj zduplikowanego kodu

**Przykład:**
```typescript
// Endpoint nie istnieje jeszcze? Dodaj mock + TODO:

// TODO: Implement contact API endpoint (endpoint #5 w kolejce)
// await sendContactForm({ subject, message });

// Temporary mock
await new Promise(resolve => setTimeout(resolve, 1000));
setSubmitSuccess(true);
```

---

### 5. **No Breaking Changes During Migration** ✅

**Zachowaj działające funkcje:**

- ✅ Najpierw dodaj NOWY kod (@/backend)
- ✅ Zmigruj komponenty stopniowo
- ✅ Usuń STARY kod dopiero gdy NOWY działa
- ❌ NIE usuwaj działających funkcji bez zastąpienia

**Proces migracji:**
```
1. Dodaj nowy endpoint w @/backend/projects
2. Przetestuj nowy endpoint w jednym komponencie
3. Zmigruj pozostałe komponenty
4. Usuń stary kod z @/redux/api/
5. Commit: "refactor: migrate XYZ to @/backend pattern"
```

---

### 6. **Clear Next.js Cache When Needed** ✅

**Problem:** Next.js cache pokazuje stare importy mimo zmian w kodzie

**Rozwiązanie:**
```bash
# Zawsze gdy refaktorujesz importy:
rm -rf .next
npm run dev

# Lub restart serwera dev:
# Ctrl+C → npm run dev
```

**Kiedy czyścić cache:**
- ✅ Po zmianie struktury folderów
- ✅ Po usunięciu plików
- ✅ Po zmianie barrel exports (index.ts)
- ✅ Gdy błędy kompilacji pokazują stare linie kodu

---

### 7. **Mock Non-Essential APIs** ✅

**Nie blokuj refaktoru przez brakujące API:**

```typescript
// Layers API nie jest jeszcze zaimplementowane?
// Dodaj tymczasowy mock:

// TODO: Migrate to @/backend/layers when layersApi is implemented
const useAddGeoJsonLayerMutation = () => [async () => {}, { isLoading: false }] as any;
const useDeleteLayerMutation = () => [async () => {}, { isLoading: false }] as any;
```

**Które API można mockować:**
- ✅ Layers API - nie używamy jeszcze mapy w Dashboard
- ✅ Styles API - nie używamy jeszcze stylów
- ✅ Contact API - endpoint #5, zrobimy później
- ❌ Projects API - KRYTYCZNE, musi działać
- ❌ Users API - KRYTYCZNE, musi działać

---

### 8. **Commit Early, Commit Often** ✅

**Małe commity > wielkie zmiany:**

```bash
# Dobra praktyka - commit po każdym działającym kroku:
git add .
git commit -m "refactor: move OwnProjects to features/dashboard/components"

git add .
git commit -m "refactor: remove old API from redux/api folder"

git add .
git commit -m "fix: add mocks for layers API"

# Zła praktyka - jeden ogromny commit:
git add .
git commit -m "refactor everything" # ❌ NIE TAK!
```

---

### 9. **Documentation TODO Pattern** ✅

**Zawsze dokumentuj co trzeba zrobić później:**

```typescript
// ✅ DOBRE TODO - jasne, konkretne, z kontekstem
// TODO: Implement contact API endpoint (endpoint #5)
//       Backend: POST /dashboard/contact/
//       Required fields: subject, message
//       See: docs/backend/dashboard_api_docs.md

// ❌ ZŁE TODO - niejasne, bez kontekstu
// TODO: fix this
```

---

### 10. **Testing After Refactor** ✅

**ZAWSZE testuj po refaktorze:**

**Minimum:**
1. ✅ Dashboard ładuje się bez błędów (localhost:3000/dashboard)
2. ✅ Lista projektów się wyświetla (endpoint #1)
3. ✅ Modal ustawień działa (endpoint #2)
4. ✅ Zapisywanie profilu działa (endpoint #3)

**Ideal:**
1. ✅ Wszystkie zakładki Dashboard działają
2. ✅ Mapa otwiera się bez błędów (localhost:3000/map?project=test)
3. ✅ Console bez czerwonych błędów
4. ✅ Network tab - wszystkie requesty 200 OK

---

## Checklist przed commitem:

```
[ ] ✅ Serwer dev działa bez błędów kompilacji
[ ] ✅ Dashboard (localhost:3000/dashboard) - 200 OK
[ ] ✅ Wszystkie importy używają @/backend lub @/features
[ ] ✅ Żadne stare importy (@/redux/api, @/api/endpointy) nie istnieją
[ ] ✅ Console.log bez czerwonych błędów
[ ] ✅ Przetestowane 3 główne endpointy Dashboard
[ ] ✅ TODO dodane dla brakujących API
[ ] ✅ Commit message jasny i konkretny
```

---

## Kluczowe zasady na przyszłość:

1. **Backend endpoints FIRST** - zawsze weryfikuj dokumentację
2. **@/backend pattern ONLY** - jedna metoda komunikacji z API
3. **Small iterations** - małe kroki, częste commity
4. **Mock missing APIs** - nie blokuj się brakiem endpointów
5. **Test after changes** - ZAWSZE sprawdź czy działa
6. **Clear cache when needed** - `rm -rf .next`
7. **Document TODOs** - jasne notatki dla przyszłości
8. **Ask user when unclear** - lepiej zapytać niż zgadywać

---

**Data stworzenia:** 2025-01-20
**Ostatnia aktualizacja:** Po refaktorze Dashboard (3000+ linii usuniętych)
**Status:** ✅ Production-ready methodology
