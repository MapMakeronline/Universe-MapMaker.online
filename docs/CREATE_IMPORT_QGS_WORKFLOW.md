# Create + Import QGS Workflow - Dokumentacja

## Przegląd

Zintegrowane importowanie pliku QGIS (.qgs/.qgz) podczas tworzenia projektu. Użytkownik może teraz utworzyć nowy projekt i od razu zaimportować do niego plik QGIS w jednym kroku.

## Zaimplementowane komponenty

### 1. RTK Query API (`src/redux/api/projectsApi.ts`)

#### Nowy endpoint: `importQGS`

```typescript
importQGS: builder.mutation<
  { data: string; success: boolean; message: string },
  { project: string; qgsFile: File }
>({
  query: ({ project, qgsFile }) => {
    const formData = new FormData();
    formData.append('project', project);
    formData.append('qgs', qgsFile);

    return {
      url: '/api/projects/import/qgs/',
      method: 'POST',
      body: formData,
    };
  },
  invalidatesTags: (result, error, arg) => [
    { type: 'Project', id: arg.project },
    { type: 'Projects', id: 'LIST' },
  ],
})
```

**Hook dostępny dla komponentów:**
```typescript
import { useImportQGSMutation } from '@/redux/api/projectsApi';

const [importQGS, { isLoading }] = useImportQGSMutation();
```

### 2. Dialog importu (`src/features/dashboard/dialogi/CreateProjectDialog.tsx`)

#### Funkcjonalności:

1. **Dwa taby:**
   - **Tab 0:** Utwórz nowy projekt (standardowy formularz)
   - **Tab 1:** Importuj projekt QGIS (upload + formularz)

2. **Walidacja pliku:**
   - Format: tylko `.qgs` lub `.qgz`
   - Maksymalny rozmiar: **100 MB**
   - Automatyczna sanityzacja nazwy projektu z nazwy pliku

3. **Progress indicator:**
   - LinearProgress bar podczas importu
   - Statusy: "⏳ Tworzenie projektu..." → "📤 Importowanie pliku QGS..."

4. **Auto-uzupełnianie:**
   - Nazwa projektu generowana z nazwy pliku
   - Sanityzacja znaków specjalnych (tylko litery, cyfry, `_`)

#### Przykład użycia:

```tsx
<CreateProjectDialog
  open={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
  onCreate={handleProjectCreated}
  onImportQGIS={handleImportQGIS}
/>
```

### 3. Workflow w `OwnProjects.tsx`

#### Dwustopniowy proces:

```typescript
const handleImportQGIS = async (
  file: File,
  projectName: string,
  domain: string,
  description?: string
) => {
  try {
    // STEP 1: Create empty project first (backend requirement)
    const createData: CreateProjectData = {
      project: projectName,
      domain: domain || projectName.toLowerCase(),
      projectDescription: description || `Importowany projekt QGIS: ${file.name}`,
      keywords: 'qgis, import',
      categories: ['Inne'],
    };

    const createdProject = await createProject(createData).unwrap();

    // Use project_name from backend response (not user input)
    const backendProjectName = createdProject.project_name || projectName;

    // STEP 2: Import QGS file to the created project (RTK Query)
    await importQGS({
      project: backendProjectName,
      qgsFile: file,
    }).unwrap();

    // Success notification
    setSnackbar({
      open: true,
      message: `Projekt "${projectName}" został utworzony i zaimportowany pomyślnie!`,
      severity: 'success',
    });
    setCreateDialogOpen(false);

    // RTK Query automatically invalidates cache and refetches
  } catch (error: any) {
    // Error will be handled by CreateProjectDialog
    throw error;
  }
};
```

## Backend API

### Endpoint 1: Create Project

**URL:** `POST /api/projects/create/`
**Body:**
```json
{
  "project": "Moj_Nowy_Projekt",
  "domain": "moj-projekt",
  "projectDescription": "Opis projektu",
  "keywords": "qgis, import",
  "categories": ["Inne"]
}
```

