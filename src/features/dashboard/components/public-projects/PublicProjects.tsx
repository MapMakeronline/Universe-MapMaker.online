'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import UserAvatar from '@/common/components/UserAvatar';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import Search from '@mui/icons-material/Search';
import Public from '@mui/icons-material/Public';
import { useGetPublicProjectsQuery, getProjectCreatedAt } from '@/backend';
import type { Project } from '@/backend';
import { getThumbnailUrl, formatProjectDateTime } from '@/features/dashboard/utils';
import { ProjectsGridSkeleton } from '../shared/ProjectCardSkeleton';

const categories = [
  'Wszystkie',
  'Infrastruktura',
  'Planowanie',
  'Administracja',
  'Inwestycje',
  'Transport',
  'Środowisko',
];

// Reusable PublicProjectCard - similar style to OwnProjects ProjectCard
function PublicProjectCard({ project }: { project: Project }) {
  const theme = useTheme();
  const router = useRouter();

  // Thumbnail URL - using shared utility for consistent URL generation
  const thumbnailUrl = getThumbnailUrl(project);

  // State for handling image load errors (fallback to default SVG)
  const [imgError, setImgError] = React.useState(false);
  const finalThumbnailUrl = imgError ? '/default-project-thumbnail.svg' : thumbnailUrl;

  const category = project.categories || 'Inne';

  return (
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
      onClick={() => router.push(`/map?project=${project.project_name}`)}
    >
      {/* Thumbnail */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={finalThumbnailUrl}
          alt={project.custom_project_name || project.project_name}
          onError={() => setImgError(true)}
          sx={{
            bgcolor: 'grey.100',
            backgroundImage:
              'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Status badges - same position as OwnProjects */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Chip
            label="OPUBLIKOWANY"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.9),
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              backdropFilter: 'blur(4px)',
            }}
          />
          <Chip
            icon={<Public />}
            label={category}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(4px)',
            }}
          />
        </Box>
      </Box>

      {/* Content - same structure as OwnProjects */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
          {project.custom_project_name || project.project_name}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {project.description || 'Brak opisu'}
        </Typography>

        {project.keywords && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {project.keywords}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <UserAvatar
            user={project.user || null}
            isAuthenticated={!!project.user}
            size={24}
            sx={{ fontSize: '0.75rem' }}
            showIcon={true}
          />
          <Typography variant="body2" color="text.secondary">
            {project.user?.username || project.owner?.username || 'Nieznany'}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: 'block' }}
        >
          Utworzono: {formatProjectDateTime(project)}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function PublicProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // RTK Query - fetch public projects from backend
  const { data: projectsData, isLoading, error } = useGetPublicProjectsQuery(undefined, {
    pollingInterval: 60000, // Auto-refresh every 60 seconds
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Extract and sort projects from RTK Query response (newest first)
  const publicProjects = projectsData?.list_of_projects
    ? [...projectsData.list_of_projects].sort((a, b) => {
        // Sort by project_date + project_time descending (newest first)
        const dateA = new Date(getProjectCreatedAt(a)).getTime();
        const dateB = new Date(getProjectCreatedAt(b)).getTime();
        return dateB - dateA;
      })
    : [];

  // Filter projects
  const filteredProjects = publicProjects.filter(project => {
    const title = project.custom_project_name || project.project_name;
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Wszystkie' ||
                           (project.categories || '').includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  return (
    <Box>
      {/* Header - same style as OwnProjects */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Projekty publiczne
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Przeglądaj publiczne projekty mapowe stworzone przez społeczność
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
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
          sx={{ flexGrow: 1 }}
          fullWidth={isMobile}
        />
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
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

      {/* Loading State */}
      {isLoading && <ProjectsGridSkeleton count={6} />}

      {/* Error State */}
      {error && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Błąd ładowania projektów
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {(error as any)?.data?.message || 'Nie udało się pobrać projektów publicznych'}
          </Typography>
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Public sx={{ fontSize: 64, color: 'primary.main', mb: 3, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nie znaleziono projektów
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {publicProjects.length === 0
              ? 'Brak projektów publicznych'
              : 'Spróbuj zmienić kryteria wyszukiwania'}
          </Typography>
        </Box>
      )}

      {/* Projects Grid - SAME STYLE AS OwnProjects */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Znaleziono {filteredProjects.length} {filteredProjects.length === 1 ? 'projekt' : 'projektów'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {filteredProjects.map((project) => (
              <PublicProjectCard
                key={project.project_name}
                project={project}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
