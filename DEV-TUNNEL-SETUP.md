# Dev Tunnel Setup - dev.universemapmaker.online

## Overview

**Public URL:** http://dev.universemapmaker.online
**Localhost:** http://localhost:3000
**Method:** SSH Reverse Tunnel via GCP VM

This setup allows you to expose your local development server (`localhost:3000`) through a permanent subdomain `dev.universemapmaker.online`, enabling:
- External testing (mobile devices, other computers)
- Claude Code to test changes independently
- Client previews without deploying to production

## Architecture

```
Your Computer                GCP VM (universe-backend)           Internet
┌──────────────┐            ┌────────────────────────┐         ┌─────────┐
│              │            │                        │         │         │
│ localhost:   │  SSH       │  Nginx                 │  HTTP   │ Browser │
│ 3000         ├───Tunnel───┤  Reverse Proxy         ├─────────┤         │
│ (Next.js)    │   (-R)     │  Port 80               │         │         │
│              │            │  → localhost:3000      │         │         │
└──────────────┘            └────────────────────────┘         └─────────┘
                                     ▲
                                     │
                            dev.universemapmaker.online
                            DNS A → 34.0.251.33
```

## Components

### 1. **Cloud DNS Record**
```bash
dev.universemapmaker.online. A 300 34.0.251.33
```
- Zone: `universe-mapmaker-zone`
- TTL: 300 seconds (5 minutes)
- Points to: VM External IP

### 2. **Nginx Reverse Proxy** (on VM)
```nginx
# /etc/nginx/sites-available/dev-proxy
server {
    listen 80;
    server_name dev.universemapmaker.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support for Next.js HMR
        proxy_read_timeout 86400;
    }
}
```

### 3. **SSH Reverse Tunnel**
```bash
gcloud compute ssh universe-backend \
  --zone=europe-central2-a \
  -- -R 3000:localhost:3000 -N
```

**What this does:**
- `-R 3000:localhost:3000` - Reverse tunnel: VM port 3000 ← Your localhost:3000
- `-N` - No command execution (just tunnel)
- Runs in background continuously

### 4. **CORS Configuration** (Django backend)
```python
# /app/geocraft/settings.py
CORS_ALLOWED_ORIGINS = [
    # ... other origins ...
    "http://dev.universemapmaker.online",
]
```

### 5. **Next.js Configuration**
```javascript
// next.config.mjs
experimental: {
  allowedDevOrigins: [
    'dev.universemapmaker.online',
  ],
}
```

## Usage

### Start Development Tunnel

**Terminal 1: Start Next.js Dev Server**
```bash
npm run dev
# Server starts on http://localhost:3000
```

**Terminal 2: Start SSH Tunnel**
```bash
gcloud compute ssh universe-backend \
  --zone=europe-central2-a \
  -- -R 3000:localhost:3000 -N

# Keep this terminal open! Tunnel runs in background.
# Press Ctrl+C to stop tunnel.
```

**Terminal 3: (Optional) Monitor Nginx Logs**
```bash
gcloud compute ssh universe-backend --zone=europe-central2-a
sudo tail -f /var/log/nginx/dev-proxy-access.log
```

### Access Your Dev Server

**Public URL:**
```
http://dev.universemapmaker.online
http://dev.universemapmaker.online/dashboard
http://dev.universemapmaker.online/map?project=testshp
```

**Local URL (still works):**
```
http://localhost:3000
```

## Testing

### Quick Health Check
```bash
# Test public URL
curl -I http://dev.universemapmaker.online

# Expected: HTTP/1.1 200 OK
# Server: nginx/1.24.0 (Ubuntu)
# X-Powered-By: Next.js
```

### Test API CORS
```bash
curl -I -X OPTIONS \
  -H "Origin: http://dev.universemapmaker.online" \
  -H "Access-Control-Request-Method: GET" \
  https://api.universemapmaker.online/api/projects/

# Expected:
# Access-Control-Allow-Origin: http://dev.universemapmaker.online
# Access-Control-Allow-Credentials: true
```

### Browser Testing
1. Open: http://dev.universemapmaker.online/dashboard
2. Open DevTools (F12) → Console
3. Check for errors:
   - ✅ No CORS errors
   - ✅ API requests work (Status 200 or 401 if not logged in)
   - ✅ Hot reload works (change code, page updates)

## Troubleshooting

### Issue: "Connection Refused"

**Symptom:** `curl: (7) Failed to connect`

**Possible Causes:**
1. SSH tunnel not running
2. Next.js dev server not running
3. Nginx not running on VM

**Fix:**
```bash
# 1. Check tunnel
# Look for open SSH connection in Task Manager or:
gcloud compute ssh universe-backend --zone=europe-central2-a --command="netstat -tuln | grep :3000"
# Expected: tcp 0 0 127.0.0.1:3000 0.0.0.0:* LISTEN

# 2. Check Next.js
# Terminal 1 should show: ▲ Next.js 15.5.4 - Local: http://localhost:3000

# 3. Check Nginx
gcloud compute ssh universe-backend --zone=europe-central2-a --command="sudo systemctl status nginx"
# Expected: Active: active (running)
```

