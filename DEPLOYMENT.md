# 🚀 Deployment Guide - Universe MapMaker

Kompleksowy przewodnik wdrażania zmian na środowisko produkcyjne.

---

## 📋 Środowiska

| Środowisko | URL | Infrastruktura | Status |
|------------|-----|----------------|--------|
| **Production Frontend** | https://universemapmaker.online | Google Cloud Run | ✅ Auto-deploy |
| **Production Backend** | https://api.universemapmaker.online | GCP VM (universe-backend) | ⚠️ Manual deploy |
| **Database** | Cloud SQL PostgreSQL | `geocraft-postgres` | ✅ Managed |
| **Storage** | VM Persistent Disk | `/mnt/qgis-projects` (50GB SSD) | ✅ Mounted |

---

## 🎯 Quick Start - Jak wypychać zmiany?

### **Frontend (Next.js)**

```bash
# 1. Commituj zmiany lokalnie
git add .
git commit -m "feat: your feature description"

# 2. Push do GitHub na branch main
git push origin main

# 3. Cloud Build automatycznie:
#    - Zbuduje Docker image
#    - Wydeployuje na Cloud Run
#    - Zaktualizuje https://universemapmaker.online
#
# ⏱️ Czas deployment: ~5-10 minut
```

**Status deployment:**
```bash
# Sprawdź ostatnie buildy
gcloud builds list --limit=5

# Sprawdź status Cloud Run
gcloud run services describe universe-mapmaker --region=europe-central2
```

### **Backend (Django)**

```bash
# 1. Commituj zmiany lokalnie
git add .
git commit -m "feat: your backend feature"
git push origin main

# 2. SSH do VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# 3. Na VM - ściągnij zmiany
cd ~/Universe-Mapmaker-Backend
git pull origin main

# 4. Rebuild i restart Docker containers
docker-compose -f docker-compose.production.yml build django
docker-compose -f docker-compose.production.yml up -d django

# 5. Sprawdź logi
docker-compose -f docker-compose.production.yml logs -f django
```

**Status backend:**
```bash
# Z lokalnego terminala
curl https://api.universemapmaker.online/auth/login  # Should return 405 Method Not Allowed

# Na VM
docker-compose -f docker-compose.production.yml ps
```

---

## 🏗️ Architektura Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                     GITHUB REPOSITORY                        │
│         github.com/MapMakeronline/                           │
│   ┌────────────────────┐    ┌──────────────────────┐        │
│   │ Universe-MapMaker  │    │ Universe-Mapmaker    │        │
│   │    .online         │    │     -Backend         │        │
│   │  (Frontend)        │    │   (Django+QGIS)      │        │
│   └─────────┬──────────┘    └──────────┬───────────┘        │
└─────────────┼───────────────────────────┼────────────────────┘
              │ git push                  │ git push
              ↓                           ↓
┌─────────────────────────┐    ┌──────────────────────────────┐
│ CLOUD BUILD (Auto)      │    │ MANUAL DEPLOYMENT            │
│                         │    │                              │
│ 1. Build Docker image   │    │ 1. SSH to VM                 │
│ 2. Push to registry     │    │ 2. git pull                  │
│ 3. Deploy to Cloud Run  │    │ 3. docker-compose build      │
│                         │    │ 4. docker-compose up -d      │
└──────────┬──────────────┘    └──────────┬───────────────────┘
           │                              │
           ↓                              ↓
┌──────────────────────────┐   ┌─────────────────────────────┐
│ CLOUD RUN                │   │ GCP VM (universe-backend)   │
│ europe-central2          │   │ IP: 34.0.251.33             │
│                          │   │ zone: europe-central2-a     │
│ Service: universe-mapper │   │                             │
│ URL: universemapmaker    │   │ ┌─────────────────────────┐ │
│      .online             │   │ │ Docker Compose:         │ │
│                          │   │ │  - Django (port 8000)   │ │
│ Port: 3000               │   │ │  - QGIS (port 8080)     │ │
│ Min instances: 0         │   │ │  - Nginx (443/80)       │ │
│ Max instances: 5         │   │ └─────────────────────────┘ │
│ CPU: 1, RAM: 1Gi         │   │                             │
└──────────────────────────┘   │ URL: api.universemapmaker   │
                               │      .online                │
                               └─────────────────────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ↓                                       ↓
          ┌─────────────────────┐              ┌─────────────────────┐
          │ Cloud SQL           │              │ Persistent Disk     │
          │ geocraft-postgres   │              │ /mnt/qgis-projects  │
          │ IP: 34.116.133.97   │              │ 50GB SSD            │
          │ PostgreSQL+PostGIS  │              │ QGS files, layers   │
          └─────────────────────┘              └─────────────────────┘
