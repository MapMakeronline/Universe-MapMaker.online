#!/bin/bash

# Deployment script for Universe MapMaker to Google Cloud Run
set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION=${REGION:-"europe-west1"}
SERVICE_NAME="universe-mapmaker"

echo "🚀 Deploying Universe MapMaker to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create secrets if they don't exist (you need to set the actual values)
echo "🔐 Creating secrets in Secret Manager..."
secrets=(
    "google-sheets-private-key"
    "google-sheets-service-account"
    "google-sheets-spreadsheet-id"
    "geoserver-url"
    "geoserver-username"
    "geoserver-password"
    "mapbox-access-token"
)

for secret in "${secrets[@]}"; do
    if ! gcloud secrets describe $secret &> /dev/null; then
        echo "Creating secret: $secret"
        echo "PLACEHOLDER_VALUE" | gcloud secrets create $secret --data-file=-
        echo "⚠️  Please update the secret value for $secret using:"
        echo "   echo 'YOUR_ACTUAL_VALUE' | gcloud secrets versions add $secret --data-file=-"
    else
        echo "✅ Secret $secret already exists"
    fi
done

# Build and deploy using Cloud Build
echo "🏗️  Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

# Show logs
echo "📋 Recent logs:"
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=10
