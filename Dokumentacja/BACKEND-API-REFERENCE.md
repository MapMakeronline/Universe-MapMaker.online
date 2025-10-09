# Backend API Reference

**Base URL:** `https://api.universemapmaker.online`

Repository: [MapMakeronline/Universe-Mapmaker-Backend](https://github.com/MapMakeronline/Universe-Mapmaker-Backend.git)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Dashboard & Projects](#dashboard--projects)
3. [Projects Management](#projects-management)
4. [Layers](#layers)
5. [Groups & Parcels](#groups--parcels)
6. [Styles](#styles)

---

## 🔐 Authentication

### Register User

Creates a new user account and automatically provisions a PostgreSQL database for that user.

**Endpoint:** `POST /auth/register`

**Permission:** `AllowAny`

**Request Body:**
```json
{
  "username": "string (3-128 chars)",
  "email": "email",
  "password": "string",
  "password_confirm": "string (must match password)",
  "first_name": "string",
  "last_name": "string"
}
```

**Response (201 Created):**
```json
{
  "token": "string (auth token)",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "address": null,
    "city": null,
    "zip_code": null,
    "nip": null,
    "company_name": null,
    "theme": null
  }
}
```

**Response (400 Bad Request):**
```json
{
  "password": ["Hasła nie są identyczne"]
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Nie udało się utworzyć użytkownika bazy danych"
}
```

**Notes:**
- Automatically creates a PostGIS-enabled database for the user
- Sends welcome email
- Auto-generates `dbLogin` and `dbPassword` for user's database
- Pattern: `dbLogin = email.split("@")[0].replace(".", "_") + microseconds`

---

### Login

Authenticates user and returns authentication token.

**Endpoint:** `POST /auth/login`

**Permission:** `AllowAny`

**Request Body:**
```json
{
  "username": "string (username or email)",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "token": "string (auth token)",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "address": null,
    "city": null,
    "zip_code": null,
    "nip": null,
    "company_name": null,
    "theme": null
  }
}
```

**Response (400 Bad Request):**
```json
{
  "non_field_errors": ["Nieprawidłowe dane logowania"]
}
```

**Notes:**
- Accepts both username and email
- If input contains `@`, tries to find user by email first
- Returns Django REST Framework Token for authentication

---

### Logout

Invalidates the user's authentication token.

**Endpoint:** `POST /auth/logout`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Error logging out"
}
```

---

### Get Profile

Retrieves authenticated user's profile information.

**Endpoint:** `GET /auth/profile`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "address": null,
  "city": null,
  "zip_code": null,
  "nip": null,
  "company_name": null,
  "theme": null
}
```

---

## 📊 Dashboard & Projects

### Get User Projects

Retrieves all projects for the authenticated user (including sub-users).

**Endpoint:** `GET /dashboard/projects/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
```

**Response (200 OK):**
```json
{
  "list_of_projects": [
    {
      "project_name": "string (internal name, no spaces)",
      "custom_project_name": "string (display name)",
      "published": false,
      "logoExists": false,
      "description": "string",
      "keywords": "string",
      "project_date": "2025-01-09",
      "project_time": "12:34:56",
      "domain_name": "subdomain",
      "domain_url": "subdomain.localhost",
      "categories": "Inne",
      "qgs_exists": false,
      "thumbnail_url": "/api/projects/thumbnail/project_name/"
    }
  ],
  "db_info": {
    "login": "user_db_login",
    "password": "user_db_password",
    "host": "34.116.133.97",
    "port": "5432"
  }
}
```

**Notes:**
- Includes projects from sub-users (if any)
- Automatically creates domain if project doesn't have one
- `db_info` contains credentials for user's PostgreSQL database

---

### Update Profile

Updates authenticated user's profile information.

**Endpoint:** `PUT /dashboard/profile/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body (partial update allowed):**
```json
{
  "first_name": "string",
  "last_name": "string",
  "company_name": "string",
  "nip": "string",
  "address": "string",
  "city": "string",
  "zip_code": "string",
  "theme": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Profil zaktualizowany pomyślnie",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "address": "string",
    "city": "string",
    "zip_code": "string",
    "nip": "string",
    "company_name": "string",
    "theme": "string"
  }
}
```

---

### Change Password

Changes the authenticated user's password.

**Endpoint:** `PUT /dashboard/password/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "old_password": "string",
  "new_password": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Current password is incorrect"
}
```

---

## 🗂️ Projects Management

### Create Project

Creates a new QGIS project.

**Endpoint:** `POST /api/projects/create/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "my_project_name (3-128 chars, regex: ^[a-zA-Z0-9ąćęłńóśźżĄĘŁŃÓŚŹŻ_ ]*$)",
  "domain": "subdomain (3-63 chars, regex: [A-Za-z0-9](?:[A-Za-z0-9\\-]{0,61}[A-Za-z0-9])?)",
  "categories": "Inne (optional, choices: Inne/Geografia/...)",
  "projectDescription": "string (optional, max 100 chars)",
  "keywords": "string (optional, max 150 chars)"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "host": "34.116.133.97",
    "port": "5432",
    "db_name": "user_db_name",
    "login": "user_db_login",
    "password": "user_db_password"
  },
  "success": true,
  "message": "Projekt utworzony pomyślnie"
}
```

**Response (400 Bad Request):**
```json
{
  "project": ["Ensure this field has at least 3 characters."]
}
```

**Notes:**
- Creates QGS project file in `/mnt/qgis-projects/{project_name}/`
- Creates database schema in user's PostgreSQL database
- Sends "first project" email if this is user's first project
- Project name must be unique per user

---

### Import QGS File

Imports a QGS (QGIS project) file.

**Endpoint:** `POST /api/projects/import/qgs/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
project: string (project name)
qgs: File (QGS file)
```

**Response (200 OK):**
```json
{
  "data": [],
  "success": true,
  "message": "Plik QGS zaimportowany pomyślnie"
}
```

**Response (412 Precondition Failed):**
```json
{
  "data": ["missing_layer_id_1", "missing_layer_id_2"],
  "success": false,
  "message": "Brak warstw w projekcie"
}
```

---

### Import QGZ File

Imports a QGZ (compressed QGIS project) file.

**Endpoint:** `POST /api/projects/import/qgz/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
project: string (project name)
qgz: File (QGZ file)
```

**Response (200 OK):**
```json
{
  "data": [],
  "success": true,
  "message": "Plik QGZ zaimportowany pomyślnie"
}
```

---

### Delete Project

Removes a project (soft delete or permanent).

**Endpoint:** `POST /api/projects/remove/`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name",
  "remove_permanently": false
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Projekt usunięty pomyślnie"
}
```