```

---

## 📦 Frontend Deployment (Cloud Run)

### **Automatyczny Deployment (Cloud Build)**

Frontend deployuje się **automatycznie** po każdym pushu na `main` branch.

**Proces:**
1. Commit → `git push origin main`
2. GitHub webhook → Cloud Build trigger
3. Cloud Build wykonuje `cloudbuild.yaml`:
   - Buduje Docker image z Next.js
   - Taguje: `europe-central2-docker.pkg.dev/universe-mapmaker/app-repo/app:${COMMIT_SHA}`
   - Deployuje na Cloud Run `universe-mapmaker`

**Konfiguracja Cloud Build (`cloudbuild.yaml`):**
```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '--build-arg', 'NEXT_PUBLIC_MAPBOX_TOKEN=pk...',
      '--build-arg', 'NEXT_PUBLIC_API_URL=https://api.universemapmaker.online',
      '-t', 'europe-central2-docker.pkg.dev/$PROJECT_ID/app-repo/app:$SHORT_SHA',
      '.'
    ]

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args: [
      'run', 'deploy', 'universe-mapmaker',
      '--image', '...:$SHORT_SHA',
      '--region', 'europe-central2',
      '--set-env-vars', 'NODE_ENV=production,NEXT_PUBLIC_API_URL=https://api.universemapmaker.online'
    ]
```

### **Ręczny Deployment (Emergency)**

Jeśli Cloud Build nie działa:

```bash
# 1. Zbuduj image lokalnie
gcloud builds submit \
  --region=europe-central2 \
  --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)

# 2. Sprawdź status
gcloud builds list --limit=5

# 3. Zweryfikuj deployment
curl https://universemapmaker.online
```

### **Rollback Frontend**

```bash
# Lista rewizji
gcloud run revisions list --service=universe-mapmaker --region=europe-central2

# Rollback do poprzedniej wersji
gcloud run services update-traffic universe-mapmaker \
  --region=europe-central2 \
  --to-revisions=universe-mapmaker-00042-abc=100
```

### **Sprawdzenie statusu**

```bash
# Status service
gcloud run services describe universe-mapmaker --region=europe-central2

# Logi
gcloud run services logs read universe-mapmaker --region=europe-central2 --limit=50

# Metryki
gcloud run services describe universe-mapmaker --region=europe-central2 --format="get(status.traffic)"
```

---

## 🔧 Backend Deployment (GCP VM)

### **Deploy Backend Changes**

Backend **NIE deployuje się automatycznie** - musisz to zrobić ręcznie.

**Proces deployment:**

```bash
# 1. SSH do VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# 2. Przejdź do repo
cd ~/Universe-Mapmaker-Backend

# 3. Sprawdź branch
git branch -a
git status

# 4. Ściągnij zmiany
git pull origin main

# 5. Sprawdź co się zmieniło
git log -5 --oneline

# 6. Rebuild Django container (jeśli kod Django się zmienił)
docker-compose -f docker-compose.production.yml build django

# 7. Restart Django
docker-compose -f docker-compose.production.yml up -d django

# 8. Sprawdź logi
docker-compose -f docker-compose.production.yml logs -f django

# Ctrl+C żeby wyjść z logów

# 9. Test endpointów
curl http://localhost:8000/  # Powinno zwrócić HTML/JSON
curl http://localhost:8000/auth/login  # Method Not Allowed (OK)

