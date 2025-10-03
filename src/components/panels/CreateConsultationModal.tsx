'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

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

const CreateConsultationModal: React.FC<CreateConsultationModalProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwa: '',
    numerUchwaly: '',
    email: '',
    dataRozpoczecia: '',
    dataZakonczenia: '',
  });

  const [errors, setErrors] = useState({
    nazwa: '',
    numerUchwaly: '',
    email: '',
    dataRozpoczecia: '',
    dataZakonczenia: '',
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      nazwa: '',
      numerUchwaly: '',
      email: '',
      dataRozpoczecia: '',
      dataZakonczenia: '',
    };

    let isValid = true;

    // Check if all fields are filled
    if (!formData.nazwa.trim()) {
      newErrors.nazwa = 'Pole wymagane';
      isValid = false;
    }

    if (!formData.numerUchwaly.trim()) {
      newErrors.numerUchwaly = 'Pole wymagane';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Pole wymagane';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Nieprawidłowy format e-mail';
      isValid = false;
    }

    if (!formData.dataRozpoczecia) {
      newErrors.dataRozpoczecia = 'Pole wymagane';
      isValid = false;
    }

    if (!formData.dataZakonczenia) {
      newErrors.dataZakonczenia = 'Pole wymagane';
      isValid = false;
    }

    // Check if end date is not before start date
    if (formData.dataRozpoczecia && formData.dataZakonczenia) {
      const startDate = new Date(formData.dataRozpoczecia);
      const endDate = new Date(formData.dataZakonczenia);

      if (endDate < startDate) {
        newErrors.dataZakonczenia = 'Data zakończenia nie może być wcześniejsza od daty rozpoczęcia';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);

      // Reset form
      setFormData({
        nazwa: '',
        numerUchwaly: '',
        email: '',
        dataRozpoczecia: '',
        dataZakonczenia: '',
      });
      setErrors({
        nazwa: '',
        numerUchwaly: '',
        email: '',
        dataRozpoczecia: '',
        dataZakonczenia: '',
      });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '550px',
          width: '95%',
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
          py: 2.5,
          px: 3,
          fontSize: '17px',
          fontWeight: 600,
          m: 0,
        }}
      >
        Utwórz konsultacje społeczne
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
          px: 4,
          pt: 3,
          pb: 4,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Nazwa */}
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
              <Tooltip title="Nazwa widoczna jest jedynie w trybie edycji" arrow placement="right">
                <InfoIcon sx={{ fontSize: '16px', color: theme.palette.text.secondary }} />
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              value={formData.nazwa}
              onChange={(e) => handleFormChange('nazwa', e.target.value)}
              placeholder="Wpisz nazwę konsultacji"
              size="small"
              error={!!errors.nazwa}
              helperText={errors.nazwa}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: errors.nazwa ? theme.palette.error.main : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: errors.nazwa ? theme.palette.error.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errors.nazwa ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                },
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
              onChange={(e) => handleFormChange('numerUchwaly', e.target.value)}
              placeholder="Wpisz numer uchwały"
              size="small"
              error={!!errors.numerUchwaly}
              helperText={errors.numerUchwaly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: errors.numerUchwaly ? theme.palette.error.main : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: errors.numerUchwaly ? theme.palette.error.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errors.numerUchwaly ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                },
              }}
            />
          </Box>

          {/* E-mail */}
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
              <Tooltip title="E-mail" arrow placement="right">
                <InfoIcon sx={{ fontSize: '16px', color: theme.palette.text.secondary }} />
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              placeholder="Wpisz adres e-mail"
              size="small"
              error={!!errors.email}
              helperText={errors.email}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: errors.email ? theme.palette.error.main : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: errors.email ? theme.palette.error.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errors.email ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                },
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
              type="datetime-local"
              value={formData.dataRozpoczecia}
              onChange={(e) => handleFormChange('dataRozpoczecia', e.target.value)}
              size="small"
              error={!!errors.dataRozpoczecia}
              helperText={errors.dataRozpoczecia}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: errors.dataRozpoczecia ? theme.palette.error.main : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: errors.dataRozpoczecia ? theme.palette.error.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errors.dataRozpoczecia ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                },
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
              type="datetime-local"
              value={formData.dataZakonczenia}
              onChange={(e) => handleFormChange('dataZakonczenia', e.target.value)}
              size="small"
              error={!!errors.dataZakonczenia}
              helperText={errors.dataZakonczenia}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: errors.dataZakonczenia ? theme.palette.error.main : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: errors.dataZakonczenia ? theme.palette.error.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errors.dataZakonczenia ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          pb: 3,
          pt: 0,
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            textTransform: 'none',
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            bgcolor: theme.palette.primary.main,
            textTransform: 'none',
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          Zatwierdź
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateConsultationModal;
