# Parcel Search Testing Guide

## Overview

**Component:** `ParcelSearchTab.tsx`
**Location:** `src/features/mapa/interakcje/ParcelSearchTab.tsx`
**Public URL:** http://dev.universemapmaker.online/map?project=testshp

## Funkcjonalności

### 1. Konfiguracja (Modal)

**Jak otworzyć:**
1. Otwórz mapę: http://dev.universemapmaker.online/map?project=testshp
2. Kliknij ikonę "Search" (lupa) w prawym dolnym rogu
3. Wybierz zakładkę "Działki" (parcels tab)
4. Kliknij ikonę zębatki (⚙️) po prawej stronie przycisku "Wyszukaj"

**Co testować:**
- [ ] Modal się otwiera
- [ ] Lista warstw wektorowych się ładuje
- [ ] Auto-select warstwy "Działki" (jeśli istnieje)
- [ ] Po wyborze warstwy - lista kolumn się ładuje
- [ ] Można wybrać kolumnę "obręb" (np. NAZWA_OBRE)
- [ ] Można wybrać kolumnę "numer działki" (np. NUMER_DZIA)
- [ ] Przycisk "Zapisz" jest disabled dopóki nie wybierzesz wszystkich 3 pól
- [ ] Po kliknięciu "Zapisz" - modal się zamyka

### 2. Wyszukiwanie

**Jak testować:**
1. Skonfiguruj wyszukiwarkę (krok powyżej)
2. Wybierz obręb z dropdownu
3. Wybierz numer działki z autocomplete
4. Kliknij "Wyszukaj"

**Co testować:**
- [ ] Dropdown "Obręb działki" ładuje unikalne wartości z kolumny
- [ ] Autocomplete "Numer działki" ładuje unikalne wartości
- [ ] Loading state podczas wyszukiwania (spinner)
- [ ] Wyniki się wyświetlają (lista działek)
- [ ] Liczba wyników jest prawidłowa
- [ ] Kliknięcie na wynik → mapa zoomuje do działki
- [ ] Działka jest highlighted na mapie (GeoJSON overlay)

### 3. Error Handling

**Co testować:**
- [ ] Brak projektu → komunikat "Brak otwartego projektu"
- [ ] Brak konfiguracji → info box "Konfiguracja wymagana"
- [ ] Brak wyników → "Nie znaleziono działki"
- [ ] Błąd API → komunikat błędu z details

## Implementation Strategy (Updated 2025-10-26)

**Dual-Criteria Search Fix:**
- **Problem:** Backend `/api/projects/search` returns only columns containing the search phrase
- **Example:** Searching "Kolbudy" returns `{gid: 42, column_name: "NAZWA_OBRE", value: "Kolbudy"}` but NOT `{gid: 42, column_name: "NUMER_DZIA", value: "1"}`
- **Solution:** When both precinct AND plot number are selected:
  1. Make TWO separate API calls:
     - Call 1: Search for precinct → Returns gids with matching precinct
     - Call 2: Search for plot number → Returns gids with matching plot number
  2. Find intersection of gids from both results
  3. Display only parcels that appear in BOTH searches

**Benefits:**
- ✅ Works correctly with backend's current behavior
- ✅ No backend changes needed
- ✅ Efficient client-side intersection (Set operations)
- ✅ Clear separation of concerns (single criterion vs dual criteria)

**Configuration Persistence (localStorage):**
- Configuration is now saved per project: `parcelSearchConfig_${projectName}`
- Saved data: `{parcelLayerId, precinctColumn, plotNumberColumn}`
- Automatically loads on component mount
- Eliminates need to reconfigure search for each page reload

## Backend API Endpoints Used

### 1. GET /api/layer/column/values
**Pobiera unikalne wartości z kolumny**

**Request:**
```http
GET /api/layer/column/values?project=testshp&layer_id=Działki&column_name=NAZWA_OBRE
Authorization: Token <your_token>
```

**Response:**
```json
{
  "success": true,
  "data": ["Obręb 1", "Obręb 2", "Obręb 3"]
}
```

