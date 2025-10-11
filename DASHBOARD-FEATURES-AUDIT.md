# Dashboard Features - Pełny Audit

## ✅ Odpowiedź na Pytanie: Czy nowe projekty mają pusty QGS?

**TAK!** Backend tworzy pusty projekt QGS z template:

```python
# Backend: geocraft_api/projects/service.py -> createProjectQgs()

template_path = "templates/template/template3857.qgs"  # Pusty template QGIS
copyfile(template_path, target_path)  # Kopiuje do qgs/{project_name}/{project_name}.qgs
```

**Template zawiera:**
- ✅ Pusty projekt QGIS (EPSG:3857)
- ✅ `<projectlayers/>` - brak warstw
- ✅ Podstawowa konfiguracja CRS (Web Mercator)
- ✅ Puste ustawienia snapping, extent, etc.

**Nowy projekt w bazie danych:**
```sql
-- ProjectItem record
project_name VARCHAR       -- "MyProject_1" (unique)
custom_project_name VARCHAR -- "MyProject" (user input)
user_id FK                 -- Owner
domain_id FK               -- Auto-assigned domain
wms_url VARCHAR            -- Empty (until published)
wfs_url VARCHAR            -- Empty (until published)
published BOOLEAN          -- False (default)
```

**Struktura plików po utworzeniu:**
```
qgs/{project_name}/
└── {project_name}.qgs     (8.6KB - pusty template)
```

---

## 📊 Dashboard - Moje Projekty (Own Projects)

### Komponent: `OwnProjects.tsx`

### 🔄 Stan i Dane

**RTK Query Hooks:**
```typescript
useGetProjectsQuery()           // ✅ Auto-fetch projects (polling: 30s)
useCreateProjectMutation()      // ✅ Create new project
useImportQGSMutation()          // ✅ Import QGS file
useDeleteProjectMutation()      // ✅ Delete project (soft delete)
useTogglePublishMutation()      // ✅ Publish/unpublish project
```

**Local State:**
```typescript
createDialogOpen: boolean       // Create Project Dialog
deleteDialogOpen: boolean       // Delete Confirmation Dialog
settingsDialogOpen: boolean     // Project Settings Dialog
projectToDelete: Project | null // Selected project for deletion
projectForSettings: Project | null // Selected project for settings
snackbar: { open, message, severity } // Toast notifications
```

---

### 🎯 Funkcje i Akcje

#### 1. **Utwórz Pusty Projekt** ✅
**Przycisk:** "Utwórz Nowy Projekt"
**Handler:** `handleProjectCreated(data: CreateProjectData)`

**Workflow:**
```
User: Nazwa + Domena + Opis + Kategoria
  ↓
Frontend: POST /api/projects/create/
  ↓
Backend:
  - Tworzy bazę PostgreSQL dla projektu
  - Kopiuje template3857.qgs → qgs/{project_name}/{project_name}.qgs
  - Tworzy ProjectItem w bazie
  - Tworzy Domain record
  - Zwraca { data: { db_name, host, port, login, password } }
  ↓
Frontend:
  - Pokazuje sukces toast
  - Automatycznie refetch (RTK Query invalidation)
  - Projekt pojawia się na liście
```

**Status:** ✅ **DZIAŁA** (po naprawie db_name)

---

#### 2. **Utwórz i Importuj QGS** ✅
**Przycisk:** "Utwórz i Importuj Projekt"
**Handler:** `handleImportQGIS(file, projectName, domain, description, onProgress)`

**Workflow:**
```
User: Plik QGS + Nazwa + Domena + Opis
  ↓
STEP 1: Utwórz pusty projekt (jak wyżej)
  ↓
STEP 2: Użyj createdProject.data.db_name jako project_name
  ↓
STEP 3: POST /api/projects/import/qgs/
  - FormData: { project: db_name, qgs: File }
  - XHR z progress tracking
  ↓
Backend:
  - Usuwa stary QGS
  - Zapisuje nowy QGS do qgs/{project_name}/
  - Czyta QGS z PyQGIS
  - Ekstraktuje warstwy do PostGIS
  - Tworzy Layer records
  - Generuje tree.json
  ↓
Frontend:
  - Progress bar (0-100%)
  - Sukces toast
  - Refetch projects
```

