# 📚 Dokumentacja Backend API

Kompletna dokumentacja API backendu Universe MapMaker z systematycznym planem integracji.

## 📁 Struktura Dokumentacji

### 1. **BACKEND-ENDPOINTS.md** (16KB)
**Mapa wszystkich 350+ endpointów backendu**
- Kompletna lista endpointów z 8 kategorii
- Status integracji (✅ ⏳ 🔨 ❌ 📝)
- Plan 4-fazowej integracji
- Pytania do wyjaśnienia
- Checklist testowania

**Główne kategorie:**
- Authentication (`/auth/*`) - 4 endpointy
- Dashboard (`/dashboard/*`) - 9 endpointów
- Projects (`/api/projects/*`) - 60+ endpointów
- Layers (`/api/layer/*`) - 65+ endpointów
- Groups (`/api/groups/*`) - 9 endpointów
- Styles (`/api/styles/*`) - do dokumentacji
- Parcels (`/api/parcel/*`) - do dokumentacji
- Admin (`/api/admin/*`) - do dokumentacji

---

### 2. **auth_api_docs.md** (9.5KB)
**Dokumentacja modułu autoryzacji**

**Endpointy:**
- `POST /auth/register` - Rejestracja użytkownika
- `POST /auth/login` - Logowanie
- `POST /auth/logout` - Wylogowanie
- `GET /auth/profile` - Profil użytkownika

**Kluczowe koncepcje:**
- Token authentication (`Token <token>`)
- PostgreSQL user creation (dbLogin, dbPassword)
- Email powitalny
- Transakcje atomowe

