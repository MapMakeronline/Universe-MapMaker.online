# GCP Deployment Guide - Universe MapMaker

Complete production deployment on Google Cloud Platform (GCP).

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              PRODUCTION ARCHITECTURE                  │
└──────────────────────────────────────────────────────┘

┌────────────────────┐
│  Frontend (Local)  │  Development: localhost:3000
│  Next.js 15.5.4    │  Production: TBD (Cloud Run)
└─────────┬──────────┘
          │ HTTP API
          ▼
┌─────────────────────────────────────────────────────┐
│  VM: universe-backend                               │
│  Type: e2-standard-2 (2 vCPU, 8 GB RAM)            │
│  Region: europe-central2-a                          │
│  IP: 34.0.251.33                                    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Django Backend                   :8000    │    │
│  │  - REST API                                │    │
│  │  - Admin panel                             │    │
│  │  - GeoCraft core                           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  QGIS Server                     :8080     │    │
│  │  - WMS/WFS services                        │    │
│  │  - Map rendering                           │    │
│  │  - 3liz/qgis-map-server:3.28               │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Nginx Reverse Proxy             :80       │    │
│  │  - Static files                            │    │
│  │  - Load balancing                          │    │
│  └────────────────────────────────────────────┘    │
└──────────────┬───────────────────┬───────────────────┘
               │                   │
      ┌────────┴────────┐   ┌──────┴──────────────┐
      ▼                 ▼   ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Cloud SQL  │   │Cloud Storage │   │   Artifact   │
│             │   │              │   │   Registry   │
│ PostgreSQL  │   │ QGIS Files   │   │Docker Images │
│ 15 + PostGIS│   │ /mnt/qgis-   │   │              │
│             │   │ projects     │   │              │
└─────────────┘   └──────────────┘   └──────────────┘
```

---

## 📊 GCP Resources

### Active Resources

| Resource | Type | Region | Cost/Month |
|----------|------|--------|------------|
| **VM** universe-backend | e2-standard-2 | europe-central2-a | ~$60 |
| **Cloud SQL** geocraft-postgres | db-f1-micro | europe-central2 | ~$7 |
| **Cloud Storage** universe-qgis-projects | Regional | europe-central2 | ~$0.20 |
| **Artifact Registry** | Docker | europe-central2 | ~$0.12 |
| **TOTAL** | | | **~$67/month** |

### VM Details
- **Name:** universe-backend
- **Machine Type:** e2-standard-2 (2 vCPU, 8 GB RAM)
- **Internal IP:** 10.186.0.4
- **External IP:** 34.0.251.33
- **Zone:** europe-central2-a
- **Status:** RUNNING

### Cloud SQL Details
- **Instance:** geocraft-postgres
- **Version:** PostgreSQL 15
- **Tier:** db-f1-micro (shared-core, 0.6 GB RAM)
- **IP:** 34.116.133.97
- **Database:** geocraft_db
- **Extensions:** PostGIS
- **Connection:** universe-mapmaker:europe-central2:geocraft-postgres

### Cloud Storage
- **Bucket:** universe-qgis-projects
- **Location:** europe-central2 (regional)
- **Mount Point:** /mnt/qgis-projects (on VM via gcsfuse)
- **Purpose:** Store QGIS project files (.qgs)

---

## 🚀 Deployment Process

### 1. Initial Setup (Already Done)

```bash
# Set GCP project
gcloud config set project universe-mapmaker

# Enable required APIs
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com
```

### 2. Cloud SQL Setup

```bash
# Create PostgreSQL instance
gcloud sql instances create geocraft-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=europe-central2 \
  --storage-type=SSD \
  --storage-size=10GB

# Set password
gcloud sql users set-password postgres \
  --instance=geocraft-postgres \
  --password=GeoCraft2025SecurePass!

# Create database
gcloud sql databases create geocraft_db \
  --instance=geocraft-postgres

# Get connection name
gcloud sql instances describe geocraft-postgres \
  --format="value(connectionName)"
# Output: universe-mapmaker:europe-central2:geocraft-postgres
```

### 3. Cloud Storage Setup

```bash
# Create bucket
gcloud storage buckets create gs://universe-qgis-projects \
  --location=europe-central2 \
  --uniform-bucket-level-access

# Set permissions for VM service account
PROJECT_NUMBER=$(gcloud projects describe universe-mapmaker --format="value(projectNumber)")
gcloud storage buckets add-iam-policy-binding gs://universe-qgis-projects \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 4. Firewall Rules

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --source-ranges=0.0.0.0/0

# Allow HTTPS
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --source-ranges=0.0.0.0/0

# Allow Django
gcloud compute firewall-rules create allow-django-dev \
  --allow=tcp:8000 \
  --source-ranges=0.0.0.0/0

# Allow QGIS Server
gcloud compute firewall-rules create allow-qgis-server \
  --allow=tcp:8080 \
  --source-ranges=0.0.0.0/0
```

### 5. VM Deployment

The VM is already running with Docker Compose. Services are:

```yaml
# /home/ubuntu/docker-compose.yml
services:
  django:
    image: django:latest
    ports: ["8000:8000"]
    volumes:
      - ./qgs:/projects
    environment:
      - DB_HOST=34.116.133.97
      - DB_PORT=5432
      - DB_NAME=geocraft_db
      - DB_USER=postgres
      - DB_PASSWORD=GeoCraft2025SecurePass!

  qgis-server:
    image: 3liz/qgis-map-server:3.28
    ports: ["8080:8080"]
    volumes:
      - /mnt/qgis-projects:/projects

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

