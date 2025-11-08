# Zarządzanie Kolumnami w Tabeli Atrybutów

**Data:** 2025-11-09
**Funkcjonalność:** ColumnManagerModal - przyjazny interfejs do zarządzania widocznością kolumn

---

## Jak używać?

### Metoda 1: Przez PropertiesPanel (ZALECANE)

1. **Kliknij warstwę** w drzewie warstw (LeftPanel)
2. **Otwórz sekcję "Tabela atrybutów"** w PropertiesPanel (rozwiń accordion)
3. **Kliknij "Otwórz tabelę"** - tabela atrybutów otworzy się na dole ekranu
4. **Kliknij ikonę kolumn** w toolbarze tabeli (ViewWeek icon) aby otworzyć menedżer kolumn

### Metoda 2: Bezpośrednio z toolbara tabeli

1. Kliknij warstwę w drzewie warstw
2. W toolbarze tabeli atrybutów (górny pasek), kliknij przycisk **"Zarządzaj kolumnami"** (ikona kolumn)

**Lokalizacja:**
Toolbar → [Dodaj] [Zapisz] [Anuluj] | [Eksportuj] **[Zarządzaj kolumnami]** | [Wyszukaj...]

### 3. Zarządzaj widocznością kolumn

Modal pokaże wszystkie kolumny podzielone na 3 grupy:

#### 📐 **Geometria**
- `geom`, `geometry`, `wkb_geometry` - kolumny geometryczne (zwykle ukryte)

#### 📊 **Metadane**
- `ogc_fid`, `gid`, `fid`, `id` - ID techniczne
- `lokalnyId`, `wersjaId` - metadane BDOT10k
- `poczatekWersjiObiektu`, `obowiazujeOd`, `koniecWersjiObiektu` - daty wersji

#### 🗂️ **Atrybuty**
- `descript_1`, `descript_2`, `symbol` - dane właściwe warstwy
- Wszystkie inne kolumny biznesowe

### 4. Funkcje modala

**Wyszukiwanie:**
- Wpisz nazwę kolumny aby szybko ją znaleźć
- Działa na nazwach kolumn i nagłówkach

**Szybkie akcje:**
- **Zaznacz wszystkie** - pokazuje wszystkie kolumny (domyślnie)
- **Odznacz wszystkie** - ukrywa wszystkie kolumny

**Licznik:**
- Widoczny na górze: `12/45 widocznych`
- Pokazuje ile kolumn jest aktualnie włączonych

**Grupowanie:**
- Każda grupa ma licznik: `Geometria (0/3)`, `Metadane (5/12)`, `Atrybuty (7/30)`

### 5. Zapisz zmiany

Kliknij **"Zastosuj"** aby zapisać widoczność kolumn.

Widoczność jest zapisywana automatycznie w **localStorage** dla każdej warstwy osobno!

---

## Kluczowe cechy UX

### ✅ Czytelność
- **Modal zamiast dropdown** - nie zasłania tabeli, można skupić się na wyborze
- **Długie nazwy kolumn widoczne** - np. `minUdzialPowierzchniBiologiczneCzynnej` nie jest obcięte
- **Grupowanie** - łatwe znalezienie metadanych vs atrybutów

### ✅ Wygoda
- **Duże checkboxy** - łatwe klikanie na mobile i desktop
- **Hover highlight** - wiersz podświetla się przy najechaniu
- **Ikona oka** - widoczna przy ukrytych kolumnach

### ✅ Szybkość
- **Wyszukiwanie** - szybkie filtrowanie bez scrollowania
- **Zaznacz wszystkie** - jeden klik zamiast 45 kliknięć
- **Persistence** - widoczność zapisuje się automatycznie

---

## Przykładowe workflow

### Scenariusz 1: Ukryj metadane, pokaż tylko atrybuty
1. Otwórz menedżer kolumn
2. Kliknij **"Odznacz wszystkie"**
3. Zaznacz tylko kolumny z grupy **"Atrybuty"**
4. Kliknij **"Zastosuj"**

**Rezultat:** Tabela pokazuje tylko `descript_1`, `descript_2`, `symbol` itp. - czytelniej dla użytkownika końcowego.

