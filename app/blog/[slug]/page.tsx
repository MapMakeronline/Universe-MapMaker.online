'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter, useParams } from 'next/navigation';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import PublicNavbar from '@/components/navigation/PublicNavbar';

const blogPosts: Record<string, {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
  category: string;
}> = {
  'jak-stworzyc-pierwsza-mape': {
    id: 1,
    title: 'Jak stworzyć pierwszą mapę w Universe MapMaker',
    content: `
# Wprowadzenie

Tworzenie interaktywnych map nigdy nie było prostsze! W tym przewodniku pokażemy Ci krok po kroku, jak stworzyć swoją pierwszą mapę w Universe MapMaker.

## Krok 1: Rejestracja konta

Pierwszym krokiem jest utworzenie darmowego konta na platformie. Wystarczy podać:
- Adres e-mail
- Nazwę użytkownika
- Bezpieczne hasło

Po weryfikacji adresu e-mail będziesz mógł w pełni korzystać z platformy.

## Krok 2: Tworzenie nowego projektu

W panelu Dashboard kliknij przycisk "+ Nowy Projekt". Otworzy się formularz, w którym należy wypełnić:

1. **Nazwa projektu** - wybierz opisową nazwę (np. "Moja pierwsza mapa")
2. **Kategoria** - wybierz odpowiednią kategorię (np. Turystyka, Edukacja, Biznes)
3. **Opis** (opcjonalnie) - dodaj krótki opis projektu

## Krok 3: Wybór mapy podkładowej

Universe MapMaker oferuje kilka stylów map:
- **Streets** - klasyczna mapa ulic
- **Satellite** - zdjęcia satelitarne
- **Outdoors** - mapa terenowa
- **3D Buildings** - mapa z budynkami 3D
- **Full 3D** - pełna mapa 3D z terenem

Możesz zmienić styl w dolnej części lewego panelu.

## Krok 4: Dodawanie warstw

Kliknij przycisk "+" w lewym panelu, aby dodać warstwę:
- **Import pliku** - prześlij GeoJSON, Shapefile, KML
- **WMS/WFS** - połącz się z zewnętrznym serwerem
- **Rysowanie** - narysuj własne obiekty na mapie

## Krok 5: Edycja i stylizacja

Dla każdej warstwy możesz:
- Zmienić kolor i przezroczystość
- Dostosować kolejność wyświetlania (przeciąganie)
- Dodać etykiety i opisy
- Skonfigurować popup z informacjami

## Krok 6: Publikacja

Gdy mapa jest gotowa, możesz ją opublikować:
1. Kliknij "Opublikuj projekt"
2. Wybierz unikalną subdomenę (np. mojamapa.universemapmaker.online)
3. Ustaw widoczność (publiczna/prywatna)
4. Kliknij "Opublikuj"

Gotowe! Twoja mapa jest teraz dostępna online i możesz się nią dzielić z innymi.

## Podsumowanie

Gratulacje! Właśnie stworzyłeś swoją pierwszą interaktywną mapę. To dopiero początek - eksperymentuj z różnymi narzędziami i funkcjami, aby tworzyć jeszcze bardziej zaawansowane projekty.
    `,
    date: '2024-03-15',
    author: 'Jan Kowalski',
    category: 'Tutorial',
  },
  'nowosci-wersja-2-0': {
    id: 2,
    title: 'Nowości w Universe MapMaker - wersja 2.0',
    content: `
# Universe MapMaker 2.0 - Co nowego?

Z przyjemnością ogłaszamy wydanie wersji 2.0 platformy Universe MapMaker! Oto najważniejsze nowości:

## 🎨 Ulepszone narzędzia rysowania

- **Nowe kształty** - prostokąty, okręgi, wielokąty niestandardowe
- **Edycja wierzchołków** - przeciągnij wierzchołki aby zmienić kształt
- **Kopiowanie obiektów** - powiel obiekty jednym kliknięciem
- **Grupowanie** - organizuj obiekty w grupy

## 🏗️ Rozszerzona obsługa 3D

- **Pełne 3D** - teren, budynki i atmosfera w jednym trybie
- **Kontrola wysokości** - dostosuj wysokość budynków
- **Niestandardowe modele 3D** - importuj własne modele
- **Oświetlenie** - realistyczne cienie i odbicia

## 📊 Nowe typy warstw

- **Mapy ciepła** - wizualizuj gęstość danych
- **Klastry** - grupuj punkty dla lepszej czytelności
- **Animowane warstwy** - pokaż zmiany w czasie
- **Wykresy na mapie** - wyświetlaj dane statystyczne

## 🚀 Wydajność i optymalizacja

- **50% szybsze ładowanie** map
- **Rendering po stronie serwera** - lepsze SEO
- **Progressive Web App** - działanie offline
- **Cache warstw** - szybsze ponowne ładowanie

## 🔧 Integracje

- **Google Drive** - zapisuj projekty w chmurze
- **Zapier** - automatyzuj przepływy pracy
- **REST API** - integruj z własnymi aplikacjami
- **Webhooks** - otrzymuj powiadomienia o zmianach

## 📱 Mobilne ulepszenia

- **Dotykowe gesty 3D** - intuicyjna kontrola na telefonie
- **Offline editing** - edytuj bez internetu
- **GPS tracking** - śledzenie lokalizacji w czasie rzeczywistym
- **Kompas** - nawigacja z wykorzystaniem czujników

## 🔐 Bezpieczeństwo

- **Dwuskładnikowa autoryzacja (2FA)**
- **Szyfrowanie end-to-end**
- **Role i uprawnienia** - precyzyjna kontrola dostępu
- **Audit log** - pełna historia zmian

Zaktualizuj platformę już dziś i odkryj nowe możliwości!
    `,
    date: '2024-03-10',
    author: 'Anna Nowak',
    category: 'Aktualności',
  },
  'integracja-qgis': {
    id: 3,
    title: 'Integracja z QGIS - pełna instrukcja',
    content: `
# Integracja Universe MapMaker z QGIS

QGIS to najpopularniejsze darmowe oprogramowanie GIS. Universe MapMaker oferuje pełną integrację z projektami QGIS.

## Dlaczego QGIS?

- **Darmowe i open-source**
- **Zaawansowane narzędzia analityczne**
- **Obsługa wszystkich formatów GIS**
- **Aktywna społeczność**

## Import projektu QGIS

### Krok 1: Przygotowanie projektu w QGIS

1. Otwórz swój projekt w QGIS Desktop
2. Sprawdź czy wszystkie warstwy się prawidłowo wczytują
3. Zapisz projekt jako .qgs lub .qgz
4. Upewnij się że ścieżki do plików są względne (nie bezwzględne)

### Krok 2: Import do Universe MapMaker

1. W Dashboard kliknij "+ Nowy Projekt"
2. Wybierz zakładkę "Import QGIS"
3. Przeciągnij plik .qgs lub .qgz
4. Poczekaj na przetworzenie (duże projekty mogą zająć kilka minut)

### Co zostaje zaimportowane?

- ✅ Wszystkie warstwy wektorowe
- ✅ Style i symbologie
- ✅ Kolory i przezroczystości
- ✅ Etykiety (labels)
- ✅ Filtry i wyrażenia
- ✅ Kompozycje map (layouts)

### Co NIE jest obsługiwane?

- ❌ Pluginy specyficzne dla QGIS Desktop
- ❌ Skrypty Python
- ❌ Niektóre zaawansowane style (SLD)
- ❌ Relacje między tabelami (w wersji beta)

## Export z Universe MapMaker do QGIS

Możesz też eksportować projekty w drugą stronę:

1. Otwórz projekt w Universe MapMaker
2. Kliknij "Ustawienia projektu"
3. Wybierz "Eksportuj jako QGIS"
4. Pobierz plik .qgz
5. Otwórz w QGIS Desktop

## QGIS Server

Universe MapMaker korzysta z QGIS Server do renderowania warstw:

- **WMS** - Web Map Service (obrazy)
- **WFS** - Web Feature Service (wektory)
- **WCS** - Web Coverage Service (rastry)

Wszystkie standardy OGC są wspierane!

## Najlepsze praktyki

### 1. Używaj względnych ścieżek

❌ Źle:
\`\`\`
C:/Users/Jan/Documents/warstwy/budynki.shp
\`\`\`

✅ Dobrze:
\`\`\`
./warstwy/budynki.shp
\`\`\`

### 2. Optymalizuj warstwy

- Usuń zbędne pola z tabel atrybutów
- Generalizuj geometrie dla małych skal
- Używaj indeksów przestrzennych
- Kompresuj rastry

### 3. Testuj przed importem

- Sprawdź projekt w QGIS Desktop
- Upewnij się że wszystko się renderuje
- Zapisz jako .qgz (skompresowany format)

## Rozwiązywanie problemów

**Problem: Warstwy nie importują się**
- Sprawdź format plików (obsługiwane: GeoJSON, Shapefile, GeoPackage)
- Zweryfikuj CRS (układ współrzędnych)

**Problem: Style się nie zachowują**
- Użyj prostszych styli (niektóre zaawansowane style nie są wspierane)
- Sprawdź czy używasz obsługiwanych typów symboli

**Problem: Import trwa bardzo długo**
- Projekty >100MB mogą wymagać 5-10 minut
- Sprawdź czy masz stabilne połączenie internetowe

## Podsumowanie

Integracja z QGIS otwiera nieograniczone możliwości! Możesz przygotować zaawansowane analizy w QGIS Desktop, a następnie opublikować je jako interaktywne mapy webowe w Universe MapMaker.
    `,
    date: '2024-03-05',
    author: 'Piotr Wiśniewski',
    category: 'Tutorial',
  },
  'mapowanie-3d': {
    id: 4,
    title: 'Mapowanie 3D - najlepsze praktyki',
    content: `
# Mapowanie 3D - Przewodnik

Mapy 3D dodają nowy wymiar do Twoich projektów. Oto kompletny przewodnik po mapowaniu 3D.

## Dlaczego 3D?

- **Lepsze zrozumienie terenu** - wysokości i ukształtowanie
- **Realistyczna wizualizacja** - budynki i konstrukcje
- **Większe zaangażowanie** - interaktywność przyciąga uwagę
- **Profesjonalny wygląd** - nowoczesna prezentacja danych

## Tryby 3D w Universe MapMaker

### 1. 3D Buildings (Budynki 3D)
- Ekstrudowane budynki z OpenStreetMap
- Automatyczna wysokość bazująca na liczbie pięter
- Działa od zoomu 15+
- Lekki i wydajny

### 2. Full 3D (Pełne 3D)
- **Teren** - model wysokościowy Mapbox Terrain
- **Budynki** - ekstrudowane 3D
- **Niebo** - atmosferyczna warstwa skybox
- **Cienie** - realistyczne oświetlenie

## Kontrola kamery 3D

### Desktop:
- **Obracanie**: Ctrl + przeciągnij myszą
- **Pochylenie**: Ctrl + Shift + przeciągnij
- **Zoom**: Scroll lub +/-

### Mobile/Tablet:
- **Obracanie**: Przeciągnij dwoma palcami
- **Pochylenie**: Przesuń w górę/dół dwoma palcami
- **Zoom**: Pinch (uszczypnięcie)

## Optymalizacja wydajności

### 1. Poziomy szczegółowości (LOD)

\`\`\`javascript
// Wyświetlaj szczegóły tylko na dużym zoomie
{
  'minzoom': 15,  // Budynki od zoomu 15
  'maxzoom': 22   // Maksymalna szczegółowość
}
\`\`\`

### 2. Terrain vs Buildings

- **Teren** - widoczny zawsze (zoom 0-22)
- **Budynki** - widoczne od zoom 15+
- Redukuje obciążenie na małych skalach

### 3. Batching i culling

Universe MapMaker automatycznie:
- Grupuje budynki (batching)
- Ukrywa niewidoczne obiekty (frustum culling)
- Ładuje kafelki progresywnie

## Własne modele 3D

### Obsługiwane formaty:
- **glTF 2.0** (.gltf, .glb) - zalecany
- **OBJ** - prosty format
- **Collada** (.dae) - z animacjami

### Import modelu:

1. Przygotuj model w Blender/3ds Max
2. Wyeksportuj jako glTF 2.0
3. W Universe MapMaker: "Dodaj obiekt 3D"
4. Ustaw pozycję i rotację
5. Dostosuj skalę

### Najlepsze praktyki modelowania:

- ✅ Niska poligonalność (< 10k trójkątów)
- ✅ Tekstury skompresowane (WebP, JPEG)
- ✅ Jeden materiał na model (jeśli możliwe)
- ❌ Unikaj przezroczystości (wolne)
- ❌ Unikaj zbyt wielu materiałów

## Wysokości budynków

### Z danych OSM:
\`\`\`javascript
// Automatyczna wysokość z building:levels
height = building.levels * 3.5  // metrów
\`\`\`

### Własne wysokości:
\`\`\`javascript
// Ustaw w atrybutach warstwy
{
  "building_height": 45,  // metry
  "min_height": 0         // wysokość podstawy
}
\`\`\`

## Kolorowanie i style

### Gradient wysokości:
\`\`\`javascript
{
  'fill-extrusion-color': [
    'interpolate',
    ['linear'],
    ['get', 'height'],
    0, '#fef0d9',      // niska - jasny
    50, '#fc8d59',     // średnia - pomarańczowy
    100, '#b30000'     // wysoka - czerwony
  ]
}
\`\`\`

### Material properties:
- **Base color** - kolor podstawowy
- **Metallic** - metaliczność (0-1)
- **Roughness** - chropowatość (0-1)
- **Ambient occlusion** - cieniowanie otoczenia

## Oświetlenie

Universe MapMaker wspiera:
- **Directional light** - słońce (kierunkowe)
- **Ambient light** - światło otoczenia
- **Dynamic shadows** - dynamiczne cienie

Pozycja słońca zmienia się z porą dnia (jeśli włączone).

## Przykładowe zastosowania

### 1. Analiza zabudowy
- Wizualizacja gęstości budynków
- Analiza cieni (solar analysis)
- Planowanie urbanistyczne

### 2. Turystyka
- Wirtualne spacery
- Atrakcje 3D
- Interaktywne przewodniki

### 3. Nieruchomości
- Prezentacja inwestycji
- Wizualizacje deweloperskie
- Analiza widoków

### 4. Edukacja
- Geografia fizyczna
- Historia architektury
- Symulacje geologiczne

## Rozwiązywanie problemów

**Problem: Budynki nie wyświetlają się**
- Sprawdź czy zoom >= 15
- Upewnij się że tryb 3D jest włączony
- Zrestartuj przeglądarkę

**Problem: Niska wydajność**
- Zmniejsz ilość widocznych warstw
- Ogranicz zoom (mniej detali)
- Wyłącz cienie jeśli nie potrzebne
- Użyj lekkiego stylu mapy

**Problem: Model 3D nie ładuje się**
- Sprawdź format (glTF 2.0 zalecany)
- Zweryfikuj rozmiar (< 10MB)
- Upewnij się że tekstury są dołączone

## Podsumowanie

Mapowanie 3D to potężne narzędzie wizualizacji. Używaj mądrze - zbyt wiele efektów może przytłoczyć użytkownika. Znajdź balans między estetyką a użytecznością!

Miłego mapowania! 🗺️
    `,
    date: '2024-02-28',
    author: 'Katarzyna Lewandowska',
    category: 'Poradnik',
  }
};

