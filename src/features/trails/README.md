# 🚶 Trails Module - Moduł tras turystycznych

Moduł do importowania, wyświetlania i animowania tras turystycznych na mapie.

## 🎯 Funkcjonalności

### ✅ FAZA 1: Podstawowa struktura (GOTOWE)
- [x] FAB "Trasy turystyczne" w prawym panelu
- [x] Modal z wyborem: Import pliku / Rysuj trasę
- [x] Typy TypeScript dla tras
- [x] Struktura folderów
- [x] README dokumentacja

### ✅ FAZA 2: Import plików (GOTOWE)
- [x] Parser KML (Google My Maps) - `kmlParser.ts`
- [x] Parser GeoJSON - `geojsonParser.ts`
- [x] Wyświetlanie trasy na mapie - `TrailLayer.tsx`
- [x] Obsługa błędów importu
- [x] Obliczanie długości i czasu - `trailCalculations.ts`
- [x] File import hook - `useFileImport.ts`
- [x] Redux state management - `trailsSlice.ts`
- [x] localStorage persistence
- [x] Funkcja usuwania trasy

### ⏳ FAZA 3: Timeline & Animacja (TODO)
- [ ] Timeline.tsx (pasek postępu)
- [ ] useTrailAnimation.ts (animacja kamery)
- [ ] Play/Pause/Speed kontrola
- [ ] Smooth camera movement

### ⏳ FAZA 4: Sidebar & Info (TODO)
- [ ] Sidebar.tsx (panel boczny)
- [ ] Trail Info (nazwa, długość, czas)
- [ ] Elevation Profile (wykres wysokościowy)

### ⏳ FAZA 5: Manual Drawing (TODO)
- [ ] Mapbox Drawing Mode
- [ ] Save drawn trail → GeoJSON
- [ ] Apply Timeline + Sidebar

---

## 📁 Struktura folderów

```
src/features/trails/
├── components/
│   ├── TrailsModal.tsx          # ✅ Modal wyboru (Import/Rysuj) + info o aktywnej trasie
│   ├── TrailLayer.tsx           # ✅ Warstwa trasy na mapie (Mapbox GL JS)
│   ├── Timeline.tsx             # ⏳ Pasek postępu (FAZA 3)
│   └── Sidebar.tsx              # ⏳ Panel informacji (FAZA 4)
├── hooks/
│   ├── useFileImport.ts         # ✅ Import plików (KML/GeoJSON)
│   ├── useTrailAnimation.ts     # ⏳ Animacja kamery (FAZA 3)
│   └── useTrailProgress.ts      # ⏳ Obliczanie pozycji (FAZA 3)
├── utils/
│   ├── geojsonParser.ts         # ✅ Parse GeoJSON (walidacja + konwersja)
│   ├── kmlParser.ts             # ✅ Parse KML (DOMParser + toGeoJSON)
│   └── trailCalculations.ts    # ✅ Długość, czas, dystans (turf.js)
├── types/
│   └── index.ts                 # ✅ Typy TypeScript (Trail, TrailFeature, etc.)
├── index.ts                     # ✅ Barrel export
└── README.md                    # ✅ Dokumentacja
```

**Redux state:**
- `src/redux/slices/trailsSlice.ts` - ✅ State management z localStorage sync

**Integracja:**
- `src/features/mapa/komponenty/MapContainer.tsx` - ✅ Renderowanie TrailLayer
- `src/features/narzedzia/RightFABToolbar.tsx` - ✅ FAB "Trasy turystyczne"
- `src/redux/store.ts` - ✅ trailsReducer

---

## 🚀 Użycie

### Otwarcie modalu tras

FAB "Trasy turystyczne" znajduje się w prawym panelu mapy (po FAB "Wyszukiwanie").

**Kliknięcie FAB** → Otwiera modal z dwoma opcjami:
1. **📁 Importuj plik** - Wgraj KML/GeoJSON z Google My Maps, Garmin, Strava
2. **✏️ Narysuj trasę** - Ręcznie narysuj trasę na mapie (FAZA 5)

### Import pliku (FAZA 2 - GOTOWE ✅)

```typescript
// 1. User wybiera plik .kml lub .geojson
// 2. Parser przetwarza plik → TrailFeature
// 3. Trasa wyświetlana na mapie (Mapbox layer)
// 4. Trasa zapisana w Redux + localStorage
// 5. Modal pokazuje info o aktywnej trasie
```

**Obsługiwane formaty:**
- ✅ KML (Google My Maps, Garmin)
- ✅ GeoJSON (FeatureCollection, Feature, direct LineString)

**Automatyczne obliczenia:**
- 📏 Długość trasy (metry, km)
- ⏱️ Czas trasy (minuty, bazując na 5 km/h + przewyższenia)
- 🧭 Kierunek trasy (bearing)

### Usuwanie trasy (FAZA 2 - GOTOWE ✅)

```typescript
// 1. Otwórz modal "Trasy turystyczne"
// 2. Jeśli trasa jest aktywna → pokazuje się sekcja z info
// 3. Kliknij "🗑️ Usuń trasę"
// 4. Potwierdź usunięcie
// 5. Trasa znika z mapy + localStorage
```

### Ręczne rysowanie (FAZA 5 - TODO)