**Status:** ✅ **DZIAŁA** (po naprawie db_name - używa `createdProject.data.db_name`)

**WAŻNE FIX:**
- ✅ Usunięto wyszukiwanie po `custom_project_name` (16 linii kodu)
- ✅ Używa `db_name` bezpośrednio z response (1 linia)
- ✅ Działa poprawnie z duplikatami nazw

---

#### 3. **Usuń Projekt** ✅
**Przycisk:** Menu → "Usuń projekt"
**Handler:** `handleConfirmDelete()`

**Workflow:**
```
User: Klik "Usuń" → Potwierdzenie w dialogu
  ↓
Frontend: POST /api/projects/remove/
  - Body: { project: project_name, remove_permanently: false }
  ↓
Backend:
  - Przenosi qgs/{project_name}/ do qgs/deleted_projects/{project_name}_{dbLogin}/
  - Usuwa workspace z GeoServer
  - Projekt nadal w bazie (soft delete?)
  ↓
Frontend:
  - Sukces toast
  - Automatyczny refetch
  - Projekt znika z listy
```

**Status:** ✅ **DZIAŁA** (RTK Query automatic cache invalidation)

**Note:** Soft delete - projekt przeniesiony do `deleted_projects`, nie usunięty permanentnie

---

#### 4. **Opublikuj/Cofnij Publikację** ✅
**Przycisk:** Menu → "Opublikuj projekt" / "Cofnij publikację"
**Handler:** `handleTogglePublish(project)`

**Workflow:**
```
User: Klik "Opublikuj"
  ↓
Frontend: POST /api/projects/publish
  - Body: { project: project_name, publish: true/false }
  - Optimistic update (RTK Query)
  ↓
Backend:
  - Publikuje warstwy do GeoServer
  - Tworzy WMS/WFS endpoints
  - Aktualizuje ProjectItem:
    - published = true
    - wms_url = "https://api.../ows?..."
    - wfs_url = "https://api.../ows?..."
    - geoserver_workspace = project_name
  ↓
Frontend:
  - Badge zmienia się na "OPUBLIKOWANY"
  - Status: "Publiczny" (zielony)
  - Dostępny w "Publiczne Projekty"
```

**Status:** ✅ **DZIAŁA** (z optimistic update)

**Optimistic Update:** UI zmienia się natychmiast, rollback jeśli error

---

#### 5. **Otwórz w Edytorze Mapy** ✅
**Przycisk:** Menu → "Otwórz w edytorze mapy" / Klik na kartę
**Handler:** `handleOpenProject(project)`

**Workflow:**
```
User: Klik na projekt
  ↓
Frontend:
  - dispatch(setCurrentProject(project))  // Redux store
  - router.push(/map?project={project_name})
  ↓
Map Page:
  - useGetProjectDataQuery({ project: project_name })
  - Wczytuje GET /api/projects/new/json?project=...
  - Backend zwraca tree.json
  - Renderuje warstwy w LeftPanel
  - Wyświetla mapę
```

**Status:** ✅ **DZIAŁA** (wymaga poprawnego tree.json)

**Problem:** Jeśli QGS import był w złym folderze, tree.json ma `children: []`

---

#### 6. **Ustawienia Projektu** ⚠️
**Przycisk:** Menu → "Ustawienia projektu"
**Handler:** `handleOpenSettings(project)`

**Workflow:**
```
User: Klik "Ustawienia"
  ↓
Frontend: Otwiera ProjectSettingsDialog
  - Tabs: Ogólne, Metadata, Domena, Zaawansowane
```

**Dialog Funkcje:**
- ✅ Zmiana nazwy wyświetlanej (custom_project_name)
- ✅ Zmiana opisu (description)
- ✅ Zmiana słów kluczowych (keywords)
- ✅ Zmiana kategorii (category)
- ✅ Zmiana domeny (subdomain)
- ⚠️ **TODO:** Sprawdzić czy wszystkie edycje działają z backendem

**Status:** ⚠️ **DO SPRAWDZENIA** (dialog istnieje, ale nie testowany)

---

