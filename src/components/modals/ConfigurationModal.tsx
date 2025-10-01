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
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';

interface ConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nazwaWypisu: string;
    wybierzWarstwe: string;
    dodajWarstwy: string;
  }) => void;
}

export default function ConfigurationModal({ open, onClose, onSubmit }: ConfigurationModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwaWypisu: '',
    wybierzWarstwe: '',
    dodajWarstwy: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      nazwaWypisu: '',
      wybierzWarstwe: '',
      dodajWarstwy: '',
    });
    onClose();
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
        Konfiguracja wypisu
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* First section */}
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Nazwa wypisu */}
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    mb: 1,
                  }}
                >
                  Nazwa wypisu
                </Typography>
                <TextField
                  fullWidth
                  value={formData.nazwaWypisu}
                  onChange={(e) => handleChange('nazwaWypisu', e.target.value)}
                  placeholder=""
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

              {/* Wybierz warstwę działek */}
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    mb: 1,
                  }}
                >
                  Wybierz warstwę <span style={{ color: '#d97706' }}>działek</span>:
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.wybierzWarstwe}
                    onChange={(e) => handleChange('wybierzWarstwe', e.target.value)}
                    displayEmpty
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '4px',
                      '& .MuiSelect-select': {
                        fontSize: '14px',
                        py: 1.5,
                      },
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <Typography sx={{ fontSize: '14px', color: '#6b7280' }}>
                        
                      </Typography>
                    </MenuItem>
                    <MenuItem value="dzialka1">Działka 1</MenuItem>
                    <MenuItem value="dzialka2">Działka 2</MenuItem>
                    <MenuItem value="dzialka3">Działka 3</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          {/* Second section */}
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header with + button */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  Dodaj warstwy przeznaczenia planu
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: '#4a5568',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    '&:hover': {
                      bgcolor: '#2d3748',
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Box>

              {/* Dropdown */}
              <FormControl fullWidth size="small">
                <Select
                  value={formData.dodajWarstwy}
                  onChange={(e) => handleChange('dodajWarstwy', e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& .MuiSelect-select': {
                      fontSize: '14px',
                      py: 1.5,
                    },
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="">
                    <Typography sx={{ fontSize: '14px', color: '#6b7280' }}>
                      Wybierz z listy
                    </Typography>
                  </MenuItem>
                  <MenuItem value="warstwa1">Warstwa 1</MenuItem>
                  <MenuItem value="warstwa2">Warstwa 2</MenuItem>
                  <MenuItem value="warstwa3">Warstwa 3</MenuItem>
                </Select>
              </FormControl>

              {/* Link */}
              <Box>
                <Typography
                  component="a"
                  href="#"
                  sx={{
                    fontSize: '14px',
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#1d4ed8',
                    },
                  }}
                >
                  Brak dodanych warstw
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                minWidth: '100px',
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
              }}
            >
              Powrót
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                minWidth: '100px',
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
              }}
            >
              Zapisz
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}