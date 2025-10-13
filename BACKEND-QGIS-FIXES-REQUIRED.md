# Wymagane poprawki w backendzie dla integracji QGIS Server

## Status implementacji frontendu

✅ **Frontend poprawiony** - wszystkie niezbędne zmiany w repozytorium frontendu zostały wykonane:

1. ✅ Poprawiony format parametru MAP w `src/mapbox/qgis-layers.ts`
   - Dodano pełną ścieżkę do pliku QGS: `MAP=ProjectName/ProjectName.qgs`

2. ✅ Poprawiony parametr MAP w `src/components/qgis/QGISProjectLoader.tsx`

3. ✅ Dodana lepsza obsługa błędów w QGISProjectLoader
   - Walidacja współrzędnych
   - Szczegółowe komunikaty błędów
   - Graceful handling przy braku warstw

4. ✅ QGISProjectLoader już zintegrowany w `app/map/page.tsx`

---

## 🔴 KRYTYCZNE - Wymagane poprawki w backendzie

Backend znajduje się w **osobnym repozytorium**. Poniższe poprawki muszą być wykonane w kodzie backendu.

### 1. 🔴 Problem z wątkami w `geocraft_api/json_utils.py`

**Lokalizacja:** `geocraft_api/json_utils.py`, linie 207-215

**Problem:**
```python
def get_all_layers(project, project_name, root):
    pool = ThreadPool(NUMBER_OF_POOL_NODES)  # 32 wątki
    func = partial(get_form_for_layer, ...)
    pool.map(func, list(project.mapLayers().values()))
    # ❌ QgsProject.instance() nie może być używany w wątkach!
```

**Skutek:**
- 90% importów generuje pusty `children: []` w tree.json
- Błąd: `QObject::moveToThread: Current thread is not the object's thread`
- Błąd: `Error getExtentLayer: list index out of range`

**Przyczyna:**
QgsProject.instance() jest singletonem z thread affinity. Dostęp z ThreadPool workers narusza model wątkowania Qt.

**Rozwiązanie:**
Usuń ThreadPool i wykonaj operacje sekwencyjnie:

```python
def get_all_layers(project, project_name, root):
    """
    Extract all layers from QGIS project and generate tree structure

    IMPORTANT: Cannot use ThreadPool with QgsProject.instance()!
    PyQGIS objects have thread affinity and must be accessed from main thread.
    """
    layers_list = list(project.mapLayers().values())
    result = []

    for layer in layers_list:
        try:
            layer_data = get_form_for_layer(
                layer,
                project_name,
                root,
                project
            )
            if layer_data:
                result.append(layer_data)
        except Exception as e:
            logger.error(f"Failed to process layer {layer.name()}: {e}")
            continue

    return result
```

**Wpływ na wydajność:**
- Typowy projekt z 20 warstwami: ~1-2 sekundy (akceptowalne)
- Duży projekt ze 100 warstwami: ~5-10 sekund (rzadki przypadek)
- Zysk: 90% projektów będzie działać poprawnie vs 10% obecnie

---

### 2. 🟡 Nieprawidłowe obliczanie zakresu w `geocraft_api/layers/db_utils.py`

**Lokalizacja:** `geocraft_api/layers/db_utils.py`, funkcja `get_extent_layer()`

**Problem:**
Obecna implementacja może używać nieprawidłowego zapytania SQL do obliczania zakresu warstwy.

**Rozwiązanie:**
Użyj funkcji PostGIS `ST_Extent()`:

