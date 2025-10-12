# Create Project Dialog - Shapefile Multi-File Import

## Overview

This document describes the improvements made to the "Importuj Shapefile" tab in the Create Project Dialog (`CreateProjectDialog.tsx`). The dialog now supports full drag & drop functionality and provides better visual feedback when selecting multiple Shapefile components.

## Problem Statement

**User Request:**
> "a w tym oknie też możesz zrobić porządek żeby tworzyć projekt z warstwy shp w ten sposób że można wiele plików przesłać nie tylko jeden ?"

**Issue:**
- Dialog had `multiple` attribute on file input but no drag & drop
- No visual feedback when dragging files
- Limited information about selected files (didn't show supporting files)

## Implementation Changes

### 1. New Drag & Drop Handlers

Added dedicated handlers for Shapefile tab (separate from QGIS tab):

```typescript
// Drag & drop handlers for Shapefile tab
const handleDragEnterShp = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  if (!isImportingShp) {
    setIsDraggingShp(true);
  }
};

const handleDragOverShp = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDragLeaveShp = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDraggingShp(false);
};

const handleDropShp = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDraggingShp(false);

  if (isImportingShp) return;

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    handleShapefileSelection(files);
  }
};
```

### 2. Enhanced Drag & Drop Zone

Updated the file upload zone with visual feedback and hover effects:

```tsx
<Box
  onDragEnter={handleDragEnterShp}
  onDragOver={handleDragOverShp}
  onDragLeave={handleDragLeaveShp}
  onDrop={handleDropShp}
  sx={{
    border: isDraggingShp
      ? `2px dashed ${theme.palette.primary.main}`
      : '2px dashed #d1d5db',
    borderRadius: '8px',
    bgcolor: isDraggingShp
      ? 'rgba(247, 94, 76, 0.05)'
      : 'white',
    p: 3,
    textAlign: 'center',
    cursor: isImportingShp ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: isImportingShp ? '#d1d5db' : theme.palette.primary.main,
      bgcolor: isImportingShp ? 'white' : 'rgba(247, 94, 76, 0.02)',
    },
  }}
>
  {/* Icon, text, and button */}
</Box>
```

**Visual States:**
- **Default**: Gray dashed border, white background
- **Hover**: Primary color border, light background
- **Dragging**: Primary color border, accent background
- **Disabled** (during import): Gray border, no cursor change

### 3. Improved File List Display

Enhanced the file list to show more details about each Shapefile:

```tsx
{shapefiles.map((shp, index) => {
  // Count supporting files
  const supportingFiles = [
    shp.shxFile && 'shx',
    shp.dbfFile && 'dbf',
    shp.prjFile && 'prj',
    shp.cpgFile && 'cpg',
    shp.qpjFile && 'qpj',
  ].filter(Boolean);

  return (
    <Box key={index}>
      <Typography variant="body2" fontWeight={600}>
        {shp.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {shp.shpFile.name.endsWith('.zip')
          ? `ZIP (${(shp.shpFile.size / 1024).toFixed(1)} KB)`
          : supportingFiles.length > 0
          ? `shp + ${supportingFiles.length} plików pomocniczych (${supportingFiles.join(', ')})`
          : 'tylko .shp (zalecane: dodaj .shx, .dbf, .prj)'}
      </Typography>
    </Box>
  );
})}
```

**Display Examples:**

1. **ZIP file:**
   ```
   📄 dzialki
      ZIP (125.3 KB)
   ```

2. **Complete Shapefile:**
   ```
   📄 dzialki
      shp + 4 plików pomocniczych (shx, dbf, prj, cpg)
   ```

3. **Incomplete Shapefile:**
   ```
   📄 dzialki
      tylko .shp (zalecane: dodaj .shx, .dbf, .prj)
   ```

### 4. Better User Guidance

Updated help text to be more informative:

```
Obsługiwane formaty: .zip, .shp, .shx, .dbf, .prj, .cpg, .qpj
Możesz wybrać wiele plików jednocześnie (Ctrl+Click)
```

## User Workflow

### Step 1: Open Dialog
User clicks "Utwórz i importuj QGS" button in Dashboard.

### Step 2: Select "Importuj SHP" Tab
User clicks the third tab "Importuj SHP" with Map icon.

### Step 3: Upload Files

**Option A: Drag & Drop**
1. User drags multiple Shapefile components from file explorer
2. Drop zone highlights with primary color when files are over it
3. User drops files
4. System groups files by base name (e.g., "layer.shp", "layer.shx" → one layer)

**Option B: File Picker**
1. User clicks "Wybierz pliki z komputera" button
2. File picker opens with `multiple` enabled
3. User selects files with Ctrl+Click or Shift+Click
4. System groups files by base name

### Step 4: Review Selected Files

Dialog displays list of layers with details:

```
Wybrane warstwy (2):

📄 dzialki
   shp + 4 plików pomocniczych (shx, dbf, prj, cpg)

📄 budynki
   tylko .shp (zalecane: dodaj .shx, .dbf, .prj)
```

User can:
- Remove individual layers with X button
- Add more files by clicking button or dragging again
- See which supporting files are present

### Step 5: Fill Project Details

- **Nazwa projektu**: Auto-generated from first layer name (editable)
- **Domena**: User enters subdomain (required)
- **Opis**: Optional description (max 100 chars)

### Step 6: Import

User clicks "Utwórz i importuj SHP" button.

**System:**
1. Creates new project with given name and domain
2. Imports each Shapefile as separate layer
3. Shows progress: "⚙️ Importowanie warstwy 1 z 2..."
4. Success: Redirects to project map view

## File Grouping Logic

The dialog automatically groups files by base name:

```typescript
const fileGroups: { [baseName: string]: { [ext: string]: File } } = {};

Array.from(files).forEach((file) => {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // Handle ZIP files
  if (extension === 'zip') {
    const baseName = fileName.replace(/\.zip$/i, '');
    fileGroups[baseName]['zip'] = file;
    return;
  }

  // Handle individual shapefile components
  if (['shp', 'shx', 'dbf', 'prj', 'cpg', 'qpj'].includes(extension)) {
    const baseName = fileName.replace(/\.(shp|shx|dbf|prj|cpg|qpj)$/i, '');
    fileGroups[baseName][extension] = file;
  }
});
```

**Example:**

**Input files:**
- `dzialki.shp`
- `dzialki.shx`
- `dzialki.dbf`
- `dzialki.prj`
- `budynki.shp`
- `budynki.dbf`

**Grouped result:**
```javascript
{
  'dzialki': {
    shpFile: File('dzialki.shp'),
    shxFile: File('dzialki.shx'),
    dbfFile: File('dzialki.dbf'),
    prjFile: File('dzialki.prj')
  },
  'budynki': {
    shpFile: File('budynki.shp'),
    dbfFile: File('budynki.dbf')
  }
}
```

## Visual Feedback Examples

### Drag & Drop States

**1. Default State:**
```
┌──────────────────────────────────────┐
│          📁 (gray icon)              │
│   Przeciągnij i upuść pliki Shapefile│
│              lub                      │
│     [Wybierz pliki z komputera]      │
│                                       │
│  Obsługiwane formaty: .zip, .shp...  │
│  Możesz wybrać wiele plików (Ctrl)   │
└──────────────────────────────────────┘
  Gray dashed border, white background
```

**2. Hover State:**
```
┌──────────────────────────────────────┐
│     📁 (primary color icon)          │
│   Przeciągnij i upuść pliki Shapefile│
│              lub                      │
│     [Wybierz pliki z komputera]      │
│                                       │
│  Obsługiwane formaty: .zip, .shp...  │
│  Możesz wybrać wiele plików (Ctrl)   │
└──────────────────────────────────────┘
Primary color border, light background
```

**3. Dragging State:**
```
┌──────────────────────────────────────┐
│     📁 (primary color icon)          │
│        Upuść pliki tutaj             │
│              lub                      │
│     [Wybierz pliki z komputera]      │
│                                       │
│  Obsługiwane formaty: .zip, .shp...  │
│  Możesz wybrać wiele plików (Ctrl)   │
└──────────────────────────────────────┘
Primary color dashed border, accent bg
```

### File List Display

```
Wybrane warstwy (3):

┌────────────────────────────────────┐
│ 📄  dzialki                     × │
│     shp + 4 pomocniczych (shx...)  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📄  budynki                     × │
│     tylko .shp (zalecane: dodaj..) │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📄  parcels                     × │
│     ZIP (234.5 KB)                 │
└────────────────────────────────────┘
```

## Comparison: Before vs After

### Before
- ✅ File input with `multiple` attribute
- ❌ No drag & drop
- ❌ No visual feedback when dragging
- ❌ Simple file list (only name)
- ❌ No indication of supporting files

### After
- ✅ File input with `multiple` attribute
- ✅ Full drag & drop support
- ✅ Visual feedback (border color, background, icon color)
- ✅ Detailed file list (name + supporting files)
- ✅ File size display for ZIP files
- ✅ Warning when missing supporting files
- ✅ Better user guidance (Ctrl+Click hint)

## Testing Checklist

### Drag & Drop
- [ ] Drag single .shp file → Should accept and display
- [ ] Drag multiple .shp files → Should group and display all
- [ ] Drag .shp + .shx + .dbf + .prj → Should group into one layer
- [ ] Drag .zip file → Should accept and display as ZIP
- [ ] Drag unsupported file (.txt) → Should ignore
- [ ] Drag files while importing → Should not accept (disabled)
- [ ] Hover over drop zone → Should show visual feedback
- [ ] Drag leave drop zone → Should remove visual feedback

### File Selection
- [ ] Click "Wybierz pliki" → Should open file picker
- [ ] Select single file with picker → Should add to list
- [ ] Select multiple files with Ctrl+Click → Should add all to list
- [ ] Select multiple files with Shift+Click → Should add all to list
- [ ] Select files twice → Should append to existing list

### File Grouping
- [ ] Upload `layer.shp` and `layer.shx` → Should group as one layer
- [ ] Upload `a.shp` and `b.shp` → Should create two layers
- [ ] Upload `layer.shp` only → Should show warning "tylko .shp"
- [ ] Upload `layer.zip` → Should display "ZIP (X KB)"

### File List Display
- [ ] Complete Shapefile (shp+shx+dbf+prj) → Should show "shp + 3 plików pomocniczych"
- [ ] Incomplete Shapefile (shp only) → Should show "tylko .shp (zalecane...)"
- [ ] ZIP file → Should show "ZIP (X KB)"
- [ ] Click X button → Should remove layer from list
- [ ] Remove all layers → Should hide file list

### Import Process
- [ ] Fill form and click "Utwórz i importuj SHP" → Should start import
- [ ] During import → Progress bar shows "Importowanie warstwy X z Y"
- [ ] After success → Should close dialog and redirect to map
- [ ] After error → Should show error message in alert

## Related Files

1. **CreateProjectDialog.tsx** (Modified)
   - Added drag & drop handlers for Shapefile tab
   - Enhanced file list display
   - Improved user guidance

2. **ImportLayerModal.tsx** (Modified separately)
   - Similar multi-file support for existing projects
   - See [SHAPEFILE_MULTIFILE_IMPORT.md](./SHAPEFILE_MULTIFILE_IMPORT.md)

3. **OwnProjects.tsx** (Parent component)
   - Calls `onImportShapefile` handler
   - Creates project and imports layers

## Known Limitations

1. **No ZIP preview** - User can't see contents of ZIP before import
2. **No file size validation** - Large files may cause upload timeout
3. **No duplicate detection** - Same file can be added multiple times
4. **No EPSG field** - User can't specify projection (backend auto-detects from .prj)

## Future Improvements

1. **ZIP file inspection** - Show contents of ZIP before import
2. **File size warnings** - Warn if total size exceeds limit
3. **Duplicate file detection** - Prevent adding same file twice
4. **EPSG override field** - Allow manual projection specification
5. **Batch remove button** - Clear all selected files at once
6. **Preview layer extent** - Show approximate map bounds
7. **Auto-merge groups** - If user selects files in multiple batches, auto-merge by name
8. **Validation before import** - Check if .shp files are valid before uploading

## Support

If you encounter issues with Shapefile import in Create Project Dialog:

1. **Check browser console** for error messages
2. **Check network tab** for failed uploads
3. **Verify file names** - All related files must have same base name
4. **Check file sizes** - Individual files should be < 10MB
5. **Try ZIP format** - If individual files don't work, try ZIP

## Related Documentation

- [SHAPEFILE_MULTIFILE_IMPORT.md](./SHAPEFILE_MULTIFILE_IMPORT.md) - Multi-file import for existing projects
- [LAYER_MANAGEMENT.md](./LAYER_MANAGEMENT.md) - Complete layer management guide
- [Backend Projects API](./backend/projects_api_docs.md) - Backend endpoint documentation
