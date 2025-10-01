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
import { Close as CloseIcon } from '@mui/icons-material';

interface RestoreLayerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nazwaWarstwy: string;
    grupaNadrzedna: string;
  }) => void;
  layerName?: string;
}

export default function RestoreLayerModal({ 
  open, 
  onClose, 
  onSubmit,
  layerName = ''
}: RestoreLayerModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwaWarstwy: layerName,
    grupaNadrzedna: '',
  });

  // Update layer name when prop changes
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      nazwaWarstwy: layerName
    }));
  }, [layerName]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.nazwaWarstwy.trim()) {
      return;
    }

    onSubmit({
      nazwaWarstwy: formData.nazwaWarstwy.trim(),
      grupaNadrzedna: formData.grupaNadrzedna,
    });

    handleClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      nazwaWarstwy: '',
      grupaNadrzedna: '',
    });
    onClose();
  };

  const isSubmitDisabled = () => {
    return !formData.nazwaWarstwy.trim();
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
          maxWidth: '400px',
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
        Przywróć warstwę z bazy danych
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
          {/* Nazwa warstwy */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#d97706', // Orange color matching your screenshot
                mb: 1,
              }}
            >
              Nazwa warstwy
            </Typography>
            <TextField
              fullWidth
              value={formData.nazwaWarstwy}
              onChange={(e) => handleChange('nazwaWarstwy', e.target.value)}
              placeholder="Wprowadź nazwę warstwy"
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

          {/* Grupa nadrzędna */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#d97706', // Changed to orange to match "Nazwa warstwy"
                mb: 1,
              }}
            >
              Grupa nadrzędna
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={formData.grupaNadrzedna}
                onChange={(e) => handleChange('grupaNadrzedna', e.target.value)}
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
                    Stwórz nową grupami
                  </Typography>
                </MenuItem>
                <MenuItem value="grupa1">Grupa 1</MenuItem>
                <MenuItem value="grupa2">Grupa 2</MenuItem>
                <MenuItem value="grupa3">Grupa 3</MenuItem>
                <MenuItem value="miejscowe-plany">Miejscowe plany zagospodarowania</MenuItem>
                <MenuItem value="granice">Granice</MenuItem>
              </Select>
            </FormControl>
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
              Dodaj warstwę
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}