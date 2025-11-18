# 🚀 Szybki Import Brakującej Warstwy

## ✨ Najszybsza metoda (1 kliknięcie!)

### Windows PowerShell:

1. **Otwórz PowerShell** w folderze projektu
2. **Uruchom:**
   ```powershell
   .\quick-import.ps1
   ```
3. **Postępuj zgodnie z instrukcjami na ekranie:**
   - Otwórz przeglądarkę na http://localhost:3000
   - Zaloguj się
   - Naciśnij F12
   - W konsoli wpisz: `localStorage.getItem('authToken')`
   - Skopiuj token i wklej do PowerShell
4. **Gotowe!** ✅

---

## 📋 Alternatywnie: Import ręczny

Jeśli preferujesz import przez interfejs użytkownika:

### Krok 1: Pobierz token z przeglądarki

```javascript
// W konsoli DevTools (F12):
localStorage.getItem('authToken')
```

### Krok 2: Uruchom skrypt Node.js

```bash
node import-layer-api.mjs TWÓJ_TOKEN_TUTAJ
```

---

## 📚 Pełna dokumentacja

Zobacz [IMPORT-INSTRUCTIONS.md](./IMPORT-INSTRUCTIONS.md) dla:
- Szczegółowych instrukcji
- Rozwiązywania problemów
- Listy wszystkich znalezionych plików
- Metody importu przez UI

---

## 📂 Co zostanie zaimportowane?

### Warstwa:
- **Nazwa:** Działki Kolbudy Import
- **Format:** GML
- **Plik:** `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Działki starostwo 260525_3857.gml`

### Styl:
- **Format:** QML
- **Plik:** `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Działki starostwo 26.05.25_style.qml`

---

## ✅ Po imporcie

1. Odśwież stronę: http://localhost:3000/map?project=Wyszki
2. Znajdź nową warstwę "Działki Kolbudy Import" w panelu warstw
3. Błędy konsoli 400 (ParcelSearchTab) znikną dla tej warstwy
4. Warstwa będzie miała zastosowany styl QML z różnymi kolorami

---

**Potrzebujesz pomocy?** Zobacz [IMPORT-INSTRUCTIONS.md](./IMPORT-INSTRUCTIONS.md)
