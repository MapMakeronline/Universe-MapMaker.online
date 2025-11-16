# Wypis z Rejestru Gruntów - User Guide

## 📄 Co to jest Wypis?

**Wypis z rejestru gruntów** to dokument zawierający informacje o przeznaczeniu działki zgodnie z miejscowym planem zagospodarowania przestrzennego (MPZP).

### Zawartość wypisu:

1. **Nagłówek** - Obręb i numer działki
2. **Ustalenia ogólne** - Przepisy ogólne MPZP (opcjonalnie)
3. **Przeznaczenia** - Lista stref planistycznych nakładających się na działkę
   - Nazwa strefy (np. "Mieszkaniowe", "SC", "SG")
   - Procent pokrycia działki
4. **Ustalenia końcowe** - Przepisy końcowe MPZP (opcjonalnie)
5. **Rysunek obrysu** - Mapa działki z zaznaczonymi strefami
6. **Legenda** - Objaśnienia symboli (opcjonalnie)

---

## 🔄 Nowy Workflow z Podglądem

### Krok 1: Wybierz konfigurację

1. Otwórz projekt na mapie
2. Kliknij przycisk **"Generuj wypis i wyrys"**
3. Z listy wybierz konfigurację MPZP

### Krok 2: Wybierz działki z mapy

1. Kliknij na działkę na mapie
2. System automatycznie:
   - Pobierze obręb i numer działki
   - Wykryje nakładające się strefy planistyczne
   - Doda działkę do listy
3. Możesz wybrać wiele działek (do wspólnego wypisu)

### Krok 3: Wygeneruj dokument

1. Kliknij przycisk **"Generuj wypis"**
2. Poczekaj na wygenerowanie (5-15 sekund)
3. Automatycznie otworzy się **okno podglądu**

### Krok 4: Podgląd i pobranie

#### Dla użytkowników zalogowanych (właścicieli projektu):

- ✅ **Plik PDF** (tylko do odczytu)
- ✅ Podgląd PDF w przeglądarce (iframe)
- ✅ Przycisk "Pobierz plik" → zapisuje PDF

#### Dla użytkowników anonimowych (goście):

- ✅ **Plik DOCX** (edytowalny)
- ✅ Informacja o formacie DOCX
- ✅ Przycisk "Pobierz plik" → zapisuje DOCX

---

## 📦 Format plików

### PDF (użytkownicy zalogowani)

**Właściwości:**
- ✅ Tylko do odczytu (nie można edytować)
- ✅ Uniwersalny format (otwiera się w każdej przeglądarce)
- ✅ Zachowane formatowanie
- ✅ Polskie znaki UTF-8
- ✅ Znak wodny (dla użytkowników niezalogowanych będących właścicielami)

**Jak otworzyć:**
- Adobe Acrobat Reader
- Przeglądarka (Chrome, Firefox, Edge)
- Microsoft Edge
- Foxit Reader

### DOCX (użytkownicy anonimowi)

**Właściwości:**
- ✅ Edytowalny (można modyfikować tekst, formatowanie)
- ✅ Format Microsoft Word
- ✅ Polskie znaki UTF-8
- ✅ Zachowane style i obrazy

**Jak otworzyć:**
- Microsoft Word (2007+)
- LibreOffice Writer
- Google Docs (online)
- WPS Office
- Apache OpenOffice

---

## 🛠️ Funkcje podglądu

### Okno podglądu zawiera:

1. **Ikona pliku** - PDF (czerwona) lub DOCX (niebieska)
2. **Nazwa pliku** - Automatycznie generowana: `wypis_[numer]_[timestamp].pdf/docx`
3. **Typ dokumentu** - "Dokument PDF (tylko do odczytu)" lub "Dokument Word (edytowalny)"
4. **Rozmiar pliku** - Wyświetlany w KB lub MB
5. **Podgląd PDF** - Tylko dla użytkowników zalogowanych (iframe)
6. **Status użytkownika** - Zalogowany → PDF, Anonimowy → DOCX

### Przyciski:

- **"Anuluj"** - Zamyka podgląd bez pobierania
- **"Pobierz plik"** - Zapisuje plik w folderze Downloads

---

## 🐛 Rozwiązywanie problemów

### Problem: Plik DOCX nie otwiera się

**Możliwe przyczyny:**
1. Brak programu obsługującego DOCX
2. Uszkodzony plik (stara wersja backendu)

**Rozwiązanie:**
1. Zainstaluj Microsoft Word, LibreOffice lub Google Docs
2. Jeśli plik jest uszkodzony:
   - Sprawdź czy backend ma najnowszą wersję (po 2025-11-16)
   - Wygeneruj wypis ponownie

### Problem: PDF pokazuje błąd "File cannot be opened"

**Możliwa przyczyna:** Brak znacznika EOF (stara wersja backendu)

**Rozwiązanie:**
1. Sprawdź czy backend ma poprawkę (po 2025-11-16)
2. Wygeneruj wypis ponownie
3. Jeśli błąd się powtarza, zgłoś do administratora

