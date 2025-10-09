// Dialog for confirming project deletion
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, Warning } from '@mui/icons-material';
import type { Project } from '@/api/typy/types';

interface DeleteProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirm: () => Promise<void>;
}

export function DeleteProjectDialog({
  open,
  onClose,
  project,
  onConfirm,
}: DeleteProjectDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmDelete(false);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmDelete(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
        }}
      >
        Potwierdź usunięcie
        <IconButton onClick={handleClose} size="small" disabled={isDeleting}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          Ta operacja jest nieodwracalna!
        </Alert>

        <Typography variant="body1" gutterBottom>
          Czy na pewno chcesz usunąć projekt{' '}
          <strong>{project?.custom_project_name || project?.project_name}</strong>?
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
          Wszystkie dane projektu, warstwy i ustawienia zostaną permanentnie usunięte.
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              color="error"
            />
          }
          label="Rozumiem konsekwencje i chcę usunąć ten projekt"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit" disabled={isDeleting}>
          Anuluj
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!confirmDelete || isDeleting}
        >
          {isDeleting ? 'Usuwanie...' : 'Usuń projekt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
