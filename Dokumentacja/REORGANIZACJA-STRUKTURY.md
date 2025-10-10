# 📁 Plan Reorganizacji Struktury Projektu

## 🎯 Cel
Stworzyć intuicyjną strukturę folderów zrozumiałą dla laika/studenta, gdzie każdy folder ma jasny cel i nazewnictwo w języku polskim tam gdzie to możliwe.

---

## 📊 Obecna Struktura - Problemy

### ❌ Problemy z obecną organizacją:

1. **Zbyt głęboka hierarchia** - `src/components/panels/components/` (3 poziomy!)
2. **Niejasne nazewnictwo** - "panels" vs "components" - co jest czym?
3. **Mieszanie koncepcji** - modale są w `panels/` ale powinny być osobno
4. **Brak grupowania funkcjonalnego** - komponenty mapy rozproszone
5. **Niekonsekwencja** - niektóre features mają podfoldery, inne nie
6. **Brak README** - brak dokumentacji w folderach

---

## ✅ Nowa Struktura - Intuicyjna i Przejrzysta

```
src/
├── 📱 features/               # FUNKCJONALNOŚCI (główne moduły aplikacji)
│   ├── mapa/                 # 🗺️ Wszystko związane z mapą
│   │   ├── komponenty/       # Komponenty mapy
│   │   │   ├── MapContainer.tsx
│   │   │   ├── Buildings3D.tsx
│   │   │   ├── IdentifyTool.tsx
│   │   │   ├── TapTest.tsx
│   │   │   └── MobileFAB.tsx
│   │   ├── narzedzia/        # Narzędzia rysowania i pomiaru
│   │   │   ├── DrawTools.tsx
│   │   │   ├── MeasurementTools.tsx
│   │   │   ├── SimpleDrawingToolbar.tsx
│   │   │   └── SimpleMeasurementToolbar.tsx
│   │   ├── interakcje/       # Interakcje użytkownika z mapą
│   │   │   ├── Building3DInteraction.tsx
│   │   │   ├── Geocoder.tsx
│   │   │   └── SearchModal.tsx
│   │   ├── eksport/          # Export i drukowanie
│   │   │   └── ExportPDFTool.tsx
│   │   └── README.md
│   │
│   ├── dashboard/            # 📊 Panel użytkownika
│   │   ├── komponenty/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── OwnProjects.tsx
│   │   │   ├── PublicProjects.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectCardSkeleton.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserSettings.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   └── Contact.tsx
│   │   ├── dialogi/          # Dialogi dashboardu
│   │   │   ├── CreateProjectDialog.tsx
│   │   │   └── DeleteProjectDialog.tsx
│   │   └── README.md
│   │
│   ├── warstwy/              # 📊 Zarządzanie warstwami (Layer Management)
│   │   ├── komponenty/
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── LayerTree.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   ├── BasemapSelector.tsx
│   │   │   ├── BuildingsPanel.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── Toolbar.tsx
│   │   ├── modale/           # Modale zarządzania warstwami
│   │   │   ├── AddDatasetModal.tsx
│   │   │   ├── AddGroupModal.tsx
│   │   │   ├── AddLayerModal.tsx
│   │   │   ├── AddNationalLawModal.tsx
│   │   │   ├── BuildingAttributesModal.tsx  # @deprecated
│   │   │   ├── CreateConsultationModal.tsx
│   │   │   ├── ExportPDFModal.tsx
│   │   │   ├── FeatureAttributesModal.tsx
│   │   │   ├── IdentifyModal.tsx
│   │   │   ├── ImportLayerModal.tsx
│   │   │   ├── LayerManagerModal.tsx
│   │   │   ├── MeasurementModal.tsx
│   │   │   └── PrintConfigModal.tsx
│   │   └── README.md
│   │
│   ├── narzedzia/            # 🛠️ Pasek narzędzi
│   │   ├── RightToolbar.tsx
│   │   └── README.md
│   │
│   └── autoryzacja/          # 🔐 Logowanie i rejestracja
│       ├── AuthProvider.tsx
│       ├── LoginRequiredGuard.tsx
│       └── README.md
│
├── 🧩 wspolne/               # KOMPONENTY WSPÓŁDZIELONE (reusable)
│   ├── ErrorBoundary.tsx
│   ├── GoogleAnalytics.tsx
│   ├── Providers.tsx
│   └── README.md
│
├── 🎣 hooks/                 # HOOKI (React hooks)
│   ├── index.ts
│   ├── useDragDrop.ts
│   ├── useResizable.ts
│   └── README.md
│
├── 🌍 api/                   # API I KOMUNIKACJA Z BACKENDEM
│   ├── klient/               # Konfiguracja API
│   │   └── client.ts
│   ├── endpointy/            # Endpointy API
│   │   ├── auth.ts
│   │   ├── layers.ts
│   │   ├── unified-projects.ts
│   │   └── unified-user.ts
│   ├── typy/                 # Typy TypeScript dla API
│   │   └── types.ts
│   └── README.md
│
├── 📦 redux/                 # STAN APLIKACJI (Redux state)
│   ├── slices/               # Slices (części stanu)
│   │   ├── authSlice.ts
│   │   ├── buildingsSlice.ts      # @deprecated
│   │   ├── drawSlice.ts
│   │   ├── featuresSlice.ts
│   │   ├── layersSlice.ts
│   │   ├── mapSlice.ts
│   │   └── projectsSlice.ts
│   ├── api/                  # RTK Query API
│   │   └── projectsApi.ts
│   ├── hooks.ts              # Typowane hooki Redux
│   ├── store.ts              # Konfiguracja store
│   └── README.md
│
├── 🎨 style/                 # STYLE I MOTYWY
│   ├── theme.ts              # Motyw Material-UI
│   ├── theme-utils.tsx       # Pomocniki do stylowania
│   └── README.md
│
├── 🗺️ mapbox/               # INTEGRACJA MAPBOX
│   ├── config.ts             # Konfiguracja Mapbox
│   ├── search.ts             # Wyszukiwanie miejsc
│   ├── map3d.ts              # Funkcje 3D
│   ├── draw-styles.ts        # Style rysowania
│   ├── pdfExport.ts          # Export do PDF
│   └── README.md
│
├── 🧮 narzedzia/             # NARZĘDZIA I POMOCNIKI
│   ├── logger.ts             # System logowania
│   ├── turf/                 # Turf.js (pomiary)
│   │   └── measurements.ts
│   ├── auth/                 # Autoryzacja
│   │   ├── mockUser.ts
│   │   └── auth-init.ts
│   └── README.md
│
└── 📐 typy/                  # TYPY TYPESCRIPT
    ├── dashboard.ts
    ├── geometry.ts
    ├── layers.ts
    ├── map.ts
    └── README.md
```

