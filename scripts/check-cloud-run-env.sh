#!/bin/bash

# Script to check Cloud Run environment variables
# Usage: ./scripts/check-cloud-run-env.sh

set -e

SERVICE_NAME="universe-mapmaker"
REGION="europe-central2"

echo "🔍 Checking Cloud Run service configuration..."
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if service exists
if gcloud run services describe $SERVICE_NAME --region $REGION &>/dev/null; then
    echo "✅ Service exists"

    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format "value(status.url)")
    echo "🌐 URL: $SERVICE_URL"

    echo ""
    echo "🔧 Environment Variables:"
    gcloud run services describe $SERVICE_NAME \
      --region $REGION \
      --format "table(spec.template.spec.containers[0].env[].name:label=NAME, spec.template.spec.containers[0].env[].value:label=VALUE)" \
      | head -20

    echo ""
    echo "🎯 Mapbox Token Status:"

    # Check for NEXT_PUBLIC_MAPBOX_TOKEN
    MAPBOX_TOKEN=$(gcloud run services describe $SERVICE_NAME \
      --region $REGION \
      --format "value(spec.template.spec.containers[0].env[?(@.name=='NEXT_PUBLIC_MAPBOX_TOKEN')].value)" 2>/dev/null || echo "NOT_SET")

    if [ "$MAPBOX_TOKEN" = "NOT_SET" ] || [ -z "$MAPBOX_TOKEN" ]; then
        echo "❌ NEXT_PUBLIC_MAPBOX_TOKEN: NOT SET"
    else
        echo "✅ NEXT_PUBLIC_MAPBOX_TOKEN: ${MAPBOX_TOKEN:0:20}..."
    fi

    # Check for legacy token
    LEGACY_TOKEN=$(gcloud run services describe $SERVICE_NAME \
      --region $REGION \
      --format "value(spec.template.spec.containers[0].env[?(@.name=='NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')].value)" 2>/dev/null || echo "NOT_SET")

    if [ "$LEGACY_TOKEN" = "NOT_SET" ] || [ -z "$LEGACY_TOKEN" ]; then
        echo "⚠️  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: NOT SET"
    else
        echo "✅ NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: ${LEGACY_TOKEN:0:20}..."
    fi

    echo ""
    echo "🧪 Test URLs:"
    echo "Main App: $SERVICE_URL"
    echo "Test Page: $SERVICE_URL/mapbox-test"

else
    echo "❌ Service '$SERVICE_NAME' not found in region '$REGION'"
    echo ""
    echo "Available services:"
    gcloud run services list --region $REGION
fi