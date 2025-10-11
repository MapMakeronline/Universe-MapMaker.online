# Layer Tree - Quick Reference

**Status:** ✅ 80% Complete | ⚠️ Modal Handlers TODO (Phase 4)

---

## 🎯 What Works

✅ **Redux state management** - Single source of truth
✅ **Drag & drop** - 3 positions (before/after/inside)
✅ **Backend persistence** - Auto-sync with 500ms debounce
✅ **Toast notifications** - Success/error feedback
✅ **Type safety** - Unified `LayerNode` type
✅ **Visibility toggle** - With cascade for groups
✅ **Expand/collapse** - Redux-managed state

---

## ⚠️ What Needs Work (Phase 4)

Modal handlers are currently **simplified placeholders**:

| Modal | Status | Action Needed |
|-------|--------|---------------|
| AddDatasetModal | ⚠️ Placeholder | Use RTK Query + Redux |
| AddNationalLawModal | ⚠️ Placeholder | Use RTK Query + Redux |
| AddLayerModal | ⚠️ Placeholder | Use RTK Query + Redux |
| ImportLayerModal | ⚠️ Placeholder | Handle file uploads |
| AddGroupModal | ⚠️ Placeholder | Create backend mutation |
| CreateConsultationModal | ⚠️ Placeholder | Use RTK Query + Redux |
| LayerManagerModal | ⚠️ Placeholder | Use RTK Query + Redux |
| PrintConfigModal | ⚠️ Placeholder | Use RTK Query + Redux |

**Current behavior:** Shows info toast "Feature coming soon"

---

## 🔧 How It Works

### Data Flow (Simple)

```
Backend (tree.json)
    ↓
Redux Store (layersSlice)
    ↓
LeftPanel (const layers = reduxLayers)
    ↓
LayerTree (renders hierarchy)
```

### User Interaction (Drag & Drop)

```
User drags layer
    ↓
Redux updates instantly (optimistic) ✅
    ↓
500ms delay → Backend API call
    ↓
Toast: "Kolejność warstw zapisana" ✅
```

---

## 📂 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `LeftPanel.tsx` | Main orchestration | 543 |
| `LayerTree.tsx` | Recursive rendering | 672 |
| `useDragDrop.ts` | Drag & drop logic | 368 |
| `layersSlice.ts` | Redux state | 330 |

---

## 🚀 Redux Actions

```typescript
// Drag & drop
dispatch(moveLayer({ layerId, targetId, position }));

// Visibility
dispatch(toggleLayerVisibility(layerId));
dispatch(toggleGroupVisibilityCascade(groupId)); // With children

// Expand/collapse
dispatch(toggleGroupExpanded(groupId));
dispatch(expandAllGroups());
dispatch(collapseAllGroups());

// Delete
dispatch(deleteLayer(layerId));
```

---

## 📡 Backend API

**Endpoint:** `POST /api/projects/tree/order`

**Request:**
```json
{
  "project_name": "my-project",
  "order": ["layer-1", "group-1", "layer-2"]
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 🔔 Notifications

```typescript
// Success (green, 3s)
dispatch(showSuccess('Kolejność warstw zapisana', 3000));

// Error (red, 6s)
dispatch(showError('Nie udało się zapisać', 6000));

// Info (blue, 6s)
dispatch(showInfo('Feature coming soon'));

// Warning (orange, 6s)
dispatch(showWarning('Careful!'));
```

---

## 🐛 Known Issues

1. **No rollback on error** - UI updates optimistically but doesn't rollback if backend fails
2. **Modal handlers incomplete** - Need Redux + Backend API integration (Phase 4)
3. **No virtualization** - Performance issues with 1000+ layers
4. **No keyboard navigation** - Not accessible
5. **No undo/redo** - Can't revert changes

---

## ✅ Completed Phases

| Phase | Feature | Commit | Status |
|-------|---------|--------|--------|
| 1 | Redux Single Source of Truth | 8a762d2 | ✅ Done |
| 2 | Backend Persistence | 5977f44 | ✅ Done |
| 5 | Toast Notifications | 3cd210c | ✅ Done |
| 3 | Type Unification | a80f773 | ✅ Done |
| 4 | Modal Handlers | - | ⚠️ TODO |

---

## 📝 Next Steps (Phase 4)

**Estimate:** 4-6 hours

1. Rewrite `handleAddLayer()` with RTK Query
2. Rewrite `handleImportLayer()` with file upload
3. Rewrite `handleAddGroup()` with backend API
4. Test all modals with real backend
5. Add proper error handling

**Example:**
```typescript
const handleAddLayer = async (data) => {
  try {
    await addGeoJsonLayer({
      project_name: projectName,
      layer_name: data.nazwaWarstwy,
      geojson: createEmptyGeoJSON(data.typGeometrii),
    }).unwrap();

    dispatch(showSuccess('Warstwa dodana', 3000));
    setAddLayerModalOpen(false);
  } catch (error) {
    dispatch(showError('Nie udało się dodać warstwy', 6000));
  }
};
```

---

## 📚 Full Documentation

See [LAYER-TREE-COMPLETE-GUIDE.md](./LAYER-TREE-COMPLETE-GUIDE.md) for detailed documentation.

---

**Last Updated:** 2025-01-11
**Version:** 1.0
**Status:** Core Complete ✅ | Modals TODO ⚠️