**Format tokena:**
```typescript
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

---

### 3. **projects_api_docs.md** (45KB)
**Dokumentacja zarządzania projektami - NAJWAŻNIEJSZA**

**Kluczowe operacje:**

1. **Tworzenie projektu**
   - Tworzy bazę danych PostgreSQL
   - Generuje plik QGS
   - Tworzy strukturę katalogów

2. **Import QGIS**
   - `POST /api/projects/import/qgs/` - Import pliku .qgs
   - `POST /api/projects/import/qgz/` - Import pliku .qgz
   - Proces: Usuwa stary QGS → Zapisuje nowy → Waliduje → Importuje warstwy do PostGIS → Generuje tree.json

3. **Publikacja**
   - `POST /api/projects/publish` - Publikacja projektu
   - Ustawia `published=true/false`
   - Publikuje do GeoServer (WMS/WFS)

4. **Subdomeny**
   - `POST /api/projects/domain/change` - Zmiana subdomeny
   - Walidacja: bez myślników na początku/końcu, tylko litery/cyfry/myślniki
   - Każdy projekt może mieć unikalną subdomenę

5. **Wypis (Polish Land Registry)**
   - Generowanie dokumentów DOCX/PDF
   - Integracja z polskim rejestrem gruntów
   - 7 endpointów: add/documents, add/configuration, get/configuration, etc.

6. **Wyszukiwanie**
   - `GET /api/projects/search` - Full-text search
   - `GET /api/projects/global-search` - Wyszukiwanie cross-project
   - `GET /api/projects/distinct` - Wartości unikalne
   - `GET /api/projects/filter/min-max` - Filtrowanie zakresów

**Struktura projektu:**
```
~/mapmaker/server/qgs/<username>/<project_name>/
├── project.qgs          # Plik QGIS
├── tree.json           # Struktura warstw
├── logo.png            # Logo projektu
├── styles/             # Style QML/SLD
└── documents/          # Dokumenty projektu
```

**60+ endpointów szczegółowo udokumentowanych**

---

### 4. **groups_api_docs.md** (9.8KB)
**Dokumentacja zarządzania grupami warstw**

**Kluczowe operacje:**

1. **Dodawanie grupy**
   - `POST /api/groups/add` - Tworzy grupę w projekcie QGIS
   - Parametry: project, group_name, parent (opcjonalnie)

2. **INSPIRE Groups**
   - `POST /api/groups/inspire/add` - Tworzy grupę zgodną ze standardem INSPIRE (UE)
   - Automatycznie tworzy warstwy:
     - OfficialDocumentation (MultiPolygon)
     - SpatialPlan (MultiPolygon)
     - SuplementaryRegulation (MultiLineString)
     - ZoningElement (MultiPolygon)

3. **Krajowy (Polish National Standard)**
   - `POST /api/groups/krajowy/version/add` - Dodaje wersję aplikacji krajowej
   - `GET /api/groups/krajowy/version/get` - Pobiera historię wersji
   - `POST /api/groups/krajowy/restore` - Przywraca poprzednią wersję
   - Proces:
     1. Eksportuje warstwy do GML
     2. Tworzy kopię zapasową GeoJSON
     3. Zapisuje wersję z datą i godziną
     4. Aktualizuje pole `app_confirmed`

4. **Eksport grupy**
   - `GET /api/groups/export` - Eksportuje grupę do GML/GPKG w ZIP
   - Parametry: project, group, epsg (2180, 3857, etc.)

5. **Zarządzanie**
   - `POST /api/groups/name` - Zmiana nazwy grupy
   - `DELETE /api/groups/layer/remove` - Usuwanie grup i warstw
   - `POST /api/groups/selection` - Ustawianie widoczności

**Format dat:**
- Wyświetlany: `DD/MM/YYYY HH:MM:SS`
- ID wersji: `YYYYMMDDTHHmmss`

---

### 5. **layer_api_docs.md** (60KB) - NAJWIĘKSZY PLIK
**Kompletna dokumentacja operacji na warstwach**

**Kategorie operacji:**

1. **Import warstw**
   - `POST /api/layer/add/shp/` - Import Shapefile (ZIP)
   - `POST /api/layer/add/geojson/` - Import GeoJSON
   - `POST /api/layer/add/gml/` - Import GML
   - `POST /api/layer/add/raster/` - Import raster (TIFF)
   - FormData z plikiem + parametry

2. **Stylowanie**
   - `POST /api/layer/style` - Ustawienie stylu (QML/SLD)
   - `POST /api/layer/style/reset` - Reset do domyślnego
   - `GET /api/layer/style/export` - Eksport stylu
   - `POST /api/layer/transparency` - Przezroczystość
   - `POST /api/layer/opacity/set` - Krycie (0-100)

3. **Operacje na kolumnach**
   - `POST /api/layer/column/add` - Dodaj kolumnę
   - `POST /api/layer/column/rename` - Zmień nazwę
   - `POST /api/layer/column/remove` - Usuń kolumnę
   - `POST /api/layer/columns/remove` - Usuń wiele kolumn
   - `POST /api/layer/column/merge` - Połącz kolumny
   - `POST /api/layer/column/exclude` - Ukryj kolumny

4. **Geometria i PostGIS**
   - `POST /api/layer/geometry/check` - Walidacja geometrii
   - `POST /api/layer/create/intersections` - Przecięcia warstw
   - `POST /api/layer/postgis/rpoints/remove` - Usuwanie powtórzonych punktów
   - `POST /api/layer/postgis/offsetcurve` - Buffer/offset
   - `GET /api/layer/validation/details` - Szczegóły błędów topologii
   - `GET /api/layer/get/gaps` - Znajdź luki w geometrii

5. **Atrybuty i dane**
   - `GET /api/layer/attributes/names` - Nazwy kolumn
   - `GET /api/layer/attributes/names_and_types` - Schemat kolumn
   - `GET /api/layer/column/values` - Wartości unikalne
   - `GET /api/layer/features` - Wszystkie obiekty (GeoJSON)
   - `GET /api/layer/geometry` - Geometria warstwy

6. **Transakcje (edycja obiektów)**
   - `POST /api/layer/transaction/` - Edycja obiektów
   - Format WFS Transaction:
     - Insert - dodaj obiekt
     - Update - edytuj obiekt
     - Delete - usuń obiekt
   - `POST /api/layer/multipleSaving` - Batch editing

7. **Eksport**
   - `GET /api/layer/export` - Eksport warstwy
   - Formaty: SHP, GeoJSON, GML, GPKG
   - Parametry: project, layer, epsg

8. **Zarządzanie**
   - `POST /api/layer/name` - Zmiana nazwy
   - `POST /api/layer/selection` - Widoczność (show/hide)
   - `POST /api/layer/clone` - Klonowanie warstwy
   - `POST /api/layer/scale` - Skala widoczności (min/max)
   - `POST /api/layer/published/set` - Publikacja (public/private)

9. **Raster operations**
   - `POST /api/layer/georefer` - Georeferencja rastra
   - `POST /api/layer/mask` - Maskowanie TIFF

10. **Współpraca (sub-users)**
    - `GET /api/layer/get/layers_subusers` - Warstwy podużytkowników
    - `POST /api/layer/insert_sub_users_to_layer` - Dodaj podużytkowników
    - `DELETE /api/layer/delete_sub_users_from_layer` - Usuń podużytkowników

**65+ endpointów szczegółowo udokumentowanych**

---

### 6. **styles_api_docs.md** (15KB)
**Dokumentacja stylowania i symboli**

**Kluczowe operacje:**
- Zarządzanie stylami warstw
- Definicje symboli (markery, wypełnienia, obramowania)
- Palety kolorów
- Style kategoryzowane i gradowane
- Integracja z QML/SLD

---

## 🎯 Plan Działania - Systematyczna Integracja

### ✅ Faza 0: Podstawy (UKOŃCZONE)
- [x] Autoryzacja (login, register, logout, profile) - ApiClient
- [x] Dashboard - lista projektów (RTK Query)
- [x] Dashboard - projekty publiczne (RTK Query)
- [x] Dashboard - tworzenie projektu (RTK Query)
- [x] Dashboard - usuwanie projektu (RTK Query)
- [x] Dokumentacja API w frontend repo

### 🔨 Faza 1: Import QGIS (W TRAKCIE)
**Cel:** Ukończenie importu plików QGIS

**Endpointy do przetestowania:**
1. `POST /api/projects/import/qgs/` - Import .qgs
2. `POST /api/projects/import/qgz/` - Import .qgz

**Zadania:**
- [ ] Test end-to-end z prawdziwym plikiem .qgs
- [ ] Test end-to-end z prawdziwym plikiem .qgz
- [ ] Weryfikacja automatycznego odświeżania listy projektów
- [ ] Obsługa błędów (nieprawidłowy plik, duplikat nazwy)
- [ ] Wyświetlanie postępu importu
- [ ] Commit i push do GitHub

**Pytania do wyjaśnienia z użytkownikiem:**
- Czy backend zwraca status importu w czasie rzeczywistym?
- Czy istnieje endpoint do sprawdzania postępu importu?
- Jakie błędy mogą wystąpić podczas importu?

---

### ⏳ Faza 2: Zarządzanie Projektem
**Cel:** Kompletne CRUD projektów + publikacja

**Priorytety:**
1. **Edycja projektu**
   - `PUT /dashboard/projects/update/` - Aktualizacja metadanych
   - UI: Modal do edycji nazwy, opisu, kategorii

2. **Szczegóły projektu**
   - `GET /dashboard/projects/<project_name>/` - Pobranie szczegółów
   - UI: Widok szczegółów projektu

3. **Publikacja**
   - `POST /api/projects/publish` - Publikuj/unpublikuj
   - UI: Toggle button w liście projektów

4. **Subdomena**
   - `POST /api/projects/subdomainAvailability` - Sprawdź dostępność
   - `POST /api/projects/domain/change` - Zmień subdomenę
   - UI: Input z walidacją real-time

5. **Eksport**
   - `GET /api/projects/export` - Eksport projektu (QGS/QGZ)
   - UI: Button "Eksportuj projekt"

**Implementacja:**
- RTK Query slice: `projectManagementApi.ts`
- UI komponenty: `EditProjectModal.tsx`, `ProjectDetailsPage.tsx`
- Test każdego endpointu osobno
- Commit po każdym ukończonym endpoincie

**Pytania do wyjaśnienia:**
- Jaki format zwraca `/api/projects/export`? QGS czy QGZ?
- Czy subdomena jest unikalna globalnie czy per użytkownik?
- Czy publikacja projektu wymaga dodatkowych kroków (GeoServer)?

---

### ⏳ Faza 3: Warstwy - Import
**Cel:** Import różnych formatów warstw do projektu

**Priorytety:**
1. **Import Shapefile**
   - `POST /api/layer/add/shp/` - Upload ZIP
   - UI: Drag & drop + file picker

2. **Import GeoJSON**
   - `POST /api/layer/add/geojson/` - Upload JSON
   - UI: Drag & drop + file picker

3. **Import GML**
   - `POST /api/layer/add/gml/` - Upload GML
   - UI: Drag & drop + file picker

4. **Import Raster (TIFF)**
   - `POST /api/layer/add/raster/` - Upload TIFF
   - UI: Drag & drop + file picker

5. **Georeferencja rastra**
   - `POST /api/layer/georefer` - Ustaw projekcję/bounds
   - UI: Modal z mapą do wyboru punktów kontrolnych

**Implementacja:**
- RTK Query slice: `layersApi.ts`
- UI komponenty: `ImportLayerModal.tsx` z tabami dla różnych formatów
- Reużycie wzorca z `CreateProjectDialog.tsx` (taby + file upload)
- Progress bar podczas uploadu

**Pytania do wyjaśnienia:**
- Czy backend zwraca podgląd warstwy przed finalnym importem?
- Jakie są limity rozmiaru plików?
- Czy EPSG jest wykrywane automatycznie?

---

### ⏳ Faza 4: Warstwy - Zarządzanie
**Cel:** Edycja, stylowanie, widoczność warstw

**Priorytety:**
1. **Podstawowe operacje**
   - `POST /api/layer/name` - Zmiana nazwy
   - `POST /api/layer/selection` - Widoczność
   - `POST /api/layer/opacity/set` - Krycie
   - `POST /api/layer/clone` - Klonowanie
   - UI: Kontekstowe menu warstwy

2. **Stylowanie**
   - `POST /api/layer/style` - Zastosuj styl
   - `GET /api/layer/style/export` - Eksport stylu
   - `POST /api/layer/style/reset` - Reset stylu
   - UI: Style editor (może być prosty color picker na początek)

3. **Atrybuty**
   - `GET /api/layer/attributes/names_and_types` - Schemat
   - `GET /api/layer/features` - Pobierz obiekty
   - `GET /api/layer/column/values` - Wartości unikalne
   - UI: Tabela atrybutów

4. **Eksport**
   - `GET /api/layer/export` - Eksport warstwy
   - UI: Dialog z wyborem formatu (SHP, GeoJSON, GML, GPKG)

**Implementacja:**
- Rozbudowa `layersApi.ts`
- UI: `LayerContextMenu.tsx`, `AttributeTable.tsx`, `StyleEditor.tsx`
- Integracja z drzewem warstw w `LeftPanel.tsx`

---

### ⏳ Faza 5: Grupy i INSPIRE
**Cel:** Zarządzanie grupami warstw + standardy UE/PL

**Priorytety:**
1. **Podstawowe grupy**
   - `POST /api/groups/add` - Dodaj grupę
   - `POST /api/groups/name` - Zmień nazwę
   - `DELETE /api/groups/layer/remove` - Usuń grupę
   - `POST /api/groups/selection` - Widoczność
   - UI: Context menu dla grup

2. **INSPIRE (standard UE)**
   - `POST /api/groups/inspire/add` - Dodaj grupę INSPIRE
   - UI: Dialog z wyborem typu grupy INSPIRE
   - Automatyczne tworzenie warstw zgodnych ze standardem

3. **Krajowy (standard PL)**
   - `POST /api/groups/krajowy/version/add` - Dodaj wersję
   - `GET /api/groups/krajowy/version/get` - Historia wersji
   - `POST /api/groups/krajowy/restore` - Przywróć wersję
   - UI: Panel wersji z historią i przyciskiem "Przywróć"

4. **Eksport grupy**
   - `GET /api/groups/export` - Eksport do GML/GPKG
   - UI: Dialog z wyborem EPSG

**Implementacja:**
- RTK Query slice: `groupsApi.ts`
- UI: `AddGroupModal.tsx`, `INSPIREGroupModal.tsx`, `VersionHistoryPanel.tsx`
- Integracja z drzewem warstw

**Pytania do wyjaśnienia:**
- Jakie typy grup INSPIRE są obsługiwane?
- Czy "krajowy" to Plan Zagospodarowania Przestrzennego?
- Jak działa mechanizm wersjonowania (GML snapshots)?

---

### ⏳ Faza 6: Zaawansowane Operacje
**Cel:** PostGIS, transakcje, współpraca

**Priorytety:**
1. **Edycja obiektów (transactions)**
   - `POST /api/layer/transaction/` - WFS Transaction
   - UI: Drawing tools + attribute editor

2. **PostGIS operations**
   - `POST /api/layer/create/intersections` - Przecięcia
   - `POST /api/layer/postgis/offsetcurve` - Buffer
   - `POST /api/layer/geometry/check` - Walidacja
   - UI: GIS tools panel

3. **Kolumny**
   - `POST /api/layer/column/add` - Dodaj kolumnę
   - `POST /api/layer/column/rename` - Zmień nazwę
   - `POST /api/layer/column/remove` - Usuń kolumnę
   - UI: Schema editor

4. **Współpraca (sub-users)**
   - `GET /api/layer/get/layers_subusers` - Warstwy podużytkowników
   - `POST /api/layer/insert_sub_users_to_layer` - Dodaj
   - UI: Share modal

**Implementacja:**
- Rozbudowa `layersApi.ts`
- UI: `TransactionEditor.tsx`, `GISToolsPanel.tsx`, `ShareLayerModal.tsx`

---

### ⏳ Faza 7: Wypis (Polish Land Registry)
**Cel:** Generowanie dokumentów geodezyjnych

**Endpointy:**
- `POST /api/projects/wypis/add/documents` - Dodaj dokumenty
- `POST /api/projects/wypis/add/configuration` - Dodaj konfigurację
- `GET /api/projects/wypis/get/configuration` - Pobierz konfigurację
- `GET /api/projects/wypis/precinct_and_number` - Obręb i numer
- `GET /api/projects/wypis/plotspatialdevelopment` - Plan zagospodarowania
- `POST /api/projects/wypis/create` - Generuj wypis (DOCX/PDF)
- `DELETE /api/projects/wypis/remove` - Usuń wypis

**Implementacja:**
- RTK Query slice: `wypisApi.ts`
- UI: `WypisPanel.tsx` (polska wersja językowa)

**Pytania do wyjaśnienia:**
- Czy wypis jest dostępny tylko dla polskich użytkowników?
- Jakie dane są wymagane do wygenerowania wypisu?
- Czy istnieje dokumentacja formatu DOCX/PDF?

---

### ⏳ Faza 8: Style i Symbole
**Cel:** Zaawansowane stylowanie map

**Endpointy:**
- Do dokumentacji na podstawie `styles_api_docs.md`

**Implementacja:**
- RTK Query slice: `stylesApi.ts`
- UI: Advanced style editor z paletami kolorów

---

### ⏳ Faza 9: Działki (Parcels) i Administracja
**Cel:** Moduły parcels i admin

**Implementacja:**
- RTK Query slice: `parcelsApi.ts`, `adminApi.ts`
- UI: Admin panel, parcels management

---

## 📋 Checklist Dla Każdego Endpointu

### Przed implementacją:
- [ ] Przeczytaj dokumentację endpointu w plikach API docs
- [ ] Sprawdź format request payload (FormData/JSON/Query params)
- [ ] Sprawdź format response (JSON structure)
- [ ] Sprawdź wymagane parametry vs opcjonalne
- [ ] Zidentyfikuj możliwe błędy (400, 403, 404, 500)

### Implementacja:
- [ ] Stwórz RTK Query mutation/query w odpowiednim slice
- [ ] Dodaj TypeScript typy dla request/response
- [ ] Stwórz UI komponent do testowania
- [ ] Zaimplementuj obsługę błędów
- [ ] Dodaj loading state (skeleton/spinner)
- [ ] Dodaj success feedback (snackbar/toast)

### Testowanie:
- [ ] Test z prawidłowymi danymi
- [ ] Test z nieprawidłowymi danymi (błędy walidacji)
- [ ] Test z brakującymi parametrami
- [ ] Test edge cases (duże pliki, długie nazwy, etc.)
- [ ] Sprawdź console errors
- [ ] Sprawdź Network tab (request/response)

### Dokumentacja:
- [ ] Zaktualizuj `BACKEND-ENDPOINTS.md` status (✅)
- [ ] Dodaj komentarze do kodu (JSDoc)
- [ ] Zaktualizuj `CLAUDE.md` jeśli potrzeba
- [ ] Commit z opisowym message: `feat(api): integrate POST /api/...`
- [ ] Push do GitHub

### Komunikacja:
- [ ] Zapytaj użytkownika jeśli zachowanie niejasne
- [ ] Zgłoś problemy z backendem jeśli endpoint nie działa
- [ ] Potwierdź ukończenie endpointu z użytkownikiem

---

## 🔧 Narzędzia i Środowisko

### Backend Infrastructure:
- **VM**: universe-backend (34.0.251.33, europe-central2-a)
- **Database**: Railway PostgreSQL (centerbeam.proxy.rlwy.net:38178) z PostGIS
- **Storage FASE**: Cloud Storage `gs://universe-qgis-projects` → `/mnt/qgis-projects`
- **Django API**: Port 8000 → `https://api.universemapmaker.online/api/*`
- **QGIS Server**: Port 8080 → `https://api.universemapmaker.online/ows`

