'use client';

import React, { useState } from 'react';
import {
  Paper,
  IconButton,
  Tooltip,
  Box,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Straighten,
  CropFree,
  AddLocation,
  CameraAlt,
  Map,
  Settings,
  Info,
  Clear,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMeasurementMode, clearAllMeasurements } from '@/store/slices/drawSlice';
import { setMapStyle } from '@/store/slices/mapSlice';
import { MAP_STYLES } from '@/lib/mapbox/config';

const TOOLBAR_WIDTH = 60;

const RightToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { measurement } = useAppSelector((state) => state.draw);
  const { mapStyle } = useAppSelector((state) => state.map);

  const [styleMenuAnchor, setStyleMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDistanceMeasure = () => {
    dispatch(setMeasurementMode({
      distance: !measurement.isDistanceMode,
      area: false
    }));
  };

  const handleAreaMeasure = () => {
    dispatch(setMeasurementMode({
      distance: false,
      area: !measurement.isAreaMode
    }));
  };

  const handleClearMeasurements = () => {
    dispatch(clearAllMeasurements());
  };

  const handleStyleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStyleMenuAnchor(event.currentTarget);
  };

  const handleStyleMenuClose = () => {
    setStyleMenuAnchor(null);
  };

  const handleStyleChange = (styleUrl: string) => {
    dispatch(setMapStyle(styleUrl));
    handleStyleMenuClose();
  };

  const handleScreenshot = () => {
    // TODO: Implement map screenshot
    console.log('Screenshot feature coming soon...');
  };

  const handleAddMarker = () => {
    // TODO: Implement marker adding
    console.log('Add marker feature coming soon...');
  };

  const tools = [
    {
      id: 'distance',
      icon: Straighten,
      tooltip: 'Pomiar odległości',
      onClick: handleDistanceMeasure,
      active: measurement.isDistanceMode,
    },
    {
      id: 'area',
      icon: CropFree,
      tooltip: 'Pomiar powierzchni',
      onClick: handleAreaMeasure,
      active: measurement.isAreaMode,
    },
    {
      id: 'clear-measurements',
      icon: Clear,
      tooltip: 'Wyczyść pomiary',
      onClick: handleClearMeasurements,
      active: false,
      disabled: measurement.measurements.length === 0,
    },
    { id: 'divider' },
    {
      id: 'marker',
      icon: AddLocation,
      tooltip: 'Dodaj marker',
      onClick: handleAddMarker,
      active: false,
    },
    {
      id: 'screenshot',
      icon: CameraAlt,
      tooltip: 'Zrób zrzut ekranu',
      onClick: handleScreenshot,
      active: false,
    },
    {
      id: 'style',
      icon: Map,
      tooltip: 'Zmień styl mapy',
      onClick: handleStyleMenuOpen,
      active: false,
    },
    { id: 'divider' },
    {
      id: 'settings',
      icon: Settings,
      tooltip: 'Ustawienia',
      onClick: () => console.log('Settings coming soon...'),
      active: false,
    },
    {
      id: 'info',
      icon: Info,
      tooltip: 'Informacje',
      onClick: () => console.log('Info coming soon...'),
      active: false,
    },
  ];

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          position: 'fixed',
          top: '50%',
          right: 16,
          transform: 'translateY(-50%)',
          width: TOOLBAR_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1,
          zIndex: 1200,
          borderRadius: 2,
        }}
      >
        {tools.map((tool, index) => {
          if (tool.id === 'divider') {
            return (
              <Box
                key={`divider-${index}`}
                sx={{
                  width: '80%',
                  height: 1,
                  bgcolor: 'divider',
                  my: 1,
                }}
              />
            );
          }

          const IconComponent = tool.icon!;

          return (
            <Tooltip key={tool.id} title={tool.tooltip} placement="left">
              <span>
                <IconButton
                  onClick={tool.onClick}
                  disabled={tool.disabled}
                  sx={{
                    width: 44,
                    height: 44,
                    m: 0.5,
                    backgroundColor: tool.active ? 'primary.main' : 'transparent',
                    color: tool.active ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: tool.active ? 'primary.dark' : 'action.hover',
                    },
                    '&:disabled': {
                      color: 'text.disabled',
                    },
                  }}
                >
                  <IconComponent fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          );
        })}

        {/* Measurement info */}
        {(measurement.isDistanceMode || measurement.isAreaMode) && (
          <Box
            sx={{
              position: 'absolute',
              right: '100%',
              top: 0,
              mr: 1,
              bgcolor: 'background.paper',
              p: 1,
              borderRadius: 1,
              boxShadow: 2,
              minWidth: 120,
              fontSize: '0.75rem',
            }}
          >
            {measurement.isDistanceMode && 'Kliknij punkty na mapie'}
            {measurement.isAreaMode && 'Kliknij punkty obszaru'}
          </Box>
        )}
      </Paper>

      {/* Map Style Menu */}
      <Menu
        anchorEl={styleMenuAnchor}
        open={Boolean(styleMenuAnchor)}
        onClose={handleStyleMenuClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
      >
        {Object.entries(MAP_STYLES).map(([key, style]) => (
          <MenuItem
            key={key}
            onClick={() => handleStyleChange(style.style)}
            selected={mapStyle === style.style}
          >
            <ListItemIcon>
              <Map fontSize="small" />
            </ListItemIcon>
            <ListItemText>{style.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default RightToolbar;