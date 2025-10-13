# PostgreSQL Role Error Analysis: "role 'postgres' is a member of role 'postgres'"

**Date:** 2025-10-12
**Status:** ROOT CAUSE IDENTIFIED ✅
**Severity:** HIGH - Blocks project creation for admin user

---

## Executive Summary

Project creation fails with PostgreSQL error when the **admin user** tries to create a new project. The error occurs because the admin user has `dbLogin = 'postgres'`, which causes a circular role grant attempt.

**Error Message:**
```
error when creating database, project: TestProjekt, user postgres, error: role "postgres" is a member of role "postgres"
Bad Request: /api/projects/create/
```

---

## Root Cause

### 1. The Problematic Code

**File:** `/app/geocraft_api/projects/db_utils.py`

```python
def create_database(db_login, db_name) -> bool:
    conn = None
    try:
        conn = psycopg2.connect(
            host=settings.DATABASES['default']['HOST'],
            database=settings.DATABASES['default']['NAME'],
            user=settings.DATABASES['default']['USER'],  # <- 'postgres'
            password=settings.DATABASES['default']['PASSWORD'],
            port=settings.DATABASES['default']['PORT']
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # ❌ THIS LINE CAUSES THE ERROR!
        query = 'GRANT "{db_login}" TO postgres;'.format(db_login=db_login)
        cursor.execute(query)

        query = 'CREATE DATABASE "{db_name}" WITH OWNER = "{db_login}" ENCODING = "UTF8" TEMPLATE = template_postgis CONNECTION LIMIT = -1;'.format(
            db_name=db_name, db_login=db_login)
        cursor.execute(query)

        cursor.close()
        conn.commit()
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        logger.error("error when creating database, project: %s, user %s, error: %s", db_name, db_login, error)
        return False
    finally:
        if conn is not None:
            conn.close()
```

### 2. The Data Issue

**Database Query Result:**
```python
# From geocraft_api_customuser table
ID: 1, Username: admin, Email: admin@mapmaker.com, dbLogin: 'postgres'
```

**The admin user has `dbLogin = 'postgres'`!**

### 3. How the Bug Manifests

**Workflow:**
1. Admin user clicks "Create New Project" in frontend
2. Frontend calls `/api/projects/create/` with project name
3. Backend calls `create_project(user, data)` where `user.dbLogin = 'postgres'`
4. `create_database_for_project()` calls `create_database('postgres', 'TestProjekt_1')`
5. SQL executed: `GRANT "postgres" TO postgres;`
6. **PostgreSQL rejects:** "role 'postgres' is a member of role 'postgres'"

**Why it fails:**
- `GRANT "postgres" TO postgres;` attempts to make the `postgres` role a member of itself
- PostgreSQL detects circular membership and rejects the command
- This is a **logical impossibility** in PostgreSQL's role system

### 4. Why Regular Users Don't Have This Issue

**Regular User Registration Flow:**

**File:** `/app/geocraft_api/auth/serializers.py`

```python
def create(self, validated_data):
    validated_data.pop('password_confirm')

    email = validated_data.get('email', '')
    # ✅ NORMAL USERS: dbLogin = unique string based on email + microseconds
    dbLogin = email.lower().split("@")[0].replace('.', '_') + str(datetime.now().microsecond)
    dbPassword = generatePassword()

    validated_data['dbLogin'] = dbLogin
    validated_data['dbPassword'] = dbPassword

    user = CustomUser.objects.create_user(**validated_data)
    return user
```

**Example:**
- Email: `test@example.com`
- dbLogin: `test_123456` (email prefix + timestamp microseconds)
- SQL: `GRANT "test_123456" TO postgres;` ✅ **WORKS FINE**

**Admin User (PROBLEM):**
- Email: `admin@mapmaker.com`
- dbLogin: `postgres` ← **MANUALLY SET (not generated!)**
- SQL: `GRANT "postgres" TO postgres;` ❌ **CIRCULAR GRANT ERROR**

---

## Database State Verification

### Current PostgreSQL Roles

```sql
SELECT rolname, rolcanlogin, rolsuper, rolinherit
FROM pg_roles
WHERE rolname IN ('postgres', 'cloudsqladmin')
ORDER BY rolname;
```

**Result:**
```
cloudsqladmin | True  | True  | True
postgres      | True  | False | True
```

- `postgres` is NOT a superuser (Google Cloud SQL restriction)
- `postgres` is a member of `cloudsqlsuperuser` (normal Cloud SQL setup)

### Role Membership Check

```sql
SELECT r.rolname AS role, m.rolname AS member
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.roleid
JOIN pg_roles m ON am.member = m.oid
WHERE r.rolname = 'postgres' OR m.rolname = 'postgres';
```

