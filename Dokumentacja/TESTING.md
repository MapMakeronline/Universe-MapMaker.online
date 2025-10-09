# Testing Guide - Universe MapMaker

## 🧪 Test Suite Overview

This project includes comprehensive testing infrastructure for backend integration and API functionality.

---

## 📋 Available Tests

### 1. Basic API Integration Tests (`test-login.js`)

**Purpose:** Verify backend availability and API contract without authentication.

**Run:**
```bash
node test-login.js
```

**Test Cases:**
1. ✅ **Backend Availability** - Checks if backend responds to OPTIONS request
2. ✅ **Invalid Credentials Validation** - Verifies error handling for bad login
3. ✅ **Response Structure** - Validates error response format
4. ✅ **CORS Headers** - Checks Cross-Origin Resource Sharing configuration
5. ✅ **Protected Endpoints** - Ensures auth is required for private routes

**Expected Output:**
```
🧪 Test integracji Frontend-Backend
=====================================

📡 Test 1: Dostępność backendu
   ✅ Status: 200
   ✅ Backend odpowiada

🔐 Test 2: Logowanie z błędnymi danymi
   ✅ Status: 400 (oczekiwany błąd)
   ✅ Walidacja działa poprawnie

...

📊 PODSUMOWANIE TESTÓW
✅ Udane: 4/5
```

---

### 2. Full Login Flow Tests (`test-login-full.js`)

**Purpose:** Test complete authentication flow with real credentials.

**Run:**
```bash
node test-login-full.js <username> <password>
```

**Example:**
```bash
node test-login-full.js admin@example.com SecurePass123
```

**Test Flow:**
1. ✅ **Login** - POST `/auth/login` with credentials
2. ✅ **Token Validation** - Verify token is returned
3. ✅ **Profile Fetch** - GET `/dashboard/profile/` with token
4. ✅ **Projects Fetch** - GET `/dashboard/projects/` with token
5. ✅ **Logout** - POST `/auth/logout` to invalidate token

**Expected Output:**
```
🧪 Test pełnego flow logowania
======================================

📧 Username: admin@example.com
🔑 Password: ********

📝 Krok 1: Wysyłanie żądania logowania...
   ✅ Logowanie udane!
   Token: abc123def456...
   User ID: 1
   Email: admin@example.com

📝 Krok 2: Testowanie tokena - pobieranie profilu...
   ✅ Profil pobrany!

📝 Krok 3: Pobieranie listy projektów...
   ✅ Projekty pobrane!
   Liczba projektów: 5

📝 Krok 4: Testowanie wylogowania...
   ✅ Wylogowanie udane!

✅ PEŁNY FLOW LOGOWANIA DZIAŁA POPRAWNIE!
```

---

## 🌐 Production Testing

### Testing Live Environment

**Backend:**
```bash
# Test API availability
curl -I https://api.universemapmaker.online/auth/login

# Expected: HTTP/1.1 405 Method Not Allowed (OPTIONS not allowed, but endpoint exists)
```

**Frontend:**
```bash
# Test frontend availability
curl -I https://universemapmaker.online

# Expected: HTTP/1.1 200 OK
```

### Browser Testing

1. **Open DevTools** (F12)
2. **Navigate to Network tab**
3. **Filter by "Fetch/XHR"**
4. **Perform actions:**
   - Login at `/login` or `/auth`
   - View projects at `/dashboard`
   - Create/edit/delete projects

**Expected Network Calls:**
- `POST https://api.universemapmaker.online/auth/login`
- `GET https://api.universemapmaker.online/dashboard/profile/`
- `GET https://api.universemapmaker.online/dashboard/projects/`

---

## 🔍 Common Test Scenarios

### 1. Registration Flow

**Manual Test:**
1. Navigate to `/register`
2. Fill in form with valid data
3. Submit registration
4. Verify redirect to `/dashboard`
5. Check localStorage for `authToken`

**Expected API Calls:**
```
POST /auth/register
POST /auth/login (auto-login after registration)
GET /dashboard/profile/
GET /dashboard/projects/
```

### 2. Protected Routes

