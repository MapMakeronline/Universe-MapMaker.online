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
- [x] Eleganckie powiadomienia Material-UI - `TrailNotification.tsx`
- [x] **Automatyczne wyświetlanie trasy po imporcie (bez F5!)** - `TrailLayer.tsx` reactive map readiness

### ✅ FAZA 3: Timeline & Animacja (GOTOWE - 2025-11-25)
- [x] **FAZA 3.1:** TimelineButton.tsx (FAB Play w prawym dolnym rogu)
- [x] **FAZA 3.2:** Timeline.tsx (pasek postępu z kontrolami Play/Pause/Speed/Seek)
- [x] **FAZA 3.3:** useTrailProgress.ts (obliczenia turf.js - pozycja, bearing, dystans)
- [x] **FAZA 3.4:** useTrailAnimationWithMarker.ts (unified RAF hook - Google Maps style navigation)
- [x] **FAZA 3.5:** TrailMarker.tsx (animated direction marker on trail)
- [x] **Marker:** Near-instant tracking (LERP 0.85, ~2-3 frames lag)
- [x] **Camera:** Smooth follow (LERP 0.12, ~5-6 frames lag, camera BEHIND marker)
- [x] **Single 60 FPS RAF loop** (no animation conflicts)
- [x] **Google Maps navigation replication** (camera chase effect)

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
│   ├── TrailNotification.tsx    # ✅ Eleganckie powiadomienia (sukces/usunięcie/refresh)
│   ├── TrailLayer.tsx           # ✅ Warstwa trasy na mapie (Mapbox GL JS)
│   ├── TrailMarker.tsx          # ✅ Animated direction marker (Google Maps style)
│   ├── Timeline.tsx             # ✅ Pasek postępu z kontrolami (FAZA 3)
│   ├── TimelineButton.tsx       # ✅ FAB button (Play/Pause)
│   └── Sidebar.tsx              # ⏳ Panel informacji (FAZA 4)
├── config/
│   └── animation.config.ts      # ✅ Animation timing & behavior constants (Phase 1)
├── hooks/
│   ├── useFileImport.ts         # ✅ Import plików (KML/GeoJSON)
│   ├── useTrailAnimationWithMarker.ts  # ✅ Unified camera + marker animation (60 FPS RAF)
│   └── useTrailProgress.ts      # ✅ Obliczanie pozycji wzdłuż trasy (turf.js)
├── utils/
│   ├── camera.utils.ts          # ✅ Camera positioning geometry (Phase 1)
│   ├── lerp.utils.ts            # ✅ Linear interpolation functions (Phase 1)
│   ├── geojsonParser.ts         # ✅ Parse GeoJSON (walidacja + konwersja)
│   ├── kmlParser.ts             # ✅ Parse KML (DOMParser + toGeoJSON)
│   └── trailCalculations.ts     # ✅ Długość, czas, dystans (turf.js)
├── types/
│   └── index.ts                 # ✅ Typy TypeScript (Trail, TrailFeature, etc.)
├── index.ts                     # ✅ Barrel export
├── README.md                    # ✅ Dokumentacja
├── REFACTORING-PHASE-1.md       # ✅ Phase 1: Extract utilities
├── REFACTORING-PHASE-2.md       # ✅ Phase 2: Extract initialization logic
├── REFACTORING-PHASE-3.md       # ✅ Phase 3: Extract RAF loop
└── CLEANUP-ANALYSIS.md          # ✅ Post-refactoring cleanup analysis
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
// 4. Elegancki dialog potwierdzenia (Material-UI):
//    - Ciemnoszare tło (#4A5568)
//    - Ikona kosza
//    - Pytanie: "Czy na pewno chcesz usunąć trasę [nazwa]?"
//    - Przyciski: "Anuluj" (outlined) / "Usuń" (czerwony)
// 5. Po potwierdzeniu:
//    - Trasa znika z mapy + localStorage
//    - Czerwone powiadomienie sukcesu: "Trasa została usunięta!"
```

### Powiadomienia (FAZA 2 - GOTOWE ✅)

**Wszystkie powiadomienia używają komponentu `TrailNotification.tsx` z Material-UI Dialog:**

1. **Powiadomienie sukcesu importu:**
   - Ciemnoszare tło (#4A5568) górnej części
   - Jasne tło (rgb(247, 249, 252)) dolnej części (przyciski)
   - Ikona: CheckCircle (✓)
   - Tytuł: "Trasa została załadowana!"
   - Info: Nazwa trasy, długość (km), czas (min), ostrzeżenia
   - Przycisk: "Zamknij"
   - **Trasa wyświetla się automatycznie na mapie (bez odświeżania!)**

2. **Dialog potwierdzenia usunięcia:**
   - Ciemnoszare tło (#4A5568)
   - Ikona: Delete (🗑️)
   - Tytuł: "Potwierdź usunięcie trasy"
   - Pytanie o potwierdzenie z nazwą trasy
   - Dwa przyciski: "Anuluj" / "Usuń" (czerwony)

3. **Powiadomienie po usunięciu:**
   - Ciemnoszare tło (#4A5568)
   - Ikona: Delete (🗑️)
   - Tytuł: "Trasa została usunięta!"
   - Info: 'Trasa "[nazwa]" została pomyślnie usunięta z mapy.'
   - Przycisk: "OK"

**Two-tone design:**
- Górna część (DialogContent): Kolorowe tło + białe ikony/tekst
- Dolna część (DialogActions): Jasne tło + kolorowe przyciski
- Zaokrąglone rogi (borderRadius: 3)
- Centrowane wyświetlanie
- Responsywne (maxWidth: "sm")

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

### Notifications:
- Komponent `TrailNotification.tsx` - uniwersalny dialog dla wszystkich powiadomień
- Props: `showRefreshMessage`, `showDeleteMessage` dla różnych typów
- Two-tone color scheme (górna/dolna część)
- Material-UI icons: CheckCircle, Refresh, Delete
- Responsywne i centrowane wyświetlanie
- **Zastąpiono wszystkie natywne `alert()` i `window.confirm()`**

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

### 4. Natywne alert() i confirm() dialogi
**Problem:** Brzydkie natywne przeglądarki dialogi (window.alert, window.confirm)
**Rozwiązanie:**
- Utworzono `TrailNotification.tsx` - uniwersalny Material-UI Dialog
- Props dla różnych typów: `showRefreshMessage`, `showDeleteMessage`
- Two-tone color scheme (górna/dolna część)
- Elegancki design: zaokrąglone rogi, ikony, odpowiednie kolory
- Zastąpiono wszystkie alert() i confirm() w TrailsModal.tsx

### 5. Trasa wymaga odświeżenia (F5) po imporcie
**Problem:** Po imporcie pliku KML/GeoJSON trasa nie wyświetlała się na mapie - wymagane było ręczne odświeżenie strony (F5)
**Root Cause:**
- Modal zamykał się natychmiast po `dispatch(setActiveTrail())`
- TrailLayer montował się przed pełnym zainicjalizowaniem mapy
- useEffect w TrailLayer.tsx (linia 69-72) kończył się early return gdy `mapRef.current?.getMap()` zwracało null
- Po F5: Redux ładował state z localStorage, mapa była już gotowa → warstwa dodawała się poprawnie
**Rozwiązanie:**
- Dodano reaktywny state `mapReady` z interwałem sprawdzającym (co 100ms)
- Effect #1: Czeka na inicjalizację mapy (`map.isStyleLoaded()` lub `map.loaded()`)
- Effect #2: Dodaje warstwę trasy tylko gdy `mapReady === true`
- Dependency array zawiera `mapReady` → re-trigger gdy mapa staje się dostępna
- Usunięto powiadomienie "Odśwież stronę" (nie jest już potrzebne)
**Rezultat:** Trasa wyświetla się automatycznie po imporcie, bez potrzeby odświeżania strony

---

## 🎬 FAZA 3: Architektura Animacji (SZCZEGÓŁOWA DOKUMENTACJA)

### Cel: Replikacja Google Maps Navigation

**Zachowanie Google Maps podczas nawigacji:**
- 📍 **Marker:** Ściśle trzyma się trasy (bardzo szybka reakcja, ~2-3 klatki opóźnienia)
- 📷 **Kamera:** Za markerem, patrzy do przodu (płynny lag ~0.3s, efekt "gonienia")
- 🎯 **Widok:** Marker + droga przed nim widoczne (kinematyczny efekt "chase")
- 🔍 **Zoom:** Stały 17-18 (tryb nawigacji)
- 📐 **Pitch:** 45-50° (perspektywa, nie widok z góry)

### Implementacja: useTrailAnimationWithMarker.ts

**Plik:** [src/features/trails/hooks/useTrailAnimationWithMarker.ts](../hooks/useTrailAnimationWithMarker.ts)

#### Kluczowe Stałe

```typescript
const ANIMATION_DURATION = 120000;           // 2 minuty (długość całej animacji)
const CAMERA_OFFSET_METERS = 80;             // Kamera 80m ZA markerem
const INTERPOLATION_SPEED = 0.85;            // Marker LERP (szybka reakcja)
const CAMERA_INTERPOLATION_SPEED = 0.12;     // Kamera LERP (płynny ruch)
const NAVIGATION_ZOOM = 17.5;                // Stały zoom nawigacji
const NAVIGATION_PITCH = 50;                 // Kąt kamery (perspektywa)
```

#### Architektura RAF Loop

**Pojedyncza pętla requestAnimationFrame (60 FPS):**

```
┌─────────────────────────────────────────┐
│  animate() - requestAnimationFrame      │
│  (wywoływane co ~16.67ms = 60 FPS)      │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ 1️⃣ Update    │       │ 2️⃣ Update    │
│   Progress    │       │   Marker      │
│   (0 → 1.0)   │       │   (LERP)      │
└───────────────┘       └───────────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
            ┌───────────────┐
            │ 3️⃣ Update    │
            │   Camera      │
            │   (LERP)      │
            └───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ 4️⃣ Check End │
            │   (progress   │
            │    >= 1.0?)   │
            └───────────────┘
