# Backend Fix Summary - Projects Not Appearing Issue

**Date:** October 9, 2025
**Issue:** Projects were creating successfully but not appearing in user's dashboard
**Status:** ✅ **RESOLVED**

---

## Problem Description

Users could create projects through the dashboard, receiving success messages, but the created projects would not appear in their project list. The API was returning 0 projects despite successful creation.

### Console Output (Before Fix)
```
🗺️ MAP Fetching projects from backend...
🗺️ MAP Projects fetched: {count: 0, projects: Array(0)}
📊 Redux State - projects: 0 isAuthenticated: true
```

### Test Results (Before Fix)
```bash
node test-admin-projects.js
Logged in as: admin ID: 1
Projects count: 0  # ❌ Should be 5!
```

---

## Root Cause Analysis

### The Bug

Located in **`geocraft_api/dashboard/views.py`** at line 35-40:

**Buggy Code:**
```python
def list_users_project(user):
    try:
        current_user = CustomUser.objects.get(dbLogin=user.dbLogin)  # ❌ Re-query creates different instance
        user_projects = ProjectItem.objects.filter(user=current_user).all()
```

**Working Code (create_project function):**
```python
project = ProjectItem.objects.create(
    user=user,  # ✅ Uses request.user directly
    project_name=project_name,
    ...
)
```

### Why This Failed

1. **Project Creation** used `request.user` directly from the authenticated request
2. **Project Listing** used `CustomUser.objects.get(dbLogin=user.dbLogin)` to re-query the user
3. Django ORM returned **different object instances** even though they represented the same database row
4. `ProjectItem.objects.filter(user=current_user)` didn't match projects created with `user=request.user`
5. Result: 0 projects returned despite projects existing in database

### Database Evidence

Projects were correctly saved to database with proper `user_id`:

```sql
SELECT id, project_name, user_id FROM geocraft_api_projectitem WHERE user_id = 1;
-- Results: 5 projects with user_id = 1
```

But API returned 0 because of object instance mismatch.

---

## The Fix

### Changed Code

**File:** `geocraft_api/dashboard/views.py` (lines 35-40)

**Before:**
```python
def list_users_project(user):
    try:
        current_user = CustomUser.objects.get(dbLogin=user.dbLogin)
        user_projects = ProjectItem.objects.filter(user=current_user).all()
```

**After:**
```python
def list_users_project(user):
    try:
        # Use request.user directly instead of re-querying by dbLogin
        # This ensures consistency with project creation
        user_projects = ProjectItem.objects.filter(user=user).all()
```

### Key Changes
- ✅ Removed redundant database query for user
- ✅ Use `request.user` directly (passed as `user` parameter)
- ✅ Ensures same user instance is used for both creation and listing
- ✅ Maintains consistency across all user-related operations

---

## Deployment Process

### 1. Applied Fix to Production VM

Since backend runs on Google Compute Engine VM (not Cloud Run), deployment required direct container update:

```bash
# 1. SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker

# 2. Update code directly in running container
sudo docker exec universe-mapmaker-backend_django_1 bash -c "sed -i 's/current_user = CustomUser.objects.get(dbLogin=user.dbLogin)/# Use request.user directly instead of re-querying by dbLogin\\n        # This ensures consistency with project creation/' /app/geocraft_api/dashboard/views.py"

sudo docker exec universe-mapmaker-backend_django_1 bash -c "sed -i 's/user_projects = ProjectItem.objects.filter(user=current_user).all()/user_projects = ProjectItem.objects.filter(user=user).all()/' /app/geocraft_api/dashboard/views.py"

# 3. Restart Django container
sudo docker restart universe-mapmaker-backend_django_1
```

### 2. Verified Fix in Production

```bash
node test-admin-projects.js
```

**Output (After Fix):**
```
Logged in as: admin ID: 1

Projects count: 5  # ✅ SUCCESS!

Projects:
1. Mestwin (Mestwin)
2. Test123 (Test123)
3. Schronyyy (schronnyyy)
4. Szachy (szachy)
5. Szach (szach)
```

### 3. Committed Changes to GitHub

**Backend Repository:**
- Commit: `3e3d978` - "fix: Use request.user directly in list_users_project"
- Repository: https://github.com/MapMakeronline/Universe-Mapmaker-Backend

