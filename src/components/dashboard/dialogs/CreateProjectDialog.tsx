// Dialog for creating a new project with backend integration
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import type { CreateProjectData } from '@/lib/api/types';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateProjectData) => Promise<void>;
}

const CATEGORIES = ['EMUiA', 'SIP', 'Suikzp', 'MPZP', 'EGiB', 'Inne'];

export function CreateProjectDialog({ open, onClose, onCreate }: CreateProjectDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    project: '',
    domain: '',
    projectDescription: '',
    keywords: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Dashboard API expects different field names than /api/projects/create/
      await onCreate({
        project_name: formData.project,           // Dashboard: "project_name"
        custom_project_name: formData.domain,     // Dashboard: "custom_project_name"
        description: formData.projectDescription, // Dashboard: "description"
        keywords: formData.keywords,
        category: selectedCategories.length > 0 ? selectedCategories[0] : 'Inne',
        is_public: false,
      });
      // Reset form
      setFormData({
        project: '',
        domain: '',
        projectDescription: '',
        keywords: '',
      });
      setSelectedCategories([]);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.project.length >= 3 && formData.domain.length >= 3 &&
    (formData.projectDescription?.length || 0) <= 100;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
        }}
      >
        Utwórz nowy projekt
        <IconButton onClick={onClose} size="small" disabled={isSubmitting}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Nazwa projektu"
            placeholder="Wpisz minimum 3 znaki (bez spacji)"
            fullWidth
            required
            value={formData.project}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, project: e.target.value }))
            }
            helperText="Minimum 3 znaki, dozwolone: litery, cyfry, _ (wymagane)"
            error={formData.project.length > 0 && formData.project.length < 3}
          />

          <TextField
            label="Domena"
            placeholder="Subdomena dla projektu (minimum 3 znaki)"
            fullWidth
            required
            value={formData.domain}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, domain: e.target.value }))
            }
            helperText="Minimum 3 znaki, format: example-domain (wymagane)"
            error={formData.domain.length > 0 && formData.domain.length < 3}
          />

          <TextField
            label="Słowa kluczowe"
            placeholder="Opisz projekt słowami kluczowymi (oddziel przecinkami)"
            fullWidth
            value={formData.keywords}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, keywords: e.target.value }))
            }
            helperText="Opcjonalne"
          />

          <TextField
            label="Opis"
            placeholder="Opisz swój projekt (maksymalnie 100 znaków)"
            fullWidth
            multiline
            rows={3}
            value={formData.projectDescription}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, projectDescription: e.target.value }))
            }
            helperText={`${formData.projectDescription.length}/100 (opcjonalnie)`}
            error={formData.projectDescription.length > 100}
          />

          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">
              Kategorie:
            </Typography>
            <Grid container spacing={1}>
              {CATEGORIES.map((category) => (
                <Grid item xs={6} sm={4} key={category}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                      />
                    }
                    label={category}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Tworzenie...' : 'Utwórz projekt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
