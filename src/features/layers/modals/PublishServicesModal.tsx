/**
 * PublishServicesModal - Modal do publikacji usług WMS/WFS
 *
 * Funkcjonalności:
 * - Wybór warstw do publikacji (checkboxy - wielokrotny wybór z Ctrl)
 * - Publikacja jako WMS/WFS do GeoServer
 * - Odpublikowanie usług
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
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LayersIcon from '@mui/icons-material/Layers';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LayerNode } from '@/types-app/layers';

interface PublishServicesModalProps {
  open: boolean;
  projectName: string;
  layers: LayerNode[];
  onClose: () => void;
  onPublish: (selectedLayerIds: string[]) => void;
  isLoading?: boolean;
}

// Helper to count total layers (including nested ones)
const countAllLayers = (nodes: LayerNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countAllLayers(node.children);
    }
  }
  return count;
};

export function PublishServicesModal({
  open,
  projectName,
  layers,
  onClose,
  onPublish,
  isLoading = false,
}: PublishServicesModalProps) {
  const theme = useTheme();
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedLayers(new Set());
      // Auto-expand all groups
      const allGroupIds = new Set<string>();
      const collectGroupIds = (nodes: LayerNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'group' && node.children) {
            allGroupIds.add(node.id);
            collectGroupIds(node.children);
          }
        });
      };
      collectGroupIds(layers);
      setExpandedGroups(allGroupIds);
    }
  }, [open, layers]);

  // Flatten layer tree to get all individual layers AND groups
  const flattenLayers = (nodes: LayerNode[]): LayerNode[] => {
    let result: LayerNode[] = [];
    for (const node of nodes) {
      result.push(node); // Include the node itself (even if it's a group)
      if (node.children) {
        result = result.concat(flattenLayers(node.children));
      }
    }
    return result;
  };

  const availableLayers = flattenLayers(layers);
  const totalLayerCount = countAllLayers(layers);

  const handleToggleLayer = (layerId: string) => {
    setSelectedLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLayers.size === totalLayerCount) {
      setSelectedLayers(new Set());
    } else {
      const allIds = new Set<string>();
      const collectIds = (nodes: LayerNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          if (node.children) {
            collectIds(node.children);
          }
        });
      };
      collectIds(layers);
      setSelectedLayers(allIds);
    }
  };

  const handlePublish = () => {
    if (selectedLayers.size > 0) {
      onPublish(Array.from(selectedLayers));
    }
  };

  const isAllSelected = selectedLayers.size === totalLayerCount && totalLayerCount > 0;
  const isSomeSelected = selectedLayers.size > 0 && selectedLayers.size < totalLayerCount;

  // Recursive function to render layer tree with indentation
  const renderLayerTree = (nodes: LayerNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      const isGroup = node.type === 'group';
      const isExpanded = expandedGroups.has(node.id);
      const isChecked = selectedLayers.has(node.id);

      return (
        <Box key={node.id}>
          <ListItem
            dense
            button
            onClick={() => !isLoading && handleToggleLayer(node.id)}
            disabled={isLoading}
            sx={{
              pl: level * 3 + 2,
              pr: 2,
              '&:hover': {
                bgcolor: !isLoading ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Checkbox
                edge="start"
                checked={isChecked}
                indeterminate={isGroup && !isChecked && node.children?.some(child => selectedLayers.has(child.id))}
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

            {/* Expand/Collapse icon for groups */}
            {isGroup && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleGroup(node.id);
                }}
                sx={{
                  minWidth: 24,
                  width: 24,
                  height: 24,
                  mr: 0.5,
                  p: 0
                }}
              >
                {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            )}

            <ListItemIcon sx={{ minWidth: 36 }}>
              {isGroup ? (
                <FolderIcon sx={{ fontSize: '20px', color: '#FFB74D' }} />
              ) : (
                <LayersIcon sx={{ fontSize: '20px', color: '#81c784' }} />
              )}
            </ListItemIcon>

            <ListItemText
              primary={node.name}
              secondary={isGroup ? `Grupa` : node.type}
              primaryTypographyProps={{
                sx: {
                  fontSize: '14px',
                  fontWeight: isGroup ? 600 : 500,
                }
              }}
              secondaryTypographyProps={{
                sx: {
                  fontSize: '11px',
                  color: 'text.secondary'
                }
              }}
            />
          </ListItem>

          {/* Render children if group is expanded */}
          {isGroup && isExpanded && node.children && (
            <Box>{renderLayerTree(node.children, level + 1)}</Box>
          )}
        </Box>
      );
    });
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
          maxWidth: '500px',
          width: '90%',
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
                {selectedLayers.size} / {totalLayerCount} zaznaczonych
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

            {/* Layer Tree List */}
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '4px',
                border: `1px solid ${theme.palette.modal.border}`,
                maxHeight: '400px',
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
              {renderLayerTree(layers, 0)}
            </Box>

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 2, fontSize: '12px' }}>
              <strong>Wskazówka:</strong> Przytrzymaj <kbd>Ctrl</kbd> aby zaznaczyć wiele warstw naraz
            </Alert>
          </>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: theme.palette.modal.content,
          px: 3,
          pb: 3,
          pt: 0,
          gap: 2,
          justifyContent: 'flex-end',
          borderTop: `1px solid ${theme.palette.modal.border}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{
            borderColor: theme.palette.modal.border,
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Anuluj
        </Button>
        <Button
          onClick={handlePublish}
          variant="contained"
          disabled={selectedLayers.size === 0 || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          {isLoading ? 'Publikowanie...' : 'Publikuj'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
