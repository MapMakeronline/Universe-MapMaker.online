# Universal 3D Detection & Viewport Persistence - Implementation Guide

## Overview

This document describes the implementation of two major features:

1. **Universal 3D Layer Detection** - Automatically detects ALL 3D layers on the map, not just hardcoded '3d-buildings'
2. **Viewport Persistence** - Saves and restores map camera position between sessions using sessionStorage

---

## Feature 1: Universal 3D Layer Detection

### Problem

**Before:** The application hardcoded `layers: ['3d-buildings']` for 3D feature detection, which meant:
- ❌ Missed custom 3D layers with different names
- ❌ Couldn't detect user-added 3D buildings
- ❌ No support for custom 3D models (GLB/GLTF)

**After:** Universal detection automatically finds ALL 3D layers:
- ✅ Detects all `fill-extrusion` layers (buildings)
- ✅ Detects all `model` layers (custom 3D objects)
- ✅ Works with any layer naming convention
- ✅ Supports GLB/GLTF custom models

### Implementation

#### 1. Core Utility: `src/mapbox/3d-layer-detection.ts`

```typescript
import { detect3DLayers, has3DLayers, getExtrusionLayers, getModelLayers } from '@/mapbox/3d-layer-detection';

// Detect ALL 3D layers on map
const layers3D = detect3DLayers(map);
// Returns: ['3d-buildings', 'custom-buildings-1', 'tower-model', ...]

// Check if map has any 3D layers
const hasLayers = has3DLayers(map);
// Returns: true/false

// Get only building layers (fill-extrusion)
const buildings = getExtrusionLayers(map);
// Returns: ['3d-buildings', 'custom-buildings-1', ...]

// Get only model layers (GLB/GLTF)
const models = getModelLayers(map);
// Returns: ['tower-model', 'bridge-model', ...]
```

**Functions:**

- `detect3DLayers(map)` - Detects all 3D layers (extrusion + model)
- `is3DLayer(map, layerId)` - Checks if specific layer is 3D
- `getExtrusionLayers(map)` - Gets all fill-extrusion layers
- `getModelLayers(map)` - Gets all model layers
- `queryAll3DFeatures(map, point, tolerance)` - Query features from ALL 3D layers
- `get3DLayerStats(map)` - Get statistics about 3D layers
- `has3DLayers(map)` - Quick check if map has 3D layers

#### 2. Updated 3D Picking: `src/mapbox/3d-picking.ts`

**Changes:**

```typescript
// OLD (hardcoded):
const features = map.queryRenderedFeatures(bbox, {
  layers: ['3d-buildings'] // ❌ Only one layer!
});

// NEW (universal):
import { detect3DLayers } from './3d-layer-detection';

const layers3D = detect3DLayers(map); // ✅ All 3D layers!
const features = map.queryRenderedFeatures(bbox, {
  layers: layers3D
});
```

**Key improvements:**

- Dynamic tolerance based on camera pitch
- Distance-based sorting (closest feature first)
- Works with ANY 3D layer names
- Detailed logging for debugging

#### 3. Updated IdentifyTool: `src/features/mapa/komponenty/IdentifyTool.tsx`

**Changes:**

```typescript
// Check if map has ANY 3D layers (not just '3d-buildings')
const mapHas3DLayers = has3DLayers(map);
const layers3D = mapHas3DLayers ? detect3DLayers(map) : [];

// Use universal 3D picking
const building3DFeatures = mapHas3DLayers
  ? query3DBuildingsAtPoint(map, e.point, 12)
  : [];

// Filter out ALL 3D layers from regular features
const regularFeatures = queriedFeatures.filter(f => {
  const layerId = f.layer?.id;
  if (!layerId) return true;
  return !layers3D.includes(layerId); // ✅ Universal filtering
});
```

**Benefits:**

- Automatically detects user-added 3D layers
- No need to update code when adding new 3D layers
- Works with custom GLB/GLTF models
- Prevents duplicate feature detection

---

## Feature 2: Viewport Persistence

### Problem

**Before:** Map viewport (camera position) was lost on page reload:
- ❌ User navigates to dashboard → viewport lost
- ❌ User reloads page → viewport reset to default
- ❌ User switches projects → camera position not saved

**After:** Viewport automatically saved and restored:
- ✅ Viewport saved every 10 seconds (auto-save)
- ✅ Viewport saved on page close/navigate
- ✅ Viewport restored on page load (within 5 minutes)
- ✅ Project-specific viewport (different projects = different viewports)
- ✅ Expires after 5 minutes (prevents stale camera positions)

