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
  MenuItem,
  Select,
  FormControl,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface AddGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nazwaGrupy: string; grupaNadrzedna: string }) => void;
}

export default function AddGroupModal({ open, onClose, onSubmit }: AddGroupModalProps) {
  const theme = useTheme();
  const [nazwaGrupy, setNazwaGrupy] = useState('');
  const [grupaNadrzedna, setGrupaNadrzedna] = useState('Stwórz poza grupami');

  const handleSubmit = () => {
    if (!nazwaGrupy.trim()) {
      return; // Don't submit if group name is empty
    }

    onSubmit({
      nazwaGrupy: nazwaGrupy.trim(),
      grupaNadrzedna,
    });

    // Reset form
    setNazwaGrupy('');
    setGrupaNadrzedna('Stwórz poza grupami');
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setNazwaGrupy('');
    setGrupaNadrzedna('Stwórz poza grupami');
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
        Dodaj grupę warstw
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
          {/* Group Name Field */}
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
              fullWidth
              value={nazwaGrupy}
              onChange={(e) => setNazwaGrupy(e.target.value)}
              placeholder="Wpisz nazwę grupy"
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

          {/* Parent Group Dropdown */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Grupa nadrzędna
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={grupaNadrzedna}
                onChange={(e) => setGrupaNadrzedna(e.target.value)}
                sx={{
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '& .MuiSelect-select': {
                    fontSize: '14px',
                    py: 1.5,
                  }
                }}
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Grupa 1">Grupa 1</MenuItem>
                <MenuItem value="Grupa 2">Grupa 2</MenuItem>
                <MenuItem value="Grupa 3">Grupa 3</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!nazwaGrupy.trim()}
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
              Dodaj grupę
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}