# 🔐 Analiza Systemu Autoryzacji i Dashboard - Universe MapMaker

**Data:** 2025-10-10
**Cel:** Zrozumienie obecnej architektury przed wprowadzaniem zmian

---

## 📋 Obecna Architektura - Jak Działa

### 1. **System Autoryzacji** ✅ Działa Poprawnie!

#### AuthProvider (`src/features/autoryzacja/AuthProvider.tsx`)

```typescript
✅ Inicjalizuje auth state z localStorage przy starcie aplikacji
✅ Używa restoreAuthState() do odzyskania tokenu i usera
✅ Ustawia isInitialized dopiero po załadowaniu stanu
✅ Blokuje renderowanie dzieci do czasu inicjalizacji (brak flash)
```

#### LoginRequiredGuard (`src/features/autoryzacja/LoginRequiredGuard.tsx`)

**WAŻNE:** Guard **NIE przekierowuje** - pokazuje **przyjazny komunikat**!

```typescript
Props:
- children: React.ReactNode
- isLoggedIn: boolean  // ⭐ MUSI BYĆ PRZEKAZANE RĘCZNIE!
- title?: string       // Opcjonalny tytuł
- message?: string     // Opcjonalna wiadomość

Gdy !isLoggedIn:
✅ Wyświetla ikonę Login
✅ Tytuł: "Zaloguj się, aby uzyskać dostęp"
✅ Przycisk: "Zaloguj się" → /auth?tab=0
✅ Przycisk: "Utwórz konto" → /auth?tab=1
✅ Link: "Wróć do projektów publicznych" → /dashboard?tab=1
```

#### authSlice (`src/redux/slices/authSlice.ts`)

```typescript
State:
- user: User | null
- token: string | null
- isAuthenticated: boolean  // ⭐ Główny stan autoryzacji
- isLoading: boolean

Actions:
- setAuth({ user, token }) → zapisuje do localStorage
- clearAuth() → usuwa z localStorage
- setLoading(boolean)
- updateUser(user) → aktualizuje user w localStorage

localStorage keys:
- 'authToken' → token
- 'user' → JSON.stringify(user)
```

---

### 2. **Dashboard Architecture** ✅ Świetnie Zaprojektowany!

#### Dashboard.tsx (Main Component)

```typescript
✅ Używa useSearchParams do routingu (?tab=0 lub ?tab=1)
✅ currentPage state: 'own' | 'public' | 'profile' | 'settings' | 'payments' | 'contact' | 'admin'
❌ BRAK LoginRequiredGuard na poziomie głównego komponentu!

Routing:
- ?tab=0 → OwnProjects (własne projekty)
- ?tab=1 → PublicProjects (projekty publiczne)
- domyślnie → OwnProjects
```

#### DashboardLayout.tsx (Sidebar + Header)

```typescript
✅ Pobiera { user, isAuthenticated } z Redux
✅ Menu items:
  - 'own' (Własne) - Home icon
  - 'public' (Publiczne) - Public icon ⭐ DOSTĘPNE DLA WSZYSTKICH
  - 'profile' (Profil) - wymaga logowania
  - 'settings' (Ustawienia) - wymaga logowania
  - 'payments' (Płatności) - wymaga logowania
  - 'contact' (Kontakt) - dostępne dla wszystkich

✅ Admin panel dla user?.email?.includes('@universemapmaker.online')
✅ User menu dropdown:
  - Jeśli zalogowany: "Profil", "Wyloguj"
  - Jeśli niezalogowany: "Zaloguj", "Zarejestruj"
```

---

### 3. **Projekty - Własne vs Publiczne**

#### OwnProjects.tsx ✅ RTK Query

```typescript
✅ Używa useGetProjectsQuery() z RTK Query
✅ skip: !isAuthenticated → fechuje tylko gdy zalogowany
✅ pollingInterval: 30000 → auto-refresh co 30s
✅ refetchOnFocus: true → refresh gdy wrócisz do zakładki

Features:
✅ Create project (useCreateProjectMutation)
✅ Delete project (useDeleteProjectMutation)
✅ Toggle publish (useTogglePublishMutation)
✅ Import QGIS (via unified-projects API)

Projects source: /dashboard/projects/ (wymaga autoryzacji)
```

#### PublicProjects.tsx ❌ Mock Data!

```typescript
❌ Używa hardcoded mockPublicProjects
❌ NIE fechuje z backendu
❌ Mock projects:
  - ogrodzeniecsip
  - UniejowMwMpzp
  - AugustowWMpzp

Problem:
- Backend endpoint ISTNIEJE: /dashboard/projects/public/
- unified-projects.ts MA funkcję: getPublicProjects()
- RTK Query NIE MA getPublicProjects query
```

---

### 4. **Backend API Endpoints**

#### ✅ Dashboard Endpoints (z BACKEND-ENDPOINTS.md)

