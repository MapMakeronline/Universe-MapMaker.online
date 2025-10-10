# Analiza Struktury Projektów i Integracji QGS

Data analizy: 2025-10-10

## Aktualny Stan Systemu

### 1. Baza Danych PostgreSQL (Google Cloud SQL)
- **Nazwa instancji**: `geocraft-postgres`
- **Lokalizacja**: europe-central2-c
- **Wersja**: PostgreSQL 15
- **Główna tabela**: `geocraft_api_projectitem`

#### Stan Bazy Danych:
```sql
Łącznie projektów w bazie: 20 projektów

ID  | project_name               | user_id | published | category | creationDate
----|---------------------------|---------|-----------|----------|------------------
1   | ddfggdf                   | 3       | false     | Inne     | 2025-10-07
3   | ogrodzieniecccccc         | 5       | false     | Inne     | 2025-10-07
4   | test2                     | 5       | false     | Inne     | 2025-10-07
5   | Mestwin                   | 1       | false     | Inne     | 2025-10-07
6   | Test123                   | 1       | true      | Inne     | 2025-10-09
7   | TestProject1760008581237  | 10      | false     | Inne     | 2025-10-09
8   | TestProject1760009904068  | 11      | false     | Inne     | 2025-10-09
9   | TestProject1760012317271  | 11      | false     | Inne     | 2025-10-09
10  | TestProject1760013390508  | 11      | false     | Inne     | 2025-10-09
11  | TestProject1760014599780  | 11      | false     | Inne     | 2025-10-09
12  | TestProject1760016326027  | 12      | false     | Inne     | 2025-10-09
13  | TestProject1760016956547  | 11      | false     | Inne     | 2025-10-09
14  | TestProject1760017551389  | 11      | false     | Inne     | 2025-10-09
15  | Schronyyy                 | 1       | true      | Inne     | 2025-10-09
16  | TestProject1760017806390  | 13      | false     | Inne     | 2025-10-09
17  | Szachy                    | 1       | false     | Inne     | 2025-10-09
18  | Szach                     | 1       | false     | Inne     | 2025-10-09
19  | TestProject1760025266570  | 11      | false     | Inne     | 2025-10-09
20  | TestProject1760026358437  | 11      | false     | Inne     | 2025-10-09
21  | ffff                      | 15      | true      | Inne     | 2025-10-10
```

### 2. Pliki QGS na VM (universe-backend)
- **Lokalizacja**: `/app/qgs/` w kontenerze Django
- **Struktura**: Każdy projekt ma własny folder o nazwie `project_name`

#### Istniejące foldery QGS:
```
/app/qgs/
├── TestProject1760008581237/
│   └── TestProject1760008581237.qgs
├── TestProject1760009904068/
│   └── TestProject1760009904068.qgs
├── TestProject1760016326027/
│   └── TestProject1760016326027.qgs
├── TestProject1760017806390/
│   └── TestProject1760017806390.qgs
└── ffff/
    └── ffff.qgs
```

### 3. Model Projektu (Django)

**Lokalizacja**: `geocraft_api/models/project.py`

```python
class ProjectItem(models.Model):
    project_name = models.CharField(max_length=100, unique=True)  # KLUCZ! Nazwa pliku QGS
    custom_project_name = models.CharField(max_length=100)        # Nazwa wyświetlana
    metadata_id = models.CharField(max_length=150)
    published = models.BooleanField(default=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    creationDate = models.DateTimeField(auto_now_add=True)
    logoExists = models.BooleanField(default=False)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=150)
    keywords = models.CharField(max_length=150)

    # Pola związane z publikacją
    domain = models.OneToOneField(Domain, on_delete=models.CASCADE)
    wfs_url = models.CharField(max_length=150)
    wms_url = models.CharField(max_length=150)
    geoserver_workspace = models.CharField(max_length=150)

    # Pola związane z warstwami
    layer = models.ManyToManyField(Layer, related_name="projectitem")
    plot_layer = models.CharField(max_length=150)

    # Ustawienia mapy
    settings = models.OneToOneField(CustomUserLayoutMapSettings, on_delete=models.CASCADE)
    default_base_map = models.CharField(max_length=150)
```

