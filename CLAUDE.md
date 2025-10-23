# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Work Methodology

**CRITICAL:** Follow this systematic approach for all backend integration work:

### Step 1: Backend Endpoint Discovery
1. **Extract ALL endpoints** from backend `urls.py` files
2. **Create endpoint map** in `BACKEND-ENDPOINTS.md`
3. **Document request/response** format for each endpoint
4. **Check if endpoint works** with curl/Postman before frontend work

### Step 2: RTK Query Integration
1. **Create RTK Query slice** for each endpoint group (projects, layers, auth, etc.)
2. **Test each endpoint** individually with frontend UI
3. **Ask user for clarification** if endpoint behavior is unclear
4. **Verify with user** before moving to next endpoint

### Step 3: Systematic Testing
1. **One endpoint at a time** - Don't implement multiple features simultaneously
2. **Test → Verify → Commit → Push** - Small iterations
3. **Document what works** and what needs backend fixes
4. **Ask user** if behavior doesn't match expectations

**This approach ensures:**
- ✅ No wasted effort on non-existent endpoints
- ✅ Clear communication about what works/doesn't work
- ✅ Gradual, testable progress
- ✅ User involvement in decision-making

## Code Quality Standards

**IMPORTANT:** Before writing or modifying any code, verify that the implementation follows current best practices and standards from **context7.com MCP** (Model Context Protocol).

When writing code:
1. Check if the pattern/approach aligns with latest standards from context7.com
2. Use MCP-based tools when available (prefix: `mcp__`)
3. Ensure code follows modern TypeScript/React best practices
4. Validate against current Next.js App Router patterns

### Code Cleanup Strategy

**Goal:** Gradual refactoring towards optimal, backend-integrated code.

**Current State:**
- ⚠️ Duplicate code exists (acknowledged, being addressed)
- ⚠️ Some non-working features (legacy code)
- ✅ Active refactoring in progress (RTK Query migration completed)

**Refactoring Principles:**
1. **Backend-First Integration** - Always verify backend endpoints before implementing
2. **Incremental Cleanup** - Small, testable changes over big rewrites
3. **No Breaking Changes** - Maintain working features during refactoring
4. **Optimal Code Only** - Follow RTK Query, Entity Adapter, modern patterns
5. **Delete Dead Code** - Remove unused components/functions immediately

**Recent Refactoring Completed:**
- ✅ Phase 1: API Consolidation (23% code reduction)
- ✅ Phase 2: Entity Adapter (O(1) lookups, normalized state)
- ✅ Phase 3: RTK Query Migration (85% less boilerplate)
- ✅ Phase 4: Dead Code Removal (~2945 lines deleted)

