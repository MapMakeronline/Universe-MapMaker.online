# Backend Integration (RTK Query)

## 📋 Struktura

```
src/backend/
├── client/
│   └── base-api.ts           # ✅ Jeden baseApi dla całego backendu
│
├── auth/                     # Moduł autoryzacji
│   ├── auth.api.ts          # RTK Query endpoints
│   └── index.ts             # Eksport publiczny
│
├── projects/                 # Moduł projektów
│   ├── projects.api.ts      # 25+ endpoints (CRUD, QGS import, publish)
│   └── index.ts
│
├── layers/                   # Moduł warstw
│   ├── layers.api.ts        # 29+ endpoints (add, delete, style, export)
│   └── index.ts
│
├── users/                    # Moduł użytkowników
│   ├── users.api.ts         # Profile, settings, account
│   └── index.ts
│
├── types.ts                  # Wszystkie typy TypeScript (407 linii)
└── index.ts                  # Eksport publiczny - używaj tego!
```

## 🚀 Użycie

### Importuj z `@/backend`:

```typescript
import {
  useLoginMutation,                    // Auth
  useGetProjectsQuery,                 // Projects
  useCreateProjectMutation,            // Projects
  useAddGeoJsonLayerMutation,          // Layers
  useGetUserProfileQuery,              // Users
} from '@/backend';
```

### Przykład w komponencie:

```typescript
function MyComponent() {
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();

  const handleCreate = async () => {
    const result = await createProject({
      project: 'MyProject',
      projectDescription: 'Test',
    }).unwrap();

    console.log('Created:', result.data.db_name);
  };

  return <div>{/* UI */}</div>;
}
```

## 📚 Dokumentacja

Pełna dokumentacja: [docs/BACKEND_INTEGRATION_GUIDE.md](../../docs/BACKEND_INTEGRATION_GUIDE.md)

## ✅ Gotowe moduły

- ✅ **Auth** - Login, register, password reset (6 endpoints)
- ✅ **Projects** - CRUD, QGS import/export, publish (25+ endpoints)
- ✅ **Layers** - Re-export z @/redux/api (29 endpoints) - TODO: migracja do baseApi
- ✅ **Users** - Profile, settings, account (4 endpoints)

## 🔄 TODO: Phase 2

1. Zmigruj `layersApi` do `baseApi.injectEndpoints()`
2. Zmigruj `stylesApi` i `adminApi`
3. Usuń stary `src/api/` folder (fetch-based, nieużywany)
4. Usuń stary `src/redux/api/` po pełnej migracji

## 🎯 Kluczowa zasada

**Zawsze używaj `baseApi.injectEndpoints()` zamiast `createApi()`!**

To zapewnia:
- Jeden punkt komunikacji z backendem
- Wspólny cache dla wszystkich modułów
- Automatyczne invalidation tagów
- Spójna konfiguracja (auth, error handling)
