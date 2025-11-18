# Instrukcja importu brakującej warstwy "Działki Kolbudy"

## 📋 Podsumowanie

Znalazłem następujące pliki na Twoim komputerze:

### ✅ Pliki gotowe do importu:

1. **Dane geometryczne (GML):**
   - `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Działki starostwo 260525_3857.gml`

2. **Styl QML:**
   - `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Działki starostwo 26.05.25_style.qml`

---

## 🚀 Metoda 1: Import przez API (ZALECANA - szybka i automatyczna)

### Krok 1: Pobierz token uwierzytelniający

1. Otwórz http://localhost:3000 w przeglądarce
2. Zaloguj się do aplikacji
3. Naciśnij **F12** (DevTools)
4. Przejdź do zakładki **Console**
5. Wpisz:
   ```javascript
   localStorage.getItem('authToken')
   ```
6. Skopiuj zwrócony token (bez cudzysłowów)

### Krok 2: Uruchom skrypt importu

Otwórz **nowy terminal** i uruchom:

```bash
cd C:\Users\Bartosz\Desktop\Universe-MapMaker.online
node import-layer-api.mjs TWÓJ_TOKEN_TUTAJ
```

**Przykład:**
```bash
node import-layer-api.mjs 1234567890abcdef1234567890abcdef12345678
```

### Krok 3: Sprawdź wynik

Skrypt automatycznie:
1. ✅ Zaimportuje plik GML jako nową warstwę "Działki Kolbudy Import"
2. ✅ Zastosuje styl QML do tej warstwy
3. ✅ Wyświetli ID nowej warstwy

Odśwież stronę http://localhost:3000/map?project=Wyszki aby zobaczyć nową warstwę!

---

## 🖱️ Metoda 2: Import ręcznie przez UI (dłuższa, ale pewna)

### Import warstwy GML:

1. Otwórz http://localhost:3000/map?project=Wyszki
2. W panelu warstw po lewej stronie kliknij przycisk **"Importuj warstwę"**
3. Wybierz zakładkę **"gml"**
4. Wypełnij formularz:
   - **Nazwa warstwy:** `Działki Kolbudy`
   - **Nazwa grupy:** `Stwórz poza grupami`
5. Przeciągnij plik GML lub kliknij "Upuść plik tutaj...":
   - **Plik:** `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Działki starostwo 260525_3857.gml`
6. Kliknij **"Import"**
7. Poczekaj na zakończenie importu (może potrwać 1-2 minuty)

### Import stylu QML:

1. W panelu warstw znajdź nowo zaimportowaną warstwę "Działki Kolbudy"
2. Kliknij prawym przyciskiem myszy → **"Właściwości"**
3. Przejdź do zakładki **"Styl"**
4. Kliknij **"Importuj styl"** lub **"Wczytaj styl"**
5. Wybierz plik QML:
   - **Plik:** `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Działki starostwo 26.05.25_style.qml`
6. Kliknij **"Zastosuj"**
7. Odśwież mapę, aby zobaczyć nowy styl

---

## 📂 Inne znalezione pliki

Dodatkowo znalazłem następujące pliki, które mogą być przydatne:

### Budynki (Shapefile):
- `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\Budynki ze starostwa 2602_3857\Budynki_ze_starostwa_26.02_3857.shp`
  + .shx, .dbf, .prj

### Strefa Planistyczna (Shapefile):
- `C:\Users\Bartosz\Desktop\Przykładowe QGIS\Kolbudy\StrefaPlanistyczna_3857\StrefaPlanistyczna_3857.shp`
  + .shx, .dbf, .prj
  + Styl: `StrefaPlanistyczna_style (1).qml`

### Akty Planowania Przestrzennego (GeoJSON):
- `AktPlanowaniaPrzestrzennego_Zbiór APP od 26_05_25_3857.geojson`
- `DokumentFormalny_Zbiór APP od 26_05_25_3857.geojson`
- `RysunekAktuPlanowaniaPrzestrzennego_Zbiór APP od 26_05_25_3857.geojson`

### Centra logistyczne (GML):
- `C:\Users\Bartosz\Documents\Centra logistyczne.gml`

---

## 🛠️ Narzędzia zainstalowane

✅ Wszystkie wymagane narzędzia są już zainstalowane:

1. **Playwright** - automatyzacja przeglądarki (już w projekcie)
2. **form-data** - obsługa FormData w Node.js (✅ zainstalowano)
3. **node-fetch** - wywołania HTTP w Node.js (✅ zainstalowano)

Nie musisz instalować żadnych dodatkowych programów!

---

## ❓ Rozwiązywanie problemów

### Problem: Skrypt zwraca "❌ Błąd API (400)"

**Przyczyna:** Plik GML może mieć nieprawidłowy format lub CRS.

**Rozwiązanie:**
1. Sprawdź, czy plik GML otwiera się poprawnie w QGIS Desktop
2. Jeśli tak, wyeksportuj ponownie do GML z EPSG:3857
3. Spróbuj ponownie

### Problem: Skrypt zwraca "❌ Błąd: Plik nie istnieje"

**Przyczyna:** Ścieżka do pliku jest nieprawidłowa.

**Rozwiązanie:**
1. Otwórz `import-layer-api.mjs` w edytorze
2. Znajdź sekcję `CONFIG` (linie 11-25)
3. Zmień ścieżki na poprawne:
   ```javascript
   gmlFile: {
     path: 'C:\\Users\\Bartosz\\Desktop\\TWOJA_ŚCIEŻKA\\plik.gml',
     // ...
   }
   ```
4. Zapisz i uruchom ponownie

### Problem: Import warstwy działa, ale styl QML nie

**Przyczyna:** Backend może zwrócić błąd przy przetwarzaniu QML.

**Rozwiązanie:**
1. Zaimportuj styl ręcznie przez UI (Metoda 2)
2. Sprawdź logi backendu:
   ```bash
   docker logs universe-mapmaker-backend_django_1 | tail -50
   ```
3. Poszukaj błędów związanych z QML parsing

---

## 📊 Co dalej?

Po zaimportowaniu warstwy "Działki Kolbudy":

1. ✅ Warstwa pojawi się w panelu warstw
2. ✅ Będzie miała zastosowany styl QML (różne kolory dla różnych działek)
3. ✅ Będzie dostępna w bazie danych PostgreSQL
4. ✅ Błędy konsoli 400 (ParcelSearchTab) znikną dla tej warstwy

**Opcjonalnie:** Możesz zaimportować również inne znalezione warstwy (Budynki, Strefa Planistyczna) używając tej samej metody.

---

**Autor:** Claude Code
**Data:** 2025-11-13
**Projekt:** Universe MapMaker Online