# 10. Sprawdź czy wszystko działa przez Nginx (external)
curl https://api.universemapmaker.online/auth/login
```

### **Deploy QGIS Server Changes**

Jeśli zmieniłeś konfigurację QGIS:

```bash
# Na VM
cd ~/Universe-Mapmaker-Backend

# Rebuild QGIS container
docker-compose -f docker-compose.production.yml build qgis-server

# Restart
docker-compose -f docker-compose.production.yml up -d qgis-server

# Test
curl "http://localhost:8080/ows/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"
```

### **Full Restart (All Services)**

```bash
# Na VM
cd ~/Universe-Mapmaker-Backend

# Stop wszystko
docker-compose -f docker-compose.production.yml down

# Rebuild wszystko
docker-compose -f docker-compose.production.yml build

# Start
docker-compose -f docker-compose.production.yml up -d

# Sprawdź status
docker-compose -f docker-compose.production.yml ps
```

### **Sprawdzenie statusu backendu**

```bash
# Na VM
docker-compose -f docker-compose.production.yml ps

# Logi
docker-compose -f docker-compose.production.yml logs -f django
docker-compose -f docker-compose.production.yml logs -f qgis-server
docker-compose -f docker-compose.production.yml logs -f nginx

# Zasoby
docker stats

# Wolne miejsce
df -h
df -h | grep qgis  # Storage dla QGS files
```

### **Rollback Backend**

```bash
# Na VM
cd ~/Universe-Mapmaker-Backend

# Sprawdź commity
git log --oneline -10

# Rollback do konkretnego commita
git reset --hard abc1234

# Rebuild i restart
docker-compose -f docker-compose.production.yml build django
docker-compose -f docker-compose.production.yml up -d django

# Lub cofnij tylko 1 commit
git reset --hard HEAD~1
```

---

## 🔄 Migrations & Database Changes

### **Django Migrations**

```bash
# 1. SSH do VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# 2. Stwórz migracje (jeśli zmieniłeś models.py)
docker-compose -f docker-compose.production.yml exec django python manage.py makemigrations

# 3. Sprawdź co zostanie zmienione
docker-compose -f docker-compose.production.yml exec django python manage.py sqlmigrate geocraft_api 0001

# 4. Uruchom migracje
docker-compose -f docker-compose.production.yml exec django python manage.py migrate

# 5. Sprawdź status
docker-compose -f docker-compose.production.yml exec django python manage.py showmigrations
```

### **Backup Database (Before Migrations!)**

```bash
# Backup Cloud SQL
gcloud sql backups create \
  --instance=geocraft-postgres \
  --description="Pre-migration backup $(date +%Y%m%d)"

# Lista backupów
gcloud sql backups list --instance=geocraft-postgres

# Restore (jeśli coś poszło nie tak)
gcloud sql backups restore BACKUP_ID --instance=geocraft-postgres
```

---

## 📝 Environment Variables

### **Frontend (Cloud Run)**

Zmienne ustawione w `cloudbuild.yaml` → automatycznie deployowane:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ
NEXT_PUBLIC_API_URL=https://api.universemapmaker.online
```

**Zmiana zmiennych:**
1. Edytuj `cloudbuild.yaml`
2. Commit + push
3. Cloud Build automatycznie deployuje

**Alternatywnie (emergency):**
```bash
gcloud run services update universe-mapmaker \
  --region=europe-central2 \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://new-api.example.com"
```

### **Backend (VM)**

Zmienne w `.env` file na VM:

```bash
# SSH do VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Edytuj .env
cd ~/Universe-Mapmaker-Backend
nano .env

# Przykład:
# DB_HOST=34.116.133.97
# DB_PORT=5432
# DJANGO_SECRET_KEY=your-secret-key
# DJANGO_DEBUG=False

# Restart Django
docker-compose -f docker-compose.production.yml restart django
```

---

## 🧪 Testing Deployment

### **Pre-deployment Tests (Lokalnie)**

```bash
# 1. Testy integracyjne
node test-auth-integration.js

# 2. Build frontend lokalnie
npm run build

# 3. Sprawdź czy build przeszedł
ls -la .next/standalone
```

### **Post-deployment Tests (Produkcja)**

