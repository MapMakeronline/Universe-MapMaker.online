# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server (default: http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server (uses server.js)
npm run lint         # Run ESLint

# Cloud Deployment
gcloud builds submit --region=europe-central2 --config=cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
gcloud run services describe universe-mapmaker --region=europe-central2
```

## Environment Setup

**Local Development:**
Create `.env.local` in project root:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ
```

**Fallback Configuration:**
If `.env.local` is missing, the token fallback is in `src/lib/mapbox/config.ts` (line 4).

## Theme & Styling

**IMPORTANT:** Always use the global theme from `src/lib/theme.ts`. NEVER create a new theme with `createTheme()` in components.

### Brand Colors
The application uses the following color palette:
- **Primary (Coral/Red):** `#f75e4c` - Main brand color
- **Secondary (Blue):** `#1c679d` - Accent color
- **Background:** `#ffffff` (white), `#fafafa` (light gray)
- **Modal Colors:** Accessible via `theme.palette.modal.*`

### Global Theme Configuration (MUI v7)

The theme has been enhanced with automatic styling for common components. Most MUI components now have default styles and don't require inline `sx` props.

**Automated Components:**
- `TextField` - Auto-styled with white background, primary border on hover/focus
- `Dialog` - Auto-styled with modal colors, rounded corners, shadows
- `DialogTitle` - Dark header (#4a5568) with close button positioning
- `DialogContent` - Light gray background (#f7f9fc)
- `DialogActions` - Matching background with border and gap spacing
- `Button` - No text transform, consistent padding, secondary variant for modals
- `Tab/Tabs` - No text transform, consistent sizing

**Custom Theme Properties:**
```typescript
// Access modal colors
theme.palette.modal.header      // #4a5568 - Dark gray
theme.palette.modal.headerText  // #ffffff - White
theme.palette.modal.content     // #f7f9fc - Light blue-gray
theme.palette.modal.border      // #e5e7eb - Border gray
```

### Using Theme in Components
```typescript
import { ThemeProvider } from '@mui/material';
import { theme } from '@/lib/theme';

// In your component:
<ThemeProvider theme={theme}>
  {/* Your content */}
</ThemeProvider>
```

### Theme Utilities (`src/lib/theme-utils.tsx`)

Helper components and utilities for rapid development:

```typescript
import { FormField, FormContainer, DialogHeader, responsive, commonSx } from '@/lib/theme-utils';

// Form field with auto-styled label
<FormField label="Nazwa">
  <TextField fullWidth value={value} onChange={onChange} />
</FormField>

// Form container with consistent spacing
<FormContainer gap={2.5}>
  <FormField label="Field 1">...</FormField>
  <FormField label="Field 2">...</FormField>
</FormContainer>

// Dialog header with close button
<DialogTitle>
  <DialogHeader title="My Dialog" onClose={handleClose} />
</DialogTitle>

// Responsive utilities
<Box sx={responsive.hideOnMobile}>Desktop only</Box>
<Box sx={responsive.padding}>Responsive padding</Box>

// Common sx patterns
<Box sx={commonSx.centerContent}>Centered</Box>
<Box sx={commonSx.scrollable}>Scrollable with custom scrollbar</Box>
```

**Available Helper Components:**
- `<FormLabel>` - Consistent label styling (14px, medium weight)
- `<FormField>` - Label + input wrapper
- `<FormContainer>` - Flex column with gap spacing
- `<DialogHeader>` - Title + close button in one component

**Available Utilities:**
- `responsive.hideOnMobile` / `hideOnDesktop` - Responsive visibility
- `responsive.padding` - Responsive padding (xs: 2, sm: 3)
- `responsive.fontSize.*` - Small, medium, large, xlarge responsive fonts
- `commonSx.centerContent` - Flexbox centering
- `commonSx.fullSize` - 100% width and height
- `commonSx.scrollable` - Styled scrollbar
- `commonSx.cardShadow` - Card shadow with hover effect
- `commonSx.transition()` - Create theme-aware transitions
- `conditionalSx(condition, trueSx, falseSx)` - Conditional styles

### Logo Assets
- **Full Logo:** `/logo.svg` - Use for login screens and large branding
- **Icon Logo:** `/logo2.svg` - Use for dashboards, headers, and small icons
- Both logos are located in the `/public` folder

### Accessing Theme Colors
```typescript
import { useTheme } from '@mui/material';

const theme = useTheme();
// Use: theme.palette.primary.main, theme.palette.secondary.main, etc.
```

## Architecture Overview

### State Management (Redux Toolkit)

Three primary slices control application state:

1. **`mapSlice`** (`src/store/slices/mapSlice.ts`)
   - Map viewport: `viewState` (longitude, latitude, zoom, bearing, pitch)
   - Map style selection: `mapStyle` (URL), `mapStyleKey` (identifier)
   - Fullscreen state
   - Actions: `setViewState`, `setMapStyle`, `flyToLocation`, `setFullscreen`
   - **Important:** `setMapStyle` accepts either string URL or `{ url: string, key: string }` object

2. **`layersSlice`** (`src/store/slices/layersSlice.ts`)
   - Hierarchical layer tree with groups and individual layers
   - Layer visibility, opacity, color configuration
   - Drag-and-drop ordering
   - Actions: `addLayer`, `deleteLayer`, `updateLayerProperty`, `moveLayer`

3. **`drawSlice`** (`src/store/slices/drawSlice.ts`)
   - Drawing mode state (polygon, line, point, rectangle)
   - Active drawing geometries
   - Measurement tools state

**Accessing State:**
```typescript
// Use typed hooks from src/store/hooks.ts
const layers = useAppSelector(state => state.layers.layers);
const dispatch = useAppDispatch();
dispatch(addLayer({ id: '123', name: 'New Layer' }));
```

**Important:** The store is configured to ignore serialization checks for `map/setViewState` action and `map.mapInstance` path due to non-serializable Mapbox objects.

### Component Architecture

**Main Map Integration:**
- `src/components/map/MapContainer.tsx` - Core Mapbox GL wrapper using react-map-gl
  - Initializes map with token from `src/lib/mapbox/config.ts`
  - Syncs Redux state with Mapbox instance
  - Handles layer rendering and interactions
  - Includes Buildings3D component for 3D terrain and buildings

**Panel System:**
- `src/components/panels/LeftPanel.tsx` - **Primary UI component**
  - Hierarchical layer tree with drag-and-drop (@mui/x-tree-view)
  - Layer properties editor (opacity, color, visibility)
  - Basemap selector (bottom of panel)
  - Action toolbar (add dataset, manage layers, etc.)

- `src/components/panels/RightToolbar.tsx` - Tool palette
  - Drawing tools, measurement tools, fullscreen toggle

**3D Map Features:**
- `src/components/map/Buildings3D.tsx` - 3D terrain and buildings manager
  - Automatically enables/disables 3D based on selected basemap style
  - Supports three modes: 2D, 3D Buildings only, Full 3D (terrain + buildings + sky)
  - Uses native Mapbox GL API via `mapRef.getMap()`
  - Responsive pitch angles: 45° for zoom < 10, 60° for zoom ≥ 10

- `src/components/map/IdentifyTool.tsx` - **Unified Identify Tool (including 3D buildings)**
  - **Single tool for identifying ALL map features** - layers, 3D buildings, POIs, etc.
  - Uses bbox query pattern with **12px tolerance** (increased from 8px for better building detection)
  - Automatically detects 3D buildings in `buildings3d` and `full3d` map styles
  - **Smart feature detection:** Finds first `3d-buildings` layer, skips labels and other layers
  - **When 3D building is clicked:**
    - Creates/updates building entry in Redux store
    - Opens `BuildingAttributesModal` for editing
    - Applies feature-state highlighting (primary color)
    - Triggers haptic feedback on mobile (vibration)
  - **When regular feature is clicked:**
    - Opens `IdentifyModal` with feature properties
    - Filters out `3d-buildings` from results (prevents duplicates)
  - **Active only when Identify mode is enabled** via RightToolbar button
  - **Automatically disables drawing mode** when activated (prevents conflicts on mobile)
  - Cursor changes to "help" when active
  - **IMPORTANT:** Use native Mapbox `map.on('click')` with bbox query, NOT React Map GL's onClick

- `src/components/map/MobileFAB.tsx` - Mobile drawing tools (FAB = Floating Action Button)
  - **Automatically hides when Identify mode is active** (prevents blocking)
  - Resets drawing mode when Identify is activated
  - SpeedDial with drawing options: Point, Line, Polygon
  - Positioned to avoid RightToolbar overlap
  - Responsive positioning (closer to edge on mobile)

- `src/components/map/BuildingAttributesModal.tsx` - Building attribute editor
  - Displays building name, coordinates, and custom attributes in a table
  - Supports adding, editing, and deleting attributes
  - Inline editing with save/cancel actions
  - Follows standard modal design pattern

- `src/components/panels/components/BuildingsPanel.tsx` - Buildings list in layer tree
  - Shows all clicked 3D buildings in a collapsible panel
  - Displays building count badge
  - Quick access to edit/delete buildings
  - Integrated into LeftPanel above LayerTree

- `src/lib/mapbox/map3d.ts` - 3D utilities module
  - `add3DTerrain()` - Adds terrain elevation (Mapbox Terrain DEM)
  - `add3DBuildings()` - Adds extruded building layer (minzoom: 15) with feature state support
  - `addSkyLayer()` - Adds atmospheric sky layer
  - `enableFull3DMode()` - Enables all 3D features + camera angle
  - `disableFull3DMode()` - Cleans up all 3D features
  - Buildings layer supports feature-state for selection highlighting

- `src/store/slices/buildingsSlice.ts` - Redux state for 3D buildings
  - Stores building data: id, name, coordinates, attributes, selected state
  - Actions: addBuilding, updateBuilding, deleteBuilding, selectBuilding
  - Attribute management: addBuildingAttribute, updateBuildingAttribute, deleteBuildingAttribute
  - Modal state management

**Drawing & Measurement:**
- Uses `@mapbox/mapbox-gl-draw` for drawing functionality
- `mapbox-gl-draw-rectangle-mode` for rectangle drawing
- Turf.js (`@turf/turf`) for geospatial calculations

**Mapbox Search Integration:**
- `src/lib/mapbox/search.ts` - Mapbox Geocoding API utilities
  - `searchPlaces()` - Search for places, addresses, POI
  - `reverseGeocode()` - Convert coordinates to address
  - `searchByCategory()` - Search by POI category
  - Pre-configured with Universe-MapMaker token
  - Supports proximity bias, country filtering, language selection
  - Returns SearchResult[] with GeoJSON coordinates
  - Popular categories: restaurant, cafe, hotel, museum, park, hospital, school, etc.

- `src/components/map/SearchModal.tsx` - Place search with autocomplete
  - Debounced search (300ms) for better UX
  - Proximity bias to current map center
  - Poland-focused results (`country=pl`, `language=pl`)
  - Displays place name, full address, and location icon
  - Flies to location on result click (zoom: 16)

- `src/components/map/MapboxSearchModal.tsx` - Advanced search modal (3 tabs)
  - **Tab 1: Wyszukiwanie** - General place/address search
  - **Tab 2: Kategorie** - Category search (restaurants, hotels, museums)
  - **Tab 3: Geokodowanie** - Reverse geocoding (coordinates → address)
  - Integration with `src/lib/mapbox/search.ts`

**MCP Mapbox Available Tools** (configured in `.claude/mcp.json`):
- `search-and-geocode` - Find POIs, brands, geocode addresses
- `category-search` - Search by place type/category
- `reverse-geocode` - Convert coordinates to addresses
- `directions` - Route planning and navigation
- `isochrone` - Reachable areas within time/distance
- `matrix` - Travel time/distance between multiple points
- `static-map-image` - Generate static map images
- Token: `pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZ2U3NHN5MzFmNzIybHF0MGp4eHVoYzkifQ.bYL5OZhuqokHHHWuOwdeIA`

### TypeScript Path Aliases

Configured in `tsconfig.json`:
```typescript
import Component from '@/components/map/MapContainer';  // resolves to ./src/components/map/MapContainer
import { Layer } from '@/types/layers';                 // resolves to ./src/types/layers
import { MAPBOX_TOKEN } from '@/lib/mapbox/config';    // resolves to ./src/lib/mapbox/config
```

### Routing Structure

Next.js App Router (file-based):
- `/` - Home page (`app/page.tsx`)
- `/map` - Main map interface (`app/map/page.tsx`)
- `/dashboard` - User dashboard (`app/dashboard/page.tsx`)
- `/login`, `/register`, `/forgot-password` - Authentication pages

### Production Deployment (Google Cloud Run)

**Build Process:**
1. Multi-stage Dockerfile builds standalone Next.js output
2. Cloud Build triggers from `cloudbuild.yaml`:
   - Builds image with Mapbox tokens as build args
   - Pushes to Artifact Registry (`europe-central2`)
   - Deploys to Cloud Run with environment variables
3. Region: `europe-central2` (all resources)

**Environment Variables in Production:**
Set in `cloudbuild.yaml` via `--set-env-vars` and `--build-arg`:
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token (required for 3D terrain and buildings)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Alternative token name (compatibility)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

**Note:** Mapbox token is passed both as build argument (for static optimization) and runtime environment variable (for client-side access). This ensures 3D features work correctly in production.

**Standalone Build:**
Next.js configured with `output: 'standalone'` in `next.config.mjs` for optimized Docker deployment.

## Key Configuration Files

- **`next.config.mjs`** - Next.js configuration
  - Standalone output mode
  - Mapbox-gl transpilation
  - Webpack config for mapbox-gl ES modules

- **`src/lib/mapbox/config.ts`** - Mapbox settings
  - Token configuration with fallback
  - Default view state (Warsaw, Poland)
  - Map style definitions with 3D support:
    - `streets` - Standard street map (2D)
    - `satellite` - Satellite imagery (2D)
    - `outdoors` - Outdoor/terrain style (2D)
    - `light` - Light theme (2D)
    - `dark` - Dark theme (2D)
    - `buildings3d` - Streets + 3D buildings only
    - `full3d` - **Full 3D mode** (terrain + buildings + sky)
  - Each style has `enable3D`, `enableTerrain`, `enableSky` flags
  - Map interaction config (doubleClickZoom: false for drawing tools)

- **`src/lib/mapbox/map3d.ts`** - 3D terrain and buildings utilities
  - Official Mapbox 3D implementation
  - Functions for terrain, buildings, and sky layers
  - Based on Mapbox GL JS documentation

- **`server.js`** - Custom production server
  - Port: 3000 (or PORT env var)
  - Hostname: 0.0.0.0 (required for Cloud Run)

## Important Implementation Notes

**Mapbox Token Loading:**
- Primary: Environment variable `NEXT_PUBLIC_MAPBOX_TOKEN` from `.env.local`
- Fallback: Hardcoded in `src/lib/mapbox/config.ts` line 4
- Production: Passed via `cloudbuild.yaml` as build arg and env var
- Runtime check in `MapContainer.tsx` useEffect (logs token status to console)
- **Important:** Token must be valid for 3D terrain features (requires Mapbox GL JS v2.0+)

**3D Map Implementation:**
- **Default map:** Full 3D mode (terrain + buildings + sky) set in `mapSlice.ts` initial state
- BasemapSelector uses `mapStyleKey` (not URL) to identify styles
- Buildings3D component gets native Mapbox GL instance via `mapRef.getMap()`
- 3D features are cleaned up BEFORE style change to prevent ghost layers
- Terrain visible at all zoom levels, buildings require zoom ≥ 15
- Camera pitch adjusts automatically: 45° (zoom < 10), 60° (zoom ≥ 10)
- Touch gestures for 3D enabled by default (dragRotate, touchRotate in MAP_CONFIG)
- Works on both local development and production (GCP Cloud Run)

**React Map GL Event Handling (CRITICAL for Mobile):**
- **ALWAYS use React Map GL's event props** (`onClick`, `onMouseMove`, etc.) instead of native Mapbox events
- **MapContainer must include `interactiveLayerIds`** prop to enable automatic feature detection:
  ```typescript
  <Map
    interactiveLayerIds={['3d-buildings', 'other-layers']}
    onClick={handleClick}
  />
  ```
- When `interactiveLayerIds` is set, click/touch events automatically include `event.features`
- **DO NOT use** `map.on('touchstart')`, `map.on('click')` for feature interaction
- **DO use** React Map GL events which work identically on desktop and mobile
- Example: `map.on('click', handler)` receives events from React Map GL's `onClick` prop
- Features are auto-queried - no need for manual `queryRenderedFeatures()`

**Double-Click Behavior:**
- Map has `doubleClickZoom: false` to prevent conflicts with drawing tools
- Context menu and drawing tools handle double-clicks separately

**Layer Tree Implementation:**
- Uses `@mui/x-tree-view` SimpleTreeView with drag-and-drop
- Recursive rendering for nested groups
- Layer nodes typed in `src/types/layers.ts`

**Build Optimizations:**
- TypeScript & ESLint errors ignored during build (`ignoreBuildErrors: true`)
- Images unoptimized for faster builds
- Mapbox GL transpiled for webpack compatibility

## Modal Component Style Guide

All modals in the application follow a consistent design pattern. Use this template when creating new modals:

### Modal Structure Template

```typescript
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="md"  // or "sm" for smaller modals
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      maxWidth: '700px',  // or '480px' for small modals
      width: '90%',
    }
  }}
>
  {/* Header */}
  <DialogTitle
    sx={{
      bgcolor: '#4a5568',  // Dark gray header
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 2,
      px: 3,
      fontSize: '16px',
      fontWeight: 600,
      m: 0,
    }}
  >
    Modal Title
    <IconButton
      onClick={onClose}
      size="small"
      sx={{
        color: 'white',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
      }}
    >
      <CloseIcon sx={{ fontSize: '20px' }} />
    </IconButton>
  </DialogTitle>

  {/* Content */}
  <DialogContent
    sx={{
      bgcolor: '#f7f9fc',  // Light blue-gray background
      px: 3,
      py: 3,
    }}
  >
    {/* Form fields go here */}
  </DialogContent>

  {/* Footer */}
  <DialogActions
    sx={{
      bgcolor: '#f7f9fc',
      px: 3,
      pb: 3,
      pt: 0,
      gap: 2,
      justifyContent: 'flex-end',
    }}
  >
    <Button
      onClick={onClose}
      variant="outlined"
      sx={{
        borderColor: '#d1d5db',
        color: theme.palette.text.primary,
        '&:hover': {
          borderColor: theme.palette.text.primary,
          bgcolor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      Anuluj
    </Button>
    <Button
      onClick={handleSubmit}
      variant="contained"
      disabled={isSubmitDisabled()}
      sx={{
        bgcolor: theme.palette.primary.main,
        '&:hover': { bgcolor: theme.palette.primary.dark },
      }}
    >
      Submit Text
    </Button>
  </DialogActions>
</Dialog>
```

### Text Field Styling

```typescript
<TextField
  fullWidth
  value={value}
  onChange={handleChange}
  placeholder="Placeholder text"
  size="small"
  sx={{
    '& .MuiOutlinedInput-root': {
      bgcolor: 'white',
      borderRadius: '4px',
      '& fieldset': {
        borderColor: '#d1d5db',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiOutlinedInput-input': {
      fontSize: '14px',
      color: theme.palette.text.primary,
    },
  }}
/>
```

### Section Label Styling

```typescript
<Typography
  sx={{
    fontSize: '14px',
    fontWeight: 500,
    color: theme.palette.text.primary,
    mb: 1,
  }}
>
  Label Text
</Typography>
```

### Existing Modal Components

- `src/components/panels/AddDatasetModal.tsx` - INSPIRE dataset modal (small, simple form)
- `src/components/panels/AddNationalLawModal.tsx` - National law modal (tabs for create/import)
- `src/components/panels/AddLayerModal.tsx` - Add layer modal (large, grid layout with columns)

## Responsive Design Guidelines

All dashboard components follow mobile-first responsive design principles using Material-UI breakpoints:

### Breakpoints
- `xs`: 0px - 599px (mobile phones)
- `sm`: 600px - 899px (tablets)
- `md`: 900px - 1199px (small laptops)
- `lg`: 1200px+ (desktops)

### Dashboard Layout (`src/components/dashboard/DashboardLayout.tsx`)
- **Drawer Behavior:**
  - Mobile (< md): `temporary` variant with overlay (closes on click outside)
  - Desktop (≥ md): `persistent` variant (stays open, pushes content)
  - Separate state management: `mobileOpen` and `desktopOpen`
- **Header Elements:**
  - Navigation links (Blog, Regulamin, FAQ): hidden on mobile (< md)
  - Logo text "MapMaker": hidden on small screens (xs)
  - Hamburger icon changes based on context (ChevronLeft on desktop when open, MenuIcon otherwise)
- **Content Padding:**
  - Mobile: `p: 2` (16px)
  - Desktop: `p: 3` (24px)

### Project Lists (`OwnProjects.tsx`, `PublicProjects.tsx`)
- **Headers:**
  - Font sizes scale down on mobile: `{ xs: '1.75rem', sm: '2.125rem' }`
  - Layout switches from row to column on mobile
- **Buttons:**
  - Desktop: Regular buttons in header
  - Mobile: FAB (Floating Action Button) for primary actions
- **Filters:**
  - Desktop: Horizontal row layout
  - Mobile: Vertical stack, full width
- **Dialogs:**
  - Desktop: Standard modal with maxWidth
  - Mobile: Full screen (`fullScreen={isMobile}`)
- **Category Grids in Forms:**
  - Mobile: 2 columns (`xs={6}`)
  - Tablet+: 3 columns (`sm={4}`)

### User Settings (`UserSettings.tsx`)
- **Tabs:**
  - Desktop: Standard tabs with icons
  - Mobile: Scrollable tabs without icons (`variant="scrollable"`)
  - Icons hidden on mobile to save space
- **Form Grid:**
  - All fields use responsive grid: `xs={12} sm={6}`
  - Desktop: 2 columns side-by-side
  - Mobile: Single column stacked
- **Action Buttons:**
  - Desktop: Right-aligned
  - Mobile: Full width (`fullWidth={isMobile}`)
- **Content Padding:**
  - Reduced on mobile: `px: { xs: 2, sm: 3 }`
- **Typography:**
  - Section headings scale: `{ xs: '1.125rem', sm: '1.25rem' }`
  - Description text margins adjust: `ml: { xs: 0, sm: 6 }`

### Implementation Pattern

Always use MUI's `useMediaQuery` hook with theme breakpoints:

```typescript
import { useTheme, useMediaQuery } from '@mui/material';

const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Then use in components
<Button fullWidth={isMobile} />
<Dialog fullScreen={isMobile} />
```

For inline responsive styles, use the `sx` prop with breakpoint objects:

```typescript
<Box sx={{
  flexDirection: { xs: 'column', sm: 'row' },
  p: { xs: 2, sm: 3 },
  fontSize: { xs: '0.875rem', sm: '1rem' }
}} />
```

### Testing Responsiveness

Test at these viewport widths:
- 375px (iPhone SE)
- 390px (iPhone 12/13/14)
- 768px (iPad)
- 1024px (iPad Pro)
- 1440px (Desktop)

## Live Deployment

Production URL: https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app

Monitor deployment:
```bash
gcloud run services describe universe-mapmaker --region=europe-central2
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=universe-mapmaker" --limit=50
```

## Context7 MCP Integration - Library Documentation Validation

**IMPORTANT:** Before implementing new features or making significant changes, ALWAYS verify that our code follows the latest best practices from official documentation using Context7 MCP tools.

### Core Libraries to Validate

The project uses these main libraries - verify implementation against latest docs:

1. **Next.js** (v15.5.4)
   - Library ID: `/vercel/next.js`
   - Topics to check: "app router", "server components", "client components", "routing", "metadata"

2. **Material-UI (MUI)** (v5.18.0)
   - Library ID: `/mui-org/material-ui`
   - Topics to check: "theming", "sx prop", "responsive design", "breakpoints", "components"

3. **MUI X Tree View** (v8.12.0)
   - Library ID: `/mui-org/mui-x`
   - Topics to check: "tree view", "drag and drop", "simple tree view"

4. **Redux Toolkit** (v2.9.0)
   - Library ID: `/reduxjs/redux-toolkit`
   - Topics to check: "createSlice", "configureStore", "typescript", "best practices"

5. **React Redux** (v9.2.0)
   - Library ID: `/reduxjs/react-redux`
   - Topics to check: "hooks", "useSelector", "useDispatch", "typescript"

6. **Mapbox GL JS** (v3.0.0)
   - Library ID: `/mapbox/mapbox-gl-js`
   - Topics to check: "map initialization", "layers", "sources", "events"

7. **React Map GL** (v7.1.9)
   - Library ID: `/visgl/react-map-gl`
   - Topics to check: "map component", "hooks", "controls", "markers"

### Validation Workflow

**Step 1: Resolve Library ID**
```typescript
// Use Context7 to find the exact library ID
mcp__context7__resolve-library-id({ libraryName: "next.js" })
```

**Step 2: Fetch Latest Documentation**
```typescript
// Get up-to-date documentation for specific topics
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "app router",
  tokens: 5000
})
```

### When to Validate

- **Before implementing new features** - Check if the library has new/better APIs
- **When encountering bugs** - Verify if our implementation matches current best practices
- **During code review** - Ensure patterns align with latest library recommendations
- **When updating dependencies** - Review breaking changes and new features

### Example Validation Scenarios

**Scenario 1: Adding new MUI component**
1. Resolve MUI library ID
2. Fetch docs for specific component (e.g., "DataGrid", "Autocomplete")
3. Compare our theming approach with latest recommendations
4. Verify responsive patterns match MUI v5 best practices

**Scenario 2: Optimizing Redux state**
1. Fetch Redux Toolkit latest docs on "performance"
2. Check if we're using latest selector patterns (e.g., `createSelector`)
3. Validate our slice structure against current recommendations

**Scenario 3: Next.js routing changes**
1. Get Next.js App Router latest documentation
2. Verify our file structure matches conventions
3. Check for new metadata API features
4. Ensure server/client component split is optimal

### Quick Reference Commands

```bash
# Validate Next.js implementation
Check /vercel/next.js docs for "app router" patterns

# Validate MUI theming
Check /mui-org/material-ui docs for "theming" and "sx prop"

# Validate Redux patterns
Check /reduxjs/redux-toolkit docs for "typescript" best practices

# Validate Mapbox integration
Check /mapbox/mapbox-gl-js docs for "react integration"
```

**Note:** Context7 provides the most current library documentation, which may be more up-to-date than our installed versions. Always cross-reference version compatibility.


## Development Utilities & Best Practices

### Logger Utility (src/lib/logger.ts)

IMPORTANT: ALWAYS use the logger utility instead of console.log. Console logs are automatically disabled in production.

Available loggers:
- logger - Default logger
- mapLogger - Map operations (🗺️)
- reduxLogger - Redux state changes (🔴)
- apiLogger - API calls (🌐)
- drawLogger - Drawing tools (✏️)
- layerLogger - Layer management (📊)
- perfLogger - Performance measurements (⚡)

### Error Boundary (src/components/ErrorBoundary.tsx)

IMPORTANT: Always wrap major components/routes in ErrorBoundary to prevent full app crashes.

### Skeleton Loaders (src/components/dashboard/ProjectCardSkeleton.tsx)

IMPORTANT: Always show skeleton loaders during data fetching, not just spinners.

## Mobile Touch Optimization & PWA Requirements

**CRITICAL:** Mobile map interactions require proper viewport and touch-action configuration.

### Viewport Configuration (Next.js 15+)

**REQUIRED in `app/layout.tsx`:**
```typescript
import type { Viewport } from "next"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#f75e4c',
}
```

**Why this is critical:**
- Without viewport, mobile browsers treat app as desktop site
- Touch events are scaled/ignored, making map interactions impossible
- PWA won't work correctly on mobile devices

### Touch Action CSS

**REQUIRED in `app/globals.css`:**
```css
html, body {
  /* Enable smooth touch interactions */
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  touch-action: pan-x pan-y;
}

.mapboxgl-map {
  /* Enable all touch gestures on map canvas */
  touch-action: none !important;
  -webkit-user-select: none;
  user-select: none;
}

.mapboxgl-canvas {
  /* Ensure canvas receives touch events */
  touch-action: none !important;
  outline: none;
}
```

**What this enables:**
- `touch-action: none` on map canvas = Mapbox receives ALL touch events
- No browser interference with pan/zoom/rotate gestures
- No text selection or context menus during map interaction
- Smooth iOS Safari compatibility

### Mobile Gesture Support

The application supports the following mobile gestures:

1. **Map Navigation:**
   - Single finger pan (move map)
   - Pinch-to-zoom (two fingers)
   - Two-finger rotate (rotate map)
   - Double-tap zoom (quick zoom in)

2. **3D Building Selection:**
   - **Desktop:** Single click on building → opens modal
   - **Mobile:** Single tap on building → opens modal (same as desktop!)
   - Haptic feedback (vibration) on successful selection
   - **No long-press required** - React Map GL handles touch automatically

3. **Other Tools:**
   - Drawing tools: tap to add points
   - Measurement: tap to add measurement points
   - Identify: tap on features to identify

### React Map GL Interactive Layers Example

**Proper way to implement feature click/tap handling:**

```typescript
// MapContainer.tsx
import Map from 'react-map-gl';

<Map
  interactiveLayerIds={['3d-buildings', 'poi-layer', 'custom-layer']}
  onClick={handleClick}
>
  {/* Map children */}
</Map>

// Building3DInteraction.tsx or similar component
const handleMapClick = (e: MapLayerMouseEvent) => {
  // event.features is automatically populated from interactiveLayerIds!
  const features = (e as any).features;

  if (!features || features.length === 0) {
    // No feature clicked
    return;
  }

  const feature = features[0];
  console.log('Clicked feature:', feature.id, feature.properties);

  // Handle feature selection
  // Works on both desktop (click) and mobile (tap)!
};

// Attach handler via native Mapbox API (receives React events)
map.on('click', handleMapClick);
```

**Key benefits:**
- ✅ Automatic feature detection (no manual `queryRenderedFeatures`)
- ✅ Works identically on desktop and mobile
- ✅ Cleaner code (React wrapper handles complexity)
- ✅ Type-safe with TypeScript
- ✅ Better performance (React optimized)

### Testing Mobile Functionality

**DO NOT rely on Chrome DevTools device emulation** - touch events behave differently!

**Proper testing:**
1. Deploy to production or use local network (npm run dev)
2. Open on real mobile device (phone/tablet)
3. Test all gestures: pan, zoom, rotate, long-press
4. Verify PWA install prompt appears
5. Test offline functionality (Service Worker)

**Common issues if viewport is missing:**
- Map doesn't respond to touch
- Pinch-zoom zooms entire page instead of map
- Long-press triggers text selection instead of building selection
- Controls are too small to tap

### PWA Manifest

Located at `public/manifest.json`:
- `display: standalone` - Full-screen app mode
- `orientation: any` - Supports all orientations
- Theme color matches viewport themeColor
- Icons for various sizes (192x192, 512x512)

### Service Worker

- Automatically generated by Next.js (if configured)
- Caches static assets and API responses
- Enables offline map viewing (with cached tiles)
- Check `public/sw.js` if manual service worker is needed

## UI Audit Report

See UI-AUDIT-REPORT.md for comprehensive frontend audit including:
- Duplicate components to remove
- Code quality improvements
- Accessibility enhancements
- Performance optimizations
- Bundle size analysis
