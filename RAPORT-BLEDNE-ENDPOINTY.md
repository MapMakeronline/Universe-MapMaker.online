# Raport: Błędne endpointy w kodzie

**Data:** 15 października 2025
**Autor:** Claude Code Audit

---

## 📊 Podsumowanie

**Znalezione błędne endpointy:** 7
**Pliki z błędami:** 3

---

## ❌ Błędne endpointy

### 1. ❌ `GET /dashboard/projects/${projectName}/`

**Plik:** `src/api/endpointy/unified-projects.ts`
**Linia:** 68
**Kod:**
```typescript
async getProjectData(projectName: string): Promise<ProjectData> {
  return apiClient.get(`/dashboard/projects/${encodeURIComponent(projectName)}/`);
}
```

**Powód błędu:** Endpoint nie istnieje w poprawnej liście
**Poprawny endpoint:** `GET /api/projects/new/json?project={projectName}&published=false`

---

### 2. ❌ `GET /dashboard/profile/`

**Plik:** `src/api/endpointy/unified-user.ts`
**Linia:** 55
**Kod:**
```typescript
async getProfile(): Promise<UserProfile> {
  return apiClient.get<UserProfile>('/dashboard/profile/');
}
```

**Powód błędu:** Endpoint nie istnieje - duplikat `/auth/profile`
**Poprawny endpoint:** `GET /auth/profile`

---

### 3. ⚠️ `PUT /dashboard/settings/profile/` (metoda HTTP)

**Plik:** `src/api/endpointy/unified-user.ts`
**Linia:** 63
**Kod:**
```typescript
async updateProfile(data: UpdateProfileData): Promise<{ message: string }> {
  return apiClient.put('/dashboard/settings/profile/', data);
}
```

**Powód błędu:** Użyto `PUT` zamiast `POST`
**Poprawny endpoint:** `POST /dashboard/settings/profile/`

---

### 4. ⚠️ `PUT /dashboard/settings/password/` (metoda HTTP)

**Plik:** `src/api/endpointy/unified-user.ts`
**Linia:** 71
**Kod:**
```typescript
async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  return apiClient.put('/dashboard/settings/password/', data);
}
```

**Powód błędu:** Użyto `PUT` zamiast `POST`
**Poprawny endpoint:** `POST /dashboard/settings/password/`

---

### 5. ✅ `POST /dashboard/contact/` (OK)

**Plik:** `src/api/endpointy/unified-user.ts`
**Linia:** 80
**Status:** ✅ Poprawny (zgodny z listą)

---

### 6. ✅ `GET /dashboard/projects/` (OK)

**Plik:** `src/redux/api/projectsApi.ts`
**Linia:** 68
**Kod:**
```typescript
getProjects: builder.query<ProjectsResponse, void>({
  query: () => '/dashboard/projects/',
  providesTags: (result) => /* ... */
}),
```

**Status:** ✅ Poprawny (zgodny z listą)

---

### 7. ✅ `GET /dashboard/projects/public/` (może być błędny?)

**Plik:** `src/redux/api/projectsApi.ts`
**Linia:** 87
**Kod:**
```typescript
getPublicProjects: builder.query<PublicProjectsResponse, void>({
  query: () => '/dashboard/projects/public/',
  providesTags: ['PublicProjects', 'LIST'],
}),
```

**Status:** ⚠️ NIEPEWNE - endpoint nie ma prefiksu `/api/`
**Możliwy błąd:** Brak w poprawnej liście 128 endpointów
**Uwaga:** Sprawdź czy backend obsługuje `/dashboard/projects/public/` czy może powinno być `/api/projects/public/`

---

### 8. ⚠️ `POST /dashboard/projects/update/` (może być błędny?)

**Plik:** `src/redux/api/projectsApi.ts`
**Linia:** 159
**Kod:**
```typescript
updateProject: builder.mutation<ProjectResponse, UpdateProjectPayload>({
  query: (data) => ({
    url: '/dashboard/projects/update/',
    method: 'POST',
    body: data,
  }),
  invalidatesTags: (result, error, { project }) => [
    { type: 'Project', id: project },
    'Projects', 'LIST',
  ],
}),
```

**Status:** ✅ Poprawny (zgodny z listą)

---

## 📋 Szczegółowa lista błędów według plików

### `src/api/endpointy/unified-projects.ts`
- **Linia 68:** ❌ `GET /dashboard/projects/${projectName}/` → Powinno być: `GET /api/projects/new/json?project={projectName}`

