# CORS Configuration Guide

## Problem

Gdy frontend jest dostępny przez różne domeny (localhost, ngrok, Cloudflare Tunnel), backend Django musi akceptować requesty z tych origin.

## Aktualnie Dozwolone Originy (Backend Django)

Sprawdź w `geocraft/settings.py` na VM:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://universemapmaker.online",
    # Tutaj musimy dodać ngrok i Cloudflare Tunnel
]
```

## ✅ Kompletna Konfiguracja CORS (Zalecana)

### Backend Django (`geocraft/settings.py`)

```python
# CORS Configuration - Allow frontend from multiple sources
CORS_ALLOWED_ORIGINS = [
    # Production
    "https://universemapmaker.online",
    "https://www.universemapmaker.online",

    # Development - Localhost
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.108:3000",  # Network IP (zmień na swój)

    # Development - Cloudflare Tunnel (STAŁA DOMENA!)
    "https://dev.universemapmaker.online",

    # Development - Ngrok (ZMIENIA SIĘ przy każdym restarcie!)
    # "https://wailful-symmetric-tamera.ngrok-free.dev",  # Aktualizuj przy nowym tunelu
]

# CORS Headers - Allow credentials and common headers
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CORS Methods - Allow all REST methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# CSRF Trusted Origins - For Django CSRF protection
CSRF_TRUSTED_ORIGINS = [
    "https://universemapmaker.online",
    "https://www.universemapmaker.online",
    "https://dev.universemapmaker.online",
]
```

## 🔧 Jak Zaktualizować Backend (Krok po Kroku)

### 1. SSH do VM

```bash
gcloud compute ssh universe-backend --zone=europe-central2-a
```

### 2. Edytuj settings.py

```bash
# Find Django container
docker ps | grep django

# Edit settings.py
docker exec -it <django_container_id> bash
nano /app/geocraft/settings.py
```

### 3. Dodaj/Zaktualizuj CORS_ALLOWED_ORIGINS

Znajdź linię z `CORS_ALLOWED_ORIGINS` i zamień na powyższą konfigurację.

### 4. Restart Django

```bash
# Exit container
exit

# Restart Django container
docker restart <django_container_id>

# Verify it's running
docker logs <django_container_id> --tail=50
```

## 🧪 Testowanie CORS

### Test 1: Sprawdź CORS headers

```bash
curl -I -X OPTIONS \
  -H "Origin: https://dev.universemapmaker.online" \
  -H "Access-Control-Request-Method: GET" \
  https://api.universemapmaker.online/api/projects/

# Powinieneś zobaczyć:
# Access-Control-Allow-Origin: https://dev.universemapmaker.online
# Access-Control-Allow-Credentials: true
```

### Test 2: Frontend Request

Otwórz `https://dev.universemapmaker.online` w przeglądarce i sprawdź Console:
- ✅ Brak błędów CORS
- ✅ API requests działają (Status 200)
- ❌ CORS error → Backend nie ma dodanej domeny w CORS_ALLOWED_ORIGINS

## 🌐 Frontend Configuration (.env.local)

Upewnij się, że frontend używa właściwego API URL:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.universemapmaker.online
```

**NIE ZMIENIAJ** tego URL gdy używasz ngrok/Cloudflare Tunnel!
- Frontend domain: `dev.universemapmaker.online` (zmienia się)
- Backend API: `https://api.universemapmaker.online` (ZAWSZE to samo)

## 📝 Maintenance Notes

### Kiedy Aktualizować CORS_ALLOWED_ORIGINS?

**TAK - Dodaj nową domenę:**
- ✅ Nowa Cloudflare Tunnel subdomena (np. `staging.universemapmaker.online`)
- ✅ Nowa production domain
- ✅ Nowe środowisko testowe

**NIE - Nie dodawaj:**
- ❌ Ngrok URL (zmienia się przy każdym restarcie) - użyj Cloudflare Tunnel zamiast tego!
- ❌ `*` (wildcard) - zagrożenie bezpieczeństwa
- ❌ Losowe IP addresses

### Dlaczego Cloudflare Tunnel > Ngrok?

| Feature | Cloudflare Tunnel | Ngrok Free |
|---------|-------------------|------------|
| Stała domena | ✅ `dev.universemapmaker.online` | ❌ Losowa przy restarcie |
| CORS setup | ✅ Dodaj raz | ❌ Aktualizuj co restart |
| Własna domena | ✅ Tak | ❌ Tylko paid plan |
| Koszt | ✅ Darmowe | ❌ $8/month dla stałej |

## 🚨 Troubleshooting

### Błąd: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Powód:** Backend nie ma frontendowej domeny w `CORS_ALLOWED_ORIGINS`

**Fix:**
1. SSH do VM
2. Dodaj domenę do `CORS_ALLOWED_ORIGINS` w `settings.py`
3. Restart Django: `docker restart <container_id>`

### Błąd: "CSRF verification failed"

**Powód:** Domena nie jest w `CSRF_TRUSTED_ORIGINS`

**Fix:**
```python
# settings.py
CSRF_TRUSTED_ORIGINS = [
    "https://dev.universemapmaker.online",
]
```

### Błąd: "Mixed content" (HTTP/HTTPS)

**Powód:** Frontend używa HTTPS, ale backend HTTP

**Fix:**
- Zawsze używaj HTTPS dla API: `https://api.universemapmaker.online`
- Cloudflare Tunnel automatycznie używa HTTPS ✅

## 📊 Current Status

**Frontend Domains:**
- Production: `https://universemapmaker.online` ✅
- Development (local): `http://localhost:3000` ✅
- Development (tunnel): `https://dev.universemapmaker.online` ⏳ (setup in progress)

**Backend API:**
- Endpoint: `https://api.universemapmaker.online` ✅
- CORS: ⏳ Needs update for dev.universemapmaker.online

**Next Steps:**
1. Finish Cloudflare Tunnel setup
2. Update backend CORS_ALLOWED_ORIGINS
3. Test API requests from `dev.universemapmaker.online`

---

**Last Updated:** 2025-10-26
**Maintained by:** Development Team
