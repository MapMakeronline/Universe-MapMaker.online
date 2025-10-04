'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Straighten as StraightenIcon,
  SquareFoot as SquareFootIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMeasurementMode, clearAllMeasurements, removeMeasurement } from '@/store/slices/drawSlice';

interface MeasurementModalProps {
  open: boolean;
  onClose: () => void;
}

type MeasurementType = 'distance' | 'area' | null;

const MeasurementModal: React.FC<MeasurementModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { measurement } = useAppSelector((state) => state.draw);

  const [measurementType, setMeasurementType] = useState<MeasurementType>(null);

  // Sync local state with Redux state
  useEffect(() => {
    if (measurement.isDistanceMode) {
      setMeasurementType('distance');
    } else if (measurement.isAreaMode) {
      setMeasurementType('area');
    } else {
      setMeasurementType(null);
    }
  }, [measurement.isDistanceMode, measurement.isAreaMode]);

  const handleMeasurementTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: MeasurementType) => {
    setMeasurementType(newType);

    if (newType === 'distance') {
      dispatch(setMeasurementMode({ distance: true, area: false }));
    } else if (newType === 'area') {
      dispatch(setMeasurementMode({ distance: false, area: true }));
    } else {
      dispatch(setMeasurementMode({ distance: false, area: false }));
    }
  };

  const handleClearAll = () => {
    dispatch(clearAllMeasurements());
    setMeasurementType(null);
  };

  const handleRemoveMeasurement = (id: string) => {
    dispatch(removeMeasurement(id));
  };

  const handleClose = () => {
    // Optionally disable measurement mode when closing
    dispatch(setMeasurementMode({ distance: false, area: false }));
    setMeasurementType(null);
    onClose();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(2)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatArea = (sqMeters: number): string => {
    if (sqMeters < 10000) {
      return `${sqMeters.toFixed(2)} m²`;
    }
    return `${(sqMeters / 10000).toFixed(2)} ha`;
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
          maxWidth: '540px',
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
        Narzędzia pomiarowe
        <IconButton
          onClick={handleClose}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Measurement Type Selector */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1.5,
              }}
            >
              Wybierz typ pomiaru
            </Typography>
            <ToggleButtonGroup
              value={measurementType}
              exclusive
              onChange={handleMeasurementTypeChange}
              fullWidth
              sx={{
                bgcolor: 'white',
                '& .MuiToggleButton-root': {
                  py: 1.5,
                  fontSize: '14px',
                  textTransform: 'none',
                  borderColor: '#d1d5db',
                  color: theme.palette.text.primary,
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                },
              }}
            >
              <ToggleButton value="distance">
                <StraightenIcon sx={{ mr: 1, fontSize: '20px' }} />
                Odległość
              </ToggleButton>
              <ToggleButton value="area">
                <SquareFootIcon sx={{ mr: 1, fontSize: '20px' }} />
                Powierzchnia
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Instructions */}
          {measurementType && (
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
                {measurementType === 'distance' && (
                  <>
                    <strong>Instrukcja:</strong> Kliknij na mapie, aby dodać punkty.
                    Podwójne kliknięcie zakończy pomiar. Odległość będzie wyświetlana na bieżąco.
                  </>
                )}
                {measurementType === 'area' && (
                  <>
                    <strong>Instrukcja:</strong> Kliknij na mapie, aby narysować wielokąt.
                    Podwójne kliknięcie zamknie kształt. Powierzchnia będzie wyświetlana automatycznie.
                  </>
                )}
              </Typography>
            </Box>
          )}

          {/* Measurements List */}
          {measurement.measurements.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  Zapisane pomiary ({measurement.measurements.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearAll}
                  sx={{
                    fontSize: '12px',
                    textTransform: 'none',
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: 'rgba(239, 68, 68, 0.08)',
                    },
                  }}
                >
                  Wyczyść wszystko
                </Button>
              </Box>

              <List
                sx={{
                  bgcolor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  p: 0,
                }}
              >
                {measurement.measurements.map((m, index) => (
                  <React.Fragment key={m.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                            {m.type === 'distance' ? 'Odległość' : 'Powierzchnia'}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                            {m.type === 'distance' ? formatDistance(m.value) : formatArea(m.value)}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveMeasurement(m.id)}
                          sx={{
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                            },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '18px' }} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {/* Empty State */}
          {measurement.measurements.length === 0 && !measurementType && (
            <Box
              sx={{
                bgcolor: 'white',
                p: 3,
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.text.secondary,
                }}
              >
                Wybierz typ pomiaru, aby rozpocząć
              </Typography>
            </Box>
          )}
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
          onClick={handleClose}
          variant="outlined"
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
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MeasurementModal;
