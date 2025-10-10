'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import MapIcon from '@mui/icons-material/Map';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import PublicFooter from '@/components/navigation/PublicFooter';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

const categoryIcons = {
  'Podstawy': <HomeIcon />,
  'Projekty': <FolderIcon />,
  'Warstwy i Mapy': <MapIcon />,
  'Narzędzia': <BuildIcon />,
  'Problemy techniczne': <WarningIcon />,
  'Bezpieczeństwo': <SecurityIcon />,
};

const faqCategories = {
  'Podstawy': [
    {
      question: 'Czym jest Universe MapMaker?',
      answer: 'Universe MapMaker to zaawansowana platforma do tworzenia interaktywnych map GIS. Umożliwia tworzenie, edycję i publikację map z wykorzystaniem technologii Mapbox GL JS i QGIS Server. Platforma oferuje narzędzia do rysowania, pomiarów, obsługi warstw 3D oraz integrację z projektami QGIS.'
    },
    {
      question: 'Czy mogę korzystać z platformy za darmo?',
      answer: 'Tak! Universe MapMaker oferuje darmowy plan podstawowy, który umożliwia tworzenie i edycję map. Płatne plany subskrypcyjne oferują rozszerzone funkcje takie jak: większa liczba projektów, dodatkowa przestrzeń dyskowa, własne domeny oraz zaawansowane narzędzia analityczne.'
    },
    {
      question: 'Jak stworzyć pierwsze konto?',
      answer: 'Aby utworzyć konto, kliknij przycisk "Zarejestruj się" w prawym górnym rogu strony. Wypełnij formularz rejestracyjny podając adres e-mail, nazwę użytkownika i hasło. Po weryfikacji adresu e-mail będziesz mógł korzystać z pełnej funkcjonalności platformy.'
    }
  ],
  'Projekty': [
    {
      question: 'Jak utworzyć nowy projekt?',
      answer: 'W panelu Dashboard kliknij przycisk "+ Nowy Projekt" w sekcji "Własne Projekty". Następnie wypełnij formularz podając nazwę projektu, wybierz kategorię i opcjonalnie dodaj opis. Możesz także zaimportować istniejący projekt QGIS (.qgs lub .qgz).'
    },
    {
      question: 'Jak importować projekty QGIS?',
      answer: 'W formularzu tworzenia projektu wybierz zakładkę "Import QGIS". Przeciągnij plik .qgs lub .qgz do obszaru uploadu lub kliknij, aby wybrać plik z dysku. System automatycznie wyodrębni wszystkie warstwy, style i konfigurację z projektu QGIS.'
    },
    {
      question: 'Co to jest publikacja projektu?',
      answer: 'Publikacja projektu oznacza udostępnienie go publicznie pod unikalną subdomeną (np. mojprojekt.universemapmaker.online). Tylko właściciel projektu może go opublikować. Opublikowane projekty są widoczne dla wszystkich użytkowników w sekcji "Projekty Publiczne".'
    },
    {
      question: 'Jak zarządzać domenami projektów?',
      answer: 'Każdy projekt może mieć przypisaną unikalną subdomenę. W ustawieniach projektu możesz zmienić subdomenę (jeśli jest dostępna) lub podłączyć własną domenę (w planach płatnych). Domena jest automatycznie tworzona przy publikacji projektu.'
    }
  ],
  'Warstwy i Mapy': [
    {
      question: 'Jak dodać warstwę do mapy?',
      answer: 'W lewym panelu kliknij przycisk "+" lub "Dodaj warstwę". Możesz wybrać spośród różnych typów warstw: WMS, WFS, lokalne pliki GeoJSON, Shapefile, lub stworzyć własną warstwę rysując na mapie.'
    },
    {
      question: 'Jak włączyć widok 3D?',
      answer: 'W dolnej części lewego panelu kliknij "Styl mapy" i wybierz "3D Budynki" lub "Pełne 3D". Tryb 3D Budynki dodaje ekstrudowane budynki, a Pełne 3D dodatkowo włącza teren i warstwę nieba. Możesz obracać mapę gestem dwóch palców (mobile) lub trzymając Ctrl + przeciąganie (desktop).'
    },
    {
      question: 'Jak zmienić przezroczystość warstwy?',
      answer: 'W drzewie warstw kliknij na warstwę, aby rozwinąć jej opcje. Użyj suwaka "Przezroczystość" aby dostosować widoczność warstwy. Możesz także zmienić kolor, kolejność warstw (przeciągając) oraz całkowicie ukryć/pokazać warstwę.'
    },
    {
      question: 'Jakie formaty plików są obsługiwane?',
      answer: 'Platforma obsługuje następujące formaty: QGIS (.qgs, .qgz), GeoJSON, Shapefile (.shp), KML, GPX, CSV (z kolumnami współrzędnych), oraz standardy OGC (WMS, WFS, WCS). Importowane pliki są automatycznie konwertowane do formatu PostGIS.'
    }
  ],
  'Narzędzia': [
    {
      question: 'Jak korzystać z narzędzi rysowania?',
      answer: 'W prawym pasku narzędzi wybierz typ geometrii (punkt, linia, polygon). Kliknij na mapie aby dodać punkty. Dla linii i polygonów kliknij dwukrotnie aby zakończyć rysowanie. Narysowane obiekty można edytować - kliknij na obiekt i przeciągnij jego wierzchołki.'
    },
    {
      question: 'Jak mierzyć odległości?',
      answer: 'Kliknij ikonę linijki w prawym pasku narzędzi. Następnie klikaj na mapie aby dodać kolejne punkty pomiarowe. System automatycznie wyświetli długość całej linii oraz odległości między punktami. Wyniki są pokazywane w metrach lub kilometrach.'
    },
    {
      question: 'Co to jest narzędzie identyfikacji?',
      answer: 'Narzędzie identyfikacji pozwala sprawdzić informacje o obiektach na mapie. Kliknij ikonę "i" w prawym pasku, a następnie kliknij na mapie. Zobaczysz wszystkie atrybuty klikniętego obiektu, w tym dla budynków 3D możliwość edycji atrybutów.'
    },
    {
      question: 'Jak wyeksportować dane z projektu?',
      answer: 'W ustawieniach projektu znajdziesz opcję "Eksport". Możesz wyeksportować cały projekt jako plik QGIS (.qgz), poszczególne warstwy jako GeoJSON/Shapefile, lub wygenerować statyczny obraz mapy (screenshot).'
    }
  ],
  'Problemy techniczne': [
    {
      question: 'Mapa nie ładuje się poprawnie',
      answer: 'Sprawdź połączenie internetowe i odśwież stronę (Ctrl+R lub F5). Jeśli problem się powtarza, wyczyść cache przeglądarki (Ctrl+Shift+Del) i zaloguj się ponownie. Upewnij się również, że korzystasz z najnowszej wersji przeglądarki (Chrome, Firefox, Safari, Edge).'
    },
    {
      question: 'Nie mogę opublikować projektu',
      answer: 'Upewnij się, że jesteś właścicielem projektu - tylko właściciel może publikować projekty. Sprawdź czy wybrałeś unikalną subdomenę (jeśli subdomena jest zajęta, musisz wybrać inną). W razie dalszych problemów skontaktuj się z supportem.'
    },
    {
      question: 'Import QGIS kończy się błędem',
      answer: 'Sprawdź czy plik .qgs/.qgz nie jest uszkodzony i czy wszystkie warstwy w projekcie QGIS są dostępne. Upewnij się, że projekt nie zawiera ścieżek bezwzględnych do plików lokalnych. Duże projekty (>50MB) mogą wymagać więcej czasu na import.'
    },
    {
      question: 'Jak zgłosić błąd lub problem?',
      answer: 'W panelu Dashboard przejdź do sekcji "Kontakt" lub wyślij e-mail na adres: kontakt@universemapmaker.online. W zgłoszeniu podaj szczegółowy opis problemu, przeglądarkę której używasz, oraz screenshoty jeśli to możliwe.'
    }
  ],
  'Bezpieczeństwo': [
    {
      question: 'Czy moje dane są bezpieczne?',
      answer: 'Tak. Wszystkie dane są przechowywane w zabezpieczonej bazie PostgreSQL w Google Cloud. Połączenia są szyfrowane protokołem HTTPS/SSL. Regularnie wykonujemy kopie zapasowe. Dane osobowe są przetwarzane zgodnie z RODO.'
    },
    {
      question: 'Jak zmienić hasło?',
      answer: 'W panelu Dashboard przejdź do zakładki "Ustawienia". W sekcji "Zmiana hasła" wpisz obecne hasło, następnie nowe hasło (powtórz 2x). Kliknij "Zapisz zmiany". Zalecamy używanie silnych haseł (min. 8 znaków, litery, cyfry, znaki specjalne).'
    },
    {
      question: 'Co się stanie z moimi projektami po usunięciu konta?',
      answer: 'Po usunięciu konta wszystkie Twoje projekty zostaną trwale usunięte z systemu (w tym pliki QGS, warstwy, domeny). Opublikowane projekty zostaną odpublikowane. Przed usunięciem konta zalecamy wyeksportowanie ważnych projektów.'
    }
  ]
};

