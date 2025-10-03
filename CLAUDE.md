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

### Using Theme in Components
```typescript
import { ThemeProvider } from '@mui/material';
import { theme } from '@/lib/theme';

// In your component:
<ThemeProvider theme={theme}>
  {/* Your content */}
</ThemeProvider>
```

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
   - Map style selection
   - Fullscreen state
   - Actions: `setViewState`, `setMapStyle`, `flyToLocation`, `setFullscreen`

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

**Panel System:**
- `src/components/panels/LeftPanel.tsx` - **Primary UI component**
  - Hierarchical layer tree with drag-and-drop (@mui/x-tree-view)
  - Layer properties editor (opacity, color, visibility)
  - Basemap selector
  - Action toolbar (add dataset, manage layers, etc.)

- `src/components/panels/RightToolbar.tsx` - Tool palette
  - Drawing tools, measurement tools, fullscreen toggle

**Drawing & Measurement:**
- Uses `@mapbox/mapbox-gl-draw` for drawing functionality
- `mapbox-gl-draw-rectangle-mode` for rectangle drawing
- Turf.js (`@turf/turf`) for geospatial calculations

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
Set in `cloudbuild.yaml` via `--set-env-vars`:
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Alternative token name (compatibility)
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

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
  - Map style definitions (streets, satellite, outdoors, light, dark)
  - Map interaction config (doubleClickZoom: false for drawing tools)

- **`server.js`** - Custom production server
  - Port: 3000 (or PORT env var)
  - Hostname: 0.0.0.0 (required for Cloud Run)

## Important Implementation Notes

**Mapbox Token Loading:**
- Primary: Environment variable `NEXT_PUBLIC_MAPBOX_TOKEN` from `.env.local`
- Fallback: Hardcoded in `src/lib/mapbox/config.ts` line 4
- Runtime check in `MapContainer.tsx` useEffect (logs token status to console)

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
