# Layer Management - Database Integration

## Overview

Complete database synchronization for layer management operations. All changes to layers are persisted in PostgreSQL and project tree.json, ensuring data integrity across sessions.

**Date Implemented:** 2025-01-12

**File:** [src/features/warstwy/komponenty/LeftPanel.tsx](../src/features/warstwy/komponenty/LeftPanel.tsx)

## Features Implemented

### ✅ 1. Layer Visibility Sync ([Details](./LAYER_VISIBILITY_SYNC.md))

**Endpoint:** `POST /api/layer/selection`

**Functionality:**
- Individual layers: sync to backend
- Group layers: cascade to children (Redux only)
- Optimistic updates with auto-rollback on error

**User Experience:**
```
User clicks eye icon → Instant toggle → Background sync → Persists after reload
```

---

### ✅ 2. Import Layer (GeoJSON, Shapefile, GML)

**Endpoints:**
- `POST /api/layer/add/geojson/` - GeoJSON files
- `POST /api/layer/add/shp/` - Shapefiles (with support files)
- `POST /api/layer/add/gml/` - GML files

**Supported Formats:**
- **GeoJSON** (`.geojson`, `.json`) - Most common web format
- **Shapefile** (`.shp` + `.shx`, `.dbf`, `.prj`, `.cpg`) - ESRI standard
- **GML** (`.gml`) - Geography Markup Language

**Implementation:**
```typescript
const handleImportLayer = async (data) => {
  // 1. Validate inputs
  if (!projectName || !data.file || !data.nazwaWarstwy.trim()) {
    showError();
    return;
  }

  // 2. Close modal + show loading notification
  setImportLayerModalOpen(false);
  dispatch(showInfo(`Importowanie warstwy "${data.nazwaWarstwy}"...`));

  // 3. Route to appropriate backend endpoint
  switch (data.format) {
    case 'geoJSON':
      await addGeoJsonLayer({
        project_name: projectName,
        layer_name: data.nazwaWarstwy,
        geojson: data.file,
        epsg: data.epsg,
      }).unwrap();
      break;

    case 'shp':
      await addShapefileLayer({
        project: projectName,
        layer_name: data.nazwaWarstwy,
        shpFile: data.file,
        epsg: data.epsg,
      }).unwrap();
      break;

    case 'gml':
      await addGMLLayer({
        projectName,
        layerName: data.nazwaWarstwy,
        file: data.file,
      }).unwrap();
      break;
  }

  // 4. Success notification
  dispatch(showSuccess(`Warstwa "${data.nazwaWarstwy}" została zaimportowana!`));

  // 5. RTK Query auto-invalidates cache → layer tree updates automatically
};
```

**Backend Process:**
1. **Upload** - Receives file via FormData
2. **Validation** - Checks geometry validity
3. **Auto-Fix** - Fixes invalid geometries (ST_MakeValid)
4. **Import** - Inserts features into PostGIS table
5. **Metadata** - Creates Layer record in database
6. **Tree Update** - Updates project tree.json
7. **Styling** - Generates default layer style
8. **Response** - Returns success + layer name

**User Experience:**
```
User uploads file → Modal closes → "Importowanie..." toast → Success toast → Layer appears in tree
```

**Error Handling:**
- File validation errors (format, size, encoding)
- Geometry validation errors (invalid polygons, self-intersections)
- Database errors (duplicate layer name, connection issues)
- All errors show user-friendly toast notifications

---

### ✅ 3. Delete Layer

**Endpoint:** `POST /api/layer/remove/database`

**Functionality:**
- Deletes layer from PostGIS database
- Removes Layer record from database
- Updates project tree.json
- Cleans up layer styles and metadata
- Removes from Redux state

**Implementation:**
```typescript
const handleDeleteLayer = async () => {
  // 1. Validate
  if (!selectedLayer || !projectName) return;

  // 2. Don't allow deleting groups (for now)
  if (selectedLayer.type === 'group') {
    dispatch(showInfo('Usuwanie grup nie jest jeszcze obsługiwane'));
    return;
  }

  // 3. Show loading notification
  dispatch(showInfo(`Usuwanie warstwy "${layerName}"...`));

  // 4. Delete from backend FIRST
  await deleteLayerFromBackend({
    projectName,
    layerName,
  }).unwrap();

  // 5. Remove from Redux state (only after backend success)
  dispatch(deleteLayer(layerId));
  setSelectedLayer(null);

  // 6. Success notification
  dispatch(showSuccess(`Warstwa "${layerName}" została usunięta`));
};
```

**User Experience:**
```
User clicks delete → "Usuwanie..." toast → Backend deletes → Redux updates → Success toast
```

**Safety:**
- Backend deletion happens FIRST
- Redux state only updated on success
- If backend fails, layer stays in UI
- User can retry deletion

---

### ✅ 4. Layer Order Sync (Pre-existing)

**Endpoint:** `POST /api/projects/tree/order`

**Functionality:**
- Drag & drop reordering
- 500ms debounce for backend sync
- Updates tree.json hierarchy

