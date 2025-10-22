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

interface Warstwa {
  id: string;
  nazwa: string;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
}

interface AddGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nazwaGrupy: string; grupaNadrzedna: string }) => void;
  existingGroups: Warstwa[];
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ open, onClose, onSubmit, existingGroups }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwaGrupy: '',
    grupaNadrzedna: 'Stwórz poza grupami',
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);

    // Reset form
    setFormData({
      nazwaGrupy: '',
      grupaNadrzedna: 'Stwórz poza grupami',
    });
    onClose();
  };

  const isSubmitDisabled = () => {
    return !formData.nazwaGrupy.trim();
  };

  // Flatten groups recursively
  const getAllGroups = (layers: Warstwa[]): Warstwa[] => {
    const groups: Warstwa[] = [];

    const traverse = (items: Warstwa[]) => {
      items.forEach(item => {
        if (item.typ === 'grupa') {
          groups.push(item);
          if (item.dzieci) {
            traverse(item.dzieci);
          }
        }
      });
    };

    traverse(layers);
    return groups;
  };

  const allGroups = getAllGroups(existingGroups);

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
          maxWidth: '500px',
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
        Dodaj grupę warstw
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
              fullWidth
              value={formData.nazwaGrupy}
              onChange={(e) => handleFormChange('nazwaGrupy', e.target.value)}
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
                  color: theme.palette.text.primary,
                },
              }}
            />
          </Box>

          {/* Grupa nadrzędna */}
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
            <TextField
              fullWidth
              select
              value={formData.grupaNadrzedna}
              onChange={(e) => handleFormChange('grupaNadrzedna', e.target.value)}
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
                '& .MuiSelect-select': {
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                },
              }}
            >
              <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
              {allGroups.map((group) => (
                <MenuItem key={group.id} value={group.nazwa}>
                  {group.nazwa}
                </MenuItem>
              ))}
            </TextField>
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
          disabled={isSubmitDisabled()}
          sx={{
            bgcolor: theme.palette.primary.main,
            textTransform: 'none',
            '&:hover': { bgcolor: theme.palette.primary.dark },
            '&.Mui-disabled': {
              bgcolor: '#d1d5db',
              color: 'white',
            },
          }}
        >
          Dodaj grupę
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupModal;
