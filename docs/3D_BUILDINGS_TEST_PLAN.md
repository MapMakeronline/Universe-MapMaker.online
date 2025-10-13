# 3D Buildings - Testing & Verification Plan

## Quick Test Checklist

### ✅ Visual Tests (Manual)

#### Test 1: Orange Highlight (2 minutes)
```
1. Open http://localhost:3000/map?project=TestProject
2. Switch to "full3d" or "buildings3d" map style
3. Click RightToolbar → Identify tool (eye icon)
4. Click any building
5. ✅ Building should turn ORANGE (#ff9800)
6. Click another building
7. ✅ Previous building returns to gray, new one turns orange
```

#### Test 2: Different Camera Angles (3 minutes)
```
1. Set pitch to 60° (hold Ctrl+Drag up/down)
2. Rotate map (hold Ctrl+Shift+Drag left/right) to 45° bearing
3. Click on building from the SIDE (not top-down)
4. ✅ Building should still be selected!
5. Open browser console
6. ✅ Check for log: "🎯 3D Picking: Found X buildings, closest at Ypx"
7. ✅ Log should show pitch: 60, bearing: 45
```

#### Test 3: Attribute Editing (5 minutes)
```
1. Click on building → modal opens
2. Edit name to "Test Building A"
3. Add attribute: "floors" = "10"
4. Add attribute: "year_built" = "2020"
5. ✅ Check console for: "💾 Auto-saved buildings to localStorage"
6. Close modal
7. Click same building again
8. ✅ Name and attributes should be saved!
```

### ✅ Console Tests (Developer Tools)

#### Test 4: localStorage Persistence (2 minutes)
```javascript
// Open DevTools → Console

// 1. Check if buildings are saved
const projectName = 'TestProject'; // Replace with your project
const data = localStorage.getItem(`buildings_${projectName}`);
console.log('Buildings data:', JSON.parse(data));

// 2. Verify structure
const parsed = JSON.parse(data);
console.log('Feature count:', parsed.features.length);
console.log('First building:', parsed.features[0]);

// ✅ Should see: type: "FeatureCollection", features: [...]
// ✅ Each feature has: id, geometry, properties with name and attributes
```

#### Test 5: GeoJSON Export (2 minutes)
```javascript
// Open DevTools → Console

// 1. Import storage utilities (add this to test file temporarily)
import { downloadBuildingsGeoJSON } from '@/mapbox/buildings-storage';

// 2. Get all buildings from Redux
const features = store.getState().features.features;
const buildings = Object.values(features).filter(f => f.type === 'building');

// 3. Download GeoJSON
downloadBuildingsGeoJSON('TestProject', buildings);

// ✅ File should download as: TestProject_buildings_1234567890.geojson
// ✅ Open file → should be valid GeoJSON with metadata
```

#### Test 6: 3D Picking Accuracy (3 minutes)
```javascript
// Open DevTools → Console

// 1. Enable verbose logging
localStorage.setItem('debug_3d_picking', 'true');

// 2. Click on buildings at different angles
// Watch console logs for:
console.log('🎯 3D Picking: Found N buildings, closest at Xpx');
console.log('  pitch: 60, tolerance: 24 (2x for pitch > 45)');
console.log('  clickPoint: {x: 123, y: 456}');

// ✅ Tolerance should increase from 12px → 24px when pitch > 45°
// ✅ Distance to closest building should be < tolerance
```

### ✅ Automated Tests (Future)

#### Test 7: React Component Test
```typescript
// tests/components/FeatureAttributesModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import FeatureAttributesModal from '@/features/warstwy/modale/FeatureAttributesModal';

test('should auto-save buildings on attribute edit', async () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
  };
  global.localStorage = localStorageMock as any;

  // Render modal with building selected
  const { getByText, getByLabelText } = render(
    <Provider store={store}>
      <FeatureAttributesModal />
    </Provider>
  );

  // Edit attribute
  const valueInput = getByLabelText('Wartość');
  fireEvent.change(valueInput, { target: { value: 'NewValue' } });
  fireEvent.click(getByText('Save'));

  // Verify localStorage.setItem was called
  await waitFor(() => {
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      expect.stringMatching(/buildings_/),
      expect.any(String)
    );
  });
});
```

---

## Browser Console Commands for Quick Testing

### Get Current Building Count
```javascript
const features = window.__REDUX_STORE__.getState().features.features;
const buildings = Object.values(features).filter(f => f.type === 'building');
console.log(`Total buildings: ${buildings.length}`);
```

### Check localStorage Size
```javascript
const projectName = 'TestProject';
const data = localStorage.getItem(`buildings_${projectName}`);
if (data) {
  console.log(`localStorage size: ${(data.length / 1024).toFixed(2)} KB`);
} else {
  console.log('No buildings saved yet');
}
```

### Clear All Buildings (Reset)
```javascript
const projectName = 'TestProject';
localStorage.removeItem(`buildings_${projectName}`);
console.log('Buildings cleared from localStorage');
```

### Export GeoJSON to Console
```javascript
const features = window.__REDUX_STORE__.getState().features.features;
const buildings = Object.values(features).filter(f => f.type === 'building');
const geojson = {
  type: 'FeatureCollection',
  features: buildings.map(b => ({
    type: 'Feature',
    id: b.id,
    geometry: b.geometry,
    properties: {
      name: b.name,
      ...b.attributes.reduce((acc, attr) => ({ ...acc, [attr.key]: attr.value }), {})
    }
  }))
};
console.log(JSON.stringify(geojson, null, 2));
```

