# ❓ FAQ - Odpowiedzi na Pytania z Dokumentacji

**Data:** 2025-10-09
**Źródło:** Odpowiedzi od użytkownika podczas konsolidacji dokumentacji

---

## 🗺️ Projekcje i Konwersje

### Q: Jaki EPSG jest używany w projektach?
**A:** Wszystkie projekcje są konwertowane przez GDAL do **EPSG:3857** (Web Mercator).

**Szczegóły:**
- Backend automatycznie konwertuje wszystkie warstwy do EPSG:3857
- GDAL obsługuje konwersję między projekcjami
- Frontend (Mapbox) używa EPSG:3857 natywnie
- Oryginalna projekcja zachowana w metadanych warstwy

**Import przykład:**
```
Plik wejściowy: EPSG:2180 (Poland CS92)
       ↓ GDAL konwersja
PostGIS storage: EPSG:3857 (Web Mercator)
       ↓
Mapbox display: EPSG:3857
```

---

## 🌐 Domeny i Subdomeny

### Q: Czy subdomena jest unikalna globalnie czy per użytkownik?
**A:** Każdy projekt ma **indywidualną subdomenę** w formacie: `{prefix}.universemapmaker.online`

**Szczegóły:**
- Prefix domeny podawany przy tworzeniu projektu
- Format: `*.universemapmaker.online`
- Przykłady:
  - `moj-projekt.universemapmaker.online`
  - `plan-zagospodarowania.universemapmaker.online`
  - `ogrodzenie-csip.universemapmaker.online`

**Walidacja prefix:**
- Bez myślników na początku/końcu
- Tylko litery, cyfry, myślniki
- Unikalna globalnie (nie per użytkownik)

**Endpoint:**
```
POST /api/projects/domain/change
{
  "project": "moj_projekt",
  "subdomain": "moj-projekt"  // → moj-projekt.universemapmaker.online
}
```

---

## 📡 Endpointy API - Różnice

### Q: Czy `/api/projects/create/` różni się od `/dashboard/projects/create/`?
**A:** **TAK** - to różne endpointy, ale backend zazwyczaj korzysta z **krótszej formy**.

**Do potwierdzenia (teza):**
- Backend preferuje: `/dashboard/projects/create/` ✅
- `/api/projects/create/` może być starszą wersją lub aliasem

**Rekomendacja:**
- Używaj `/dashboard/projects/create/` jako primary endpoint
- Sprawdź dokumentację backend dla pewności
- Możliwe że `/api/projects/create/` to duplicate routing

**Akcja TODO:**
- [ ] Sprawdzić `geocraft_api/projects/urls.py` dla routing patterns
- [ ] Zweryfikować które endpoint faktycznie używa backend
- [ ] Zaktualizować `unified-projects.ts` jeśli potrzeba

---

## 🖼️ Preview i Podgląd

### Q: Czy backend zwraca preview warstwy przed importem?
**A:** **NIE** - obecnie backend nie zwraca preview, ale **mógłby w przyszłości**.

**Obecna implementacja:**
```typescript
// Import bez preview
POST /api/layer/add/shp/
FormData: { project, shp (ZIP file) }
Response: { status: "success", layer_id: 123 }
```

**Możliwość przyszłej implementacji:**
```typescript
// Feature request: Preview endpoint
POST /api/layer/preview/
FormData: { file }
Response: {
  preview: {
    feature_count: 150,
    bounds: [minLng, minLat, maxLng, maxLat],
    sample_features: [...],  // First 5 features
    attributes: ["id", "name", "type"],
    geometry_type: "Polygon"
  }
}
```

**UI Flow (przyszłość):**
1. User wybiera plik → Upload do `/api/layer/preview/`
2. Backend zwraca metadane i sample
3. User widzi preview na mapie
4. User potwierdza → Final import do `/api/layer/add/shp/`

---

## 📋 Pozostałe Pytania - Do Wyjaśnienia w Przyszłości

Poniższe pytania pozostają otwarte i mogą być wyjaśnione w miarę potrzeb podczas implementacji:

### Projekty:
- ❓ **Q:** Jaki format zwraca `/api/projects/export`? (QGS, QGZ, ZIP?)
- ❓ **Q:** Czy publikacja projektu wymaga dodatkowych kroków (GeoServer config)?
- ❓ **Q:** Jak działa mechanizm backup/restore?

### Warstwy:
- ❓ **Q:** Jakie są limity rozmiaru plików przy imporcie?
- ❓ **Q:** Czy można importować warstwy z zewnętrznych WMS/WFS?
- ❓ **Q:** Jak działają sub-users permissions?

### Grupy:
- ❓ **Q:** Czy "krajowy" to Plan Zagospodarowania Przestrzennego (PL)?
- ❓ **Q:** Jak działa mechanizm wersjonowania (GML snapshots)?
- ❓ **Q:** Jakie typy grup INSPIRE są obsługiwane?

### Wypis:
- ❓ **Q:** Czy wypis jest dostępny tylko dla polskich użytkowników?
- ❓ **Q:** Jakie dane są wymagane do wygenerowania wypisu?
- ❓ **Q:** Format wyjściowy DOCX vs PDF - różnice?

---

## 📝 Notki Implementacyjne

### EPSG Conversion (GDAL)
**Techniczne szczegóły konwersji:**
```python
# Backend (Django/GDAL)
from osgeo import gdal, osr

# Read input layer
source = ogr.Open(input_file)
source_layer = source.GetLayer()
source_srs = source_layer.GetSpatialRef()

# Target projection (Web Mercator)
target_srs = osr.SpatialReference()
target_srs.ImportFromEPSG(3857)

# Transform
transform = osr.CoordinateTransformation(source_srs, target_srs)
# ... transform geometries
```

**Zachowanie metadanych:**
- Oryginalna projekcja zapisywana w metadanych
- Możliwość późniejszej konwersji do oryginalnego EPSG
- Export może zwrócić oryginalne EPSG (jeśli zapisane)

### Subdomain Routing
**Nginx config (backend VM):**
```nginx
# Wildcard subdomain routing
server {
    server_name *.universemapmaker.online;

    location / {
        # Extract subdomain
        if ($host ~* "^(.+)\.universemapmaker\.online$") {
            set $subdomain $1;
        }

        # Proxy to Django with subdomain header
        proxy_pass http://django:8000;
        proxy_set_header X-Subdomain $subdomain;
    }
}
```

**Django routing:**
```python
# geocraft_api/middleware.py
class SubdomainMiddleware:
    def __call__(self, request):
        subdomain = request.META.get('HTTP_X_SUBDOMAIN')
        if subdomain:
            request.subdomain = subdomain
            # Fetch project by subdomain
            project = Project.objects.get(subdomain=subdomain)
            request.project = project
```

---

## 🔄 Aktualizacje FAQ

**Jak dodać nową odpowiedź:**
1. Znajdź pytanie w dokumentacji (np. `README.md`)
2. Dodaj sekcję do tego pliku z odpowiedzią
3. Zaktualizuj główną dokumentację jeśli potrzeba
4. Commit z message: `docs: Update FAQ with answer to [pytanie]`

**Format odpowiedzi:**
```markdown
### Q: Pytanie?
**A:** Krótka odpowiedź (TAK/NIE/Szczegóły).

**Szczegóły:**
- Punkt 1
- Punkt 2

**Przykład:**
```code```
```

---

**Ostatnia aktualizacja:** 2025-10-09
**Autor:** Universe MapMaker Team + Claude Code
**Źródło odpowiedzi:** Rozmowa z użytkownikiem podczas sesji dokumentacji