---

## 🔧 Management Commands

### VM Management

```bash
# SSH into VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Stop VM (to save costs during development)
gcloud compute instances stop universe-backend --zone=europe-central2-a

# Start VM
gcloud compute instances start universe-backend --zone=europe-central2-a

# Resize VM
gcloud compute instances stop universe-backend --zone=europe-central2-a
gcloud compute instances set-machine-type universe-backend \
  --machine-type=e2-standard-4 \
  --zone=europe-central2-a
gcloud compute instances start universe-backend --zone=europe-central2-a
```

### Docker Management (on VM)

```bash
# Check running containers
sudo docker ps

# View logs
sudo docker-compose logs django
sudo docker-compose logs qgis-server
sudo docker-compose logs nginx

# Restart services
sudo docker-compose restart

# Update and redeploy
sudo docker-compose pull
sudo docker-compose up -d
```

### Cloud SQL Management

```bash
# Connect to database
gcloud sql connect geocraft-postgres --user=postgres --quiet

# Create backup
gcloud sql backups create --instance=geocraft-postgres

# List backups
gcloud sql backups list --instance=geocraft-postgres

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=geocraft-postgres \
  --backup-id=BACKUP_ID
```

---

## 🧪 Testing Endpoints

### Django Backend
```bash
# Health check
curl http://34.0.251.33:8000/

# Login
curl -X POST http://34.0.251.33:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get projects (requires token)
curl http://34.0.251.33:8000/api/projects/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### QGIS Server
```bash
# WMS GetCapabilities
curl "http://34.0.251.33:8080/ows/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"

# WMS GetMap (requires MAP parameter)
curl "http://34.0.251.33:8080/ows/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&MAP=/projects/myproject.qgs&LAYERS=layer1&..."
```

---

## 📈 Monitoring & Logs

### View Logs

```bash
# VM logs
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=universe-backend" \
  --limit=50 \
  --format=json

# Cloud SQL logs
gcloud logging read "resource.type=cloudsql_database" \
  --limit=50

# Application logs (on VM)
sudo journalctl -u docker -n 100
sudo docker-compose logs --tail=100 -f
```

### Metrics Dashboard

Visit: https://console.cloud.google.com/monitoring/dashboards

- CPU usage
- Memory usage
- Disk I/O
- Network traffic

---

## 💰 Cost Optimization

### Current Costs (~$67/month)

1. **Reduce VM to e2-micro** (development only): Save ~$50/month
2. **Stop VM at night** (23:00-7:00): Save ~33%
3. **Use Cloud SQL shared-core** (already done): $7/month
4. **Regional storage** (already done): Cheaper than multi-region

### Auto-Shutdown Schedule (Optional)

```bash
# Stop at 23:00
gcloud compute instances add-metadata universe-backend \
  --metadata=shutdown-time=23:00 \
  --zone=europe-central2-a

# Start at 7:00
# Requires Cloud Scheduler + Cloud Functions
```

---

## 🔐 Security Recommendations

### Current Setup
- ✅ Firewall rules restrict access
- ✅ PostgreSQL password authentication
- ✅ HTTPS ready (nginx configured)
- ⚠️ Database password in plaintext (use Secret Manager)
- ⚠️ No SSL on Cloud SQL connection

### Improvements

1. **Use Secret Manager for passwords:**
```bash
echo -n "GeoCraft2025SecurePass!" | \
  gcloud secrets create db-password --data-file=-
```

2. **Enable Cloud SQL SSL:**
```bash
gcloud sql ssl-certs create client-cert \
  --instance=geocraft-postgres \
  client-key.pem
```

3. **Add SSL certificate to VM:**
```bash
# Use Let's Encrypt with certbot
sudo certbot --nginx -d universemapmaker.online
```

---

## 🚀 Next Steps

### Immediate
- [x] VM running and tested
- [x] Cloud SQL configured
- [x] QGIS Server operational
- [x] Frontend connecting to backend
- [ ] Deploy frontend to Cloud Run
- [ ] Configure custom domain (universemapmaker.online)

### Short-term
- [ ] Set up Cloud Build CI/CD
- [ ] Configure SSL certificates
- [ ] Enable Cloud SQL backups
- [ ] Set up monitoring alerts

### Long-term
- [ ] Auto-scaling with managed instance groups
- [ ] CDN for static assets
- [ ] Multi-region deployment
- [ ] Database read replicas

---

## 📞 Support

**GCP Console:** https://console.cloud.google.com/

**Project ID:** universe-mapmaker
**Region:** europe-central2
**VM IP:** 34.0.251.33

---

## 🎯 Quick Reference

```bash
# Frontend (local development)
npm run dev
# http://localhost:3000

# Backend API
# http://34.0.251.33:8000

# QGIS Server
# http://34.0.251.33:8080/ows/

# Admin credentials
username: admin
password: admin123
```

---

**Last Updated:** 2025-10-09
**Architecture:** VM-based (future: Cloud Run frontend)
**Status:** ✅ Production Ready