**Before Adding Features:**
1. Check if backend endpoint exists
2. Verify database schema supports the feature
3. Check QGIS Server if map layers involved
4. Use existing patterns (don't create new ones)
5. Delete old implementations when replacing them

## Development Commands

```bash
# Development
npm run dev          # Start development server (default: http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server (uses server.js)
npm run lint         # Run ESLint

# Browser Testing (Screenshots)
.\screenshot.bat                                    # Screenshot localhost:3000 (Windows CMD)
.\screenshot.bat http://localhost:3000/dashboard    # Screenshot specific page
.\screenshot.ps1 http://localhost:3000              # PowerShell version
powershell -ExecutionPolicy Bypass -File screenshot.ps1 "http://localhost:3000/dashboard"
```

## ShareX Screenshot Analysis Workflow

**IMPORTANT:** When user makes a screenshot, automatically check ShareX folder and analyze it for backend integration issues.

### Automatic Screenshot Analysis Process

**ShareX Screenshot Location:**
```
C:\Users\Bartosz\Documents\ShareX\Screenshots\2025-10\
```

**When user says "sprawdź screenshot" or makes a screenshot:**

1. **Find Latest Screenshot:**
   ```bash
   powershell "Get-ChildItem 'C:\Users\Bartosz\Documents\ShareX\Screenshots\2025-10\*.png' | Sort-Object LastWriteTime -Descending | Select-Object -First 1"
   ```

2. **Read and Analyze Screenshot:**
   - Use Read tool to view the screenshot
   - Identify what page/component is shown
   - Look for visible errors, warnings, or UI issues
   - Check browser console errors (if visible)
   - Analyze network tab (if visible)

3. **Propose Backend Integration Steps:**
   Based on what's visible on the screenshot, propose:
   - Which backend endpoint needs testing
   - What RTK Query integration is needed
   - Specific curl command to test the endpoint
   - Frontend component changes required
   - Next steps for integration

4. **Example Analysis Template:**
   ```
   📸 Screenshot Analysis:

   **What I see:**
   - Page: /dashboard or /map or /auth
   - Component: ComponentName
   - Visible issues: [list any errors/warnings]

   **Backend Integration Status:**
   - Endpoint needed: GET/POST/PUT /api/endpoint/
   - Current status: ✅ Working / 🚧 Mocked / ❌ Not implemented

   **Proposed Next Steps:**
   1. Test endpoint: curl -X GET "..." -H "Authorization: Token ..."
   2. Add RTK Query: src/backend/module/api.ts
   3. Update component: src/features/component.tsx
   4. Test in browser
   5. Commit changes

   **What should we work on next?**
   ```

### Quick Commands for Screenshot Analysis

```bash
# Get latest screenshot
powershell "Get-ChildItem 'C:\Users\Bartosz\Documents\ShareX\Screenshots\2025-10\*.png' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 FullName, LastWriteTime"

# Get last 3 screenshots
powershell "Get-ChildItem 'C:\Users\Bartosz\Documents\ShareX\Screenshots\' -Recurse -Filter '*.png' | Sort-Object LastWriteTime -Descending | Select-Object -First 3 FullName, LastWriteTime"
```

**Workflow Summary:**
1. User makes screenshot (ShareX)
2. Claude finds latest screenshot automatically
3. Claude analyzes what's visible
4. Claude proposes backend integration steps
5. User decides next action
```

## Deployment Workflow

**IMPORTANT:** Cloud Build is integrated with GitHub - deployment happens automatically on push!

### Automated Deployment (Recommended)

**The project has GitHub → Cloud Build integration configured. Simply push to GitHub:**

```bash
# Standard workflow - automatic deployment
git add .
git commit -m "feat: your changes"
git push origin main

# Cloud Build automatically triggers and deploys to Cloud Run
# No need to run gcloud builds submit manually!
```

**How it works:**
1. Push to `main` branch triggers Cloud Build automatically
2. Cloud Build uses `cloudbuild.yaml` configuration
3. Builds Docker image with Next.js standalone output
4. Pushes to Artifact Registry (`europe-central2-docker.pkg.dev`)
5. Deploys to Cloud Run (`universe-mapmaker`)
6. Updates run automatically with zero downtime

**Monitor deployment:**
```bash
# Check Cloud Build status
gcloud builds list --limit=5

# Check Cloud Run service
gcloud run services describe universe-mapmaker --region=europe-central2

# View deployment logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

### Manual Deployment (Not Recommended)

**Only use manual deployment for testing or emergency fixes:**

```bash
# Manual Cloud Build trigger (bypasses GitHub integration)
gcloud builds submit --region=europe-central2 --config=cloudbuild.yaml

# This is slower and not tracked in GitHub Actions
# Prefer using git push for all deployments!
```

## Testing & Browser Preview

**IMPORTANT:** Always test UI changes using automated screenshots before committing. This ensures visual regression detection and proper rendering.

### Screenshot Testing Tool

Two automated screenshot scripts are available for Windows:

1. **screenshot.bat** (Command Prompt / Git Bash)
   ```cmd
   screenshot.bat [url] [output-file]

   # Examples:
   screenshot.bat                                          # Screenshots http://localhost:3000
   screenshot.bat http://localhost:3000/dashboard          # Screenshots dashboard page
   screenshot.bat http://localhost:3000/map test-map.png   # Custom output filename
   ```

2. **screenshot.ps1** (PowerShell)
   ```powershell
   .\screenshot.ps1 [url] [output-file]

   # Examples:
   .\screenshot.ps1 http://localhost:3000/auth
   powershell -ExecutionPolicy Bypass -File screenshot.ps1 "http://localhost:3000/dashboard"
   ```

### How Screenshot Tool Works

- Uses Playwright (automatically installs if missing)
- Captures full-page screenshots at 1920x1080 resolution
- Saves to `screenshots/` directory with timestamp
- Supports both local development and production URLs
- Network idle wait ensures all content is loaded
- Prompts to open screenshot after capture

### When to Use Screenshots

1. **Before committing UI changes** - Verify visual appearance
2. **After adding new components** - Ensure proper rendering
3. **When debugging layout issues** - Compare expected vs actual
4. **For documentation** - Capture current state of features
5. **Testing on production** - Verify deployment succeeded
6. **Mobile responsive testing** - Test different viewport sizes

### Production Testing

Test on live domain:
```bash
screenshot.bat https://universemapmaker.online/dashboard admin-panel-test.png
```

Screenshots are saved to `screenshots/` folder (gitignored by default).

## Architecture Overview

**CRITICAL:** Before making any changes, verify integration with all system components:

### System Components

1. **PostgreSQL Database (Google Cloud SQL with PostGIS)**
   - Primary data store for all application data
   - Location: Google Cloud SQL instance
   - Schema: Django models in `geocraft_api/models/`
   - Key tables:
     - `ProjectItem` - Projects (name, published, user, domain, category, metadata)
     - `Domain` - Project domains (unique URLs)
     - `Layer` - Map layers with PostGIS geometry
     - `CustomUser` - User accounts
   - Always verify schema changes with backend team

2. **Backend API (Django REST Framework) - NEW INTEGRATION STRUCTURE**
   - Base URL: `https://api.universemapmaker.online/`
   - Django REST Framework with Token authentication
   - **Frontend Integration:** `src/backend/` (RTK Query + baseApi)

   **NEW: Centralized Backend Module Structure:**
   ```
   src/backend/
   ├── client/
   │   └── base-api.ts          # Single baseApi with token auth
   ├── auth/
   │   ├── auth.api.ts          # Login, register, password reset
   │   └── index.ts
   ├── projects/
   │   ├── projects.api.ts      # 25+ project endpoints
   │   └── index.ts
   ├── users/
   │   ├── users.api.ts         # Profile, settings
   │   └── index.ts
   ├── types.ts                 # Shared TypeScript types
   ├── index.ts                 # Central export
   └── README.md                # Integration docs
   ```

   **Backend API Routing:**
     - `/api/projects/*` - Project CRUD, QGIS import
     - `/dashboard/*` - Dashboard data (projects list, public projects)
     - `/auth/*` - Authentication endpoints

   **IMPORTANT: Always use `@/backend` imports:**
   ```typescript
   // ✅ CORRECT - New unified API
   import { useGetProjectsQuery, useCreateProjectMutation } from '@/backend/projects';
   import { useLoginMutation } from '@/backend/auth';

   // ❌ WRONG - Old scattered imports (deprecated)
   import { useGetProjectsQuery } from '@/redux/api/projectsApi';
   import { useLoginMutation } from '@/features/auth/api';
   ```

   **baseApi Features:**
   - Automatic token injection (Authorization: Token {token})
   - Centralized error handling (401 → redirect to login)
   - Cache invalidation with tags ('Projects', 'Project', 'PublicProjects', etc.)
   - 30s timeout for slow connections
   - Type-safe auto-generated hooks

3. **QGIS Server (WMS/WFS/OWS)**
   - Endpoint: `https://api.universemapmaker.online/ows`
   - Serves map layers via OGC standards (WMS, WFS, WCS)
   - Used for rendering map layers in frontend

4. **Storage FASE (QGIS Project Files)**
   - Location: VM filesystem at `~/mapmaker/server/qgs/`
   - Stores .qgs and .qgz project files
   - Thumbnails: `~/mapmaker/server/qgs/thumbnails`
   - Accessible via VM with GCP SDK/CLI
   - **IMPORTANT:** QGS files are NOT in Cloud Storage - they're on the VM!

5. **Frontend (Next.js on Cloud Run)**
   - Production: `https://universemapmaker.online`
   - Local development: `http://localhost:3000` (MUST use port 3000 for CORS)
   - React 19 + Next.js 15 + Redux Toolkit

### GCP SDK & CLI Access

**Access Level:** Full access to Google Cloud Platform via SDK and CLI

**Available Operations:**
- `gcloud sql` - Database queries and management (Cloud SQL PostgreSQL)
- `gcloud compute ssh` - SSH into VM to access Storage FASE files
- `gcloud run` - Deploy and manage Cloud Run services
- `gcloud builds` - Trigger Cloud Build deployments
- `gcloud logging` - View application logs

**Common GCP Commands:**
```bash
# Database access
gcloud sql connect [instance-name] --user=postgres

# SSH to VM (for Storage FASE access)
gcloud compute ssh [vm-name] --zone=europe-central2-a

# View backend logs
gcloud logging read "resource.type=gce_instance" --limit=50

# Deploy frontend
gcloud builds submit --region=europe-central2 --config=cloudbuild.yaml
```

**Request Access:** If any GCP operation fails due to permissions, request access immediately.

## 📋 Detailed Refactoring Methodology

**CRITICAL:** All refactoring work must follow the detailed principles in [METHODOLOGY.md](./METHODOLOGY.md)

**Quick Reference - 10 Core Principles:**

1. **Backend-First Integration** ✅
   - Sprawdź endpoint w `docs/backend/` PRZED implementacją
   - Przetestuj curl/Postman
   - Zrozum request/response format

2. **Centralized API Pattern (@/backend)** ✅
   - Jedna metoda komunikacji: RTK Query + baseApi
   - Wszystkie importy przez `@/backend/*`
   - ❌ NIE używaj: `@/redux/api/*`, `@/api/endpointy/*`

3. **Incremental Refactoring** ✅
   - Małe kroki (1-3 pliki na commit)
   - Test → Verify → Commit → Push
   - Nie blokuj się brakiem endpointów

4. **Feature-Based UI Structure** ✅
   - Komponenty organizowane po funkcjonalności
   - Barrel exports (index.ts)
   - Przykład: `src/features/dashboard/components/`

5. **Mock Non-Essential APIs** ✅
   - Jeśli endpoint nie istnieje → dodaj mock + TODO
   - Nie blokuj postępu brakiem API
   - Przykład: `const useDeleteLayerMutation = () => [async () => {}, { isLoading: false }] as any;`

6. **Clear Next.js Cache When Needed** ✅
   - Po zmianach struktury folderów: `rm -rf .next`
   - Po update import paths
   - Jeśli widzisz stare błędy po naprawie

7. **Document Everything** ✅
   - TODO comments dla brakujących API
   - CLAUDE.md - overview + current status
   - METHODOLOGY.md - detailed refactoring rules

8. **Commit Patterns** ✅
   ```bash
   feat: add new feature
   fix: bug fix
   refactor: code restructuring
   docs: documentation updates
   test: testing additions
   ```

9. **Redux State Cleanup** ✅
   - Usuń stare API reducers/middleware
   - Zostaw tylko baseApi
   - Migruj selektory do nowych API

10. **Testing Requirements** ✅
    - MINIMUM: `npm run dev` bez błędów
    - STANDARD: Test w przeglądarce (localhost:3000)
    - COMPLETE: Test wszystkich zmienionych endpointów

**Szczegółowa dokumentacja:** [METHODOLOGY.md](./METHODOLOGY.md)

---

## 🚫 Co USUNĘLIŚMY podczas refaktoru (2025-01-20)

**NIE używaj tych ścieżek - zostały usunięte:**

❌ `src/api/endpointy/` - stare API (unified-projects.ts, unified-user.ts, auth.ts)
❌ `src/redux/api/` - stare RTK Query (projectsApi, adminApi, layersApi, stylesApi)
❌ `src/backend/dashboard/` - UI komponenty (przeniesione do `src/features/dashboard/components/`)
❌ `src/features/dashboard/dialogi/` - stare dialogi
❌ Duplikaty: OwnProjects.tsx, PublicProjects.tsx, ProjectCard.tsx w starych lokalizacjach

**Usunięto łącznie:** 8362 linii kodu
**Dodano:** 743 linie nowego kodu
**Redukcja netto:** -7619 linii (-23% kodu!)

**Jeśli widzisz import z tych lokalizacji → BŁĄD → Zmień na @/backend!**

---

## 📦 Dependencies & Tools

**Core Stack:**
- **Next.js** 15.5.4 - Frontend framework with App Router
- **React** 19 - UI library
- **Redux Toolkit** 2.9.0 - State management
- **RTK Query** - API calls with automatic caching
- **Material-UI (MUI)** v5.18.0 - Component library
- **TypeScript** 5.x - Type safety
- **Mapbox GL JS** 3.0.0 - Map rendering
- **React Map GL** 7.1.9 - React wrapper for Mapbox

**Backend Integration:**
- Django REST Framework (Python backend)
- PostgreSQL with PostGIS
- QGIS Server
- Token-based authentication

---

## 🧪 Testing Guidelines

### Minimum Test (przed każdym commitem)

```bash
# 1. Serwer dev bez błędów kompilacji
npm run dev

# 2. Dashboard ładuje się poprawnie
curl http://localhost:3000/dashboard  # 200 OK

# 3. Console bez czerwonych błędów
# Sprawdź w przeglądarce: F12 → Console
```

### Standard Test (przed push do main)

```bash
# 1. Dashboard - wszystkie zakładki
- localhost:3000/dashboard → Moje Projekty
- localhost:3000/dashboard → Publiczne Projekty
- localhost:3000/dashboard → Ustawienia

# 2. Map View
- localhost:3000/map?project=test → mapa się ładuje
- Layer tree działa
- Drawing tools działają

# 3. Auth Flow
- Logout → Login → Dashboard
```

### Complete Test (przed release)

**Wszystkie Dashboard endpointy:**
1. ✅ GET `/dashboard/projects/` - lista projektów użytkownika
2. ✅ PUT `/dashboard/projects/update/` - edycja metadanych projektu
3. ✅ PUT `/dashboard/settings/profile/` - edycja profilu użytkownika
4. 🚧 PUT `/dashboard/settings/password/` - zmiana hasła
5. 🚧 POST `/dashboard/contact/` - formularz kontaktowy

**UI Manual Testing:**
- [ ] Create Project → Import QGS → Open Map
- [ ] Edit Project Settings → Save → Verify
- [ ] Delete Project → Confirm → Verify removed
- [ ] Publish Project → Open Public URL → Verify
- [ ] User Settings → Change Profile → Save → Verify

**Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile (Chrome Android / Safari iOS)

**Screenshot Testing:**
```bash
screenshot.bat http://localhost:3000/dashboard dashboard-test.png
screenshot.bat http://localhost:3000/map?project=test map-test.png
```

---

## 🔄 Refactoring Checklist

**Przed rozpoczęciem refaktoru (MANDATORY):**

### Pre-Refactor
- [ ] ✅ Przeczytaj [METHODOLOGY.md](./METHODOLOGY.md) w całości
- [ ] ✅ Zidentyfikuj duplikaty kodu (grep, Glob, manual inspection)
- [ ] ✅ Sprawdź dokumentację backend (`docs/backend/`)
- [ ] ✅ Przetestuj endpoint curl/Postman (if applicable)
- [ ] ✅ Plan refaktoru: co usuwamy, co dodajemy, co migrujemy

### During Refactor
- [ ] ✅ Dodaj RTK Query endpoint w `@/backend/*`
- [ ] ✅ Mockuj brakujące API (TODO comments)
- [ ] ✅ Przenieś UI komponenty do feature folders
- [ ] ✅ Usuń stare pliki (nie komentuj, DELETE)
- [ ] ✅ Update import paths (`@/backend/*`, `@/features/*`)
- [ ] ✅ Clear cache: `rm -rf .next` (if folder structure changed)
- [ ] ✅ Test w przeglądarce po każdej zmianie

### Post-Refactor
- [ ] ✅ Wszystkie compilation errors naprawione
- [ ] ✅ Console bez czerwonych błędów
- [ ] ✅ Test wszystkich zmienionych feature
- [ ] ✅ Update CLAUDE.md (current status, what was deleted)
- [ ] ✅ Commit z opisem: `refactor: <short description>`
- [ ] ✅ Push to main: `git push origin main`

---

## 📚 Dokumentacja

### Backend API Documentation
- **Dashboard API:** `docs/backend/dashboard_api_docs.md` (45+ endpoints with examples)
- **Projects API:** `docs/backend/projects_api_docs.md` (project CRUD, QGS import, publishing)

### Frontend Documentation
- **Methodology (READ FIRST!):** [METHODOLOGY.md](./METHODOLOGY.md) - Detailed refactoring principles
- **Architecture Overview:** This file (CLAUDE.md)
- **UI Component Audit:** `UI-AUDIT-REPORT.md` - Component analysis and cleanup opportunities
- **Backend Integration:** `src/backend/README.md` - RTK Query setup and patterns

### API Endpoint Examples

**Dashboard Projects List:**
```bash
curl -X GET "https://api.universemapmaker.online/dashboard/projects/" \
  -H "Authorization: Token YOUR_TOKEN"
```

**Update Project Metadata:**
```bash
curl -X PUT "https://api.universemapmaker.online/dashboard/projects/update/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "projekt123",
    "projectDescription": "Updated description",
    "keywords": "keyword1, keyword2"
  }'
```

**Update User Profile:**
```bash
curl -X PUT "https://api.universemapmaker.online/dashboard/settings/profile/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jan",
    "last_name": "Kowalski",
    "email": "jan@example.com"
  }'
```

---

## 🎯 Current Status

### ✅ Completed (2025-01-20)

**Major Refactor - Dashboard Migration (100% Complete!):**
- Migrated ALL Dashboard endpoints to `@/backend` pattern (RTK Query + baseApi)
- Consolidated UI components: `src/features/dashboard/components/`
- Removed 9042 lines of duplicate code (-24% codebase)
- **All 5 Dashboard endpoints tested and working:**
  1. GET `/dashboard/projects/` - ✅ Working
  2. PUT `/dashboard/projects/update/` - ✅ Working
  3. PUT `/dashboard/settings/profile/` - ✅ Working
  4. PUT `/dashboard/settings/password/` - ✅ Working (existing in @/backend/users)
  5. POST `/dashboard/contact/` - ✅ Working (NEW @/backend/contact module)

**Latest Changes (2025-01-20 19:10):**
- ✅ Created `@/backend/contact` module with RTK Query
- ✅ Integrated Contact.tsx with `useSendContactMessageMutation`
- ✅ Fixed authSlice.ts and projectsSlice.ts imports (migrated to @/backend/types)
- ✅ Deleted `src/api/` folder completely (dead code removal)

**Documentation:**
- Created [METHODOLOGY.md](./METHODOLOGY.md) - 10 refactoring principles
- Updated CLAUDE.md - consolidated architecture overview
- All imports migrated to `@/backend/*` pattern

**Git Status:**
- Latest: `363d30a` - "refactor: complete Dashboard endpoints #4 and #5 migration to @/backend"
- Previous: `8cbe108` - "refactor: consolidate Dashboard structure"
- Total: 51 files changed: +804 additions, -9042 deletions
- Pushed to `main` branch

### 🚧 In Progress

**Nothing currently in progress - Dashboard migration 100% complete! ✅**

### ⏳ Backlog (Priority Order)

**High Priority:**
1. **Layers API** - Map layer management (`/api/layers/*`)
   - Currently mocked in LeftPanel.tsx, PropertiesPanel.tsx
   - Required for: Add Layer, Delete Layer, Set Visibility, Change Order
   - Endpoints to implement: GET, POST, PUT, DELETE `/api/layers/`

2. **Styles API** - Layer styling (`/api/styles/*`)
   - Currently mocked in EditLayerStyleModal.tsx
   - Required for: Classify, Set Style, Import/Export Style, Add Label
   - Endpoints to implement: GET, POST, PUT `/api/styles/`

**Medium Priority:**
3. **Admin Panel Migration** - Move to `@/backend` pattern
   - Currently commented out in Dashboard.tsx
   - 7 tabs: Projects, Users, Layers, Styles, Domains, Statistics, Settings
   - Backend endpoints: `/dashboard/admin/*`

4. **Map Components Optimization**
   - QGISProjectLoader.tsx - optimize layer loading
   - IdentifyTool.tsx - feature identification
   - Buildings3D.tsx - 3D buildings management

**Low Priority:**
5. **Groups API** - Layer groups management
6. **Advanced Features** - Measurements, Drawing tools optimization

---

## 💡 Tips for Claude Code

### DO's ✅

1. **ZAWSZE czytaj [METHODOLOGY.md](./METHODOLOGY.md) przed refaktorem**
2. **Sprawdź `docs/backend/` PRZED implementacją endpointu**
3. **Test endpoint z curl/Postman PRZED frontendem**
4. **Mockuj brakujące API** zamiast blokować postęp
5. **Clear cache (`rm -rf .next`)** po zmianach struktur folderów
6. **Małe commity** > wielkie zmiany (1-3 pliki per commit)
7. **Test PRZED commitem**, nie PO commicie
8. **Usuń stary kod** - nie komentuj, DELETE
9. **TODO comments** dla brakujących feature
10. **Ask user** jeśli endpoint nie działa jak oczekiwano

### DON'Ts ❌

1. **NIE zgaduj struktury API** - sprawdź dokumentację
2. **NIE implementuj wielu endpointów naraz** - jeden na raz
3. **NIE używaj starych import paths** (`@/redux/api/*`, `@/api/endpointy/*`)
4. **NIE commituj broken code** - zawsze test przed commit
5. **NIE pomijaj testów** - minimum: `npm run dev` bez błędów
6. **NIE twórz nowych wzorców** - używaj istniejących patterns
7. **NIE komentuj dead code** - usuń go całkowicie
8. **NIE deployuj bez testów** - manual testing required
9. **NIE modyfikuj wielu plików naraz** - incremental changes
10. **NIE ignoruj console errors** - fix all red errors

### Common Pitfalls & Solutions

**Problem:** Import error after refactor
```
Module not found: Can't resolve '@/redux/api/projectsApi'
```
**Solution:** Clear cache + restart dev server
```bash
rm -rf .next
npm run dev
```

**Problem:** Stare błędy po naprawie importów
**Solution:** Next.js cache issue - clear `.next` folder

**Problem:** Brak endpointu w backendzie
**Solution:** Mockuj API + dodaj TODO comment
```typescript
// TODO: Implement useDeleteLayerMutation in @/backend/layers
const useDeleteLayerMutation = () => [async () => {}, { isLoading: false }] as any;
```

**Problem:** Endpoint zwraca 404 mimo że jest w dokumentacji
**Solution:** Sprawdź URL format, auth header, request body format

**Problem:** Port 3000 zajęty
**Solution:** Kill process
```bash
# Windows
taskkill //F //PID <PID>

# Linux/Mac
kill -9 <PID>
```

---

## 🔍 Troubleshooting Guide

### Build Errors

**Error: "Module not found: Can't resolve '@/...'"**
1. Check if file exists at path
2. Verify tsconfig.json paths configuration
3. Clear .next cache: `rm -rf .next`
4. Restart dev server

**Error: "Type error: ... is not assignable to type ..."**
1. Check TypeScript types in `src/backend/types.ts`
2. Verify API response matches expected type
3. Add type assertion if backend response format changed
4. Test endpoint with curl to see actual response

**Error: "Export '...' (reexported as '...') was not found"**
1. Check if component uses `export default` or named export
2. Update barrel export in index.ts:
   - Default export: `export { default as ComponentName } from './ComponentName';`
   - Named export: `export { ComponentName } from './ComponentName';`

### Runtime Errors

**Error: "Cannot read property '...' of undefined"**
1. Check if API response includes expected field
2. Add optional chaining: `data?.field?.subfield`
3. Add loading state check: `if (!data) return <Skeleton />`
4. Verify backend response format in docs/backend/

**Error: "401 Unauthorized" on API call**
1. Check if token exists in localStorage: `localStorage.getItem('authToken')`
2. Verify token format: should be `Token abc123...` (with "Token " prefix)
3. Check if baseApi prepareHeaders is adding Authorization header
4. Test with curl to verify token works

**Error: "Network Error" or "Failed to fetch"**
1. Check if backend is running (ping `https://api.universemapmaker.online/`)
2. Verify CORS configuration allows localhost:3000
3. Check browser console for detailed error
4. Test endpoint with curl/Postman

### Cache Issues

**Problem: Changes not reflected after code update**
```bash
# Nuclear option - clear everything
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

**Problem: Old imports still showing errors**
```bash
# Next.js cache issue
rm -rf .next
# Restart dev server
npm run dev
```

---

## 🚀 Quick Start for New Features

### Adding New Endpoint (Step-by-Step)

**Step 1: Backend Verification (5 min)**
```bash
# 1. Check documentation
code docs/backend/dashboard_api_docs.md

# 2. Test endpoint
curl -X GET "https://api.universemapmaker.online/endpoint/path/" \
  -H "Authorization: Token YOUR_TOKEN"

# 3. Verify response format
# Expected: { data: {...}, success: true, message: "..." }
```

**Step 2: RTK Query Implementation (10 min)**
```typescript
// src/backend/projects/projects.api.ts (or appropriate module)

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeature: builder.query<FeatureResponse, { project: string; id: number }>({
      query: ({ project, id }) => `/api/endpoint/${project}/${id}/`,
      providesTags: (result, error, { id }) => [{ type: 'Feature', id }],
    }),
  }),
});