**Implementation:**
```typescript
const handleDragDropMove = async (layerId, targetId, position) => {
  // 1. Optimistic update - Redux first
  dispatch(moveLayer({ layerId, targetId, position }));

  // 2. Debounced backend sync
  setTimeout(() => {
    syncLayerOrderWithBackend();
  }, 500);
};
```

---

## API Integration Summary

| Feature | Method | Endpoint | Redux Action | Cache Invalidation |
|---------|--------|----------|--------------|-------------------|
| **Visibility** | POST | `/api/layer/selection` | `toggleLayerVisibility` | `Layer` tag |
| **Import GeoJSON** | POST | `/api/layer/add/geojson/` | `loadLayers` | `Layers` + `LIST` |
| **Import Shapefile** | POST | `/api/layer/add/shp/` | `loadLayers` | `Layers` + `LIST` |
| **Import GML** | POST | `/api/layer/add/gml/` | `loadLayers` | `Layers` + `LIST` |
| **Delete** | POST | `/api/layer/remove/database` | `deleteLayer` | `Layer` + `Layers` + `LIST` |
| **Reorder** | POST | `/api/projects/tree/order` | `moveLayer` | `Project` tag |

---

## RTK Query Cache Strategy

**Automatic Invalidation:**
```typescript
// When layer is imported
invalidatesTags: [
  { type: 'Layers', id: projectName },
  { type: 'Layers', id: 'LIST' },
]

// When layer is deleted
invalidatesTags: [
  { type: 'Layer', id: `${projectName}-${layerName}` },
  { type: 'Layers', id: projectName },
  { type: 'Layers', id: 'LIST' },
]
```

**Benefits:**
- No manual refetch needed
- Layer tree updates automatically
- UI always shows latest data
- Prevents stale data issues

---

## Console Logs (Development)

**Import Success:**
```
📥 Importing layer: { project: "MyProject", layerName: "Buildings", format: "geoJSON", file: "buildings.geojson" }
✅ Layer imported successfully
```

**Delete Success:**
```
🗑️ Deleting layer: { project: "MyProject", layer: "Buildings" }
✅ Layer deleted from backend
```

**Visibility Toggle:**
```
👁️ Toggling layer visibility: Buildings → true
✅ Layer visibility synced to backend
```

**Error:**
```
❌ Failed to import layer: [error details]
```

---

## Testing Checklist

**Import Layer:**
- [ ] Import GeoJSON file
- [ ] Import Shapefile with all support files
- [ ] Import GML file
- [ ] Test with invalid geometry (should auto-fix)
- [ ] Test with duplicate layer name (should error)
- [ ] Test with large file (>10MB)
- [ ] Verify layer appears in tree after import
- [ ] Verify layer persists after page reload

**Delete Layer:**
- [ ] Delete individual layer
- [ ] Attempt to delete group (should show info message)
- [ ] Verify layer disappears from tree
- [ ] Verify layer deleted from backend (check database)
- [ ] Test error handling (disconnect backend)
- [ ] Verify layer persists after page reload if delete failed

**Visibility:**
- [ ] Toggle individual layer visibility
- [ ] Toggle group visibility (cascade)
- [ ] Verify visibility persists after reload
- [ ] Test error rollback (disconnect backend)

---

## Future Improvements

### 1. Multi-File Shapefile Upload
Currently, user must upload a single .shp file. Improve to support:
- Select multiple files at once (.shp, .shx, .dbf, .prj, .cpg)
- Or upload ZIP archive containing all files
- Backend already supports this via FormData fields

### 2. Import Progress Tracking
For large files (>10MB):
- Show upload progress bar
- Show processing progress (geometry validation, import)
- Cancel upload button

### 3. Batch Operations
- Import multiple layers at once
- Delete multiple selected layers
- Change visibility for multiple layers

### 4. Group Management
- Create new groups via API
- Delete groups (with option to move children or delete all)
- Rename groups

### 5. Undo/Redo
- Store layer operation history
- Undo last delete
- Redo last import

### 6. Layer Preview
- Show thumbnail/preview before import
- Display layer bounds on map
- Show attribute table preview

---

## Related Files

- [src/features/warstwy/komponenty/LeftPanel.tsx](../src/features/warstwy/komponenty/LeftPanel.tsx) - Main implementation
- [src/features/warstwy/modale/ImportLayerModal.tsx](../src/features/warstwy/modale/ImportLayerModal.tsx) - Import UI
- [src/redux/api/layersApi.ts](../src/redux/api/layersApi.ts) - 29 layer API endpoints
- [src/redux/api/projectsApi.ts](../src/redux/api/projectsApi.ts) - 26 project API endpoints
- [src/redux/slices/layersSlice.ts](../src/redux/slices/layersSlice.ts) - Redux state management

---

## Status

✅ **COMPLETED** - All core layer management features integrated with backend

**Implementation Date:** January 12, 2025

**Next Steps:** Implement group management, opacity sync, layer styling API
