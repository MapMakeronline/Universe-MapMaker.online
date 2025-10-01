'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  Public,
  ViewModule,
  Storage,
  Person,
} from '@mui/icons-material';

interface PublicProject {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  size: string;
  layers: number;
  lastModified: string;
  owner: string;
  ownerAvatar: string;
  views: number;
}

const mockPublicProjects: PublicProject[] = [
  {
    id: '1',
    title: 'ogrodzeniecsip',
    description: 'ogrodzenie',
    image: '/api/placeholder/300/200',
    category: 'Infrastruktura',
    size: '25.4 MB',
    layers: 12,
    lastModified: '2 dni temu',
    owner: 'ogrodzieniec',
    ownerAvatar: 'O',
    views: 1247,
  },
  {
    id: '2',
    title: 'UniejowMwMpzp',
    description: 'uniejow',
    image: '/api/placeholder/300/200',
    category: 'Planowanie',
    size: '18.7 MB',
    layers: 8,
    lastModified: '1 tydzień temu',
    owner: 'uniejow',
    ownerAvatar: 'U',
    views: 856,
  },
  {
    id: '3',
    title: 'AugustowWMpzp',
    description: 'augustow',
    image: '/api/placeholder/300/200',
    category: 'Planowanie',
    size: '32.1 MB',
    layers: 15,
    lastModified: '3 dni temu',
    owner: 'augustow',
    ownerAvatar: 'A',
    views: 2103,
  },
  {
    id: '4',
    title: 'Gmina Uniejów',
    description: 'Mapa gminy Uniejów z podziałem na sołectwa',
    image: '/api/placeholder/300/200',
    category: 'Administracja',
    size: '28.9 MB',
    layers: 20,
    lastModified: '5 dni temu',
    owner: 'gmina_uniejow',
    ownerAvatar: 'G',
    views: 1567,
  },
  {
    id: '5',
    title: 'Tereny inwestycyjne Augustów',
    description: 'Dostępne tereny pod inwestycje w Augustowie',
    image: '/api/placeholder/300/200',
    category: 'Inwestycje',
    size: '15.2 MB',
    layers: 6,
    lastModified: '1 dzień temu',
    owner: 'inwestycje_augustow',
    ownerAvatar: 'I',
    views: 934,
  },
  {
    id: '6',
    title: 'Sieć wodociągowa Lublin',
    description: 'Mapa sieci wodociągowej miasta Lublin',
    image: '/api/placeholder/300/200',
    category: 'Infrastruktura',
    size: '45.8 MB',
    layers: 25,
    lastModified: '2 tygodnie temu',
    owner: 'mpwik_lublin',
    ownerAvatar: 'M',
    views: 3421,
  },
];

const categories = [
  'Wszystkie',
  'Infrastruktura',
  'Planowanie',
  'Administracja',
  'Inwestycje',
  'Transport',
  'Środowisko',
];

export default function PublicProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [currentPage, setCurrentPage] = useState(1);
  const theme = useTheme();
  const projectsPerPage = 6;

  const filteredProjects = mockPublicProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Wszystkie' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * projectsPerPage,
    currentPage * projectsPerPage
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const ProjectCard = ({ project }: { project: PublicProject }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        border: '1px solid',
        borderColor: 'divider',
      }}
      onClick={() => window.location.href = '/map'}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={project.image}
          alt={project.title}
          sx={{ 
            bgcolor: 'grey.100',
            backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            gap: 1,
          }}
        >
          <Chip
            icon={<Public />}
            label="Publiczny"
            size="small"
            color="success"
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.9),
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          <Chip
            label={project.category}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(4px)',
            }}
          />
        </Box>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
          {project.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {project.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <Avatar 
            sx={{ 
              width: 24, 
              height: 24, 
              bgcolor: 'primary.main', 
              fontSize: '0.75rem' 
            }}
          >
            {project.ownerAvatar}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {project.owner}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ViewModule fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {project.layers}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Storage fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {project.size}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {project.views.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Ostatnia aktualizacja: {project.lastModified}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
          Projekty publiczne
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Przeglądaj publiczne projekty mapowe stworzone przez społeczność
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Wyszukaj projekty..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300, flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Kategoria</InputLabel>
          <Select
            value={selectedCategory}
            label="Kategoria"
            onChange={handleCategoryChange}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Results info */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Znaleziono {filteredProjects.length} projektów
      </Typography>

      {/* Projects Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {currentProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <ProjectCard project={project} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Public sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Nie znaleziono projektów
          </Typography>
          <Typography variant="body2">
            Spróbuj zmienić kryteria wyszukiwania
          </Typography>
        </Box>
      )}
    </Box>
  );
}