'use client';

import React from 'react';
import {
  Checkbox,
  FormControlLabel,
  Box,
  Slider,
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Folder,
  FolderOpen,
  Layers,
  Place,
  Business,
  Timeline,
  Park,
  Water,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  toggleLayerVisibility,
  setLayerOpacity,
  toggleGroupExpanded,
} from '@/store/slices/layersSlice';
import { LayerNode } from '@/types/layers';

const IconMap = {
  folder: Folder,
  layer: Layers,
  points: Place,
  buildings: Business,
  roads: Timeline,
  green: Park,
  water: Water,
};

interface LayerTreeItemProps {
  layer: LayerNode;
  level: number;
}

const LayerTreeItem: React.FC<LayerTreeItemProps> = ({ layer, level }) => {
  const dispatch = useAppDispatch();
  const { expandedGroups } = useAppSelector((state) => state.layers);

  const IconComponent = IconMap[layer.icon as keyof typeof IconMap] || Layers;
  const isExpanded = expandedGroups.includes(layer.id);

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    dispatch(toggleLayerVisibility(layer.id));
  };

  const handleOpacityChange = (event: Event, value: number | number[]) => {
    dispatch(setLayerOpacity({ id: layer.id, opacity: value as number }));
  };

  const handleGroupToggle = () => {
    if (layer.type === 'group') {
      dispatch(toggleGroupExpanded(layer.id));
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          px: 1,
          pl: level * 2,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {/* Group expand/collapse button */}
        {layer.type === 'group' && (
          <IconButton
            size="small"
            onClick={handleGroupToggle}
            sx={{ mr: 0.5, p: 0.25 }}
          >
            {isExpanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        )}

        {/* Layer icon */}
        <IconComponent
          sx={{
            fontSize: 18,
            mr: 1,
            color: layer.color || 'text.secondary',
          }}
        />

        {/* Visibility checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={layer.visible}
              onChange={handleVisibilityChange}
              size="small"
              sx={{ p: 0.5 }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {layer.name}
            </Typography>
          }
          sx={{ flexGrow: 1, mr: 0 }}
        />
      </Box>

      {/* Opacity slider for layers */}
      {layer.type === 'layer' && layer.visible && (
        <Box sx={{ px: 2, pb: 1, pl: level * 2 + 4 }}>
          <Typography variant="caption" gutterBottom>
            Przezroczystość: {Math.round(layer.opacity * 100)}%
          </Typography>
          <Slider
            value={layer.opacity}
            onChange={handleOpacityChange}
            min={0}
            max={1}
            step={0.1}
            size="small"
            sx={{ color: layer.color || 'primary.main' }}
          />
        </Box>
      )}

      {/* Children for groups */}
      {layer.type === 'group' && layer.children && (
        <Collapse in={isExpanded}>
          {layer.children.map((child) => (
            <LayerTreeItem
              key={child.id}
              layer={child}
              level={level + 1}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
};

const LayerTree: React.FC = () => {
  const { layers } = useAppSelector((state) => state.layers);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ px: 2, py: 1, fontWeight: 600 }}>
        Warstwy
      </Typography>
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {layers.map((layer) => (
          <LayerTreeItem key={layer.id} layer={layer} level={0} />
        ))}
      </Box>
    </Box>
  );
};

export default LayerTree;