export const { useGetFeatureQuery } = projectsApi;
```

**Step 3: Component Integration (15 min)**
```typescript
// src/features/feature-name/components/ComponentName.tsx

import { useGetFeatureQuery } from '@/backend/projects';

export default function ComponentName() {
  const { data, isLoading, error } = useGetFeatureQuery({ project: 'test', id: 1 });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading data</Alert>;
  if (!data) return null;

  return (
    <Box>
      {/* Render data */}
    </Box>
  );
}
```

**Step 4: Testing (10 min)**
```bash
# 1. Start dev server
npm run dev

# 2. Test in browser
# - Open localhost:3000/your-feature
# - Check console for errors
# - Verify data loads correctly

# 3. Screenshot test
screenshot.bat http://localhost:3000/your-feature feature-test.png
```

**Step 5: Commit (5 min)**
```bash
git add .
git commit -m "feat: add getFeature endpoint integration"
git push origin main
```

**Total Time: ~45 minutes** (from zero to deployed feature)

---

## 📊 Project Statistics (as of 2025-10-20 19:10)

**Codebase Size:**
- **Before Refactor:** ~37,500 lines (estimated)
- **After Refactor:** ~28,500 lines (-24%)
- **Files Removed:** 51 files total
  - Phase 1 (2025-01-20): 43 files removed
  - Phase 2 (2025-10-20): 8 files removed (src/api/ folder)
- **Net Reduction:** -9,042 lines

**Code Quality Improvements:**
- ✅ Single API pattern (`@/backend`) - 100% compliance
- ✅ Feature-based UI structure
- ✅ Barrel exports for clean imports
- ✅ Comprehensive documentation (METHODOLOGY.md)
- ✅ All Dashboard endpoints migrated to RTK Query
- ✅ Zero dead code in src/api/ (folder deleted)

**Testing Coverage:**
- ✅ Dashboard: 5/5 endpoints tested (100%) - COMPLETE!
- ⚠️ Map: Layers API mocked (0% tested)
- ⚠️ Styles: Styles API mocked (0% tested)
- ⏳ Admin Panel: Not yet migrated

**Technical Debt:**
- 🔴 High: Layers API needs full implementation
- 🔴 High: Styles API needs full implementation
- 🟡 Medium: Admin Panel migration to @/backend
- 🟢 Low: Drawing tools optimization

---

**Ostatnia aktualizacja:** 2025-10-20 19:10
**Refaktor Dashboard:** ✅ Zakończony 100% (-9042 linii, -24% codebase)
**Metodologia:** ✅ Udokumentowana ([METHODOLOGY.md](./METHODOLOGY.md))
**Status:** ✅ Produkcyjny (5/5 Dashboard endpoints working - 100%!)



## 🚨 CRITICAL: Docker Path Configuration (Backend)

**IMPORTANT:** Backend Django has specific path requirements for file uploads.

### Problem History (2025-10-23)

**Issue:** SHP/GeoJSON import returned `400: Warstwa jest nieprawidłowa` despite correct frontend implementation.

**Root Cause:** Backend `MEDIA_ROOT` path mismatch with QGIS Server.

```python
# ❌ WRONG (old settings.py):
MEDIA_ROOT = os.path.join(BASE_DIR, 'qgs')  # = /app/qgs/ in Docker

