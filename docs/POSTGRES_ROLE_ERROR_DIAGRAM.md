# PostgreSQL Role Error - Visual Diagram

## The Bug Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Admin User Creates Project                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. User clicks "Utwórz Pusty Projekt"                          │
│ 2. POST /api/projects/create/                                  │
│    Body: { project: "TestProjekt", domain: "test" }            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: projects/views.py → create_project()                  │
├─────────────────────────────────────────────────────────────────┤
│ def create_project(user, data):                                │
│     project_name = "TestProjekt"  # From request               │
│     db_login = user.dbLogin       # ❌ "postgres" (admin)      │
│     create_database_for_project(db_login, project_name)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: projects/db_utils.py → create_database()              │
├─────────────────────────────────────────────────────────────────┤
│ def create_database(db_login, db_name):                        │
│     # db_login = "postgres"                                    │
│     # db_name = "TestProjekt"                                  │
│                                                                 │
│     conn = psycopg2.connect(user='postgres', ...)              │
│     cursor = conn.cursor()                                     │
│                                                                 │
│     # ❌ THE PROBLEM:                                          │
│     query = 'GRANT "{db_login}" TO postgres;'                  │
│     # Becomes: GRANT "postgres" TO postgres;                   │
│     cursor.execute(query)  # ← FAILS HERE!                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ POSTGRESQL: Rejects Circular Grant                             │
├─────────────────────────────────────────────────────────────────┤
│ ERROR: role "postgres" is a member of role "postgres"          │
│                                                                 │
│ Explanation:                                                    │
│ - Cannot make a role a member of itself                        │
│ - This would create circular dependency                        │
│ - PostgreSQL prevents infinite loops in role inheritance       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: Returns Error to Frontend                             │
├─────────────────────────────────────────────────────────────────┤
│ return JsonResponse({                                           │
│     'success': False,                                           │
│     'message': 'Błąd podczas tworzenia projektu'               │
│ }, status=400)                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Regular Users Work Fine

```
┌─────────────────────────────────────────────────────────────────┐
│ REGULAR USER: Registration                                      │
├─────────────────────────────────────────────────────────────────┤
│ Email: test@example.com                                         │
│                                                                 │
│ dbLogin Generation (auth/serializers.py):                      │
│   email_prefix = "test"                                        │
│   timestamp = datetime.now().microsecond  # e.g., 123456       │
│   dbLogin = "test_123456"  ✅ UNIQUE!                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ REGULAR USER: Creates Project                                  │
├─────────────────────────────────────────────────────────────────┤
│ db_login = "test_123456"                                       │
│                                                                 │
│ SQL: GRANT "test_123456" TO postgres;                          │
│      ✅ SUCCESS! (no circular dependency)                      │
│                                                                 │
│ Result:                                                         │
│   postgres ──member_of──> test_123456                          │
│   (postgres can manage test_123456's databases)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Problem: Admin User Setup

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN USER: Manual Creation (Database Initialization)          │
├─────────────────────────────────────────────────────────────────┤
│ INSERT INTO geocraft_api_customuser (                          │
│     username, email, dbLogin, dbPassword                       │
│ ) VALUES (                                                      │
│     'admin',                                                    │
│     'admin@mapmaker.com',                                      │
│     'postgres',  ❌ MANUALLY SET (not auto-generated!)         │
│     'G6acAf2DG5BeA2B5b432FeGbFGg321D5'                          │
│ );                                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ADMIN USER: Creates Project                                    │
├─────────────────────────────────────────────────────────────────┤
│ db_login = "postgres"  ❌ SAME AS SYSTEM USER!                 │
│                                                                 │
│ SQL: GRANT "postgres" TO postgres;                             │
│      ❌ FAILS! (circular grant)                                │
│                                                                 │
│ Attempted Result:                                               │
│   postgres ──member_of──> postgres  ❌ CIRCULAR!               │
│   (infinite loop - PostgreSQL rejects)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## PostgreSQL Role Hierarchy (Current State)

```
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL Roles (Before Fix)                            │
└──────────────────────────────────────────────────────────┘

cloudsqladmin (superuser)
    │
    └─> cloudsqlsuperuser
            │
            └─> postgres (login user, NOT superuser)
                    │
                    └─> ❌ CANNOT: postgres ──> postgres
                            (circular membership blocked!)


Regular User Example:

cloudsqladmin (superuser)
    │
    └─> cloudsqlsuperuser
            │
            ├─> postgres
            │       │
            │       └─> test_123456 ✅ (OK!)
            │
            └─> test_123456 (project database owner)