### Frontend Stack:
- **Next.js 15.5.4** (App Router)
- **Redux Toolkit Query** (data fetching)
- **Material-UI v5** (komponenty)
- **TypeScript** (type safety)

### Development:
- **Local**: `npm run dev` → `http://localhost:3000`
- **Production**: Cloud Run → `https://universemapmaker.online`
- **Git**: Push każdą ukończoną funkcjonalność

### GCP SDK Access:
- `gcloud sql` - Database queries
- `gcloud compute ssh` - VM access dla Storage FASE
- `gcloud run` - Cloud Run deployments
- `gcloud builds` - Cloud Build triggers
- `gcloud logging` - Application logs

---

## 📞 Kontakt z Użytkownikiem

### Kiedy pytać użytkownika:
1. **Zachowanie endpointu niejasne** - Nie zgaduj, zapytaj!
2. **Endpoint zwraca 404/500** - Backend może wymagać poprawki
3. **Format danych nieoczywisty** - Dokumentacja może być niekompletna
4. **Feature wymaga decyzji UX** - Jak powinno wyglądać UI?
5. **Duplikujące się endpointy** - Który użyć? (np. `/api/projects/create/` vs `/dashboard/projects/create/`)

### Format pytania:
```
📝 Pytanie: Endpoint /api/projects/export

1. Jaki format zwraca endpoint? QGS, QGZ czy ZIP?
2. Czy format można wybrać przez parametr?
3. Czy plik jest generowany on-demand czy cached?

Dokumentacja mówi: "Eksport projektu" ale bez szczegółów formatu.
```