# Docker container structure:
# /app/qgs/           ← Django writes here (isolated folder)
# /projects/          ← QGIS Server reads from here (bind mount)
# Result: Files saved but not accessible by QGIS → validation error
```

**Solution:** Use Docker bind mount path for `MEDIA_ROOT`.

```python
# ✅ CORRECT (fixed settings.py):
MEDIA_ROOT = '/projects' if os.path.exists('/projects') else os.path.join(BASE_DIR, 'qgs')

# Docker container structure:
# /projects/          ← Django writes here (bind mount)
# /projects/          ← QGIS Server reads from here (bind mount)
# Result: Same folder → files accessible by both Django and QGIS ✅
```

### File Upload Models (Backend)

All Django `FileField` models use `document_storage`:

```python
# geocraft_api/models/layer.py
document_storage = FileSystemStorage(location=settings.MEDIA_ROOT)

class ShpFiles(models.Model):
    shp = models.FileField(storage=document_storage, upload_to=content_file_name_missing_layers)
    shx = models.FileField(storage=document_storage, upload_to=content_file_name_missing_layers)
    dbf = models.FileField(storage=document_storage, upload_to=content_file_name_missing_layers)
    prj = models.FileField(storage=document_storage, upload_to=content_file_name_missing_layers)
```

**Naming convention:**
```python
def content_file_name_missing_layers(instance, filename):
    return '/'.join([instance.project, "uploaded_layer." + filename.split(".")[-1]])
    # Result: testshp/uploaded_layer.shp
    # Full path: /projects/testshp/uploaded_layer.shp
