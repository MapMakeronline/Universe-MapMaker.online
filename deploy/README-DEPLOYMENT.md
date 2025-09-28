# Google Cloud Run Deployment Guide

## Konfiguracja automatycznego CI/CD dla Universe MapMaker

### Wymagania wstępne

1. **Google Cloud Project**: `universe-mapmaker`
2. **Region**: `europe-central2`
3. **Aktywne API**:
   - Cloud Build API
   - Cloud Run API
   - Artifact Registry API

### 1. Skonfiguruj Artifact Registry

```bash
# Utwórz repozytorium dla obrazów Docker
gcloud artifacts repositories create universe-mapmaker \
    --repository-format=docker \
    --location=europe-central2 \
    --description="Docker repository for Universe MapMaker"
```

### 2. Skonfiguruj Cloud Build Trigger

W Google Cloud Console:

1. Przejdź do **Cloud Build > Triggers**
2. Kliknij **Create Trigger**
3. Skonfiguruj:
   - **Name**: `universe-mapmaker-deploy`
   - **Event**: Push to a branch
   - **Source**: GitHub (połącz z repozytorium)
   - **Repository**: `MapMakeronline/Universe-MapMaker.online`
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file (yaml or json)
   - **Cloud Build configuration file location**: `cloudbuild.yaml`

### 3. Uprawnienia Service Account

```bash
# Ustaw Cloud Build service account permissions
PROJECT_NUMBER=$(gcloud projects describe universe-mapmaker --format='value(projectNumber)')

gcloud projects add-iam-policy-binding universe-mapmaker \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/run.admin

gcloud projects add-iam-policy-binding universe-mapmaker \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/artifactregistry.writer

gcloud iam service-accounts add-iam-policy-binding \
    ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/iam.serviceAccountUser
```

### 4. Zmienne środowiskowe (opcjonalne)

Jeśli chcesz używać Google Secret Manager zamiast hardcodowanych tokenów:

```bash
# Utwórz secret dla Mapbox token
echo "pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtNXV0ZnFkNzAwYnUyanM2NmZudDMxYngifQ.jPjzwtBTV8HWDK3zx7aGlw" | \
gcloud secrets create mapbox-access-token --data-file=-
```

### 5. Struktura plików deployment

```
├── Dockerfile              # Multi-stage build dla Next.js
├── cloudbuild.yaml         # Google Cloud Build config
├── .dockerignore          # Pliki ignorowane przez Docker
└── deploy/
    └── README-DEPLOYMENT.md # Ten plik
```

### 6. Proces deployment

1. **Push do branch `main`** → automatycznie uruchamia Cloud Build
2. **Cloud Build**:
   - Buduje obraz Docker z Next.js app
   - Pushuje do Artifact Registry
   - Deployuje na Cloud Run w `europe-central2`
3. **Cloud Run** serwuje aplikację na publicznym URL

### 7. Monitoring i logi

- **Cloud Run logs**: `gcloud run services logs read universe-mapmaker --region=europe-central2`
- **Cloud Build history**: Google Cloud Console > Cloud Build > History
- **Health check**: Aplikacja ma built-in healthcheck na `/api/health`

### 8. Konfiguracja domeny (opcjonalne)

Po pierwszym deployment:
```bash
# Mapuj domenę na Cloud Run service
gcloud run domain-mappings create \
    --service=universe-mapmaker \
    --domain=your-domain.com \
    --region=europe-central2
```

### Koszty i limity

- **Cloud Run**: Pay-per-use, automatyczne skalowanie 0-10 instancji
- **CPU**: 2 vCPU, **Memory**: 2Gi
- **Timeout**: 300s
- **Concurrency**: 80 requestów na instancję

### Troubleshooting

1. **Build fails**: Sprawdź logi w Cloud Build
2. **Deployment fails**: Sprawdź uprawnienia service account
3. **App nie startuje**: Sprawdź logi Cloud Run i healthcheck