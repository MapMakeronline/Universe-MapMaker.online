'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';

interface ExportPDFModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => Promise<void>;
}

export interface ExportConfig {
  scale: number;
  pageSize: 'A4' | 'A3' | 'A2' | 'A1';
  orientation: 'portrait' | 'landscape';
  title: string;
  includeScale: boolean;
  includeNorthArrow: boolean;
  includeCoordinates: boolean;
  dpi: number;
}

const ExportPDFModal: React.FC<ExportPDFModalProps> = ({ open, onClose, onExport }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState<ExportConfig>({
    scale: 2000,
    pageSize: 'A4',
    orientation: 'landscape',
    title: 'Mapa',
    includeScale: true,
    includeNorthArrow: true,
    includeCoordinates: true,
    dpi: 300,
  });

  const commonScales = [
    500, 1000, 2000, 2500, 5000, 10000, 25000, 50000, 100000
  ];

  const pageSizes = [
    { value: 'A4', label: 'A4 (210 × 297 mm)' },
    { value: 'A3', label: 'A3 (297 × 420 mm)' },
    { value: 'A2', label: 'A2 (420 × 594 mm)' },
    { value: 'A1', label: 'A1 (594 × 841 mm)' },
  ];

  const dpiOptions = [
    { value: 150, label: '150 DPI (Szybki)' },
    { value: 300, label: '300 DPI (Standard)' },
    { value: 600, label: '600 DPI (Wysoka jakość)' },
  ];

  const handleChange = (field: keyof ExportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport(config);
      onClose();
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setLoading(false);
    }
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
          maxWidth: '600px',
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
        Eksportuj mapę do PDF
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
          {/* Title */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Tytuł mapy
            </Typography>
            <TextField
              fullWidth
              value={config.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Wpisz tytuł mapy"
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

          {/* Scale */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Skala mapy
            </Typography>
            <TextField
              select
              fullWidth
              value={config.scale}
              onChange={(e) => handleChange('scale', Number(e.target.value))}
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
              {commonScales.map(scale => (
                <MenuItem key={scale} value={scale}>
                  1:{scale.toLocaleString('pl-PL')}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Page Size and Orientation */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Format strony
              </Typography>
              <TextField
                select
                fullWidth
                value={config.pageSize}
                onChange={(e) => handleChange('pageSize', e.target.value)}
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
                {pageSizes.map(size => (
                  <MenuItem key={size.value} value={size.value}>
                    {size.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Orientacja
              </Typography>
              <TextField
                select
                fullWidth
                value={config.orientation}
                onChange={(e) => handleChange('orientation', e.target.value)}
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
                <MenuItem value="portrait">Pionowa</MenuItem>
                <MenuItem value="landscape">Pozioma</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* DPI */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Jakość obrazu
            </Typography>
            <TextField
              select
              fullWidth
              value={config.dpi}
              onChange={(e) => handleChange('dpi', Number(e.target.value))}
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
              {dpiOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Additional Options */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Elementy mapy
            </Typography>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                p: 1.5,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeScale}
                    onChange={(e) => handleChange('includeScale', e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '14px' }}>
                    Pokaż skalę liniową
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeNorthArrow}
                    onChange={(e) => handleChange('includeNorthArrow', e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '14px' }}>
                    Pokaż strzałkę północy
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeCoordinates}
                    onChange={(e) => handleChange('includeCoordinates', e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '14px' }}>
                    Pokaż współrzędne
                  </Typography>
                }
              />
            </Box>
          </Box>

          {/* Info */}
          <Box
            sx={{
              bgcolor: 'white',
              p: 2,
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              <strong>Uwaga:</strong> PDF zostanie wygenerowany z aktualnym widokiem mapy w wybranej skali.
              Upewnij się, że widoczny obszar mapy zawiera wszystkie potrzebne elementy.
            </Typography>
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
          disabled={loading}
          sx={{
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            fontSize: '14px',
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
          onClick={handleExport}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PdfIcon />}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            fontSize: '14px',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          {loading ? 'Generowanie...' : 'Eksportuj PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportPDFModal;
