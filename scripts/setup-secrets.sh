#!/bin/bash

# Script to setup Google Cloud secrets for Universe MapMaker
set -e

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}

echo "🔐 Setting up secrets for Universe MapMaker"
echo "Project: $PROJECT_ID"

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local description=$2
    
    echo ""
    echo "Setting up secret: $secret_name"
    echo "Description: $description"
    
    if gcloud secrets describe $secret_name &> /dev/null; then
        echo "Secret $secret_name already exists. Do you want to update it? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "Enter the new value for $secret_name:"
            read -rs secret_value
            echo "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
            echo "✅ Secret $secret_name updated"
        else
            echo "⏭️  Skipping $secret_name"
        fi
    else
        echo "Enter the value for $secret_name:"
        read -rs secret_value
        echo "$secret_value" | gcloud secrets create $secret_name --data-file=-
        echo "✅ Secret $secret_name created"
    fi
}

# Set project
gcloud config set project $PROJECT_ID

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
create_or_update_secret "google-sheets-private-key" "Google Sheets service account private key (base64 encoded)"
create_or_update_secret "google-sheets-service-account" "Google Sheets service account email"
create_or_update_secret "google-sheets-spreadsheet-id" "Google Sheets spreadsheet ID"
create_or_update_secret "geoserver-url" "GeoServer base URL (e.g., https://your-geoserver.com/geoserver)"
create_or_update_secret "geoserver-username" "GeoServer username"
create_or_update_secret "geoserver-password" "GeoServer password"
create_or_update_secret "mapbox-access-token" "Mapbox access token"

echo ""
echo "✅ All secrets have been configured!"
echo "You can now deploy the application using: ./scripts/deploy.sh"
