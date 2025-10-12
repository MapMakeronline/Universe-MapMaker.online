# Shapefile Multi-File Import Implementation

## Overview

This document describes the implementation of multi-file support for Shapefile imports. Previously, the modal only allowed uploading a single `.shp` file, which caused backend errors because Shapefiles require multiple component files.

## Problem Statement

**User Report:**
> "zaimportowałem plik shp ale nie wiem czy nie muszę dodać wszystkich shp,prj,shx... sprawdz jak działa endpoint żebym mógł dodać całą warstwe wszystkie potrzbene pliki"

**Issue:**
- User uploaded only `.shp` file
- Backend returned 400 Bad Request
- Modal had `multiple` attribute but only stored single file in state

## Shapefile Format Requirements

### Required Files
- `.shp` - Main shape geometry file (REQUIRED)

### Optional But Recommended Files
- `.shx` - Shape index file (improves performance)
- `.dbf` - Attribute database file (contains feature attributes)
- `.prj` - Projection information (coordinate system)
- `.cpg` - Character encoding specification
- `.qpj` - QGIS projection information

### Additional Optional Files
Backend also accepts:
- `.qix` - QGIS spatial index
- `.sbn`, `.sbx` - ArcGIS spatial index
- `.atx`, `.ixs`, `.mxs` - Additional index files
- `.xml` - Metadata

## Implementation Changes

### 1. ImportLayerModal.tsx

#### State Management
```typescript
// BEFORE: Only single file
const [selectedFile, setSelectedFile] = useState<File | null>(null);

// AFTER: Support both single and multiple files
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null); // Multiple files for Shapefile
```

#### File Selection Handler
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    if (selectedFormat === 'shp') {
      // For Shapefile, store all files
      setSelectedFiles(files);
      setSelectedFile(null);
    } else {
      // For other formats, store single file
      setSelectedFile(files[0]);
      setSelectedFiles(null);
    }
  }
};
```

#### Drag & Drop Handler
```typescript
const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    if (selectedFormat === 'shp') {
      // For Shapefile, store all files
      setSelectedFiles(files);
      setSelectedFile(null);
    } else {
      // For other formats, store single file
      setSelectedFile(files[0]);
      setSelectedFiles(null);
    }
  }
}, [selectedFormat]);
```

#### Submit Handler
```typescript
const handleSubmit = () => {
  // ... validation ...

  onSubmit({
    nazwaWarstwy: formData.nazwaWarstwy,
    nazwaGrupy: formData.nazwaGrupy,
    format: selectedFormat,
    file: selectedFile,
    files: selectedFiles, // Pass multiple files for Shapefile
    epsg: selectedFormat === 'shp' ? formData.epsg : undefined,
  });

  // Reset form
  setSelectedFile(null);
  setSelectedFiles(null); // Clear multiple files
  // ...
};
```

#### Validation
```typescript
const isSubmitDisabled = () => {
  if (selectedFormat === 'WMS' || selectedFormat === 'WFS') {
    return availableLayers.length === 0;
  }

  // For Shapefile, check if files are selected, otherwise check single file
  const hasFile = selectedFormat === 'shp'
    ? (selectedFiles !== null && selectedFiles.length > 0)
    : (selectedFile !== null);

  return !formData.nazwaWarstwy.trim() || !hasFile;
};
```

#### UI Display (Multiple Files)
```typescript
{selectedFormat === 'shp' && selectedFiles && selectedFiles.length > 0 ? (
  <Box>
    <Typography sx={{ fontSize: '14px', color: theme.palette.primary.main, mb: 1, fontWeight: 600 }}>
      Wybrane pliki ({selectedFiles.length}):
    </Typography>
    {Array.from(selectedFiles).map((file, index) => (
      <Typography key={index} sx={{ fontSize: '13px', color: theme.palette.text.primary, mb: 0.5 }}>
        {file.name}
      </Typography>
    ))}
  </Box>
) : selectedFile ? (
  <Typography sx={{ fontSize: '14px', color: theme.palette.primary.main, mb: 0.5 }}>
    {selectedFile.name}
  </Typography>
) : (
  <Typography sx={{ fontSize: '14px', color: theme.palette.primary.main, mb: 0.5 }}>
    {`Upuść ${selectedFormat === 'shp' ? 'pliki' : 'plik'} tutaj lub kliknij, aby wybrać z dysku (${getFileExtension()})`}
  </Typography>
)}
```

### 2. LeftPanel.tsx - handleImportLayer

#### Type Definition
```typescript
const handleImportLayer = async (data: {
  nazwaWarstwy: string;
  nazwaGrupy: string;
  format: string;
  file?: File;
  files?: FileList | null; // NEW: Multiple files for Shapefile
  epsg?: string;
}) => {
  // ...
}
```

#### Validation
```typescript
// Validation
if (data.format === 'shp') {
  // For Shapefile, check if files (multiple) are provided
  if (!data.files || data.files.length === 0) {
    dispatch(showError('Nie wybrano plików do importu (wymagane: .shp, .shx, .dbf)'));
    return;
  }
} else {
  // For other formats, check single file
  if (!data.file) {
    dispatch(showError('Nie wybrano pliku do importu'));
    return;
  }
}
```

#### File Extraction (Shapefile)
```typescript
case 'shp':
  // Extract files by extension from FileList
  const filesArray = Array.from(data.files || []);
  const shpFile = filesArray.find(f => f.name.toLowerCase().endsWith('.shp'));
  const shxFile = filesArray.find(f => f.name.toLowerCase().endsWith('.shx'));
  const dbfFile = filesArray.find(f => f.name.toLowerCase().endsWith('.dbf'));
  const prjFile = filesArray.find(f => f.name.toLowerCase().endsWith('.prj'));
  const cpgFile = filesArray.find(f => f.name.toLowerCase().endsWith('.cpg'));
  const qpjFile = filesArray.find(f => f.name.toLowerCase().endsWith('.qpj'));

  if (!shpFile) {
    throw new Error('Plik .shp jest wymagany');
  }

  console.log('📥 Importing Shapefile layer:', {
    project: projectName,
    layerName: data.nazwaWarstwy,
    files: filesArray.map(f => f.name),
    epsg: data.epsg,
  });

  // Backend expects "project" not "project_name"
  await addShapefileLayer({
    project: projectName,
    layer_name: data.nazwaWarstwy,
    shpFile,
    shxFile,
    dbfFile,
    prjFile,
    cpgFile,
    qpjFile,
    epsg: data.epsg,
  }).unwrap();
  break;
```

### 3. Backend API (layersApi.ts)

Backend already supports all Shapefile files via FormData (no changes needed):

```typescript
addShapefileLayer: builder.mutation<
  { success: boolean; message?: string; data?: any },
  AddShpLayerData
>({
  query: (data) => {
    const formData = new FormData();
    formData.append('project', data.project);
    formData.append('layer_name', data.layer_name);
    formData.append('shp', data.shpFile);

    // Add optional supporting files
    if (data.shxFile) formData.append('shx', data.shxFile);
    if (data.dbfFile) formData.append('dbf', data.dbfFile);
    if (data.prjFile) formData.append('prj', data.prjFile);
    if (data.cpgFile) formData.append('cpg', data.cpgFile);
    if (data.qpjFile) formData.append('qpj', data.qpjFile);

    if (data.epsg) formData.append('epsg', data.epsg);
    if (data.encoding) formData.append('encoding', data.encoding);

    return {
      url: '/api/layer/add/shp/',
      method: 'POST',
      body: formData,
    };
  },
  invalidatesTags: (result, error, arg) => [
    { type: 'Layers', id: arg.project },
    { type: 'Layers', id: 'LIST' },
  ],
}),
```

## User Workflow

### Step 1: Open Import Modal
User clicks "Importuj warstwę" button in LeftPanel toolbar.

### Step 2: Select Shapefile Format
User clicks "shp" tab in modal.

### Step 3: Fill Form
- **Nazwa warstwy**: User enters layer name (e.g., "Działki")
- **Nazwa grupy**: User selects group or "Stwórz poza grupami"
- **EPSG**: User enters EPSG code (default: 3857) OR includes .prj file

### Step 4: Upload Multiple Files
User can either:
- Click upload box and select multiple files (Ctrl+Click or Shift+Click)
- Drag & drop multiple files into upload box

**Modal displays selected files:**
```
Wybrane pliki (6):
dzialki.shp
dzialki.shx
dzialki.dbf
dzialki.prj
dzialki.cpg
dzialki.qpj
```

### Step 5: Import
User clicks "Import" button.

**Frontend:**
1. Validates that at least .shp file is present
2. Extracts files by extension
3. Sends all files to backend via FormData

**Backend:**
1. Receives files via multipart/form-data
2. Validates geometry
3. Imports to PostGIS
4. Updates project tree.json
5. Returns success/error response

**Frontend (after response):**
1. Shows success notification: "Warstwa 'Działki' została zaimportowana!"
2. RTK Query invalidates cache
3. Project data refetches automatically
4. Layer tree updates with new layer

## Console Logs (Success)

```
📥 Importing Shapefile layer: {
  project: "my-project",
  layerName: "Działki",
  files: ["dzialki.shp", "dzialki.shx", "dzialki.dbf", "dzialki.prj"],
  epsg: "2180"
}
✅ Layer imported successfully
```

## Console Logs (Error)

```
📥 Importing Shapefile layer: { ... }
❌ Failed to import layer: Error: Network error
```

**User sees notification:**
"Nie udało się zaimportować warstwy: Network error"

## Testing Checklist

- [ ] Test with only .shp file → Should import successfully
- [ ] Test with .shp + .shx + .dbf → Should import with attributes
- [ ] Test with .shp + .prj → Should import with correct projection
- [ ] Test with .shp + .cpg → Should import with correct character encoding
- [ ] Test with all files (.shp, .shx, .dbf, .prj, .cpg, .qpj) → Should import completely
- [ ] Test with no .shp file → Should show error "Plik .shp jest wymagany"
- [ ] Test drag & drop multiple files → Should display all files
- [ ] Test file selection with Ctrl+Click → Should display all files
- [ ] Test switching from shp to geoJSON tab → Should clear selectedFiles
- [ ] Test cancel button → Should clear selectedFiles and close modal

## Files Changed

1. **src/features/warstwy/modale/ImportLayerModal.tsx**
   - Added `selectedFiles` state
   - Updated `handleFileSelect` to store multiple files for Shapefile
   - Updated `handleDrop` to store multiple files for Shapefile
   - Updated `handleSubmit` to pass `files` to parent
   - Updated `isSubmitDisabled` to check multiple files for Shapefile
   - Updated UI to display all selected files for Shapefile

2. **src/features/warstwy/komponenty/LeftPanel.tsx**
   - Updated `handleImportLayer` type to accept `files?: FileList | null`
   - Updated validation to check `data.files` for Shapefile
   - Added file extraction logic (by extension)
   - Updated `addShapefileLayer` call with all extracted files

3. **docs/SHAPEFILE_MULTIFILE_IMPORT.md** (NEW)
   - Complete implementation documentation

## Related Documentation

- [LAYER_MANAGEMENT.md](./LAYER_MANAGEMENT.md) - Complete layer management guide
- [Backend Projects API](./backend/projects_api_docs.md) - Backend endpoint documentation
- [RTK Query API](../src/redux/api/layersApi.ts) - Frontend API integration

## Known Limitations

1. **No ZIP support** - User must select individual files, not ZIP archive
2. **No validation of required files** - Backend validates, not frontend
3. **No preview** - User can't preview file contents before import
4. **No duplicate detection** - If file already exists, backend may overwrite

## Future Improvements

1. **ZIP file support** - Allow users to upload single .zip file containing all Shapefile components
2. **Frontend validation** - Check for required files (.shx, .dbf) before uploading
3. **File size warnings** - Show warning if files are very large (>10MB)
4. **Preview feature** - Show layer extent/attribute count before import
5. **Drag & drop multiple folders** - Support dragging entire folder containing Shapefile components
6. **Automatic EPSG detection** - Read EPSG from .prj file and pre-fill field
7. **Progress bar** - Show upload progress for large files
8. **Duplicate layer detection** - Warn user if layer name already exists

## Support

If you encounter issues with Shapefile import:

1. **Check backend logs:**
   ```bash
   gcloud logging read "resource.type=gce_instance" --limit=50
   ```

2. **Check network tab in DevTools:**
   - Verify all files are being sent in FormData
   - Check response status and error message

3. **Check console logs:**
   - Look for "📥 Importing Shapefile layer" log
   - Check if all file names are listed
   - Look for error messages

4. **Common backend errors:**
   - 400 Bad Request: Missing required file (.shp)
   - 413 Payload Too Large: Files exceed upload limit (100MB)
   - 500 Internal Server Error: Invalid geometry or corrupted file