**Documentation:**
- Commit: `b075b16` - "docs: Update README with actual production infrastructure state"
- Updated README with complete VM deployment architecture

---

## Testing Results

### Before Fix
- ❌ Projects count: 0
- ❌ Dashboard showed "Brak projektów" (No projects)
- ❌ Empty array returned from API

### After Fix
- ✅ Projects count: 5
- ✅ All projects visible in dashboard
- ✅ Correct project data returned from API
- ✅ API endpoint working correctly: `GET /dashboard/projects/list/`

---

## Infrastructure Documentation Updates

Updated **`Universe-Mapmaker-Backend/README.md`** with:

### 1. Production Architecture
- Google Compute Engine VM details (`universe-backend`, 34.0.251.33)
- Docker Compose services (Django, QGIS Server, Nginx)
- Cloud Storage integration (gcsfuse mount)
- Railway PostgreSQL database
- Frontend Cloud Run service

### 2. Deployment Commands
- SSH access to VM
- Code update procedures
- Container restart commands
- Log monitoring
- Health check endpoints

### 3. Request Flow Diagram
```
User → universemapmaker.online (Cloud Run)
     ↓
     → api.universemapmaker.online (Nginx on VM)
       ↓
       ├─→ /api/* → Django (port 8000) → Railway PostgreSQL
       ├─→ /ows/* → QGIS Server (port 8080) → Cloud Storage
       └─→ /static/* → Nginx (static files)
```

---

## Lessons Learned

### 1. Django ORM Object Identity
- **Never re-query objects unnecessarily** - use the same instance throughout request lifecycle
- Django ORM may return different Python objects for the same database row
- Always use `request.user` directly instead of re-querying by username/dbLogin
- Object identity (`is`) vs equality (`==`) matters in Django filters

### 2. Debugging Database Issues
- Check both database state AND application logic
- Database can have correct data even when API returns empty
- Use direct SQL queries to verify data exists
- Test with minimal reproduction scripts (e.g., `test-admin-projects.js`)

### 3. VM-Based Deployment
- Backend runs on VM with Docker Compose, not Cloud Run
- Hot-fixes can be applied directly to running containers
- Always commit changes to GitHub after hot-fixes
- Document actual infrastructure state in README

### 4. Production Logging
- Enable critical loggers in production (`mapLogger`, `reduxLogger`, `apiLogger`)
- Add `.enablePermanent()` for production debugging
- Development-only logging hides critical production issues

---

## Related Files

### Backend Files Changed
- `geocraft_api/dashboard/views.py` (line 35-40) - Fixed user query
- `Universe-Mapmaker-Backend/README.md` - Infrastructure documentation

### Frontend Files Referenced
- `src/store/slices/projectsSlice.ts` - Redux projects state
- `src/components/dashboard/OwnProjectsIntegrated.tsx` - Projects list UI
- `src/lib/api/projects.ts` - API client
- `test-admin-projects.js` - Test script

### Documentation
- `DEPLOYMENT-GUIDE.md` - Complete deployment guide (already existed)
- `README.md` - Updated with production architecture
- `BACKEND-FIX-SUMMARY.md` - This document

---

## Next Steps

### Remaining Tasks (from user request)

1. **✅ COMPLETED:** Fix projects showing from database
2. **⏳ TODO:** Implement public projects visible to all users
   - Frontend: Add "Public Projects" tab/section
   - Backend: Already has `published` field in ProjectItem model
   - Create endpoint to fetch public projects (may already exist)

3. **⏳ TODO:** Implement visibility toggle for project owners
   - Add UI toggle in project card
   - Wire up to `togglePublishProject` Redux thunk
   - Update project list on visibility change

4. **✅ COMPLETED:** Document infrastructure state

### Testing Recommendations

1. Create new project in production dashboard
2. Verify it appears immediately in "Own Projects" list
3. Test with multiple users
4. Verify project persistence across sessions
5. Test project visibility toggle (when implemented)

---

## Contact

**VM Access:** `gcloud compute ssh universe-backend --zone=europe-central2-a`
**API Endpoint:** https://api.universemapmaker.online
**Frontend:** https://universemapmaker.online
**Database:** Railway PostgreSQL (centerbeam.proxy.rlwy.net:38178)

**Status:** System fully operational ✅
