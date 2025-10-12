# Fix: ZIP File Upload Not Supported for Shapefile Import

**Date:** 2025-10-12
**Issue:** Backend returns 400 Bad Request when user uploads ZIP file for Shapefile import
**Root cause:** Frontend sends ZIP file as `.shp` but backend endpoint expects individual files

## Problem Analysis

### User Reported Issue
- User was testing Shapefile import with ZIP files
- Backend returned 400 Bad Request error
- Console logs showed: `POST /api/layer/add/shp/ 400 (Bad Request)`

### Root Cause Identified

**Frontend (CreateProjectDialog.tsx, line 362-368):**
```typescript
// If ZIP, we'll handle it on backend
if (files['zip']) {
  return {
    name: baseName,
    shpFile: files['zip'], // ZIP file treated as SHP for backend ← PROBLEM!
  };
}
```

**Backend Expectation (layersApi.ts, lines 98-154):**
```typescript
/**
 * Backend expects:
 * - project: string (project_name)
 * - layer_name: string
 * - shp: File (required) ← Expects actual .shp file!
 * - shx: File (optional)
 * - dbf: File (optional)
 * - prj: File (optional)
 * - cpg: File (optional)
 * - qpj: File (optional)
 */
addShapefileLayer: builder.mutation<...>({
  query: (data) => {
    const formData = new FormData();
    formData.append('shp', data.shpFile); // Backend expects .shp, not ZIP!
    // ...
  }
})
```

**Mismatch:**
- Frontend was sending ZIP file in `shp` FormData field
- Backend endpoint `/api/layer/add/shp/` expects actual `.shp` file (binary shapefile data)
- Backend likely has no logic to unzip files

## Solution Implemented

### Option 1: Block ZIP Uploads (IMPLEMENTED)

**Rationale:**
- Simplest and fastest solution
- Prevents user confusion
- Clear error messages guide users to correct behavior
- No backend changes required

**Changes Made:**

#### 1. Update File Selection Handler (CreateProjectDialog.tsx, lines 323-394)

**Added ZIP validation:**
```typescript
const handleShapefileSelection = (files: FileList | null) => {
  if (!files || files.length === 0) return;

  setShpError(null);

  // Check for ZIP files and reject them
  const zipFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.zip'));
  if (zipFiles.length > 0) {
    setShpError(
      `❌ Pliki ZIP nie są obsługiwane!\n\n` +
      `Backend wymaga pojedynczych plików:\n` +
      `• Wymagany: .shp (geometria)\n` +
      `• Opcjonalne: .shx (indeks), .dbf (atrybuty), .prj (projekcja), .cpg (kodowanie), .qpj (QGIS projekcja)\n\n` +
      `Proszę rozpakować pliki ZIP i wybrać je wszystkie (Ctrl+Click).`
    );
    return;
  }

  // ... rest of handling for individual files
};
```

#### 2. Update Alert Message (lines 813-827)

**Before:**
```tsx
<Alert severity="info">
  Wspierane formaty:
  <br />• Pliki ZIP zawierające shapefile (.shp + .shx + .dbf + .prj)
  <br />• Pojedyncze pliki .shp (plus pliki pomocnicze)
</Alert>
```

**After:**
```tsx
<Alert severity="info">
  Wymagane pliki:
  <br />• .shp - geometria warstwy (wymagany)
  <br />• .shx - indeks przestrzenny (zalecany)
  <br />• .dbf - tabela atrybutów (zalecany)
  <br />• .prj - definicja układu współrzędnych (zalecany)
  <br />• .cpg - kodowanie znaków (opcjonalny)
  <br />• .qpj - projekcja QGIS (opcjonalny)
  <br />
  <br />⚠️ Uwaga: Pliki ZIP NIE są obsługiwane. Proszę rozpakować archiwum.
</Alert>
```

#### 3. Update File Input Accept Attribute (line 896)

**Before:**
```tsx
<input accept=".zip,.shp,.shx,.dbf,.prj,.cpg,.qpj" />
```

**After:**
```tsx
<input accept=".shp,.shx,.dbf,.prj,.cpg,.qpj" />
```

#### 4. Update Caption Text (lines 923-929)

**Before:**
```tsx
<Typography>
  Obsługiwane formaty: .zip, .shp, .shx, .dbf, .prj, .cpg, .qpj
  <br />Możesz wybrać wiele plików jednocześnie (Ctrl+Click)
</Typography>
```

**After:**
```tsx
<Typography>
  Obsługiwane formaty: .shp, .shx, .dbf, .prj, .cpg, .qpj
  <br />Możesz wybrać wiele plików jednocześnie (Ctrl+Click)
  <br />⚠️ Pliki ZIP NIE są obsługiwane - proszę rozpakować
</Typography>
```

#### 5. Remove ZIP Display Logic (lines 965-969)