**Test z curl:**
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  "https://api.universemapmaker.online/api/layer/column/values?project=testshp&layer_id=Działki&column_name=NAZWA_OBRE"
```

### 2. GET /api/layer/attributes
**Pobiera listę kolumn warstwy**

**Request:**
```http
GET /api/layer/attributes?project=testshp&layer_id=Działki
Authorization: Token <your_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Types": {
      "ogc_fid": "Integer",
      "geom": "Geometry",
      "NAZWA_OBRE": "String",
      "NUMER_DZIA": "String"
    }
  }
}
```

**Test z curl:**
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  "https://api.universemapmaker.online/api/layer/attributes?project=testshp&layer_id=Działki"
```

### 3. GET /api/projects/search
**Wyszukuje działki po kryteriach**

**Request:**
```http
GET /api/projects/search?project=testshp&searched_phrase=Obręb+1+123&exactly=false&ignore_capitalization=true
Authorization: Token <your_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Działki": [
      {
        "gid": 42,
        "column_name": "NUMER_DZIA",
        "value": "123"
      }
    ]
  }
}
```

**Test z curl:**
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  "https://api.universemapmaker.online/api/projects/search?project=testshp&searched_phrase=123&exactly=false&ignore_capitalization=true"
```

### 4. WFS GetFeature
**Pobiera geometrię znalezionej działki**

**Request:**
```http
GET /ows?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=Działki&FEATUREID=Działki.42&OUTPUTFORMAT=application/json&MAP=/projects/testshp/testshp.qgs
```

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "Działki.42",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...]]]
      },
      "properties": {
        "NAZWA_OBRE": "Obręb 1",
        "NUMER_DZIA": "123"
      }
    }
  ]
}
```

**Test z curl:**
```bash
curl "https://api.universemapmaker.online/ows?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=Działki&FEATUREID=Działki.42&OUTPUTFORMAT=application/json&MAP=/projects/testshp/testshp.qgs"
```

## Manual Testing Checklist

### Prerequisites
- [ ] Projekt `testshp` załadowany
- [ ] Warstwa "Działki" istnieje w projekcie
- [ ] Kolumny "NAZWA_OBRE" i "NUMER_DZIA" istnieją w warstwie
- [ ] Token autoryzacji w localStorage

### Test 1: Configuration Modal
1. [ ] Otwórz http://dev.universemapmaker.online/map?project=testshp
2. [ ] Kliknij Search FAB (lupa)
3. [ ] Przejdź do zakładki "Działki"
4. [ ] Kliknij ikonę zębatki
5. [ ] Sprawdź czy lista warstw się załadowała
6. [ ] Wybierz warstwę "Działki"
7. [ ] Sprawdź czy lista kolumn się załadowała
8. [ ] Wybierz kolumnę obręb (np. NAZWA_OBRE)
9. [ ] Wybierz kolumnę numer działki (np. NUMER_DZIA)
10. [ ] Kliknij "Zapisz"

**Expected:** Modal zamyka się, dropdowny stają się aktywne

### Test 2: Search by Precinct
1. [ ] Otwórz dropdown "Obręb działki"
2. [ ] Sprawdź czy lista obrębów się załadowała
3. [ ] Wybierz obręb
4. [ ] Kliknij "Wyszukaj"
5. [ ] Sprawdź czy wyniki się wyświetliły

**Expected:** Lista działek z wybranego obrębu

### Test 3: Search by Plot Number
1. [ ] Zacznij wpisywać numer działki w autocomplete
2. [ ] Sprawdź czy pojawiają się sugestie
3. [ ] Wybierz numer z listy
4. [ ] Kliknij "Wyszukaj"
5. [ ] Sprawdź czy wyniki się wyświetliły

**Expected:** Znaleziona działka z tym numerem

### Test 4: Search by Both
1. [ ] Wybierz obręb
2. [ ] Wybierz numer działki
3. [ ] Kliknij "Wyszukaj"

**Expected:** Działka z obu kryteriów (obręb AND numer)

