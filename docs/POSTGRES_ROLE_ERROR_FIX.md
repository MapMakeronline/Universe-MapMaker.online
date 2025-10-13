# Quick Fix Guide: PostgreSQL Role Error

**Error:** `role "postgres" is a member of role "postgres"`
**Impact:** Admin user cannot create projects
**Fix Time:** 5 minutes
**Risk:** LOW (only affects admin user, easily reversible)

---

## Option A: Database Fix (IMMEDIATE - Recommended) ✅

No code changes, no deployment required. Run these commands:

### Step 1: Connect to Backend VM

```bash
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker
```

### Step 2: Enter Django Container & Python Shell

```bash
sudo docker exec -it universe-mapmaker-backend_django_1 python manage.py shell
```

### Step 3: Run Fix Script

Copy and paste this entire block:

```python
from geocraft_api.models import CustomUser
from geocraft_api.auth.db_utils import create_postgis_user_db

# Get admin user
admin = CustomUser.objects.get(id=1)

# Show current values
print(f"Current dbLogin: {admin.dbLogin}")
print(f"Current dbPassword: {admin.dbPassword}")

# Update dbLogin to unique value
admin.dbLogin = 'admin_mapmaker_000001'
admin.save()

# Create PostgreSQL role
success = create_postgis_user_db(admin.dbLogin, admin.dbPassword)

if success:
    print(f"✅ SUCCESS! Admin dbLogin updated to: {admin.dbLogin}")
    print(f"✅ PostgreSQL role created: {admin.dbLogin}")
else:
    print(f"❌ FAILED to create PostgreSQL role!")

exit()
```

### Step 4: Restart Django

```bash
sudo docker restart universe-mapmaker-backend_django_1
```

### Step 5: Test

1. Login as admin in frontend
2. Go to Dashboard → Moje Projekty
3. Click "Utwórz Pusty Projekt"
4. Enter project name
5. **Should work!** ✅

---

## Option B: Code Fix (Long-term - Deploy Later) 🔄

Add defensive check to prevent circular GRANT.

### File to Modify

`/app/geocraft_api/projects/db_utils.py`

### Changes

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

        # ✅ ADD THIS CHECK
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

### Deploy

```bash
# After code changes committed to main
sudo docker exec universe-mapmaker-backend_django_1 git pull origin main
sudo docker restart universe-mapmaker-backend_django_1
```

---

## Verification

### Check Admin User

```bash
# SSH to VM
gcloud compute ssh universe-backend --zone=europe-central2-a --project=universe-mapmaker

# Enter container
sudo docker exec -it universe-mapmaker-backend_django_1 python manage.py shell

# Run query
from geocraft_api.models import CustomUser
admin = CustomUser.objects.get(id=1)
print(f"dbLogin: {admin.dbLogin}")
exit()
```

**Expected Output:**
```
dbLogin: admin_mapmaker_000001
```

### Check PostgreSQL Role

```bash
# In Django container Python shell
import psycopg2
from django.conf import settings

conn = psycopg2.connect(
    host=settings.DATABASES['default']['HOST'],
    database=settings.DATABASES['default']['NAME'],
    user=settings.DATABASES['default']['USER'],
    password=settings.DATABASES['default']['PASSWORD'],
    port=settings.DATABASES['default']['PORT']
)
cursor = conn.cursor()
cursor.execute("SELECT rolname FROM pg_roles WHERE rolname = 'admin_mapmaker_000001';")
print(cursor.fetchall())
exit()
```

**Expected Output:**
```
[('admin_mapmaker_000001',)]
```

---

## Rollback (If Something Goes Wrong)

### Restore Admin User

```bash
# In Django shell
from geocraft_api.models import CustomUser
admin = CustomUser.objects.get(id=1)
admin.dbLogin = 'postgres'
admin.save()
exit()
```

### Delete PostgreSQL Role

```bash
# In Django shell
import psycopg2
from django.conf import settings

conn = psycopg2.connect(
    host=settings.DATABASES['default']['HOST'],
    database=settings.DATABASES['default']['NAME'],
    user=settings.DATABASES['default']['USER'],
    password=settings.DATABASES['default']['PASSWORD'],
    port=settings.DATABASES['default']['PORT']
)
conn.autocommit = True
cursor = conn.cursor()
cursor.execute("DROP ROLE IF EXISTS admin_mapmaker_000001;")
exit()
```

---

## FAQ

**Q: Will this affect existing projects?**
A: No. This only changes how NEW projects are created by admin.

**Q: Will admin need to re-login?**
A: No. Authentication uses Django session, not PostgreSQL credentials directly.

**Q: What about other users?**
A: Not affected. They already have unique `dbLogin` values.

**Q: Can I use a different dbLogin name?**
A: Yes! Just make sure it's unique and follows PostgreSQL naming rules (letters, numbers, underscores).

**Q: What if the fix fails?**
A: Check error messages in Django shell. Most likely causes:
- PostgreSQL role already exists (safe to ignore if you ran the fix twice)
- Database connection issue (check credentials)

---

## Support

**Full Analysis:** See `POSTGRES_ROLE_ERROR_ANALYSIS.md`

**Contact:** Backend team / Database administrator

**Emergency Rollback:** See "Rollback" section above