```

### ⚠️ ALWAYS CHECK BEFORE DEBUGGING FILE UPLOADS:

1. **Docker mounts:**
   ```bash
   docker inspect <container> | grep -A 10 Mounts
   # Verify /projects bind mount exists
   ```

2. **Backend MEDIA_ROOT:**
   ```bash
   docker exec <container> grep MEDIA_ROOT /app/geocraft/settings.py
   # Should be: MEDIA_ROOT = '/projects' if os.path.exists('/projects') ...
   ```

3. **File existence:**
   ```bash
   docker exec <container> ls -la /projects/<project_name>/uploaded_layer.*
   # Should list: .shp, .shx, .dbf, .prj files
   ```

4. **Backend logs:**
   ```bash
   docker logs <container> | grep -i "error\|failed to open"
   # Check for GDAL "Failed to open dataset" errors
   ```

### Related Backend Repo

**Backend fix commit:** `196a878` - "fix: use /projects instead of /app/qgs for MEDIA_ROOT"
**Repository:** https://github.com/MapMakeronline/Universe-Mapmaker-Backend.git

### Lessons Learned

1. **Docker paths ≠ Host paths** - Always verify bind mounts
2. **Multiple systems reading same files** - Ensure shared storage (Django + QGIS Server)
3. **Debug file operations:** Check filesystem BEFORE assuming code error
4. **Backend logs are critical:** "Failed to open dataset" indicated path issue, not frontend error

---

**Last Updated:** 2025-10-23  
**Fix Status:** ✅ Applied to production (Docker container patched + restart)