### `src/api/endpointy/unified-user.ts`
- **Linia 55:** ❌ `GET /dashboard/profile/` → Powinno być: `GET /auth/profile`
- **Linia 63:** ⚠️ `PUT /dashboard/settings/profile/` → Powinno być: `POST /dashboard/settings/profile/`
- **Linia 71:** ⚠️ `PUT /dashboard/settings/password/` → Powinno być: `POST /dashboard/settings/password/`

### `src/redux/api/projectsApi.ts`
- **Linia 87:** ⚠️ `GET /dashboard/projects/public/` → SPRAWDŹ czy endpoint istnieje (brak w liście 128 endpointów)

---

## 🔧 Rekomendacje naprawy

### Priorytet 1: Krytyczne błędy (nie działają)

1. **`src/api/endpointy/unified-projects.ts:68`**
   ```typescript
   // BYŁO:
   return apiClient.get(`/dashboard/projects/${encodeURIComponent(projectName)}/`);

   // POWINNO BYĆ:
   return apiClient.get(`/api/projects/new/json?project=${encodeURIComponent(projectName)}&published=false`);
   ```

2. **`src/api/endpointy/unified-user.ts:55`**
   ```typescript
   // BYŁO:
   return apiClient.get<UserProfile>('/dashboard/profile/');

   // POWINNO BYĆ:
   return apiClient.get<UserProfile>('/auth/profile');
   ```

### Priorytet 2: Błędna metoda HTTP (mogą działać lub nie)

3. **`src/api/endpointy/unified-user.ts:63`**
   ```typescript
   // BYŁO:
   return apiClient.put('/dashboard/settings/profile/', data);

   // POWINNO BYĆ:
   return apiClient.post('/dashboard/settings/profile/', data);
   ```

4. **`src/api/endpointy/unified-user.ts:71`**
   ```typescript
   // BYŁO:
   return apiClient.put('/dashboard/settings/password/', data);

   // POWINNO BYĆ:
   return apiClient.post('/dashboard/settings/password/', data);
   ```

### Priorytet 3: Wymagające weryfikacji

5. **`src/redux/api/projectsApi.ts:87`**
   - Sprawdź czy backend obsługuje `/dashboard/projects/public/`
   - Jeśli nie, może powinno być `/api/projects/public/` lub dodaj do backendu

---

## ✅ Endpointy poprawne (znalezione w kodzie)

### Auth (`src/api/endpointy/auth.ts`)
- ✅ `POST /auth/register` (linia 13)
- ✅ `POST /auth/login` (linia 28)
- ✅ `POST /auth/logout` (linia 44)
- ✅ `GET /auth/profile` (linia 56)

### Projects (`src/redux/api/projectsApi.ts`)
- ✅ `POST /api/projects/create/` (linia 129)
- ✅ `POST /api/projects/remove/` (linia 175)
- ✅ `POST /api/projects/publish` (linia 194)
- ✅ `GET /api/projects/subdomainAvailability` (linia 273)
- ✅ `POST /api/projects/domain/change` (linia 288)
- ✅ `POST /api/projects/metadata` (linia 593)
- ✅ `POST /api/projects/order` (linia 612)
- ✅ `POST /api/projects/tree/order` (linia 630)
- ✅ `GET /api/projects/space/get` (linia 648)
- ✅ `POST /api/projects/search` (linia 663)
- ✅ `POST /api/projects/reload` (linia 678)
- ✅ `POST /api/projects/repair` (linia 696)
- ✅ `POST /api/projects/restore` (linia 714)
- ✅ `POST /api/projects/basemap/set` (linia 733)
- ✅ `GET /api/projects/print` (linia 751)
- ✅ `GET /api/projects/new/json` (linia 782)
- ✅ `GET /api/projects/distinct` (linia 803)
- ✅ `GET /api/projects/filter/min-max` (linia 818)
- ✅ `GET /api/projects/filter/numeric-columns` (linia 833)
- ✅ `POST /api/projects/global-search` (linia 848)
- ✅ `GET /api/projects/thumbnail/${project_name}/` (unified-projects.ts:121)

