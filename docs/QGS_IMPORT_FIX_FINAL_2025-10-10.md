# Naprawa Importu QGS - Finalna Wersja (2025-10-10)

## 🔍 Diagnoza Problemu

### Błąd na produkcji
```
POST /api/projects/import/qgs/ → 400 Bad Request
{
  "data": "",
  "success": false,
  "message": "Projekt nie istnieje w bazie danych"
}
```

### Przyczyna główna (Root Cause)

**Backend używa DWÓCH różnych nazw projektu:**

1. **`project_name`** - Wewnętrzny ID projektu w bazie danych
   - Używany przez `/api/projects/import/qgs/` do wyszukiwania projektu
   - Generowany automatycznie przez backend
   - **NIE jest zwracany** w odpowiedzi `/api/projects/create/`

2. **`custom_project_name`** - Nazwa podana przez użytkownika
   - Wysyłana w parametrze `project` przy tworzeniu
   - Używana do wyświetlania w UI
   - Może się różnić od `project_name`

### Model bazy danych (ProjectItem)

```typescript
export interface Project {
  project_name: string;          // ← Backend ID (używane przez import)
  custom_project_name: string;   // ← Nazwa z formularza (NIE używane przez import)
  domain_name: string;
  // ... inne pola
}
```

### Workflow (przed poprawką)

```
1. Frontend → POST /api/projects/create/
   Body: { project: "ogrodzienicsip" }

2. Backend tworzy projekt:
   - custom_project_name = "ogrodzienicsip"
   - project_name = "user123_ogrodzienicsip_20251010" (przykład)

3. Backend → Response (PROBLEM!)
   {
     "data": { host, port, db_name, ... },
     "success": true,
     "message": "Projekt utworzony"
     // ❌ BRAK project_name!
   }

4. Frontend → POST /api/projects/import/qgs/
   FormData: { project: "ogrodzienicsip" }  ← używa custom_project_name

5. Backend szuka projektu:
   - WHERE project_name = "ogrodzienicsip"  ← błąd!
   - Powinno: WHERE project_name = "user123_ogrodzienicsip_20251010"

6. Błąd 400: "Projekt nie istnieje w bazie danych"
```

---

## ✅ Rozwiązanie

### Algorytm naprawy

Ponieważ `/api/projects/create/` **nie zwraca `project_name`**, musimy pobrać go z bazy:

```typescript
// KROK 1: Utwórz projekt
const createdProject = await createProject({
  project: "ogrodzienicsip",
  domain: "ogrod",
  ...
}).unwrap();

// KROK 2: Odśwież listę projektów (pobierz project_name)
await refetch();

// KROK 3: Znajdź nowo utworzony projekt po custom_project_name
const newProject = projectsData.list_of_projects.find(
  p => p.custom_project_name === "ogrodzienicsip"
);

// KROK 4: Użyj FAKTYCZNEGO project_name do importu
await importQGS({
  project: newProject.project_name, // ✅ Poprawny ID z bazy
  qgsFile: file
}).unwrap();
```

### Zaimplementowany kod

**Plik:** `src/features/dashboard/komponenty/OwnProjects.tsx` (linie 112-140)

```typescript
const handleImportQGIS = async (file: File, projectName: string, domain: string, description?: string) => {
  try {
    // STEP 1: Create project
    const createData: CreateProjectData = {
      project: projectName,  // → custom_project_name
      domain,
      projectDescription: description,
      keywords: 'qgis, import',
      categories: ['Inne'],
    };

    const createdProject = await createProject(createData).unwrap();
    console.log('✅ Project created');

    // STEP 2: Refetch projects to get project_name
    console.log('🔍 Fetching project list to find actual project_name...');
    await refetch();

    // STEP 3: Find project by custom_project_name
    const projects = projectsData?.list_of_projects || [];
    const newProject = projects.find(p => p.custom_project_name === projectName);

    if (!newProject) {
      throw new Error(`Projekt "${projectName}" został utworzony, ale nie znaleziono go w bazie. Odśwież stronę i spróbuj zaimportować QGS ręcznie.`);
    }

    const backendProjectName = newProject.project_name; // ✅ REAL project_name
    console.log('📦 Found project:', {
      custom_project_name: newProject.custom_project_name,
      project_name: newProject.project_name
    });

    // STEP 4: Import QGS with correct project_name
    await importQGS({
      project: backendProjectName, // ✅ Uses project_name, not custom_project_name
      qgsFile: file,
    }).unwrap();

    // Success!
  } catch (error) {
    throw error;
  }
};
```