**Result:**
```
Role: cloudsqlsuperuser, Member: postgres
```

✅ **No circular membership exists YET** (because the command fails before execution)

### Testing the Exact Bug

```python
# Simulate what happens when admin creates a project:
db_login = 'postgres'
query = 'GRANT "{db_login}" TO postgres;'.format(db_login=db_login)
# Results in: GRANT "postgres" TO postgres;

# Error: role "postgres" is a member of role "postgres"
```

---

## Why This Design Exists (Intent vs. Bug)

### The Intent of the GRANT Statement

**Purpose:** Allow the `postgres` superuser to manage databases owned by regular users.

**Normal Flow (regular user):**
1. User `john_doe_123456` is created during registration
2. Project creation: `GRANT "john_doe_123456" TO postgres;`
3. This makes `postgres` a member of `john_doe_123456` role
4. Result: `postgres` user can manage databases owned by `john_doe_123456`

**Why this is needed:**
- Each project creates a database owned by the user's `dbLogin`
- The `postgres` user needs to be able to administer these databases
- Role membership grants necessary permissions

### The Bug (admin user)

**Broken Flow (admin user):**
1. Admin user has `dbLogin = 'postgres'` (manually set, not generated)
2. Project creation: `GRANT "postgres" TO postgres;`
3. **Circular membership!** Role cannot be a member of itself
4. PostgreSQL rejects → project creation fails

---

## Solution Options

### Option 1: Change Admin User's dbLogin (RECOMMENDED) ✅

**Change admin user's dbLogin to a unique value:**

```sql
-- Connect to PostgreSQL database
UPDATE geocraft_api_customuser
SET "dbLogin" = 'admin_mapmaker_000001',
    "dbPassword" = 'NEW_GENERATED_PASSWORD_HERE'
WHERE id = 1;
```

**Then create PostgreSQL role:**
```sql
CREATE USER "admin_mapmaker_000001" WITH LOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION ENCRYPTED PASSWORD 'NEW_GENERATED_PASSWORD_HERE';
GRANT "admin_mapmaker_000001" TO postgres;
```

**Pros:**
- ✅ Simple, one-time fix
- ✅ No code changes required
- ✅ Follows the same pattern as regular users
- ✅ Works immediately

**Cons:**
- ❌ Requires database update
- ❌ Admin user credentials change (user needs new password in their code)

---

### Option 2: Skip GRANT for postgres User (CODE FIX) ✅

**Modify:** `/app/geocraft_api/projects/db_utils.py`

```python
def create_database(db_login, db_name) -> bool:
    conn = None
    try:
        conn = psycopg2.connect(
            host=settings.DATABASES['default']['HOST'],
            database=settings.DATABASES['default']['NAME'],
            user=settings.DATABASES['default']['USER'],
            password=settings.DATABASES['default']['PASSWORD'],
            port=settings.DATABASES['default']['PORT']
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # ✅ FIX: Skip GRANT if db_login is 'postgres' (prevent circular membership)
        if db_login != 'postgres':
            query = 'GRANT "{db_login}" TO postgres;'.format(db_login=db_login)
            cursor.execute(query)
        else:
            logger.info("Skipping GRANT for postgres user (circular membership prevention)")

        query = 'CREATE DATABASE "{db_name}" WITH OWNER = "{db_login}" ENCODING = "UTF8" TEMPLATE = template_postgis CONNECTION LIMIT = -1;'.format(
            db_name=db_name, db_login=db_login)
        cursor.execute(query)

        cursor.close()
        conn.commit()
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        logger.error("error when creating database, project: %s, user %s, error: %s", db_name, db_login, error)
        return False
    finally:
        if conn is not None:
            conn.close()
```

**Pros:**
- ✅ No database changes required
- ✅ Works for existing admin user
- ✅ Future-proof (handles any user with dbLogin='postgres')
- ✅ Easy to deploy

**Cons:**
- ❌ Code change required in backend
- ❌ Requires redeployment
- ❌ Doesn't fix the root cause (admin still has wrong dbLogin)

---

### Option 3: Add Check in create_postgis_user_db (PREVENTIVE) ⚠️

**Modify:** `/app/geocraft_api/auth/db_utils.py`

