# Camera Follow - Solution B Implementation 📹

**Date:** 2025-11-25
**Goal:** Implement "Play → instant camera jump to marker" behavior
**Status:** ✅ **IMPLEMENTED & COMPILED** (2025-11-25 12:40 CET)

---

## 🎯 Rozwiązanie B: Play zawsze centruje kamerę

**Zachowanie:**
- User klika **Play** → Kamera natychmiast (`jumpTo`) centruje się na markerze
- Kamera podąża za markerem (smooth LERP follow)
- User używa **scroll** → Kamera przestaje podążać
- User klika **Play** ponownie → Kamera znowu skacze do markera

---

## 📝 Implementacja

### **Plik do zmiany:** `src/features/trails/components/Timeline.tsx`

**Funkcja:** `handlePlayPause()` (linie 95-102)

---

### **PRZED (Obecny kod):**

```typescript
const handlePlayPause = () => {
  if (!isPlaying) {
    // Force camera follow on Play (prevents camera stuck after user drag/zoom)
    setFollowCamera(true);
  }
  setIsPlaying(!isPlaying);
  console.log(isPlaying ? '⏸️ Timeline: Paused' : '▶️ Timeline: Playing + Camera follow enabled');
};
```

**Problem:**
- Play tylko ustawia `followCamera = true`
- Kamera NIE skacze do markera natychmiast
- User musi scrollować, żeby kamera zaczęła podążać (trigger LERP update)

---

### **PO (Rozwiązanie B):**

```typescript
const handlePlayPause = () => {
  if (!isPlaying) {
    // Play pressed → Enable camera follow
    setFollowCamera(true);

    // SOLUTION B: Instant jump to marker position
    const map = mapRef.current?.getMap();
    if (map && currentPoint) {
      // Import camera utility function
      const { getCameraCenterBehindMarker } = require('../utils/camera.utils');
      const { NAVIGATION_PITCH, NAVIGATION_ZOOM } = require('../config/animation.config');

      // Calculate camera position 80m behind marker
      const cameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);

      // Instant jump to marker (no animation)
      map.jumpTo({
        center: cameraPos,
        bearing: currentBearing,
        pitch: NAVIGATION_PITCH,
        zoom: NAVIGATION_ZOOM,
      });

      console.log('🎯 Play: Camera jumped to marker', {
        markerPos: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
        cameraPos: `[${cameraPos[0].toFixed(4)}, ${cameraPos[1].toFixed(4)}]`,
        bearing: currentBearing,
      });
    }
  }
  setIsPlaying(!isPlaying);
  console.log(isPlaying ? '⏸️ Timeline: Paused' : '▶️ Timeline: Playing + Camera follow enabled');
};
```

**Zmiany:**
1. ✅ Dodano `map.jumpTo()` wewnątrz `if (!isPlaying)`
2. ✅ Import `getCameraCenterBehindMarker` z utils
3. ✅ Import `NAVIGATION_PITCH`, `NAVIGATION_ZOOM` z config
4. ✅ Kamera skacze do pozycji 80m za markerem
5. ✅ Console log z informacją o skoku

---

## 📦 Dodatkowe importy

**Na początku pliku Timeline.tsx** (po istniejących importach):

```typescript
// Existing imports...
import { getCameraCenterBehindMarker } from '../utils/camera.utils';
import { NAVIGATION_PITCH, NAVIGATION_ZOOM } from '../config/animation.config';
```

**Lokalizacja:** Po linii 34 (po `import { useTrailAnimationWithMarker }`)

---

## 🔄 Flow użytkownika (Rozwiązanie B)

