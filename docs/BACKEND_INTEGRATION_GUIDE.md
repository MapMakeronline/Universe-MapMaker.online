# Backend Integration Guide

## 🎯 Nowa Architektura (RTK Query Only)

Od teraz **CAŁA komunikacja z backendem** odbywa się przez **jeden `baseApi`** (RTK Query). Koniec z duplikacją fetch/axios!

## 📁 Struktura Katalogów

```
src/backend/
├── client/
│   └── base-api.ts           # ✅ JEDYNE źródło komunikacji z backendem
│
├── auth/
│   ├── auth.api.ts           # RTK Query endpoints dla auth
│   └── index.ts              # Eksport publiczny
│
├── projects/
│   ├── projects.api.ts       # RTK Query endpoints dla projektów
│   └── index.ts
│
├── layers/
│   ├── layers.api.ts         # RTK Query endpoints dla warstw
│   └── index.ts
│
├── users/
│   ├── users.api.ts          # RTK Query endpoints dla użytkowników
│   └── index.ts
│
├── types.ts                  # Wszystkie typy TypeScript
└── index.ts                  # Eksport publiczny (cały backend)
```

## 🔑 Kluczowa Zasada: Jeden baseApi

**ZAWSZE** używaj `baseApi.injectEndpoints()` zamiast `createApi()`:

### ❌ ZŁE (stary sposób):
```typescript
// ❌ NIE RÓB TEGO - tworzy nową instancję API!
export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '...' }),
  endpoints: (builder) => ({ ... }),
});
```

### ✅ DOBRE (nowy sposób):
```typescript
// ✅ ROBIMY TAK - rozszerza baseApi!
import { baseApi } from '../client/base-api';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<ProjectsResponse, void>({
      query: () => '/dashboard/projects/',
      providesTags: ['Projects'],
    }),
  }),
});
```

## 🚀 Jak Używać w Komponentach

### Przykład 1: Login (Auth Module)

```typescript
// src/components/auth/LoginForm.tsx
import { useLoginMutation } from '@/backend';

export function LoginForm() {
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (credentials: { username: string; password: string }) => {
    try {
      const result = await login(credentials).unwrap();
      console.log('Logged in:', result.user);
      // Token automatically saved to localStorage by auth.api.ts
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Przykład 2: Projects (Projects Module)

```typescript
// src/components/dashboard/OwnProjects.tsx
import { useGetProjectsQuery, useCreateProjectMutation, useDeleteProjectMutation } from '@/backend';

