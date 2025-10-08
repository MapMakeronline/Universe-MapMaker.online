# Infrastructure Setup

## Production Architecture

```
Frontend (Google Cloud Run)
    ↓
Backend (Railway)
    ↓
PostgreSQL (Railway)
```

## Environments

### **Frontend - Google Cloud Run**
- **URL:** `https://universe-mapmaker-576538488457.europe-central2.run.app/`
- **Region:** europe-central2 (Warsaw, Poland)
- **Deployment:** Automatic via Cloud Build (GitHub push to main)
- **Config:** `cloudbuild.yaml`
- **Environment Variables:**
  - `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox GL JS access token
  - `NEXT_PUBLIC_API_URL` - Backend API URL
  - `NODE_ENV=production`

### **Backend - Railway**
- **URL:** `https://universe-mapmaker-backend-production.up.railway.app/`
- **Deployment:** Automatic via Railway (GitHub push to main)
- **Repository:** `Universe-Mapmaker-Backend`
- **Environment Variables:**
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - `SECRET_KEY`

### **Database - Railway PostgreSQL**
- **Host:** `postgres.railway.internal` (internal network)
- **Port:** 5432
- **Database:** railway
- **Engine:** PostGIS (PostgreSQL + GIS extensions)

## Deployment Process

### Frontend (Cloud Run)
1. Push to `main` branch on GitHub
2. Cloud Build triggers automatically
3. Builds Docker image with Next.js standalone output
4. Pushes to Artifact Registry (europe-central2)
5. Deploys to Cloud Run (~5-10 minutes)

**Trigger build manually:**
```bash
gcloud builds submit \
  --region=europe-central2 \
  --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
```

**Check deployment status:**
```bash
gcloud run services describe universe-mapmaker --region=europe-central2
```

### Backend (Railway)
1. Push to `main` branch on GitHub (Backend repo)
2. Railway detects changes automatically
3. Builds and deploys (~3-5 minutes)

**Check logs:**
```bash
railway logs
```

## Mapbox Tokens

### Production Token
- **Token:** `pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ`
- **Account:** mapmaker-online
- **Features:** 3D terrain, buildings, geocoding, directions

### Where it's used:
1. **Frontend (Cloud Run):** Build-time and runtime env vars
2. **MapContainer component:** Client-side Mapbox GL JS
3. **MCP Mapbox Server:** `.claude/mcp.json`

## Custom Domains (TODO)

Currently using default URLs:
- Frontend: `*.run.app`
- Backend: `*.railway.app`

To add custom domain:
1. Frontend: Cloud Run → Add custom domain
2. Backend: Railway → Settings → Domains

## Monitoring

### Frontend (Cloud Run)
- **Logs:** Google Cloud Console → Cloud Run → Logs
- **Metrics:** Cloud Console → Cloud Run → Metrics
- **Errors:** Error Reporting

### Backend (Railway)
- **Logs:** Railway Dashboard → Logs tab
- **Metrics:** Railway Dashboard → Metrics tab

## Cost Optimization

### Cloud Run
- Min instances: 0 (scales to zero)
- Max instances: 5
- CPU: 1
- Memory: 1Gi

### Railway
- Backend: On-demand (usage-based pricing)
- PostgreSQL: Shared plan

## Troubleshooting

### Frontend not loading
1. Check Cloud Build status: `gcloud builds list --limit=5`
2. Check Cloud Run status: `gcloud run services describe universe-mapmaker --region=europe-central2`
3. Check logs for errors

### Backend API errors
1. Check Railway deployment status
2. Check Railway logs for errors
3. Verify database connection

### 401 Unauthorized
- User not logged in
- Token expired or invalid
- Check localStorage: `authToken`

### 404 Not Found
- Check API_URL is correct in cloudbuild.yaml
- Verify backend endpoint exists
- Check CORS settings in Django
