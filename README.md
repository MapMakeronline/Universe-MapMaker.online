# 🗺️ Universe MapMaker

Professional Mapbox-powered mapping application built with Next.js 15+, deployed on Google Cloud Run.

## 🚀 Live Demo & Environments

### **Production URLs**

| Environment | URL | Status | Deployment |
|-------------|-----|--------|------------|
| **Frontend** | [https://universemapmaker.online](https://universemapmaker.online) | ✅ Live | Auto (Cloud Build) |
| **Backend API** | [https://api.universemapmaker.online](https://api.universemapmaker.online) | ✅ Live | Manual (VM) |
| **QGIS Server** | https://api.universemapmaker.online/ows | ✅ Live | Manual (VM) |

### **Infrastructure**

- **Frontend**: Google Cloud Run (europe-central2) - Auto-scales 0-5 instances
- **Backend**: GCP VM `universe-backend` (IP: 34.0.251.33) - Docker Compose (Django + QGIS Server + Nginx)
- **Database**: Cloud SQL PostgreSQL `geocraft-postgres` (IP: 34.116.133.97)
- **Storage**: Persistent Disk 50GB SSD (`/mnt/qgis-projects`)

### **How to Deploy Changes**

**Frontend (Automatic):**
```bash
git push origin main  # Cloud Build auto-deploys to universemapmaker.online
```

**Backend (Manual):**
```bash
gcloud compute ssh universe-backend --zone=europe-central2-a
cd ~/Universe-Mapmaker-Backend && git pull
docker-compose -f docker-compose.production.yml up -d --build
```

📖 **Full deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## ✨ Features

### Core Mapping
- **Interactive Mapbox GL JS Map** - Smooth, responsive mapping experience with WebGL2 support
- **3D Terrain & Buildings** - Full 3D mode with terrain elevation, extruded buildings, and atmospheric sky
- **Real-time Coordinates** - Live position and zoom level display
- **Drawing & Measurement Tools** - Draw polygons, lines, points, rectangles; measure distances and areas
- **Layer Management** - Hierarchical layer tree with drag-and-drop, visibility controls, and property editing

### Mobile & PWA Optimization
- **📱 Perfect Mobile Touch** - Tap detection with drag vs tap discrimination (8px tolerance)
- **🎯 No Gesture Conflicts** - Works seamlessly with pinch-zoom, pan, and rotate
- **✅ PWA Support** - Full Progressive Web App with standalone mode detection
- **📐 iOS Safe Area** - Proper viewport handling with 100dvh and -webkit-fill-available
- **🔄 Auto-Resize** - Handles orientation changes and viewport adjustments
- **⚡ Haptic Feedback** - Vibration feedback on mobile interactions

### Feature Identification & Editing
- **Universal Feature Editor** - Edit attributes for ALL map objects (buildings, POI, layers, points)
- **3D Building Selection** - Click/tap 3D buildings to view and edit properties
- **Smart Tap Detection** - `touchstart`/`touchend` pattern with fallback for PWA
- **Attribute Management** - Add, edit, delete custom attributes for any feature
- **Redux State Sync** - Auto-save all clicked features to global store

### Infrastructure
- **Token Management** - Secure API-based token delivery for production
- **Google Cloud Run** - Scalable, serverless deployment with auto-scaling
- **Modern Stack** - Next.js 15+, React 19, TypeScript, Redux Toolkit
- **User Authentication** - Complete auth system with registration, login, and profile management
- **Backend Integration** - Django REST API with PostgreSQL per-user databases

## 🏗️ Architecture

### Project Structure Overview

**NOWA STRUKTURA (po reorganizacji 2025-01):**

```
Universe-MapMaker.online/
│
├── 📁 src/                      # ⭐ Main application code
│   ├── 📁 features/            # Główne funkcjonalności (feature-based architecture)
│   │   ├── 📁 mapa/            # 🗺️ Komponenty mapy
│   │   ├── 📁 dashboard/       # 📊 Dashboard użytkownika
│   │   ├── 📁 warstwy/         # 📊 Zarządzanie warstwami
│   │   ├── 📁 narzedzia/       # 🛠️ Narzędzia (RightToolbar)
│   │   └── 📁 autoryzacja/     # 🔐 Autoryzacja i autentykacja
│   ├── 📁 redux/               # Redux Toolkit + RTK Query
│   ├── 📁 api/                 # Backend API communication
│   ├── 📁 hooks/               # Custom React hooks
│   ├── 📁 wspolne/             # Współdzielone komponenty
│   ├── 📁 style/               # Theme & styling utilities
│   ├── 📁 mapbox/              # Mapbox configuration & utilities
│   ├── 📁 narzedzia/           # Helper utilities (logger, measurements)
│   └── 📁 typy/                # TypeScript type definitions
│
├── 📁 app/                      # Next.js App Router
│   ├── page.tsx                # Home page
│   ├── layout.tsx              # Root layout
│   └── 📁 api/                 # API routes
│
├── 📁 scripts/                  # Deployment & testing scripts
│   ├── 📁 migration/           # Migration scripts
│   ├── 📁 testing/             # Integration tests
│   └── 📁 deployment/          # Screenshot tools (screenshot.bat/ps1)
│
├── 📁 Dokumentacja/             # Project documentation
│   ├── 📁 backend/             # Backend API docs
│   └── 📁 audyty/              # Code audits & reports
│
├── 📁 public/                   # Static assets
├── 📄 package.json             # Dependencies & scripts
├── 📄 tsconfig.json            # TypeScript config
├── 📄 cloudbuild.yaml          # Cloud Build config
└── 📄 server.js                # Production server
```

### Detailed Structure Guide

#### 📂 `src/features/` - Feature-Based Architecture

Główne funkcjonalności aplikacji zorganizowane według modułów:

```
src/features/
│
├── 📁 mapa/                         # 🗺️ Komponenty mapy i interakcje
│   ├── 📁 komponenty/
│   │   ├── MapContainer.tsx        # Główny kontener mapy (Mapbox GL JS)
│   │   ├── Buildings3D.tsx         # Manager 3D (teren, budynki, niebo)
│   │   └── MobileFAB.tsx          # Floating Action Button (mobile)
│   ├── 📁 narzedzia/
│   │   ├── DrawTools.tsx          # Narzędzia rysowania
│   │   └── MeasurementTools.tsx   # Narzędzia pomiarowe
│   ├── 📁 interakcje/
│   │   ├── IdentifyTool.tsx       # Identyfikacja obiektów (tap detection)
│   │   ├── SearchModal.tsx        # Wyszukiwanie miejsc (Mapbox Search)
│   │   └── MapboxSearchModal.tsx  # Zaawansowane wyszukiwanie (3 tabs)
│   └── 📁 eksport/
│       └── ExportPDFTool.tsx      # Export mapy do PDF
│
├── 📁 dashboard/                    # 📊 Dashboard użytkownika
│   ├── 📁 komponenty/
│   │   ├── DashboardLayout.tsx    # Layout z drawer (responsive)
│   │   ├── OwnProjects.tsx        # Lista projektów użytkownika
│   │   ├── PublicProjects.tsx     # Lista projektów publicznych
│   │   ├── UserSettings.tsx       # Ustawienia użytkownika
│   │   └── ProjectCardSkeleton.tsx # Skeleton loader
│   └── 📁 dialogi/
│       ├── CreateProjectDialog.tsx # Dialog tworzenia projektu
│       └── DeleteProjectDialog.tsx # Dialog usuwania projektu
│
├── 📁 warstwy/                      # 📊 Zarządzanie warstwami
│   ├── 📁 komponenty/
│   │   ├── LeftPanel.tsx          # ⭐ Panel warstw (główny UI)
│   │   ├── LayerTree.tsx          # Drzewo warstw (drag & drop)
│   │   ├── BasemapSelector.tsx    # Wybór mapy bazowej
│   │   └── BuildingsPanel.tsx     # Panel budynków 3D
│   └── 📁 modale/
│       ├── AddDatasetModal.tsx    # Dodaj dataset INSPIRE
│       ├── AddLayerModal.tsx      # Dodaj warstwę
│       ├── AddNationalLawModal.tsx # Dodaj prawo krajowe
│       ├── BuildingAttributesModal.tsx # Atrybuty budynku 3D
│       ├── FeatureAttributesModal.tsx  # Uniwersalny edytor atrybutów
│       ├── LayerPropertiesModal.tsx    # Właściwości warstwy
│       ├── ManageLayersModal.tsx       # Zarządzanie warstwami
│       ├── RenameLayerModal.tsx        # Zmiana nazwy warstwy
│       └── ... (13 modali total)
│
├── 📁 narzedzia/                    # 🛠️ Narzędzia (RightToolbar)
│   └── RightToolbar.tsx            # Pasek narzędzi (prawy)
│
└── 📁 autoryzacja/                  # 🔐 Autoryzacja
    ├── AuthProvider.tsx            # Provider autentykacji
    └── LoginRequiredGuard.tsx      # Guard dla chronionych stron
```

**Kluczowe komponenty:**

- **MapContainer.tsx**: Główny komponent mapy - inicjalizacja Mapbox, zarządzanie warstwami
- **LeftPanel.tsx**: Najważniejszy UI - drzewo warstw z drag & drop, edycja właściwości
- **DashboardLayout.tsx**: Layout dashboardu z responsywnym drawer (mobile/desktop)
- **FeatureAttributesModal.tsx**: Uniwersalny edytor - działa z WSZYSTKIMI obiektami mapy

#### 💾 `src/redux/` - State Management

**✅ REFACTORED (Phases 1-4 Complete)** - RTK Query + Entity Adapter:

```
src/redux/
│
├── store.ts                 # ⚙️ Redux store configuration (+ RTK Query middleware)
├── hooks.ts                 # 🪝 Typed Redux hooks (useAppSelector, useAppDispatch)
│
├── 📁 api/                  # ✨ RTK Query APIs (auto-caching, auto-refetch)
│   └── projectsApi.ts      # Projects API - auto-generated hooks
│
└── 📁 slices/               # Redux slices (modular state)
    ├── projectsSlice.ts    # ✅ Projects (Entity Adapter, O(1) lookups)
    ├── mapSlice.ts         # Map state (viewport, zoom, style)
    ├── layersSlice.ts      # Layers (visibility, opacity, tree structure)
    ├── drawSlice.ts        # Drawing tools (active mode, geometries)
    ├── authSlice.ts        # Authentication (token, user, login state)
    └── featuresSlice.ts    # Universal features (buildings, POI, points, lines)
```

**Kluczowe funkcje:**
- ✨ **RTK Query** - auto-caching, optimistic updates, automatic refetching
- **Entity Adapter** - normalized state, O(1) lookups/updates (projectsSlice)
- **Typed Hooks** - `useAppSelector`, `useAppDispatch` z TypeScript
- **Memoized Selectors** - `createSelector` dla performance

**Przykład użycia RTK Query:**
```typescript
import { useGetProjectsQuery, useCreateProjectMutation } from '@/redux/api/projectsApi';

function MyComponent() {
  // Auto-fetch, auto-cache, auto-refetch co 30s
  const { data, isLoading, error } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  return <div>{/* Your UI */}</div>;
}
```

**Jak działa state:**

1. **Definiuj w slice:**
   ```typescript
   // layersSlice.ts
   const initialState = { layers: [], selectedLayer: null }
   ```

2. **Używaj w komponencie:**
   ```typescript
   const layers = useAppSelector(state => state.layers.layers)
   ```

3. **Aktualizuj:**
   ```typescript
   dispatch(addLayer({ id: '123', name: 'Nowa warstwa' }))
   ```

#### 🌐 `src/api/` - Backend Communication

**✅ REFACTORED (Phases 1-4 Complete)** - Unified API + RTK Query:

```
src/api/
│
├── 📁 klient/                 # HTTP client configuration
│   └── axios.ts              # Axios instance (auth headers, error handling)
│
├── 📁 endpointy/             # API endpoints (organized by domain)
│   ├── auth.ts              # Authentication (login, register, logout)
│   ├── projects.ts          # Projects CRUD (23+ methods)
│   ├── layers.ts            # Layers management
│   └── users.ts             # User profile & settings
│
└── 📁 typy/                  # TypeScript types
    ├── auth.ts              # Auth types (User, LoginRequest, RegisterRequest)
    ├── projects.ts          # Project types (Project, CreateProjectRequest)
    └── common.ts            # Common types (ApiResponse, ApiError)
```

**API Endpoints (src/api/endpointy/):**

1. **`projects.ts`** - Complete project operations:
   - Core: `getProjects()`, `createProject()`, `updateProject()`, `deleteProject()`
   - Visibility: `togglePublish()`, `getPublicProjects()`
   - Import/Export: `exportProject()`, `importQGS()`, `importQGZ()`
   - Metadata: `updateLogo()`, `setMetadata()`, `getThumbnailUrl()`
   - Domain: `checkSubdomainAvailability()`, `changeDomain()`
   - Layers: `getLayersOrder()`, `changeLayersOrder()`

2. **`auth.ts`** - Authentication & authorization:
   - `login()`, `register()`, `logout()`
   - `getProfile()`, `updateProfile()`
   - `changePassword()`, `resetPassword()`

3. **`users.ts`** - User management:
   - `getProfile()`, `updateProfile()`
   - `sendContactForm()`

**Przykład użycia:**
```typescript
import { projectsApi } from '@/api/endpointy/projects';
import { authApi } from '@/api/endpointy/auth';

// Pobierz projekty
const projects = await projectsApi.getProjects();

// Zaloguj użytkownika
const { token, user } = await authApi.login('username', 'password');
```

**Migracja do RTK Query (zalecane):**
```typescript
// Zamiast ręcznego fetch:
const projects = await projectsApi.getProjects();

// Użyj RTK Query hooks:
const { data, isLoading } = useGetProjectsQuery();
```

**Refactoring Reports:**
- ✅ [Phase 1](./Dokumentacja/audyty/REFACTORING-PHASE1-COMPLETE.md) - API Consolidation (23% reduction)
- ✅ [Phase 2](./Dokumentacja/audyty/REFACTORING-PHASE2-COMPLETE.md) - Entity Adapter (O(1) lookups)
- ✅ [Phase 3](./Dokumentacja/audyty/REFACTORING-PHASE3-COMPLETE.md) - RTK Query (85% less code)
- ✅ [Phase 4](./Dokumentacja/audyty/REFACTORING-PHASE4-COMPLETE.md) - Dead Code Removal (~2945 lines)

#### 🎨 `src/style/` - Theme & Styling

Material-UI theme i narzędzia stylowania:

```
src/style/
│
├── theme.ts                 # 🎨 Główny theme MUI (colors, typography)
└── theme-utils.tsx          # Helper komponenty (FormField, DialogHeader, responsive utils)
```

**Szczegóły:**
- **theme.ts**: Globalne kolory, typografia, automatyczne style dla komponentów MUI
- **theme-utils.tsx**: Helper components (`FormField`, `FormContainer`, `DialogHeader`)

#### 🗺️ `src/mapbox/` - Mapbox Configuration

Konfiguracja i narzędzia Mapbox:

```
src/mapbox/
│
├── config.ts               # Mapbox tokens, default view (Warsaw), map styles
├── map3d.ts                # 3D utilities (terrain, buildings, sky)
├── search.ts               # Mapbox Search API (geocoding, POI)
├── draw-styles.ts          # Drawing styles configuration
└── pdfExport.ts            # PDF export utilities
```

**Szczegóły:**
- **config.ts**: Token, default viewport, 7 stylów mapy (streets, satellite, full3d, etc.)
- **map3d.ts**: Funkcje 3D - `add3DTerrain()`, `add3DBuildings()`, `addSkyLayer()`
- **search.ts**: `searchPlaces()`, `reverseGeocode()`, `searchByCategory()`

#### 🛠️ `src/narzedzia/` - Helper Utilities

Funkcje pomocnicze i narzędzia:

```
src/narzedzia/
│
├── logger.ts               # 🔍 Logger utility (mapLogger, reduxLogger, apiLogger)
├── measurements.ts         # 📏 Turf.js calculations (distance, area)
└── auth.ts                 # 🔐 Auth utilities (token management)
```

**Szczegóły:**
- **logger.ts**: Specjalistyczne loggery z emoji (🗺️ map, 🔴 redux, 🌐 api)
- **measurements.ts**: Geospatial calculations (length, area) using Turf.js
- **auth.ts**: Token storage, validation, auto-logout

#### 🪝 `src/hooks/` - Custom React Hooks

Wielokrotnego użytku React hooks:

```
src/hooks/
│
├── useDragDrop.ts           # Hook do drag & drop warstw
├── useResizable.ts          # Hook do paneli z możliwością zmiany rozmiaru
└── useMapInteraction.ts     # Hook do interakcji z mapą
```

**Przykład:**
```typescript
// useDragDrop.ts
export function useDragDrop() {
  const handleDragStart = (e, nodeId) => { /* ... */ }
  const handleDrop = (e, targetId) => { /* ... */ }
  return { handleDragStart, handleDrop }
}
```

#### 🔧 `src/wspolne/` - Shared Components

Współdzielone komponenty używane w całej aplikacji:

```
src/wspolne/
│
├── ErrorBoundary.tsx        # Error boundary do przechwytywania błędów
├── Analytics.tsx            # Google Analytics integration
└── Providers.tsx            # Global providers (Redux, Theme, Auth)
```

**Szczegóły:**
- **ErrorBoundary.tsx**: Zapobiega całkowitym crashom aplikacji
- **Providers.tsx**: Wrapper dla Redux, MUI Theme, Auth Context

#### 📝 `src/typy/` - TypeScript Definitions

Definicje typów TypeScript:

```
src/typy/
│
├── geometry.ts      # GeoJSON geometry types (Point, LineString, Polygon)
├── layers.ts        # Layer types (Layer, Group, LayerNode)
├── map.ts           # Map types (MapConfig, ViewState)
├── projects.ts      # Project types (Project, ProjectMetadata)
└── features.ts      # Feature types (MapFeature, FeatureType)
```

**Przykładowa definicja typów:**
```typescript
// layers.ts
export interface LayerNode {
  id: string
  name: string
  visible: boolean
  type: 'vector' | 'raster' | 'group'
  children?: LayerNode[]
}

// features.ts
export type FeatureType = 'building' | 'poi' | 'point' | 'line' | 'polygon' | 'layer' | 'custom'
```

#### 🚪 `app/` - Next.js App Router

File-based routing system:

```
app/
│
├── page.tsx             # 🏠 Home page (/)
├── layout.tsx           # Root layout wrapper + viewport config
│
├── 📁 map/              # Map page (/map)
│   └── page.tsx
│
├── 📁 dashboard/        # Dashboard page (/dashboard)
│   └── page.tsx
│
├── 📁 auth/             # Auth pages (/auth/login, /auth/register)
│   ├── login/page.tsx
│   └── register/page.tsx
│
└── 📁 api/              # 🔌 API Routes
    └── mapbox/
        └── token/
            └── route.ts  # Mapbox token endpoint
```

**Routing Convention:**
- `app/page.tsx` → `/` (home)
- `app/map/page.tsx` → `/map` (main map)
- `app/dashboard/page.tsx` → `/dashboard` (user dashboard)
- `app/api/mapbox/token/route.ts` → `/api/mapbox/token` (API route)

#### 📜 `scripts/` - Deployment & Testing Scripts

Skrypty do deployment, testowania i migracji:

```
scripts/
│
├── 📁 migration/            # Migration scripts
│   ├── migrate-structure.sh # Bash script do migracji struktury
│   └── update-imports.sh    # Automatyczna aktualizacja importów
│
├── 📁 testing/              # Integration tests
│   ├── test-login.js        # Basic API integration test
│   └── test-login-full.js   # Full login flow test
│
└── 📁 deployment/           # Deployment tools
    ├── screenshot.bat       # Screenshot tool (Windows CMD)
    └── screenshot.ps1       # Screenshot tool (PowerShell)
```

**Szczegóły:**
- **migration/**: Skrypty użyte podczas reorganizacji struktury (styczeń 2025)
- **testing/**: Testy integracyjne backend API
- **deployment/**: Narzędzia do testowania UI (screenshots przed commitem)

#### 📚 `Dokumentacja/` - Project Documentation

Centralna dokumentacja projektu:

```
Dokumentacja/
│
├── 📁 backend/              # Backend API documentation
│   ├── README.md           # System architecture overview
│   └── projects_api_docs.md # Complete Projects API (60+ endpoints)
│
├── 📁 audyty/              # Code audits & reports
│   ├── REFACTORING-PHASE1-COMPLETE.md  # Phase 1: API Consolidation
│   ├── REFACTORING-PHASE2-COMPLETE.md  # Phase 2: Entity Adapter
│   ├── REFACTORING-PHASE3-COMPLETE.md  # Phase 3: RTK Query
│   └── REFACTORING-PHASE4-COMPLETE.md  # Phase 4: Dead Code Removal
│
├── STRUKTURA-DRZEWA.md      # Complete project tree structure
├── REORGANIZACJA-STRUKTURY.md # Migration guide (old → new structure)
└── FAQ.md                   # Frequently Asked Questions
```

**Kluczowe dokumenty:**
- **backend/projects_api_docs.md**: Kompletna dokumentacja Projects API (60+ endpointów)
- **STRUKTURA-DRZEWA.md**: Aktualne drzewo projektu po reorganizacji
- **audyty/**: Raporty z refactoringu (Phases 1-4, ~3500 linii usunięte)

### Key Technical Decisions

- **Feature-Based Architecture**: Kod zorganizowany według funkcjonalności (mapa, dashboard, warstwy)
- **RTK Query**: Auto-caching, auto-refetch, optimistic updates dla API calls
- **Entity Adapter**: Normalized state dla projektów (O(1) lookups/updates)
- **Runtime Token Loading**: API route serves Mapbox tokens at runtime instead of build-time
- **Direct Mapbox Integration**: No abstractions - direct mapbox-gl usage for maximum control
- **Material-UI v7**: Comprehensive design system with auto-styled components
- **Cloud Run Deployment**: Containerized serverless deployment with auto-scaling

### TypeScript Path Aliases

Skonfigurowane aliasy ścieżek w `tsconfig.json`:

```typescript
// Importy z nowymi aliasami:
import MapContainer from '@/features/mapa/komponenty/MapContainer'
import { useAppSelector } from '@/redux/hooks'
import { projectsApi } from '@/api/endpointy/projects'
import { theme } from '@/style/theme'
import { MAPBOX_TOKEN } from '@/mapbox/config'
import { logger } from '@/narzedzia/logger'
import type { LayerNode } from '@/typy/layers'
```

**Wszystkie aliasy:**
- `@/features/*` → `./src/features/*` (mapa, dashboard, warstwy, narzedzia, autoryzacja)
- `@/redux/*` → `./src/redux/*` (store, slices, api)
- `@/api/*` → `./src/api/*` (klient, endpointy, typy)
- `@/hooks/*` → `./src/hooks/*` (custom React hooks)
- `@/wspolne/*` → `./src/wspolne/*` (shared components)
- `@/style/*` → `./src/style/*` (theme, theme-utils)
- `@/mapbox/*` → `./src/mapbox/*` (config, 3D, search)
- `@/narzedzia/*` → `./src/narzedzia/*` (logger, measurements)
- `@/typy/*` → `./src/typy/*` (TypeScript types)

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/MapMakeronline/Universe-MapMaker.online.git
cd Universe-MapMaker.online
npm install
```

### 2. Get Mapbox Token
1. Sign up at [mapbox.com](https://account.mapbox.com/auth/signup/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Copy your **Default Public Token** (starts with `pk.`)

### 3. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cl91c2VybmFtZSIsImEiOiJjbGZxZXF3MjAwMDExM29zN3...
NEXT_PUBLIC_API_URL=https://api.universemapmaker.online
```

**Note:** If `.env.local` is missing:
- Mapbox token fallback in `src/lib/mapbox/config.ts`
- API URL fallback in `src/lib/api/client.ts` → `https://api.universemapmaker.online`

### 4. Run Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Code linting

# Testing
node test-login.js                    # Basic API integration tests
node test-login-full.js <user> <pass> # Full login flow test
```

### Browser Testing & Screenshots

**IMPORTANT:** Always test UI changes using automated screenshots before committing!

#### Screenshot Tools (Windows)

Two automated screenshot scripts are available:

**1. Command Prompt / Git Bash:**
```cmd
screenshot.bat                                          # Screenshots http://localhost:3000
screenshot.bat http://localhost:3000/dashboard          # Screenshots dashboard page
screenshot.bat http://localhost:3000/map test-map.png   # Custom output filename
screenshot.bat https://universemapmaker.online          # Test production site
```

**2. PowerShell:**
```powershell
.\screenshot.ps1 http://localhost:3000/dashboard
powershell -ExecutionPolicy Bypass -File screenshot.ps1 "http://localhost:3000/auth"
```

#### How Screenshot Tool Works

- **Automatic Playwright Installation** - Installs Playwright if not present
- **Full-Page Capture** - 1920x1080 viewport, full-page screenshots
- **Timestamp Filenames** - Auto-generates filenames like `test-2025-10-09-143022.png`
- **Network Idle Detection** - Waits for all content to load before screenshot
- **Output Directory** - Saves to `screenshots/` folder (gitignored)
- **Interactive** - Prompts to open screenshot after capture

#### When to Use Screenshots

✅ **Before committing UI changes** - Verify visual appearance
✅ **After adding new components** - Ensure proper rendering
✅ **When debugging layout issues** - Compare expected vs actual
✅ **For documentation** - Capture current state of features
✅ **Testing on production** - Verify deployment succeeded
✅ **Mobile responsive testing** - Test different viewport sizes

#### Testing Workflow

1. **Make UI changes** in your code
2. **Save and rebuild** - Next.js auto-reloads on dev server
3. **Run screenshot tool** - `screenshot.bat http://localhost:3000/dashboard`
4. **Review screenshot** - Opens automatically or check `screenshots/` folder
5. **Iterate or commit** - Fix issues or commit when satisfied

#### Examples

```bash
# Test login page
screenshot.bat http://localhost:3000/auth login-test.png

# Test admin dashboard (requires authentication)
screenshot.bat http://localhost:3000/dashboard?tab=admin admin-panel.png

# Test map view
screenshot.bat http://localhost:3000/map map-view.png

# Test production deployment
screenshot.bat https://universemapmaker.online production-home.png
```

**Pro Tip:** Screenshots are saved with timestamps, so you can compare before/after changes without overwriting files!

### Core Component
The main map is implemented in `app/page.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapPage() {
  // Dynamic token loading from API route
  const initializeMap = async () => {
    const response = await fetch('/api/mapbox/token');
    const { token } = await response.json();
    mapboxgl.accessToken = token;

    // Initialize map...
  };
}
```

### API Route
Token security is handled via `/api/mapbox/token/route.ts`:
```typescript
export async function GET() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  return NextResponse.json({ token });
}
```

## 🌐 Deployment

### Google Cloud Run
The app is configured for automatic deployment to Google Cloud Run:

1. **Build**: Docker multi-stage build
2. **Registry**: Artifact Registry in `europe-central2`
3. **Deploy**: Cloud Run service with environment variables
4. **Region**: All resources in `europe-central2` for consistency

### Deploy Commands
```bash
# Build and deploy
gcloud builds submit --region=europe-central2 --config=cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse HEAD)

# Check deployment
gcloud run services describe universe-mapmaker --region=europe-central2
```

## 📦 Dependencies

### Production Dependencies
```json
{
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "@mui/material": "^7.3.2",
  "mapbox-gl": "^3.0.0",
  "next": "^15.5.4",
  "react": "^19",
  "react-dom": "^19"
}
```

### Key Features of Dependencies
- **Next.js 15.5.4** - Latest App Router with server components
- **React 19** - Latest React with concurrent features
- **Mapbox GL 3.0** - Latest Mapbox with WebGL2 support
- **Material-UI 7.3** - Modern design system
- **TypeScript 5** - Full type safety

## 🔧 Configuration

### Map Settings
Default map configuration in `app/page.tsx`:
```typescript
const [lng, setLng] = useState(19.9449799);  // Kraków longitude
const [lat, setLat] = useState(50.0646501);  // Kraków latitude
const [zoom, setZoom] = useState(12);        // Zoom level

// Map style
style: 'mapbox://styles/mapbox/streets-v12'
```

### Environment Variables
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `https://api.universemapmaker.online`)
- `NODE_ENV` - Environment (production/development)
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry

## 🐛 Troubleshooting

### Common Issues

**Map not loading**
- Check browser console for errors
- Verify Mapbox token starts with `pk.`
- Test API endpoint: `/api/mapbox/token`

**Mobile tap not working (PWA)**
- Check if TapTest overlay shows (top of map)
- Open browser console and tap map - look for `✅ CLICK` or `📱 TOUCHEND` logs
- If you see `🔄 DRAG` logs, reduce finger movement (8px tolerance)
- Ensure viewport meta includes `viewport-fit=cover` for iOS
- Verify `touch-action: none` is set on `.mapboxgl-canvas`

**Pinch-zoom conflicts**
- Long-press removed - now uses tap detection only
- Tap = clean touch <8px movement
- Drag = movement >8px (ignored for identify)

**Build failures**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Production token issues**
- Tokens are loaded via API route at runtime
- No build-time embedding needed
- Check Cloud Run environment variables

### Debug Info
The app displays real-time debug information:
- **Token Status**: ⏳ (loading) → ✅ (success) → ❌ (error)
- **Coordinates**: Live latitude/longitude
- **Zoom Level**: Current map zoom

## 🚀 Performance

### Bundle Size Optimization
- Removed unused dependencies (Redux, Leaflet, DnD Kit, etc.)
- Direct Mapbox integration without abstractions
- Minimal Material-UI usage
- Tree shaking enabled

### Production Optimizations
- Docker multi-stage builds
- Next.js standalone output
- Proper caching headers
- Lazy loading and code splitting

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 🔄 How It All Works Together

### Application Flow

**1. User Opens Application:**
```
User → https://universe-mapmaker.app
    ↓
app/page.tsx (home page)
    ↓
<MapContainer /> (map component)
    ↓
Mapbox GL JS initialization
    ↓
Map renders with default view (Poland)
```

**2. User Clicks "Add Layer":**
```
Click → LeftPanel.tsx
    ↓
dispatch(addLayer(...)) (Redux action)
    ↓
store/slices/layersSlice.ts
    ↓
State updates
    ↓
LeftPanel.tsx re-renders with new layer
    ↓
MapContainer.tsx detects layer change
    ↓
New layer appears on map
```

**3. Build & Deployment Process:**
```
npm run build
    ↓
Next.js compiles TypeScript → JavaScript
    ↓
Creates .next/ folder with optimized bundles
    ↓
Docker packages application + dependencies
    ↓
Image pushed to Artifact Registry
    ↓
Cloud Run deploys new container
    ↓
Application available at production URL
```

### Data Flow Diagram

```
┌─────────────┐
│   User UI   │
│  (Browser)  │
└──────┬──────┘
       │ Interactions
       ↓
┌─────────────────┐
│   Components    │  ← React components
│  (LeftPanel,    │    render UI
│   MapContainer) │
└────────┬────────┘
         │ dispatch(action)
         ↓
┌─────────────────┐
│  Redux Store    │  ← Central state
│  (layers, map,  │    management
│   drawing)      │
└────────┬────────┘
         │ state updates
         ↓
┌─────────────────┐
│  Mapbox GL JS   │  ← Map rendering
│  (map instance) │    engine
└─────────────────┘
```

### File Editing Guide

| Co zmienić... | Plik... | Opis |
|--------------|-------------|-------------|
| 🎨 **Panel warstw (lewy)** | `src/features/warstwy/komponenty/LeftPanel.tsx` | Drzewo warstw, właściwości, selektor mapy bazowej |
| 🗺️ **Zachowanie mapy** | `src/features/mapa/komponenty/MapContainer.tsx` | Inicjalizacja mapy, interakcje, renderowanie warstw |
| 🛠️ **Pasek narzędzi (prawy)** | `src/features/narzedzia/RightToolbar.tsx` | Przyciski narzędzi, fullscreen, ustawienia |
| 📊 **Dashboard** | `src/features/dashboard/komponenty/DashboardLayout.tsx` | Layout dashboardu, drawer, routing |
| 💾 **Stan warstw** | `src/redux/slices/layersSlice.ts` | Lista warstw, widoczność, właściwości |
| 💾 **Stan mapy** | `src/redux/slices/mapSlice.ts` | Zoom, centrum, styl, viewport |
| 💾 **Stan projektów** | `src/redux/slices/projectsSlice.ts` | Entity Adapter, CRUD projektów |
| 🌐 **API Projects** | `src/api/endpointy/projects.ts` | Endpointy projektów (23+ metod) |
| 🔑 **Mapbox Config** | `src/mapbox/config.ts` | Tokeny, default viewport, style mapy |
| 🎨 **Theme MUI** | `src/style/theme.ts` | Kolory, typografia, auto-style komponentów |
| 📦 **Zależności** | `package.json` | Dodaj/usuń biblioteki |
| ☁️ **Cloud Deployment** | `cloudbuild.yaml` | Kroki buildu, zmienne środowiskowe |
| 🖥️ **Production Server** | `server.js` | Konfiguracja serwera produkcyjnego |

### Common Development Tasks

**Dodanie nowego komponentu mapy:**
1. Utwórz plik w `src/features/mapa/komponenty/NowyKomponent.tsx`
2. Exportuj komponent: `export default function NowyKomponent() { ... }`
3. Importuj w parent: `import NowyKomponent from '@/features/mapa/komponenty/NowyKomponent'`
4. Użyj w JSX: `<NowyKomponent />`

**Dodanie nowego komponentu dashboardu:**
1. Utwórz plik w `src/features/dashboard/komponenty/NowyKomponent.tsx`
2. Jeśli modal/dialog: `src/features/dashboard/dialogi/NowyDialog.tsx`
3. Jeśli warstwa: `src/features/warstwy/komponenty/` lub `/modale/`

**Dodanie state management:**
1. Utwórz slice w `src/redux/slices/nowySlice.ts`
2. Zdefiniuj initial state i reducers
3. Dodaj slice do store w `src/redux/store.ts`
4. Użyj w komponencie: `const data = useAppSelector(state => state.nowy.data)`

**Dodanie API endpoint:**
1. Dodaj funkcję w `src/api/endpointy/[module].ts`
2. Użyj `apiClient` z `src/api/klient/axios.ts`
3. Dla cache/auto-refetch: rozważ RTK Query w `src/redux/api/`

**Dodanie nowej biblioteki:**
1. Instaluj: `npm install library-name`
2. Importuj: `import { Feature } from 'library-name'`
3. Typy TypeScript: `npm install -D @types/library-name` (jeśli dostępne)

**Deployment zmian:**
1. Commit: `git add . && git commit -m "Opis zmiany"`
2. Push: `git push origin main`
3. Automatyczny deployment przez Cloud Build
4. Monitor: Sprawdź status w Cloud Run console

## 💡 Frequently Asked Questions

**Q: What's the difference between `.tsx` and `.ts` files?**
- `.ts` = Regular TypeScript (logic, functions, utilities)
- `.tsx` = TypeScript + JSX (React components with HTML-like syntax)

**Q: What does `import` do?**
```typescript
import { Button } from '@mui/material'
// Imports the Button component from Material-UI library
```

**Q: What does `export` do?**
```typescript
export default function MyComponent() { ... }
// Makes this component available to other files
```

**Q: Why use `@/` in imports?**
```typescript
import MapContainer from '@/features/mapa/komponenty/MapContainer'
import { useAppSelector } from '@/redux/hooks'
import { projectsApi } from '@/api/endpointy/projects'
// '@/' is an alias for 'src/' directory (cleaner imports)
```

**Q: How does TypeScript help?**
```typescript
interface Layer {
  id: string
  name: string
  visible: boolean
}
// TypeScript checks that you use the correct types
// Catches errors before runtime!
```

**Q: What is Redux state?**
- Redux stores application data that needs to be shared between components
- Like a "memory" for your app that components can read and update
- Changes to state automatically trigger UI re-renders

**Q: How does scale-to-zero work?**
- After ~15 minutes of no traffic, Cloud Run stops the container
- You don't pay for idle time (cost = $0)
- Next request triggers "cold start" (2-5 seconds to restart)
- Subsequent requests are instant

## 🔐 Backend API Integration

### Authentication System

The application integrates with a Django REST API backend for user authentication and data management.

**Base API URL:** Configure in your environment variables

**📚 Complete Backend Documentation:**
- **System Architecture:** [Dokumentacja/backend/README.md](./Dokumentacja/backend/README.md)
- **Projects API (60+ endpoints):** [Dokumentacja/backend/projects_api_docs.md](./Dokumentacja/backend/projects_api_docs.md)

#### Available Endpoints

##### 1. User Registration
```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "jan_kowalski",
  "email": "jan.kowalski@example.com",
  "password": "bezpieczne_haslo123",
  "password_confirm": "bezpieczne_haslo123",
  "first_name": "Jan",
  "last_name": "Kowalski"
}
```

**Response (201 Created):**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 42,
    "username": "jan_kowalski",
    "email": "jan.kowalski@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski"
  }
}
```

**What happens during registration:**
- Creates user account with validation
- Generates dedicated PostgreSQL database user with secure 20-character password
- Sets up database permissions (LOGIN, NOSUPERUSER, INHERIT, etc.)
- Returns authentication token
- Sends welcome email asynchronously

##### 2. User Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "jan_kowalski",
  "password": "bezpieczne_haslo123"
}
```

**Response (200 OK):**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 42,
    "username": "jan_kowalski",
    "email": "jan.kowalski@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "address": "ul. Główna 123",
    "city": "Warszawa",
    "zip_code": "00-001",
    "nip": "1234567890",
    "company_name": "Firma ABC",
    "theme": "dark"
  }
}
```

##### 3. User Logout
```
POST /auth/logout
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

##### 4. Get User Profile
```
GET /auth/profile
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

**Response (200 OK):**
```json
{
  "id": 42,
  "username": "jan_kowalski",
  "email": "jan.kowalski@example.com",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "address": "ul. Główna 123",
  "city": "Warszawa",
  "zip_code": "00-001",
  "nip": "1234567890",
  "company_name": "Firma ABC",
  "theme": "dark"
}
```

### Authentication Flow

**Token-based authentication:**
1. User registers or logs in → receives token
2. Store token in localStorage/sessionStorage
3. Include token in all authenticated requests:
   ```
   Authorization: Token {your_token}
   ```

**Frontend Integration Example:**
```typescript
// Login
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { token, user } = await response.json();
localStorage.setItem('authToken', token);

// Authenticated Request
const profile = await fetch(`${API_URL}/auth/profile`, {
  headers: {
    'Authorization': `Token ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }
});
```

### Security Features

**Database Isolation:**
- Each user gets a dedicated PostgreSQL user account
- Database login format: `{email_prefix}_{timestamp}` (e.g., `jan_kowalski_123456`)
- Auto-generated secure 20-character passwords
- Restricted permissions (no SUPERUSER, CREATEDB, or CREATEROLE)

**Password Security:**
- Passwords hashed using Django's PBKDF2 with SHA256
- Password confirmation required during registration
- Atomic transactions ensure database consistency

**Token Management:**
- Tokens are permanent until logout
- Tokens invalidated on logout
- Consider implementing rate limiting for production

### Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - User registered successfully |
| 400 | Bad Request - Invalid input (e.g., passwords don't match) |
| 401 | Unauthorized - Invalid token or missing authorization |
| 500 | Internal Server Error - Database or server issue |

### User Profile Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique user ID |
| `username` | string | Username (unique) |
| `email` | string | Email address |
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `address` | string | Street address (optional) |
| `city` | string | City (optional) |
| `zip_code` | string | Postal code (optional) |
| `nip` | string | Tax ID/NIP (optional) |
| `company_name` | string | Company name (optional) |
| `theme` | string | UI theme preference (optional) |

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/MapMakeronline/Universe-MapMaker.online/issues)
- **Mapbox Documentation**: [docs.mapbox.com](https://docs.mapbox.com/)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Material-UI Docs**: [mui.com](https://mui.com/)
- **Redux Toolkit Docs**: [redux-toolkit.js.org](https://redux-toolkit.js.org/)

---

## 📚 Documentation

**Development Guides:**
- **Claude Code Guide**: [CLAUDE.md](CLAUDE.md) - Development guidelines for AI assistance
- **Testing Guide**: [TESTING.md](TESTING.md) - Comprehensive testing documentation
- **Backend Integration**: [BACKEND-INTEGRATION.md](BACKEND-INTEGRATION.md) - API integration guide
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment instructions

**Project Documentation (Dokumentacja/):**
- **Structure Overview**: [Dokumentacja/STRUKTURA-DRZEWA.md](./Dokumentacja/STRUKTURA-DRZEWA.md) - Complete project tree
- **Migration Guide**: [Dokumentacja/REORGANIZACJA-STRUKTURY.md](./Dokumentacja/REORGANIZACJA-STRUKTURY.md) - Old → New structure
- **FAQ**: [Dokumentacja/FAQ.md](./Dokumentacja/FAQ.md) - Frequently Asked Questions

**Backend API Documentation (Dokumentacja/backend/):**
- **System Architecture**: [Dokumentacja/backend/README.md](./Dokumentacja/backend/README.md) - Complete backend overview
- **Projects API**: [Dokumentacja/backend/projects_api_docs.md](./Dokumentacja/backend/projects_api_docs.md) - 60+ endpoints

**Refactoring Reports (Dokumentacja/audyty/):**
- **Phase 1**: [REFACTORING-PHASE1-COMPLETE.md](./Dokumentacja/audyty/REFACTORING-PHASE1-COMPLETE.md) - API Consolidation (23% reduction)
- **Phase 2**: [REFACTORING-PHASE2-COMPLETE.md](./Dokumentacja/audyty/REFACTORING-PHASE2-COMPLETE.md) - Entity Adapter (O(1) lookups)
- **Phase 3**: [REFACTORING-PHASE3-COMPLETE.md](./Dokumentacja/audyty/REFACTORING-PHASE3-COMPLETE.md) - RTK Query (85% less code)
- **Phase 4**: [REFACTORING-PHASE4-COMPLETE.md](./Dokumentacja/audyty/REFACTORING-PHASE4-COMPLETE.md) - Dead Code Removal (~2945 lines)

---

**Built with** ❤️ using **Mapbox GL JS** + **Next.js 15** + **Google Cloud Run**

**Deployed at:**
- Production: [universemapmaker.online](https://universemapmaker.online)
- API: [api.universemapmaker.online](https://api.universemapmaker.online)
- Cloud Run Direct: [universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)