# Admin Access Guide - Universe MapMaker

Complete guide for administrative access to Universe MapMaker infrastructure.

---

## 🔐 Django Admin Panel

### Access
**URL:** http://34.0.251.33:8000/admin/

### Credentials

#### Main Superuser
- **Username:** `admin`
- **Password:** `admin123`
- **Created:** Via entrypoint.sh during VM startup
- **Use:** Development and testing

#### GCP Admin User
- **Username:** `admin_gcp`
- **Password:** `UniverseGCP2025!`
- **Email:** admin@universemapmaker.online
- **Created:** 2025-10-09 via gcloud CLI
- **Use:** Production administration and GCP management

### Features Available
- **User Management** - Create, edit, delete users
- **Project Management** - View all projects, edit metadata
- **Layer Management** - Manage GIS layers and datasets
- **Database Admin** - Direct database queries and modifications
- **Permissions** - Assign roles and permissions
- **Logs** - View login logs and system activities

---

## 📊 GCP App Hub Monitoring

### Access
**URL:** https://console.cloud.google.com/monitoring/applications?project=universe-mapmaker

### Application Details
- **Name:** Universe MapMaker
- **Location:** europe-central2
- **Scope:** REGIONAL
- **Environment:** PRODUCTION
- **Criticality:** MISSION_CRITICAL
- **Created:** 2025-10-09

### Monitored Resources

#### VM Instance
- **Name:** universe-backend
- **Type:** e2-standard-2
- **Zone:** europe-central2-a
- **IP:** 34.0.251.33
- **Services:**
  - Django Backend (port 8000)
  - QGIS Server (port 8080)
  - Nginx (port 80)

#### Cloud SQL
- **Instance:** geocraft-postgres
- **Version:** PostgreSQL 15
- **Database:** geocraft_db
- **Extensions:** PostGIS

#### Cloud Storage
- **Bucket:** universe-qgis-projects
- **Location:** europe-central2

### Metrics Available
- **Uptime** - Service availability %
- **Latency** - Response time
- **Error Rate** - Failed requests
- **CPU/Memory** - Resource utilization
- **Database Connections** - Active connections
- **Storage Usage** - Disk and bucket usage

---

## 🗄️ Database Access

### Cloud SQL Connection

#### Via gcloud CLI (Recommended)
```bash
gcloud sql connect geocraft-postgres --user=postgres --quiet
```

#### Direct Connection
```bash
# Host: 34.116.133.97
# Port: 5432
# Database: geocraft_db
# User: postgres
# Password: GeoCraft2025SecurePass!
```

#### From VM (Unix Socket)
```bash
# Django uses Unix socket:
# /cloudsql/universe-mapmaker:europe-central2:geocraft-postgres
```

### PostgreSQL Admin Commands

```sql
-- List databases
\l

-- Connect to geocraft_db
\c geocraft_db

-- List tables
\dt

-- Check PostGIS extension
SELECT PostGIS_Full_Version();

-- View users
SELECT * FROM auth_user;

-- View projects
SELECT * FROM geocraft_api_project;

-- View layers
SELECT * FROM geocraft_api_layer;
```

---

## 🐳 Docker Management (on VM)

### SSH Access
```bash
gcloud compute ssh universe-backend --zone=europe-central2-a
```

### Docker Commands

#### View Running Containers
```bash
sudo docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                       STATUS
xxxxx          django:latest               Up X hours
xxxxx          3liz/qgis-map-server:3.28   Up X hours
xxxxx          nginx:alpine                Up X hours
```

#### View Logs
```bash
# Django logs
sudo docker-compose logs -f django

# QGIS Server logs
sudo docker-compose logs -f qgis-server

# Nginx logs
sudo docker-compose logs -f nginx

# All logs
sudo docker-compose logs -f
```

#### Restart Services
```bash
# Restart single service
sudo docker-compose restart django

# Restart all services
sudo docker-compose restart

# Full reload (pull updates)
sudo docker-compose down
sudo docker-compose pull
sudo docker-compose up -d
```

#### Execute Commands in Container
```bash
# Django shell
sudo docker exec -it universe-mapmaker-backend_django_1 python manage.py shell

# Django migrations
sudo docker exec universe-mapmaker-backend_django_1 python manage.py migrate

# Create superuser
sudo docker exec -it universe-mapmaker-backend_django_1 python manage.py createsuperuser

# Database shell
sudo docker exec -it universe-mapmaker-backend_django_1 python manage.py dbshell
```

---

## 📈 Monitoring & Logging

### GCP Console Links

#### Cloud Monitoring Dashboard
https://console.cloud.google.com/monitoring/dashboards?project=universe-mapmaker

#### Logs Explorer
https://console.cloud.google.com/logs/query?project=universe-mapmaker

#### Compute Engine Dashboard
https://console.cloud.google.com/compute/instances?project=universe-mapmaker

#### Cloud SQL Dashboard
https://console.cloud.google.com/sql/instances?project=universe-mapmaker

### Useful Log Queries

#### VM Logs
```bash
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=universe-backend" \
  --limit=50 \
  --format=json
```

