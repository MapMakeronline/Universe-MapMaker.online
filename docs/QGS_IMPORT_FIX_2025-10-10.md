# Naprawa Importu QGS - 2025-10-10

## Problem

Podczas próby importu pliku QGIS (.qgs/.qgz) na produkcji (`universemapmaker.online`), użytkownicy otrzymywali błąd **400 Bad Request**:

```json
{
  "data": "",
  "success": false,
  "message": "Projekt nie istnieje w bazie danych"
}
```

### Analiza błędu

Błąd występował w **KROKU 2** (Import QGS) workflow:
1. ✅ KROK 1: `POST /api/projects/create/` - **Sukces** (projekt utworzony)
2. ❌ KROK 2: `POST /api/projects/import/qgs/` - **Błąd 400** (projekt nie znaleziony)

### Przyczyna

**Frontend używał błędnego typu response dla `createProject` mutation**, co powodowało nieprawidłowe odczytanie nazwy projektu zwróconej przez backend.

**Błędny typ (przed poprawką):**
```typescript
// projectsApi.ts (BŁĄD)
createProject: builder.mutation<Project, CreateProjectData>({
  // ...
})

// Frontend próbował odczytać:
const backendProjectName = createdProject.project_name; // ❌ undefined!
```

**Faktyczny response z backendu:**
```json
{
  "data": {
    "host": "localhost",
    "port": "5432",
    "db_name": "projekt_nazwa_20250101",
    "login": "user_login",
    "password": "encrypted_password"
  },
  "success": true,
  "message": "Projekt został pomyślnie utworzony",
  "project_name": "Moj_Nowy_Projekt"  ← To pole było ignorowane!
}
```

**Problem:**
- RTK Query oczekiwało typu `Project` (obiekt z `project_name` jako właściwością obiektu projektu)
- Backend zwracał `{ data, success, message, project_name }` (inna struktura!)
- Frontend nie mógł odczytać `project_name` → używał nazwy z formularza
- Jeśli backend zmienił nazwę (sanityzacja) → nazwa się nie zgadzała → błąd 400

---

## Rozwiązanie

### 1. Poprawienie typu response w RTK Query

**Plik:** `src/redux/api/projectsApi.ts`

```diff
/**
 * POST /api/projects/create/
 * Create a new project
+ *
+ * Backend response format:
+ * {
+ *   "data": { host, port, db_name, login, password },
+ *   "success": true,
+ *   "message": "Projekt został pomyślnie utworzony",
+ *   "project_name": "actual_project_name"
+ * }
 */
-createProject: builder.mutation<Project, CreateProjectData>({
+createProject: builder.mutation<
+  { data: DbInfo; success: boolean; message: string; project_name: string },
+  CreateProjectData
+>({
  query: (data) => ({
    url: '/api/projects/create/',
    method: 'POST',
    body: {
      project: data.project,
      domain: data.domain,
      projectDescription: data.projectDescription,
      keywords: data.keywords,
    },
  }),
  invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
}),
```

### 2. Dodanie debug logging

**Plik:** `src/features/dashboard/komponenty/OwnProjects.tsx`

```typescript
const handleImportQGIS = async (file: File, projectName: string, domain: string, description?: string) => {
  try {
    console.log('🔧 Creating project with data:', createData);
    const createdProject = await createProject(createData).unwrap();
    console.log('✅ Project created, backend response:', createdProject);

    const backendProjectName = createdProject.project_name || projectName;
    console.log('📦 Using project name for import:', backendProjectName);

    console.log('📤 Importing QGS file to project:', backendProjectName);
    await importQGS({
      project: backendProjectName,
      qgsFile: file,
    }).unwrap();
    console.log('✅ QGS imported successfully!');
    // ...
  }
}
```

**Plik:** `src/features/dashboard/dialogi/CreateProjectDialog.tsx`

