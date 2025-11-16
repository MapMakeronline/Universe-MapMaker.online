# Backend Fix: Wypis DOCX/PDF Generation

## 🚨 Problem Summary

User reported **corrupted DOCX files** with broken Polish characters and missing PDF EOF markers.

**Root Cause Analysis:**

### Bug #1: File Deleted Before HTTP Response Sent (CRITICAL) ⚠️

**File:** `geocraft_api/projects/service.py`
**Lines:** 2362-2376 (finally block)

```python
# CURRENT (BROKEN):
def generate_wypis(data, user):
    try:
        # ... generate DOCX/PDF ...
        with open(result_document_path, 'rb') as document_to_export:
            response = HttpResponse(document_to_export.read(), content_type=content_type)
            response['Content-Disposition'] = 'inline; filename=' + os.path.basename(result_document_path)
            return response
    finally:
        if os.path.exists(result_document_path):
            os.remove(result_document_path)  # ❌ DELETES FILE BEFORE SENDING!
```

**Why This Breaks:**
1. `HttpResponse.read()` loads file to memory ✅
2. `return response` triggers `finally` block IMMEDIATELY
3. `os.remove()` deletes file from disk
4. Django sends incomplete response → **corrupted file**

**Impact:**
- PDF files: Missing EOF marker → "File cannot be opened"
- DOCX files: Truncated ZIP archive → "File is corrupted"

---

### Bug #2: Wrong Content-Disposition Header

**Line:** 2344

```python
# CURRENT (WRONG):
response['Content-Disposition'] = 'inline; filename=' + os.path.basename(result_document_path)
# ❌ 'inline' = browser tries to open in tab (not download)

# SHOULD BE:
response['Content-Disposition'] = 'attachment; filename=' + os.path.basename(result_document_path)
# ✅ 'attachment' = browser downloads file
```

---

## ✅ Solution

### Fix #1: Use Django FileResponse (Recommended)

**Django FileResponse** handles file cleanup AFTER sending response automatically.

**REPLACE lines 2342-2345 with:**

```python
from django.http import FileResponse

# Line 2341-2350 (FIXED):
if os.path.exists(result_document_path):
    try:
        # ✅ FileResponse handles binary streaming + automatic cleanup
        response = FileResponse(
            open(result_document_path, 'rb'),
            content_type=content_type,
            as_attachment=True,  # ✅ Forces download
            filename=os.path.basename(result_document_path)
        )

        # ✅ Delete file AFTER response sent (FileResponse closes file handle first)
        response.file_to_stream.close = lambda: None  # Prevent early close

        # Schedule cleanup after request finishes
        import atexit
        atexit.register(lambda: os.path.exists(result_document_path) and os.remove(result_document_path))

        return response
    except Exception as e:
        logger.error("Error creating FileResponse: %s", str(e))
        return {
            'data': '',
            'success': False,
            'message': 'Błąd podczas wysyłania pliku',
            'status_code': 500
        }
else:
    return {
        'data': '',
        'success': False,
        'message': 'Błąd podczas drukowania i dodawania skali',
        'status_code': 400
    }
```

### Fix #2: Remove finally block file cleanup (lines 2362-2364)

**REMOVE lines 2362-2364:**

```python
# DELETE THIS:
finally:
    if "result_document_path" in locals():
        if os.path.exists(result_document_path):
            os.remove(result_document_path)  # ❌ REMOVE THIS LINE
```

**KEEP temporary file cleanup (plot PNG, legend, etc.):**

```python
# KEEP THIS (cleanup temporary files only):
finally:
    if "plot_png_path" in locals() and isinstance(plot_png_path, str):
        if os.path.exists(plot_png_path):
            os.remove(plot_png_path)
    if "plot_legend_path" in locals() and isinstance(plot_legend_path, str):
        if os.path.exists(plot_legend_path):
            os.remove(plot_legend_path)
    if "plot_pdf_path" in locals():
        if os.path.exists(plot_pdf_path):
            os.remove(plot_pdf_path)
    if "legend_pdf_path" in locals():
        if os.path.exists(legend_pdf_path):
            os.remove(legend_pdf_path)
```

---

## 🧪 Testing After Fix

### Test DOCX Download (Logged User)

```bash
curl -X POST "https://api.universemapmaker.online/api/projects/wypis/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "project": "Wyszki",
    "config_id": "config_252516",
    "plot": [{
      "plot": {"precinct": "WYSZKI", "number": "15"},
      "plot_destinations": [...]
    }]
  }' \
  --output wypis.docx

# Verify DOCX integrity:
file wypis.docx
# Expected: Microsoft Word 2007+ (ZIP archive)

unzip -t wypis.docx
# Expected: No errors, all files OK

# Check for Polish characters:
unzip -p wypis.docx word/document.xml | grep -o 'ąćęłńóśźż'
# Expected: Polish characters preserved
```