export default function FAQPage() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const accordionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCategoryClick = (category: string) => {
    setSearchQuery('');
    setSelectedCategory(category);
    const firstQuestion = faqCategories[category as keyof typeof faqCategories]?.[0]?.question;
    if (firstQuestion) {
      setExpandedAccordion(`${category}-0`);
    }
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleHelpful = (panelId: string, vote: 'up' | 'down') => {
    setHelpfulVotes(prev => ({
      ...prev,
      [panelId]: prev[panelId] === vote ? null : vote
    }));
    // TODO: Send vote to backend analytics
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const allPanels = Object.entries(filteredCategories).flatMap(([category, questions]) =>
        questions.map((_, index) => `${category}-${index}`)
      );
      const currentIndex = allPanels.indexOf(expandedAccordion as string);

      if (e.key === 'ArrowDown' && currentIndex < allPanels.length - 1) {
        e.preventDefault();
        const nextPanel = allPanels[currentIndex + 1];
        setExpandedAccordion(nextPanel);
        accordionRefs.current[nextPanel]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        const prevPanel = allPanels[currentIndex - 1];
        setExpandedAccordion(prevPanel);
        accordionRefs.current[prevPanel]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedAccordion]);

  // Filter FAQs based on search query
  const filteredCategories = searchQuery
    ? Object.entries(faqCategories).reduce((acc, [category, questions]) => {
        const filteredQuestions = questions.filter(q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredQuestions.length > 0) {
          acc[category] = filteredQuestions;
        }
        return acc;
      }, {} as Record<string, typeof faqCategories[keyof typeof faqCategories]>)
    : selectedCategory
    ? { [selectedCategory]: faqCategories[selectedCategory as keyof typeof faqCategories] }
    : faqCategories;

  return (
    <>
      <PublicNavbar title="FAQ - Najczęściej zadawane pytania" />

      <Box sx={{ pt: 10, pb: 8, bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: 'FAQ' }]} />

          {/* Hero section */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 2
              }}
            >
              Centrum Pomocy
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '800px',
                mx: 'auto',
                mb: 4
              }}
            >
              Znajdź odpowiedzi na najczęściej zadawane pytania dotyczące Universe MapMaker
            </Typography>

            {/* Search bar */}
            <TextField
              fullWidth
              placeholder="Wyszukaj pytanie lub słowo kluczowe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                maxWidth: '600px',
                mx: 'auto',
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
              💡 Wskazówka: Użyj strzałek ↑↓ do nawigacji między pytaniami
            </Typography>
          </Box>

          {/* Categories chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip
              icon={<HomeIcon />}
              label="Wszystkie"
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
                setExpandedAccordion(false);
              }}
              sx={{
                bgcolor: selectedCategory === null ? theme.palette.primary.main : 'white',
                color: selectedCategory === null ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: selectedCategory === null ? theme.palette.primary.dark : 'grey.100',
                },
                fontWeight: selectedCategory === null ? 600 : 400,
              }}
            />
            {Object.keys(faqCategories).map((category) => (
              <Chip
                key={category}
                icon={React.cloneElement(categoryIcons[category as keyof typeof categoryIcons], {
                  sx: { color: selectedCategory === category ? 'white' : 'inherit' }
                })}
                label={category}
                onClick={() => handleCategoryClick(category)}
                sx={{
                  bgcolor: selectedCategory === category ? theme.palette.primary.main : 'white',
                  color: selectedCategory === category ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: selectedCategory === category ? theme.palette.primary.dark : 'grey.100',
                  },
                  fontWeight: selectedCategory === category ? 600 : 400,
                }}
              />
            ))}
          </Box>

          {/* FAQ Accordions */}
          <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
            {Object.entries(filteredCategories).map(([category, questions]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pl: 2 }}>
                  {categoryIcons[category as keyof typeof categoryIcons]}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {category}
                  </Typography>
                </Box>
                {questions.map((faq, index) => {
                  const panelId = `${category}-${index}`;
                  return (
                    <Accordion
                      key={panelId}
                      ref={(el) => { accordionRefs.current[panelId] = el; }}
                      expanded={expandedAccordion === panelId}
                      onChange={handleAccordionChange(panelId)}
                      sx={{
                        mb: 1,
                        '&:before': { display: 'none' },
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderRadius: '8px !important',
                        '&.Mui-expanded': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: 'grey.50'
                          }
                        }}
                      >
                        <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                        <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 3 }}>
                          {faq.answer}
                        </Typography>

                        {/* Helpful feedback */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Czy to było pomocne?
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Tak, pomocne">
                              <IconButton
                                size="small"
                                onClick={() => handleHelpful(panelId, 'up')}
                                sx={{
                                  color: helpfulVotes[panelId] === 'up' ? 'success.main' : 'text.secondary',
                                  '&:hover': { bgcolor: 'success.50' }
                                }}
                              >
                                <ThumbUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Nie, nieprzydatne">
                              <IconButton
                                size="small"
                                onClick={() => handleHelpful(panelId, 'down')}
                                sx={{
                                  color: helpfulVotes[panelId] === 'down' ? 'error.main' : 'text.secondary',
                                  '&:hover': { bgcolor: 'error.50' }
                                }}
                              >
                                <ThumbDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {helpfulVotes[panelId] && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                              Dziękujemy za opinię!
                            </Typography>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            ))}

            {Object.keys(filteredCategories).length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  Nie znaleziono wyników dla "{searchQuery}"
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Spróbuj użyć innych słów kluczowych lub skontaktuj się z nami
                </Typography>
              </Box>
            )}
          </Box>

          {/* Contact section */}
          <Box
            sx={{
              mt: 8,
              p: 4,
              bgcolor: 'white',
              borderRadius: 2,
              textAlign: 'center',
              maxWidth: '700px',
              mx: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Nie znalazłeś odpowiedzi?
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              Skontaktuj się z naszym zespołem wsparcia - chętnie pomożemy!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/dashboard?tab=5')}
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                px: 4
              }}
            >
              Skontaktuj się z nami
            </Button>
          </Box>
        </Container>
      </Box>

      <PublicFooter />
    </>
  );
}