---

### Export Project

Exports project as QGS or QGZ file.

**Endpoint:** `GET /api/projects/export`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Query Parameters:**
```
project_name: string
project_type: qgs | qgz (default: qgs)
```

**Response (200 OK):**
- File download (application/octet-stream)

---

### Publish/Unpublish App

Publishes or unpublishes the project application.

**Endpoint:** `POST /api/projects/app/publish`
**Endpoint:** `POST /api/projects/app/unpublish`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name"
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Aplikacja opublikowana"
}
```

---

### Check Subdomain Availability

Checks if a subdomain is available for use.

**Endpoint:** `POST /api/projects/subdomainAvailability`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "subdomain": "string"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "available": true
  },
  "success": true,
  "message": "Subdomena dostępna"
}
```

---

### Change Domain

Changes the project's subdomain.

**Endpoint:** `POST /api/projects/domain/change`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name",
  "domain": "new_subdomain"
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Domena zmieniona pomyślnie"
}
```

---

### Update Logo

Updates the project logo.

**Endpoint:** `POST /api/projects/logo/update/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
project: string (project name)
logo: File (image file)
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Logo zaktualizowane pomyślnie"
}
```

---

### Get Thumbnail

Retrieves project thumbnail image.

**Endpoint:** `GET /api/projects/thumbnail/<project_name>/`

**Permission:** `AllowAny`

**Response (200 OK):**
- Image file (image/png)
- Cache-Control: no-cache

**Response (404 Not Found):**
- Thumbnail not found

---

### Set Project Metadata

Updates project description, keywords, and categories.

**Endpoint:** `POST /api/projects/metadata`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name",
  "description": "string (optional)",
  "keywords": "string (optional)",
  "categories": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Metadane zaktualizowane"
}
```