### Implementation

#### 1. Core Utility: `src/mapbox/viewport-persistence.ts`

```typescript
import { saveViewport, loadViewport, autoSaveViewport, clearViewport } from '@/mapbox/viewport-persistence';

// Save viewport manually
saveViewport('MyProject', {
  longitude: 21.0122,
  latitude: 52.2297,
  zoom: 12,
  bearing: 0,
  pitch: 45
});

// Load saved viewport (returns null if expired/not found)
const savedViewport = loadViewport('MyProject');
if (savedViewport) {
  dispatch(setViewState(savedViewport));
}

// Auto-save viewport every 10 seconds
const cleanup = autoSaveViewport(
  'MyProject',
  () => currentViewState,
  10000 // 10 seconds
);

// Clear viewport (logout/project switch)
clearViewport();
```

**Functions:**

- `saveViewport(projectName, viewState)` - Save viewport to sessionStorage
- `loadViewport(projectName)` - Load viewport from sessionStorage
- `clearViewport()` - Clear saved viewport
- `autoSaveViewport(projectName, getViewState, interval)` - Auto-save with interval
- `getViewportExpiryTime()` - Get remaining time before expiry (seconds)
- `hasStoredViewport()` - Check if viewport is saved
- `getStoredViewportInfo()` - Get viewport metadata (age, expires in)

**Storage mechanism:**

- Uses `sessionStorage` (cleared when tab closes)
- Expires after 5 minutes (prevents stale camera positions)
- Project-specific (different projects = different viewports)
- Lightweight (~100 bytes per viewport)

#### 2. MapContainer Integration: `src/features/mapa/komponenty/MapContainer.tsx`

**Changes:**

```typescript
interface MapContainerProps {
  children?: React.ReactNode;
  projectName?: string; // NEW: For viewport persistence
}

const MapContainer: React.FC<MapContainerProps> = ({ children, projectName }) => {
  // ... existing code ...

  // VIEWPORT PERSISTENCE: Load saved viewport on mount
  useEffect(() => {
    if (!projectName) return;

    const savedViewport = loadViewport(projectName);
    if (savedViewport) {
      dispatch(setViewState(savedViewport));
      mapLogger.log('✅ Restored viewport from sessionStorage:', savedViewport);
    }
  }, [projectName, dispatch]);

  // VIEWPORT PERSISTENCE: Auto-save viewport every 10 seconds
  useEffect(() => {
    if (!projectName) return;

    const cleanup = autoSaveViewport(
      projectName,
      () => viewState,
      10000 // 10 seconds
    );

    return cleanup;
  }, [projectName, viewState]);

  // VIEWPORT PERSISTENCE: Save on unmount (page close/navigate)
  useEffect(() => {
    return () => {
      if (projectName && viewState) {
        saveViewport(projectName, viewState);
        mapLogger.log('💾 Saved viewport on unmount');
      }
    };
  }, [projectName, viewState]);
};
```

#### 3. Map Page Update: `app/map/page.tsx`

**Changes:**

```typescript
export default function MapPage() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get('project');

  return (
    <MapContainer projectName={projectName || undefined} />
  );
}
```

---

## Feature 3: Custom 3D Models (GLB/GLTF)

### Overview

Support for adding custom 3D models (GLB/GLTF) to the map, with full control over position, scale, and rotation.

### Implementation

#### Core Utility: `src/mapbox/custom-3d-models.ts`

```typescript
import { addCustom3DModel, removeCustom3DModel, updateCustom3DModel } from '@/mapbox/custom-3d-models';

// Add a custom 3D model
addCustom3DModel(map, {
  id: 'tower-1',
  name: 'Custom Tower',
  modelUrl: 'https://example.com/models/tower.glb',
  position: [21.0122, 52.2297], // Warsaw
  scale: [1, 1, 1],
  rotation: [0, 0, 0],
  opacity: 1.0
});

// Update model properties
updateCustom3DModel(map, 'tower-1', {
  scale: [2, 2, 2], // Double size
  rotation: [0, 45, 0], // Rotate 45° around Y axis
  opacity: 0.8 // Semi-transparent
});

// Remove model
removeCustom3DModel(map, 'tower-1');

// List all custom models
const models = listCustom3DModels(map);
// Returns: ['tower-1', 'bridge-2', ...]
```

**Functions:**