```
✅ GET  /dashboard/projects/         → User's projects (requires auth)
✅ POST /dashboard/projects/create/  → Create project (requires auth)
✅ DELETE /dashboard/projects/delete/ → Delete project (requires auth)
✅ GET  /dashboard/projects/public/  → ⭐ PUBLIC PROJECTS (no auth!)
⏳ PUT  /dashboard/projects/update/  → Update project
```

#### unified-projects.ts (Obecna Implementacja)

```typescript
// src/api/endpointy/unified-projects.ts

✅ getPublicProjects(): Promise<{ success: boolean; projects: Project[]; count: number }>
   → apiClient.get('/dashboard/projects/public/')
   → NIE wymaga autoryzacji (endpoint publiczny)

Problem: Ta funkcja ISTNIEJE ale NIGDZIE nie jest używana!
```

---

## 🎯 Zamysł Aplikacji - Jak Powinno Działać

### Scenariusz 1: Użytkownik Niezalogowany (Gość)

```
✅ Może wejść na /dashboard?tab=1 (PublicProjects)
✅ Widzi wszystkie projekty ustawione jako published=True
✅ Może filtrować, sortować, wyszukiwać publiczne projekty
❌ NIE może zobaczyć własnych projektów (tab=0)
❌ NIE może tworzyć/usuwać projektów
❌ NIE może zobaczyć profilu/ustawień

Gdy kliknie zakładkę wymagającą logowania:
→ LoginRequiredGuard pokazuje przyjazny komunikat
→ "Zaloguj się, aby uzyskać dostęp"
→ "Wróć do projektów publicznych" → /dashboard?tab=1
```

### Scenariusz 2: Użytkownik Zalogowany

```
✅ Może zobaczyć własne projekty (tab=0)
✅ Może tworzyć/edytować/usuwać własne projekty
✅ Może publikować projekty (published=True/False)
✅ Może zobaczyć publiczne projekty (tab=1)
✅ Może zobaczyć profil, ustawienia, płatności
✅ Pełny dostęp do aplikacji
```

---

## 🔍 Co Jest Zrobione Dobrze

### ✅ Mocne Strony Obecnej Architektury

1. **AuthProvider** - świetna inicjalizacja, brak flash effect
2. **LoginRequiredGuard** - przyjazny UX (komunikat zamiast przekierowania)
3. **DashboardLayout** - responsywny drawer, menu dla gości i zalogowanych
4. **OwnProjects** - pełna integracja RTK Query, auto-refresh, optimistic updates
5. **RTK Query** - 85% mniej boilerplate, auto-caching, invalidation
6. **Routing** - search params (?tab=0, ?tab=1) zamiast osobnych route'ów

---

## ⚠️ Co Wymaga Poprawy

### 1. PublicProjects - Brak Integracji z Backend ❌

**Problem:**
```typescript
// PublicProjects.tsx
const mockPublicProjects: PublicProject[] = [
  { id: '1', title: 'ogrodzeniecsip', ... }, // ❌ HARDCODED!
  { id: '2', title: 'UniejowMwMpzp', ... },  // ❌ MOCK DATA!
];
```

**Rozwiązanie:**
```typescript
// Dodać do projectsApi.ts (RTK Query)
getPublicProjects: builder.query<PublicProjectsResponse, void>({
  query: () => '/dashboard/projects/public/',
  providesTags: [{ type: 'Projects', id: 'PUBLIC_LIST' }],
}),

// Użyć w PublicProjects.tsx
const { data, isLoading } = useGetPublicProjectsQuery();
```

### 2. Brak Typów dla PublicProject ❌

**Problem:**
```typescript
// PublicProjects.tsx - lokalny interface
interface PublicProject {
  id: string;
  title: string;
  description: string;
  // ... różni się od Project w types.ts
}
```

**Rozwiązanie:**
```typescript
// Użyć istniejącego typu Project z api/typy/types.ts
import type { Project } from '@/api/typy/types';
```

### 3. Niekonsystentne Użycie LoginRequiredGuard

**Obecny Stan:**
- ✅ UserProfile.tsx → ma guard
- ✅ UserSettings.tsx → ma guard
- ❌ Dashboard.tsx → BRAK guarda (niepotrzebny!)

**Dlaczego NIEPOTRZEBNY w Dashboard.tsx:**
- Dashboard pokazuje 2 zakładki: Own (wymaga auth) i Public (dostępne dla wszystkich)
- Jeśli dodamy guard do Dashboard → blokowalibyśmy dostęp do PublicProjects!
- ✅ Obecne rozwiązanie: guard w OwnProjects (poprzez skip: !isAuthenticated)

---

## 📝 Plan Działania - Minimalne Zmiany

### Krok 1: Dodać `getPublicProjects` do RTK Query ✅

**Plik:** `src/redux/api/projectsApi.ts`

**Dodaj endpoint:**
```typescript
/**
 * GET /dashboard/projects/public/
 * Fetch all published projects (no authentication required)
 */
getPublicProjects: builder.query<ProjectsResponse, void>({
  query: () => '/dashboard/projects/public/',
  providesTags: [{ type: 'Projects', id: 'PUBLIC_LIST' }],
}),
```

