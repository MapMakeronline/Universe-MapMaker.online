# Infrastructure Setup

## Production Architecture

```
Frontend (Google Cloud Run)
https://universemapmaker.online (34.111.222.132)
    ↓
Backend API (GCP VM + Docker)
https://api.universemapmaker.online (34.111.222.132)
    ├── Django (port 8000) - REST API
    └── QGIS Server (port 8080) - OWS services
    ↓
PostgreSQL (GCP VM)
```

## Environments

### **Frontend - Google Cloud Run**
- **Production URL:** `https://universemapmaker.online`
- **Cloud Run URL:** `https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app/`
- **Region:** europe-central2 (Warsaw, Poland)
- **Deployment:** Automatic via Cloud Build (GitHub push to main)
- **Config:** `cloudbuild.yaml`
- **Environment Variables:**
  - `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox GL JS access token
  - `NEXT_PUBLIC_API_URL=https://api.universemapmaker.online`
  - `NODE_ENV=production`

### **Backend - GCP VM (universe-backend)**
- **Production URL:** `https://api.universemapmaker.online`
- **VM Instance:** `universe-backend`
- **Zone:** `europe-central2-a`
- **External IP:** `34.0.251.33`
- **SSL:** Let's Encrypt (managed by Certbot)
- **Architecture:**
  - **Nginx** (reverse proxy)
    - Port 443 (HTTPS) with SSL certificates
    - Proxies `/ows` → QGIS Server (port 8080)
    - Proxies everything else → Django (port 8000)
  - **Django** (Docker container: `universe-mapmaker-backend_django_1`)
    - Port 8000
    - REST API endpoints: `/api/`, `/auth/`, `/dashboard/`, `/admin/`
  - **QGIS Server** (Docker container: `universe-mapmaker-backend_qgis-server_1`)
    - Port 8080
    - OGC Web Services: WMS, WFS, WCS
    - Endpoint: `/ows`
- **Docker Compose:** `docker-compose.production.yml`
- **Environment Variables:**
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - `SECRET_KEY`

### **Database - PostgreSQL + PostGIS**
- **Host:** Internal (same VM or separate)
- **Port:** 5432
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

### Backend (GCP VM)

**SSH into VM:**
```bash
gcloud compute ssh universe-backend --zone=europe-central2-a
```

**Check Docker containers:**
```bash
sudo docker ps
```

**View Django logs:**
```bash
sudo docker logs universe-mapmaker-backend_django_1 -f
```

**View QGIS Server logs:**
```bash
sudo docker logs universe-mapmaker-backend_qgis-server_1 -f
```

**Restart containers:**
```bash
cd /path/to/backend
sudo docker-compose -f docker-compose.production.yml restart
```

**Nginx configuration:**
Location: `/etc/nginx/sites-available/api`

```nginx
server {
    server_name api.universemapmaker.online;
    client_max_body_size 100M;

    # QGIS Server OWS endpoint
    location /ows {
        proxy_pass http://localhost:8080/ows;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        proxy_buffering off;
    }

    # Django API
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    location /static/ {
        proxy_pass http://localhost:8000/static/;
    }

    location /media/ {
        proxy_pass http://localhost:8000/media/;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.universemapmaker.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.universemapmaker.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = api.universemapmaker.online) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name api.universemapmaker.online;
    return 404;
}
```

**Reload nginx after changes:**
```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
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

## Custom Domains

### ✅ Active Domains
- **Frontend:** `universemapmaker.online` → Cloud Run
- **Backend API:** `api.universemapmaker.online` → GCP VM (34.0.251.33)

### DNS Configuration
- **A Record:** `universemapmaker.online` → `34.111.222.132` (Cloud Run)
- **A Record:** `api.universemapmaker.online` → `34.0.251.33` (GCP VM)

### SSL Certificates
- **Frontend:** Google-managed SSL (automatic via Cloud Run)
- **Backend:** Let's Encrypt (managed by Certbot on VM)

**Renew SSL manually (if needed):**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Monitoring

### Frontend (Cloud Run)
- **Logs:** Google Cloud Console → Cloud Run → Logs
- **Metrics:** Cloud Console → Cloud Run → Metrics
- **Errors:** Error Reporting

### Backend (GCP VM)
- **SSH Access:** `gcloud compute ssh universe-backend --zone=europe-central2-a`
- **Docker Logs:** `sudo docker logs <container_name> -f`
- **Nginx Logs:**
  - Access: `/var/log/nginx/access.log`
  - Errors: `/var/log/nginx/error.log`
- **System Logs:** `sudo journalctl -u nginx -f`

## Cost Optimization

### Cloud Run
- Min instances: 0 (scales to zero)
- Max instances: 5
- CPU: 1
- Memory: 1Gi

### GCP VM
- Instance type: e2-standard-2
- Region: europe-central2-a
- Disk: Standard persistent disk
- External IP: Static (34.0.251.33)

## Troubleshooting

### Frontend not loading
1. Check Cloud Build status: `gcloud builds list --limit=5`
2. Check Cloud Run status: `gcloud run services describe universe-mapmaker --region=europe-central2`
3. Check logs for errors

### Backend API errors
1. Check if containers are running: `sudo docker ps`
2. Check Django logs: `sudo docker logs universe-mapmaker-backend_django_1 -f`
3. Check nginx status: `sudo systemctl status nginx`
4. Verify database connection

### QGIS Server not responding at /ows
1. Check QGIS container: `sudo docker logs universe-mapmaker-backend_qgis-server_1 -f`
2. Test locally: `curl http://localhost:8080/ows`
3. Check nginx proxy configuration
4. Verify OWS parameters (SERVICE, MAP) are provided

### 401 Unauthorized
- User not logged in
- Token expired or invalid
- Check localStorage: `authToken`

### 404 Not Found
- Check API_URL is correct in cloudbuild.yaml
- Verify backend endpoint exists
- Check CORS settings in Django