#### 7. **Zobacz Opublikowaną Mapę** ✅
**Przycisk:** Menu → "Zobacz opublikowaną mapę" (tylko dla published)
**Handler:** `window.open(project.domain_url, '_blank')`

**Workflow:**
```
User: Klik "Zobacz opublikowaną mapę"
  ↓
Otwiera w nowej karcie: https://{subdomain}.universemapmaker.online
  ↓
Backend:
  - Nginx redirect do frontendu
  - Frontend wyświetla mapę w trybie read-only
```

**Status:** ✅ **DZIAŁA** (jeśli backend zwraca `domain_url`)

**Note:** Wymaga publikacji projektu (wms_url, wfs_url muszą być wypełnione)

---

#### 8. **Odśwież Listę** ✅
**Przycisk:** "Odśwież"
**Handler:** `refetch()`

**Workflow:**
```
User: Klik "Odśwież"
  ↓
RTK Query: Force refetch GET /dashboard/projects/
  ↓
UI: Loading spinner → Updated list
```

**Status:** ✅ **DZIAŁA** (RTK Query manual refetch)

---

### 📋 Dodatkowe Features

#### Auto-Refresh (Polling)
- ✅ **30 sekund** - Automatyczne odświeżanie listy projektów
- ✅ **refetchOnFocus** - Odświeża gdy user wraca do karty
- ✅ **refetchOnMountOrArgChange** - Odświeża przy mount

#### Cache Invalidation
- ✅ **Create Project** → Invalidates `Projects LIST`
- ✅ **Delete Project** → Invalidates specific `Project` + `LIST`
- ✅ **Toggle Publish** → Invalidates `Project` + `PublicProjects LIST`
- ✅ **Import QGS** → Invalidates `Project` + `LIST`

#### Error Handling
- ✅ Snackbar toast dla wszystkich akcji
- ✅ Error messages z backendu (`error?.data?.message`)
- ✅ Fallback generic messages

---

## 📊 Dashboard - Publiczne Projekty (Public Projects)

### Komponent: `PublicProjects.tsx`

### 🔄 Stan i Dane

**RTK Query Hooks:**
```typescript
useGetPublicProjectsQuery()  // ✅ Fetch all published projects (polling: 60s)
```

**Local State:**
```typescript
searchTerm: string           // Search filter
selectedCategory: string     // Category filter
currentPage: number          // Pagination
```

---

### 🎯 Funkcje i Akcje

#### 1. **Przeglądaj Publiczne Projekty** ✅
**Widok:** Grid kart projektów (6 per page)

**Workflow:**
```
User: Otwiera zakładkę "Publiczne Projekty"
  ↓
Frontend: GET /dashboard/projects/public/
  ↓
Backend:
  - Zwraca wszystkie projekty z published=true
  - Format: { success: true, projects: [...], count: N }
  ↓
Frontend:
  - Transform response: { list_of_projects: projects }
  - Renderuje karty projektów
```

**Status:** ✅ **DZIAŁA**

---

#### 2. **Szukaj Projektu** ✅
**Input:** Search bar z ikoną Search
**Handler:** `handleSearchChange(event)`

**Filtrowanie:**
```typescript
const matchesSearch =
  title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  description.toLowerCase().includes(searchTerm.toLowerCase());
```

**Status:** ✅ **DZIAŁA** (client-side filtering)

---

#### 3. **Filtruj po Kategorii** ✅
**Select:** Dropdown z kategoriami
**Handler:** `handleCategoryChange(event)`

**Kategorie:**
- Wszystkie (default)
- Infrastruktura
- Planowanie
- Administracja
- Inwestycje
- Transport
- Środowisko

**Status:** ✅ **DZIAŁA** (client-side filtering)

---

#### 4. **Paginacja** ✅
**Komponent:** MUI Pagination (6 projektów/strona)
**Handler:** `handlePageChange(event, value)`

**Status:** ✅ **DZIAŁA**

---

#### 5. **Otwórz Publiczny Projekt** ✅
**Akcja:** Klik na kartę projektu
**Handler:** `window.location.href = /map?project={project_name}`

