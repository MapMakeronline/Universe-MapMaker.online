# 🚀 Quick Start - Testowanie Importu QGS

## Frontend już działa! → http://localhost:3000

---

## ⚡ 3 Proste Kroki do Testu

### 1️⃣ Otwórz Przeglądarkę

```
1. Chrome/Edge
2. Przejdź do: http://localhost:3000
3. Otwórz DevTools (F12)
4. Network tab → Zaznacz "Preserve log"
```

### 2️⃣ Zaloguj Się i Importuj

```
1. Login → wpisz swoje dane
2. Dashboard → "Moje Projekty"
3. Kliknij "+ Nowy Projekt"
4. Zakładka "Import QGS/QGZ"
5. Wybierz plik .qgs lub .qgz
6. Kliknij "Importuj"
```

### 3️⃣ Obserwuj Network Tab

**Szukaj tych requestów:**

✅ **POST /api/projects/import-qgs/**
- Status: 200 OK
- Response: `{ "success": true, "data": { "db_name": "..." } }`

✅ **GET /dashboard/projects/** (auto-refetch)
- Status: 200 OK
- Nowy projekt na liście!

---

## 🔍 Co Sprawdzamy?

### ✅ Frontend → Django Komunikacja

**Request:**
```http
POST https://api.universemapmaker.online/api/projects/import-qgs/
Authorization: Token abc123...
Content-Type: multipart/form-data

Body:
  project: nazwa-projektu
  qgs: [File]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "db_name": "nazwa-projektu_1",
    "message": "Project imported successfully",
    "layers_count": 5
  }
}
```

### ✅ RTK Query Auto-Refetch

Po sukcesie importu:
1. RTK Query invaliduje cache tags: `['Projects', 'LIST']`
2. Automatycznie wysyła: `GET /dashboard/projects/`
3. Lista projektów się odświeża
4. Nowy projekt pojawia się na liście

### ✅ Dane w Bazie (opcjonalnie)

Sprawdź przez Django Admin:
- https://api.universemapmaker.online/admin/
- Geocraft API → Project Items
- Znajdź projekt: `nazwa-projektu_1`

---

## 📸 Screenshots do Zrobienia

1. **Network Tab:**
   - Request import-qgs (200 OK)
   - Response z db_name
   - Auto-refetch projects

2. **Dashboard:**
   - Progress bar (podczas uploadu)
   - Nowy projekt na liście

3. **Redux DevTools** (jeśli zainstalowane):
   - projectsApi/importQGS/fulfilled
   - Cache invalidation

---

## ✅ Success = Wszystkie Sprawdzone!

- [x] Request wysłany do Django
- [x] Status 200 OK
- [x] Response z db_name
- [x] Auto-refetch zadziałał
- [x] Projekt na liście

**Jeśli TAK → RTK Query działa poprawnie! 🎉**

---

## 📄 Pełna Dokumentacja

Zobacz: `docs/TESTING-GUIDE-QGS-IMPORT.md`

---

**Frontend:** http://localhost:3000
**Backend:** https://api.universemapmaker.online
**Data:** 2025-10-11
