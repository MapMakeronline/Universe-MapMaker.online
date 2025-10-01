'use client';

import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Button,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Share,
  FileCopy,
  Add,
  Public,
  Lock,
  ViewModule,
  Storage,
  Language,
  Settings,
  Upload,
  GetApp,
  TableChart,
} from '@mui/icons-material';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  isPublic: boolean;
  size: string;
  layers: number;
  lastModified: string;
  owner: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'REKLAMY',
    description: 'Projekt własny',
    image: '',
    category: 'Reklamy',
    isPublic: false,
    size: '88.97 MB',
    layers: 21,
    lastModified: '2 dni temu',
    owner: 'Ty',
  },
  {
    id: '2',
    title: 'DOLNOŚLĄSKIE',
    description: 'Projekt własny',
    image: '',
    category: 'Województwo',
    isPublic: false,
    size: '45.32 MB',
    layers: 15,
    lastModified: '1 tydzień temu',
    owner: 'Ty',
  },
  {
    id: '3',
    title: 'KONSULTACJE PREZENTACJA',
    description: 'Projekt własny',
    image: '',
    category: 'Prezentacja',
    isPublic: false,
    size: '53.72 MB',
    layers: 8,
    lastModified: '3 dni temu',
    owner: 'Ty',
  },
  {
    id: '4',
    title: 'DZIAŁKI ZA MNIEJ',
    description: 'Projekt własny',
    image: '',
    category: 'Nieruchomości',
    isPublic: true,
    size: '20.83 MB',
    layers: 17,
    lastModified: '5 dni temu',
    owner: 'Ty',
  },
  {
    id: '5',
    title: 'PRZETARGILODZ',
    description: 'Projekt własny',
    image: '',
    category: 'Przetargi',
    isPublic: true,
    size: '14.89 MB',
    layers: 1,
    lastModified: '1 dzień temu',
    owner: 'Ty',
  },
];

export default function OwnProjects() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const theme = useTheme();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProject(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleProjectAction = (action: string) => {
    console.log(`${action} project:`, selectedProject);
    handleMenuClose();
  };

  const ProjectCard = ({ project }: { project: Project }) => (
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
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {project.isPublic && (
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
          )}
          <Chip
            icon={project.isPublic ? <Public /> : <Lock />}
            label="Prywatny"
            size="small"
            color="default"
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(4px)',
              ml: project.isPublic ? 0 : 'auto',
            }}
          />
        </Box>
        <IconButton
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(4px)',
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 1),
            },
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e, project.id);
          }}
        >
          <MoreVert />
        </IconButton>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
          {project.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {project.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
            M
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
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Ostatnia modyfikacja: {project.lastModified}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
            Twoje projekty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Zarządzaj swoimi projektami mapowymi
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1.5,
            fontWeight: 600,
          }}
        >
          Nowy projekt
        </Button>
      </Box>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {mockProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <ProjectCard project={project} />
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      {anchorEl && selectedProject && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiPaper-root': {
              minWidth: 220,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider',
              mt: 0.5,
            }
          }}
        >
        {selectedProject && mockProjects.find(p => p.id === selectedProject)?.isPublic && (
          <MenuItem onClick={() => handleProjectAction('published-view')}>
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mapa w wersji opublikowanej</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleProjectAction('settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ustawienia</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleProjectAction('database')}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>Baza danych</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleProjectAction('publish')}>
          <ListItemIcon>
            <Public fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {selectedProject && mockProjects.find(p => p.id === selectedProject)?.isPublic 
              ? 'Cofnij publikację' 
              : 'Publikacja mapy'
            }
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleProjectAction('import')}>
          <ListItemIcon>
            <Upload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Importuj projekt</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleProjectAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Usuń projekt</ListItemText>
        </MenuItem>
        </Menu>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
}