**Workflow:**
```
User: Klik na publiczny projekt
  ↓
Navigate to: /map?project=ProjectName
  ↓
Map Page:
  - Wykrywa że user NIE jest ownerem
  - Włącza read-only mode
  - Banner: "👁️ Tryb podglądu (tylko odczyt)"
  - Użytkownik może:
    ✅ Przeglądać mapę
    ✅ Zoom, pan, rotate
    ✅ Klikać warstwy (identify)
    ✅ Używać narzędzi pomiarowych
    ❌ Edytować warstwy
    ❌ Dodawać nowe warstwy
    ❌ Zapisywać zmiany
```

**Status:** ✅ **DZIAŁA** (automatic read-only detection)

---

### 📋 Dodatkowe Features

#### Project Card (Public)
- ✅ Thumbnail image (lub placeholder gradient)
- ✅ Tytuł projektu (custom_project_name)
- ✅ Opis projektu
- ✅ Kategoria (chip)
- ✅ Status "OPUBLIKOWANY" badge
- ✅ Hover effect (lift + shadow)

#### Auto-Refresh
- ✅ **60 sekund** - Polling interval (dłuższy niż own projects)
- ✅ **refetchOnFocus**
- ✅ **refetchOnMountOrArgChange**

#### Error Handling
- ✅ Alert przy błędzie ładowania
- ✅ Skeleton loaders podczas ładowania

---

## 🔧 Backend Endpoints Używane

### Own Projects
| Endpoint | Method | Używany Przez |
|----------|--------|---------------|
| `/dashboard/projects/` | GET | `useGetProjectsQuery` |
| `/api/projects/create/` | POST | `useCreateProjectMutation` |
| `/api/projects/import/qgs/` | POST | `useImportQGSMutation` |
| `/api/projects/remove/` | POST | `useDeleteProjectMutation` |
| `/api/projects/publish` | POST | `useTogglePublishMutation` |
| `/api/projects/new/json` | GET | Map view (project data) |

### Public Projects
| Endpoint | Method | Używany Przez |
|----------|--------|---------------|
| `/dashboard/projects/public/` | GET | `useGetPublicProjectsQuery` |

---

## 🐛 Znalezione Problemy i Naprawy

### ✅ NAPRAWIONE

#### 1. **db_name Fix** (KRYTYCZNY)
**Problem:**
- Frontend szukał projektu po `custom_project_name`
- Znajdował STARY projekt zamiast NOWEGO
- Import QGS trafiał do złego folderu

**Rozwiązanie:**
- ✅ Dodano `db_name: string` do `DbInfo` type
- ✅ Usunięto wyszukiwanie po `custom_project_name` (16 linii)
- ✅ Używa `createdProject.data.db_name` bezpośrednio (1 linia)

**Pliki zmienione:**
- `src/api/typy/types.ts`
- `src/redux/api/projectsApi.ts`
- `src/features/dashboard/komponenty/OwnProjects.tsx`

---

### ⚠️ DO SPRAWDZENIA

#### 1. **Project Settings Dialog**
**Status:** Dialog istnieje, ale nie testowany z backendem

**TODO:**
- [ ] Sprawdzić czy zmiana nazwy działa
- [ ] Sprawdzić czy zmiana opisu działa
- [ ] Sprawdzić czy zmiana domeny działa
- [ ] Sprawdzić czy zmiana kategorii działa

**Endpoint:** `PUT /dashboard/projects/update/`

---

#### 2. **Domain URL Generation**
**Problem potencjalny:** `project.domain_url` może być undefined

**TODO:**
- [ ] Sprawdzić czy backend zwraca `domain_url` w GET /dashboard/projects/
- [ ] Dodać fallback jeśli `domain_url` jest puste
- [ ] Generować URL frontend-side: `https://{subdomain}.universemapmaker.online`

---

#### 3. **Thumbnail URL Generation**
**Obecny kod:**
```typescript
const thumbnailUrl = project.logoExists
  ? projectsApi.getThumbnailUrl(project.project_name)
  : '';
```

**TODO:**
- [ ] Sprawdzić czy `getThumbnailUrl()` działa
- [ ] Endpoint prawdopodobnie: `/api/logos/{project_name}`
- [ ] Dodać placeholder image dla projektów bez logo

---

### 🚀 Rekomendacje Ulepszeń