### Simulate Backend Upload (Test Payload)
```javascript
const features = window.__REDUX_STORE__.getState().features.features;
const buildings = Object.values(features).filter(f => f.type === 'building');
const payload = {
  project: 'TestProject',
  layer_name: 'Buildings_3D_Edited',
  geojson: {
    type: 'FeatureCollection',
    features: buildings.map(b => ({
      type: 'Feature',
      id: b.id,
      geometry: b.geometry || { type: 'Point', coordinates: b.coordinates },
      properties: {
        name: b.name,
        ...b.attributes.reduce((acc, attr) => ({ ...acc, [attr.key]: attr.value }), {})
      }
    }))
  },
  style: {
    fillColor: '#ff9800',
    strokeColor: '#ffffff',
    strokeWidth: 1
  }
};

console.log('Backend upload payload:');
console.log(JSON.stringify(payload, null, 2));
console.log(`Payload size: ${(JSON.stringify(payload).length / 1024).toFixed(2)} KB`);
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Click building (3D picking) | < 50ms | Ray-casting with 12px tolerance |
| Attribute save | < 10ms | localStorage write |
| GeoJSON export (100 buildings) | < 100ms | JSON.stringify + blob creation |
| GeoJSON import (100 buildings) | < 100ms | JSON.parse + Redux dispatch |
| Auto-save trigger | < 5ms | Debounced, non-blocking |

### Performance Test Script
```javascript
// Test 3D picking performance
const map = window.__MAP_INSTANCE__;
const point = { x: 500, y: 500 };

console.time('3D Picking');
const features = query3DBuildingsAtPoint(map, point, 12);
console.timeEnd('3D Picking'); // Should be < 50ms

// Test GeoJSON export performance
const buildings = Object.values(window.__REDUX_STORE__.getState().features.features)
  .filter(f => f.type === 'building');

console.time('GeoJSON Export');
const geojson = exportBuildingsToGeoJSON(buildings, 'TestProject');
console.timeEnd('GeoJSON Export'); // Should be < 100ms for 100 buildings

// Test localStorage save performance
console.time('localStorage Save');
saveBuildingsToLocalStorage('TestProject', buildings);
console.timeEnd('localStorage Save'); // Should be < 10ms for 100 buildings
```

---

## Known Issues & Workarounds

### Issue 1: Building Not Selected at Low Zoom
**Symptom:** Buildings don't appear clickable at zoom < 15

**Cause:** Mapbox 3D buildings layer has `minzoom: 16` by default

**Workaround:** User must zoom in to at least level 15

**Fix (Optional):** Change minzoom in `map3d.ts`:
```typescript
export function add3DBuildings(map, options) {
  const minzoom = options?.minzoom || 14; // Changed from 16
  // ...
}
```

### Issue 2: Orange Highlight Flickers on Mobile
**Symptom:** Building flickers between orange and gray on touch

**Cause:** Touch events fire multiple times (touchstart, touchmove, touchend, click)

**Workaround:** Identify tool already has tap detection (8px movement threshold)

**Fix:** Ensure `touchend` handler checks for movement:
```typescript
const moved = Math.max(dx, dy) > 8; // 8px tolerance
if (moved) return; // Ignore if dragged
```

### Issue 3: localStorage Full After 100+ Buildings
**Symptom:** Console error `QuotaExceededError`

**Cause:** Each building with geometry can be ~2-5 KB, localStorage limit ~5-10 MB

**Workaround:** User should sync to backend more frequently

**Fix (Future):** Implement compression or move to IndexedDB

---

## Success Criteria

### Phase 1 (Frontend) - ✅ All Complete
- [x] Orange highlight (#ff9800) visible on selected buildings
- [x] 3D picking works from any camera angle (pitch 0-85°, bearing 0-360°)
- [x] FeatureAttributesModal opens with building data
- [x] Attributes can be added, edited, deleted
- [x] Auto-save to localStorage on every change
- [x] GeoJSON export function works
- [x] GeoJSON download produces valid file
- [x] localStorage persistence across page refresh

### Phase 2 (Backend) - ⏳ Pending
- [ ] Backend endpoint `/api/layers/create-from-geojson/` created
- [ ] Django view handles GeoJSON upload
- [ ] ogr2ogr imports to PostGIS successfully
- [ ] Layer record created in database
- [ ] Layer added to QGS file with PyQGIS
- [ ] tree.json regenerated with new layer
- [ ] Frontend sync button triggers upload
- [ ] WMS tiles load for edited buildings layer

---

## Next Steps for Phase 2 Implementation

1. **Backend Development (2-3 hours):**
   - Create Django REST endpoint
   - Implement ogr2ogr subprocess call
   - Add PyQGIS layer creation
   - Test with sample GeoJSON

2. **Frontend Integration (1-2 hours):**
   - Update `uploadBuildingsToBackend()` function
   - Add sync button to UI
   - Implement error handling
   - Add loading state during sync

3. **Testing (1-2 hours):**
   - Test GeoJSON upload with 1 building
   - Test with 10 buildings
   - Test with 100 buildings
   - Verify PostGIS table structure
   - Check QGS file layer definition
   - Verify WMS rendering

4. **Production Deployment (30 minutes):**
   - Deploy frontend changes
   - Deploy backend changes
   - Test end-to-end on live server
   - Monitor logs for errors

**Total Estimated Time:** 5-8 hours for complete Phase 2 implementation

---

**Last Updated:** 2025-10-13
**Status:** Phase 1 Complete, Phase 2 Ready for Implementation
