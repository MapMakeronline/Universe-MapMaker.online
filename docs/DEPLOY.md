# Deployment Guide - Google Cloud Run

## Wymagania

- Google Cloud Project z włączonymi API:
  - Cloud Run API
  - Container Registry API
  - Cloud Build API
  - Sheets API
- Service Account z uprawnieniami:
  - Cloud Run Developer
  - Storage Admin
  - Sheets API access

## Environment Variables

### Wymagane w Cloud Run:
\`\`\`bash
# Google Sheets Integration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# GeoServer Integration
GEOSERVER_URL=https://your-geoserver.com/geoserver
GEOSERVER_WORKSPACE=your_workspace
GEOSERVER_USERNAME=admin
GEOSERVER_PASSWORD=your_password

# Mapbox Integration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_public_mapbox_token_here

# Security
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=https://your-app-url.run.app
\`\`\`

### Mapbox Token Security:
- **NEXT_PUBLIC_MAPBOX_TOKEN**: Publiczny token Mapbox dostępny w przeglądarce
- Uzyskaj token z [Mapbox Account Dashboard](https://account.mapbox.com/access-tokens/)
- Skonfiguruj URL restrictions dla bezpieczeństwa (opcjonalne)
- Token publiczny jest bezpieczny do użycia w frontend aplikacjach

## Build & Deploy Process

### 1. Lokalne testowanie:
\`\`\`bash
# Build standalone
npm run build

# Test lokalnie
npm run start
\`\`\`

### 2. Deploy via Cloud Build:
\`\`\`bash
# Setup secrets (jednorazowo)
./scripts/setup-secrets.sh

# Deploy
./scripts/deploy.sh
\`\`\`

### 3. Ręczny deploy:
\`\`\`bash
# Build image
docker build -t gcr.io/PROJECT_ID/universe-mapmaker .

# Push to registry
docker push gcr.io/PROJECT_ID/universe-mapmaker

# Deploy to Cloud Run
gcloud run deploy universe-mapmaker \
  --image gcr.io/PROJECT_ID/universe-mapmaker \
  --platform managed \
  --region europe-central2 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
\`\`\`

## Monitoring & Logs

\`\`\`bash
# Sprawdź logi
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=universe-mapmaker" --limit 50

# Metryki
gcloud monitoring metrics list --filter="resource.type=cloud_run_revision"
\`\`\`

## Troubleshooting

### Częste problemy:

1. **Service Account Issues**:
   - Sprawdź czy private key jest poprawnie sformatowany (z \n)
   - Zweryfikuj uprawnienia do Sheets API

2. **Memory Issues**:
   - Zwiększ limit pamięci w Cloud Run
   - Sprawdź czy nie ma memory leaks w Mapbox

3. **Cold Start Performance**:
   - Użyj minimum instances = 1 dla produkcji
   - Optymalizuj bundle size

4. **CORS Issues**:
   - Sprawdź konfigurację GeoServer
   - Dodaj proper headers w middleware