```bash
# Test frontend
curl https://universemapmaker.online
curl https://universemapmaker.online/_next/static/  # Static assets

# Test backend
curl https://api.universemapmaker.online
curl -X POST https://api.universemapmaker.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'  # Should return 400

# Test QGIS Server
curl "https://api.universemapmaker.online/ows/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"
```

### **Automated Tests (CI/CD)**

Stwórz `.github/workflows/test.yml`:

```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node test-auth-integration.js
```

---

## 🚨 Troubleshooting

### **Frontend nie deployuje się**

```bash
# Sprawdź Cloud Build status
gcloud builds list --limit=10

# Zobacz logi ostatniego buildu
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")

# Sprawdź triggery
gcloud builds triggers list

# Ręczny deploy
gcloud builds submit --config=cloudbuild.yaml
```

### **Backend 500 Error**

```bash
# SSH do VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Sprawdź Django logs
docker-compose -f docker-compose.production.yml logs django | tail -100

# Sprawdź czy DB connection działa
docker-compose -f docker-compose.production.yml exec django python manage.py dbshell

# Restart
docker-compose -f docker-compose.production.yml restart django
```

### **QGIS Server nie odpowiada**

```bash
# Na VM
docker-compose logs qgis-server | tail -50

# Sprawdź czy projekty są dostępne
ls -la /mnt/qgis-projects/

# Test lokalnie
curl "http://localhost:8080/ows/?SERVICE=WMS&REQUEST=GetCapabilities"

# Restart
docker-compose -f docker-compose.production.yml restart qgis-server
```

### **Wolny deployment frontend**

Cloud Build może trwać 5-10 minut. Przyspieszenie:

```bash
# Użyj cache (już skonfigurowane w cloudbuild.yaml)
# Zmniejsz build machine type (ale będzie wolniej):
# options:
#   machineType: 'E2_HIGHCPU_4'  # zamiast E2_HIGHCPU_8
```

---

## 📊 Monitoring & Alerts

### **Cloud Run Metrics**

```bash
# CPU/Memory usage
gcloud run services describe universe-mapmaker --region=europe-central2 \
  --format="table(status.traffic,spec.template.spec.containers[0].resources)"

# Request count (last hour)
gcloud logging read "resource.type=cloud_run_revision" --limit=100
```

### **VM Metrics**

```bash
# SSH i sprawdź zasoby
gcloud compute ssh universe-backend --zone=europe-central2-a

# Na VM:
top
df -h
docker stats
```

### **Setup Alerts (Opcjonalne)**

```bash
# Alert gdy Cloud Run błędy > 5%
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Cloud Run Error Rate > 5%" \
  --condition-display-name="High error rate" \
  --condition-threshold-value=5
```

---

## ✅ Deployment Checklist

### **Przed Deployment:**
- [ ] Testy przeszły lokalnie (`node test-auth-integration.js`)
- [ ] Branch `main` jest aktualny (`git pull origin main`)
- [ ] Commit message jest opisowy
- [ ] Breaking changes? → Dodaj migracje DB
- [ ] Environment variables aktualne?

### **Po Frontend Deployment:**
- [ ] Cloud Build zakończył się sukcesem
- [ ] `curl https://universemapmaker.online` zwraca 200
- [ ] Test logowania działa
- [ ] Mapbox mapa się ładuje

### **Po Backend Deployment:**
- [ ] Docker containers running (`docker-compose ps`)
- [ ] Django logs bez błędów
- [ ] `curl https://api.universemapmaker.online/auth/login` działa
- [ ] QGIS Server `/ows` odpowiada

---

## 🔗 Linki

- **Frontend:** https://universemapmaker.online
- **Backend API:** https://api.universemapmaker.online
- **QGIS OWS:** https://api.universemapmaker.online/ows
- **GitHub Frontend:** https://github.com/MapMakeronline/Universe-MapMaker.online
- **GitHub Backend:** https://github.com/MapMakeronline/Universe-Mapmaker-Backend
- **GCP Console:** https://console.cloud.google.com/run?project=universe-mapmaker

---

**Ostatnia aktualizacja:** 2025-10-09
**Maintainer:** Universe MapMaker Team