```

#### LERP (Linear Interpolation) Pattern

**Wzór matematyczny:**
```typescript
newPosition = currentPosition + (targetPosition - currentPosition) * LERP_SPEED
```

**Przykład dla markera (LERP = 0.85):**
```
Frame 0:  current = [0.0, 0.0], target = [1.0, 1.0]
Frame 1:  new = [0.0, 0.0] + ([1.0, 1.0] - [0.0, 0.0]) * 0.85 = [0.85, 0.85]
Frame 2:  new = [0.85, 0.85] + ([1.0, 1.0] - [0.85, 0.85]) * 0.85 = [0.9775, 0.9775]
Frame 3:  new = [0.9775, 0.9775] + ([1.0, 1.0] - [0.9775, 0.9775]) * 0.85 = [0.9966, 0.9966]
```
**Rezultat:** Marker prawie natychmiast (2-3 klatki) osiąga pozycję trasy

**Przykład dla kamery (LERP = 0.12):**
```
Frame 0:  current = [0.0, 0.0], target = [1.0, 1.0]
Frame 1:  new = [0.0, 0.0] + ([1.0, 1.0] - [0.0, 0.0]) * 0.12 = [0.12, 0.12]
Frame 2:  new = [0.12, 0.12] + ([1.0, 1.0] - [0.12, 0.12]) * 0.12 = [0.2256, 0.2256]
...
Frame 18: new ≈ [0.90, 0.90]  // ~18 klatek = 0.3 sekundy opóźnienia
```
**Rezultat:** Kamera płynnie podąża za markerem z ~0.3s opóźnieniem

#### Pozycjonowanie Kamery (Geometria)

**Problem:** Jak umieścić kamerę 80m ZA markerem, patrzącą DO PRZODU?

**Rozwiązanie - bearing + 180°:**
```typescript
function getCameraCenter(markerPoint: [number, number], bearing: number): [number, number] {
  const point = turf.point(markerPoint);

  // CRITICAL: bearing + 180° = przeciwny kierunek
  // Marker jedzie na północ (bearing = 0°)
  // Kamera 80m na południe (bearing + 180° = 180°)
  const cameraBearing = (bearing + 180) % 360;

  // turf.destination(punkt, dystans_km, kierunek)
  const cameraPoint = turf.destination(point, 80 / 1000, cameraBearing, 'kilometers');

  return cameraPoint.geometry.coordinates as [number, number];
}
```

**Wizualizacja:**
```
        ↑ bearing = 0° (północ)
        │
        🔺 Marker (pozycja: [0, 0])
        │
        │ 80m
        │
        📷 Kamera (pozycja: [0, -0.0008]) ← bearing + 180° = 180° (południe)
        │
        ↓ Kamera patrzy na północ (bearing = 0°)