```

---

## PostgreSQL Role Hierarchy (After Fix)

```
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL Roles (After Fix)                             │
└──────────────────────────────────────────────────────────┘

cloudsqladmin (superuser)
    │
    └─> cloudsqlsuperuser
            │
            ├─> postgres (system user)
            │       │
            │       ├─> admin_mapmaker_000001 ✅ (OK!)
            │       └─> test_123456 ✅ (OK!)
            │
            ├─> admin_mapmaker_000001 (admin's project database owner)
            └─> test_123456 (regular user's project database owner)


Database Ownership:

TestProjekt_1 (database)
    Owner: admin_mapmaker_000001
    Access: postgres can manage (via role membership)

UserProject_1 (database)
    Owner: test_123456
    Access: postgres can manage (via role membership)
```

---

## The Fix - Step by Step

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Update Admin User in Django Database                   │
├─────────────────────────────────────────────────────────────────┤
│ UPDATE geocraft_api_customuser                                  │
│ SET "dbLogin" = 'admin_mapmaker_000001'                         │
│ WHERE id = 1;                                                   │
│                                                                 │
│ Before: dbLogin = "postgres"                                   │
│ After:  dbLogin = "admin_mapmaker_000001" ✅                   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Create PostgreSQL Role                                 │
├─────────────────────────────────────────────────────────────────┤
│ CREATE USER "admin_mapmaker_000001"                             │
│ WITH LOGIN NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE         │
│ NOREPLICATION                                                   │
│ ENCRYPTED PASSWORD 'G6acAf2DG5BeA2B5b432FeGbFGg321D5';          │
│                                                                 │
│ GRANT "admin_mapmaker_000001" TO postgres;                      │
│ ✅ SUCCESS! (no circular dependency)                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Test Project Creation                                  │
├─────────────────────────────────────────────────────────────────┤
│ Admin creates project "TestProjekt"                             │
│                                                                 │
│ db_login = "admin_mapmaker_000001"  ✅                          │
│                                                                 │
│ SQL: GRANT "admin_mapmaker_000001" TO postgres;                 │
│      ✅ SUCCESS!                                                │
│                                                                 │
│ CREATE DATABASE "TestProjekt"                                   │
│ WITH OWNER = "admin_mapmaker_000001" ...;                       │
│      ✅ SUCCESS!                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Flow Comparison

### BEFORE FIX ❌

```
User Action
    │
    ▼
create_project(user.dbLogin="postgres")
    │
    ▼
create_database(db_login="postgres", db_name="TestProjekt")
    │
    ▼
GRANT "postgres" TO postgres;  ← CIRCULAR GRANT!
    │
    ▼
PostgreSQL Error: role "postgres" is a member of role "postgres"
    │
    ▼
Project Creation FAILS ❌
```

### AFTER FIX ✅

```
User Action
    │
    ▼
create_project(user.dbLogin="admin_mapmaker_000001")
    │
    ▼
create_database(db_login="admin_mapmaker_000001", db_name="TestProjekt")
    │
    ▼
GRANT "admin_mapmaker_000001" TO postgres;  ← VALID GRANT!
    │
    ▼
PostgreSQL Success: Role membership created
    │
    ▼
CREATE DATABASE "TestProjekt" WITH OWNER = "admin_mapmaker_000001";
    │
    ▼
Project Creation SUCCESS ✅
```

---

## Key Takeaways

1. **Root Cause:** Admin user has `dbLogin = "postgres"` (system role name)
2. **Symptom:** `GRANT "postgres" TO postgres;` creates circular dependency
3. **Impact:** Admin cannot create projects
4. **Why Regular Users Work:** They have unique `dbLogin` values (email + timestamp)
5. **Fix:** Change admin's `dbLogin` to unique value
6. **Prevention:** Add validation to prevent reserved role names

---

## Related Files

- `/app/geocraft_api/projects/db_utils.py` - Where the GRANT happens
- `/app/geocraft_api/auth/serializers.py` - Where dbLogin is generated
- `/app/geocraft_api/models/user.py` - CustomUser model
- `geocraft_api_customuser` table - User data storage

---

## PostgreSQL Documentation References

- [GRANT Statement](https://www.postgresql.org/docs/current/sql-grant.html)
- [Role Membership](https://www.postgresql.org/docs/current/role-membership.html)
- [Google Cloud SQL Roles](https://cloud.google.com/sql/docs/postgres/users)
