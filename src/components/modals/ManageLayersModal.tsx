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
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface LayerData {
  id: string;
  name: string;
  type: 'database' | 'vector' | 'raster';
}

interface ManageLayersModalProps {
  open: boolean;
  onClose: () => void;
  onRestoreLayer: (layerId: string) => void;
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
  const [layers] = useState<LayerData[]>([
    { id: 'dzialki-za-mniej', name: 'DzialkiZaMniej', type: 'database' },
    { id: 'kupie-dzialke', name: 'Kupię Działkę', type: 'database' },
    { id: 'pelna-2000', name: 'Pełna 2000', type: 'database' },
    { id: 'wniosek-do-projektu-studium', name: 'Wniosek do projektu Studium', type: 'database' },
    { id: 'dzialki-636433', name: 'dzialki4636433', type: 'database' },
    { id: 'hel', name: 'hel', type: 'database' },
    { id: 'lukasz', name: 'lukasz', type: 'database' },
    { id: 'official-documentation', name: 'officialdocumentation', type: 'database' },
    { id: 'ukyrtiufg', name: 'ukyrtiufg', type: 'database' },
    { id: 'zoning-element', name: 'zoningelement', type: 'database' },
    { id: 'mateusz039-op-pl', name: 'mateusz039_op_pl', type: 'database' },
    { id: 'walera-z', name: 'walera_z', type: 'database' },
    { id: 'barbaraptak62-gmail-com', name: 'barbaraptak62_gmail_com', type: 'database' },
    { id: 'erik777-gmail-com', name: '7777erik777_gmail_com', type: 'database' },
    { id: 'za-timura', name: 'za_timura', type: 'database' },
    { id: 'marsonyteam-gmail-com', name: 'marsonyteam_gmail_com', type: 'database' },
  ]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedItems(newExpanded);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedFilter('');
    setExpandedItems(new Set());
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

            <IconButton size="small" sx={{ color: '#6b7280' }}>
              <DeleteIcon sx={{ fontSize: '18px' }} />
            </IconButton>

            <Typography sx={{ fontSize: '14px', color: '#6b7280', ml: 'auto' }}>
              Warstwy: {filteredLayers.length}(0)
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
                  sx={{
                    borderBottom: index < filteredLayers.length - 1 ? '1px solid #e5e7eb' : 'none',
                    py: 1,
                    px: 2,
                    '&:hover': {
                      bgcolor: '#f3f4f6',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <StorageIcon sx={{ color: '#6b7280', fontSize: '18px' }} />
                    <ListItemText
                      primary={layer.name}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        color: theme.palette.text.primary,
                      }}
                    />
                  </Box>

                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Rozwiń/Zwiń warstwę" arrow>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpanded(layer.id)}
                          sx={{ color: '#6b7280' }}
                        >
                          {expandedItems.has(layer.id) ? (
                            <KeyboardArrowUpIcon sx={{ fontSize: '16px' }} />
                          ) : (
                            <KeyboardArrowDownIcon sx={{ fontSize: '16px' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Przywróć warstwę z bazy danych" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleAddLayer(layer.id)}
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
                          onClick={() => onLayerInfo(layer.id)}
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

          {/* Restore Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleRestoreLayer}
              sx={{
                minWidth: '200px',
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
              Przywróć warstwę z bazy danych
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}