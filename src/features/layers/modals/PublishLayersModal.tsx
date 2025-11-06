/**
 * PublishLayersModal - Modal do publikacji/odpublikowania warstw WMS/WFS
 *
 * Funkcjonalności:
 * - Wybór warstw do publikacji (checkboxy - wielokrotny wybór z Ctrl)
 * - Publikacja jako WMS/WFS do GeoServer
 * - Odpublikowanie usług
 * - Specjalne pozycjonowanie - NIE zasłania layer tree po lewej stronie
 */

'use client';

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LayersIcon from '@mui/icons-material/Layers';
import FolderIcon from '@mui/icons-material/Folder';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { LayerNode } from '@/types-app/layers';

interface PublishLayersModalProps {
  open: boolean;
  projectName: string;
  layers: LayerNode[];
  onClose: () => void;
  onPublish: (selectedLayerIds: string[]) => void;
  onUnpublish: () => void;
  isLoading?: boolean;
}

export function PublishLayersModal({
  open,
  projectName,
  layers,
  onClose,
  onPublish,
  onUnpublish,
  isLoading = false,
}: PublishLayersModalProps) {
  const theme = useTheme();
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedLayers([]);
    }
  }, [open]);

  // Flatten layer tree to get all individual layers (not groups)
  const flattenLayers = (nodes: LayerNode[]): LayerNode[] => {
    let result: LayerNode[] = [];
    for (const node of nodes) {
      if (node.type === 'group' && node.children) {
        result = result.concat(flattenLayers(node.children));
      } else if (node.type !== 'group') {
        result.push(node);
      }
    }
    return result;
  };

  const availableLayers = flattenLayers(layers);

  const handleToggleLayer = (layerId: string) => {
    setSelectedLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLayers.length === availableLayers.length) {
      setSelectedLayers([]);
    } else {
      setSelectedLayers(availableLayers.map((layer) => layer.id));
    }
  };

  const handlePublish = () => {
    if (selectedLayers.length > 0) {
      onPublish(selectedLayers);
    }
  };

  const handleUnpublish = () => {
    onUnpublish();
  };

  const isAllSelected = selectedLayers.length === availableLayers.length && availableLayers.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: 'absolute',
          left: '330px', // Pozycjonowanie obok layer tree (left panel ~310px + margin)
          top: '50%',
          transform: 'translateY(-50%)',
          m: 0,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          width: '420px',
          maxHeight: '600px',
          // Ensure modal doesn't overflow screen
          '@media (max-width: 1200px)': {
            left: '280px',
            width: '380px',
          },
          '@media (max-width: 900px)': {
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
          },
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Subtle backdrop - doesn't fully obscure layer tree
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: theme.palette.modal.header,
          color: theme.palette.modal.headerText,
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
        Publikuj usługi
        <IconButton
          onClick={onClose}
          size="small"
          disabled={isLoading}
          sx={{
            color: theme.palette.modal.headerText,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: theme.palette.modal.content,
          px: 3,
          py: 3,
        }}
      >
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary, mb: 2 }}>
          Zaznacz warstwy, które chcesz opublikować
        </Typography>

        {availableLayers.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Brak dostępnych warstw do publikacji
          </Alert>
        ) : (
          <>
            {/* Select All Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {selectedLayers.length} / {availableLayers.length} zaznaczonych
              </Typography>
              <Button
                size="small"
                onClick={handleSelectAll}
                disabled={isLoading}
                sx={{ textTransform: 'none', fontSize: '12px' }}
              >
                {isAllSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
              </Button>
            </Box>

            {/* Layer List */}
            <List
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: '4px',
                border: `1px solid ${theme.palette.divider}`,
                maxHeight: '300px',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: '#555',
                  },
                },
              }}
            >
              {availableLayers.map((layer) => (
                <ListItem
                  key={layer.id}
                  dense
                  disablePadding
                  sx={{
                    '&:hover': {
                      bgcolor: !isLoading ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    },
                  }}
                >
                  <ListItemButton
                    onClick={() => !isLoading && handleToggleLayer(layer.id)}
                    disabled={isLoading}
                    dense
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        edge="start"
                        checked={selectedLayers.includes(layer.id)}
                        tabIndex={-1}
                        disableRipple
                        disabled={isLoading}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <LayersIcon sx={{ fontSize: '20px', color: '#81c784' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={layer.name}
                      primaryTypographyProps={{
                        sx: {
                          fontSize: '14px',
                          fontWeight: 500,
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 2, fontSize: '12px' }}>
              <strong>Wskazówka:</strong> Przytrzymaj <kbd>Ctrl</kbd> aby zaznaczyć wiele warstw naraz
            </Alert>
          </>
        )}
      </DialogContent>

      {/* Separator "lub" */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 3,
          py: 1,
          bgcolor: theme.palette.modal.content,
        }}
      >
        <Divider sx={{ flex: 1 }} />
        <Typography
          sx={{
            px: 2,
            fontSize: '12px',
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          lub
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Box>

      {/* Footer - Przyciski Publikuj/Odpublikuj */}
      <DialogActions
        sx={{
          bgcolor: theme.palette.modal.content,
          px: 3,
          pb: 3,
          pt: 2,
          gap: 2,
          justifyContent: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
          flexDirection: 'column',
        }}
      >
        {/* Publish Button */}
        <Button
          onClick={handlePublish}
          variant="contained"
          fullWidth
          disabled={selectedLayers.length === 0 || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
            py: 1.5,
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: '#45a049' },
            '&:disabled': {
              bgcolor: '#e0e0e0',
              color: '#9e9e9e',
            }
          }}
        >
          {isLoading ? 'Publikowanie...' : 'Publikuj'}
        </Button>

        {/* Unpublish Button */}
        <Button
          onClick={handleUnpublish}
          variant="outlined"
          fullWidth
          disabled={isLoading}
          startIcon={<UnpublishedIcon />}
          sx={{
            borderColor: '#f44336',
            color: '#f44336',
            py: 1.5,
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#d32f2f',
              bgcolor: 'rgba(244, 67, 54, 0.04)',
            },
            '&:disabled': {
              borderColor: '#e0e0e0',
              color: '#9e9e9e',
            }
          }}
        >
          Odpublikuj
        </Button>
      </DialogActions>
    </Dialog>
  );
}