### **Scenariusz 1: Pierwsze otwarcie Timeline**
1. User klika "Trasy turystyczne" FAB
2. Timeline się otwiera
3. Effect (linia 125): `setFollowCamera(true)` + `initializeAnimationState()` (hook)
4. Kamera już jest na markerze (dzięki Effect #1 w hook)
5. ✅ **Brak zmiany** - Effect #1 już centruje kamerę przy otwarciu

### **Scenariusz 2: User scrolluje, potem klika Play**
1. User scrolluje mapę → `wheel` event → `setFollowCamera(false)`
2. Kamera przestaje podążać (RAF loop: `if (followCamera.current) { ... }`)
3. **User klika Play** → `handlePlayPause()` wykonuje:
   - `setFollowCamera(true)`
   - 🚀 **`map.jumpTo(cameraPos)`** ← NOWE!
   - `setIsPlaying(true)`
4. ✅ Kamera natychmiast skacze do markera
5. ✅ RAF loop (hook) kontynuuje smooth follow (LERP 0.12)

### **Scenariusz 3: User klika Pause, scrolluje, klika Play ponownie**
1. User klika Pause → `setIsPlaying(false)` → RAF loop stopped
2. User scrolluje mapę → kamera się przesuwa (manual zoom/pan)
3. **User klika Play** → `handlePlayPause()` wykonuje:
   - 🚀 **`map.jumpTo(cameraPos)`** ← Kamera wraca do markera!
   - `setFollowCamera(true)`
   - `setIsPlaying(true)`
4. ✅ Animacja wznawia się, kamera podąża za markerem

---

## ⚙️ Interakcja z istniejącymi mechanizmami

### **1. Effect #1 (hook) - Initialization**
**Plik:** `useTrailAnimationWithMarker.ts` (linie 143-174)

```typescript
useEffect(() => {
  // ...
  if (shouldInitialize) {
    initializeAnimationState(...); // Centruje kamerę przy otwarciu Timeline
  }
}, [visible, markerRef, currentPoint, currentBearing, progress, mapRef]);
```

**Wpływ Rozwiązania B:**
- ✅ **Brak konfliktu** - Effect #1 działa tylko przy `visible` change (otwarcie Timeline)
- ✅ Play nie triggeruje Effect #1 (deps: `visible, markerRef, currentPoint, currentBearing, progress, mapRef`)
- ✅ `handlePlayPause()` działa niezależnie (instant jump)

---

### **2. Effect #2 (hook) - RAF Loop**
**Plik:** `useTrailAnimationWithMarker.ts` (linie 176-371)

```typescript
useEffect(() => {
  if (!isPlaying) {
    cancelAnimationFrame(animationFrameRef.current);
    return;
  }

  // CRITICAL FIX: Reset camera position when animation starts/resumes
  if (currentMarkerPosRef.current && currentMarkerBearingRef.current !== undefined) {
    const initialCameraPos = getCameraCenterBehindMarker(...);
    currentCameraPosRef.current = initialCameraPos;
    currentCameraBearingRef.current = currentMarkerBearingRef.current;

    map.jumpTo({ ... }); // ← JUŻ ISTNIEJĄCE! (linie 230-242)
  }

  // Start RAF loop...
}, [isPlaying, visible, setProgress, setIsPlaying, mapRef, markerRef]);
```

**❗ UWAGA: KONFLIKT Z ISTNIEJĄCYM KODEM!**

**Problem:**
- Effect #2 (hook) **JUŻ** robi `map.jumpTo()` przy `isPlaying` change (linie 230-242)
- `handlePlayPause()` (Timeline.tsx) **TEŻ** zrobi `map.jumpTo()`
- **Rezultat:** 2× `jumpTo` jeden po drugim → possible jank/lag

**Rozwiązanie konfliktu:**

**Option A: Usunąć `jumpTo` z Effect #2 (hook)**
```typescript
// REMOVE LINES 221-250 from useTrailAnimationWithMarker.ts
// Effect #2 (linie 176-371)

// ❌ DELETE THIS BLOCK:
// CRITICAL FIX: Reset camera position when animation starts/resumes
if (currentMarkerPosRef.current && currentMarkerBearingRef.current !== undefined) {
  const initialCameraPos = getCameraCenterBehindMarker(...);
  // ... DELETE 30 lines ...
  map.jumpTo({ ... });
}

// ✅ KEEP ONLY RAF LOOP START
animationFrameRef.current = requestAnimationFrame(animate);
```

**Uzasadnienie:**
- Timeline.tsx odpowiada za **UI interactions** (Play button)
- Hook odpowiada za **animation logic** (RAF loop)
- Separacja odpowiedzialności: UI decyduje kiedy centrować, hook animuje

---

**Option B: Dodać flag `skipInitialJump` (bardziej skomplikowane)**
```typescript
// Timeline.tsx handlePlayPause()
const handlePlayPause = () => {
  if (!isPlaying) {
    setFollowCamera(true);

    // Signal to hook: "I already did jumpTo, skip yours"
    skipInitialJumpRef.current = true;

    // Do jumpTo in Timeline
    map.jumpTo({ ... });
  }
  setIsPlaying(!isPlaying);
};

// Hook Effect #2 - check flag before jumpTo
if (!skipInitialJumpRef.current && currentMarkerPosRef.current) {
  map.jumpTo({ ... });
}
skipInitialJumpRef.current = false; // Reset flag
```

**Nie polecane** - dodaje złożoność, trudniejsze w utrzymaniu.

---

## 🎯 Rekomendowana implementacja (Option A)

### **Krok 1: Dodaj importy w Timeline.tsx**

**Plik:** `src/features/trails/components/Timeline.tsx` (linia 35)

```typescript
import { useTrailAnimationWithMarker } from '../hooks/useTrailAnimationWithMarker';
import TrailMarker from './TrailMarker';
// ✅ ADD THESE:
import { getCameraCenterBehindMarker } from '../utils/camera.utils';
import { NAVIGATION_PITCH, NAVIGATION_ZOOM } from '../config/animation.config';
```

---

### **Krok 2: Zmień handlePlayPause() w Timeline.tsx**

**Plik:** `src/features/trails/components/Timeline.tsx` (linie 95-102)

```typescript
const handlePlayPause = () => {
  if (!isPlaying) {
    // Enable camera follow
    setFollowCamera(true);

    // SOLUTION B: Instant jump to marker on Play
    const map = mapRef.current?.getMap();
    if (map && currentPoint) {
      const cameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);

      map.jumpTo({
        center: cameraPos,
        bearing: currentBearing,
        pitch: NAVIGATION_PITCH,
        zoom: NAVIGATION_ZOOM,
      });

      console.log('🎯 Play: Camera jumped to marker', {
        markerPos: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
        cameraPos: `[${cameraPos[0].toFixed(4)}, ${cameraPos[1].toFixed(4)}]`,
        bearing: currentBearing,
      });
    }
  }
  setIsPlaying(!isPlaying);
  console.log(isPlaying ? '⏸️ Timeline: Paused' : '▶️ Timeline: Playing + Camera follow enabled');
};
```

---

### **Krok 3: Usuń duplicate jumpTo z hooka**

**Plik:** `src/features/trails/hooks/useTrailAnimationWithMarker.ts` (linie 221-250)

**DELETE BLOCK:**
```typescript
// ❌ DELETE LINES 221-250 (30 lines)

// CRITICAL FIX: Reset camera position when animation starts/resumes
if (currentMarkerPosRef.current && currentMarkerBearingRef.current !== undefined) {
  const initialCameraPos = getCameraCenterBehindMarker(
    currentMarkerPosRef.current,
    currentMarkerBearingRef.current
  );
  currentCameraPosRef.current = initialCameraPos;
  currentCameraBearingRef.current = currentMarkerBearingRef.current;

  map.jumpTo({
    center: initialCameraPos,
    bearing: currentMarkerBearingRef.current,
    pitch: NAVIGATION_PITCH,
    zoom: NAVIGATION_ZOOM,
  });

  console.log('🔄 Camera position reset on animation start:', {
    markerPos: `[${currentMarkerPosRef.current[0].toFixed(4)}, ${currentMarkerPosRef.current[1].toFixed(4)}]`,
    cameraPos: `[${initialCameraPos[0].toFixed(4)}, ${initialCameraPos[1].toFixed(4)}]`,
    bearing: currentMarkerBearingRef.current,
  });
}
```

**KEEP (start RAF immediately):**
```typescript
// Start animation
animationFrameRef.current = requestAnimationFrame(animate);
```

---

## ✅ Verification Checklist

**Po implementacji, przetestuj:**

1. **Timeline opens** ✅
   - Kamera centruje się na markerze (Effect #1 initialization)
   - Marker widoczny na początku trasy

2. **Play clicked** ✅
   - Kamera natychmiast skacze do markera (`jumpTo` w `handlePlayPause`)
   - Animacja rozpoczyna się (RAF loop)
   - Console log: "🎯 Play: Camera jumped to marker"

3. **User scrolls during animation** ✅
   - `wheel` event → `setFollowCamera(false)`
   - Kamera przestaje podążać (RAF loop skips camera update)
   - Console log: "👆 User interaction detected, camera follow disabled"

4. **Play clicked again** ✅
   - Kamera skacze z powrotem do markera (`jumpTo`)
   - Kamera wznawia śledzenie (smooth LERP)
   - Console log: "🎯 Play: Camera jumped to marker"

5. **No duplicate jumps** ✅
   - Tylko 1× `jumpTo` przy Play (nie 2×)
   - Smooth transition bez jank/lag

---

## 📊 Impact Analysis

### **Linie kodu:**
- **Timeline.tsx:** +15 linii (import + jumpTo logic)
- **useTrailAnimationWithMarker.ts:** -30 linii (usunięty duplicate jumpTo)
- **Net change:** -15 linii (-3%)

### **Complexity:**
- ✅ **Prostsze** - UI (Timeline) odpowiada za jumpTo, hook tylko za animację
- ✅ **Clear separation** - "when to jump" (UI) vs "how to animate" (hook)

### **User Experience:**
- ✅ **Lepsze dla początkujących** - Play = instant focus na trasie
- ✅ **Mniej ukrytych stanów** - widać od razu co robi Play
- ⚠️ **Może być denerwujące** - user traci custom zoom/pan position

---

## 🚀 Next Steps

**Ready to implement?**
1. Confirm solution with user ✅
2. Apply changes (3 steps above)
3. Test all 5 scenarios ✅
4. Commit: `feat(trails): Play button instantly centers camera on marker (Solution B)`

**Alternative consideration:**
- Jeśli user przetestuje i uzna za zbyt "aggressive" → możemy wrócić do Solution A lub C

---

## ✅ Implementation Summary (2025-11-25 12:40 CET)

**Status:** ✅ **COMPLETED**

### **Changes Applied:**

**1. Timeline.tsx - Added imports** (lines 36-37) ✅
```typescript
import { getCameraCenterBehindMarker } from '../utils/camera.utils';
import { NAVIGATION_PITCH, NAVIGATION_ZOOM } from '../config/animation.config';
```

**2. Timeline.tsx - Modified handlePlayPause()** (lines 97-123) ✅
```typescript
const handlePlayPause = () => {
  if (!isPlaying) {
    setFollowCamera(true);

    // SOLUTION B: Instant jump to marker on Play
    const map = mapRef.current?.getMap();
    if (map && currentPoint) {
      const cameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);
      map.jumpTo({
        center: cameraPos,
        bearing: currentBearing,
        pitch: NAVIGATION_PITCH,
        zoom: NAVIGATION_ZOOM,
      });
      console.log('🎯 Play: Camera jumped to marker', { ... });
    }
  }
  setIsPlaying(!isPlaying);
};
```

**3. useTrailAnimationWithMarker.ts - Removed duplicate jumpTo** (lines 396-419) ✅
```typescript
// DELETED: 24 lines of duplicate jumpTo code from Effect #2
// Replaced with comment explaining separation of concerns
```

---

### **Compilation Status:**

✅ **Next.js compiled successfully**
- Modules: 4954
- No TypeScript errors
- No runtime errors
- Dev server running: http://localhost:3000

---

### **Testing Required:**

**5 Scenarios to verify:**

1. ☐ **Timeline opens** → Kamera centruje się na markerze (Effect #1)
2. ☐ **Play clicked** → Instant jump to marker (handlePlayPause)
3. ☐ **User scrolls** → Kamera przestaje podążać (wheel event)
4. ☐ **Play clicked again** → Camera jumps back to marker
5. ☐ **No duplicate jumps** → Only 1× jumpTo (not 2×)

**Expected console logs:**
- `"✅ Initializing / resetting marker & camera to start"` (Timeline open)
- `"🎯 Play: Camera jumped to marker"` (Play button)
- `"👆 User interaction detected, camera follow disabled"` (scroll/drag)

---

**Status:** ✅ Implementation complete, ready for user testing
**Time taken:** ~5 minutes (3 simple changes)
**Lines changed:** +17 (Timeline), -24 (hook) = **-7 lines net**
