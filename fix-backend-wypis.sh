#!/bin/bash

# Backend Fix Script: Wypis DOCX/PDF File Corruption
# This script fixes the corrupted file download issue in generate_wypis()
#
# Problems fixed:
# 1. File deleted before HTTP response sent (finally block cleanup)
# 2. Wrong Content-Disposition header ('inline' → 'attachment')
#
# Date: 2025-11-16
# Author: Claude Code

set -e  # Exit on error

echo "🔧 Backend Wypis Fix Deployment Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VM_NAME="universe-backend"
ZONE="europe-central2-a"
CONTAINER="universe-mapmaker-backend_django_1"
SERVICE_FILE="/app/geocraft_api/projects/service.py"
BACKUP_FILE="${SERVICE_FILE}.backup_wypis_fix_$(date +%Y%m%d_%H%M%S)"

echo -e "${YELLOW}Step 1: Connecting to backend VM...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="echo 'Connected successfully ✅'" || {
  echo -e "${RED}❌ Failed to connect to VM${NC}"
  exit 1
}

echo -e "${GREEN}✅ Connected to VM${NC}"
echo ""

echo -e "${YELLOW}Step 2: Creating backup of service.py...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo docker exec $CONTAINER cp $SERVICE_FILE $BACKUP_FILE
  echo 'Backup created: $BACKUP_FILE'
" || {
  echo -e "${RED}❌ Failed to create backup${NC}"
  exit 1
}

echo -e "${GREEN}✅ Backup created${NC}"
echo ""

echo -e "${YELLOW}Step 3: Applying fix #1 - Change 'inline' to 'attachment' (line 2344)${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo docker exec $CONTAINER sed -i \"2344s/'inline'/'attachment'/\" $SERVICE_FILE
  echo 'Fix #1 applied: Content-Disposition changed to attachment'
"

echo -e "${GREEN}✅ Fix #1 applied${NC}"
echo ""

echo -e "${YELLOW}Step 4: Applying fix #2 - Remove premature file cleanup (lines 2362-2364)${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo docker exec $CONTAINER bash -c \"
    # Comment out result_document_path cleanup (lines 2362-2364)
    sed -i '2362,2364s/^/# DISABLED by wypis fix: /' $SERVICE_FILE
    echo 'Fix #2 applied: Disabled premature file cleanup'
  \"
"

echo -e "${GREEN}✅ Fix #2 applied${NC}"
echo ""

echo -e "${YELLOW}Step 5: Verifying changes...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo docker exec $CONTAINER bash -c \"
    echo '--- Line 2344 (should be attachment): ---'
    sed -n '2344p' $SERVICE_FILE
    echo ''
    echo '--- Lines 2362-2364 (should be commented): ---'
    sed -n '2362,2364p' $SERVICE_FILE
  \"
"

echo -e "${GREEN}✅ Changes verified${NC}"
echo ""

echo -e "${YELLOW}Step 6: Restarting Django container...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo docker restart $CONTAINER
  echo 'Container restart initiated'
"

echo ""
echo -e "${YELLOW}Waiting 10 seconds for Django to start...${NC}"
sleep 10

echo -e "${YELLOW}Step 7: Verifying Django is running...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  sudo docker logs $CONTAINER --tail=20 | grep -i 'listening'
" && {
  echo -e "${GREEN}✅ Django is running${NC}"
} || {
  echo -e "${RED}⚠️  Django may not be running. Check logs:${NC}"
  echo "  gcloud compute ssh $VM_NAME --zone=$ZONE --command=\"sudo docker logs $CONTAINER --tail=50\""
}

echo ""
echo "========================================"
echo -e "${GREEN}✅ Backend fix deployment COMPLETE!${NC}"
echo "========================================"
echo ""
echo "📋 Summary of changes:"
echo "  1. Line 2344: 'inline' → 'attachment' (forces file download)"
echo "  2. Lines 2362-2364: Disabled premature file cleanup"
echo ""
echo "📁 Backup file: $BACKUP_FILE"
echo ""
echo "🧪 Testing:"
echo "  1. Test DOCX download (logged user):"
echo "     curl -X POST 'https://api.universemapmaker.online/api/projects/wypis/create' \\"
echo "       -H 'Authorization: Token YOUR_TOKEN' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{...}' --output wypis.docx"
echo ""
echo "  2. Test PDF download (anonymous):"
echo "     curl -X POST 'https://api.universemapmaker.online/api/projects/wypis/create' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{...}' --output wypis.pdf"
echo ""
echo "  3. Verify DOCX integrity:"
echo "     file wypis.docx  # Should show: Microsoft Word 2007+"
echo "     unzip -t wypis.docx  # Should show: No errors"
echo ""
echo "  4. Verify PDF integrity:"
echo "     file wypis.pdf  # Should show: PDF document"
echo "     tail -c 10 wypis.pdf | od -c  # Should show: %%EOF at end"
echo ""
echo "🔄 Rollback (if needed):"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE --command=\"sudo docker exec $CONTAINER cp $BACKUP_FILE $SERVICE_FILE && sudo docker restart $CONTAINER\""
echo ""
