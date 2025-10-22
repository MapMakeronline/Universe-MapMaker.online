'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

interface DownloadProjectModalProps {
  open: boolean;
  onClose: () => void;
  onDownload?: (format: 'qgs' | 'qgz') => void;
  isLoading?: boolean;
}

const DownloadProjectModal: React.FC<DownloadProjectModalProps> = ({
  open,
  onClose,
  onDownload,
  isLoading = false
}) => {
  const theme = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<'qgs' | 'qgz'>('qgs');

  const handleDownload = () => {
    if (onDownload) {
      onDownload(selectedFormat);
    }
    // Modal stays open while loading, closes automatically on success/error
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '400px',
          width: '90%',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#4a5568',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '16px',
          fontWeight: 600,
          m: 0,
        }}
      >
        Pobierz projekt
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
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Wybierz format w którym zapisać projekt:
          </Typography>

          <TextField
            select
            fullWidth
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as 'qgs' | 'qgz')}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                borderRadius: '4px',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
              '& .MuiOutlinedInput-input': {
                fontSize: '14px',
                py: 1.5,
              },
              '& .MuiSelect-icon': {
                color: theme.palette.text.secondary,
              }
            }}
          >
            <MenuItem value="qgs">qgs</MenuItem>
            <MenuItem value="qgz">qgz</MenuItem>
          </TextField>
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 2,
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: theme.palette.text.primary,
            borderColor: '#d1d5db',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '4px',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Anuluj
        </Button>

        <Button
          onClick={handleDownload}
          variant="contained"
          disabled={isLoading}
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            px: 3,
            py: 1,
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '4px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#2d3748',
            },
            '&:disabled': {
              bgcolor: '#a0aec0',
              color: 'white',
            }
          }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
              Pobieranie...
            </>
          ) : (
            'Pobierz'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadProjectModal;