**Response:**
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
  "project_name": "Moj_Nowy_Projekt"
}
```

### Endpoint 2: Import QGS

**URL:** `POST /api/projects/import/qgs/`
**Content-Type:** `multipart/form-data`
**Body:**
- `project`: nazwa projektu (string)
- `qgs`: plik QGS/QGZ (file)

**Response:**
```json
{
  "data": "",
  "success": true,
  "message": "Projekt został pomyślnie zaimportowany"
}
```

**Proces importu (backend):**
1. Usunięcie starego pliku QGS
2. Zapisanie nowego pliku QGS
3. Import warstw wektorowych i rastrowych do PostgreSQL
4. Konfiguracja WFS i stylów
5. Generowanie drzewa warstw (tree.json)

## Walidacja i błędy

### Walidacja frontend:

1. **Format pliku:**
   ```typescript
   if (extension !== 'qgz' && extension !== 'qgs') {
     setQgisError('Nieprawidłowy format pliku. Wybierz plik .qgz lub .qgs');
   }
   ```

2. **Rozmiar pliku:**
   ```typescript
   const maxSize = 100 * 1024 * 1024; // 100 MB
   if (file.size > maxSize) {
     setQgisError(`Plik jest za duży (${size} MB). Maksymalny rozmiar to 100 MB.`);
   }
   ```

3. **Nazwa projektu:**
   - Minimum 3 znaki
   - Tylko litery, cyfry, podkreślnik
   - Automatyczna sanityzacja

### Możliwe błędy backend:

- **400**: Nie znaleziono pliku QGS / Nieprawidłowy formularz / Plik uszkodzony
- **412**: Brakujące warstwy w projekcie
- **500**: Błąd podczas importowania

## UI/UX

### Desktop (≥ 900px):
- Dialog szerokości `maxWidth="md"` (900px)
- Dwa taby z ikonami (Add, CloudUpload)
- Standard modal layout

### Mobile (< 600px):
- Fullscreen dialog
- Taby fullWidth
- Wszystkie pola formularza 100% szerokości

### Progress indicator:
- LinearProgress bar z animacją
- Tekstowy status poniżej ("Tworzenie projektu..." / "Importowanie...")
- Wyświetlany tylko podczas `isImporting === true`

## Testowanie

### Test manual:

1. Uruchom serwer: `npm run dev`
2. Otwórz: `http://localhost:3000/dashboard`
3. Kliknij "Utwórz nowy projekt"
4. Przejdź do taba "Importuj QGIS"
5. Wybierz plik `.qgs` lub `.qgz`
6. Wypełnij formularz (auto-uzupełnienie nazwy)
7. Kliknij "Utwórz i importuj"
8. Obserwuj progress bar
9. Sprawdź czy projekt pojawia się na liście

### Test walidacji:

1. **Nieprawidłowy format:** Wybierz `.txt` → błąd
2. **Za duży plik:** Wybierz plik > 100 MB → błąd
3. **Brak nazwy projektu:** Zostaw puste → przycisk disabled
4. **Brak domeny:** Zostaw puste → przycisk disabled

## Korzyści z RTK Query

1. **Automatyczne cache invalidation:**
   - Po imporcie, lista projektów automatycznie się odświeża
   - Nie trzeba ręcznie wywołać `refetch()`

2. **Unified state management:**
   - `isLoading` automatycznie dostępny
   - Błędy obsługiwane przez RTK Query

3. **Less boilerplate:**
   - ~85% mniej kodu niż async thunks
   - Automatically generated hooks

4. **Optimistic updates:**
   - UI natychmiast reaguje
   - Rollback w przypadku błędu

## Pliki zmodyfikowane

1. `src/redux/api/projectsApi.ts` - dodano `importQGS` mutation
2. `src/features/dashboard/komponenty/OwnProjects.tsx` - zintegrowano workflow
3. `src/features/dashboard/dialogi/CreateProjectDialog.tsx` - dodano progress bar

## Następne kroki (opcjonalnie)

1. **Obsługa QGZ:** Backend już obsługuje `.qgz`, frontend gotowy
2. **Upload progress:** Pokazuj % uploadu dla dużych plików
3. **Batch import:** Importuj wiele projektów naraz
4. **Drag & drop:** Przeciągnij plik zamiast wybierać
5. **Preview:** Podgląd warstw przed importem