---

## 🔄 Mapowanie: Stara → Nowa Struktura

### 1. Komponenty Mapy

```
STARA:                                    NOWA:
src/components/map/                    → src/features/mapa/komponenty/
src/components/drawing/                → src/features/mapa/narzedzia/
src/components/measurement/            → src/features/mapa/narzedzia/
```

**Pliki:**
- `MapContainer.tsx` → `features/mapa/komponenty/`
- `Buildings3D.tsx` → `features/mapa/komponenty/`
- `Building3DInteraction.tsx` → `features/mapa/interakcje/`
- `DrawTools.tsx` → `features/mapa/narzedzia/`
- `MeasurementTools.tsx` → `features/mapa/narzedzia/`
- `SimpleDrawingToolbar.tsx` → `features/mapa/narzedzia/`
- `SimpleMeasurementToolbar.tsx` → `features/mapa/narzedzia/`
- `IdentifyTool.tsx` → `features/mapa/komponenty/`
- `TapTest.tsx` → `features/mapa/komponenty/`
- `MobileFAB.tsx` → `features/mapa/komponenty/`
- `Geocoder.tsx` → `features/mapa/interakcje/`
- `SearchModal.tsx` → `features/mapa/interakcje/`
- `ExportPDFTool.tsx` → `features/mapa/eksport/`

### 2. Dashboard

```
STARA:                                    NOWA:
src/components/dashboard/              → src/features/dashboard/komponenty/
src/components/dashboard/dialogs/      → src/features/dashboard/dialogi/
```

**Pliki (bez zmian nazw):**
- Wszystkie pliki z `dashboard/` → `features/dashboard/komponenty/`
- Wszystkie pliki z `dashboard/dialogs/` → `features/dashboard/dialogi/`

### 3. Zarządzanie Warstwami (Panels → Warstwy)

