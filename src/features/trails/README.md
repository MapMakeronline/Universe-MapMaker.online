# 🚶 Trails Module - Moduł tras turystycznych

Moduł do importowania, wyświetlania i animowania tras turystycznych na mapie.

## 🎯 Funkcjonalności

### ✅ FAZA 1: Podstawowa struktura (GOTOWE)
- [x] FAB "Trasy turystyczne" w prawym panelu
- [x] Modal z wyborem: Import pliku / Rysuj trasę
- [x] Typy TypeScript dla tras
- [x] Struktura folderów

### ⏳ FAZA 2: Import plików (TODO)
- [ ] Parser KML (Google My Maps)
- [ ] Parser GeoJSON
- [ ] Wyświetlanie trasy na mapie
- [ ] Obsługa błędów importu

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
│   ├── TrailsModal.tsx          # ✅ Modal wyboru (Import/Rysuj)
│   ├── Timeline.tsx             # ⏳ Pasek postępu (FAZA 3)
│   ├── Sidebar.tsx              # ⏳ Panel informacji (FAZA 4)
│   └── TrailLayer.tsx           # ⏳ Warstwa trasy na mapie (FAZA 2)
├── hooks/
│   ├── useTrailAnimation.ts     # ⏳ Animacja kamery (FAZA 3)
│   ├── useTrailProgress.ts      # ⏳ Obliczanie pozycji (FAZA 3)
│   └── useFileImport.ts         # ⏳ Import plików (FAZA 2)
├── utils/
│   ├── geoJsonParser.ts         # ⏳ Parse GeoJSON (FAZA 2)
│   ├── kmlParser.ts             # ⏳ Parse KML (FAZA 2)
│   └── trailCalculations.ts    # ⏳ Długość, czas, dystans (FAZA 2)
├── types/
│   └── index.ts                 # ✅ Typy TypeScript
├── index.ts                     # ✅ Barrel export
└── README.md                    # ✅ Dokumentacja
```

---

## 🚀 Użycie

### Otwarcie modalu tras

FAB "Trasy turystyczne" znajduje się w prawym panelu mapy (po FAB "Wyszukiwanie").

**Kliknięcie FAB** → Otwiera modal z dwoma opcjami:
1. **📁 Importuj plik** - Wgraj KML/GeoJSON z Google My Maps, Garmin, Strava
2. **✏️ Narysuj trasę** - Ręcznie narysuj trasę na mapie (FAZA 5)

### Import pliku (FAZA 2)

```typescript
// TODO: Implementacja w FAZIE 2
// 1. User wybiera plik .kml lub .geojson
// 2. Parser przetwarza plik → TrailFeature
// 3. Trasa wyświetlana na mapie
// 4. Timeline + Sidebar pokazują informacje
```

### Ręczne rysowanie (FAZA 5)

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
    createdAt: Date;
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
- ✅ Timeline z suwakiem postępu
- ✅ Animacja kamery wzdłuż trasy
- ✅ Sidebar z informacjami (nazwa, długość, czas)
- ✅ Elevation Profile (wykres wysokościowy)

**Różnice:**
- ❌ Brak hardcoded tras (user wgrywa własne)
- ❌ Brak POI (tylko trasa)
- ✅ Obsługa wielu formatów plików (KML, GeoJSON, GPX)
- ✅ Ręczne rysowanie tras (FAZA 5)

---

## 🔧 Rozwój

### Następne kroki (FAZA 2):
1. Implementacja `geoJsonParser.ts`
2. Implementacja `kmlParser.ts`
3. Wyświetlanie trasy na mapie (Mapbox addLayer)
4. Obliczanie długości trasy (turf.js)

### Technologie:
- **Mapbox GL JS** - wyświetlanie mapy i tras
- **@turf/turf** - obliczenia geograficzne (długość, bearing)
- **xml2js** - parsing KML → JSON
- **@mapbox/togeojson** - KML → GeoJSON converter

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

---

**Data utworzenia:** 2025-01-18
**Branch:** `ola/fab-trasa`
**Status:** FAZA 1 ukończona ✅
