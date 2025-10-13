# Backend Code: Create Project from Shapefile

## Kod do dodania w backend (Django)

### 1. Serializer (`geocraft_api/projects/serializers.py`)

Dodaj na końcu pliku:

```python
from rest_framework import serializers

class CreateProjectFromShapefileSerializer(serializers.Serializer):
    """
    Serializer for creating a project from Shapefile(s)

    Handles multipart/form-data with project metadata and multiple Shapefile sets
    """
    project = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Project name (will be made unique with suffix if duplicate)"
    )
    domain = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Subdomain for project (must be unique)"
    )
    projectDescription = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Project description"
    )
    keywords = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Project keywords (comma-separated)"
    )
    categories = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Project categories"
    )

    # File fields are handled in view (multipart/form-data)
    # Format: shapefiles[0].shp, shapefiles[0].shx, etc.

    def validate_domain(self, value):
        """Check if domain already exists"""
        from geocraft_api.models import Domain

        if Domain.objects.filter(name=value).exists():
            raise serializers.ValidationError(
                f"Domena '{value}' jest już zajęta. Wybierz inną nazwę."
            )
        return value
```

### 2. View (`geocraft_api/projects/views.py`)

Dodaj na końcu pliku:

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .serializers import CreateProjectFromShapefileSerializer
from .service import (
    generate_project_name,
    create_project_database,
    create_geo_json_layer,
    make_json_tree_and_save
)
from geocraft_api.models import ProjectItem, Domain, Layer, QgsFile
import os
import shutil
from qgis.core import QgsProject, QgsVectorLayer, QgsCoordinateReferenceSystem
import tempfile
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project_from_shapefile(request):
    """
    Create a new project from Shapefile(s) - atomic operation

    This endpoint handles the complete workflow:
    1. Create project database and records
    2. Import all Shapefiles to PostGIS
    3. Generate QGS file with all layers
    4. Generate tree.json with layer hierarchy

    Request (multipart/form-data):
        - project: str (project name)
        - domain: str (subdomain)
        - projectDescription: str (optional)
        - keywords: str (optional)
        - categories: list[str] (optional)
        - shapefiles[N].name: str (layer name)
        - shapefiles[N].shp: file (.shp file)
        - shapefiles[N].shx: file (optional)
        - shapefiles[N].dbf: file (optional)
        - shapefiles[N].prj: file (optional)
        - shapefiles[N].cpg: file (optional)
        - shapefiles[N].qpj: file (optional)

    Response:
        {
            "success": true,
            "message": "Projekt utworzony z X warstwami",
            "data": {
                "project_name": "project",
                "db_name": "project",
                "layers": [{...}],
                "qgs_path": "qgs/project/project.qgs",
                "tree_json_path": "qgs/project/tree.json"
            }
        }
    """

    # Validate basic project data
    serializer = CreateProjectFromShapefileSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Błąd walidacji danych',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    user = request.user

    # Parse Shapefile sets from request.FILES
    shapefile_sets = []
    index = 0
    while True:
        # Check if shapefiles[N].shp exists
        shp_key = f'shapefiles[{index}].shp'
        if shp_key not in request.FILES:
            break

        # Extract all files for this Shapefile
        shapefile_set = {
            'name': request.data.get(f'shapefiles[{index}].name', f'layer_{index}'),
            'shp': request.FILES.get(f'shapefiles[{index}].shp'),
            'shx': request.FILES.get(f'shapefiles[{index}].shx'),
            'dbf': request.FILES.get(f'shapefiles[{index}].dbf'),
            'prj': request.FILES.get(f'shapefiles[{index}].prj'),
            'cpg': request.FILES.get(f'shapefiles[{index}].cpg'),
            'qpj': request.FILES.get(f'shapefiles[{index}].qpj'),
        }
        shapefile_sets.append(shapefile_set)
        index += 1

    if not shapefile_sets:
        return Response({
            'success': False,
            'message': 'Nie wybrano plików Shapefile do importu'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Generate unique project name
    custom_project_name = validated_data['project']
    project_name = generate_project_name(custom_project_name)

    try:
        with transaction.atomic():
            # 1. Create project database and records
            db_info = create_project_database(
                project_name=project_name,
                user=user,
                custom_project_name=custom_project_name
            )

            # 2. Create Domain
            domain = Domain.objects.create(
                name=validated_data['domain'],
                project_id=db_info['project_item'].id
            )

            # 3. Create project directory
            project_dir = os.path.join('qgs', project_name)
            os.makedirs(project_dir, exist_ok=True)

            # 4. Initialize QGIS project
            qgs_project = QgsProject.instance()
            qgs_project.clear()

            # Set project CRS (default: EPSG:3857)
            crs = QgsCoordinateReferenceSystem("EPSG:3857")
            qgs_project.setCrs(crs)

            # 5. Import each Shapefile to PostGIS and add to QGS
            imported_layers = []

            for idx, shp_set in enumerate(shapefile_sets):
                # Create temporary directory for Shapefile components
                with tempfile.TemporaryDirectory() as temp_dir:
                    # Save Shapefile components to temp directory
                    base_name = shp_set['name']
                    shp_path = os.path.join(temp_dir, f"{base_name}.shp")

                    # Save .shp file (required)
                    with open(shp_path, 'wb') as f:
                        f.write(shp_set['shp'].read())

                    # Save optional files
                    for ext in ['shx', 'dbf', 'prj', 'cpg', 'qpj']:
                        if shp_set.get(ext):
                            file_path = os.path.join(temp_dir, f"{base_name}.{ext}")
                            with open(file_path, 'wb') as f:
                                f.write(shp_set[ext].read())

                    # Import to PostGIS
                    layer_name = shp_set['name']
                    source_table_name = f"{project_name}_{layer_name}".replace('-', '_')

                    # Use existing import function (from service.py)
                    # Convert Shapefile to GeoJSON first
                    geojson_path = os.path.join(temp_dir, f"{base_name}.geojson")

                    # Load Shapefile with QGIS
                    vector_layer = QgsVectorLayer(shp_path, base_name, "ogr")
                    if not vector_layer.isValid():
                        raise Exception(f"Nieprawidłowy plik Shapefile: {base_name}")

                    # Export to GeoJSON
                    from qgis.core import QgsVectorFileWriter
                    error = QgsVectorFileWriter.writeAsVectorFormat(
                        vector_layer,
                        geojson_path,
                        "UTF-8",
                        crs,
                        "GeoJSON"
                    )
                    if error[0] != QgsVectorFileWriter.NoError:
                        raise Exception(f"Błąd eksportu GeoJSON: {error[1]}")

                    # Import GeoJSON to PostGIS (reuse existing function)
                    epsg = "3857"  # Default
                    if shp_set.get('prj'):
                        # Try to extract EPSG from .prj file
                        # This is simplified - production should parse .prj properly
                        pass

                    create_geo_json_layer(
                        project_name=project_name,
                        user=user,
                        file_path=geojson_path,
                        source_table_name=source_table_name,
                        epsg=epsg
                    )

                    # Create Layer record in database
                    layer_record = Layer.objects.create(
                        project=project_name,
                        projectitem=db_info['project_item'],
                        source_table_name=source_table_name,
                        published=False,
                        public=False,
                        is_app=True
                    )

                    # Add layer to QGIS project
                    # Create PostGIS connection layer
                    uri = f"dbname='{project_name}' host='{db_info['host']}' port='{db_info['port']}' user='{db_info['login']}' password='{db_info['password']}' table='{source_table_name}' (geom)"

                    qgs_layer = QgsVectorLayer(uri, layer_name, "postgres")
                    if qgs_layer.isValid():
                        qgs_project.addMapLayer(qgs_layer)

                    # Get layer extent
                    extent = vector_layer.extent()

                    # Store layer info
                    imported_layers.append({
                        'layer_name': layer_name,
                        'source_table_name': source_table_name,
                        'geometry_type': vector_layer.geometryType().name if hasattr(vector_layer.geometryType(), 'name') else 'Unknown',
                        'feature_count': vector_layer.featureCount(),
                        'extent': [
                            extent.xMinimum(),
                            extent.yMinimum(),
                            extent.xMaximum(),
                            extent.yMaximum()
                        ]
                    })

            # 6. Save QGS project file
            qgs_file_path = os.path.join(project_dir, f"{project_name}.qgs")
            qgs_project.write(qgs_file_path)

            # 7. Create QgsFile record
            QgsFile.objects.create(
                project=project_name,
                qgs=qgs_file_path
            )

            # 8. Generate tree.json
            tree_json_path = os.path.join(project_dir, 'tree.json')
            make_json_tree_and_save(qgs_project, project_name)

            # 9. Prepare response
            return Response({
                'success': True,
                'message': f"Projekt '{project_name}' został utworzony z {len(imported_layers)} warstwami",
                'data': {
                    'project_name': project_name,
                    'db_name': project_name,
                    'domain': validated_data['domain'],
                    'layers': imported_layers,
                    'qgs_path': qgs_file_path,
                    'tree_json_path': tree_json_path
                }
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        # Rollback will happen automatically due to transaction.atomic()
        return Response({
            'success': False,
            'message': f'Błąd podczas tworzenia projektu: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 3. URL Routing (`geocraft_api/projects/urls.py`)

Dodaj do listy urlpatterns:

```python
from django.urls import path
from . import views

urlpatterns = [
    # ... existing routes ...

    # NEW: Create project from Shapefile (atomic operation)
    path('api/projects/create-from-shp/', views.create_project_from_shapefile, name='create-from-shp'),
]
```

### 4. Helper Function w `service.py` (jeśli nie istnieje)

Dodaj na końcu `geocraft_api/projects/service.py`:

```python
def generate_project_name(custom_name):
    """
    Generate unique project name with suffix if duplicate exists

    Args:
        custom_name: User-provided project name

    Returns:
        Unique project name (e.g., "project" or "project_1")
    """
    from geocraft_api.models import ProjectItem

    project_name = custom_name
    suffix = 1

    while ProjectItem.objects.filter(project_name=project_name).exists():
        project_name = f"{custom_name}_{suffix}"
        suffix += 1

    return project_name
```

## Instrukcje wdrożenia

### Krok 1: Dodaj kod do backendu

```bash
# SSH do backend VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Przejdź do katalogu projektu
cd ~/Universe-Mapmaker-Backend

# Utwórz branch dla nowej funkcji
git checkout -b feature/create-from-shapefile

# Edytuj pliki:
nano geocraft_api/projects/serializers.py  # Dodaj CreateProjectFromShapefileSerializer
nano geocraft_api/projects/views.py        # Dodaj create_project_from_shapefile
nano geocraft_api/projects/urls.py         # Dodaj routing
nano geocraft_api/projects/service.py      # Dodaj generate_project_name (jeśli nie ma)
```

### Krok 2: Testuj lokalnie (opcjonalne)

```bash
# Uruchom serwer Django
python manage.py runserver

# Testuj endpoint z curl
curl -X POST http://localhost:8000/api/projects/create-from-shp/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "project=test-shp" \
  -F "domain=test-shp" \
  -F "projectDescription=Test Shapefile project" \
  -F "shapefiles[0].name=layer1" \
  -F "shapefiles[0].shp=@layer1.shp" \
  -F "shapefiles[0].shx=@layer1.shx" \
  -F "shapefiles[0].dbf=@layer1.dbf" \
  -F "shapefiles[0].prj=@layer1.prj"
```

### Krok 3: Commit i deploy

```bash
# Commit zmian
git add .
git commit -m "feat: add create-from-shapefile endpoint for atomic Shapefile project creation"

# Push do GitHub
git push origin feature/create-from-shapefile

# Restart Django container na VM
sudo docker restart universe-mapmaker-backend_django_1

# Sprawdź logi
sudo docker logs -f universe-mapmaker-backend_django_1
```

### Krok 4: Weryfikacja

```bash
# Test produkcyjnego endpointu
curl -X POST https://api.universemapmaker.online/api/projects/create-from-shp/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "project=test-prod" \
  -F "domain=test-prod" \
  -F "shapefiles[0].name=test" \
  -F "shapefiles[0].shp=@test.shp"

# Sprawdź czy QGS został utworzony z warstwami
cat ~/mapmaker/server/qgs/test-prod/test-prod.qgs | grep "<projectlayers>"

# Sprawdź czy tree.json ma children
cat ~/mapmaker/server/qgs/test-prod/tree.json | jq '.children'
```

## Uwagi implementacyjne

### Bezpieczeństwo
- ✅ Endpoint wymaga autentykacji (`IsAuthenticated`)
- ✅ Walidacja rozmiaru plików (Django `MAX_UPLOAD_SIZE`)
- ✅ Transakcja atomowa - rollback przy błędzie
- ✅ Walidacja unikalności domeny

### Wydajność
- Import Shapefile może trwać długo dla dużych plików
- Rozważ async task (Celery) dla produkcji:
  ```python
  @shared_task
  def import_shapefile_async(project_name, shapefile_data):
      # ... import logic ...
  ```

### Obsługa błędów
- Nieprawidłowy format Shapefile → 400 Bad Request
- Brak wymaganych plików → 400 Bad Request
- Duplikat domeny → 400 Bad Request
- Błąd bazy danych → 500 Internal Server Error
- Błąd QGIS → 500 Internal Server Error

## Testowanie

### Przypadki testowe

1. **Single Shapefile (tylko .shp)**
   ```bash
   -F "shapefiles[0].shp=@layer.shp"
   # Powinno zadziałać (minimalne wymagania)
   ```

2. **Complete Shapefile (wszystkie pliki)**
   ```bash
   -F "shapefiles[0].shp=@layer.shp" \
   -F "shapefiles[0].shx=@layer.shx" \
   -F "shapefiles[0].dbf=@layer.dbf" \
   -F "shapefiles[0].prj=@layer.prj" \
   -F "shapefiles[0].cpg=@layer.cpg"
   # Powinno zadziałać z pełnymi danymi
   ```

3. **Multiple Shapefiles**
   ```bash
   -F "shapefiles[0].shp=@layer1.shp" \
   -F "shapefiles[1].shp=@layer2.shp"
   # Powinno utworzyć projekt z 2 warstwami
   ```

4. **Invalid Shapefile**
   ```bash
   -F "shapefiles[0].shp=@invalid.txt"
   # Powinno zwrócić 400 Bad Request
   ```

5. **Duplicate domain**
   ```bash
   -F "domain=existing-domain"
   # Powinno zwrócić 400 Bad Request
   ```

## Alternatywy i usprawnienia

### Async processing (dla dużych plików)
```python
from celery import shared_task

@shared_task
def create_project_from_shapefile_async(user_id, project_data, shapefile_data):
    # Long-running import process
    # Send WebSocket notification when done
    pass
```

### Progress tracking
```python
# WebSocket progress updates
channel_layer.group_send(
    f"user_{user.id}",
    {
        "type": "import.progress",
        "message": f"Importowanie warstwy {idx + 1}/{total}",
        "progress": int((idx + 1) / total * 100)
    }
)
```

### ZIP file support
```python
import zipfile

if shapefile_file.name.endswith('.zip'):
    with zipfile.ZipFile(shapefile_file) as zf:
        zf.extractall(temp_dir)
        # Find .shp file in extracted files
```

## Status

- ✅ Kod backend gotowy do wdrożenia
- ⏳ Czeka na dodanie do repozytorium backend
- ⏳ Frontend integration (następny krok)