- `addCustom3DModel(map, model)` - Add GLB/GLTF model to map
- `removeCustom3DModel(map, modelId)` - Remove model
- `updateCustom3DModel(map, modelId, updates)` - Update model properties
- `listCustom3DModels(map)` - List all custom models
- `getCustom3DModelInfo(map, modelId)` - Get model info
- `hasCustom3DModel(map, modelId)` - Check if model exists
- `addMultipleCustom3DModels(map, models)` - Batch add models
- `removeAllCustom3DModels(map)` - Remove all models

**Supported formats:**

- GLB (binary glTF)
- GLTF (JSON glTF with external assets)

**Requirements:**

- Mapbox GL JS v3.0+ (model layer support)
- Valid GLB/GLTF file URL (accessible from browser)

---

## Feature 4: 3D Objects Panel

### Overview

UI component to display and manage all 3D layers on the map.

### Implementation

#### Component: `src/features/warstwy/komponenty/Objects3DPanel.tsx`

```typescript
import Objects3DPanel from '@/features/warstwy/komponenty/Objects3DPanel';

// Add to LeftPanel.tsx
<Objects3DPanel />
```

**Features:**

- Automatically detects all 3D layers
- Displays building layers (fill-extrusion)
- Displays model layers (GLB/GLTF)
- Edit/delete actions for custom models
- Refreshes on map style change
- Collapsible accordion
- Badge with total count

**UI Structure:**

```
┌─ Obiekty 3D [3] ─────────────┐
│ Budynki 3D (2)               │
│ ├─ 3d-buildings              │
│ └─ custom-buildings-1        │
│                              │
│ Modele 3D (1)                │
│ └─ tower-1 [Edit] [Delete]  │
└──────────────────────────────┘
```

---

## Testing Guide

### Test 1: Universal 3D Detection

**Scenario:** Map has multiple 3D layers with different names

**Steps:**

1. Open map with 3D basemap (Full 3D mode)
2. Open browser console (F12)
3. Run detection:

```javascript
import { detect3DLayers, get3DLayerStats } from '@/mapbox/3d-layer-detection';

const map = window.mapInstance; // Get from MapContainer
const layers = detect3DLayers(map);
console.log('3D Layers:', layers);

get3DLayerStats(map);
```

**Expected result:**

```
🔍 Detected 3 3D layers: ["3d-buildings", "custom-layer-1", "model-tower-1"]

📊 3D Layer Statistics: {
  totalLayers: 3,
  extrusionLayers: 2,
  modelLayers: 1,
  layers: {
    extrusion: ["3d-buildings", "custom-layer-1"],
    model: ["model-tower-1"],
    all: ["3d-buildings", "custom-layer-1", "model-tower-1"]
  }
}
```

### Test 2: Viewport Persistence

**Scenario:** User navigates away and returns to map

**Steps:**

1. Open map: `http://localhost:3000/map?project=TestProject`
2. Move map, rotate, zoom to custom position
3. Wait 10 seconds (auto-save triggers)
4. Navigate to dashboard: `/dashboard`
5. Navigate back to map: `/map?project=TestProject`

**Expected result:**

```
✅ Restored viewport from sessionStorage: {
  longitude: 21.0122,
  latitude: 52.2297,
  zoom: 12.5,
  bearing: 45,
  pitch: 60
}
```

**Test 3: Viewport expiry**

1. Open map, move camera
2. Wait 10 seconds (auto-save)
3. Check expiry time:

```javascript
import { getViewportExpiryTime } from '@/mapbox/viewport-persistence';

const remaining = getViewportExpiryTime();
console.log(`Viewport expires in: ${remaining}s`);
```

4. Wait 6 minutes
5. Reload page

**Expected result:**

```
⏰ Viewport expired (> 5 minutes), using default
```

### Test 3: 3D Feature Picking

**Scenario:** Click on 3D building from ANY layer

**Steps:**

1. Open map with 3D buildings
2. Enable Identify tool (RightToolbar)
3. Click on building (from ANY 3D layer)

**Expected result:**

```
🔍 Identify: Universal 3D layer detection
  has3DLayers: true
  layerCount: 2
  layers: ["3d-buildings", "custom-buildings-1"]

🎯 3D Picking: Found 1 3D features, closest at 15.2px
  layers: ["3d-buildings", "custom-buildings-1"]
  closestFeature: {
    layer: "custom-buildings-1",
    sourceLayer: "building"
  }

✅ Building feature state updated
```

**Building modal should open with editable attributes!**

