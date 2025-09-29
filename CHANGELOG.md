# Changelog

All notable changes to the Universe MapMaker project will be documented in this file.

## [2.0.0] - 2025-09-29

### 🎉 Major Architecture Overhaul

#### ✨ Added
- **API Route Token Management** - Secure runtime token loading via `/api/mapbox/token`
- **Real-time Map Coordinates** - Live position and zoom level display
- **Production-Ready Deployment** - Google Cloud Run with proper region consistency
- **Loading States** - Visual feedback with ⏳ → ✅ → ❌ token status indicators
- **Mobile Optimization** - Touch-friendly map controls

#### 🚀 Updated Dependencies
- **Next.js** `14.x` → `15.5.4` (Latest App Router)
- **React** `18.x` → `19` (Latest with concurrent features)
- **Material-UI** `5.x` → `7.3.2` (Modern design system)
- **Mapbox GL JS** → `3.0.0` (WebGL2 support)
- **TypeScript** → `5.x` (Full type safety)
- **ESLint** `8.x` → `9.36.0`

#### 🧹 Removed
- **Redux/Redux Toolkit** - No longer needed for simple state
- **React-Redux** - Eliminated global state complexity
- **Leaflet** - Replaced with native Mapbox GL JS
- **MSW (Mock Service Worker)** - Not needed in production
- **DnD Kit** - Drag & drop functionality removed
- **MUI Icons** - Minimized UI dependencies
- **72+ unused packages** - Major bundle size reduction

#### 🔧 Technical Improvements
- **Runtime Token Loading** - Fixes build-time environment variable issues
- **Region Consistency** - All GCP resources in `europe-central2`
- **Docker Optimization** - Multi-stage builds with Alpine Linux
- **Bundle Size** - Reduced from ~2MB to ~533KB first load
- **Direct Mapbox Integration** - No abstractions, better performance

#### 🏗️ Architecture Simplification
```diff
- Complex Redux + Material-UI + Multiple mapping libraries
+ Simple React hooks + Direct Mapbox GL JS + Minimal dependencies

- src/components/complex/hierarchy
+ app/page.tsx (single main component)

- Build-time token embedding (causing production failures)
+ Runtime API token loading (production-ready)
```

#### 🌐 Deployment
- **Production URL**: [universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)
- **Cloud Build**: Automated deployment with proper region configuration
- **Environment**: Google Cloud Run with environment variable management

#### 📚 Documentation
- **Complete README Rewrite** - Reflects current architecture
- **Removed Legacy Docs** - Cleaned up outdated documentation files
- **Added Deployment Guide** - Step-by-step Cloud Run deployment
- **Troubleshooting Section** - Common issues and solutions

#### 🔄 Migration Notes
- **Breaking Change**: Complete architecture rewrite
- **State Management**: Redux removed, replaced with React hooks
- **Mapping**: Leaflet removed, pure Mapbox GL JS implementation
- **Styling**: Simplified Material-UI usage
- **Token Management**: Now uses secure API route instead of build-time vars

#### 🐛 Bug Fixes
- **Fixed**: "An API access token is required" error in production
- **Fixed**: Build failures due to missing dependencies
- **Fixed**: Docker registry naming conflicts
- **Fixed**: Cloud Build region inconsistencies
- **Fixed**: Environment variable access in containerized environments

---

## [1.x.x] - Legacy Versions

Previous versions used complex Redux architecture with multiple mapping libraries. See git history for detailed changelog of legacy versions.

---

**Current Status**: ✅ **Production Ready**
**Live Demo**: [universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)