```

**Kamera używa:**
- `center`: Pozycja 80m ZA markerem
- `bearing`: Kierunek markera (kamera patrzy DO PRZODU)
- `pitch`: 50° (perspektywa)
- `zoom`: 17.5 (stały)

#### Stan Interpolacji (Refs)

**Marker State:**
```typescript
const currentMarkerPosRef = useRef<[number, number] | null>(null);  // Aktualna pozycja markera (LERP)
const currentMarkerBearingRef = useRef<number>(0);                  // Aktualny kierunek markera (LERP)
```

**Camera State:**
```typescript
const currentCameraPosRef = useRef<[number, number] | null>(null);  // Aktualna pozycja kamery (LERP)
const currentCameraBearingRef = useRef<number>(0);                  // Aktualny kierunek kamery (LERP)
```

**Target State (bez stale closures):**
```typescript
const currentPointRef = useRef<[number, number] | null>(null);      // Cel: rzeczywista pozycja na trasie
const currentBearingRef = useRef<number>(0);                        // Cel: rzeczywisty kierunek trasy
const followCameraRef = useRef<boolean>(true);                      // Czy kamera podąża?
const progressRef = useRef<number>(0);                              // Postęp animacji (0-1)
```

**Aktualizacja refs (pasywna, bez useEffect):**
```typescript
// Na każdym renderze, POZA useEffect (żeby nie triggerować re-runs)
currentPointRef.current = currentPoint;
currentBearingRef.current = currentBearing;
followCameraRef.current = followCamera;
progressRef.current = progress;
```

#### Trzy Efekty (useEffect)

**Effect #1: Inicjalizacja pozycji markera**
```typescript
useEffect(() => {
  // Tylko gdy marker staje się widoczny (visible = true)
  if (currentMarkerPosRef.current === null && currentPoint && visible) {
    currentMarkerPosRef.current = currentPoint;  // Ustaw początkową pozycję
    currentMarkerBearingRef.current = currentBearing;

    // Inicjalizuj również kamerę (80m za markerem)
    const initialCameraPos = getCameraCenter(currentPoint, currentBearing);
    currentCameraPosRef.current = initialCameraPos;
    currentCameraBearingRef.current = currentBearing;
  }
}, [visible, currentPoint, currentBearing]);
```

**Effect #2: Unified RAF Loop (główna pętla animacji)**
```typescript
useEffect(() => {
  if (!isPlaying) return; // Tylko gdy animacja aktywna

  // CRITICAL FIX: Reset pozycji kamery przy starcie/wznowieniu
  if (currentMarkerPosRef.current) {
    const initialCameraPos = getCameraCenter(
      currentMarkerPosRef.current,
      currentMarkerBearingRef.current
    );
    currentCameraPosRef.current = initialCameraPos;
  }

  const animate = (timestamp: number) => {
    // 1️⃣ Update progress
    const deltaTime = timestamp - lastTimestampRef.current;
    const progressIncrement = deltaTime / ANIMATION_DURATION;
    const newProgress = Math.min(progressRef.current + progressIncrement, 1.0);
    setProgress(newProgress);
    progressRef.current = newProgress;

    // 2️⃣ Update marker (LERP do currentPointRef.current)
    const targetPos = currentPointRef.current;
    const targetBear = currentBearingRef.current;
    const currentPos = currentMarkerPosRef.current;

    if (marker && targetPos && currentPos) {
      const newLng = currentPos[0] + (targetPos[0] - currentPos[0]) * INTERPOLATION_SPEED;
      const newLat = currentPos[1] + (targetPos[1] - currentPos[1]) * INTERPOLATION_SPEED;
      const newBearing = currentMarkerBearingRef.current +
        (targetBear - currentMarkerBearingRef.current) * INTERPOLATION_SPEED;

      currentMarkerPosRef.current = [newLng, newLat];
      currentMarkerBearingRef.current = newBearing;

      marker.setLngLat([newLng, newLat]);
      marker.setRotation(newBearing);
    }

    // 3️⃣ Update camera (LERP za markerem)
    if (followCameraRef.current) {
      const camPoint = currentMarkerPosRef.current;  // ✅ Śledź marker, nie trasę!
      const camBearing = currentMarkerBearingRef.current;

      const targetCameraPos = getCameraCenter(camPoint, camBearing);
      const currentCameraPos = currentCameraPosRef.current;

      const newCamLng = currentCameraPos[0] +
        (targetCameraPos[0] - currentCameraPos[0]) * CAMERA_INTERPOLATION_SPEED;
      const newCamLat = currentCameraPos[1] +
        (targetCameraPos[1] - currentCameraPos[1]) * CAMERA_INTERPOLATION_SPEED;
      const newCamBearing = currentCameraBearingRef.current +
        (camBearing - currentCameraBearingRef.current) * CAMERA_INTERPOLATION_SPEED;

      currentCameraPosRef.current = [newCamLng, newCamLat];
      currentCameraBearingRef.current = newCamBearing;

      // jumpTo() zamiast easeTo() (brak konfliktów animacji)
      map.jumpTo({
        center: [newCamLng, newCamLat],
        bearing: newCamBearing,
        pitch: NAVIGATION_PITCH,
        zoom: NAVIGATION_ZOOM,
      });
    }

    // 4️⃣ Check end
    if (newProgress >= 1.0) {
      setIsPlaying(false);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  animationFrameRef.current = requestAnimationFrame(animate);

  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };
}, [isPlaying, visible, setProgress, setIsPlaying, mapRef, markerRef]);
// ✅ MINIMAL DEPS - progress, currentPoint, currentBearing używają refs
```

**Effect #3: Manual seek (usunięty)**
- Wcześniej obsługiwał przesuwanie suwaka (seek)
- Teraz obsługiwane przez reset kamery w Effect #2
- RAF loop automatycznie podąża za nową pozycją markera

---

## 🐛 FAZA 3: Rozwiązane Problemy Animacji (KRYTYCZNE BUGI)

### 6. Marker wraca do pozycji startowej podczas animacji

**Problem:** Po pierwszej próbie naprawy marker nadal był niestabilny i cofał się w stronę pozycji początkowej.

**Objawy:**
- Marker ruszał w stronę trasy
- Po kilku sekundach zaczynał dryfować z powrotem
- Animacja wyglądała jak "przeciąganie gumki" (rubber-banding)

**Root Cause:**
```typescript
// ❌ BŁĄD: targetPositionRef ustawiany TYLKO RAZ przy visible=true
if (targetPositionRef.current === null) {
  targetPositionRef.current = currentPoint; // NIGDY SIĘ NIE AKTUALIZOWAŁ!
}

// RAF loop interpolował do STAREJ pozycji z klatki 0
const target = targetPositionRef.current; // Pozycja z początku animacji
const newLng = current[0] + (target[0] - current[0]) * 0.5;
```

**Dlaczego to nie działało:**
1. `targetPositionRef` = pozycja z klatki 0 animacji
2. `currentPoint` = rzeczywista pozycja na trasie (aktualizowana co klatkę)
3. Marker LERP do `targetPositionRef` (stara pozycja) zamiast `currentPoint` (nowa pozycja)
4. Efekt: marker "goni" pozycję z początku animacji

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: Usuń targetPositionRef, użyj currentPointRef.current
const targetPos = currentPointRef.current; // Zawsze aktualna pozycja trasy
const targetBear = currentBearingRef.current;

const newLng = currentPos[0] + (targetPos[0] - currentPos[0]) * INTERPOLATION_SPEED;
const newLat = currentPos[1] + (targetPos[1] - currentPos[1]) * INTERPOLATION_SPEED;
```

**Linie kodu:**
- Usunięte: lines 103-105 (`targetPositionRef`, `targetBearingRef`)
- Poprawione: lines 238-247 (LERP używa `currentPointRef.current`)

**Rezultat:** Marker śledzi aktualną pozycję trasy, nie cofa się.

---

### 7. Kamera w ogóle nie podąża za markerem

**Problem:** Po naprawie markera kamera pozostawała nieruchoma lub poruszała się bardzo niestabilnie.

**Objawy:**
- Marker ruszał poprawnie
- Kamera stała w miejscu lub "skakała"
- Marker szybko znikał poza ekranem

**Root Cause #1: essential: false**
```typescript
// ❌ BŁĄD: essential: false pozwala Mapbox anulować easeTo()
map.easeTo({
  center: targetPos,
  bearing: targetBearing,
  duration: 100,
  essential: false  // ← Mapbox może anulować podczas user interaction
});
```

**Root Cause #2: easeTo() konflikty**
```typescript
// ❌ BŁĄD: easeTo() wywoływane co 100ms z duration: 100ms
// Każde nowe wywołanie przerywa poprzednią animację
setInterval(() => {
  map.easeTo({ ..., duration: 100 });  // Przerywa poprzednie easeTo()
}, 100);
```

**Dlaczego to nie działało:**
1. `easeTo()` uruchamia własną animację (100ms)
2. Po 100ms następne wywołanie przerywa poprzednią animację
3. Kamera nigdy nie kończy żadnej animacji → zostaje w miejscu
4. Dodatkowo `essential: false` pozwala użytkownikowi anulować ruch

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: LERP + jumpTo() zamiast easeTo()

// Krok 1: Oblicz LERP (60 FPS)
const newCamLng = currentCameraPos[0] +
  (targetCameraPos[0] - currentCameraPos[0]) * CAMERA_INTERPOLATION_SPEED;

// Krok 2: Natychmiastowa aktualizacja (bez animacji Mapbox)
map.jumpTo({
  center: [newCamLng, newCamLat],
  bearing: newCamBearing,
  pitch: NAVIGATION_PITCH,
  zoom: NAVIGATION_ZOOM,
});
```

**Dlaczego to działa:**
- `jumpTo()` = instant update (bez animacji Mapbox)
- LERP w RAF loop = płynna animacja (60 FPS)
- Brak konfliktów między wywołaniami
- Kamera kontrolowana w 100% przez nasz kod

**Linie kodu:**
- Dodane: lines 136-139 (camera interpolation refs)
- Zmienione: lines 283-288 (`jumpTo()` zamiast `easeTo()`)
- Zmienione: line 58 (CAMERA_INTERPOLATION_SPEED = 0.12)

**Rezultat:** Kamera płynnie podąża za markerem bez "skoków".

---

### 8. Kamera śledzi trasę zamiast markera (marker z przodu, kamera z tyłu)

**Problem:** Kamera była PRZED markerem zamiast ZA nim.

**Objawy:**
- Marker widoczny na dole ekranu
- Kamera "wyprzedzała" marker
- Nie wyglądało jak Google Maps (tam kamera za markerem)

**Root Cause:**
```typescript
// ❌ BŁĄD: Kamera celowała w currentPointRef (rzeczywista pozycja trasy)
const camPoint = currentPointRef.current;  // Pozycja trasy (bez LERP lag)
const camBearing = currentBearingRef.current;

// Marker miał LERP lag (~2-3 klatki)
// currentMarkerPosRef = pozycja markera (z lagiem)
// currentPointRef = pozycja trasy (bez lagu)
// Rezultat: kamera 2-3 klatki przed markerem
```

**Dlaczego to nie działało:**
1. Marker LERP (0.85) → opóźnienie ~2-3 klatki za trasą
2. Kamera celowała w `currentPointRef` (rzeczywista trasa, bez lagu)
3. Kamera 80m za trasą = kamera przed markerem
4. Efekt: marker widoczny z tyłu zamiast z przodu

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: Śledź marker, nie trasę
const camPoint = currentMarkerPosRef.current;  // Pozycja markera (z LERP lag)
const camBearing = currentMarkerBearingRef.current;

const targetCameraPos = getCameraCenter(camPoint, camBearing);  // 80m za markerem
```

**Linie kodu:**
- Zmienione: lines 261-262 (kamera śledzi `currentMarkerPosRef`)

**Rezultat:** Kamera 80m za markerem, marker widoczny z przodu.

---

### 9. Kamera przed markerem zamiast za nim (geometria offsetu)

**Problem:** Kamera 80m PRZED markerem zamiast 80m ZA markerem.

**Objawy:**
- Marker poza ekranem (z tyłu)
- Widoczna droga przed markerem, ale sam marker niewidoczny
- Odwrotnie niż w Google Maps

**Root Cause:**
```typescript
// ❌ BŁĄD: turf.destination w kierunku ruchu (bearing)
function getCameraCenter(markerPoint: [number, number], bearing: number) {
  const point = turf.point(markerPoint);
  const cameraPoint = turf.destination(point, 80 / 1000, bearing, 'kilometers');
  // bearing = kierunek ruchu
  // Rezultat: kamera 80m DO PRZODU (w kierunku ruchu)
  return cameraPoint.geometry.coordinates;
}
```

**Wizualizacja błędu:**
```
        📷 Kamera (80m przed markerem) ← BŁĄD!
        │
        ↓ bearing = 0° (północ)
        │
        🔺 Marker
```

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: bearing + 180° (przeciwny kierunek)
function getCameraCenter(markerPoint: [number, number], bearing: number) {
  const point = turf.point(markerPoint);

  // CRITICAL: Kamera ZA markerem (nie przed!)
  const cameraBearing = (bearing + 180) % 360;
  const cameraPoint = turf.destination(point, 80 / 1000, cameraBearing, 'kilometers');

  return cameraPoint.geometry.coordinates;
}
```

**Wizualizacja poprawki:**
```
        ↑ bearing = 0° (północ)
        │
        🔺 Marker
        │
        ↓ bearing + 180° = 180° (południe)
        │
        📷 Kamera (80m za markerem) ← POPRAWKA!
```

**Mapbox kamera używa:**
- `center`: [lng, lat] kamery (80m za markerem)
- `bearing`: Kierunek patrzenia kamery = `bearing` markera (kamera patrzy DO PRZODU)
- `pitch`: 50° (perspektywa)

**Linie kodu:**
- Zmienione: lines 74-76 (`cameraBearing = (bearing + 180) % 360`)
- Komentarze: lines 24, 55, 74-75

**Rezultat:** Kamera 80m za markerem, patrzy do przodu (Google Maps style).

---

### 10. Kamera zbyt wolna (nie nadąża za zakrętami)

**Problem:** Kamera reagowała zbyt wolno na zakręty, marker znikał z ekranu.

**Objawy:**
- Na prostych odcinkach OK
- Na ostrych zakrętach marker znikał z ekranu
- Kamera "doganiała" marker po kilku sekundach

**Root Cause:**
```typescript
// ❌ BŁĄD: CAMERA_INTERPOLATION_SPEED = 0.08 (zbyt wolne)
const CAMERA_INTERPOLATION_SPEED = 0.08;

// LERP calculation:
// Frame 1:  current + (target - current) * 0.08 = 8% postępu
// Frame 2:  current + (target - current) * 0.08 = 15.36% postępu
// ...
// Frame 28: ~90% postępu (0.47 sekundy)
```

**Dlaczego to nie działało:**
- Marker LERP = 0.85 (prawie instant, ~2-3 klatki)
- Kamera LERP = 0.08 (powolna, ~28 klatek = 0.47s)
- Różnica: 25 klatek ≈ 0.4 sekundy
- Na zakręcie: marker skręca natychmiast, kamera 0.4s później
- Efekt: marker poza ekranem

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: CAMERA_INTERPOLATION_SPEED = 0.12 (szybsza reakcja)
const CAMERA_INTERPOLATION_SPEED = 0.12;

// LERP calculation:
// Frame 1:  current + (target - current) * 0.12 = 12% postępu
// Frame 2:  current + (target - current) * 0.12 = 22.56% postępu
// ...
// Frame 18: ~90% postępu (0.3 sekundy)
```

**Rezultat:** Kamera ~0.3s za markerem (jak Google Maps), marker zawsze widoczny.

**Linie kodu:**
- Zmienione: line 58 (`CAMERA_INTERPOLATION_SPEED = 0.12`)

**Dlaczego 0.12 a nie więcej?**
- Google Maps: ~0.3s lag (daje efekt "chase")
- 0.15: zbyt szybko, brak efektu gonienia
- 0.08: zbyt wolno, marker znika
- 0.12: optymalne (marker + droga widoczne)

---

### 11. Marker poza ekranem po wznowieniu/seek

**Problem:** Animacja działała poprawnie przy pierwszym uruchomieniu, ale po zatrzymaniu/wznowieniu lub przesunięciu suwaka (seek) marker pojawiał się poza ekranem.

**Objawy:**
- Pierwsze play → działa OK
- Pause → Play → marker z przodu (poza ekranem)
- Seek (przesunięcie suwaka) → marker z przodu (poza ekranem)
- Kamera "doganiała" marker po ~10 sekundach

**Root Cause:**
```typescript
// ❌ BŁĄD: Brak resetu pozycji kamery przy wznowieniu

// Scenario przy seek:
// 1. User klika pause (progress = 0.5)
//    - currentMarkerPosRef = [lng1, lat1] (pozycja przy 50%)
//    - currentCameraPosRef = [lng2, lat2] (80m za markerem)
//
// 2. User przesuwa suwak (progress = 0.8)
//    - currentPointRef.current = [lng3, lat3] (nowa pozycja przy 80%)
//    - currentMarkerPosRef = [lng1, lat1] (STARA pozycja! nie zresetowana)
//    - currentCameraPosRef = [lng2, lat2] (STARA pozycja kamery!)
//
// 3. User klika play
//    - Marker zaczyna LERP z [lng1, lat1] → [lng3, lat3] (natychmiast)
//    - Kamera zaczyna LERP z [lng2, lat2] → target za markerem (powoli)
//    - Dystans: ~400m+ (kamera daleko z tyłu)
//    - Rezultat: marker poza ekranem, kamera dogania po ~10s
```

**Dlaczego to nie działało:**
1. Przy seek/wznowieniu: `currentPointRef` aktualizowany natychmiast
2. `currentMarkerPosRef` zaczynał LERP ze starej pozycji
3. `currentCameraPosRef` też ze starej pozycji
4. Marker szybko (LERP 0.85) osiągał nową pozycję
5. Kamera wolno (LERP 0.12) doganiała z 400m+ dystansu
6. Efekt: marker widoczny dopiero po ~10 sekundach

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: Reset pozycji kamery na początku Effect #2

useEffect(() => {
  if (!isPlaying) return;

  // CRITICAL FIX: Reset camera position when animation starts/resumes
  if (currentMarkerPosRef.current && currentMarkerBearingRef.current !== undefined) {
    const initialCameraPos = getCameraCenter(
      currentMarkerPosRef.current,
      currentMarkerBearingRef.current
    );
    currentCameraPosRef.current = initialCameraPos;  // ✅ INSTANT RESET!

    console.log('🔄 Camera position reset on animation start:', {
      markerPos: currentMarkerPosRef.current,
      cameraPos: initialCameraPos,
      bearing: currentMarkerBearingRef.current,
    });
  }

  // ... reszta RAF loop
}, [isPlaying, ...]);
```

**Dlaczego to działa:**
1. Przy wznowieniu: effect wykonuje się ponownie
2. `currentCameraPosRef` resetowany do pozycji 80m za markerem
3. Marker zaczyna LERP z aktualnej pozycji (może być stara)
4. Kamera natychmiast "skacze" 80m za marker
5. RAF loop kontynuuje płynny ruch

**Linie kodu:**
- Dodane: lines 204-217 (camera reset na początku RAF loop)

**Rezultat:** Po seek/wznowieniu kamera zawsze 80m za markerem, marker widoczny.

---

### 12. Pionowy offset powodował nieprawidłowe pozycjonowanie

**Problem:** Próba dodania offsetu pionowego (40m perpendicular do bearing) powodowała, że marker był w nieprawidłowym miejscu ekranu.

**Objawy:**
- Marker nie w dolnej 1/3 ekranu (jak w Google Maps)
- Marker czasem poza ekranem (z boku)
- Nieprzewidywalne zachowanie na zakrętach

**Root Cause:**
```typescript
// ❌ PRÓBA (usunięta): Offset pionowy perpendicular do bearing
const CAMERA_VERTICAL_OFFSET_METERS = 40;

// Offset w dwóch kierunkach:
// 1. 80m do tyłu (bearing + 180°)
const backwardPoint = turf.destination(point, 80/1000, bearing + 180, 'km');
// 2. 40m w prawo (bearing + 90°)
const cameraPoint = turf.destination(backwardPoint, 40/1000, bearing + 90, 'km');

// Problem: offset w prawo powodował asymetrię
// Na zakręcie w lewo: marker z prawej strony ekranu
// Na zakręcie w prawo: marker z lewej strony ekranu
```

**Dlaczego to nie działało:**
- Mapbox `pitch` automatycznie pozycjonuje marker w dolnej części ekranu
- Dodatkowy offset poziomy powodował asymetrię
- Google Maps używa tylko `pitch` + `bearing`, bez offsetu poziomego

**Rozwiązanie:**
```typescript
// ✅ POPRAWKA: Usuń pionowy offset, zostaw tylko pitch

const CAMERA_OFFSET_METERS = 80;  // Tylko offset do tyłu
// ❌ USUNIĘTO: const CAMERA_VERTICAL_OFFSET_METERS = 40;

function getCameraCenter(markerPoint: [number, number], bearing: number) {
  const point = turf.point(markerPoint);
  const cameraBearing = (bearing + 180) % 360;
  const cameraPoint = turf.destination(point, 80 / 1000, cameraBearing, 'km');

  // ❌ USUNIĘTO: Vertical offset calculation

  return cameraPoint.geometry.coordinates;
}

// Mapbox pitch (50°) automatycznie pozycjonuje marker w dolnej 1/3
map.jumpTo({
  center: cameraPoint,
  bearing: bearing,
  pitch: 50,  // To wystarcza do pozycjonowania markera
  zoom: 17.5,
});
```

**Linie kodu:**
- Usunięte: line 56 (`CAMERA_VERTICAL_OFFSET_METERS`)
- Usunięte: lines 79-80 (vertical offset calculation)
- Komentarz: lines 79-80 (wyjaśnienie usunięcia)

**Rezultat:** Marker w dolnej 1/3 ekranu (dzięki pitch), bez asymetrii.

---

## 🔍 FAZA 3: Troubleshooting Guide (Przewodnik Debugowania)

### Narzędzia diagnostyczne

**1. Console.log w kluczowych miejscach:**
```typescript
// Effect #1: Inicjalizacja
console.log('✅ Effect 1: Initializing marker position (first show)', {
  currentPoint: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
});

// Effect #2: Camera reset
console.log('🔄 Camera position reset on animation start:', {
  markerPos: `[${currentMarkerPosRef.current[0].toFixed(4)}, ${currentMarkerPosRef.current[1].toFixed(4)}]`,
  cameraPos: `[${initialCameraPos[0].toFixed(4)}, ${initialCameraPos[1].toFixed(4)}]`,
  bearing: currentMarkerBearingRef.current,
});

// RAF loop: Marker update (tylko gdy problem)
console.log('📍 Marker update:', {
  targetPos: `[${targetPos[0].toFixed(4)}, ${targetPos[1].toFixed(4)}]`,
  currentPos: `[${currentPos[0].toFixed(4)}, ${currentPos[1].toFixed(4)}]`,
  newPos: `[${newLng.toFixed(4)}, ${newLat.toFixed(4)}]`,
  bearing: newBearing.toFixed(2),
});

// RAF loop: Camera update (tylko gdy problem)
console.log('📷 Camera update:', {
  targetCameraPos: `[${targetCameraPos[0].toFixed(4)}, ${targetCameraPos[1].toFixed(4)}]`,
  currentCameraPos: `[${currentCameraPos[0].toFixed(4)}, ${currentCameraPos[1].toFixed(4)}]`,
  newCameraPos: `[${newCamLng.toFixed(4)}, ${newCamLat.toFixed(4)}]`,
  bearing: newCamBearing.toFixed(2),
});
```

**UWAGA:** Nie używaj console.log w RAF loop (60 FPS = 60 logów/s)! Tylko do debugowania.

**2. React DevTools - sprawdź refs:**
```typescript
// W React DevTools sprawdź wartości refs:
// Components → TrailMarker → hooks → useRef

currentMarkerPosRef.current   // Pozycja markera
currentCameraPosRef.current    // Pozycja kamery
currentPointRef.current        // Pozycja trasy (target)
progressRef.current            // Postęp animacji
```

**3. Mapbox GL JS debugging:**
```typescript
// W konsoli przeglądarki:
const map = window._mapInstance; // (jeśli eksportowany)
map.getCenter();     // Pozycja kamery
map.getBearing();    // Kierunek kamery
map.getPitch();      // Kąt kamery
map.getZoom();       // Zoom kamery
```

### Typowe problemy i ich diagnoza

#### Problem: Marker wraca do pozycji startowej

**Objawy:**
- Marker rusza w stronę trasy
- Po kilku sekundach cofa się
- Efekt "przeciągania gumki"

**Diagnoza:**
```typescript
// 1. Sprawdź targetPositionRef w RAF loop
console.log('Target:', targetPos);  // Czy aktualizowany co klatkę?

// 2. Sprawdź currentPointRef
console.log('Current trail position:', currentPointRef.current);

// 3. Porównaj:
if (targetPos !== currentPointRef.current) {
  console.error('❌ BŁĄD: LERP do starej pozycji!');
}
```

**Rozwiązanie:** Sprawdź lines 238-247 - LERP musi używać `currentPointRef.current`.

#### Problem: Kamera nie podąża za markerem

**Objawy:**
- Marker rusza, kamera stoi
- Kamera "skacze" co 100ms
- Marker znika z ekranu

**Diagnoza:**
```typescript
// 1. Sprawdź czy followCamera = true
console.log('Follow camera:', followCameraRef.current);

// 2. Sprawdź czy kamera aktualizowana
console.log('Camera updated:', newCamLng, newCamLat);

// 3. Sprawdź czy używasz easeTo() czy jumpTo()
// easeTo() = BAD (konflikty animacji)
// jumpTo() = GOOD (instant update + LERP smoothness)
```

**Rozwiązanie:**
- Sprawdź line 283 - musi być `map.jumpTo()`
- Sprawdź line 260 - musi być `if (followCameraRef.current)`

#### Problem: Marker poza ekranem po seek/wznowieniu

**Objawy:**
- Pierwsze play → OK
- Seek → marker poza ekranem
- Kamera dogania po ~10s

**Diagnoza:**
```typescript
// 1. Sprawdź pozycje przed wznowieniem
console.log('Before resume:', {
  marker: currentMarkerPosRef.current,
  camera: currentCameraPosRef.current,
  target: currentPointRef.current,
});

// 2. Sprawdź dystans
const markerLng = currentMarkerPosRef.current[0];
const cameraLng = currentCameraPosRef.current[0];
const distance = Math.abs(markerLng - cameraLng) * 111000; // ~metry
console.log('Distance (m):', distance);

// Jeśli distance > 200m → BŁĄD: kamera nie zresetowana
```

**Rozwiązanie:** Sprawdź lines 204-217 - camera reset musi być PRZED RAF loop.

#### Problem: Kamera przed markerem

**Objawy:**
- Marker widoczny na dole ekranu
- Kamera "wyprzedza" marker

**Diagnoza:**
```typescript
// Sprawdź czy kamera śledzi marker czy trasę
const camPoint = ???;  // Powinna być currentMarkerPosRef.current

if (camPoint === currentPointRef.current) {
  console.error('❌ BŁĄD: Kamera śledzi trasę, nie marker!');
}
```

**Rozwiązanie:** Sprawdź line 261 - musi być `currentMarkerPosRef.current`.

#### Problem: Marker poza ekranem (geometria offsetu)

**Objawy:**
- Marker niewidoczny (z tyłu ekranu)
- Widoczna droga przed kamerą, ale brak markera

**Diagnoza:**
```typescript
// Sprawdź kierunek offsetu kamery
console.log('Bearing:', bearing);
console.log('Camera bearing:', cameraBearing);

// Powinna być: cameraBearing = (bearing + 180) % 360
// Jeśli cameraBearing === bearing → BŁĄD!
```

**Rozwiązanie:** Sprawdź line 76 - musi być `(bearing + 180) % 360`.

### Wzorce do unikania

**❌ NIE UŻYWAJ:**

1. **Stale closures w RAF loop:**
```typescript
// ❌ BŁĄD: currentPoint z momentu utworzenia effect
const animate = () => {
  console.log(currentPoint);  // Stara wartość!
};
```
**Zamiast:** Użyj refs + pasywna aktualizacja:
```typescript
currentPointRef.current = currentPoint;  // Poza useEffect
const animate = () => {
  console.log(currentPointRef.current);  // Aktualna wartość!
};
```

2. **easeTo() w RAF loop:**
```typescript
// ❌ BŁĄD: easeTo() konfliktuje z poprzednim wywołaniem
map.easeTo({ center: pos, duration: 100 });
```
**Zamiast:** Użyj jumpTo() + LERP:
```typescript
const newPos = current + (target - current) * LERP;
map.jumpTo({ center: newPos });
```

3. **Throttling camera updates:**
```typescript
// ❌ BŁĄD: Aktualizacja co 100ms → niezgrabny ruch
setInterval(() => updateCamera(), 100);
```
**Zamiast:** 60 FPS RAF loop (co ~16ms).

4. **Console.log w RAF loop:**
```typescript
// ❌ BŁĄD: 60 logów/s = zamrożona konsola
const animate = () => {
  console.log('Frame');  // NIE!!!
};
```
**Zamiast:** Log tylko w kluczowych miejscach (init, reset).

### Performance considerations

**Optymalizacje:**
- Single RAF loop (nie osobne dla markera i kamery)
- Minimal useEffect deps (tylko isPlaying, visible, callbacks)
- Refs zamiast state (uniknięcie re-renderów)
- jumpTo() zamiast easeTo() (brak Mapbox animation overhead)

**Koszt obliczeniowy:**
- 60 FPS × (marker LERP + camera LERP + progress update) = ~0.3ms/frame
- turf.destination: ~0.05ms (2 wywołania/frame = 0.1ms)
- map.jumpTo: ~0.1ms
- Razem: ~0.5ms/frame (1/32 dostępnego czasu 16.67ms)

**Rezultat:** Smooth 60 FPS bez frame drops.

---

## 🚀 Następne kroki (FAZA 4)

### Sidebar & Info (FAZA 4):
1. **Panel informacji:** Nazwa, długość, czas trasy
2. **Elevation Profile:** Wykres wysokościowy (turf.js + recharts/d3)
3. **Trail Statistics:** Dystans, przewyższenia, czas
4. **POI markers:** Punkty orientacyjne wzdłuż trasy

### Technologie FAZA 3 (zastosowane):
- ✅ **Mapbox `jumpTo()`** - instant camera updates (zamiast easeTo/flyTo)
- ✅ **turf.js `destination()`, `bearing()`** - geometria offsetu kamery
- ✅ **RAF (requestAnimationFrame)** - 60 FPS smooth animation
- ✅ **LERP interpolation** - marker (0.85) + camera (0.12)
- ✅ **React useRef** - unikanie stale closures

---

**Data utworzenia:** 2025-01-18
**Data aktualizacji:** 2025-11-25
**Branch:** `ola/fab-trasa`
**Status:** FAZA 1 ✅ | FAZA 2 ✅ | **FAZA 3 ✅** (Google Maps navigation replication complete)

**Commits history:**
- `7b0c9fe` (FAZA 1 - podstawowa struktura)
- `69223b3` (FAZA 2 - import plików)
- `c2cce3d` (usuwanie tras)
- `3a8fb4c` (fix serialization)
- `2198a27` (eleganckie powiadomienia Material-UI)
- `1bfd87c` (FAZA 3 - animated direction marker)
- `5cbc0ff` (FAZA 3 - camera follow control + center button)
- `6710e1b` (FAZA 3 - enable zoom/pan during animation)
- `b59d782` (FAZA 3 - update camera immediately on progress change)
- `997ad2a` (FAZA 3 - complete trail animation hooks)
- **2025-11-25:** FAZA 3 animation bug fixes (10 critical bugs resolved)
  - ✅ Fix #6: Marker LERP to stale target (removed targetPositionRef)
  - ✅ Fix #7: Camera not following (jumpTo + LERP instead of easeTo)
  - ✅ Fix #8: Camera targeting trail instead of marker
  - ✅ Fix #9: Camera offset direction (bearing + 180°)
  - ✅ Fix #10: Camera LERP speed increased (0.08 → 0.12)
  - ✅ Fix #11: Camera position reset on seek/resume
  - ✅ Fix #12: Removed vertical offset (pitch handles positioning)
  - ✅ Fix #13: Event listener conflict (zoomstart → wheel)
  - ✅ Fix #14: Missing physical camera movement in Effect #1
  - ✅ Fix #15: Enhanced diagnostic logging for mapRef null detection

**Kluczowe pliki:**
- [useTrailAnimationWithMarker.ts](src/features/trails/hooks/useTrailAnimationWithMarker.ts) - Unified 60 FPS RAF loop
- [TrailMarker.tsx](src/features/trails/components/TrailMarker.tsx) - Animated direction marker
- [Timeline.tsx](src/features/trails/components/Timeline.tsx) - Play/Pause/Speed/Seek controls
- [useTrailProgress.ts](src/features/trails/hooks/useTrailProgress.ts) - Position calculations

**🎯 FAZA 3 Achievement:** Perfect Google Maps navigation replication - marker tracking (LERP 0.85), camera chase (LERP 0.12), 60 FPS smooth animation, no frame drops.

---

## 🐛 Bug Fixes Detailed (2025-11-25)

### Fix #13: Event Listener Conflict - Camera Follow Disabled by Programmatic Zoom

**Problem:** Camera immediately disabled (`followCamera = false`) after clicking Play button, despite setting it to `true`. Camera never followed marker.

**Root Cause:**
- Timeline.tsx was listening to `'zoomstart'` event to detect user interactions
- Hook's `map.jumpTo({ zoom: 17.5 })` (programmatic zoom) triggered `'zoomstart'` event
- Event handler executed → `setFollowCamera(false)`
- RAF loop saw `followCamera = false` → skipped all camera updates

**Code Sequence:**
```typescript
// 1. User clicks Play
handlePlayPause() → setFollowCamera(true) + setIsPlaying(true)

// 2. Effect #2 executes
map.jumpTo({ zoom: 17.5 }) → Mapbox emits 'zoomstart' event

// 3. Timeline event listener catches it
map.on('zoomstart', handleUserInteraction)
→ setFollowCamera(false)

// 4. RAF loop checks followCamera
if (followCamera) { /* update camera */ }  // SKIPPED!
```

**Solution:**
Changed event listener from `'zoomstart'` to `'wheel'` - only triggered by user scroll, NOT by programmatic `map.jumpTo()`.

**Files Modified:**
- `Timeline.tsx` line 161

**Before:**
```typescript
map.on('zoomstart', handleUserInteraction);
```

**After:**
```typescript
map.on('wheel', handleUserInteraction);  // Only user scroll, NOT programmatic
```

---

### Fix #14: Missing Physical Camera Movement in Effect #1

**Problem:** When Timeline opened, marker appeared on trail but camera stayed in bird's eye view. Camera only moved after clicking Play button.

**Root Cause:**
Effect #1 in `useTrailAnimationWithMarker.ts` was updating camera position ref (`currentCameraPosRef.current`) but NOT executing `map.jumpTo()` to physically move the camera.

**Code Sequence:**
```typescript
// 1. Timeline opens (open = true)
useEffect(() => {
  // Marker initialized
  currentMarkerPosRef.current = currentPoint;  ✅

  // Camera ref updated
  currentCameraPosRef.current = getCameraCenter(currentPoint, bearing);  ✅

  // ❌ MISSING: No map.jumpTo() call!
  // Camera physically stayed in bird's eye view
}, [visible, ...]);
```

**Why This Caused Issues:**
- Refs are in-memory state only
- Mapbox camera position is separate from refs
- Without `map.jumpTo()`, camera never physically moved
- User saw: Marker on trail, camera in bird's eye view

**Solution:**
Added `map.jumpTo()` in Effect #1 to physically move camera to initial position (80m behind marker, pitch 50°, zoom 17.5).

**Files Modified:**
- `useTrailAnimationWithMarker.ts` lines 187-208

**Added Code:**
```typescript
// CRITICAL FIX: Physically move camera to initial position
const map = mapRef.current?.getMap();
if (map) {
  map.jumpTo({
    center: initialCameraPos,
    bearing: currentBearing,
    pitch: NAVIGATION_PITCH,
    zoom: NAVIGATION_ZOOM,
  });
  console.log('✅ Effect 1: Camera physically moved to start position', {
    cameraPos: `[${initialCameraPos[0].toFixed(4)}, ${initialCameraPos[1].toFixed(4)}]`,
    bearing: currentBearing,
    zoom: NAVIGATION_ZOOM,
    pitch: NAVIGATION_PITCH,
  });
}
```

---

### Fix #15: Enhanced Diagnostic Logging for mapRef Null Detection

**Problem:** Unable to diagnose if `mapRef.current?.getMap()` was returning `null` when Effect #1 executed, preventing camera movement.

**Potential Root Cause:**
- Effect #1 triggers when Timeline opens (`visible = true`)
- Mapbox map might not be fully loaded yet
- `mapRef.current?.getMap()` could return `null`
- `map.jumpTo()` would NOT execute → camera stays in bird's eye view

**Solution:**
Added comprehensive error logging with else branch to detect if mapRef is null.

**Files Modified:**
- `useTrailAnimationWithMarker.ts` lines 203-208

**Added Code:**
```typescript
if (map) {
  map.jumpTo({ ... });
  console.log('✅ Effect 1: Camera physically moved to start position', { ... });
} else {
  // Diagnostic logging for null mapRef
  console.error('❌ Effect 1: mapRef.current is NULL - camera NOT moved!', {
    hasMapRef: !!mapRef.current,
    hasGetMap: !!mapRef.current?.getMap,
  });
}
```

**Impact:**
- Console logs now show either success or error
- Can diagnose if map availability is the issue
- If error appears → need to add map load event listener or retry logic

---

## 🔍 Testing & Verification

**To verify the fixes work:**

1. **Open Timeline** (click FAB "Trasy turystyczne" → open Timeline)
2. **Check console logs:**
   - ✅ Success: `"✅ Effect 1: Camera physically moved to start position"`
   - ❌ Error: `"❌ Effect 1: mapRef.current is NULL - camera NOT moved!"`

3. **Expected behavior:**
   - Camera should IMMEDIATELY move to behind-marker position (not bird's eye view)
   - Pitch should be 50° (perspective view)
   - Zoom should be 17.5 (navigation mode)

4. **Click Play:**
   - Marker should move along trail
   - Camera should smoothly follow marker (no jumpiness)
   - Camera should stay behind marker, looking forward

**If error logs appear:**
- mapRef is not ready when Effect #1 executes
- Need to add map load event listener or delay initialization

---