```typescript
// TODO: Implementacja w FAZIE 5
// 1. User klika "Narysuj trasę"
// 2. Modal się zamyka
// 3. Mapbox Drawing Mode włącza się
// 4. User rysuje LineString
// 5. Save → Convert to TrailFeature
// 6. Timeline + Sidebar pokazują informacje
```

---

## 📦 Typy TypeScript

### TrailFeature
```typescript
interface TrailFeature extends Feature<LineString> {
  properties: {
    name: string;
    description?: string;
    distance?: number; // metry
    duration?: number; // minuty
    elevationGain?: number;
    elevationLoss?: number;
    difficulty?: 'easy' | 'moderate' | 'hard';
    color?: string; // hex color
  };
}
```

### Trail
```typescript
interface Trail {
  id: string;
  feature: TrailFeature;
  metadata: {
    createdAt: string; // ISO string (for Redux serialization)
    source: 'upload' | 'manual' | 'import';
    fileName?: string;
    fileType?: 'kml' | 'geojson' | 'gpx';
  };
}
```

### TrailAnimationState
```typescript
interface TrailAnimationState {
  isPlaying: boolean;
  progress: number; // 0-1 (0% - 100%)
  speed: number; // 0.5x, 1x, 2x, 5x
  currentPoint: [number, number] | null; // [lng, lat]
  currentBearing: number; // stopnie (0-360)
  currentDistance: number; // metry od początku
  totalDistance: number; // całkowita długość
}
```

---

## 🎨 Inspiracja: Wałbrzych Trails Project

Moduł bazuje na projekcie tras turystycznych Wałbrzycha:
- ✅ Timeline z suwakiem postępu (FAZA 3)
- ✅ Animacja kamery wzdłuż trasy (FAZA 3)
- ✅ Sidebar z informacjami (nazwa, długość, czas) (FAZA 4)
- ✅ Elevation Profile (wykres wysokościowy) (FAZA 4)

**Różnice:**
- ❌ Brak hardcoded tras (user wgrywa własne)
- ❌ Brak POI (tylko trasa)
- ✅ Obsługa wielu formatów plików (KML, GeoJSON, GPX)
- ✅ Ręczne rysowanie tras (FAZA 5)
- ✅ localStorage persistence (trasy zachowane między sesjami)

---

## 🔧 Technologie

### Biblioteki:
- **Mapbox GL JS** - wyświetlanie mapy i tras
- **@turf/turf** - obliczenia geograficzne (długość, bearing, interpolacja)
- **@mapbox/togeojson** - KML → GeoJSON converter
- **Redux Toolkit** - state management
- **DOMParser** - parsing XML (KML) w przeglądarce

### Frontend-only:
- ✅ Zero backend API calls
- ✅ localStorage dla persistence
- ✅ Browser File API dla upload
- ✅ Wszystkie obliczenia w przeglądarce

---

## 📝 Notatki deweloperskie

### FAB pozycja:
- Po FAB "Wyszukiwanie" (czerwony, primary color)
- Przed FAB "Identyfikacja obiektu" (biały, default color)

### Dostęp:
- `authRequired: false` - **goście mogą importować trasy**
- Nie wymaga logowania ani projektu

### Modal:
- Material-UI Dialog
- Dwie opcje: Import vs Rysuj
- Hidden file input dla uploadu
- Pokazuje aktywną trasę (nazwa, długość, czas, źródło)
- Przycisk "Usuń trasę" (error color)

### Redux serialization:
- `createdAt` zapisany jako ISO string (nie Date object)
- Wszystkie dane w state są JSON-serializowalne
- localStorage sync w middleware

### Mapbox rendering:
- TrailLayer dodaje source + layer do mapy
- Auto-fit bounds na trasę (padding: 50px, maxZoom: 14)
- Cleanup na unmount (removeLayer + removeSource)

---

## 🐛 Rozwiązane problemy

### 1. localStorage SSR error
**Problem:** `localStorage is not defined` podczas server-side rendering
**Rozwiązanie:** Check `typeof window === 'undefined'` w `loadFromLocalStorage()`

### 2. Redux non-serializable value
**Problem:** `Date` object w state → warning o non-serializable value
**Rozwiązanie:** Zmiana `createdAt: Date` → `createdAt: string` (ISO format)

### 3. Duplicate bgcolor property
**Problem:** TypeScript warning o duplikacie `bgcolor` w TrailsModal
**Rozwiązanie:** Usunięcie `bgcolor: 'success.light'`, zostawienie tylko theme function

---

## 🚀 Następne kroki (FAZA 3)

### Timeline component:
1. Implementacja `Timeline.tsx` (pasek postępu)
2. Play/Pause/Speed kontrola (0.5x, 1x, 2x, 5x)
3. Progress slider (seek to position)
4. useTrailAnimation hook (camera following trail)
5. Smooth camera movement (bearing + pitch)

### Technologie FAZA 3:
- Mapbox `easeTo()` / `flyTo()` dla animacji kamery
- turf.js `along()` dla interpolacji punktów
- RAF (requestAnimationFrame) dla smooth animation

---

**Data utworzenia:** 2025-01-18
**Data aktualizacji:** 2025-11-19
**Branch:** `ola/fab-trasa`
**Status:** FAZA 1 ✅ | FAZA 2 ✅ (z funkcją usuwania)
**Commits:** `7b0c9fe` (FAZA 1), `69223b3` (FAZA 2), `c2cce3d` (usuwanie), `3a8fb4c` (fix serialization)
