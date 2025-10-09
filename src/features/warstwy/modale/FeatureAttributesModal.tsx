'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Place as PlaceIcon,
  Apartment as BuildingIcon,
  Layers as LayersIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setAttributeModalOpen,
  updateFeature,
  addFeatureAttribute,
  deleteFeatureAttribute,
  updateFeatureAttribute,
} from '@/redux/slices/featuresSlice';
import type { FeatureAttribute } from '@/redux/slices/featuresSlice';

const FeatureAttributesModal = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAttributeModalOpen, selectedFeatureId, features } = useAppSelector(
    (state) => state.features
  );

  const [editingName, setEditingName] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const [editingAttr, setEditingAttr] = useState<string | null>(null);
  const [editAttrValue, setEditAttrValue] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  const selectedFeature = selectedFeatureId ? features[selectedFeatureId] : null;

  // Reset name when feature changes
  useEffect(() => {
    if (selectedFeature) {
      setFeatureName(selectedFeature.name);
    }
  }, [selectedFeature]);

  const handleClose = () => {
    dispatch(setAttributeModalOpen(false));
    setEditingName(false);
    setEditingAttr(null);
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const handleSaveName = () => {
    if (selectedFeatureId && featureName.trim()) {
      dispatch(updateFeature({
        id: selectedFeatureId,
        updates: { name: featureName.trim() }
      }));
      setEditingName(false);
    }
  };

  const handleStartEditName = () => {
    setFeatureName(selectedFeature?.name || '');
    setEditingName(true);
  };

  const handleStartEditAttr = (key: string, value: string | number) => {
    setEditingAttr(key);
    setEditAttrValue(value.toString());
  };

  const handleSaveAttr = (key: string) => {
    if (selectedFeatureId && editAttrValue.trim()) {
      dispatch(updateFeatureAttribute({
        featureId: selectedFeatureId,
        attributeKey: key,
        value: editAttrValue.trim()
      }));
      setEditingAttr(null);
      setEditAttrValue('');
    }
  };

  const handleDeleteAttr = (key: string) => {
    if (selectedFeatureId) {
      dispatch(deleteFeatureAttribute({
        featureId: selectedFeatureId,
        attributeKey: key
      }));
    }
  };

  const handleAddAttr = () => {
    if (selectedFeatureId && newAttrKey.trim() && newAttrValue.trim()) {
      dispatch(addFeatureAttribute({
        featureId: selectedFeatureId,
        attribute: {
          key: newAttrKey.trim(),
          value: newAttrValue.trim()
        }
      }));
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  if (!selectedFeature) return null;

  // Icon based on feature type
  const getFeatureIcon = () => {
    switch (selectedFeature.type) {
      case 'building':
        return <BuildingIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />;
      case 'poi':
        return <PlaceIcon sx={{ fontSize: 20, color: theme.palette.secondary.main }} />;
      case 'layer':
        return <LayersIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />;
      case 'point':
      case 'custom':
        return <CircleIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />;
      default:
        return <LayersIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />;
    }
  };

  // Type label
  const getTypeLabel = () => {
    switch (selectedFeature.type) {
      case 'building':
        return 'Budynek 3D';
      case 'poi':
        return 'POI';
      case 'point':
        return 'Punkt';
      case 'line':
        return 'Linia';
      case 'polygon':
        return 'Poligon';
      case 'layer':
        return 'Warstwa';
      case 'custom':
        return 'Niestandardowy';
      default:
        return selectedFeature.type;
    }
  };

  const [lng, lat] = selectedFeature.coordinates;

  return (
    <Dialog
      open={isAttributeModalOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '700px',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {getFeatureIcon()}
          <span>Atrybuty obiektu</span>
          <Chip
            label={getTypeLabel()}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '11px',
              height: '22px',
            }}
          />
        </Box>
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
        {/* Feature Name */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Nazwa
          </Typography>
          {editingName ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                size="small"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                  },
                }}
              />
              <IconButton
                onClick={handleSaveName}
                size="small"
                sx={{ bgcolor: theme.palette.success.main, color: 'white', '&:hover': { bgcolor: theme.palette.success.dark } }}
              >
                <SaveIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                onClick={() => setEditingName(false)}
                size="small"
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ flex: 1, fontSize: '16px', fontWeight: 600 }}>
                {selectedFeature.name}
              </Typography>
              <IconButton
                onClick={handleStartEditName}
                size="small"
                sx={{ color: theme.palette.primary.main }}
              >
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Coordinates */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Współrzędne
          </Typography>
          <Typography sx={{ fontSize: '14px', fontFamily: 'monospace', color: theme.palette.text.secondary }}>
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </Typography>
        </Box>

        {/* Layer Info */}
        {selectedFeature.layer && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Warstwa źródłowa
            </Typography>
            <Chip
              label={selectedFeature.layer}
              size="small"
              variant="outlined"
              sx={{ fontSize: '12px' }}
            />
          </Box>
        )}

        {/* Attributes Table */}
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          Atrybuty niestandardowe
        </Typography>

        <TableContainer component={Paper} sx={{ borderRadius: '4px', mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#e5e7eb' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Atrybut</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Wartość</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', width: 100 }}>Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedFeature.attributes.map((attr) => (
                <TableRow key={attr.key} sx={{ '&:hover': { bgcolor: '#f3f4f6' } }}>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{attr.key}</TableCell>
                  <TableCell sx={{ fontSize: '13px' }}>
                    {editingAttr === attr.key ? (
                      <TextField
                        fullWidth
                        value={editAttrValue}
                        onChange={(e) => setEditAttrValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveAttr(attr.key)}
                        size="small"
                        autoFocus
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                          },
                        }}
                      />
                    ) : (
                      attr.value
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {editingAttr === attr.key ? (
                        <>
                          <IconButton
                            onClick={() => handleSaveAttr(attr.key)}
                            size="small"
                            sx={{ color: theme.palette.success.main }}
                          >
                            <SaveIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => setEditingAttr(null)}
                            size="small"
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => handleStartEditAttr(attr.key, attr.value)}
                            size="small"
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteAttr(attr.key)}
                            size="small"
                            sx={{ color: theme.palette.error.main }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add New Attribute */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            label="Nowy atrybut"
            value={newAttrKey}
            onChange={(e) => setNewAttrKey(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
              },
            }}
          />
          <TextField
            label="Wartość"
            value={newAttrValue}
            onChange={(e) => setNewAttrValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAttr()}
            size="small"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
              },
            }}
          />
          <IconButton
            onClick={handleAddAttr}
            disabled={!newAttrKey.trim() || !newAttrValue.trim()}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': { bgcolor: theme.palette.primary.dark },
              '&:disabled': { bgcolor: '#d1d5db', color: '#9ca3af' },
            }}
          >
            <AddIcon />
          </IconButton>
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
          variant="contained"
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeatureAttributesModal;