### Layers (`src/redux/api/layersApi.ts`)
- ✅ `POST /api/layer/add/geojson/` (linia 87)
- ✅ `POST /api/layer/add/shp/` (linia 149)
- ✅ `GET/POST /api/layer/style` (linia 172)
- ✅ `POST /api/layer/remove/database` (linia 193)
- ✅ `GET /api/layer/attributes` (linia 219)
- ✅ `POST /api/layer/selection` (linia 242)
- ✅ `GET /api/layer/features` (linia 275)
- ✅ `POST /api/layer/feature/add` (linia 306) - **UWAGA:** Nie ma w liście, sprawdź!
- ✅ `PUT /api/layer/feature/update` (linia 340) - **UWAGA:** Nie ma w liście, sprawdź!
- ✅ `DELETE /api/layer/feature/delete` (linia 371) - **UWAGA:** Nie ma w liście, sprawdź!
- ✅ `POST /api/layer/add/gml/` (linia 410)
- ✅ `POST /api/layer/style/reset` (linia 432)
- ✅ `GET /api/layer/attributes/names` (linia 454)
- ✅ `GET /api/layer/attributes/names_and_types` (linia 476)
- ✅ `POST /api/layer/column/add` (linia 503)
- ✅ `POST /api/layer/column/rename` (linia 533)
- ✅ `POST /api/layer/column/remove` (linia 562)
- ✅ `POST /api/layer/name` (linia 590)
- ✅ `POST /api/layer/multipleSaving` (linia 669)
- ✅ `GET /api/layer/geometry` (linia 697)
- ✅ `POST /api/layer/label` (linia 728)
- ✅ `POST /api/layer/label/remove` (linia 751)
- ✅ `GET /api/layer/column/values` (linia 781)
- ✅ `POST /api/layer/add/existing` (linia 813)
- ✅ `POST /api/layer/clone` (linia 841)
- ✅ `GET /api/layer/feature/coordinates` (linia 869)
- ✅ `GET /api/layer/geometry/check` (linia 896)
- ✅ `GET /api/layer/validation/details` (linia 924)
- ✅ `POST /api/layer/transaction/` (linia 955)
- ✅ `POST /api/layer/add/raster/` (linia 991)
- ✅ `POST /api/layer/opacity/set` (linia 1017)
- ✅ `POST /api/layer/scale` (linia 1045)
- ✅ `POST /api/layer/published/set` (linia 1073)
- ✅ `POST /api/layer/columns/remove` (linia 1100)

### Styles (`src/redux/api/stylesApi.ts`)
- ✅ `POST /api/styles/renderer` (linia 225)
- ✅ `POST /api/styles/set` (linia 245)
- ✅ `POST /api/styles/symbol` (linia 258)
- ✅ `POST /api/styles/symbol/image` (linia 270)
- ✅ `GET /api/styles/symbol/random/color` (linia 283)
- ✅ `POST /api/styles/classify` (linia 295)
- ✅ `POST /api/layer/style/add` (linia 316)

### Dashboard
- ✅ `GET /dashboard/projects/` (projectsApi.ts:68)
- ✅ `POST /dashboard/projects/update/` (projectsApi.ts:159)
- ✅ `POST /dashboard/contact/` (unified-user.ts:80)

---

## 🔍 Dodatkowe endpointy w kodzie (nie ma w liście 128)

Te endpointy są używane w kodzie, ale nie ma ich w Twojej liście:

1. `POST /api/layer/feature/add` - layersApi.ts:306
2. `PUT /api/layer/feature/update` - layersApi.ts:340
3. `DELETE /api/layer/feature/delete` - layersApi.ts:371
4. `GET /dashboard/projects/public/` - projectsApi.ts:87

**Akcja wymagana:** Sprawdź czy:
- Są to nowe endpointy dodane do backendu (należy zaktualizować listę)
- Są to błędne endpointy (należy usunąć z kodu)

---

## 📈 Statystyki

| Kategoria | Liczba |
|-----------|--------|
| Błędne endpointy (krytyczne) | 2 |
| Błędna metoda HTTP | 2 |
| Wymaga weryfikacji | 1 |
| Dodatkowe (nie ma w liście) | 4 |
| Poprawne endpointy | 70+ |
| **RAZEM do naprawy** | **5-9** |

---

## 🎯 Plan działania

### Krok 1: Napraw krytyczne błędy
- [ ] `unified-projects.ts:68` - zmień `/dashboard/projects/${projectName}/` na `/api/projects/new/json?project=...`
- [ ] `unified-user.ts:55` - zmień `/dashboard/profile/` na `/auth/profile`

### Krok 2: Napraw metody HTTP
- [ ] `unified-user.ts:63` - zmień `PUT` na `POST` w `/dashboard/settings/profile/`
- [ ] `unified-user.ts:71` - zmień `PUT` na `POST` w `/dashboard/settings/password/`

### Krok 3: Weryfikuj z backendem
- [ ] Sprawdź czy `/dashboard/projects/public/` istnieje
- [ ] Sprawdź czy `/api/layer/feature/add`, `/update`, `/delete` istnieją
- [ ] Zaktualizuj listę 128 endpointów jeśli potrzeba

---

**Koniec raportu**