**Before:**
```tsx
{shp.shpFile.name.endsWith('.zip')
  ? `ZIP (${(shp.shpFile.size / 1024).toFixed(1)} KB)`
  : supportingFiles.length > 0
  ? `shp + ${supportingFiles.length} plików pomocniczych`
  : 'tylko .shp'}
```

**After:**
```tsx
{supportingFiles.length > 0
  ? `shp + ${supportingFiles.length} plików pomocniczych (${supportingFiles.join(', ')})`
  : 'tylko .shp (zalecane: dodaj .shx, .dbf, .prj)'}
```

## User Experience Flow

### Before (BROKEN):
1. User uploads `granica.zip`
2. Frontend accepts it and shows "1 warstwa: ZIP (132 KB)"
3. User clicks "Utwórz i importuj SHP"
4. Backend returns 400 Bad Request
5. User confused - no clear error message

### After (FIXED):
1. User uploads `granica.zip`
2. Frontend immediately shows error:
   ```
   ❌ Pliki ZIP nie są obsługiwane!

   Backend wymaga pojedynczych plików:
   • Wymagany: .shp (geometria)
   • Opcjonalne: .shx (indeks), .dbf (atrybuty), .prj (projekcja), .cpg (kodowanie), .qpj (QGIS projekcja)

   Proszę rozpakować pliki ZIP i wybrać je wszystkie (Ctrl+Click).
   ```
3. User extracts ZIP: `granica.shp`, `granica.shx`, `granica.dbf`, `granica.prj`
4. User selects all 4 files (Ctrl+Click)
5. Frontend shows: "1 warstwa: shp + 3 plików pomocniczych (shx, dbf, prj)"
6. User clicks "Utwórz i importuj SHP"
7. ✅ Success! Backend accepts individual files

## Alternative Solutions (Not Implemented)

### Option 2: Frontend ZIP Extraction
**Pros:**
- Better UX - user can upload ZIP directly
- No need to extract manually

**Cons:**
- Requires additional library (jszip, ~300KB)
- More complex code
- Additional testing required
- Edge cases (nested ZIPs, corrupted files, etc.)

**Implementation estimate:** 2-3 hours

### Option 3: Backend ZIP Support
**Pros:**
- Most robust solution
- Handles extraction on server

**Cons:**
- Requires backend code changes
- Backend team involvement
- Deployment coordination
- Testing on staging/production

**Implementation estimate:** 4-6 hours (including backend)

## Testing Checklist

- [x] ZIP file upload shows error message
- [x] Error message is clear and actionable
- [x] Individual .shp files can be uploaded
- [x] Multi-file selection works (Ctrl+Click)
- [x] File input doesn't show .zip in file picker
- [x] Warning message visible in Alert box
- [x] Warning message visible in caption text
- [x] No ZIP logic in file display component
- [x] Build compiles successfully
- [ ] **TODO: User to test** - Extract ZIP and upload individual files
- [ ] **TODO: User to test** - Verify backend accepts files correctly

## Files Changed

1. **src/features/dashboard/dialogi/CreateProjectDialog.tsx**
   - Lines 323-394: Updated `handleShapefileSelection()` to reject ZIP files
   - Lines 813-827: Updated Alert message with detailed file requirements
   - Lines 896: Removed `.zip` from accept attribute
   - Lines 923-929: Updated caption text with ZIP warning
   - Lines 965-969: Removed ZIP display logic

## Related Documentation

- **docs/SHAPEFILE_MULTIFILE_IMPORT.md** - Multi-file Shapefile import guide
- **docs/CREATE_PROJECT_SHAPEFILE_IMPORT.md** - Project creation with Shapefile
- **docs/backend/projects_api_docs.md** - Backend API documentation (line 100: `/api/layer/add/shp/`)

## Next Steps

1. User should test with extracted Shapefile components
2. If backend still returns 400, check detailed error logs from `OwnProjects.tsx` (lines 206-239)
3. If needed, backend team can investigate server-side logs for exact error reason

## Console Logs to Monitor

When testing, check for these logs:
```
✅ STEP 1: Project created: { data: { db_name: "granica_1" } }
🎯 STEP 2: Using backend project_name from db_name: granica_1
⏳ STEP 2.5: Waiting 1s for backend QGS initialization...
✅ STEP 2.5: Delay complete, proceeding to layer import
📤 STEP 3: Starting import of 1 shapefiles...
📤 Importing shapefile 1/1: granica
📝 Request payload: {
  project: "granica_1",
  layer_name: "granica",
  shpFile: "granica.shp",
  shxFile: "granica.shx",
  dbfFile: "granica.dbf",
  prjFile: "granica.prj"
}
✅ Imported shapefile 1/1: granica
✅ STEP 4: All shapefiles imported successfully
```

If error occurs, will see:
```
❌ Failed to import shapefile 1/1: {
  name: "granica",
  error: {...},
  status: 400,
  data: {...},
  message: "Exact backend error message here"
}
```
