'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import LayersIcon from '@mui/icons-material/Layers';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface FeatureProperty {
  key: string;
  value: any;
}

interface IdentifiedFeature {
  layer: string;
  sourceLayer?: string;
  properties: FeatureProperty[];
  geometry?: {
    type: string;
    coordinates?: any;
  };
}

interface IdentifyModalProps {
  open: boolean;
  onClose: () => void;
  features: IdentifiedFeature[];
  coordinates?: [number, number];
}

const IdentifyModal: React.FC<IdentifyModalProps> = ({ open, onClose, features, coordinates }) => {
  const theme = useTheme();

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
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
          maxWidth: '700px',
          width: '90%',
          maxHeight: '80vh',
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
        Identyfikacja obiektu
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
        {/* Coordinates */}
        {coordinates && (
          <Box
            sx={{
              bgcolor: 'white',
              p: 2,
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <LocationOnIcon sx={{ color: theme.palette.primary.main, fontSize: '20px' }} />
            <Box>
              <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mb: 0.5 }}>
                Współrzędne kliknięcia
              </Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>
                {formatCoordinate(coordinates[1])}, {formatCoordinate(coordinates[0])}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Features List */}
        {features.length === 0 ? (
          <Box
            sx={{
              bgcolor: 'white',
              p: 4,
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: theme.palette.text.secondary,
              }}
            >
              Nie znaleziono obiektów w tym miejscu
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {features.map((feature, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  overflow: 'hidden',
                }}
              >
                {/* Feature Header */}
                <Box
                  sx={{
                    bgcolor: '#f3f4f6',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: '1px solid #d1d5db',
                  }}
                >
                  <LayersIcon sx={{ color: theme.palette.primary.main, fontSize: '18px' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {feature.layer}
                    </Typography>
                    {feature.sourceLayer && (
                      <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                        Źródło: {feature.sourceLayer}
                      </Typography>
                    )}
                  </Box>
                  {feature.geometry && (
                    <Chip
                      label={feature.geometry.type}
                      size="small"
                      sx={{
                        fontSize: '11px',
                        height: '22px',
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                      }}
                    />
                  )}
                </Box>

                {/* Properties Table */}
                {feature.properties.length > 0 ? (
                  <Table size="small">
                    <TableBody>
                      {feature.properties.map((prop, propIndex) => (
                        <TableRow
                          key={propIndex}
                          sx={{
                            '&:last-child td': { border: 0 },
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                          }}
                        >
                          <TableCell
                            sx={{
                              width: '40%',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                              py: 1.5,
                              px: 2,
                            }}
                          >
                            {prop.key}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: '13px',
                              color: theme.palette.text.secondary,
                              py: 1.5,
                              px: 2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {formatValue(prop.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                      Brak właściwości do wyświetlenia
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}

            {/* Summary */}
            <Box
              sx={{
                bgcolor: 'white',
                p: 1.5,
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                Znaleziono {features.length} {features.length === 1 ? 'obiekt' : features.length < 5 ? 'obiekty' : 'obiektów'}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          pb: 3,
          pt: 0,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
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

export default IdentifyModal;