## Przepływ Danych: Projekt → QGS → Baza

### 1. Tworzenie Nowego Projektu

**Endpoint**: `POST /api/projects/create/`

**Proces**:
```
1. Frontend → Backend: { name: "Nowy Projekt", category: "MPZP" }
2. Backend (service.py):
   a. Generuje unikalną nazwę: project_name = generate_project_name()
      → np. "NoPr_1760012345678"
   b. Tworzy wpis w ProjectItem (PostgreSQL)
   c. Tworzy folder /app/qgs/{project_name}/
   d. Generuje plik {project_name}.qgs (XML QGIS)
   e. Tworzy bazę danych PostgreSQL dla projektu (PostGIS)
   f. Tworzy workspace w GeoServer (jeśli publish=true)
3. Backend → Frontend: { success: true, project_name: "..." }
```

**Pliki tworzone**:
```
/app/qgs/NoPr_1760012345678/
├── NoPr_1760012345678.qgs           # Główny plik projektu QGIS
├── tree.json                        # Struktura drzewa warstw (opcjonalne)
├── logo.png                         # Logo projektu (opcjonalne)
└── documents/                       # Dokumenty projektu (opcjonalne)
```

### 2. Import Projektu QGIS

**Endpoint**: `POST /api/projects/import/qgs/` lub `/api/projects/import/qgz/`

**Proces**:
```
1. Frontend → Backend: FormData { project_name, qgs_file }
2. Backend (service.py):
   a. Rozpakuje QGZ (jeśli .qgz)
   b. Parsuje XML pliku .qgs
   c. Wyciąga listę warstw (QgsVectorLayer, QgsRasterLayer)
   d. Tworzy wpis w ProjectItem
   e. Kopiuje plik .qgs do /app/qgs/{project_name}/
   f. Dla każdej warstwy:
      - Tworzy tabelę w PostgreSQL
      - Import danych (ogr2ogr, COPY)
      - Aktualizuje source path w .qgs
   g. Tworzy wpisy Layer w bazie danych
3. Backend → Frontend: { success: true, missing_layers: [] }
```

### 3. Otwieranie Projektu w Aplikacji

**Endpoint**: `GET /api/projects/new/json?project={project_name}`

**Proces**:
```
1. Frontend → Backend: project_name
2. Backend:
   a. Sprawdza czy ProjectItem istnieje w bazie
   b. Sprawdza czy plik .qgs istnieje (/app/qgs/{project_name}/{project_name}.qgs)
   c. Parsuje plik .qgs (XML)
   d. Generuje tree.json (jeśli nie istnieje):
      - Hierarchia warstw
      - Styl każdej warstwy (symbologia)
      - Widoczność warstw
      - Extent (bbox) projektu
   e. Zwraca JSON z pełną strukturą
3. Frontend:
   a. Ładuje strukturę drzewa warstw
   b. Inicjalizuje mapę Mapbox GL JS
   c. Dodaje warstwy z QGIS Server (WMS/WFS)
```

**Format zwracanych danych**:
```json
{
  "name": "TestProject1760008581237",
  "extent": [18.5, 54.3, 18.7, 54.5],
  "logoExists": false,
  "large": false,
  "children": [
    {
      "id": "layer-1",
      "name": "Działki",
      "type": "vector",
      "visible": true,
      "opacity": 1.0,
      "source": {
        "type": "wms",
        "url": "https://api.universemapmaker.online/ows",
        "layers": "TestProject1760008581237:dzialki"
      },
      "style": { ... }
    }
  ]
}
```

## Problem: Brak Synchronizacji

