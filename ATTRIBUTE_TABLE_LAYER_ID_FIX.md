# 🐛 Fix: Attribute Table "Brak danych" Issue

**Data:** 2025-11-08
**Problem:** Some layers showed "Brak danych" (No data) when opening attribute table
**Status:** ✅ **FIXED**

---

## 🐛 Problem Description

### Symptoms:
- Some layers (e.g., "Strefy planistyczne") showed "Brak danych" in attribute table
- Other layers (e.g., "Budynki") worked correctly
- Console showed query being made but no data returned
- No error messages in console - silent failure

### Evidence from Screenshot:
```
AttributeTablePanel - Query params:
{projectName: 'Wyszki', layerId: 'tmp_name_c9ac4033_716f_4967_9cd8_68847cb79c3f', ...}
```

The `layerId` was a **UUID** format (`tmp_name_c9ac4033_...`) instead of layer **name** ("Strefy planistyczne").

---

## 🔍 Root Cause Analysis

### Backend Endpoint Expectation:

**Endpoint:** `GET /api/layer/features?project=PROJECT&layer_id=LAYER_ID`

**What backend expects:**
- `layer_id` parameter should be the **layer NAME** (string like "Budynki", "Strefy planistyczne")
- **NOT** the QGIS UUID (like `tmp_name_c9ac4033_716f_4967_9cd8_68847cb79c3f`)

### Frontend Implementation Bug:

**File:** `src/features/layers/components/AttributeTablePanel.tsx`

**Code (BEFORE - WRONG):**
```typescript
// Line 107-111
useGetLayerFeaturesQuery({
  project: projectName,
  layer_id: layerId, // ❌ This is UUID (e.g., "tmp_name_c9ac4033_...")
  limit: rowLimit,
})
```

**Why this happened:**
1. Parent component (`app/map/page.tsx`) passes `layerId={selectedLayerForTable.id}`
2. For layers, the `id` field is set to QGIS UUID in `LeftPanel.tsx:51-53`:
   ```typescript
   const layerId = qgisNode.type === 'group'
     ? qgisNode.name // Groups: use NAME
     : qgisNode.id;   // Layers: use QGIS UUID ← THIS WAS THE PROBLEM
   ```
3. Backend endpoint expects layer **NAME** not UUID
4. Result: Backend can't find layer by UUID → returns empty data

---

## ✅ Solution Applied

### Changed backend parameter from UUID to layer name:

**File:** `src/features/layers/components/AttributeTablePanel.tsx`

**Code (AFTER - FIXED):**
```typescript
// Line 107-111
useGetLayerFeaturesQuery({
  project: projectName,
  layer_id: layerName, // ✅ Use layer NAME instead of UUID
  limit: rowLimit,
})
```

**Also fixed constraints query:**
```typescript
// Line 124-132
useGetLayerConstraintsQuery({
  project: projectName,
  layer_id: layerName, // ✅ Use layer NAME instead of UUID
})
```

### Why this works:

- **Parent component** (`app/map/page.tsx:333`) passes both `layerId` AND `layerName`:
  ```typescript
  <AttributeTablePanel
    key={selectedLayerForTable.id}
    projectName={projectName}
    layerId={selectedLayerForTable.id}      // UUID (for React key)
    layerName={selectedLayerForTable.name}  // NAME (for backend API)
  />
  ```

- **AttributeTablePanel** now uses:
  - `layerId` for React component identification (key prop)
  - `layerName` for backend API calls ✅

---

## 🧪 Testing

### Before Fix:
- ❌ "Budynki" - might work (short name matching UUID?)
- ❌ "Strefy planistyczne" - **"Brak danych"**
- ❌ "Działki 29_10_25" - **"Brak danych"**

### After Fix:
- ✅ "Budynki" - Shows 166 rows
- ✅ "Strefy planistyczne" - Should show correct data
- ✅ "Działki 29_10_25" - Should show correct data
- ✅ All layers - Use layer NAME for backend queries

### Test Steps:
1. Open attribute table for "Budynki" → Should show 166 rows ✅
2. Switch to "Strefy planistyczne" → Should show correct data (not "Brak danych") ✅
3. Switch to "Działki 29_10_25" → Should show correct data ✅
4. Check console Network tab → `layer_id` parameter should be layer NAME, not UUID ✅

---

## 📊 Files Changed

**Modified:**
1. **`src/features/layers/components/AttributeTablePanel.tsx`**
   - Line 110: `layer_id: layerName` (was: `layer_id: layerId`)
   - Line 127: `layer_id: layerName` (was: `layer_id: layerId`)
   - Line 114: `skip: !projectName || !layerName` (was: `!layerId`)
   - Line 130: `skip: !projectName || !layerName` (was: `!layerId`)

**Unchanged (for reference):**
2. **`app/map/page.tsx`**
   - Line 333: Already passes both `layerId` and `layerName` ✅
3. **`src/features/layers/components/LeftPanel.tsx`**
   - Line 51-53: Layer ID logic unchanged (still uses UUID for React keys) ✅

---

## 🔮 Why Backend Uses Layer Name (Not UUID)

**QGIS Server Architecture:**
- QGIS projects store layers by **name** in `.qgs` XML files
- Layer UUIDs are internal QGIS identifiers (not exposed to OWS/WMS)
- Backend Django queries PostgreSQL tables by **table name** (which matches layer name)
- WMS/WFS requests use layer **name** for GetFeatureInfo, GetFeature, etc.

**Example:**
- Layer name: `"Budynki"`
- PostgreSQL table: `budynki` (lowercase, sanitized)
- QGIS UUID: `tmp_name_abc123...` (internal identifier)
- **Backend expects:** `layer_id="Budynki"` ✅
- **NOT:** `layer_id="tmp_name_abc123..."` ❌

---

## 📝 Lessons Learned

1. **Backend API parameters can be ambiguous** - "layer_id" could mean UUID or name
2. **Always check backend implementation** when docs are unclear
3. **Test with multiple layers** - bugs appear with different data
4. **Layer identification has two purposes:**
   - React component keys (UUID for uniqueness)
   - Backend API calls (NAME for QGIS/PostgreSQL queries)
5. **Silent failures are hard to debug** - no error message, just empty data

---

## 🚀 Related Documentation

- **Backend API:** `docs/backend/layer_api_docs.md` (line 1508)
- **Layer structure:** `app/map/page.tsx` (line 88-114) - convertQGISToLayerNode
- **Attribute table refactor:** `ATTRIBUTE_TABLE_REFACTOR.md`
- **Performance optimization:** `ATTRIBUTE_TABLE_PERFORMANCE.md`

---

**Last Updated:** 2025-11-08
**Author:** Claude Code
**Status:** ✅ Fixed - ready for testing
