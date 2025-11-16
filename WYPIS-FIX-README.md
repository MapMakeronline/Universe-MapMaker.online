# Wypis Fix - Quick Start Guide

## 🚨 Problem

**Corrupted DOCX/PDF files** from wypis generator:
- DOCX: Broken Polish characters (���), invalid ZIP
- PDF: Missing EOF marker, cannot open

## ✅ Solution

**2-step deployment:**
1. Frontend: Preview modal (PDF iframe + DOCX info)
2. Backend: Fix file cleanup timing

## 🚀 Deploy NOW (5 commands)

```bash
# 1. Frontend deployment
git add .
git commit -m "feat: add wypis preview modal + fix corrupted files"
git push origin main

# 2. Backend deployment (wait for frontend to deploy first)
chmod +x fix-backend-wypis.sh
./fix-backend-wypis.sh
```

**That's it!** ✅

---

## 📚 Full Documentation

| File | Purpose |
|------|---------|
| [BACKEND-WYPIS-FIX.md](./BACKEND-WYPIS-FIX.md) | Technical details + backend fix |
| [WYPIS-USER-GUIDE.md](./WYPIS-USER-GUIDE.md) | User guide for wypis feature |
| [WYPIS-DEPLOYMENT-SUMMARY.md](./WYPIS-DEPLOYMENT-SUMMARY.md) | Complete deployment checklist |
| [fix-backend-wypis.sh](./fix-backend-wypis.sh) | Automated deployment script |

---

## 🧪 Testing After Deployment

```bash
# Test DOCX (anonymous user)
curl -X POST "https://api.universemapmaker.online/api/projects/wypis/create" \
  -H "Content-Type: application/json" \
  -d '{"project":"Wyszki","config_id":"config_252516","plot":[{"plot":{"precinct":"WYSZKI","number":"15"},"plot_destinations":[]}]}' \
  --output test.docx

# Verify DOCX
file test.docx  # Should show: Microsoft Word 2007+
unzip -t test.docx  # Should show: No errors

# Test PDF (logged user)
curl -X POST "https://api.universemapmaker.online/api/projects/wypis/create" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project":"Wyszki","config_id":"config_252516","plot":[{"plot":{"precinct":"WYSZKI","number":"15"},"plot_destinations":[]}]}' \
  --output test.pdf

# Verify PDF
file test.pdf  # Should show: PDF document
tail -c 10 test.pdf | od -c  # Should show: %%EOF
```

---

## 📦 What Was Changed

### Frontend (React):
- ✅ Added: `WypisPreviewModal.tsx` - PDF preview + DOCX info
- ✅ Modified: `WypisGenerateDialog.tsx` - Preview integration

### Backend (Django):
- ✅ Fixed: Line 2344 - `Content-Disposition: attachment`
- ✅ Fixed: Lines 2362-2364 - Disabled premature file cleanup

---

## ⚠️ Rollback (if needed)

```bash
# Rollback backend
gcloud compute ssh universe-backend --zone=europe-central2-a --command="
  sudo docker exec universe-mapmaker-backend_django_1 \
    cp /app/geocraft_api/projects/service.py.backup_wypis_fix \
       /app/geocraft_api/projects/service.py
  sudo docker restart universe-mapmaker-backend_django_1
"

# Rollback frontend
git revert HEAD
git push origin main
```

---

## ✅ Success Criteria

After deployment, verify:
- [ ] DOCX opens in Microsoft Word (no errors)
- [ ] Polish characters visible: ąćęłńóśźż
- [ ] PDF opens in Adobe Reader (no "corrupted file" error)
- [ ] Preview modal shows PDF iframe (logged users)
- [ ] Preview modal shows DOCX info (anonymous users)

---

## 📞 Need Help?

**Check logs:**
```bash
# Backend logs
gcloud compute ssh universe-backend --zone=europe-central2-a \
  --command="sudo docker logs universe-mapmaker-backend_django_1 --tail=50"

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

**Read full documentation:** [WYPIS-DEPLOYMENT-SUMMARY.md](./WYPIS-DEPLOYMENT-SUMMARY.md)

---

**Last updated:** 2025-11-16
**Status:** ✅ Ready to deploy
**Estimated time:** 10 minutes total