---

## 🎯 Aktualne Zadania

### 🔥 TERAZ (Priorytet 1):
1. **Test importu QGIS end-to-end**
   - Przygotuj testowy plik .qgs
   - Test upload przez UI
   - Weryfikacja w bazie danych
   - Automatyczne odświeżanie listy projektów

### ⏭️ NASTĘPNE (Priorytet 2):
1. **Edycja projektu** (`PUT /dashboard/projects/update/`)
2. **Szczegóły projektu** (`GET /dashboard/projects/<name>/`)
3. **Publikacja projektu** (`POST /api/projects/publish`)

### 📅 PLANOWANE (Priorytet 3):
1. Import warstw (Shapefile, GeoJSON, GML)
2. Zarządzanie warstwami (nazwa, widoczność, opacity)
3. Grupy i INSPIRE

---

## 📚 Źródła i Odniesienia

### Backend Code:
- `Universe-Mapmaker-Backend/README.md` - Architektura systemu
- `geocraft_api/projects/service.py` (195KB) - Logika projektów
- `geocraft_api/layers/service.py` (183KB) - Logika warstw
- `geocraft_api/groups/service.py` (144KB) - Logika grup
- `geocraft_api/serializers.py` (77KB) - Request/response formats

### Frontend Code:
- `src/store/api/projectsApi.ts` - RTK Query dla projektów
- `src/lib/api/unified-projects.ts` - Wrapper dla API
- `src/components/dashboard/OwnProjectsRTK.tsx` - UI projektów
- `CLAUDE.md` - Instrukcje developerskie

### Zewnętrzne:
- [Django REST Framework](https://www.django-rest-framework.org/)
- [QGIS Server Documentation](https://docs.qgis.org/latest/en/docs/server_manual/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [OGC WMS/WFS Standards](https://www.ogc.org/standards)
- [INSPIRE Directive](https://inspire.ec.europa.eu/)

---

**Ostatnia aktualizacja:** 2025-10-09
**Wersja:** 1.0
**Autor:** Claude Code + Universe MapMaker Team
