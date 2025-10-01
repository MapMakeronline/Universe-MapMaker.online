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
  MenuItem,
  Select,
  FormControl,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  Tooltip,
  Popover,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import RestoreLayerModal from './RestoreLayerModal';

interface LayerData {
  id: string;
  name: string;
  type: 'database' | 'vector' | 'raster';
  size?: string;
  layerType?: string;
}

interface ManageLayersModalProps {
  open: boolean;
  onClose: () => void;
  onRestoreLayer: (layerId: string, data: { nazwaWarstwy: string; grupaNadrzedna: string }) => void;
  onAddLayer: (layerId: string) => void;
  onLayerInfo: (layerId: string) => void;
}

export default function ManageLayersModal({ 
  open, 
  onClose, 
  onRestoreLayer, 
  onAddLayer,
  onLayerInfo
}: ManageLayersModalProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  // Mock layer data based on your screenshots
  const [layers, setLayers] = useState<LayerData[]>([
    { id: 'dzialki-za-mniej', name: 'DzialkiZaMniej', type: 'database', size: '0.15 MB', layerType: 'Vector' },
    { id: 'kupie-dzialke', name: 'Kupię Działkę', type: 'database', size: '0.09 MB', layerType: 'Vector' },
    { id: 'pelna-2000', name: 'Pełna 2000', type: 'database', size: '2.3 MB', layerType: 'Raster' },
    { id: 'wniosek-do-projektu-studium', name: 'Wniosek do projektu Studium', type: 'database', size: '0.45 MB', layerType: 'Vector' },
    { id: 'dzialki-636433', name: 'dzialki4636433', type: 'database', size: '1.2 MB', layerType: 'Vector' },
    { id: 'hel', name: 'hel', type: 'database', size: '0.8 MB', layerType: 'Vector' },
    { id: 'lukasz', name: 'lukasz', type: 'database', size: '0.3 MB', layerType: 'Vector' },
    { id: 'official-documentation', name: 'officialdocumentation', type: 'database', size: '5.1 MB', layerType: 'Raster' },
    { id: 'ukyrtiufg', name: 'ukyrtiufg', type: 'database', size: '0.7 MB', layerType: 'Vector' },
    { id: 'zoning-element', name: 'zoningelement', type: 'database', size: '1.8 MB', layerType: 'Vector' },
    { id: 'mateusz039-op-pl', name: 'mateusz039_op_pl', type: 'database', size: '0.6 MB', layerType: 'Vector' },
    { id: 'walera-z', name: 'walera_z', type: 'database', size: '0.4 MB', layerType: 'Vector' },
    { id: 'barbaraptak62-gmail-com', name: 'barbaraptak62_gmail_com', type: 'database', size: '0.9 MB', layerType: 'Vector' },
    { id: 'erik777-gmail-com', name: '7777erik777_gmail_com', type: 'database', size: '1.1 MB', layerType: 'Vector' },
    { id: 'za-timura', name: 'za_timura', type: 'database', size: '0.5 MB', layerType: 'Vector' },
    { id: 'marsonyteam-gmail-com', name: 'marsonyteam_gmail_com', type: 'database', size: '2.0 MB', layerType: 'Raster' },
  ]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [layerInfoAnchor, setLayerInfoAnchor] = useState<HTMLElement | null>(null);
  const [selectedLayerInfo, setSelectedLayerInfo] = useState<LayerData | null>(null);
  const [restoreLayerModalOpen, setRestoreLayerModalOpen] = useState(false);
  const [selectedLayerToRestore, setSelectedLayerToRestore] = useState<LayerData | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const filteredLayers = layers.filter(layer =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (event: any) => {
    setSelectedFilter(event.target.value);
  };

  const handleAddLayer = (layerId: string) => {
    onAddLayer(layerId);
  };

  const handleRestoreLayer = () => {
    // You could implement logic to restore selected layers
    console.log('Restoring layers from database');
  };

  const toggleExpanded = (layerId: string) => {
    // Remove this function as we don't need expand/collapse anymore
  };

  const handleLayerClick = (layerId: string) => {
    const newSelected = new Set(selectedLayers);
    if (newSelected.has(layerId)) {
      newSelected.delete(layerId);
    } else {
      newSelected.add(layerId);
    }
    setSelectedLayers(newSelected);
  };

  const handleShowLayerInfo = (event: React.MouseEvent<HTMLElement>, layer: LayerData) => {
    setLayerInfoAnchor(event.currentTarget);
    setSelectedLayerInfo(layer);
  };

  const handleCloseLayerInfo = () => {
    setLayerInfoAnchor(null);
    setSelectedLayerInfo(null);
  };

  const handleRestoreLayerClick = (layer: LayerData) => {
    setSelectedLayerToRestore(layer);
    setRestoreLayerModalOpen(true);
  };

  const handleCloseRestoreLayerModal = () => {
    setRestoreLayerModalOpen(false);
    setSelectedLayerToRestore(null);
  };

  const handleRestoreLayerSubmit = (data: { nazwaWarstwy: string; grupaNadrzedna: string }) => {
    if (selectedLayerToRestore) {
      onRestoreLayer(selectedLayerToRestore.id, data);
    }
  };

  const handleDeleteClick = () => {
    if (selectedLayers.size > 0) {
      setDeleteConfirmationOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    // Remove selected layers from the layers array
    const updatedLayers = layers.filter(layer => !selectedLayers.has(layer.id));
    setLayers(updatedLayers);
    
    // Clear selected layers
    setSelectedLayers(new Set());
    
    // Close confirmation modal
    setDeleteConfirmationOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmationOpen(false);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedFilter('');
    setSelectedLayers(new Set());
    setLayerInfoAnchor(null);
    setSelectedLayerInfo(null);
    setRestoreLayerModalOpen(false);
    setSelectedLayerToRestore(null);
    setDeleteConfirmationOpen(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
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
        Zarządzaj warstwami
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
          {/* Search Field */}
          <TextField
            fullWidth
            placeholder="Znajdź warstwę"
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#6b7280', fontSize: '18px' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'white',
                borderRadius: '20px',
                '& fieldset': {
                  borderColor: '#d1d5db',
                  borderRadius: '20px',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              }
            }}
            sx={{
              '& .MuiOutlinedInput-input': {
                fontSize: '14px',
                py: 1.5,
              }
            }}
          />

          {/* Section Title */}
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              mt: 1,
            }}
          >
            Warstwy w bazie danych projektu:
          </Typography>

          {/* Filter Dropdown and Stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <Select
                value={selectedFilter}
                onChange={handleFilterChange}
                displayEmpty
                sx={{
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& .MuiSelect-select': {
                    fontSize: '14px',
                    py: 1,
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
                    Wybierz warstwy do zaznaczenia
                  </Typography>
                </MenuItem>
                <MenuItem value="rastrowe">Rastrowe</MenuItem>
                <MenuItem value="wektorowe">Wektorowe</MenuItem>
                <MenuItem value="warstwy-spoza-projektu">Warstwy spoza projektu</MenuItem>
                <MenuItem value="wszystko">Wszystko</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Usuń z bazy danych" arrow>
              <IconButton 
                size="small" 
                onClick={handleDeleteClick}
                disabled={selectedLayers.size === 0}
                sx={{ 
                  color: selectedLayers.size > 0 ? '#dc2626' : '#d1d5db', 
                  '&:hover': { 
                    color: selectedLayers.size > 0 ? '#b91c1c' : '#d1d5db',
                    bgcolor: selectedLayers.size > 0 ? 'rgba(220, 38, 38, 0.1)' : 'transparent'
                  },
                  '&:disabled': {
                    color: '#d1d5db'
                  }
                }}
              >
                <DeleteIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Typography sx={{ fontSize: '14px', color: '#6b7280', ml: 'auto' }}>
              Warstwy: {filteredLayers.length}({selectedLayers.size})
            </Typography>
          </Box>

          {/* Layers List */}
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            <List sx={{ py: 0 }}>
              {filteredLayers.map((layer, index) => (
                <ListItem
                  key={layer.id}
                  onClick={() => handleLayerClick(layer.id)}
                  sx={{
                    borderBottom: index < filteredLayers.length - 1 ? '1px solid #e5e7eb' : 'none',
                    py: 1,
                    px: 2,
                    cursor: 'pointer',
                    bgcolor: selectedLayers.has(layer.id) ? '#e3f2fd' : 'transparent',
                    '&:hover': {
                      bgcolor: selectedLayers.has(layer.id) ? '#bbdefb' : '#f3f4f6',
                    },
                  }}
                >
                  <ListItemText
                    primary={layer.name}
                    primaryTypographyProps={{
                      fontSize: '14px',
                      color: theme.palette.text.primary,
                      fontWeight: selectedLayers.has(layer.id) ? 500 : 400,
                    }}
                  />

                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Przywróć warstwę z bazy danych" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreLayerClick(layer);
                          }}
                          sx={{ 
                            color: '#6b7280',
                            '&:hover': { 
                              color: theme.palette.primary.main,
                              bgcolor: 'rgba(59, 130, 246, 0.1)'
                            }
                          }}
                        >
                          <AddIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Informacje o warstwie" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowLayerInfo(e, layer);
                          }}
                          sx={{ 
                            color: '#6b7280',
                            '&:hover': { 
                              color: theme.palette.info.main,
                              bgcolor: 'rgba(33, 150, 243, 0.1)'
                            }
                          }}
                        >
                          <InfoIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </DialogContent>

      {/* Layer Information Popover */}
      <Popover
        open={Boolean(layerInfoAnchor)}
        anchorEl={layerInfoAnchor}
        onClose={handleCloseLayerInfo}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            minWidth: '200px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Informacje o warstwie
            </Typography>
            <IconButton
              size="small"
              onClick={handleCloseLayerInfo}
              sx={{ 
                color: '#6b7280',
                '&:hover': { bgcolor: 'rgba(107, 114, 128, 0.1)' }
              }}
            >
              <CloseIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </Box>
          
          {selectedLayerInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    mb: 0.5,
                  }}
                >
                  Rozmiar
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: theme.palette.text.primary,
                  }}
                >
                  {selectedLayerInfo.size || '0.09 MB'}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#e5e7eb' }} />

              <Box>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    mb: 0.5,
                  }}
                >
                  Typ warstwy
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: theme.palette.text.primary,
                  }}
                >
                  {selectedLayerInfo.layerType || 'Vector'}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#e5e7eb' }} />

              <Box>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    mb: 0.5,
                  }}
                >
                  Nazwa warstwy
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: theme.palette.text.primary,
                  }}
                >
                  {selectedLayerInfo.name}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Restore Layer Modal */}
      <RestoreLayerModal
        open={restoreLayerModalOpen}
        onClose={handleCloseRestoreLayerModal}
        onSubmit={handleRestoreLayerSubmit}
        layerName={selectedLayerToRestore?.name || ''}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={handleDeleteCancel}
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
          Potwierdzenie
          <IconButton 
            onClick={handleDeleteCancel} 
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
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              color: theme.palette.text.primary,
              mb: 3,
              lineHeight: 1.5,
            }}
          >
            Czy na pewno chcesz usunąć trwale warstwy z bazy danych?
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleDeleteConfirm}
              sx={{
                minWidth: '80px',
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
              Tak
            </Button>
            <Button
              variant="contained"
              onClick={handleDeleteCancel}
              sx={{
                minWidth: '80px',
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
              Nie
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}