### Scenariusz 2: Znajdź kolumnę o długiej nazwie
1. Otwórz menedżer kolumn
2. Wpisz w wyszukiwarkę: `biologiczne`
3. Pojawi się: `minUdzialPowierzchniBiologiczneCzynnej`
4. Zaznacz checkbox
5. Kliknij **"Zastosuj"**

**Rezultat:** Znalazłeś kolumnę w 5 sekund zamiast scrollować przez 45 kolumn.

### Scenariusz 3: Reset do domyślnych
1. Otwórz menedżer kolumn
2. Kliknij **"Zaznacz wszystkie"**
3. Kliknij **"Zastosuj"**

**Rezultat:** Wszystkie kolumny widoczne (domyślny stan).

---

## Persistence (localStorage)

**Klucz:** `attributeTable_{layerId}_columnVisibility`

**Format:**
```json
{
  "ogc_fid": false,
  "gid": false,
  "descript_1": true,
  "descript_2": true,
  "symbol": true
}
```

**Zachowanie:**
- Widoczność zapisuje się **per warstwa** (każda warstwa ma własne ustawienia)
- Zmiana projektu **nie wpływa** na widoczność w innym projekcie
- Wyczyść localStorage aby zresetować do domyślnych

---

## Różnice vs stary interfejs (MUI Column Menu)

| Feature | Stary MUI Menu | Nowy ColumnManagerModal |
|---------|----------------|-------------------------|
| **Miejsce** | Dropdown (zasłania tabelę) | Modal (dedykowane okno) |
| **Długie nazwy** | Obcięte (`minUdzial...`) | Pełne (`minUdzialPowierzchniBiologiczneCzynnej`) |
| **Grupowanie** | Brak | Geometria / Metadane / Atrybuty |
| **Wyszukiwanie** | Brak | Tak (instant filter) |
| **Zaznacz wszystkie** | Brak | Tak (1 klik) |
| **Licznik** | Brak | Tak (`12/45 widocznych`) |
| **Touch friendly** | Małe checkboxy | Duże touch targets |
| **Pozycja** | Rozwija się w dół | Centrum ekranu (modal) |

---

## Implementacja techniczna

**Pliki:**
- `src/features/layers/components/ColumnManagerModal.tsx` - komponent modala
- `src/features/layers/components/AttributeTablePanel.tsx` - integracja + przycisk

**Props:**
```typescript
interface ColumnManagerModalProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnInfo[];
  visibilityModel: GridColumnVisibilityModel;
  onVisibilityChange: (model: GridColumnVisibilityModel) => void;
}

interface ColumnInfo {
  field: string;
  headerName: string;
  group: 'geometry' | 'metadata' | 'attributes';
}
```

**State:**
- `columnManagerOpen` - czy modal jest otwarty
- `columnVisibilityModel` - stan widoczności (z DataGrid)
- `localVisibility` - lokalny stan w modalu (przed Apply)

**Persistence:**
```typescript
localStorage.setItem(
  `attributeTable_${layerId}_columnVisibility`,
  JSON.stringify(newModel)
);
```

---

## Testy

**Checklist:**
- [x] Modal otwiera się po kliknięciu przycisku
- [x] Wyszukiwanie działa (filtruje kolumny)
- [x] "Zaznacz wszystkie" / "Odznacz wszystkie" działa
- [x] Grupowanie kolumn (geometria, metadane, atrybuty)
- [x] Licznik widocznych kolumn (`12/45`)
- [x] Apply zapisuje widoczność w localStorage
- [x] Cancel przywraca poprzedni stan
- [x] Persistence - widoczność zapisuje się po odświeżeniu

**Następne kroki:**
1. Przetestuj na mobile (touch targets)
2. Przetestuj z 100+ kolumnami (scrollowanie w modalu)
3. Dodaj keyboard shortcuts (Ctrl+K do otwarcia modala?)

---

**Status:** ✅ Kompletny i gotowy do użycia!
**Data kompilacji:** 2025-11-09 00:20
**Brak błędów TypeScript:** ✅