**Test Authentication Guard:**
1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/dashboard`
3. Should redirect to `/login` or `/auth`

### 3. Token Expiration

**Simulate Expired Token:**
```javascript
// In browser console
localStorage.setItem('authToken', 'invalid-token-12345');
// Reload page or make API call
// Should receive 401 Unauthorized
```

---

## 🐛 Debugging Tests

### Enable Detailed Logging

**Browser Console:**
```javascript
// Enable API client logs
localStorage.setItem('DEBUG', 'api:*');
```

**Check Redux State:**
```javascript
// In browser console (if Redux DevTools not available)
window.__REDUX_DEVTOOLS_EXTENSION__?.open();
```

### Network Inspection

**Check Request Headers:**
```bash
# Using curl
curl -v -X POST https://api.universemapmaker.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**Expected Headers:**
```
Content-Type: application/json
Authorization: Token abc123def456... (for authenticated requests)
```

---

## 📊 Test Results Interpretation

### Success Indicators

✅ **Status 200/201** - Request successful
✅ **Status 204** - Successful with no content (e.g., logout)
✅ **Token received** - Contains alphanumeric string
✅ **User data returned** - Object with id, email, first_name, etc.

### Expected Errors

⚠️ **Status 400** - Validation error (check error.field for details)
⚠️ **Status 401** - Authentication required or invalid token
⚠️ **Status 403** - Forbidden (valid token but insufficient permissions)
⚠️ **Status 404** - Resource not found
⚠️ **Status 500** - Server error (check backend logs)

### Error Response Format

**Validation Error (400):**
```json
{
  "username": ["This field may not be blank."],
  "password": ["This field may not be blank."]
}
```

**Authentication Error (401):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Login Error:**
```json
{
  "non_field_errors": ["Nieprawidłowe dane logowania"]
}
```

---

## 🔐 Test User Credentials

### Creating Test Users

**Via Registration Page:**
1. Go to `/register`
2. Create account with:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - First Name: `Test`
   - Last Name: `User`

**Via Django Admin:**
```bash
# On backend server
python manage.py createsuperuser
```

---

## 📈 Continuous Integration

### Pre-commit Tests

**Recommended workflow:**
```bash
# Before committing
npm run lint
node test-login.js

# If all pass
git add .
git commit -m "..."
```

### CI/CD Pipeline (Future)

**Suggested GitHub Actions:**
```yaml
# .github/workflows/test.yml
name: API Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: node test-login.js
```

---

## 🎯 Test Coverage

### Current Coverage

- ✅ Authentication (login, register, logout)
- ✅ Profile fetching
- ✅ Projects listing
- ✅ Token validation
- ✅ Error handling

### Planned Coverage

- ⏳ Project CRUD operations
- ⏳ Layer management
- ⏳ File uploads (GeoJSON, Shapefile)
- ⏳ Map state persistence
- ⏳ Collaborative features

---

## 📚 Additional Resources

- **Backend API Docs:** `Universe-Mapmaker-Backend/README.md`
- **Frontend Architecture:** `CLAUDE.md`
- **Integration Guide:** `BACKEND-INTEGRATION.md`
- **API Endpoints Reference:** See BACKEND-INTEGRATION.md

---

## 🆘 Troubleshooting

### Tests Failing?

**1. Backend not running:**
```bash
# Check backend status
curl -I https://api.universemapmaker.online/auth/login

# Should return HTTP status (not connection error)
```

**2. Wrong API URL:**
```bash
# Check .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL

# Should be: https://api.universemapmaker.online
```

**3. CORS errors:**
- Verify origin is in backend CORS_ALLOWED_ORIGINS
- Check browser console for specific CORS error

**4. Token issues:**
```javascript
// Clear token
localStorage.removeItem('authToken');
// Login again
```

---

## ✅ Test Checklist

Before releasing to production:

- [ ] Basic API tests pass (test-login.js)
- [ ] Full login flow works (test-login-full.js)
- [ ] Registration creates new user
- [ ] Protected routes require authentication
- [ ] Logout invalidates token
- [ ] Error messages are user-friendly
- [ ] HTTPS works on production
- [ ] CORS configured correctly
- [ ] Mobile responsive (test on real device)
- [ ] Performance acceptable (< 2s page load)

---

**Last Updated:** October 9, 2025
**API Version:** v1.0
**Backend:** https://api.universemapmaker.online
**Frontend:** https://universemapmaker.online