---

## 📊 Przed vs Po

### Przed poprawką ❌

```
CREATE → Response: { data, success, message }
                    (BRAK project_name!)

IMPORT → Używa: custom_project_name
       → Backend szuka: WHERE project_name = custom_project_name
       → Nie znajdzie → 400 Bad Request
```

### Po poprawce ✅

```
CREATE → Response: { data, success, message }
REFETCH → Pobiera listę projektów z bazy
FIND → Znajduje projekt po custom_project_name
EXTRACT → Wyciąga project_name
IMPORT → Używa: project_name
       → Backend szuka: WHERE project_name = project_name
       → Znajdzie → 200 OK → Sukces!
```

---

## 🧪 Testowanie

### Test manual (po deploy)

1. Otwórz `https://universemapmaker.online/dashboard`
2. Kliknij **"Utwórz nowy projekt"** → Tab **"Importuj QGIS"**
3. Wybierz plik `.qgs` lub `.qgz`
4. Wypełnij formularz:
   - Nazwa: `test_projekt_123`
   - Domena: `test-123`
5. Kliknij **"Utwórz i importuj"**

**Oczekiwany rezultat w konsoli:**

```
🔧 Creating project with data: { project: "test_projekt_123", ... }
✅ Project created, backend response: { data: {...}, success: true }
🔍 Fetching project list to find actual project_name...
📦 Found project in database: {
  custom_project_name: "test_projekt_123",
  project_name: "user_test_projekt_123_20251010"  ← Backend ID!
}
📤 Importing QGS file to project: user_test_projekt_123_20251010
✅ QGS imported successfully!
```

**UI:**
- ✅ Projekt pojawi się na liście "Moje Projekty"
- ✅ Plik QGS zostanie zaimportowany
- ✅ Brak błędu 400

---

## 🔄 Commits

1. **`da6eda5`** - fix: correct createProject response type
2. **`8d34639`** - debug: add detailed logging for response inspection
3. **`2b58ef5`** - **fix: use project_name instead of custom_project_name for QGS import** ← Główna naprawa

---

## 📝 Rekomendacje dla backendu (opcjonalnie)

Aby uniknąć tego problemu w przyszłości, backend powinien **zwracać `project_name`** w odpowiedzi `/api/projects/create/`:

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
  "project_name": "user_projekt_123_20251010"  ← Dodaj to pole!
}
```

To by wyeliminowało potrzebę dodatkowego requesta GET.

---

## 🎯 Podsumowanie

### Problem
Backend używa `project_name` (ID) do importu QGS, ale frontend wysyłał `custom_project_name` (nazwa użytkownika).

### Rozwiązanie
Po utworzeniu projektu, frontend:
1. Odświeża listę projektów
2. Znajduje nowo utworzony projekt po `custom_project_name`
3. Wyciąga faktyczny `project_name` z bazy
4. Używa `project_name` do importu QGS

### Status
✅ **NAPRAWIONE** - Gotowe do testowania na produkcji

**Data:** 2025-10-10
**Commits:** da6eda5, 8d34639, 2b58ef5
**Branch:** main
**Autor:** Claude Code

---

## 📚 Dokumentacja powiązana

- [docs/CREATE_IMPORT_QGS_WORKFLOW.md](CREATE_IMPORT_QGS_WORKFLOW.md) - Workflow importu
- [Dokumentacja/projects_api_docs.md](../Dokumentacja/projects_api_docs.md) - API reference
- [src/redux/api/projectsApi.ts](../src/redux/api/projectsApi.ts) - RTK Query endpoints
- [src/api/typy/types.ts](../src/api/typy/types.ts) - TypeScript types