### Test 4: Custom 3D Model

**Scenario:** Add custom GLB model to map

**Steps:**

1. Open browser console
2. Add model:

```javascript
import { addCustom3DModel } from '@/mapbox/custom-3d-models';

const map = window.mapInstance;
addCustom3DModel(map, {
  id: 'test-tower',
  name: 'Test Tower',
  modelUrl: 'https://example.com/tower.glb', // Replace with valid URL
  position: [21.0122, 52.2297],
  scale: [1, 1, 1],
  rotation: [0, 0, 0]
});
```

3. Open Objects3DPanel in LeftPanel

**Expected result:**

```
✅ Added custom 3D model: Test Tower (test-tower)

Modele 3D (1)
└─ test-tower [Edit] [Delete]
```

### Test 5: Project-Specific Viewport

**Scenario:** Different projects have different viewports

**Steps:**

1. Open Project A: `/map?project=ProjectA`
2. Move to Warsaw (21.0122, 52.2297), zoom 12
3. Wait 10 seconds
4. Open Project B: `/map?project=ProjectB`
5. Move to Krakow (19.9450, 50.0647), zoom 14
6. Wait 10 seconds
7. Return to Project A

**Expected result:**

```
// Project A
✅ Restored viewport: Warsaw (21.0122, 52.2297), zoom 12

// Project B
🔄 Different project, using default viewport
(Then loads Krakow after viewport persistence saves)

// Back to Project A
✅ Restored viewport: Warsaw (21.0122, 52.2297), zoom 12
```

---

## Debugging

### Console Logs

All features use `mapLogger` for detailed logging:

**3D Detection:**

```
🔍 Detected 2 3D layers: ["3d-buildings", "custom-layer"]
🎯 3D Picking: Found 1 3D features, closest at 12.5px
📊 3D Layer Statistics: {...}
```

**Viewport Persistence:**

```
💾 Saved viewport to sessionStorage: {...}
✅ Restored viewport from sessionStorage: {...}
⏰ Viewport expired (> 5 minutes), using default
🔄 Started auto-save viewport (interval: 10s)
⏹️ Stopped auto-save viewport
```

**Custom Models:**

```
✅ Added custom 3D model: Tower (tower-1)
✅ Updated 3D model: tower-1
✅ Removed custom 3D model: tower-1
📋 Found 2 custom 3D models: ["tower-1", "bridge-2"]
```

### sessionStorage Inspection

**Chrome DevTools:**

1. Open DevTools (F12)
2. Go to Application tab
3. Expand Storage → Session Storage → localhost:3000
4. Find key: `mapbox_viewport`

**Value format:**

```json
{
  "viewState": {
    "longitude": 21.0122,
    "latitude": 52.2297,
    "zoom": 12,
    "bearing": 0,
    "pitch": 45
  },
  "timestamp": 1704643200000,
  "projectName": "TestProject"
}
```

---

## Performance Considerations

### 3D Detection

- **Impact:** Minimal (runs once per style change)
- **Optimization:** Results cached until style changes
- **Cost:** ~1-2ms for typical maps (10-20 layers)

### Viewport Persistence

- **Impact:** Minimal (sessionStorage writes are fast)
- **Optimization:** Auto-save interval = 10s (adjustable)
- **Storage:** ~100 bytes per viewport
- **Cleanup:** Automatic expiry (5 minutes)

### Custom 3D Models

- **Impact:** Depends on model complexity (vertices, textures)
- **Optimization:** Use optimized GLB files (Draco compression)
- **Recommendation:** Keep models under 5MB
- **Best practice:** Load models on demand (lazy loading)

---

## Migration Guide

### For existing code using hardcoded '3d-buildings'

**Before:**

```typescript
const has3DBuildings = map.getLayer('3d-buildings') !== undefined;

const features = map.queryRenderedFeatures(bbox, {
  layers: ['3d-buildings']
});
```

**After:**

```typescript
import { has3DLayers, detect3DLayers } from '@/mapbox/3d-layer-detection';

const has3DLayers = has3DLayers(map);

const layers3D = detect3DLayers(map);
const features = map.queryRenderedFeatures(bbox, {
  layers: layers3D
});
```

**Benefits:**

- ✅ Works with ANY 3D layer names
- ✅ No code changes needed when adding new layers
- ✅ Better logging and debugging
- ✅ Supports custom GLB/GLTF models

---

## Future Enhancements

### Possible improvements:

1. **Viewport UI Indicator** - Show "Viewport saved" badge with expiry timer
2. **Viewport History** - Store last 5 viewports per project (undo/redo)
3. **3D Model Library** - Predefined models (buildings, landmarks, vehicles)
4. **Batch Model Import** - Upload multiple GLB files at once
5. **Model Editor Dialog** - GUI for editing model properties
6. **Persistent Storage** - Use IndexedDB for long-term viewport storage
7. **Cloud Sync** - Sync viewport across devices (requires backend)

---

## Troubleshooting

### Issue: 3D layers not detected

**Symptoms:**

```
ℹ️ No 3D layers detected on map
```

**Solutions:**

1. Check if 3D basemap is active (Full 3D mode)
2. Verify map style has loaded: `map.isStyleLoaded()`
3. Check console for style errors
4. Ensure Mapbox GL JS v3.0+ (for model layers)

### Issue: Viewport not restored

**Symptoms:**

```
ℹ️ No saved viewport found
```

**Solutions:**

1. Check if projectName is provided: `<MapContainer projectName="..." />`
2. Verify sessionStorage is enabled (not in incognito mode)
3. Check if viewport expired (> 5 minutes)
4. Inspect sessionStorage in DevTools (Application tab)

### Issue: Custom model not visible

**Symptoms:**

```
✅ Added custom 3D model: tower-1
(But model not visible on map)
```

**Solutions:**

1. Check model URL is accessible (no CORS errors)
2. Verify model format is valid GLB/GLTF
3. Check model position is within map bounds
4. Adjust model scale (may be too small/large)
5. Check Mapbox GL JS version (requires v3.0+)

---

## API Reference

### Universal 3D Detection

```typescript
// Detect all 3D layers
detect3DLayers(map: Map): string[]

// Check if specific layer is 3D
is3DLayer(map: Map, layerId: string): boolean

// Get building layers only
getExtrusionLayers(map: Map): string[]

// Get model layers only
getModelLayers(map: Map): string[]

// Query all 3D features at point
queryAll3DFeatures(map: Map, point: Point, tolerance?: number): Feature[]

// Get 3D layer statistics
get3DLayerStats(map: Map): Stats

// Check if map has 3D layers
has3DLayers(map: Map): boolean
```

### Viewport Persistence

```typescript
// Save viewport
saveViewport(projectName: string, viewState: ViewState): void

// Load viewport
loadViewport(projectName: string): ViewState | null

// Clear viewport
clearViewport(): void

// Auto-save viewport
autoSaveViewport(
  projectName: string,
  getViewState: () => ViewState | null,
  interval?: number
): () => void // Returns cleanup function

// Get expiry time
getViewportExpiryTime(): number // seconds

// Check if stored
hasStoredViewport(): boolean

// Get metadata
getStoredViewportInfo(): ViewportInfo | null
```

### Custom 3D Models

```typescript
// Add model
addCustom3DModel(map: Map, model: Custom3DModel): boolean

// Remove model
removeCustom3DModel(map: Map, modelId: string): boolean

// Update model
updateCustom3DModel(
  map: Map,
  modelId: string,
  updates: Partial<Custom3DModel>
): boolean

// List models
listCustom3DModels(map: Map): string[]

// Get model info
getCustom3DModelInfo(map: Map, modelId: string): Partial<Custom3DModel> | null

// Check if exists
hasCustom3DModel(map: Map, modelId: string): boolean

// Batch operations
addMultipleCustom3DModels(map: Map, models: Custom3DModel[]): number
removeAllCustom3DModels(map: Map): number
```

---

## Summary

### What changed:

1. ✅ **Universal 3D Detection** - Automatically detects ALL 3D layers
2. ✅ **Viewport Persistence** - Saves/restores camera position (5 min expiry)
3. ✅ **Custom 3D Models** - GLB/GLTF model support with full control
4. ✅ **3D Objects Panel** - UI for managing 3D layers and models

### Key benefits:

- 🚀 **No hardcoded layer names** - Works with any layer naming
- 🔄 **Auto-detection** - No code changes needed for new layers
- 💾 **Persistent viewport** - User-friendly navigation experience
- 🎨 **Custom models** - Full 3D scene customization
- 📊 **Better debugging** - Detailed logging and statistics
- 🛠️ **Developer-friendly** - Clean API with TypeScript support

### Next steps:

1. Test on production environment
2. Monitor performance metrics
3. Gather user feedback
4. Consider future enhancements (see above)
