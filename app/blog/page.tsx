'use client';

import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import PublicFooter from '@/components/navigation/PublicFooter';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

const blogPosts = [
  {
    id: 1,
    title: 'Jak stworzyć pierwszą mapę w Universe MapMaker',
    excerpt: 'Przewodnik krok po kroku do stworzenia Twojej pierwszej interaktywnej mapy za pomocą naszej platformy.',
    date: '2024-03-15',
    author: 'Jan Kowalski',
    category: 'Tutorial',
    image: '/blog/tutorial-1.jpg',
    slug: 'jak-stworzyc-pierwsza-mape',
    readTime: 5,
  },
  {
    id: 2,
    title: 'Nowości w Universe MapMaker - wersja 2.0',
    excerpt: 'Poznaj najnowsze funkcje dodane do platformy, w tym ulepszone narzędzia rysowania i 3D.',
    date: '2024-03-10',
    author: 'Anna Nowak',
    category: 'Aktualności',
    image: '/blog/news-1.jpg',
    slug: 'nowosci-wersja-2-0',
    readTime: 3,
  },
  {
    id: 3,
    title: 'Integracja z QGIS - pełna instrukcja',
    excerpt: 'Dowiedz się jak importować projekty QGIS do Universe MapMaker i korzystać z zaawansowanych funkcji GIS.',
    date: '2024-03-05',
    author: 'Piotr Wiśniewski',
    category: 'Tutorial',
    image: '/blog/qgis-integration.jpg',
    slug: 'integracja-qgis',
    readTime: 8,
  },
  {
    id: 4,
    title: 'Mapowanie 3D - najlepsze praktyki',
    excerpt: 'Poznaj techniki tworzenia realistycznych map 3D z budynkami i terenem.',
    date: '2024-02-28',
    author: 'Katarzyna Lewandowska',
    category: 'Poradnik',
    image: '/blog/3d-mapping.jpg',
    slug: 'mapowanie-3d',
    readTime: 6,
  },
  {
    id: 5,
    title: 'Analiza przestrzenna dla początkujących',
    excerpt: 'Podstawy analizy GIS w Universe MapMaker - od buforów po nakładanie warstw.',
    date: '2024-02-20',
    author: 'Michał Kowalczyk',
    category: 'Tutorial',
    image: '/blog/spatial-analysis.jpg',
    slug: 'analiza-przestrzenna',
    readTime: 7,
  },
  {
    id: 6,
    title: 'Case Study: Mapa turystyczna Krakowa',
    excerpt: 'Jak stworzyliśmy interaktywną mapę dla Urzędu Miasta Krakowa.',
    date: '2024-02-15',
    author: 'Anna Nowak',
    category: 'Case Study',
    image: '/blog/case-krakow.jpg',
    slug: 'mapa-krakowa',
    readTime: 4,
  },
];

const categories = ['Wszystkie', 'Tutorial', 'Aktualności', 'Poradnik', 'Case Study', 'Technologia'];

type SortOption = 'newest' | 'oldest' | 'popular' | 'alphabetical';

export default function BlogPage() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [sharePopup, setSharePopup] = useState<number | null>(null);
  const postsPerPage = 6;

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = selectedCategory === 'Wszystkie'
      ? blogPosts
      : blogPosts.filter(post => post.category === selectedCategory);

    // Sort posts
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'popular':
          return b.id - a.id; // Mock popularity
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [selectedCategory, sortBy]);

  // Paginate posts
  const paginatedPosts = useMemo(() => {
    const startIndex = (page - 1) * postsPerPage;
    return filteredAndSortedPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredAndSortedPosts, page]);

  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);

  const handleShare = (postId: number, platform: string) => {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;

    const url = `${window.location.origin}/blog/${post.slug}`;
    const text = post.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
    setSharePopup(null);
  };

  return (
    <>
      <PublicNavbar title="Blog MapMaker" />

      <Box sx={{ pt: 10, pb: 8, bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: 'Blog' }]} />

          {/* Hero section */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
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
              Blog Universe MapMaker
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              Najnowsze artykuły, tutoriale i aktualności ze świata mapowania GIS
            </Typography>
          </Box>

          {/* Filters and sorting */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 4,
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between'
          }}>
            {/* Category filters */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
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

            {/* Sort dropdown */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sortuj według</InputLabel>
              <Select
                value={sortBy}
                label="Sortuj według"
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setPage(1);
                }}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="newest">Najnowsze</MenuItem>
                <MenuItem value="oldest">Najstarsze</MenuItem>
                <MenuItem value="popular">Najpopularniejsze</MenuItem>
                <MenuItem value="alphabetical">Alfabetycznie</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Blog posts grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3,
            mb: 4
          }}>
            {paginatedPosts.map((post) => (
              <Card
                key={post.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardMedia
                  sx={{
                    height: 200,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <Typography sx={{ color: 'text.secondary' }}>
                    {post.title}
                  </Typography>
                  <Chip
                    label={post.category}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    {post.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, flexGrow: 1 }}
                  >
                    {post.excerpt}
                  </Typography>

                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.date).toLocaleDateString('pl-PL')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        ~{post.readTime} min
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => router.push(`/blog/${post.slug}`)}
                    >
                      Czytaj więcej
                    </Button>
                    <Box sx={{ position: 'relative' }}>
                      <Tooltip title="Udostępnij">
                        <IconButton
                          onClick={() => setSharePopup(sharePopup === post.id ? null : post.id)}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'grey.100'
                            }
                          }}
                        >
                          <ShareIcon />
                        </IconButton>
                      </Tooltip>
                      {sharePopup === post.id && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            mb: 1,
                            bgcolor: 'white',
                            boxShadow: 3,
                            borderRadius: 1,
                            p: 1,
                            display: 'flex',
                            gap: 0.5,
                            zIndex: 10
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleShare(post.id, 'facebook')}
                            sx={{ color: '#1877F2' }}
                          >
                            <FacebookIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleShare(post.id, 'twitter')}
                            sx={{ color: '#1DA1F2' }}
                          >
                            <TwitterIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleShare(post.id, 'linkedin')}
                            sx={{ color: '#0A66C2' }}
                          >
                            <LinkedInIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Container>
      </Box>

      <PublicFooter />
    </>
  );
}