export default function BlogPostPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const post = blogPosts[slug];

  if (!post) {
    return (
      <Box sx={{ pt: 10, pb: 8, textAlign: 'center' }}>
        <Typography variant="h4">Artykuł nie znaleziony</Typography>
        <Button onClick={() => router.push('/blog')} sx={{ mt: 2 }}>
          Powrót do bloga
        </Button>
      </Box>
    );
  }

  return (
    <>
      {/* Header */}
      <PublicNavbar title="Blog" />

      {/* Main content */}
      <Box sx={{ pt: 10, pb: 8, bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Paper sx={{ p: { xs: 3, md: 5 } }}>
            {/* Category chip */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label={post.category}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 500
                }}
              />
            </Box>

            {/* Title */}
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 3
              }}
            >
              {post.title}
            </Typography>

            {/* Meta info */}
            <Box sx={{
              display: 'flex',
              gap: 3,
              mb: 4,
              pb: 3,
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {new Date(post.date).toLocaleDateString('pl-PL')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {post.author}
                </Typography>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{
              '& h1': {
                fontSize: '2rem',
                fontWeight: 600,
                mt: 4,
                mb: 2
              },
              '& h2': {
                fontSize: '1.5rem',
                fontWeight: 600,
                mt: 3,
                mb: 2
              },
              '& h3': {
                fontSize: '1.25rem',
                fontWeight: 600,
                mt: 2,
                mb: 1
              },
              '& p': {
                lineHeight: 1.8,
                mb: 2,
                color: 'text.secondary'
              },
              '& ul, & ol': {
                lineHeight: 1.8,
                mb: 2,
                pl: 4,
                color: 'text.secondary'
              },
              '& code': {
                bgcolor: 'grey.100',
                p: 0.5,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.9em'
              },
              '& pre': {
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                mb: 2
              }
            }}>
              {post.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <Typography key={i} variant="h1">{line.replace('# ', '')}</Typography>;
                } else if (line.startsWith('## ')) {
                  return <Typography key={i} variant="h2">{line.replace('## ', '')}</Typography>;
                } else if (line.startsWith('### ')) {
                  return <Typography key={i} variant="h3">{line.replace('### ', '')}</Typography>;
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={i}><Typography component="span">{line.replace(/^[*-] /, '')}</Typography></li>;
                } else if (line.startsWith('```')) {
                  return null; // Skip code fence markers for now
                } else if (line.trim() === '') {
                  return <br key={i} />;
                } else if (line.match(/^\d+\./)) {
                  return <li key={i}><Typography component="span">{line.replace(/^\d+\.\s/, '')}</Typography></li>;
                } else {
                  return <Typography key={i} paragraph>{line}</Typography>;
                }
              })}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Back to blog button */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/blog')}
                sx={{ px: 4 }}
              >
                Powrót do listy artykułów
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
