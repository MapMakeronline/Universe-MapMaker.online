#!/bin/bash

# Setup script for Google Cloud Run deployment
# Universe MapMaker - Mapbox integration

set -e

# Configuration
PROJECT_ID="dzialkizamniej"
REGION="europe-central2"
SERVICE_NAME="universe-mapmaker"
REPO_NAME="universe-mapmaker"

echo "================================================"
echo "🚀 Universe MapMaker - Google Cloud Setup"
echo "================================================"
echo ""
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Check if gcloud is logged in
echo "🔐 Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not logged in to gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "📦 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

echo "✅ APIs enabled successfully"

# Create Artifact Registry repository (if not exists)
echo ""
echo "🐳 Creating Artifact Registry repository..."
if gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    echo "✅ Repository '$REPO_NAME' already exists"
else
    gcloud artifacts repositories create $REPO_NAME \
      --repository-format=docker \
      --location=$REGION \
      --description="Docker images for Universe MapMaker" \
      --quiet
    echo "✅ Repository '$REPO_NAME' created"
fi

# Get project number for service accounts
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
echo ""
echo "📊 Project Number: $PROJECT_NUMBER"

# Cloud Build service account
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo ""
echo "🔑 Setting up IAM permissions..."

# Grant Cloud Build permissions
echo "  → Granting Cloud Build service account permissions..."

# Artifact Registry Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --quiet

# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin" \
  --quiet

# Service Account User
gcloud iam service-accounts add-iam-policy-binding \
  ${COMPUTE_SA} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

echo "✅ IAM permissions configured"

# Check for problematic secrets and clean them up
echo ""
echo "🧹 Checking for old/problematic secrets..."

PROBLEMATIC_SECRETS=(
  "google-sheets-private-key"
  "google-sheets-service-account"
  "google-sheets-spreadsheet-id"
  "geoserver-url"
  "geoserver-username"
  "geoserver-password"
)

for SECRET in "${PROBLEMATIC_SECRETS[@]}"; do
  if gcloud secrets describe $SECRET &>/dev/null; then
    echo "  ⚠️  Found unused secret: $SECRET"
    echo "      This secret is referenced in old cloudbuild.yaml but not needed."
    echo "      Consider deleting with: gcloud secrets delete $SECRET"
  fi
done

echo ""
echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Fix Cloud Build configuration'"
echo "   git push origin main"
echo ""
echo "2. Run Cloud Build manually:"
echo "   gcloud builds submit --config=cloudbuild.yaml --substitutions=COMMIT_SHA=\$(git rev-parse HEAD)"
echo ""
echo "3. Or deploy directly from source:"
echo "   gcloud run deploy $SERVICE_NAME \\"
echo "     --source . \\"
echo "     --region $REGION \\"
echo "     --allow-unauthenticated"
echo ""
echo "4. View your app:"
echo "   https://$SERVICE_NAME-$PROJECT_NUMBER.$REGION.run.app"
echo ""
echo "================================================"