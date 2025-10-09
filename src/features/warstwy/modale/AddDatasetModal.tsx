'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
} from '@mui/icons-material';

interface AddDatasetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nazwaPlan: string; nazwaGrupy: string; temat: string }) => void;
}

const AddDatasetModal: React.FC<AddDatasetModalProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwaPlan: '',
    nazwaGrupy: 'Stwórz poza grupami',
    temat: '3.4 Zagospodarowanie pr...',
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      nazwaPlan: '',
      nazwaGrupy: 'Stwórz poza grupami',
      temat: '3.4 Zagospodarowanie pr...',
    });
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '480px',
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
        Dodaj plan INSPIRE
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Nazwa planu */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Nazwa planu
            </Typography>
            <TextField
              fullWidth
              value={formData.nazwaPlan}
              onChange={(e) => handleChange('nazwaPlan', e.target.value)}
              placeholder="Wpisz nazwę planu"
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

          {/* Nazwa grupy */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Nazwa grupy
            </Typography>
            <TextField
              select
              fullWidth
              value={formData.nazwaGrupy}
              onChange={(e) => handleChange('nazwaGrupy', e.target.value)}
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
              <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
              <MenuItem value="Miejscowe plany">Miejscowe plany</MenuItem>
              <MenuItem value="Infrastruktura">Infrastruktura</MenuItem>
              <MenuItem value="Środowisko">Środowisko</MenuItem>
            </TextField>
          </Box>

          {/* Temat */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Temat
            </Typography>
            <TextField
              select
              fullWidth
              value={formData.temat}
              onChange={(e) => handleChange('temat', e.target.value)}
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
              <MenuItem value="3.4 Zagospodarowanie pr...">3.4 Zagospodarowanie przestrzenne</MenuItem>
              <MenuItem value="1.1 Budynki">1.1 Budynki</MenuItem>
              <MenuItem value="1.2 Działki katasztralne">1.2 Działki katasztralne</MenuItem>
              <MenuItem value="2.1 Sieci transportowe">2.1 Sieci transportowe</MenuItem>
              <MenuItem value="2.2 Usługi komunalne i administracyjne">2.2 Usługi komunalne i administracyjne</MenuItem>
              <MenuItem value="3.1 Pomniki przyrody">3.1 Pomniki przyrody</MenuItem>
            </TextField>
          </Box>
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 2,
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'center',
        }}
      >
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.nazwaPlan.trim()}
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            px: 4,
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
          Dodaj zbiór danych - INSPIRE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDatasetModal;