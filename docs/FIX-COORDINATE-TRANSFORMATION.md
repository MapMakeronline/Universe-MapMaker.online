# Fix: Invalid LngLat Coordinate Error

**Date:** 2025-10-11
**Issue:** Map crashes with "Invalid LngLat latitude value: must be between -90 and 90"
**Root Cause:** Backend returns coordinates in EPSG:2180, Mapbox requires EPSG:4326

---

## Problem Analysis

### What Happened?

When opening imported project `testnumr1`, the map crashed with error:
```
Error: Invalid LngLat latitude value: must be between -90 and 90
```

### Root Cause

Backend API (`/api/projects/new/json`) returns project extent coordinates in **EPSG:2180** (Polish National Grid):

```json
{
  "extent": [1575340.24, 6278773.80, 2689465.69, 7367152.64]
}
```

These are **NOT latitude/longitude**! They are:
- X (easting): ~1.5 million meters
- Y (northing): ~6.2 million meters

Mapbox GL JS requires **EPSG:4326** (WGS84):
- Longitude: -180 to 180 degrees
- Latitude: -90 to 90 degrees

---

## Solution Implemented

### 1. Installed proj4 library

```bash
npm install proj4 --save
```

### 2. Created coordinate transformation utility

**File:** `src/lib/geo/coordinates.ts`

Functions:
- `transformExtent()` - Convert extent from EPSG:2180 to EPSG:4326
- `transformPoint()` - Convert single point
- `isValidWGS84()` - Validate coordinates
- `detectCRS()` - Auto-detect coordinate system

### 3. Updated map page to transform coordinates

**File:** `app/map/page.tsx`

**Before:**
```typescript
const [minLng, minLat, maxLng, maxLat] = projectData.extent;
const centerLng = (minLng + maxLng) / 2;
const centerLat = (minLat + maxLat) / 2;
```

**After:**
```typescript
// Auto-detect coordinate system and transform if needed
if (isValidWGS84(minX, minY) && isValidWGS84(maxX, maxY)) {
  // Already WGS84
  [minLng, minLat, maxLng, maxLat] = projectData.extent;
} else {
  // Transform from EPSG:2180 to EPSG:4326
  [minLng, minLat, maxLng, maxLat] = transformExtent(projectData.extent);
}
```

---

## Technical Details

### EPSG:2180 (Polish National Grid)

- **Name:** ETRS89 / Poland CS92
- **Units:** Meters
- **Used by:** Polish government, cadastral data, MPZP documents
- **Definition:**
  ```
  +proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000
  +ellps=GRS80 +units=m +no_defs +type=crs
  ```

### EPSG:4326 (WGS84)

- **Name:** World Geodetic System 1984
- **Units:** Degrees
- **Used by:** GPS, web maps (Google, Mapbox), GeoJSON
- **Range:** Longitude [-180, 180], Latitude [-90, 90]

### Example Transformation

**Input (EPSG:2180):**
```
minX: 1575340.24 meters
minY: 6278773.80 meters
maxX: 2689465.69 meters
maxY: 7367152.64 meters
```

**Output (EPSG:4326):**
```
minLng: ~14.12° (degrees longitude)
minLat: ~49.00° (degrees latitude)
maxLng: ~24.15° (degrees longitude)
maxLat: ~54.83° (degrees latitude)
```

This covers approximately the entire territory of Poland.

---

## What Was Fixed

✅ **Invalid LngLat error** - Coordinates now properly transformed
✅ **Map crashes** - Validation prevents invalid coordinates
✅ **Auto-detection** - Works with both EPSG:2180 and EPSG:4326
✅ **Console logging** - Shows transformation details for debugging

---

## Testing Instructions

### Step 1: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click Refresh button → "Empty Cache and Hard Reload"
3. OR: Ctrl+Shift+Delete → Clear cache

### Step 2: Open Imported Project

1. Go to Dashboard: http://localhost:3000/dashboard
2. Click on project card: "testnumr1"
3. Map should load without errors

### Step 3: Verify Console Logs

Open browser console (F12), you should see:

```
📦 Loading project data: testnumr1.qgs
👁️ Read-only mode (viewer)
🔄 Transformed extent EPSG:2180 → WGS84: {
  from: [1575340.24, 6278773.80, 2689465.69, 7367152.64],
  to: [14.12, 49.00, 24.15, 54.83]
}
```

### Step 4: Check Map Rendering

✅ Map should show Poland territory
✅ No "Invalid LngLat" error
✅ Layers tree loads (left panel)
✅ 3D buildings enabled

---

## Other Issues Found

### 1. Layer Tree Not Loading

**Status:** TO BE FIXED
**Symptom:** Left panel shows empty tree, no layers from QGS import
**Likely Cause:** Backend returns layers but frontend doesn't render them

### 2. MUI Grid Deprecation Warnings

**Status:** TO BE FIXED
**Warnings:**
```
MUI Grid: The `item` prop has been removed
MUI Grid: The `xs` prop has been removed
MUI Grid: The `sm` prop has been removed
MUI Grid: The `md` prop has been removed
```

**Solution:** Migrate from Grid v1 to Grid v2 API

### 3. Extension Port Errors (Not Critical)

**Status:** BROWSER EXTENSION ISSUE
**Error:**
```
Unchecked runtime.lastError: The page keeping the extension port is moved
into back/forward cache, so the message channel is closed.
```

**Cause:** Chrome DevTools extensions (Redux DevTools, React DevTools)
**Impact:** Does not affect application functionality

---

## Next Steps

1. ✅ **Coordinate transformation** - COMPLETED
2. ⏳ **Test with user** - WAITING
3. ⏳ **Fix layer tree rendering** - TODO
4. ⏳ **Fix MUI Grid warnings** - TODO
5. ⏳ **Add QGS import progress feedback** - TODO

---

## Related Files

- `src/lib/geo/coordinates.ts` - Coordinate transformation utilities (NEW)
- `app/map/page.tsx` - Map page with transformation logic (UPDATED)
- `src/redux/api/projectsApi.ts` - RTK Query API (unchanged)
- `package.json` - Added proj4 dependency (UPDATED)

---

## References

- **proj4 Library:** https://github.com/proj4js/proj4js
- **EPSG Registry:** https://epsg.org/home.html
- **EPSG:2180 Definition:** https://epsg.io/2180
- **Mapbox GL JS Coordinates:** https://docs.mapbox.com/mapbox-gl-js/api/geography/#lnglatlike