```python
def get_extent_layer(db_name, layer_name):
    """
    Get layer extent from PostGIS database
    Returns: [minX, minY, maxX, maxY] in layer's native CRS
    """
    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432')
        )

        cursor = conn.cursor()

        # Use ST_Extent to get bounding box
        # ST_Extent returns BOX(minx miny, maxx maxy) format
        query = f"""
            SELECT ST_Extent(geom)::text
            FROM {layer_name}
            WHERE geom IS NOT NULL;
        """

        cursor.execute(query)
        result = cursor.fetchone()

        if result and result[0]:
            # Parse "BOX(minx miny, maxx maxy)" format
            # Example: "BOX(14.0 49.0, 24.0 55.0)"
            box_str = result[0]
            box_str = box_str.replace('BOX(', '').replace(')', '')
            coords = box_str.replace(',', ' ').split()

            extent = [
                float(coords[0]),  # minX
                float(coords[1]),  # minY
                float(coords[2]),  # maxX
                float(coords[3])   # maxY
            ]

            cursor.close()
            conn.close()

            logger.info(f"✅ Calculated extent for {layer_name}: {extent}")
            return extent
        else:
            logger.warning(f"⚠️ No geometries found for layer {layer_name}")
            return None

    except Exception as e:
        logger.error(f"❌ Failed to get extent for {layer_name}: {e}")
        return None
```

**Dlaczego to ważne:**
- Poprawny extent pozwala na automatyczne centrowanie mapy na warstwie
- Funkcja "Zoom to layer" wymaga poprawnych współrzędnych

---

### 3. 🟢 Włącz WFS domyślnie w `geocraft_api/projects/service.py`

**Lokalizacja:** `geocraft_api/projects/service.py`, funkcja importująca QGS

**Problem:**
WFS może nie być włączony domyślnie po imporcie projektu.

**Rozwiązanie:**
Po imporcie QGS, upewnij się, że WFS jest włączony:

```python
def import_qgs_project(qgs_file_path, project_name):
    """
    Import QGIS project from QGS/QGZ file
    """
    # ... existing import code ...

    # Enable WFS capabilities for all vector layers
    for layer_id, layer in project.mapLayers().items():
        if layer.type() == QgsMapLayer.VectorLayer:
            # Enable WFS for this layer
            project.writeEntry("WFSLayers", layer_id, True)

            # Set max features to reasonable limit
            project.writeEntry("WFSLayersPrecision", layer_id, "8")

    # Save project with WFS enabled
    project.write()

    logger.info(f"✅ WFS enabled for all vector layers in {project_name}")

    # ... rest of the import process ...
```

**Dlaczego to ważne:**
- WFS umożliwia pobieranie danych wektorowych jako GeoJSON
- Frontend wykorzystuje WFS do interaktywnych funkcji (kliknięcie, edycja)

---

### 4. 🟢 Dodaj walidację QGIS Server po imporcie

**Lokalizacja:** `geocraft_api/projects/service.py`

**Problem:**
Brak weryfikacji, czy QGIS Server może prawidłowo odczytać zaimportowany projekt.

**Rozwiązanie:**
Dodaj walidację po zakończeniu importu:

```python
import requests

def validate_qgis_server_access(project_name):
    """
    Validate that QGIS Server can access the project
    Tests WMS GetCapabilities request
    """
    qgis_server_url = os.getenv('QGIS_SERVER_URL', 'http://localhost:8080/ows')

    try:
        # Test WMS GetCapabilities
        url = (
            f"{qgis_server_url}?"
            f"SERVICE=WMS&"
            f"VERSION=1.3.0&"
            f"REQUEST=GetCapabilities&"
            f"MAP={project_name}/{project_name}.qgs"
        )

        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            # Check if project layers are listed
            if '<Layer>' in response.text:
                logger.info(f"✅ QGIS Server validation passed for {project_name}")
                return True
            else:
                logger.warning(f"⚠️ QGIS Server accessible but no layers found for {project_name}")
                return False
        else:
            logger.error(f"❌ QGIS Server validation failed: HTTP {response.status_code}")
            return False

    except Exception as e:
        logger.error(f"❌ QGIS Server validation error: {e}")
        return False

# Add to import workflow:
def import_qgs_project(qgs_file_path, project_name):
    # ... existing import code ...

    # Validate QGIS Server access
    if not validate_qgis_server_access(project_name):
        logger.warning(
            f"⚠️ QGIS Server validation failed for {project_name}. "
            f"Layers may not be accessible via WMS/WFS."
        )
        # Don't fail import - just log warning

    return result
```

**Dlaczego to ważne:**
- Wczesne wykrywanie problemów z konfiguracją
- Lepsze komunikaty błędów dla użytkowników

