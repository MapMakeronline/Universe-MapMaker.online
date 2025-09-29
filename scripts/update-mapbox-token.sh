#!/bin/bash

# Script to update Mapbox token in Cloud Run
# Usage: ./scripts/update-mapbox-token.sh

set -e

# Configuration
SERVICE_NAME="universe-mapmaker"
REGION="europe-central2"
TOKEN="pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ"

echo "🚀 Updating Mapbox token for Cloud Run service: $SERVICE_NAME"
echo "📍 Region: $REGION"
echo "🔑 Token: ${TOKEN:0:20}..."

# Update the service with new token
gcloud run services update $SERVICE_NAME \
  --update-env-vars "NEXT_PUBLIC_MAPBOX_TOKEN=$TOKEN,NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$TOKEN" \
  --region $REGION

echo "✅ Token updated successfully!"
echo ""
echo "📋 To verify, run:"
echo "gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(spec.template.spec.containers[0].env[?(@.name==\"NEXT_PUBLIC_MAPBOX_TOKEN\")].value)'"
echo ""
echo "🌐 Test URL: https://$SERVICE_NAME-576538488457.europe-central2.run.app/mapbox-test"