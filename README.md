# 🗺️ Universe MapMaker

Professional Mapbox-powered mapping application built with Next.js 15+, deployed on Google Cloud Run.

## 🚀 Live Demo

**Production**: [https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)

## ✨ Features

- **Interactive Mapbox GL JS Map** - Smooth, responsive mapping experience
- **Real-time Coordinates** - Live position and zoom level display
- **Token Management** - Secure API-based token delivery for production
- **Mobile Optimized** - Touch-friendly controls and responsive design
- **Google Cloud Run** - Scalable, serverless deployment
- **Modern Stack** - Next.js 15+, React 19, TypeScript
- **User Authentication** - Complete auth system with registration, login, and profile management
- **Backend Integration** - Django REST API with PostgreSQL per-user databases

## 🏗️ Architecture

### Project Structure Overview

```
Universe-MapMaker.online/
│
├── 📁 src/                      # ⭐ Main application code
│   ├── 📁 components/          # React components
│   ├── 📁 store/               # Redux state management
│   ├── 📁 lib/                 # Helper utilities
│   └── 📁 types/               # TypeScript type definitions
│
├── 📁 app/                      # Next.js App Router
│   ├── page.tsx                # Home page
│   ├── layout.tsx              # Root layout
│   └── 📁 api/                 # API routes
│
├── 📁 public/                   # Static assets
├── 📄 package.json             # Dependencies & scripts
├── 📄 tsconfig.json            # TypeScript config
├── 📄 cloudbuild.yaml          # Cloud Build config
└── 📄 server.js                # Production server
```

### Detailed Structure Guide

#### 📂 `src/components/` - UI Components

The heart of the application's user interface, organized by functionality:

```
src/components/
│
├── 📁 map/                          # 🗺️ Map Components
│   ├── MapContainer.tsx            # Main Mapbox map container
│   ├── DrawTools.tsx               # Drawing tools integration
│   ├── Geocoder.tsx                # Address search functionality
│   └── MeasurementTools.tsx        # Distance/area measurement tools
│
├── 📁 panels/                       # 📊 Side Panels
│   ├── LeftPanel.tsx               # ⭐ Left panel with layer tree
│   │                               #    - Drag & drop layers
│   │                               #    - Layer properties panel
│   │                               #    - Basemap selector
│   │                               #    - Toolbar with actions
│   ├── RightToolbar.tsx            # Right toolbar with tools
│   ├── LayerTree.tsx               # Layer tree component
│   ├── AddDatasetModal.tsx         # Add dataset dialog
│   ├── AddLayerModal.tsx           # Add layer dialog
│   ├── AddNationalLawModal.tsx     # National law data dialog
│   ├── DrawingTools.tsx            # Drawing tools panel
│   └── MeasurementTools.tsx        # Measurement tools panel
│
├── 📁 drawing/                      # ✏️ Drawing Components
│   └── SimpleDrawingToolbar.tsx    # Simple drawing toolbar
│
├── 📁 measurement/                  # 📏 Measurement Components
│   └── SimpleMeasurementToolbar.tsx # Simple measurement toolbar
│
└── 📁 providers/                    # 🔌 Context Providers
    └── Providers.tsx                # Redux & Theme providers
```

**Key Components Explained:**

- **MapContainer.tsx**: Main map component handling Mapbox initialization, layer management, and map interactions
- **LeftPanel.tsx**: Most important UI component featuring hierarchical layer management with drag-and-drop, property editing, and basemap selection
- **RightToolbar.tsx**: Tool palette for drawing, measurements, fullscreen, and settings

#### 💾 `src/store/` - State Management

Redux-based state management for application-wide data:

```
src/store/
│
├── store.ts                 # ⚙️ Redux store configuration
├── hooks.ts                 # 🪝 Typed Redux hooks (useAppSelector, useAppDispatch)
│
└── 📁 slices/               # State slices (modular state)
    ├── mapSlice.ts         # Map state (zoom, center, style)
    ├── layersSlice.ts      # Layer management (list, visibility, properties)
    └── drawSlice.ts        # Drawing state (geometries, active tool)
```

**How State Works:**

1. **Define state in slice:**
   ```typescript
   // layersSlice.ts
   const initialState = {
     layers: [],
     selectedLayer: null
   }
   ```

2. **Use in component:**
   ```typescript
   // LeftPanel.tsx
   const layers = useAppSelector(state => state.layers.layers)
   ```

3. **Update state:**
   ```typescript
   dispatch(addLayer({ id: '123', name: 'New Layer' }))
   ```

#### 🛠️ `src/lib/` - Utility Libraries

Helper functions and configurations:

```
src/lib/
│
├── 📁 mapbox/               # Mapbox configuration
│   ├── config.ts           # API keys, default settings
│   └── draw-styles.ts      # Drawing styles configuration
│
├── 📁 turf/                 # Geospatial calculations
│   └── measurements.ts     # Distance/area calculations
│
└── theme.ts                 # 🎨 Material-UI theme (colors, typography)
```

**Library Details:**

- **mapbox/config.ts**: Central configuration for Mapbox tokens, default center (Poland), zoom levels
- **turf/measurements.ts**: Geospatial calculations using Turf.js (length, area, distances)
- **theme.ts**: Application theme with color palette, supporting dark/light modes

#### 📝 `src/types/` - TypeScript Definitions

Type definitions for type safety:

```
src/types/
│
├── geometry.ts      # GeoJSON geometry types (Point, LineString, Polygon)
├── layers.ts        # Layer types (Layer, Group, LayerConfig)
└── map.ts           # Map types (MapConfig, ViewState)
```

**Example Type Definition:**
```typescript
// layers.ts
export interface Layer {
  id: string
  name: string
  visible: boolean
  type: 'vector' | 'raster' | 'group'
  children?: Layer[]
}
```

#### 🚪 `app/` - Next.js App Router

File-based routing system:

```
app/
│
├── page.tsx             # 🏠 Home page (/)
├── layout.tsx           # Root layout wrapper
│
├── 📁 map/              # Map page (/map)
│   └── page.tsx
│
└── 📁 api/              # 🔌 API Routes
    └── mapbox/
        └── status/
            └── route.ts  # Health check endpoint
```

**Routing Convention:**
- `app/page.tsx` → `/`
- `app/map/page.tsx` → `/map`
- `app/api/mapbox/status/route.ts` → `/api/mapbox/status`

### Key Technical Decisions

- **Runtime Token Loading**: API route serves Mapbox tokens at runtime instead of build-time
- **Direct Mapbox Integration**: No abstractions - direct mapbox-gl usage for maximum control
- **Redux Toolkit**: Modern Redux with TypeScript for predictable state management
- **Material-UI**: Comprehensive design system with theming support
- **Cloud Run Deployment**: Containerized serverless deployment with auto-scaling

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
```

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
```

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
- `NODE_ENV` - Environment (production/development)
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry

## 🐛 Troubleshooting

### Common Issues

**Map not loading**
- Check browser console for errors
- Verify Mapbox token starts with `pk.`
- Test API endpoint: `/api/mapbox/token`

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

| To Change... | Edit File... | Description |
|--------------|-------------|-------------|
| 🎨 **Left Panel UI** | `src/components/panels/LeftPanel.tsx` | Layer tree, properties panel, basemap selector |
| 🗺️ **Map Behavior** | `src/components/map/MapContainer.tsx` | Map initialization, interactions, layer rendering |
| 🛠️ **Right Toolbar** | `src/components/panels/RightToolbar.tsx` | Tool buttons, fullscreen, settings |
| 💾 **Layer State** | `src/store/slices/layersSlice.ts` | Layer list, visibility, properties logic |
| 💾 **Map State** | `src/store/slices/mapSlice.ts` | Zoom, center, style, viewport |
| 🔑 **Mapbox Config** | `src/lib/mapbox/config.ts` | API tokens, default settings |
| 🎨 **Theme Colors** | `src/lib/theme.ts` | Color palette, typography |
| 📦 **Dependencies** | `package.json` | Add/remove libraries |
| ☁️ **Cloud Deployment** | `cloudbuild.yaml` | Build steps, environment variables |
| 🖥️ **Production Server** | `server.js` | Server configuration |

### Common Development Tasks

**Adding a New Component:**
1. Create file in `src/components/[category]/NewComponent.tsx`
2. Export component: `export default function NewComponent() { ... }`
3. Import in parent: `import NewComponent from '@/components/[category]/NewComponent'`
4. Use in JSX: `<NewComponent />`

**Adding State Management:**
1. Create slice in `src/store/slices/newSlice.ts`
2. Define initial state and reducers
3. Add slice to store in `src/store/store.ts`
4. Use in component: `const data = useAppSelector(state => state.new.data)`

**Adding a New Library:**
1. Install: `npm install library-name`
2. Import in component: `import { Feature } from 'library-name'`
3. TypeScript types: `npm install -D @types/library-name` (if available)

**Deploying Changes:**
1. Commit code: `git add . && git commit -m "Description"`
2. Push to main: `git push origin main`
3. Automatic deployment triggers via Cloud Build
4. Monitor: Check Cloud Run console for status

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
import Component from '@/components/Component'
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

**Built with** ❤️ using **Mapbox GL JS** + **Next.js 15** + **Google Cloud Run**

*Deployed at: [universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)*