### Aktualna Sytuacja:
```
Baza danych:        20 projektów
Pliki QGS:          5 projektów
Admin Panel:        Pokazuje 0 projektów (błąd 404)
```

### Przyczyny:

1. **Brak endpointu `/api/admin-stats/projects`**
   - Endpoint został zadeklarowany w `admin_stats/views.py`
   - Ale NIE został dodany do `admin_stats/urls.py`
   - Frontend wywołuje nieistniejący endpoint → 404

2. **Brakujące pliki QGS**
   - 15 projektów w bazie NIE MA plików .qgs
   - Możliwe przyczyny:
     - Ręczne dodanie do bazy przez Django Admin
     - Błąd podczas tworzenia projektu
     - Usunięte pliki ale pozostałe wpisy w bazie
     - Migracja z innego środowiska

3. **Niespójność danych**
   - Projekty bez plików QGS nie mogą być otwarte
   - Brak walidacji integralności projekt ↔ plik

## Rozwiązanie

### Krok 1: Napraw Backend Endpoint

**Plik**: `geocraft_api/admin_stats/urls.py`

```python
urlpatterns = [
    path('stats', get_admin_stats, name='admin_stats'),
    path('users/<int:user_id>', get_user_details, name='user_details'),
    path('users/<int:user_id>/license', update_user_license, name='update_user_license'),
    path('users/<int:user_id>/delete', delete_user, name='delete_user'),
    path('projects', get_all_projects, name='get_all_projects'),  # ← DODAJ TEN ENDPOINT!
]
```

### Krok 2: Ulepsz Endpoint `get_all_projects`

