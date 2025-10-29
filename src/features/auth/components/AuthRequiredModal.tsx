'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/navigation';

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
  action?: string; // e.g., "edytować warstwę", "rysować na mapie"
}

/**
 * Modal informujący niezalogowanych użytkowników, że funkcja wymaga logowania
 * Pokazuje komunikat + przycisk przekierowania do /auth
 */
const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  open,
  onClose,
  action = 'wykonać tę akcję',
}) => {
  const router = useRouter();

  const handleLoginRedirect = () => {
    onClose();
    router.push('/auth');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'warning.light',
          color: 'warning.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 2,
        }}
      >
        <LockIcon />
        Wymagane logowanie
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Aby {action}, musisz być zalogowany.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Zaloguj się, aby uzyskać dostęp do funkcji edycyjnych mapy.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          Anuluj
        </Button>
        <Button
          onClick={handleLoginRedirect}
          variant="contained"
          color="primary"
          startIcon={<LockIcon />}
        >
          Przejdź do logowania
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthRequiredModal;
