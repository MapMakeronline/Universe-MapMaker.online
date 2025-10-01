'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  TextField,
  Button,
  Typography,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Info as InfoIcon } from '@mui/icons-material';

interface CreateConsultationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nazwa: string;
    numerUchwaly: string;
    email: string;
    dataRozpoczecia: string;
    dataZakonczenia: string;
  }) => void;
}

export default function CreateConsultationModal({ open, onClose, onSubmit }: CreateConsultationModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwa: '',
    numerUchwaly: '',
    email: '',
    dataRozpoczecia: '',
    dataZakonczenia: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.nazwa.trim() || !formData.numerUchwaly.trim() || !formData.email.trim()) {
      return;
    }

    onSubmit({
      nazwa: formData.nazwa.trim(),
      numerUchwaly: formData.numerUchwaly.trim(),
      email: formData.email.trim(),
      dataRozpoczecia: formData.dataRozpoczecia,
      dataZakonczenia: formData.dataZakonczenia,
    });

    // Reset form
    setFormData({
      nazwa: '',
      numerUchwaly: '',
      email: '',
      dataRozpoczecia: '',
      dataZakonczenia: '',
    });
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      nazwa: '',
      numerUchwaly: '',
      email: '',
      dataRozpoczecia: '',
      dataZakonczenia: '',
    });
    onClose();
  };

  const isSubmitDisabled = () => {
    return !formData.nazwa.trim() || !formData.numerUchwaly.trim() || !formData.email.trim();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '500px',
          width: '90%',
        },
      }}
    >
      <DialogTitle sx={{ 
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
      }}>
        Utwórz konsultacje społeczne
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Nazwa field with info icon */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                }}
              >
                Nazwa
              </Typography>
              <InfoIcon sx={{ fontSize: '16px', color: '#6b7280' }} />
            </Box>
            <TextField
              fullWidth
              value={formData.nazwa}
              onChange={(e) => handleChange('nazwa', e.target.value)}
              placeholder="Wpisz nazwę konsultacji"
              size="small"
              autoFocus
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
                }
              }}
            />
          </Box>

          {/* Numer uchwały */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Numer uchwały
            </Typography>
            <TextField
              fullWidth
              value={formData.numerUchwaly}
              onChange={(e) => handleChange('numerUchwaly', e.target.value)}
              placeholder="Wpisz numer uchwały"
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
                }
              }}
            />
          </Box>

          {/* E-mail field with info icon */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                }}
              >
                E-mail
              </Typography>
              <InfoIcon sx={{ fontSize: '16px', color: '#6b7280' }} />
            </Box>
            <TextField
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Wpisz adres e-mail"
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
                }
              }}
            />
          </Box>

          {/* Data rozpoczęcia konsultacji */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Data rozpoczęcia konsultacji
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={formData.dataRozpoczecia}
              onChange={(e) => handleChange('dataRozpoczecia', e.target.value)}
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
                }
              }}
            />
          </Box>

          {/* Data zakończenia konsultacji */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Data zakończenia konsultacji
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={formData.dataZakonczenia}
              onChange={(e) => handleChange('dataZakonczenia', e.target.value)}
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
                }
              }}
            />
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
              sx={{
                minWidth: '140px',
                py: 1.5,
                bgcolor: '#4a5568',
                color: 'white',
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
              Zatwierdź
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}