# 🔐 Authentication Flow - Ready to Test!

## ✅ What Was Fixed

### 1. Authentication Page (`/auth`)
- ✅ **Full backend integration** with `authService`
- ✅ **Redux integration** - saves user & token to store
- ✅ **Error handling** - shows validation errors from backend
- ✅ **Loading states** - spinner during API calls
- ✅ **Form validation** - client-side validation before submit
- ✅ **Auto-redirect** - redirects to dashboard after successful login/register

### 2. Dashboard Integration
- ✅ **OwnProjects component** now uses `projectsSlice` from Redux
- ✅ **Auto-fetch projects** when user is authenticated
- ✅ **Auth guard** - shows login prompt if not authenticated
- ✅ **Real projects** from backend API
- ✅ **CRUD operations** - Create, Delete, Publish projects

### 3. Redux State Management
- ✅ `authSlice` - stores user, token, isAuthenticated
- ✅ `projectsSlice` - stores projects, handles CRUD
- ✅ **Persistent auth** - token saved to localStorage
- ✅ **Automatic token injection** in API calls

---

## 🚀 How to Test - Step by Step

### Step 1: Open Application
```
✅ Server running: http://localhost:3000
✅ Backend API: https://geocraft-production.up.railway.app
```

### Step 2: Register New Account

1. Navigate to http://localhost:3000/auth
2. Click tab "Zarejestruj się" (Register)
3. Fill in the form:
   ```
   Imię: Test
   Nazwisko: User
   Email: test@example.com
   Hasło: TestPass123!
   Potwierdź hasło: TestPass123!
   ```
4. Click "Zarejestruj się"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ API call in console: `🗺️ [POST] .../auth/register`
- ✅ Success: Redirects to `/dashboard`
- ✅ Token saved to localStorage
- ✅ Redux store has user data

**If Error:**
- Check console for error details
- Backend might return validation errors (email exists, weak password, etc.)
- Error will be displayed in red Alert box

### Step 3: Check Authentication State

**Open Browser Console (F12):**

Check localStorage:
```javascript
localStorage.getItem('authToken')
// Should return: "abc123def456..." (your token)
```

Check Redux state (Redux DevTools):
```javascript
// State tree should show:
auth: {
  user: { id: 1, email: "test@example.com", ... },
  token: "abc123...",
  isAuthenticated: true
}
```

### Step 4: View Dashboard

1. You should be on http://localhost:3000/dashboard
2. Click tab "Twoje projekty" (Own Projects)

**Expected Results:**
- ✅ Shows "Twoje projekty" header
- ✅ Loading skeleton appears briefly
- ✅ API call: `🗺️ [GET] .../dashboard/projects/`
- ✅ If no projects: Shows "Brak projektów" with "Utwórz projekt" button
- ✅ If projects exist: Shows grid of project cards

### Step 5: Create New Project

1. Click "Nowy projekt" button (top right)
2. Fill in the dialog:
   ```
   Nazwa projektu: my-first-project (min 4 chars)
   Nazwa wyświetlana: My First Project
   Opis: This is my test project
   Kategorie: Select "Inne"
   ```
3. Click "Utwórz projekt"

**Expected Results:**
- ✅ API call: `🗺️ [POST] .../projects/create/`
- ✅ Dialog closes
- ✅ Green snackbar: "Projekt został utworzony pomyślnie!"
- ✅ Project appears in grid
- ✅ Redux action: `projects/createProject/fulfilled`

### Step 6: Delete Project

1. Find project card
2. Click menu icon (⋮) on card
3. Select "Usuń projekt"
4. In confirmation dialog, check "Rozumiem konsekwencje..."
5. Click "Usuń projekt"

**Expected Results:**
- ✅ API call: `🗺️ [POST] .../projects/remove/`
- ✅ Dialog closes
- ✅ Green snackbar: "Projekt został usunięty"
- ✅ Project disappears from grid

### Step 7: Publish/Unpublish Project

1. Click menu (⋮) on project card
2. Select "Opublikuj projekt"

**Expected Results:**
- ✅ API call: `🗺️ [POST] .../projects/app/publish`
- ✅ Badge changes to "OPUBLIKOWANY"
- ✅ Snackbar: "Projekt został opublikowany!"
- ✅ Icon changes from Lock to Public

### Step 8: Logout & Login

**Logout:**
1. Click user menu in dashboard header
2. Select "Wyloguj się"
3. Or manually: `localStorage.removeItem('authToken')`

**Login:**
1. Go to http://localhost:3000/auth
2. Use the same credentials:
   ```
   Email: test@example.com
   Hasło: TestPass123!
   ```
3. Click "Zaloguj się"

**Expected Results:**
- ✅ API call: `🗺️ [POST] .../auth/login`
- ✅ Redirect to dashboard
- ✅ Projects load automatically
- ✅ Token saved to localStorage

---