**Eksportuj hook:**
```typescript
export const {
  useGetProjectsQuery,
  useGetPublicProjectsQuery, // ⭐ NOWY HOOK
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useTogglePublishMutation,
} = projectsApi;
```

---

### Krok 2: Zaktualizować `PublicProjects.tsx` ✅

**Zastąpić mock data RTK Query:**

```typescript
// BYŁO:
const mockPublicProjects: PublicProject[] = [ ... ];

// BĘDZIE:
import { useGetPublicProjectsQuery } from '@/redux/api/projectsApi';

const { data, isLoading, error } = useGetPublicProjectsQuery();
const projects = data?.list_of_projects || [];
```

**Usunąć:**
- ❌ `mockPublicProjects` array
- ❌ Lokalny `interface PublicProject`
- ❌ `useEffect` do filtrowania mock data

**Zachować:**
- ✅ Filtry (search, category, sortowanie)
- ✅ Paginacja
- ✅ ProjectCard rendering
- ✅ Skeleton loader

---

### Krok 3: Dodać Proper Error Handling ✅

```typescript
// PublicProjects.tsx

if (isLoading) {
  return <ProjectsGridSkeleton count={6} />;
}

if (error) {
  return (
    <Alert severity="error">
      Nie udało się załadować projektów publicznych. Spróbuj ponownie.
    </Alert>
  );
}

if (!projects || projects.length === 0) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h6" color="text.secondary">
        Brak opublikowanych projektów
      </Typography>
    </Box>
  );
}
```

---

### Krok 4: Przetestować Działanie ✅

```bash
# 1. Otworzyć dashboard jako gość
http://localhost:3000/dashboard?tab=1

# 2. Sprawdzić network tab
→ GET /dashboard/projects/public/ (powinno się wykonać)

# 3. Sprawdzić czy projekty się wyświetlają
→ Powinny być z backendu, nie mock data

# 4. Sprawdzić filtry
→ Search, category, sortowanie

# 5. Zalogować się i sprawdzić czy tab=0 działa
→ OwnProjects powinny się załadować
```

---

## 🚫 Czego NIE Robić

### ❌ NIE dodawać LoginRequiredGuard do Dashboard.tsx

**Powód:**
- Blokowałoby dostęp do PublicProjects dla gości
- Obecne rozwiązanie jest LEPSZE (guard w poszczególnych zakładkach)

### ❌ NIE tworzyć nowych komponentów

**Powód:**
- PublicProjects.tsx już istnieje
- Wystarczy zamienić mock data na RTK Query

### ❌ NIE zmieniać routingu

**Powód:**
- `?tab=0` i `?tab=1` działają dobrze
- Nie ma powodu do zmiany na `/dashboard/own` i `/dashboard/public`

### ❌ NIE usuwać getPublicProjects() z unified-projects.ts

**Powód:**
- Może być używane gdzieś indziej
- RTK Query może korzystać z tego samego endpointu

---

## 📊 Podsumowanie Zmian

| Plik | Akcja | Linie Kodu | Priorytet |
|------|-------|------------|-----------|
| `src/redux/api/projectsApi.ts` | Dodać `getPublicProjects` query | +10 | 🔴 Wysoki |
| `src/redux/api/projectsApi.ts` | Eksportować `useGetPublicProjectsQuery` | +1 | 🔴 Wysoki |
| `src/features/dashboard/komponenty/PublicProjects.tsx` | Zastąpić mock data RTK Query | -80, +15 | 🔴 Wysoki |
| `src/features/dashboard/komponenty/PublicProjects.tsx` | Dodać error handling | +20 | 🟡 Średni |
| `test-dashboard-manual.mjs` | Dodać test fechowania public projects | +15 | 🟢 Niski |

**Razem:** ~-35 linii kodu (usunięcie mock data + dodanie RTK Query)

**Benefit:** Prawdziwe dane z backendu zamiast mock data! ✅

---

## ✅ Wnioski

### Co Działa Dobrze (NIE ZMIENIAĆ!)

1. ✅ **AuthProvider** - perfekcyjna inicjalizacja
2. ✅ **LoginRequiredGuard** - przyjazny UX dla gości
3. ✅ **DashboardLayout** - menu dla gości i zalogowanych
4. ✅ **OwnProjects** - RTK Query z pełną integracją
5. ✅ **Routing** - search params zamiast nested routes

### Co Wymaga Naprawy (MINIMALNE ZMIANY!)

1. ❌ **PublicProjects** - zamienić mock data na RTK Query
2. ⚠️ **Typy** - użyć istniejących typów z `api/typy/types.ts`
3. ⚠️ **Error Handling** - dodać dla getPublicProjects

### Następne Kroki

1. Dodać `getPublicProjects` do RTK Query (10 linii)
2. Zaktualizować `PublicProjects.tsx` (usunąć mock, dodać RTK Query)
3. Przetestować fechowanie publicznych projektów
4. Sprawdzić filtry i paginację
5. Zrobić screenshot test

---

**Autor:** Claude Code
**Data:** 2025-10-10
**Status:** Gotowy do implementacji ✅
