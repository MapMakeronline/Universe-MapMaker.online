# Mapbox Token Configuration for Cloud Run Deployment

## 🚨 Problem Overview

When deploying to Google Cloud Run, Mapbox tokens often get blocked due to:
- Missing URL restrictions configuration
- Incorrect token scopes
- Environment variable issues
- Dynamic Cloud Run URLs (*.run.app)

## ✅ Complete Setup Checklist

### 1. Mapbox Console Configuration

#### Create/Configure Token
1. Go to [Mapbox Access Tokens](https://account.mapbox.com/access-tokens/)
2. Create a **PUBLIC** token (starts with `pk.`)
3. Give it a descriptive name: `universe-mapmaker-production`

#### Configure Token Scopes (MINIMAL)
Select ONLY these scopes:
- ✅ `styles:read` - Required for map styles
- ✅ `fonts:read` - Required for map labels
- ✅ `datasets:read` - For custom datasets
- ✅ `vision:read` - Only if using 3D features
- ❌ Avoid write scopes for security

#### Configure URL Restrictions (CRITICAL)
Add these URL patterns to allow Cloud Run access:

```
https://*.run.app/*
https://universe-mapmaker-*.europe-central2.run.app/*
https://universe-mapmaker-576538488457.europe-central2.run.app/*
http://localhost:3000/*
http://localhost:3001/*
```

### 2. Local Development Setup

Create/update `.env.local`:

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ

# Legacy support (optional)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ
```

### 3. Cloud Run Deployment

#### Set Environment Variable via gcloud CLI

```bash
gcloud run services update universe-mapmaker \
  --update-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ \
  --region europe-central2
```

#### Alternative: Update via Console
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select `universe-mapmaker` service
3. Click "EDIT & DEPLOY NEW REVISION"
4. Go to "Variables & Secrets" tab
5. Add environment variable:
   - Name: `NEXT_PUBLIC_MAPBOX_TOKEN`
   - Value: Your token

#### Update cloudbuild.yaml

Ensure your `cloudbuild.yaml` includes the token:

```yaml
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: 'gcloud'
  args: [
    'run', 'deploy', 'universe-mapmaker',
    '--image', 'gcr.io/$PROJECT_ID/universe-mapmaker',
    '--region', 'europe-central2',
    '--platform', 'managed',
    '--allow-unauthenticated',
    '--set-env-vars', 'NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN_HERE',
    '--min-instances', '0',
    '--max-instances', '10'
  ]
```

### 4. Code Implementation

#### Token Validation (Already Implemented)

File: `src/utils/mapbox-token-validator.ts`
- Enhanced validation with Cloud Run detection
- Environment-specific warnings
- Safe token logging (no exposure)

#### Configuration (Already Implemented)

File: `src/config/mapbox.ts`
- Centralized token management
- Validation on load
- Error handling

#### Error Handling (Already Implemented)

File: `src/components/map/MapLoader.tsx`
- User-friendly error messages
- Setup instructions
- Token validation before map load

### 5. Verification Steps

#### Local Testing
```bash
npm run dev
# Check console for: "[MAP] Token validation: { hasToken: true, ... }"
```

#### Production Testing
After deployment, check:
1. Open browser developer console
2. Navigate to your Cloud Run URL
3. Look for token validation logs
4. Verify map loads without errors

### 6. Troubleshooting

#### Token Blocked on Cloud Run
✅ **Solution**: Check URL restrictions in Mapbox console

#### "Invalid token" error
✅ **Solution**: Verify token starts with `pk.` and is complete

#### Map not loading
✅ **Solution**: Check browser console for specific errors

#### Environment variable not set
✅ **Solution**: Redeploy with proper `--set-env-vars` flag

### 7. Security Best Practices

1. **Never commit tokens to Git**
   - Add `.env.local` to `.gitignore`
   - Use environment variables in Cloud Run

2. **Use minimal scopes**
   - Only read permissions
   - No write access for public tokens

3. **Restrict token URLs**
   - Specific to your domains
   - Include development URLs separately

4. **Monitor usage**
   - Check Mapbox dashboard regularly
   - Set up usage alerts

### 8. Files Modified

| File | Purpose |
|------|---------|
| `.env.local` | Local token configuration |
| `src/utils/mapbox-token-validator.ts` | Enhanced validation logic |
| `src/config/mapbox.ts` | Central configuration |
| `src/components/map/MapLoader.tsx` | Error handling UI |
| `cloudbuild.yaml` | Cloud Build configuration |

### 9. Quick Commands Reference

```bash
# Deploy with token
gcloud run deploy universe-mapmaker \
  --source . \
  --region europe-central2 \
  --set-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN

# Update existing service
gcloud run services update universe-mapmaker \
  --update-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN \
  --region europe-central2

# Check current configuration
gcloud run services describe universe-mapmaker \
  --region europe-central2 \
  --format "value(spec.template.spec.containers[0].env[?(@.name=='NEXT_PUBLIC_MAPBOX_TOKEN')].value)"

# View logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=universe-mapmaker" \
  --limit 50 \
  --format json
```

### 10. Contact & Support

- **Mapbox Support**: https://support.mapbox.com
- **Cloud Run Issues**: Check Cloud Console Logs
- **Token Issues**: Verify in Mapbox Account Dashboard

---

## Current Token Status

✅ Token configured: `pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ`

⚠️ **ACTION REQUIRED**:
1. Login to [Mapbox Console](https://account.mapbox.com)
2. Find this token in your tokens list
3. Add URL restrictions listed above
4. Deploy to Cloud Run with environment variable