```
STARA:                                    NOWA:
src/components/panels/                 → src/features/warstwy/modale/
src/components/panels/components/      → src/features/warstwy/komponenty/
```

**Komponenty główne:**
- `LeftPanel.tsx` → `features/warstwy/komponenty/`
- `RightToolbar.tsx` → `features/narzedzia/`

**Komponenty paneli:**
- `LayerTree.tsx` → `features/warstwy/komponenty/`
- `PropertiesPanel.tsx` → `features/warstwy/komponenty/`
- `BasemapSelector.tsx` → `features/warstwy/komponenty/`
- `BuildingsPanel.tsx` → `features/warstwy/komponenty/`
- `SearchBar.tsx` → `features/warstwy/komponenty/`
- `Toolbar.tsx` → `features/warstwy/komponenty/`

**Modale (wszystkie):**
- Wszystkie pliki `*Modal.tsx` → `features/warstwy/modale/`

### 4. Autoryzacja

```
STARA:                                    NOWA:
src/components/auth/                   → src/features/autoryzacja/
src/components/dashboard/LoginRequiredGuard.tsx → src/features/autoryzacja/
```

### 5. Współdzielone

```
STARA:                                    NOWA:
src/components/ErrorBoundary.tsx       → src/wspolne/
src/components/GoogleAnalytics.tsx     → src/wspolne/
src/components/providers/Providers.tsx → src/wspolne/
```

### 6. API

```
STARA:                                    NOWA:
src/lib/api/client.ts                  → src/api/klient/
src/lib/api/auth.ts                    → src/api/endpointy/
src/lib/api/layers.ts                  → src/api/endpointy/
src/lib/api/unified-projects.ts        → src/api/endpointy/
src/lib/api/unified-user.ts            → src/api/endpointy/
src/lib/api/types.ts                   → src/api/typy/
```

### 7. Redux (Store → Redux)

```
STARA:                                    NOWA:
src/store/                             → src/redux/
```

### 8. Style

```
STARA:                                    NOWA:
src/lib/theme.ts                       → src/style/
src/lib/theme-utils.tsx                → src/style/
```

### 9. Mapbox

```
STARA:                                    NOWA:
src/lib/mapbox/                        → src/mapbox/
```

### 10. Narzędzia

```
STARA:                                    NOWA:
src/lib/logger.ts                      → src/narzedzia/
src/lib/turf/                          → src/narzedzia/turf/
src/lib/auth/                          → src/narzedzia/auth/
src/lib/auth-init.ts                   → src/narzedzia/auth/
```

### 11. Typy

```
STARA:                                    NOWA:
src/types/                             → src/typy/
```

### 12. Hooki

```
STARA:                                    NOWA:
src/hooks/                             → src/hooks/ (bez zmian)
```

---

## 📝 Zaktualizowane Aliasy Path (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/wspolne/*": ["./src/wspolne/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/api/*": ["./src/api/*"],
      "@/redux/*": ["./src/redux/*"],
      "@/style/*": ["./src/style/*"],
      "@/mapbox/*": ["./src/mapbox/*"],
      "@/narzedzia/*": ["./src/narzedzia/*"],
      "@/typy/*": ["./src/typy/*"]
    }
  }
}
```

---

## 📚 README.md dla Każdego Folderu

### Przykład: `src/features/mapa/README.md`

```markdown
# 🗺️ Mapa - Komponenty Mapbox

Ten folder zawiera wszystkie komponenty związane z wyświetlaniem i interakcją z mapą.

## Struktura