---

### Get Project Space

Retrieves storage usage for a project.

**Endpoint:** `GET /api/projects/space/get`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Query Parameters:**
```
project: string (project name)
```

**Response (200 OK):**
```json
{
  "data": {
    "size_mb": 123.45
  },
  "success": true,
  "message": "Pobrano rozmiar projektu"
}
```

---

### Restore Project

Restores a project from backup.

**Endpoint:** `POST /api/projects/restore`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name"
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Projekt przywrócony"
}
```

---

### Repair Project

Attempts to repair a corrupted project.

**Endpoint:** `POST /api/projects/repair`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "issues_fixed": ["issue1", "issue2"]
  },
  "success": true,
  "message": "Projekt naprawiony"
}
```

---

### Reload Project

Reloads project from QGIS Server.

**Endpoint:** `POST /api/projects/reload`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name"
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Projekt przeładowany"
}
```

---

### Set Basemap

Sets the project's basemap configuration.

**Endpoint:** `POST /api/projects/basemap/set`

**Permission:** `IsAuthenticated` + `@project_owner_required`

**Headers:**
```
Authorization: Token <auth_token>
```

**Request Body:**
```json
{
  "project": "project_name",
  "type": "osm | mapbox | google | bing",
  "url": "string (optional)",
  "api_key": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "data": "",
  "success": true,
  "message": "Mapa bazowa ustawiona"
}
```

---

### Search Projects

Searches for projects by name or description.

**Endpoint:** `GET /api/projects/search`

**Permission:** `AllowAny`

**Query Parameters:**
```
query: string (search term)
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "project_name": "string",
      "custom_project_name": "string",
      "description": "string"
    }
  ],
  "success": true,
  "message": "Wyniki wyszukiwania"
}
```

---

## 📐 Layers

### Add Layer

Adds a new layer to the project (via QGIS Server integration).

**Endpoint:** `POST /api/layers/add/`

**Permission:** `IsAuthenticated`

**Headers:**
```
Authorization: Token <auth_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
project_name: string
layer_name: string
file: File (shapefile, geojson, tif, etc.)
epsg: string (optional, default: EPSG:4326)
```

**Response (201 Created):**
```json
{
  "data": {
    "layer_id": "string",
    "layer_name": "string"
  },
  "success": true,
  "message": "Warstwa dodana pomyślnie"
}
```

---

## 🔧 Authentication Notes

All authenticated endpoints require the `Authorization` header:

```
Authorization: Token <auth_token>
```

Token is obtained from `/auth/login` or `/auth/register` responses.

Store token in `localStorage` with key `authToken` on frontend.

---

## 🚨 Error Responses

Standard error response format:

**400 Bad Request:**
```json
{
  "field_name": ["Error message for this field"],
  "non_field_errors": ["General validation error"]
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error message",
  "success": false
}
```

---

## 📚 Additional Resources

- **Backend Repo:** https://github.com/MapMakeronline/Universe-Mapmaker-Backend.git
- **QGIS Server OWS Endpoint:** `https://api.universemapmaker.online/ows`
- **Admin Panel:** `https://api.universemapmaker.online/admin/`

---

## 🧪 Testing

Test API with curl:

```bash
# Register
curl -X POST https://api.universemapmaker.online/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST https://api.universemapmaker.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123"
  }'

# Get Projects (with token)
curl -X GET https://api.universemapmaker.online/dashboard/projects/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```
