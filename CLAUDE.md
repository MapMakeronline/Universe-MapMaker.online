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

## Live Deployment

Production URL: https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app

Monitor deployment:
```bash
gcloud run services describe universe-mapmaker --region=europe-central2
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=universe-mapmaker" --limit=50
```