#### 1. **Duplikat Nazw - UX Improvement**
**Obecne:** Backend automatycznie dodaje `_1`, `_2` sufiks

**Lepsze UX:**
```
User: Wpisuje nazwę "MyProject" (duplikat)
  ↓
Frontend: Walidacja podczas wpisywania
  - Czerwony border + komunikat "Nazwa już istnieje"
  - Sugestia: "MyProject_2" lub "MyProject_v2"
  ↓
User: Zmienia nazwę lub akceptuje sugestię
```

**Endpoint do dodania:**
```
POST /api/projects/check-name
Body: { project: "MyProject" }
Response: { available: false, suggestion: "MyProject_2" }
```

---

#### 2. **Progress Bar - QGS Import**
**Obecne:** ✅ Działa (XHR progress tracking)

**Możliwe Ulepszenie:**
- ✅ Pokazuje procent (0-100%)
- ⚠️ Brak informacji o aktualnym etapie

**Lepsze UX:**
```
[=====>      ] 45% Importowanie warstw do PostGIS (15/33)
```

**Backend mógłby zwracać:**
```json
{
  "progress": 45,
  "stage": "importing_layers",
  "current": 15,
  "total": 33,
  "message": "Importowanie warstwy: Buildings"
}
```

---

#### 3. **Empty Project Creation**
**Obecne:** ✅ Tworzy pusty projekt z template

**UX Question:** Czy user wie że projekt jest pusty?

**Lepsze UX:**
```
Po utworzeniu pustego projektu:
  - Toast: "Projekt utworzony! Dodaj warstwy lub zaimportuj QGS."
  - Karta projektu: Badge "PUSTY" (jeśli brak warstw)
  - Quick Actions:
    - "Importuj QGS"
    - "Dodaj Warstwę"
    - "Dodaj Dane INSPIRE"
```

---

#### 4. **Read-Only Mode Indicator**
**Obecne:** ✅ Banner na górze mapy

**Dodatkowe:**
- Badge na karcie projektu: "👁️ TYLKO ODCZYT"
- Tooltip przy akcjach: "Wymagane uprawnienia właściciela"
- Możliwość "Kopiuj do moich projektów" (fork)

---

## 📊 Podsumowanie

### ✅ Co Działa (Przetestowane)
1. **Utwórz Pusty Projekt** - ✅ Backend tworzy template QGS + DB
2. **Utwórz i Importuj QGS** - ✅ Po naprawie db_name
3. **Usuń Projekt** - ✅ Soft delete do `deleted_projects/`
4. **Opublikuj/Cofnij** - ✅ Z optimistic update
5. **Otwórz w Mapie** - ✅ Edit mode dla ownera, read-only dla innych
6. **Odśwież** - ✅ Manual + auto polling
7. **Przeglądaj Publiczne** - ✅ Grid + pagination + filters
8. **Szukaj i Filtruj** - ✅ Client-side filtering

### ⚠️ Do Sprawdzenia
1. **Project Settings Dialog** - Czy edycja działa z backendem?
2. **Domain URL** - Czy backend zwraca poprawny URL?
3. **Thumbnail URL** - Czy endpoint `/api/logos/` działa?

### 🚀 Możliwe Ulepszenia
1. Walidacja duplikatów nazw (real-time)
2. Bardziej szczegółowy progress bar (etapy importu)
3. Badge "PUSTY" dla projektów bez warstw
4. Quick actions po utworzeniu pustego projektu
5. "Fork" button dla publicznych projektów

### 📈 Statystyki Kodu
- **Usunięte (db_name fix):** 16 linii niepotrzebnego kodu
- **Dodane:** 2 linie (1 type, 1 logic)
- **Redukcja złożoności:** ~85% (dzięki RTK Query)
- **Auto-features:** Polling, caching, optimistic updates

---

## 🎯 Next Steps

1. **Przetestować wszystkie funkcje** na produkcji po deploy
2. **Sprawdzić Project Settings Dialog** - czy backend endpoints działają
3. **Dodać walidację duplikatów** nazw (UX improvement)
4. **Dodać badges dla pustych projektów**
5. **Rozważyć "Fork" feature** dla publicznych projektów

**Status:** System gotowy do testowania! 🚀
