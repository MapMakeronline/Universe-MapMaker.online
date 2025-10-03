'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  IconButton,
  MenuItem,
  useTheme,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

interface DatabaseLayer {
  id: string;
  nazwa: string;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  rozmiar: string;
  inProject?: boolean; // Backend będzie dostarczał
}

interface Warstwa {
  id: string;
  nazwa: string;
  widoczna?: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

interface LayerManagerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    deletedLayerIds: string[];
    restoredLayers: Array<{ id: string; nazwa: string; typ: 'wektor' | 'raster'; grupaNadrzedna?: string }>;
  }) => void;
  existingGroups: Warstwa[];
}

type FilterType = 'wszystko' | 'rastrowe' | 'wektorowe' | 'spoza-projektu';

const LayerManagerModal: React.FC<LayerManagerModalProps> = ({
  open,
  onClose,
  onSubmit,
  existingGroups,
}) => {
  const theme = useTheme();
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('wszystko');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [infoLayerId, setInfoLayerId] = useState<string | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreLayerId, setRestoreLayerId] = useState<string | null>(null);
  const [restoreFormData, setRestoreFormData] = useState({
    nazwaWarstwy: '',
    grupaNadrzedna: 'Stwórz poza grupami',
  });
  const [deletedLayerIds, setDeletedLayerIds] = useState<string[]>([]);
  const [restoredLayers, setRestoredLayers] = useState<Array<{ id: string; nazwa: string; typ: 'wektor' | 'raster'; grupaNadrzedna?: string }>>([]);

  // Mock database layers (będzie z backendu)
  const [databaseLayers] = useState<DatabaseLayer[]>([
    { id: 'db-layer-1', nazwa: 'Warstwa testowa 1', typ: 'wektor', rozmiar: '2.5 MB', inProject: true },
    { id: 'db-layer-2', nazwa: 'Warstwa testowa 2', typ: 'raster', rozmiar: '5.1 MB', inProject: false },
    { id: 'db-layer-3', nazwa: 'Warstwa testowa 3', typ: 'wektor', rozmiar: '1.2 MB', inProject: false },
    { id: 'db-layer-4', nazwa: 'Warstwa WMS', typ: 'wms', rozmiar: '3.8 MB', inProject: true },
  ]);

  // Filter layers based on search and type
  const getFilteredLayers = () => {
    let filtered = databaseLayers;

    // Filter by search
    if (searchFilter) {
      filtered = filtered.filter(layer =>
        layer.nazwa.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter === 'rastrowe') {
      filtered = filtered.filter(layer => layer.typ === 'raster');
    } else if (typeFilter === 'wektorowe') {
      filtered = filtered.filter(layer => layer.typ === 'wektor' || layer.typ === 'wms');
    } else if (typeFilter === 'spoza-projektu') {
      filtered = filtered.filter(layer => !layer.inProject);
    }

    return filtered;
  };

  const filteredLayers = getFilteredLayers();
  const selectedCount = selectedLayers.length;

  const handleLayerClick = (layerId: string) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedLayers.length > 0) {
      setDeletedLayerIds(prev => [...prev, ...selectedLayers]);
      setSelectedLayers([]);
    }
  };

  const handleInfoClick = (layerId: string) => {
    setInfoLayerId(prev => prev === layerId ? null : layerId);
  };

  const handleRestoreClick = (layer: DatabaseLayer) => {
    setRestoreLayerId(layer.id);
    setRestoreFormData({
      nazwaWarstwy: layer.nazwa,
      grupaNadrzedna: 'Stwórz poza grupami',
    });
    setRestoreModalOpen(true);
  };

  const handleRestoreSubmit = () => {
    if (restoreLayerId) {
      const layer = databaseLayers.find(l => l.id === restoreLayerId);
      if (layer) {
        setRestoredLayers(prev => [...prev, {
          id: restoreLayerId,
          nazwa: restoreFormData.nazwaWarstwy,
          typ: layer.typ === 'raster' ? 'raster' : 'wektor',
          grupaNadrzedna: restoreFormData.grupaNadrzedna,
        }]);
      }
      setRestoreModalOpen(false);
      setRestoreLayerId(null);
      setRestoreFormData({
        nazwaWarstwy: '',
        grupaNadrzedna: 'Stwórz poza grupami',
      });
    }
  };

  const handleSubmit = () => {
    onSubmit({
      deletedLayerIds,
      restoredLayers,
    });
    // Reset state
    setDeletedLayerIds([]);
    setRestoredLayers([]);
    setSelectedLayers([]);
  };

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

  const getLayerInfo = (layerId: string) => {
    return databaseLayers.find(l => l.id === layerId);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxWidth: '550px',
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
          Zarządzaj warstwami
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
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Znajdź warstwę"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                borderRadius: '20px',
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
            }}
          />

          {/* Section Title and Controls */}
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1.5,
              }}
            >
              Warstwy w bazie danych projektu:
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {/* Filter Dropdown */}
              <TextField
                select
                size="small"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    fontSize: '13px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                  },
                }}
              >
                <MenuItem value="wszystko">Wszystko</MenuItem>
                <MenuItem value="rastrowe">Rastrowe</MenuItem>
                <MenuItem value="wektorowe">Wektorowe</MenuItem>
                <MenuItem value="spoza-projektu">Warstwy spoza projektu</MenuItem>
              </TextField>

              {/* Delete Button */}
              <Tooltip title="Usuń z bazy danych" arrow>
                <span>
                  <IconButton
                    onClick={handleDeleteSelected}
                    disabled={selectedLayers.length === 0}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.error.main,
                      },
                      '&.Mui-disabled': {
                        color: theme.palette.action.disabled,
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Counter */}
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                Warstwy: {filteredLayers.length}({selectedCount})
              </Typography>
            </Box>
          </Box>

          {/* Layers List */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '400px',
            }}
          >
            {filteredLayers.map((layer) => (
              <Box key={layer.id}>
                <Box
                  onClick={() => handleLayerClick(layer.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    mb: 0.5,
                    bgcolor: selectedLayers.includes(layer.id) ? '#8b93a7' : 'white',
                    color: selectedLayers.includes(layer.id) ? 'white' : theme.palette.text.primary,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: selectedLayers.includes(layer.id) ? '#7a8199' : '#f0f0f0',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <StorageIcon
                      sx={{
                        fontSize: '20px',
                        color: selectedLayers.includes(layer.id) ? 'white' : theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {layer.nazwa}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: 'flex', gap: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Restore button - only if not in project */}
                    {!layer.inProject && (
                      <IconButton
                        size="small"
                        onClick={() => handleRestoreClick(layer)}
                        sx={{
                          color: selectedLayers.includes(layer.id) ? 'white' : theme.palette.text.secondary,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.1)',
                          }
                        }}
                      >
                        <AddIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    )}

                    {/* Info button - always available */}
                    <IconButton
                      size="small"
                      onClick={() => handleInfoClick(layer.id)}
                      sx={{
                        color: selectedLayers.includes(layer.id) ? 'white' : theme.palette.text.secondary,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <InfoIcon sx={{ fontSize: '18px' }} />
                    </IconButton>

                    {/* Storage icon - always visible */}
                    <StorageIcon
                      sx={{
                        fontSize: '20px',
                        ml: 0.5,
                        color: selectedLayers.includes(layer.id) ? 'white' : theme.palette.text.secondary,
                      }}
                    />
                  </Box>
                </Box>

                {/* Info Panel - Collapsible */}
                <Collapse in={infoLayerId === layer.id} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '4px',
                      p: 2,
                      mb: 1,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary }}>
                        Rozmiar
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary }}>
                        {layer.rozmiar}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary }}>
                        Typ warstwy
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary }}>
                        {layer.typ === 'wektor' ? 'Vector' : layer.typ === 'raster' ? 'Raster' : layer.typ}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary }}>
                        Nazwa warstwy
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary }}>
                        {layer.nazwa}
                      </Typography>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            ))}

            {filteredLayers.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  color: theme.palette.text.secondary,
                }}
              >
                <Typography sx={{ fontSize: '14px', fontStyle: 'italic' }}>
                  Brak warstw do wyświetlenia
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            bgcolor: '#f7f9fc',
            px: 3,
            py: 2,
            gap: 2,
          }}
        >
          <Box
            onClick={onClose}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #d1d5db',
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: '#f3f4f6',
              },
            }}
          >
            Anuluj
          </Box>
          <Box
            onClick={handleSubmit}
            sx={{
              bgcolor: '#4a5568',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#2d3748',
              },
            }}
          >
            Zatwierdź
          </Box>
        </DialogActions>
      </Dialog>

      {/* Restore Layer Modal */}
      <Dialog
        open={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxWidth: '450px',
            width: '90%',
          }
        }}
      >
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
          Przywróć warstwę z bazy danych
          <IconButton
            onClick={() => setRestoreModalOpen(false)}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon sx={{ fontSize: '20px' }} />
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
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Nazwa warstwy
              </Typography>
              <TextField
                fullWidth
                value={restoreFormData.nazwaWarstwy}
                onChange={(e) => setRestoreFormData(prev => ({ ...prev, nazwaWarstwy: e.target.value }))}
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
                value={restoreFormData.grupaNadrzedna}
                onChange={(e) => setRestoreFormData(prev => ({ ...prev, grupaNadrzedna: e.target.value }))}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                  },
                }}
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                {allGroups.map(group => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.nazwa}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Dodaj warstwę Button */}
            <Box
              onClick={handleRestoreSubmit}
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                py: 1,
                px: 2,
                borderRadius: '4px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Dodaj warstwę
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LayerManagerModal;