#### Cloud SQL Logs
```bash
gcloud logging read "resource.type=cloudsql_database AND resource.labels.database_id=geocraft-postgres" \
  --limit=50
```

#### Application Logs (on VM)
```bash
# System logs
sudo journalctl -u docker -n 100

# Docker logs
sudo docker-compose logs --tail=100

# Real-time monitoring
sudo docker stats
```

### Metrics to Watch

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 80% | > 95% |
| Disk Usage | > 75% | > 90% |
| Database Connections | > 80 | > 95 |
| Response Time | > 1s | > 3s |
| Error Rate | > 1% | > 5% |

---

## 🔧 Maintenance Tasks

### Daily Checks
- [ ] Check service uptime (all 3 services running)
- [ ] Review error logs for anomalies
- [ ] Monitor disk usage
- [ ] Check database connection count

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Backup verification
- [ ] Cost analysis

### Monthly Tasks
- [ ] Full system backup
- [ ] Security audit
- [ ] Performance optimization
- [ ] Capacity planning

### Backups

#### Cloud SQL Automatic Backups
```bash
# List backups
gcloud sql backups list --instance=geocraft-postgres

# Create on-demand backup
gcloud sql backups create --instance=geocraft-postgres

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=geocraft-postgres
```

#### Manual Database Backup
```bash
# Export database
gcloud sql export sql geocraft-postgres \
  gs://universe-qgis-projects/backups/$(date +%Y%m%d).sql \
  --database=geocraft_db

# Import database
gcloud sql import sql geocraft-postgres \
  gs://universe-qgis-projects/backups/backup.sql \
  --database=geocraft_db
```

---

## 🚨 Troubleshooting

### Service Down

#### Check Service Status
```bash
# SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Check containers
sudo docker ps -a

# Check logs
sudo docker-compose logs --tail=50
```

#### Restart Services
```bash
# Restart specific service
sudo docker-compose restart django

# Full restart
sudo docker-compose down && sudo docker-compose up -d
```

### Database Connection Issues

#### Check Cloud SQL Status
```bash
gcloud sql instances describe geocraft-postgres \
  --format="value(state)"
```

#### Test Connection from VM
```bash
sudo docker exec universe-mapmaker-backend_django_1 \
  python manage.py check --database default
```

### High CPU/Memory Usage

#### Identify Heavy Processes
```bash
# On VM
sudo docker stats

# System resources
top
htop
```

#### Scale VM if Needed
```bash
# Stop VM
gcloud compute instances stop universe-backend --zone=europe-central2-a

# Change machine type
gcloud compute instances set-machine-type universe-backend \
  --machine-type=e2-standard-4 \
  --zone=europe-central2-a

# Start VM
gcloud compute instances start universe-backend --zone=europe-central2-a
```

---

## 🔐 Security Best Practices

### Current Security Measures
✅ Firewall rules restrict access to specific ports
✅ PostgreSQL password authentication
✅ Django admin requires authentication
✅ HTTPS ready (nginx configured)
⚠️ Database passwords in plaintext (improve with Secret Manager)
⚠️ No SSL on Cloud SQL connection (add SSL certificates)

### Recommended Improvements

#### 1. Use Secret Manager for Passwords
```bash
# Store database password
echo -n "GeoCraft2025SecurePass!" | \
  gcloud secrets create db-password --data-file=-

# Store Django secret key
echo -n "your-secret-key" | \
  gcloud secrets create django-secret-key --data-file=-
```

#### 2. Enable Cloud SQL SSL
```bash
gcloud sql ssl-certs create client-cert \
  --instance=geocraft-postgres \
  client-key.pem
```

#### 3. Add SSL Certificate (when domain is configured)
```bash
sudo certbot --nginx -d universemapmaker.online
```

#### 4. Enable Audit Logs
```bash
# Enable Cloud SQL audit logs
gcloud sql instances patch geocraft-postgres \
  --database-flags=cloudsql.enable_pgaudit=on
```

---

## 📞 Emergency Contacts

### GCP Support
- **Console:** https://console.cloud.google.com/support
- **Project ID:** universe-mapmaker
- **Region:** europe-central2

### Quick Access Links

| Resource | URL |
|----------|-----|
| **GCP Console** | https://console.cloud.google.com |
| **App Hub** | https://console.cloud.google.com/monitoring/applications |
| **Django Admin** | http://34.0.251.33:8000/admin/ |
| **QGIS Server** | http://34.0.251.33:8080/ows/ |
| **Compute Engine** | https://console.cloud.google.com/compute |
| **Cloud SQL** | https://console.cloud.google.com/sql |
| **Logs** | https://console.cloud.google.com/logs |

---

## 📋 System Information

```
Project: universe-mapmaker
Region: europe-central2
VM IP: 34.0.251.33

Services:
- Django Backend: :8000
- QGIS Server: :8080
- Nginx: :80

Database:
- Host: 34.116.133.97
- Database: geocraft_db
- Engine: PostgreSQL 15 + PostGIS

Storage:
- Bucket: gs://universe-qgis-projects
- Mount: /mnt/qgis-projects
```

---

**Last Updated:** 2025-10-09
**Status:** ✅ All Systems Operational