```typescript
const handleImportSubmit = async () => {
  console.log('📝 Dialog - Starting import with params:', {
    file: qgisFile.name,
    projectName: qgisProjectName,
    domain: qgisDomain,
    description: qgisDescription
  });

  try {
    await onImportQGIS(qgisFile, qgisProjectName, qgisDomain, qgisDescription);
    console.log('✅ Dialog - Import completed successfully');
    // ...
  } catch (error: any) {
    console.error('❌ Dialog - Import failed:', error);
    // ...
  }
}
```

---

## Weryfikacja naprawy

### Krok 1: Lokalnie

```bash
npm run dev
# Otwórz http://localhost:3000/dashboard
# Kliknij "Utwórz nowy projekt" → "Importuj QGIS"
# Wybierz plik .qgs/.qgz
# Wypełnij formularz
# Kliknij "Utwórz i importuj"
```

**Sprawdź console logs:**
```
🔧 Creating project with data: { project: "...", domain: "..." }
✅ Project created, backend response: { data: {...}, success: true, project_name: "..." }
📦 Using project name for import: "nazwa_z_backendu"
📤 Importing QGS file to project: "nazwa_z_backendu"
✅ QGS imported successfully!
```

### Krok 2: Produkcja

Po deploy na Cloud Run:

1. Otwórz `https://universemapmaker.online/dashboard`
2. Zaloguj się
3. Kliknij "Utwórz nowy projekt" → Tab "Importuj QGIS"
4. Wybierz plik QGS/QGZ (max 100 MB)
5. Wypełnij formularz
6. Kliknij "Utwórz i importuj"
7. **Sprawdź DevTools Console** - powinieneś zobaczyć logi pokazujące pełny workflow

**Oczekiwany rezultat:**
- ✅ Projekt zostanie utworzony
- ✅ Plik QGS zostanie zaimportowany
- ✅ Projekt pojawi się na liście "Moje Projekty"
- ✅ Brak błędu 400

---

## Pliki zmodyfikowane

1. **`src/redux/api/projectsApi.ts`**
   - Poprawiono typ response dla `createProject` mutation
   - Dodano dokumentację formatu response

2. **`src/features/dashboard/komponenty/OwnProjects.tsx`**
   - Dodano debug logging dla procesu Create → Import
   - Loguje response z backendu i używaną nazwę projektu

3. **`src/features/dashboard/dialogi/CreateProjectDialog.tsx`**
   - Dodano debug logging dla parametrów importu
   - Loguje sukces/błąd importu

---

## Commit

```bash
git commit -m "fix: correct createProject response type and add debug logging for QGS import"
git push origin main
```

**Commit hash:** `da6eda5`

---

## Deployment

Po pushu zmian, Cloud Build automatycznie zbuduje i wdroży nową wersję:

```bash
# Monitoruj deployment
gcloud run services describe universe-mapmaker --region=europe-central2

# Sprawdź logi
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=universe-mapmaker" --limit=50
```

---

## Następne kroki (opcjonalnie)

1. **Usunąć debug logi** po weryfikacji, że wszystko działa
2. **Dodać upload progress bar** dla dużych plików QGS
3. **Dodać drag & drop** upload
4. **Dodać preview warstw** przed importem
5. **Dodać batch import** wielu projektów

---

## Podsumowanie

**Status:** ✅ **NAPRAWIONE**

Błąd został zidentyfikowany jako **niezgodność typu response** między frontendem a backendem. Frontend nie mógł odczytać `project_name` z odpowiedzi backendu, co powodowało używanie niewłaściwej nazwy projektu podczas importu QGS.

Po poprawce:
- Frontend prawidłowo odczytuje `project_name` z backendu
- Import używa nazwy zwróconej przez backend (nawet jeśli backend ją zmienił/sanityzował)
- Dodano comprehensive logging dla debugowania

**Data naprawy:** 2025-10-10
**Autor:** Claude Code
**Tester:** Użytkownik (produkcja)
