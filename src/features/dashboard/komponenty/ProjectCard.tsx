// ProjectCard component with action menu
'use client';

import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { alpha } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import MoreVert from '@mui/icons-material/MoreVert';
import Public from '@mui/icons-material/Public';
import Lock from '@mui/icons-material/Lock';
import ViewModule from '@mui/icons-material/ViewModule';
import Storage from '@mui/icons-material/Storage';
import Delete from '@mui/icons-material/Delete';
import Settings from '@mui/icons-material/Settings';
import Language from '@mui/icons-material/Language';
import type { Project } from '@/api/typy/types';
import { unifiedProjectsApi as projectsApi } from '@/api/endpointy/unified-projects';

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onSettings: () => void;
}

export function ProjectCard({ project, onOpen, onDelete, onTogglePublish, onSettings }: ProjectCardProps) {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuAction = (action: () => void) => {
    handleMenuClose();
    action();
  };

  const thumbnailUrl = project.logoExists
    ? projectsApi.getThumbnailUrl(project.project_name)
    : '';

  return (
    <>
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
        onClick={onOpen}
      >
        {/* Thumbnail */}
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={thumbnailUrl}
            alt={project.custom_project_name || project.project_name}
            sx={{
              bgcolor: 'grey.100',
              backgroundImage:
                'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Status badges */}
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
            {project.published && (
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
              icon={project.published ? <Public /> : <Lock />}
              label={project.published ? 'Publiczny' : 'Prywatny'}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(4px)',
                ml: project.published ? 0 : 'auto',
              }}
            />
          </Box>

          {/* More menu button */}
          <IconButton
            aria-label="Więcej opcji"
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
            onClick={handleMenuOpen}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Content */}
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
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
              M
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              Ty
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: 'block' }}
          >
            Ostatnia modyfikacja: {project.project_date} {project.project_time}
          </Typography>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
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
          },
        }}
      >
        {project.published && project.domain_url && (
          <MenuItem
            onClick={() =>
              handleMenuAction(() => window.open(project.domain_url, '_blank'))
            }
          >
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText>Zobacz opublikowaną mapę</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => handleMenuAction(onTogglePublish)}>
          <ListItemIcon>
            <Public fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {project.published ? 'Cofnij publikację' : 'Opublikuj projekt'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuAction(onSettings)}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ustawienia projektu</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleMenuAction(onDelete)}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Usuń projekt</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