### Issue: "502 Bad Gateway"

**Symptom:** Nginx error page

**Cause:** Tunnel is connected but Next.js is not running on your computer

**Fix:**
```bash
# Start dev server
npm run dev
```

### Issue: CORS Errors in Browser

**Symptom:** Console shows: `Access to XMLHttpRequest at 'https://api...' from origin 'http://dev...' has been blocked by CORS policy`

**Cause:** Backend CORS not configured

**Fix:**
```bash
# 1. SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# 2. Check Django CORS config
sudo docker exec universe-mapmaker-backend_django_1 \
  grep -A 5 "dev.universemapmaker.online" /app/geocraft/settings.py

# Should show:
# "http://dev.universemapmaker.online",

# 3. If missing, add it:
sudo docker exec universe-mapmaker-backend_django_1 bash -c \
  'sed -i "/https:\/\/www.universemapmaker.online/a\    \\\"http://dev.universemapmaker.online\\\"," /app/geocraft/settings.py'

# 4. Restart Django
sudo docker restart universe-mapmaker-backend_django_1
```

### Issue: "Cross origin request detected" Warning

**Symptom:** Next.js logs show warning about cross-origin

**Cause:** `allowedDevOrigins` not configured

**Fix:**
```javascript
// next.config.mjs
experimental: {
  allowedDevOrigins: [
    'dev.universemapmaker.online',  // Add this
  ],
}

// Save and Next.js will auto-restart
```

### Issue: Hot Reload Not Working

**Symptom:** Code changes don't reflect in browser

**Cause:** WebSocket connection issues through tunnel

**Fix:**
1. Check nginx WebSocket config:
   ```bash
   gcloud compute ssh universe-backend --zone=europe-central2-a
   sudo cat /etc/nginx/sites-available/dev-proxy | grep -A 3 "proxy_read_timeout"
   ```

2. Hard refresh browser: `Ctrl+Shift+R`

3. Restart tunnel:
   ```bash
   # Terminal 2: Press Ctrl+C, then restart
   gcloud compute ssh universe-backend --zone=europe-central2-a -- -R 3000:localhost:3000 -N
   ```

## Stopping the Tunnel

**Graceful Stop:**
```bash
# Terminal 2: Press Ctrl+C
```

**Force Kill:**
```bash
# Windows
tasklist | findstr "gcloud.exe"
taskkill /F /PID <PID>

# Linux/Mac
ps aux | grep "gcloud.*ssh"
kill <PID>
```

## Maintenance

### Update DNS (if VM IP changes)
```bash
# Delete old record
gcloud dns record-sets delete dev.universemapmaker.online. \
  --zone=universe-mapmaker-zone \
  --type=A

# Add new record
gcloud dns record-sets create dev.universemapmaker.online. \
  --zone=universe-mapmaker-zone \
  --type=A \
  --ttl=300 \
  --rrdatas=<NEW_VM_IP>
```

### Update Nginx Config
```bash
# SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a

# Edit config
sudo nano /etc/nginx/sites-available/dev-proxy

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### View Logs
```bash
# Nginx access logs
gcloud compute ssh universe-backend --zone=europe-central2-a \
  --command="sudo tail -f /var/log/nginx/dev-proxy-access.log"

# Nginx error logs
gcloud compute ssh universe-backend --zone=europe-central2-a \
  --command="sudo tail -f /var/log/nginx/dev-proxy-error.log"
```

## Security Notes

- ⚠️ **HTTP Only** - Currently no HTTPS/SSL (would require Let's Encrypt cert)
- ⚠️ **No Authentication** - Anyone with URL can access your dev server
- ✅ **Temporary** - Only active when tunnel is running
- ✅ **Firewall** - VM has Google Cloud Firewall protecting it

**For sensitive work:**
1. Stop tunnel when not needed: `Ctrl+C` in Terminal 2
2. Use localhost instead: `http://localhost:3000`
3. Or add basic auth to Nginx if needed

## Benefits

✅ **Permanent Subdomain** - No need to update URLs when restarting
✅ **Zero Cost** - Uses existing GCP VM, no extra services
✅ **Fast Setup** - One command to start tunnel
✅ **Hot Reload** - Code changes reflect immediately
✅ **No External Dependencies** - No ngrok/Cloudflare accounts needed
✅ **Full GCP Integration** - Uses existing infrastructure
✅ **Claude Code Testable** - I can access and test your local changes!

## Alternative: Local Testing Only

If you don't need external access:
```bash
# Just run dev server
npm run dev

# Access locally
http://localhost:3000
```

---

**Last Updated:** 2025-10-26
**Status:** ✅ Active and Working
**Maintained by:** Development Team
