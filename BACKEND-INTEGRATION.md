# Backend Integration Guide - Phase 1 (MVP)

## ✅ Completed Tasks

### 1. HTTP Client & Types (Etap 1)
- ✅ `src/lib/api/client.ts` - Unified HTTP client with auth interceptors
- ✅ `src/lib/api/types.ts` - Complete TypeScript types for all API models
- ✅ Error handling with `ApiError` class
- ✅ Automatic token injection from localStorage

### 2. Projects API (Etap 2)
- ✅ `src/lib/api/projects.ts` - Full CRUD operations for projects
- ✅ Create, Read, Update, Delete projects
- ✅ Publish/unpublish functionality
- ✅ Import QGS/QGZ files
- ✅ Export projects
- ✅ Domain management

### 3. Layers API (Etap 3 - Partial)
- ✅ `src/lib/api/layers.ts` - GeoJSON layer import
- ✅ Shapefile, GML support
- ✅ Layer CRUD operations
- ✅ Style management
- ✅ Export functionality

### 4. Redux Integration
- ✅ `src/store/slices/projectsSlice.ts` - Projects state management
- ✅ Async thunks for all API calls
- ✅ Loading & error states
- ✅ Selectors for data access
- ✅ Integrated into Redux store

### 5. Dashboard Components
- ✅ `src/components/dashboard/OwnProjectsIntegrated.tsx` - Main component
- ✅ `src/components/dashboard/ProjectCard.tsx` - Project card with actions
- ✅ `src/components/dashboard/dialogs/CreateProjectDialog.tsx` - Create form
- ✅ `src/components/dashboard/dialogs/DeleteProjectDialog.tsx` - Delete confirmation

---

## 🚀 How to Test

### Prerequisites

1. **Backend Setup**
   ```bash
   # Production Backend (HTTPS with SSL):
   https://api.universemapmaker.online

   # Local Development (if running backend locally):
   http://localhost:8000
   ```

2. **Environment Variables**
   Create `.env.local` in project root:
   ```env
   # Production (default)
   NEXT_PUBLIC_API_URL=https://api.universemapmaker.online
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ

   # Local Development (optional)
   # NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

**Note:** If `.env.local` is missing, the app will use fallback URL from `src/lib/api/client.ts` (line 6): `https://api.universemapmaker.online`

3. **Testing Infrastructure**
   ```bash
   # Basic API integration tests (no auth required)
   node test-login.js

   # Full login flow test (requires valid credentials)
   node test-login-full.js <username> <password>
   ```

### Testing Steps

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start Development Server
```bash
npm run dev
```

#### 3. Test Authentication
1. Navigate to `http://localhost:3000/auth`
2. Register a new account or log in
3. Check browser console for API logs

#### 4. Test Projects CRUD

**Create Project:**
1. Go to Dashboard → Twoje projekty
2. Click "Nowy projekt"
3. Fill in:
   - Nazwa projektu: `test-project-1` (min 4 chars)
   - Opis: `Test project description`
   - Categories: Select one or more
4. Click "Utwórz projekt"
5. Check console for API response

**View Projects:**
- Projects should load automatically on Dashboard
- Check Redux DevTools for `projects/fetchProjects` action

**Delete Project:**
1. Click three-dot menu on project card
2. Select "Usuń projekt"
3. Confirm deletion
4. Project should disappear from list

**Publish/Unpublish:**
1. Click three-dot menu
2. Select "Opublikuj projekt" or "Cofnij publikację"
3. Badge should update on card

#### 5. Test API Client

Open browser console and run:

```javascript
// Test client directly
import { apiClient } from '@/lib/api/client';

// Get projects
const projects = await apiClient.get('/dashboard/projects/');
console.log(projects);

// Create project
const newProject = await apiClient.post('/projects/create/', {
  project_name: 'test-api-direct',
  description: 'Testing API client',
});
console.log(newProject);
```

#### 6. Test Redux Thunks

Open Redux DevTools and dispatch actions:

```javascript
// From browser console
import store from '@/store/store';
import { fetchProjects } from '@/store/slices/projectsSlice';

// Fetch projects
store.dispatch(fetchProjects());

// Check state
console.log(store.getState().projects);
```

---

## 🔍 API Endpoints Reference

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns token)
- `POST /auth/logout` - Logout
- `GET /auth/profile` - Get user profile

### Projects
- `GET /dashboard/projects/` - Get all user projects
- `POST /projects/create/` - Create project
- `PUT /dashboard/projects/update/` - Update project
- `POST /projects/remove/` - Delete project
- `POST /projects/app/publish` - Publish project
- `POST /projects/app/unpublish` - Unpublish project

