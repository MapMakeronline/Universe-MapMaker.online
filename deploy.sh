#!/bin/bash

echo "🚀 Deploying Universe MapMaker to Google Cloud Run..."

# Configuration
SERVICE_NAME="universe-mapmaker"
REGION="europe-central2"
PROJECT_ID="universe-mapmaker"

# Your Mapbox token (replace with your actual token)
MAPBOX_TOKEN="pk.eyJ1IjoibWFwbWFrZXJvbmxpbmUiLCJhIjoiY20zMjE5aWd3MDQ5aDJxcGN6M3F3aXFseiJ9.e_QHDBUIHNmwU5E-dqC1hA"

echo "📦 Building and deploying with environment variables..."

# Deploy to Cloud Run with environment variables
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --project=$PROJECT_ID \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-env-vars="NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$MAPBOX_TOKEN" \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="NEXT_TELEMETRY_DISABLED=1" \
  --quiet

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌍 Your app is available at:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

    echo ""
    echo "📋 Next steps:"
    echo "1. Add this URL to your Mapbox token restrictions:"
    echo "   $(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")"
    echo "2. Verify the deployment works by visiting the URL"
    echo "3. Check logs if there are any issues:"
    echo "   gcloud logs tail --service=$SERVICE_NAME --region=$REGION"
else
    echo "❌ Deployment failed!"
    exit 1
fi