**Plik**: `geocraft_api/admin_stats/views.py`

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_projects(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    from geocraft_api.models import ProjectItem
    import os

    projects = ProjectItem.objects.select_related('user').all()

    projects_data = []
    for project in projects:
        # Sprawdź czy plik QGS istnieje
        qgs_path = f"/app/qgs/{project.project_name}/{project.project_name}.qgs"
        qgs_exists = os.path.exists(qgs_path)

        # Sprawdź czy baza danych projektu istnieje
        from geocraft_api.projects.db_utils import does_database_exists
        db_exists = does_database_exists(project.project_name)

        projects_data.append({
            'id': project.id,
            'project_name': project.project_name,
            'custom_project_name': project.custom_project_name or '',
            'description': project.description or '',
            'category': project.category or 'Inne',
            'published': project.published,
            'creationDate': project.creationDate.isoformat(),
            'logoExists': project.logoExists,
            'owner': {
                'id': project.user.id if project.user else None,
                'username': project.user.username if project.user else 'Unknown',
                'email': project.user.email if project.user else '',
            },
            # NOWE POLA DIAGNOSTYCZNE
            'qgs_file_exists': qgs_exists,
            'database_exists': db_exists,
            'is_valid': qgs_exists and db_exists,  # Projekt kompletny
        })

    return Response({
        'total_projects': len(projects_data),
        'projects': projects_data,
        'timestamp': timezone.now().isoformat(),
    }, status=200)
```

### Krok 3: Zaktualizuj Frontend Types

**Plik**: `src/redux/api/adminApi.ts`

```typescript
export interface AdminProject {
  id: number;
  project_name: string;
  custom_project_name: string;
  description: string;
  category: string;
  published: boolean;
  creationDate: string;
  logoExists: boolean;
  owner: {
    id: number | null;
    username: string;
    email: string;
  };
  // Nowe pola diagnostyczne
  qgs_file_exists: boolean;
  database_exists: boolean;
  is_valid: boolean;
}
```

### Krok 4: Ulepsz Admin Panel (Frontend)

**Dodaj kolumny statusu**:
```typescript
<TableCell align="center" sx={{ fontWeight: 600 }}>Status QGS</TableCell>
<TableCell align="center" sx={{ fontWeight: 600 }}>Status DB</TableCell>
<TableCell align="center" sx={{ fontWeight: 600 }}>Akcje</TableCell>

// W mapowaniu projektów:
<TableCell align="center">
  {project.qgs_file_exists ? (
    <CheckCircleIcon color="success" fontSize="small" />
  ) : (
    <ErrorIcon color="error" fontSize="small" />
  )}
</TableCell>

<TableCell align="center">
  {project.database_exists ? (
    <CheckCircleIcon color="success" fontSize="small" />
  ) : (
    <ErrorIcon color="error" fontSize="small" />
  )}
</TableCell>

<TableCell align="center">
  {!project.is_valid && (
    <Tooltip title="Napraw projekt">
      <IconButton size="small" color="warning" onClick={() => handleRepairProject(project)}>
        <BuildIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )}
</TableCell>
```

### Krok 5: Dodaj Endpoint Naprawy Projektu

**Backend**: `geocraft_api/admin_stats/views.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def repair_project(request, project_id):
    """
    Naprawia projekt poprzez:
    1. Utworzenie brakującego pliku QGS (jeśli brak)
    2. Utworzenie brakującej bazy danych (jeśli brak)
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    from geocraft_api.models import ProjectItem
    from geocraft_api.projects.service import create_empty_qgs_file
    from geocraft_api.projects.db_utils import create_database

    try:
        project = ProjectItem.objects.get(id=project_id)

        repairs_made = []

        # Sprawdź i napraw plik QGS
        qgs_path = f"/app/qgs/{project.project_name}/{project.project_name}.qgs"
        if not os.path.exists(qgs_path):
            create_empty_qgs_file(project.project_name)
            repairs_made.append('Utworzono plik QGS')

        # Sprawdź i napraw bazę danych
        if not does_database_exists(project.project_name):
            create_database(project.project_name)
            repairs_made.append('Utworzono bazę danych')

        return Response({
            'success': True,
            'message': f'Naprawiono projekt: {", ".join(repairs_made)}',
            'repairs': repairs_made
        }, status=200)

    except ProjectItem.DoesNotExist:
        return Response({'error': 'Projekt nie istnieje'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
```

## Kolejne Kroki

1. ✅ **Napraw endpoint** - Dodaj `path('projects', ...)` do URLs
2. ✅ **Ulepsz backend** - Dodaj pola diagnostyczne do odpowiedzi API
3. ✅ **Zaktualizuj frontend** - Dodaj kolumny statusu w Admin Panel
4. 🔄 **Dodaj funkcję naprawy** - Endpoint do automatycznego naprawiania projektów
5. 🔄 **Dodaj walidację** - Sprawdzanie integralności przy tworzeniu/importie
6. 🔄 **Migracja danych** - Napraw wszystkie istniejące projekty

## Testowanie

### Test 1: Sprawdź endpoint
```bash
curl -H "Authorization: Token <admin-token>" \
  https://api.universemapmaker.online/api/admin-stats/projects
```

### Test 2: Sprawdź status projektu
```bash
# W Django shell
docker exec -it universe-mapmaker-backend_django_1 python manage.py shell
>>> from geocraft_api.models import ProjectItem
>>> p = ProjectItem.objects.get(project_name="Test123")
>>> import os
>>> os.path.exists(f"/app/qgs/{p.project_name}/{p.project_name}.qgs")
```

### Test 3: Otwórz projekt w aplikacji
```
http://localhost:3000/map?project=Test123
```

## Wnioski

**Obecny problem**:
- Admin Panel pokazuje błąd 404 przez brakujący URL pattern
- 15/20 projektów nie ma plików QGS (tylko wpisy w bazie)
- Brak mechanizmu walidacji integralności

**Po naprawie**:
- Admin Panel wyświetli wszystkie 20 projektów
- Każdy projekt będzie miał statusy QGS i DB
- Możliwość automatycznej naprawy uszkodzonych projektów
- Kompletna diagnostyka systemu