```python
def create_postgis_user_db(dbLogin, dbPassword):
    conn = None
    try:
        # ✅ PREVENT CREATION OF USER WITH RESERVED ROLE NAMES
        reserved_roles = ['postgres', 'cloudsqladmin', 'cloudsqlsuperuser']
        if dbLogin.lower() in reserved_roles:
            logger.error(f"Cannot create user with reserved role name: {dbLogin}")
            return False

        conn = psycopg2.connect(
            host=settings.DATABASES['default']['HOST'],
            database=settings.DATABASES['default']['NAME'],
            user=settings.DATABASES['default']['USER'],
            password=settings.DATABASES['default']['PASSWORD'],
            port=settings.DATABASES['default']['PORT']
        )
        cursor = conn.cursor()
        query = ('CREATE USER "{db_login}" WITH LOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION '
                 'ENCRYPTED PASSWORD %s').format(db_login=dbLogin)
        cursor.execute(query, (dbPassword,))
        cursor.close()
        conn.commit()
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return False
    finally:
        if conn is not None:
            conn.close()
```

**Pros:**
- ✅ Prevents future issues
- ✅ Good defensive programming
- ✅ Clear error message

**Cons:**
- ❌ Doesn't fix existing admin user
- ❌ Still needs Option 1 or Option 2 to fix current issue

---

## Recommended Solution: COMBINED APPROACH ✅

**Step 1: Fix Admin User (Option 1)**
```sql
-- Update admin dbLogin
UPDATE geocraft_api_customuser
SET "dbLogin" = 'admin_mapmaker_000001',
    "dbPassword" = 'G6acAf2DG5BeA2B5b432FeGbFGg321D5'  -- Keep same password for simplicity
WHERE id = 1;

-- Create PostgreSQL role
CREATE USER "admin_mapmaker_000001" WITH LOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION ENCRYPTED PASSWORD 'G6acAf2DG5BeA2B5b432FeGbFGg321D5';
GRANT "admin_mapmaker_000001" TO postgres;
```

**Step 2: Add Code Protection (Option 2 + Option 3)**

Implement both defensive checks to prevent future occurrences.

---

## Implementation Steps

### Step 1: Database Fix (IMMEDIATE - No Deployment Required)

```bash
# 1. SSH to backend VM
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker

# 2. Enter Django container
sudo docker exec -it universe-mapmaker-backend_django_1 bash

# 3. Run Django shell
python manage.py shell

# 4. Execute fix
from geocraft_api.models import CustomUser
from geocraft_api.auth.db_utils import generatePassword, create_postgis_user_db

# Get admin user
admin = CustomUser.objects.get(id=1)

# Update dbLogin (keep same password for simplicity)
admin.dbLogin = 'admin_mapmaker_000001'
admin.save()

# Create PostgreSQL role
create_postgis_user_db(admin.dbLogin, admin.dbPassword)

print(f"✅ Admin dbLogin updated to: {admin.dbLogin}")
exit()

# 5. Restart Django
exit  # Exit container
sudo docker restart universe-mapmaker-backend_django_1
```

### Step 2: Code Fix (RECOMMENDED - Deploy Later)

Update the backend code as shown in Option 2 and Option 3.

---

## Testing Verification

After applying Step 1 (database fix), test immediately:

```bash
# Frontend test:
1. Login as admin
2. Go to Dashboard → Moje Projekty
3. Click "Utwórz Pusty Projekt"
4. Enter project name
5. Should succeed! ✅
```

**Expected Backend Logs:**
```
INFO: Using dbLogin: admin_mapmaker_000001 for project creation
INFO: GRANT "admin_mapmaker_000001" TO postgres; ✅ SUCCESS
INFO: CREATE DATABASE "TestProjekt" WITH OWNER = "admin_mapmaker_000001"... ✅ SUCCESS
```

---

## Why This Bug Went Unnoticed

1. **Admin user was manually created** - Didn't go through normal registration flow
2. **Normal users work fine** - They get unique `dbLogin` values (email + timestamp)
3. **First admin project creation** - Bug only manifests when admin creates their first project
4. **Testing focused on regular users** - Admin workflow not thoroughly tested

---

## Conclusion

**Root Cause:** Admin user has `dbLogin = 'postgres'`, causing circular role grant.

**Impact:** Admin cannot create projects (regular users unaffected).

**Fix:** Update admin's `dbLogin` to unique value + create PostgreSQL role.

**Prevention:** Add code checks to prevent reserved role names.

**Urgency:** HIGH - Blocks core functionality for admin user.

**Estimated Fix Time:** 5 minutes (database update only)

---

## References

- **Backend Code:** `/app/geocraft_api/projects/db_utils.py`
- **User Model:** `/app/geocraft_api/models/user.py`
- **Auth Serializer:** `/app/geocraft_api/auth/serializers.py`
- **Database:** Google Cloud SQL `geocraft-postgres`
- **PostgreSQL Docs:** [GRANT Statement](https://www.postgresql.org/docs/current/sql-grant.html)