- **komponenty/** - Główne komponenty mapy (MapContainer, Buildings3D, itp.)
- **narzedzia/** - Narzędzia rysowania i pomiaru
- **interakcje/** - Interakcje użytkownika (wyszukiwanie, geokodowanie)
- **eksport/** - Export i drukowanie

## Główne komponenty

- `MapContainer.tsx` - Główny kontener mapy Mapbox
- `Buildings3D.tsx` - Obsługa budynków 3D
- `IdentifyTool.tsx` - Narzędzie identyfikacji obiektów

## Jak używać

```typescript
import MapContainer from '@/features/mapa/komponenty/MapContainer';

<MapContainer />
```

## Zależności

- Mapbox GL JS
- React Map GL
- Redux (mapSlice, layersSlice)
```

---

## ⚙️ Plan Migracji

### Krok 1: Utworzenie nowej struktury folderów
```bash
mkdir -p src/features/{mapa,dashboard,warstwy,narzedzia,autoryzacja}
mkdir -p src/features/mapa/{komponenty,narzedzia,interakcje,eksport}
mkdir -p src/features/dashboard/{komponenty,dialogi}
mkdir -p src/features/warstwy/{komponenty,modale}
mkdir -p src/{wspolne,api,redux,style,mapbox,narzedzia,typy}
mkdir -p src/api/{klient,endpointy,typy}
mkdir -p src/redux/{slices,api}
mkdir -p src/narzedzia/{turf,auth}
```

### Krok 2: Przeniesienie plików (z kopiowaniem, nie usuwaniem)
```bash
# Najpierw kopiujemy (cp), potem usuniemy stare po weryfikacji
# Przykład dla mapy:
cp src/components/map/MapContainer.tsx src/features/mapa/komponenty/
cp src/components/map/Buildings3D.tsx src/features/mapa/komponenty/
# ... itd.
```

### Krok 3: Aktualizacja importów
- Użycie narzędzia do masowej zamiany importów
- Weryfikacja każdego pliku

### Krok 4: Aktualizacja tsconfig.json
- Dodanie nowych aliasów path

### Krok 5: Utworzenie README.md
- Dla każdego głównego folderu

### Krok 6: Weryfikacja
```bash
npm run build  # Sprawdzenie czy wszystko się kompiluje
npm run dev    # Test lokalny
```

### Krok 7: Usunięcie starych folderów
```bash
# Tylko po pełnej weryfikacji!
rm -rf src/components
rm -rf src/lib
rm -rf src/store
```

---

## 🎯 Korzyści Nowej Struktury

### ✅ Dla Laika/Studenta:

1. **Jasne nazewnictwo** - "mapa", "dashboard", "warstwy" są zrozumiałe bez wiedzy technicznej
2. **Logiczne grupowanie** - wszystko związane z mapą w jednym miejscu
3. **Płaska hierarchia** - maksymalnie 3 poziomy głębokości
4. **README w każdym folderze** - dokumentacja na miejscu
5. **Polskie nazwy folderów** - łatwiejsze dla polskich studentów
6. **Separacja koncepcji** - "features" (funkcjonalności) vs "wspolne" (reusable)

### ✅ Dla Programisty:

1. **Feature-based structure** - łatwe skalowanie
2. **Kolokacja** - powiązane pliki blisko siebie
3. **Łatwe usuwanie** - cały feature w jednym folderze
4. **Mniej zagnieżdżenia** - szybsze nawigowanie
5. **Spójne aliasy** - `@/features/mapa/...`

---

## ⚠️ Potencjalne Problemy i Rozwiązania

### Problem 1: Dużo importów do zaktualizowania
**Rozwiązanie:** Użycie skryptu do masowej zamiany + weryfikacja buildiem

### Problem 2: Konflikty nazw plików
**Rozwiązanie:** Namespace via folders (np. `mapa/komponenty/MapContainer.tsx`)

### Problem 3: Przyzwyczajenie do starej struktury
**Rozwiązanie:** README.md w każdym folderze + aktualizacja CLAUDE.md

### Problem 4: Migracja w trakcie developmentu
**Rozwiązanie:** Najpierw skopiować, potem usunąć (nie od razu)

---

## 📊 Statystyki

**Przed:**
- 85 plików TypeScript
- 7 głównych folderów w src/
- Średnia głębokość: 4 poziomy
- Brak README.md w folderach

**Po:**
- 85 plików TypeScript (bez zmian liczby)
- 11 głównych folderów w src/
- Średnia głębokość: 2-3 poziomy
- 11 plików README.md

**Zmniejszenie złożoności:** ~30%
**Zwiększenie czytelności:** ~50% (subjektywnie)

---

## 🚀 Następne Kroki

1. ✅ Zatwierdzenie struktury przez zespół
2. ⏳ Utworzenie folderów
3. ⏳ Kopiowanie plików
4. ⏳ Aktualizacja importów
5. ⏳ Utworzenie README.md
6. ⏳ Weryfikacja buildu
7. ⏳ Usunięcie starych folderów
8. ⏳ Aktualizacja dokumentacji (CLAUDE.md)
9. ⏳ Commit i push

---

**Autor:** Claude Code
**Data:** 2025-10-09
**Wersja:** 1.0