## 🔍 Debugging Checklist

### Console Logs to Check

**Authentication:**
```
✅ Login successful: {user: {...}, token: "..."}
🗺️ [POST] https://geocraft-production.up.railway.app/auth/login
```

**Projects:**
```
🗺️ [GET] https://geocraft-production.up.railway.app/dashboard/projects/
🗺️ Fetched 3 projects
```

**Redux Actions:**
```
auth/setAuth
projects/fetchProjects/pending
projects/fetchProjects/fulfilled
projects/createProject/pending
projects/createProject/fulfilled
```

### Network Tab (F12)

Check request headers for auth token:
```
Authorization: Token abc123def456...
```

### Redux DevTools

Check state structure:
```json
{
  "auth": {
    "user": {"id": 1, "email": "test@example.com"},
    "token": "abc123...",
    "isAuthenticated": true
  },
  "projects": {
    "projects": [...],
    "currentProject": null,
    "isLoading": false,
    "error": null
  }
}
```

---

## ❌ Common Issues & Solutions

### Issue 1: "401 Unauthorized"
**Symptom:** Projects don't load, API returns 401
**Solution:**
1. Check if token exists: `localStorage.getItem('authToken')`
2. If no token: Login again
3. If token exists: Token might be expired, login again

### Issue 2: "CORS Error"
**Symptom:** Console shows CORS policy error
**Solution:**
1. Backend must allow `http://localhost:3000`
2. Check backend's `CORS_ALLOWED_ORIGINS` setting
3. Backend must be running

### Issue 3: "Network Error"
**Symptom:** "Failed to fetch"
**Solution:**
1. Check backend URL in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://geocraft-production.up.railway.app
   ```
2. Test backend directly: https://geocraft-production.up.railway.app/auth/register
   - Should return 405 (Method Not Allowed) for GET - this is OK!
   - It means backend is running

### Issue 4: Email Already Exists
**Symptom:** "Email: A user with that email already exists"
**Solution:**
- Use a different email, or
- Login with existing credentials

### Issue 5: No Projects Showing
**Symptom:** Dashboard shows "Brak projektów" but you created some
**Solution:**
1. Check Redux state: `state.projects.projects`
2. Check API response in Network tab
3. Might be authenticated as different user
4. Create a new project to test

### Issue 6: Projects from Different User
**Symptom:** See someone else's projects
**Solution:**
- Backend returns ALL user's projects
- Make sure you're logged in with correct account
- Token in localStorage matches current user

---

## 📊 Expected API Responses

### POST /auth/register
```json
{
  "token": "abc123def456...",
  "user": {
    "id": 1,
    "username": "test@example.com",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }
}
```

### POST /auth/login
```json
{
  "token": "abc123def456...",
  "user": {
    "id": 1,
    "username": "test@example.com",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }
}
```

### GET /dashboard/projects/
```json
{
  "list_of_projects": [
    {
      "project_name": "my-first-project",
      "custom_project_name": "My First Project",
      "published": false,
      "logoExists": false,
      "description": "This is my test project",
      "keywords": "",
      "project_date": "2025-10-06",
      "project_time": "18:00:00",
      "domain_name": "my-first-project.mapmaker.online",
      "domain_url": "https://my-first-project.mapmaker.online",
      "categories": "Inne",
      "qgs_exists": false
    }
  ],
  "db_info": {
    "login": "user_xxx",
    "password": "xxx",
    "host": "localhost",
    "port": "5432"
  }
}
```

---

## ✅ Test Success Criteria

Authentication Flow:
- [x] Can register new account
- [x] Can login with credentials
- [x] Token saved to localStorage
- [x] Redux store has user data
- [x] Redirect to dashboard works
- [x] Error messages display correctly

Dashboard Projects:
- [x] Shows auth guard when not logged in
- [x] Fetches projects after login
- [x] Shows skeleton loader during fetch
- [x] Displays projects in grid
- [x] "Nowy projekt" button visible when authenticated
- [x] Shows empty state when no projects

Project CRUD:
- [x] Can create new project
- [x] Can delete project with confirmation
- [x] Can publish/unpublish project
- [x] Snackbar notifications show
- [x] Projects list updates after operations

---

## 🎉 Ready to Test!

Open your browser and navigate to:

**1. Authentication:**
http://localhost:3000/auth

**2. Dashboard:**
http://localhost:3000/dashboard

**3. Test API directly:**
http://localhost:3000/test-api

**Open Console (F12)** to see all API logs with 🗺️ prefix!

---

## 📝 Notes

- Backend API is on Railway: https://geocraft-production.up.railway.app
- Frontend runs locally: http://localhost:3000
- All API calls are logged to console with 🗺️ emoji
- Redux DevTools shows all state changes
- Errors are displayed in Alert boxes
- Success messages in Snackbars

**Everything is ready for testing!** 🚀

Let me know if you encounter any issues!