### Problem: Polskie znaki wyglądają dziwnie (���)

**Możliwa przyczyna:** Nieprawidłowe kodowanie (stara wersja backendu)

**Rozwiązanie:**
1. Backend po 2025-11-16 ma naprawione UTF-8
2. Wygeneruj wypis ponownie
3. DOCX automatycznie używa UTF-8 (polskie znaki powinny działać)

### Problem: Podgląd PDF nie działa

**Możliwe przyczyny:**
1. Przeglądarka blokuje iframe
2. Popup blocker

**Rozwiązanie:**
1. Wyłącz popup blocker dla `universemapmaker.online`
2. Użyj przycisku "Pobierz plik" i otwórz lokalnie

---

## 🔒 Różnice dla użytkowników

| Funkcja | Użytkownik zalogowany | Użytkownik anonimowy |
|---------|----------------------|----------------------|
| Format pliku | PDF (tylko odczyt) | DOCX (edytowalny) |
| Podgląd w przeglądarce | ✅ Tak (iframe) | ❌ Nie (info o DOCX) |
| Edycja dokumentu | ❌ Nie | ✅ Tak |
| Znak wodny | ❌ Nie | ⚠️ Może być (jeśli właściciel niezalogowany) |
| Zachowane formatowanie | ✅ Tak | ✅ Tak |
| Polskie znaki UTF-8 | ✅ Tak | ✅ Tak |

---

## 📚 Przykłady użycia

### Przykład 1: Architekt projektujący dom

**Cel:** Sprawdzić dopuszczalne przeznaczenie działki przed projektem

**Workflow:**
1. Zaloguj się → plik PDF
2. Kliknij działkę na mapie
3. Generuj wypis
4. Podgląd PDF w przeglądarce
5. Pobierz PDF do archiwum projektu

### Przykład 2: Klient sprawdzający działkę

**Cel:** Uzyskać dokument edytowalny do przesłania inwestorowi

**Workflow:**
1. Otwórz projekt (bez logowania) → plik DOCX
2. Kliknij działkę na mapie
3. Generuj wypis
4. Podgląd info o DOCX
5. Pobierz DOCX
6. Otwórz w Word/LibreOffice
7. Edytuj tekst (np. dodaj notatkę)
8. Wyślij inwestorowi

### Przykład 3: Urząd gminy generujący wypisy

**Cel:** Masowe generowanie wypisów dla wielu działek

**Workflow:**
1. Zaloguj się → plik PDF
2. Kliknij pierwszą działkę → Generuj → Pobierz
3. Kliknij drugą działkę → Generuj → Pobierz
4. ...powtórz dla wszystkich działek
5. Wydrukuj wszystkie PDF-y

---

## ⚙️ Wymagania techniczne

### Backend:
- ✅ Django REST Framework
- ✅ python-docx (generowanie DOCX)
- ✅ PyPDF2 (generowanie PDF)
- ✅ FPDF (dodawanie map do PDF)
- ✅ Poprawka z 2025-11-16 (naprawia uszkodzone pliki)

### Frontend:
- ✅ React 19
- ✅ Material-UI v5
- ✅ WypisPreviewModal component
- ✅ WypisGenerateDialog component

### Przeglądarka:
- Chrome 100+
- Firefox 95+
- Edge 100+
- Safari 15+

---

## 🔄 Changelog

### 2025-11-16: MAJOR FIX - Uszkodzone pliki naprawione

**Backend changes:**
- ✅ Naprawiono: Pliki były usuwane przed wysłaniem HTTP response
- ✅ Naprawiono: `Content-Disposition: inline` → `attachment`
- ✅ DOCX: Poprawione kodowanie UTF-8
- ✅ PDF: Dodano znacznik EOF

**Frontend changes:**
- ✅ Dodano: WypisPreviewModal - podgląd przed pobraniem
- ✅ Dodano: Automatyczne wykrywanie typu pliku (PDF/DOCX)
- ✅ Dodano: Podgląd PDF w iframe (użytkownicy zalogowani)
- ✅ Dodano: Informacje o formacie DOCX (użytkownicy anonimowi)

### Przed 2025-11-16: Wersja z bugami

**Problemy:**
- ❌ DOCX: Zepsute polskie znaki, uszkodzony ZIP
- ❌ PDF: Brak znacznika EOF, nie można otworzyć
- ❌ Pobieranie: Plik próbowany otwierać inline (nie download)

---

## 📞 Kontakt

Jeśli masz problemy z generowaniem wypisu:

1. Sprawdź wersję backendu (powinna być po 2025-11-16)
2. Sprawdź logi przeglądarki (F12 → Console)
3. Zgłoś problem z kodem błędu do administratora

**Dokumentacja techniczna:**
- Backend fix: `BACKEND-WYPIS-FIX.md`
- Deployment script: `fix-backend-wypis.sh`
- Component code: `src/features/wypis/components/WypisPreviewModal.tsx`
