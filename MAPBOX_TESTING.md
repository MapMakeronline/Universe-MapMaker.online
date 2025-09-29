# 🗺️ Mapbox Testing Guide

## 🎯 Test Pages

### 1. Clean Simple Map
**URL**: http://localhost:3002/clean-map
- ✅ Minimal implementation
- ✅ No complex dependencies
- ✅ Clear error handling
- ✅ Client + Server status comparison

### 2. Advanced Diagnostic Map
**URL**: http://localhost:3002/mapbox-test
- ✅ Full diagnostic logging
- ✅ Environment detection
- ✅ API testing
- ✅ Detailed error analysis

### 3. Main Application
**URL**: http://localhost:3002/
- ✅ Production map with layer management
- ✅ Redux integration
- ✅ Full feature set

### 4. API Endpoint
**URL**: http://localhost:3002/api/mapbox/status
- ✅ Server-side token validation
- ✅ Mapbox API testing
- ✅ Environment detection
- ✅ JSON response

## ✅ What Works Now

### Local Environment
- ✅ API Route: `/api/mapbox/status` - Returns JSON with token status
- ✅ Token validation: Both client and server side
- ✅ Clean component: `CleanMapbox` with minimal dependencies
- ✅ Error handling: Clear messages for common issues
- ✅ Environment detection: Proper local/production/Cloud Run detection

### Code Cleanup
- ✅ Removed duplicate components: `ProductionMap.tsx`, `SimpleMap.tsx`, `MapboxMap.tsx`
- ✅ Centralized token management in `src/config/mapbox.ts`
- ✅ Enhanced validator in `src/utils/mapbox-token-validator.ts`

## 🔧 Current Token Status

**Local (.env.local):**
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYToi...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYToi...
```

**API Test Results:**
```json
{
  "hasToken": true,
  "tokenValid": true,
  "environment": {
    "nodeEnv": "development",
    "isProduction": false,
    "isCloudRun": false
  },
  "apiTest": {
    "success": true,
    "status": 200,
    "styleName": "Mapbox Streets"
  }
}
```

## 🚀 Cloud Run Status

**Service URL**: https://universe-mapmaker-1004166685896.europe-central2.run.app

**Issues to fix:**
- ❌ API Route not deployed (returns 404)
- ❌ Token may not be set in environment variables
- ⚠️ Need to commit new API Route and redeploy

## 🔄 Next Steps for Production

1. **Commit new API Route:**
   ```bash
   git add app/api/mapbox/status/route.ts app/clean-map/page.tsx components/CleanMapbox.tsx
   git commit -m "Add API Route and clean map components"
   git push origin main
   ```

2. **Redeploy to Cloud Run:**
   ```bash
   gcloud run deploy universe-mapmaker \
     --source . \
     --region europe-central2 \
     --set-env-vars "NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijo..."
   ```

3. **Test Production:**
   - Main app: https://universe-mapmaker-xxx.run.app/
   - Clean map: https://universe-mapmaker-xxx.run.app/clean-map
   - API: https://universe-mapmaker-xxx.run.app/api/mapbox/status

## 🧪 Test Scenarios

### Local Testing
```bash
# Test all endpoints
curl http://localhost:3002/api/mapbox/status
curl -I http://localhost:3002/clean-map
curl -I http://localhost:3002/mapbox-test
```

### Production Testing (After Deployment)
```bash
# Test API on production
curl https://universe-mapmaker-xxx.run.app/api/mapbox/status

# Check if token is available server-side
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=universe-mapmaker" --limit=5
```

## 📊 Component Architecture

### Clean & Simple
- `CleanMapbox.tsx` - Minimal Mapbox component
- `app/clean-map/page.tsx` - Simple test page

### Advanced & Diagnostic
- `app/mapbox-test/page.tsx` - Full diagnostic page
- `app/api/mapbox/status/route.ts` - Server-side API

### Production
- `src/components/map/MapLoader.tsx` - Smart loader with dynamic import
- `src/components/map/MapView.tsx` - Production map component
- `src/config/mapbox.ts` - Centralized configuration

## 🛠️ Token Requirements for Cloud Run

1. **URL Restrictions in Mapbox Console:**
   ```
   https://*.run.app/*
   https://universe-mapmaker-*.europe-central2.run.app/*
   http://localhost:*/*
   ```

2. **Required Scopes:**
   - ✅ styles:read
   - ✅ fonts:read
   - ✅ datasets:read

3. **Environment Variables:**
   - `NEXT_PUBLIC_MAPBOX_TOKEN` (primary)
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (legacy support)

---

## 🎯 Quick Test Commands

```bash
# Local tests
curl http://localhost:3002/api/mapbox/status
open http://localhost:3002/clean-map
open http://localhost:3002/mapbox-test

# Deploy to production
./scripts/update-mapbox-token.sh

# Check Cloud Run status
./scripts/check-cloud-run-env.sh
```