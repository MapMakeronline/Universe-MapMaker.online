'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';

interface DeleteLayerConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  layerName: string;
  isDeleting?: boolean;
}

/**
 * DeleteLayerConfirmModal - Modal potwierdzenia usuwania warstwy
 *
 * Wyświetla ostrzeżenie przed usunięciem warstwy z projektu.
 * Użytkownik musi potwierdzić akcję przed wykonaniem.
 *
 * @param open - Czy modal jest otwarty
 * @param onClose - Callback zamykania modala
 * @param onConfirm - Callback potwierdzenia usunięcia
 * @param layerName - Nazwa warstwy do usunięcia
 * @param isDeleting - Status ładowania (podczas usuwania)
 */
const DeleteLayerConfirmModal: React.FC<DeleteLayerConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  layerName,
  isDeleting = false,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '500px',
          width: '90%',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: theme.palette.error.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '17px',
          fontWeight: 600,
          m: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ fontSize: '22px' }} />
          Potwierdzenie usunięcia
        </Box>
        {!isDeleting && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon sx={{ fontSize: '20px' }} />
          </IconButton>
        )}
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 4,
          pt: 3,
          pb: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            sx={{
              fontSize: '15px',
              color: theme.palette.text.primary,
              lineHeight: 1.6,
            }}
          >
            Czy na pewno chcesz usunąć warstwę <strong>"{layerName}"</strong> z projektu?
          </Typography>

          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            Ta operacja spowoduje usunięcie warstwy z drzewa warstw projektu.
            Dane w bazie pozostaną nienaruszone.
          </Typography>

          <Box
            sx={{
              bgcolor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              p: 2,
              mt: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: '13px',
                color: '#856404',
                lineHeight: 1.5,
              }}
            >
              <strong>Uwaga:</strong> Tej operacji nie można cofnąć. Aby przywrócić warstwę,
              będziesz musiał ponownie zaimportować ją z bazy danych.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 2,
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          disabled={isDeleting}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            px: 3,
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: '#f3f4f6',
            },
          }}
        >
          Anuluj
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          variant="contained"
          startIcon={<DeleteIcon />}
          sx={{
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            px: 3,
            bgcolor: theme.palette.error.main,
            color: 'white',
            '&:hover': {
              bgcolor: theme.palette.error.dark,
            },
            '&:disabled': {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }}
        >
          {isDeleting ? 'Usuwanie...' : 'Usuń warstwę'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteLayerConfirmModal;