### Layers
- `POST /layer/add/geojson/` - Add GeoJSON layer
- `POST /layer/add/shp/` - Add Shapefile layer
- `POST /layer/style` - Update layer style
- `POST /layer/remove/database` - Delete layer
- `GET /layer/export` - Export layer

---

## 📝 Example API Calls

### Register User
```javascript
import { authService } from '@/lib/api/auth';

const user = await authService.register({
  username: 'testuser',
  email: 'test@example.com',
  password: 'SecurePass123',
  password_confirm: 'SecurePass123',
  first_name: 'Test',
  last_name: 'User',
});
```

### Create Project
```javascript
import { projectsApi } from '@/lib/api/projects';

const project = await projectsApi.createProject({
  project_name: 'my-first-project',
  custom_project_name: 'My First Project',
  description: 'A test project',
  keywords: 'test, demo',
  categories: 'MPZP,Inne',
});
```

### Add GeoJSON Layer
```javascript
import { layersApi } from '@/lib/api/layers';

const geojsonFile = new File([JSON.stringify(geojson)], 'layer.geojson');

const result = await layersApi.addGeoJsonLayer({
  project_name: 'my-first-project',
  layer_name: 'test-layer',
  geojson: geojsonFile,
  epsg: 'EPSG:4326',
});
```

---

## 🐛 Debugging

### Check API Logs
All API calls are logged in the browser console with `🗺️` prefix:
```
🗺️ [GET] http://localhost:8000/dashboard/projects/
🗺️ [POST] http://localhost:8000/projects/create/
```

### Redux DevTools
1. Install Redux DevTools extension
2. Open DevTools → Redux tab
3. Monitor actions:
   - `projects/fetchProjects/pending`
   - `projects/fetchProjects/fulfilled`
   - `projects/fetchProjects/rejected`

### Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Check request/response headers and payloads

### Common Issues

**401 Unauthorized:**
- Token expired or missing
- Check localStorage for `authToken`
- Re-login to get new token

**CORS Errors:**
- Backend must allow frontend origin
- Check `CORS_ALLOWED_ORIGINS` in Django settings

**Network Errors:**
- Backend not running
- Wrong `NEXT_PUBLIC_API_URL`
- Check `.env.local`

---

## 📦 Project Structure

```
src/
├── lib/
│   └── api/
│       ├── client.ts          # HTTP client (✅ Complete)
│       ├── types.ts           # TypeScript types (✅ Complete)
│       ├── auth.ts            # Auth API (✅ Existing)
│       ├── dashboard.ts       # Dashboard API (✅ Existing)
│       ├── projects.ts        # Projects API (✅ New)
│       └── layers.ts          # Layers API (✅ New)
├── store/
│   ├── slices/
│   │   ├── projectsSlice.ts  # Projects Redux (✅ New)
│   │   ├── authSlice.ts      # Auth Redux (✅ Existing)
│   │   └── ...
│   └── store.ts              # Redux store (✅ Updated)
└── components/
    └── dashboard/
        ├── OwnProjectsIntegrated.tsx  # Main component (✅ New)
        ├── ProjectCard.tsx            # Card component (✅ New)
        └── dialogs/
            ├── CreateProjectDialog.tsx   # Create form (✅ New)
            └── DeleteProjectDialog.tsx   # Delete confirm (✅ New)
```

---

## ✅ Next Steps (Phase 2)

### Faza 2 - Core Features (3 tygodnie)
1. **Full Layer Management**
   - Import Shapefile, KML, GML
   - Layer editing (attributes, geometry)
   - Layer tree synchronization with backend

2. **Style Management**
   - Style editor UI
   - Symbolization
   - Classification (categorized, graduated)

3. **QGIS Server Integration**
   - WMS layer rendering
   - WFS vector features
   - GetCapabilities parsing

4. **User Settings Enhancement**
   - Change password
   - Update profile
   - Theme preferences

### Faza 3 - Advanced (2 tygodnie)
5. **Parcels & Groups**
   - Cadastral parcels search
   - Parcel groups management

6. **Export/Import**
   - PDF generation
   - DOCX reports
   - Project export/import

7. **Spatial Analysis**
   - Intersections
   - Buffer operations
   - PostGIS methods

---

## 📖 Documentation

- **Backend API Docs**: `../Universe-Mapmaker-Backend/README.md`
- **Frontend Docs**: `CLAUDE.md`
- **Architecture**: See integration plan in chat history

---

## 🎉 Summary

**Phase 1 MVP is COMPLETE!** ✅

We've successfully integrated:
- ✅ HTTP Client with authentication
- ✅ Complete TypeScript types
- ✅ Projects CRUD API
- ✅ Layers GeoJSON import API
- ✅ Redux state management
- ✅ Dashboard UI with real backend data
- ✅ Error handling & loading states

**Ready for testing and Phase 2 implementation!**