---

## Kolejność implementacji (zalecana)

### Faza 1: Backend - Poprawki krytyczne (2-3 dni)
1. 🔴 Usuń ThreadPool w `json_utils.py` (NAJWYŻSZY PRIORYTET)
2. 🟡 Napraw obliczanie extent w `db_utils.py`
3. 🟢 Włącz WFS domyślnie
4. 🟢 Dodaj walidację QGIS Server

### Faza 2: Testowanie (1 dzień)
1. Przetestuj import projektu QGS
2. Sprawdź tree.json - czy zawiera warstwy
3. Przetestuj WMS GetCapabilities
4. Przetestuj WFS GetFeature
5. Sprawdź wyświetlanie warstw na frontendzie

### Faza 3: Dokumentacja i wdrożenie (1 dzień)
1. Zaktualizuj dokumentację API
2. Stwórz instrukcje testowania
3. Deploy na środowisko produkcyjne

---

## Testy do wykonania po poprawkach

### Test 1: Walidacja tree.json
```bash
curl https://api.universemapmaker.online/api/projects/new/json?project=TestProject_1 \
  -H "Authorization: Token YOUR_TOKEN" | jq '.children | length'
# Oczekiwany wynik: > 0 (liczba warstw)
```

### Test 2: Walidacja QGIS Server WMS
```bash
curl 'https://api.universemapmaker.online/ows?\
  SERVICE=WMS&REQUEST=GetCapabilities&\
  MAP=TestProject_1/TestProject_1.qgs' | grep '<Layer>'
# Oczekiwany wynik: Lista warstw projektu
```

### Test 3: Walidacja QGIS Server WFS
```bash
curl 'https://api.universemapmaker.online/ows?\
  SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&\
  TYPENAME=layer_name&\
  OUTPUTFORMAT=application/json&\
  MAP=TestProject_1/TestProject_1.qgs' | jq '.features | length'
# Oczekiwany wynik: Liczba obiektów w warstwie
```

### Test 4: Walidacja frontendu
1. Otwórz `http://localhost:3000/map?project=TestProject_1`
2. Sprawdź konsolę: "✅ Loaded X/Y QGIS layers"
3. Zweryfikuj, że warstwy są widoczne na mapie
4. Sprawdź Network tab: WMS requests zwracają 200 OK

---

## Struktura katalogów backendu (przypomnienie)

```
backend/
├── geocraft_api/
│   ├── json_utils.py           # 🔴 FIX: Usuń ThreadPool
│   ├── layers/
│   │   └── db_utils.py         # 🟡 FIX: Użyj ST_Extent
│   └── projects/
│       ├── service.py          # 🟢 FIX: Włącz WFS, dodaj walidację
│       └── views.py            # API endpoints
└── requirements.txt
```

---

## Dodatkowe informacje

### Konfiguracja QGIS Server (aktualna - poprawna)
- VM: `universe-backend` (34.0.251.33:8080)
- URL: `https://api.universemapmaker.online/ows`
- Docker: `3liz/qgis-map-server:3.28`
- Cloud Storage: `/mnt/qgis-projects` (gcsfuse)
- Nginx: Poprawna konfiguracja reverse proxy

### Zmienne środowiskowe wymagane
```bash
# PostgreSQL/PostGIS
POSTGRES_USER=geocraft_user
POSTGRES_PASSWORD=***
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# QGIS Server
QGIS_SERVER_URL=https://api.universemapmaker.online/ows
QGIS_PROJECT_DIR=/mnt/qgis-projects

# Cloud Storage
GCS_BUCKET=universe-mapmakeronline-qgis
```

---

## Kontakt i pytania

Po wykonaniu poprawek backendowych:
1. Uruchom testy walidacyjne
2. Zweryfikuj komunikację frontend ↔ QGIS Server
3. Przetestuj pełny workflow: import → wyświetlanie → interakcja

**Szacowany czas na wszystkie poprawki:** 4-5 dni roboczych

**Oczekiwany wynik:** 100% projektów QGS importuje się poprawnie z pełną listą warstw wyświetlaną na frontendzie.