### Test 5: Result Click (Zoom + Highlight)
1. [ ] Wykonaj wyszukiwanie (np. Test 2)
2. [ ] Kliknij na jeden z wyników
3. [ ] Sprawdź czy mapa zoomuje do działki
4. [ ] Sprawdź czy działka jest highlighted

**Expected:**
- Mapa zoomuje do działki (padding 100px)
- Działka jest podświetlona na mapie (overlay)

### Test 6: Empty Results
1. [ ] Wpisz nieistniejący numer działki (np. "999999999")
2. [ ] Kliknij "Wyszukaj"

**Expected:** Komunikat "Nie znaleziono działki spełniającej kryteria"

### Test 7: No Configuration
1. [ ] Przeładuj stronę (clear state)
2. [ ] Otwórz Search modal → zakładka Działki
3. [ ] Sprawdź czy info box się pokazuje

**Expected:** Info box "Konfiguracja wymagana: Kliknij ikonę zębatki..."

## Browser Console Logs

Komponent loguje użyteczne informacje do konsoli:

```javascript
console.log('ParcelSearchTab - layers from Redux:', layers);
console.log('ParcelSearchTab - allLayers:', allLayers);
console.log('ParcelSearchTab - vectorLayers:', vectorLayers);
console.log('ParcelSearchTab - fetchLayerAttributes useEffect:', {...});
console.log('ParcelSearchTab - Fetching layer attributes for layer_id:', tempParcelLayerId);
console.log('ParcelSearchTab - Layer attributes API response:', {...});
console.log('🔍 Fetching feature geometry:', wfsUrl.toString());
console.log('✅ Feature geometry fetched:', feature);
console.log('🎯 Map zoomed to feature and highlighted');
```

**Jak sprawdzić:**
1. Otwórz http://dev.universemapmaker.online/map?project=testshp
2. F12 → Console
3. Wykonaj wyszukiwanie
4. Sprawdź logi

## Known Issues & Limitations

### Issue 1: Layer ID Format
- Frontend używa `layer.id` z tree.json
- Backend może wymagać innego formatu (np. `layer.name` lub `table_name`)
- **Workaround:** Sprawdź w konfiguracji która wartość działa

### Issue 2: Column Names
- Default kolumny: `NAZWA_OBRE`, `NUMER_DZIA`
- Jeśli Twoja warstwa ma inne nazwy kolumn → użyj modalu konfiguracji

### Issue 3: Authentication
- Wyszukiwanie wymaga tokenu autoryzacji
- Jeśli nie jesteś zalogowany → błąd 401

### Issue 4: WFS GetFeature
- Wymaga poprawnego `layer_id` format
- Jeśli `TYPENAME` jest nieprawidłowy → 404 lub pusta odpowiedź

## Debugging Tips

### Tip 1: Check Redux State
```javascript
// Browser console:
JSON.parse(localStorage.getItem('persist:root')).layers
```

### Tip 2: Check Auth Token
```javascript
// Browser console:
localStorage.getItem('authToken')
```

### Tip 3: Manual API Test
```bash
# Replace YOUR_TOKEN and test endpoint
curl -H "Authorization: Token YOUR_TOKEN" \
  "https://api.universemapmaker.online/api/layer/column/values?project=testshp&layer_id=Działki&column_name=NAZWA_OBRE"
```

### Tip 4: Network Tab
- F12 → Network tab
- Filtruj: "column/values", "search", "attributes"
- Sprawdź request/response

## Success Criteria

✅ **Wyszukiwarka działek działa poprawnie jeśli:**

1. Modal konfiguracji otwiera się i pozwala wybrać warstwę + kolumny
2. Dropdowny ładują unikalne wartości z bazy danych
3. Wyszukiwanie zwraca wyniki (lista działek)
4. Kliknięcie na wynik zoomuje mapę do działki
5. Działka jest highlighted na mapie po kliknięciu
6. Error states są obsługiwane (loading, empty, errors)

---

**Last Updated:** 2025-10-26
**Tested by:** [Your Name / Claude Code]
**Status:** ⏳ Awaiting Manual Testing