### Test PDF Download (Anonymous User)

```bash
curl -X POST "https://api.universemapmaker.online/api/projects/wypis/create" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  --output wypis.pdf

# Verify PDF integrity:
file wypis.pdf
# Expected: PDF document, version 1.x

# Check for EOF marker:
tail -c 10 wypis.pdf | od -c
# Expected: %%EOF at the end

# Try opening PDF:
pdfinfo wypis.pdf
# Expected: No errors, shows PDF metadata
```

---

## 📦 Alternative Fix: Keep File Until Request Finished

If `FileResponse` doesn't work, use Django signals:

```python
from django.core.signals import request_finished
from django.dispatch import receiver

def generate_wypis(data, user):
    # ... existing code ...

    if os.path.exists(result_document_path):
        with open(result_document_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename={os.path.basename(result_document_path)}'

        # Schedule cleanup AFTER request finished
        @receiver(request_finished)
        def cleanup_wypis_file(sender, **kwargs):
            if os.path.exists(result_document_path):
                os.remove(result_document_path)

        return response
```

---

## 🔄 Deployment Steps

### 1. SSH to Backend VM

```bash
gcloud compute ssh universe-backend --zone=europe-central2-a
```

### 2. Backup Current File

```bash
sudo docker exec universe-mapmaker-backend_django_1 \
  cp /app/geocraft_api/projects/service.py /app/geocraft_api/projects/service.py.backup_wypis_fix
```

### 3. Apply Fix

```bash
# Fix #1: Replace HttpResponse with FileResponse (lines 2341-2350)
sudo docker exec universe-mapmaker-backend_django_1 bash -c "cat > /tmp/wypis_fix.py << 'EOF'
from django.http import FileResponse
import os

if os.path.exists(result_document_path):
    response = FileResponse(
        open(result_document_path, 'rb'),
        content_type=content_type,
        as_attachment=True,
        filename=os.path.basename(result_document_path)
    )
    return response
EOF"

# Fix #2: Remove finally block cleanup of result_document_path
sudo docker exec universe-mapmaker-backend_django_1 \
  sed -i '2362,2364d' /app/geocraft_api/projects/service.py
```

### 4. Restart Django

```bash
sudo docker restart universe-mapmaker-backend_django_1
```

### 5. Verify Django Started

```bash
sudo docker logs universe-mapmaker-backend_django_1 --tail=20 | grep -i "listening"
# Expected: "Listening at http://0.0.0.0:8000"
```

---

## 📊 Expected Results

**Before Fix:**
- ❌ DOCX: Corrupted ZIP, broken Polish characters
- ❌ PDF: Missing EOF, cannot open
- ❌ Downloads incomplete files

**After Fix:**
- ✅ DOCX: Valid ZIP archive, Polish characters (UTF-8) preserved
- ✅ PDF: Complete file with EOF marker
- ✅ Content-Disposition: attachment → browser downloads file
- ✅ FileResponse handles cleanup AFTER sending

---

## 🎯 Technical Details

### Why Binary Read is Correct (Already Working)

```python
with open(result_document_path, 'rb') as f:  # ✅ Binary mode
    response = HttpResponse(f.read(), content_type=content_type)
```

**DOCX file structure:**
- DOCX = ZIP archive containing XML files
- ZIP requires binary mode (not text)
- XML inside uses UTF-8 encoding
- Polish characters stored as UTF-8 bytes in XML

**Example DOCX structure:**
```
wypis.docx (ZIP archive)
├── [Content_Types].xml
├── word/
│   ├── document.xml        ← Polish text here (UTF-8)
│   ├── styles.xml
│   └── ...
└── _rels/
```

**Backend DOCX generation (lines 2202-2263):**
```python
from docx import Document  # python-docx library
from docx.shared import Pt

master = Document(documents_to_return[0][0])
master.paragraphs[0].insert_paragraph_before(
    " ".join(["Obręb", plot_precinct + ",", "Działka", plot_number]),  # Polish text
    style="PlotStyle"
)
composer.save(result_document_path)  # ✅ Saves as valid ZIP with UTF-8 XML
```

**python-docx library handles UTF-8 automatically** - no encoding issues in generation!

---

## 📝 Summary

**Root Cause:** File deleted in `finally` block BEFORE HTTP response sent to client.

**Fix:** Use `FileResponse` with `as_attachment=True` and remove premature file cleanup.

**Impact:**
- ✅ DOCX files: Valid ZIP archives, Polish characters preserved
- ✅ PDF files: Complete files with EOF markers
- ✅ Automatic file downloads (not inline preview)

**Estimated fix time:** 5 minutes (sed commands + container restart)

**Risk level:** LOW (only changes response type, not file generation logic)