export function OwnProjects() {
  // Fetch projects
  const { data, isLoading, error, refetch } = useGetProjectsQuery();

  // Create project
  const [createProject] = useCreateProjectMutation();

  // Delete project
  const [deleteProject] = useDeleteProjectMutation();

  const handleCreate = async () => {
    const result = await createProject({
      project: 'MyNewProject',
      projectDescription: 'Test project',
    }).unwrap();

    console.log('Created project:', result.data.db_name); // Real project_name with suffix
  };

  const handleDelete = async (projectName: string) => {
    await deleteProject({ project: projectName });
    // Cache automatically invalidated - list refreshes!
  };

  return (
    <div>
      {data?.list_of_projects.map(project => (
        <div key={project.project_name}>
          {project.custom_project_name}
          <button onClick={() => handleDelete(project.project_name)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Przykład 3: Layers (Layers Module)

```typescript
// src/components/map/AddLayerButton.tsx
import { useAddGeoJsonLayerMutation } from '@/backend';

export function AddLayerButton() {
  const [addLayer, { isLoading }] = useAddGeoJsonLayerMutation();

  const handleAddLayer = async (file: File) => {
    await addLayer({
      project_name: 'MyProject_1',
      layer_name: 'NewLayer',
      geojson: file,
      epsg: 'EPSG:4326',
    }).unwrap();

    // Automatically invalidates 'QGIS' and 'Layers' tags
    // Tree.json refetches automatically!
  };

  return <button onClick={handleAddLayer}>Add Layer</button>;
}
```

### Przykład 4: User Profile (Users Module)

```typescript
// src/components/dashboard/UserSettings.tsx
import { useGetUserProfileQuery, useUpdateProfileMutation } from '@/backend';

export function UserSettings() {
  const { data: user } = useGetUserProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();

  const handleUpdate = async () => {
    await updateProfile({
      first_name: 'Jan',
      last_name: 'Kowalski',
      company_name: 'Firma XYZ',
    }).unwrap();

    // User data automatically saved to localStorage
  };

  return <div>{user?.email}</div>;
}
```

## 🏷️ Cache Invalidation (Tag System)

RTK Query automatycznie odświeża dane gdy zmienia się stan. Używamy **tagów**:

### Dostępne Tagi:
- `Auth` - Login, register, current user
- `Projects` - Lista projektów użytkownika
- `PublicProjects` - Lista projektów publicznych
- `Layers` - Warstwy projektu
- `QGIS` - tree.json, layer order
- `Users` - Profil użytkownika

### Przykład: Toggle Publish

```typescript
togglePublish: builder.mutation<
  { message: string },
  { project: string; publish: boolean }
>({
  query: ({ project, publish }) => ({
    url: '/api/projects/publish',
    method: 'POST',
    body: { project, publish },
  }),
  // Invalidate multiple tags
  invalidatesTags: (result, error, arg) => [
    { type: 'Project', id: arg.project },
    { type: 'Projects', id: 'LIST' },
    { type: 'PublicProjects', id: 'LIST' }, // Public list also refreshes!
  ],
}),
```

Gdy wywołasz `togglePublish()`, RTK Query automatycznie:
1. Wysyła żądanie POST
2. Invaliduje tagi
3. Odświeża `useGetProjectsQuery()` i `useGetPublicProjectsQuery()`

## ⚡ Optimistic Updates

Możesz zaktualizować UI **przed** odpowiedzią z serwera:

```typescript
togglePublish: builder.mutation({
  async onQueryStarted({ project, publish }, { dispatch, queryFulfilled }) {
    // 1. Optimistic update (instant UI change)
    const patchResult = dispatch(
      projectsApi.util.updateQueryData('getProjects', undefined, (draft) => {
        const foundProject = draft.list_of_projects.find(p => p.project_name === project);
        if (foundProject) {
          foundProject.published = publish; // Change immediately!
        }
      })
    );

    try {
      // 2. Wait for server response
      await queryFulfilled;
    } catch {
      // 3. Rollback on error
      patchResult.undo();
    }
  },
}),
```

## 🔍 Polling (Auto-refresh)

Automatyczne odświeżanie co X sekund:

```typescript
const { data } = useGetProjectsQuery(undefined, {
  pollingInterval: 30000, // 30 seconds
  refetchOnFocus: true,   // Refresh when user returns to tab
  refetchOnMountOrArgChange: true, // Refresh on mount
});
```

## 📦 Jak Dodać Nowy Endpoint

### Krok 1: Dodaj endpoint do modułu

```typescript
// src/backend/projects/projects.api.ts
export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ... existing endpoints ...

    // NEW ENDPOINT
    updateProjectSettings: builder.mutation<
      { message: string },
      { project: string; settings: Record<string, any> }
    >({
      query: ({ project, settings }) => ({
        url: '/api/projects/settings',
        method: 'POST',
        body: { project, ...settings },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Project', id: arg.project },
      ],
    }),
  }),
});

// Export the hook
export const {
  // ... existing hooks ...
  useUpdateProjectSettingsMutation, // NEW HOOK
} = projectsApi;
```

### Krok 2: Użyj w komponencie

```typescript
import { useUpdateProjectSettingsMutation } from '@/backend';

const [updateSettings] = useUpdateProjectSettingsMutation();
await updateSettings({ project: 'MyProject_1', settings: { basemap: 'satellite' } });
```

## 🔄 Migracja ze Starego API

### Przed (fetch/axios):
```typescript
// ❌ OLD: Manual fetch
const response = await fetch('https://api.universemapmaker.online/dashboard/projects/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('authToken')}`,
  },
});
const data = await response.json();
```

### Po (RTK Query):
```typescript
// ✅ NEW: RTK Query hook
const { data, isLoading, error } = useGetProjectsQuery();
// Token automatically added from baseApi!
// Caching, invalidation, polling - all automatic!
```

## 📊 Redux DevTools

RTK Query integruje się z Redux DevTools:

1. Otwórz Redux DevTools w przeglądarce
2. Zakładka "State" → `api` → `queries`
3. Widzisz wszystkie zapytania, cache, status
4. Zakładka "Actions" → widzisz wszystkie API calls

## 🧪 Testing

### Test 1: Login Flow
```bash
# Open browser console
1. Go to /login
2. Enter credentials
3. Check console: "🔴 API Error" or success
4. Check localStorage: authToken should be saved
```

### Test 2: Projects CRUD
```bash
1. Go to /dashboard
2. Create project → check console for db_name
3. Delete project → list should refresh automatically
4. Toggle publish → should see optimistic update (instant)
```

### Test 3: Layer Operations
```bash
1. Open map (/map?project=test)
2. Add GeoJSON layer → tree.json should refresh
3. Toggle layer visibility → layer disappears/appears
4. Check Redux DevTools → see cache invalidation
```

## 🎓 Najlepsze Praktyki

### 1. Zawsze używaj hooków z `@/backend`
```typescript
// ✅ GOOD
import { useGetProjectsQuery } from '@/backend';

// ❌ BAD
import { useGetProjectsQuery } from '@/redux/api/projectsApi';
```

### 2. Używaj `.unwrap()` dla error handling
```typescript
try {
  const result = await createProject(data).unwrap();
  // Success handling
} catch (err) {
  // Error handling
}
```

### 3. Nie duplikuj fetchów
```typescript
// ❌ BAD - manual fetch
const response = await fetch('/api/projects/...');

// ✅ GOOD - RTK Query hook
const { data } = useGetProjectsQuery();
```

### 4. Wykorzystaj cache
```typescript
// RTK Query automatically caches!
// Multiple components can call useGetProjectsQuery()
// Only 1 request is made, others use cache!

function Component1() {
  const { data } = useGetProjectsQuery(); // Request 1
}

function Component2() {
  const { data } = useGetProjectsQuery(); // Uses cache from Component1!
}
```

## 🔗 Przydatne Linki

- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [Cache Invalidation](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching)
- [Optimistic Updates](https://redux-toolkit.js.org/rtk-query/usage/optimistic-updates)

## 📝 TODO: Phase 2 Migration

Po przetestowaniu nowej struktury:

1. ✅ Usuń stare `src/api/` (fetch-based endpoints) - NIEUŻYWANE
2. ⏳ Zmigruj `layersApi` do `baseApi.injectEndpoints()` (obecnie re-export)
3. ⏳ Zmigruj `stylesApi` i `adminApi` do `baseApi.injectEndpoints()`
4. ⏳ Usuń stare `src/redux/api/` po pełnej migracji
5. ⏳ Zaktualizuj wszystkie komponenty do `@/backend` imports

---

## 🎉 Gotowe!

Masz teraz **jedną, spójną architekturę backendu** opartą na RTK Query. Wszystkie moduły (auth, projects, layers, users) działają przez jeden `baseApi`.

**Pytania?** Sprawdź `src/backend/` i dokumentację RTK Query!
