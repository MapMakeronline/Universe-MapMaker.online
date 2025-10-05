'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteBuilding, selectBuilding, setAttributeModalOpen } from '@/store/slices/buildingsSlice';

const BuildingsPanel: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { buildings, selectedBuildingId } = useAppSelector((state) => state.buildings);
  const [expanded, setExpanded] = useState(true);

  const buildingsList = Object.values(buildings);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSelectBuilding = (buildingId: string) => {
    dispatch(selectBuilding(buildingId));
    dispatch(setAttributeModalOpen(true));
  };

  const handleDeleteBuilding = (e: React.MouseEvent, buildingId: string) => {
    e.stopPropagation();
    dispatch(deleteBuilding(buildingId));
  };

  return (
    <Box
      sx={{
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        onClick={handleToggleExpand}
      >
        <IconButton size="small" sx={{ mr: 1, p: 0 }}>
          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        </IconButton>
        <LayersIcon sx={{ mr: 1.5, fontSize: '20px', color: theme.palette.primary.main }} />
        <Typography sx={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>
          Budynki 3D
        </Typography>
        <Chip
          label={buildingsList.length}
          size="small"
          sx={{
            height: '20px',
            fontSize: '12px',
            bgcolor: theme.palette.primary.main,
            color: 'white',
          }}
        />
      </Box>

      {/* Buildings List */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {buildingsList.length === 0 ? (
          <Box sx={{ px: 3, py: 2 }}>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              Kliknij na budynek 3D na mapie, aby dodać go do listy
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {buildingsList.map((building) => (
              <ListItem
                key={building.id}
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edytuj atrybuty">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBuilding(building.id);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                        }}
                      >
                        <EditIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleDeleteBuilding(e, building.id)}
                        sx={{
                          color: theme.palette.error.main,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                sx={{
                  borderLeft: building.selected
                    ? `3px solid ${theme.palette.primary.main}`
                    : '3px solid transparent',
                  bgcolor: building.selected ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemButton
                  onClick={() => handleSelectBuilding(building.id)}
                  sx={{
                    pl: 5,
                    pr: 10,
                    py: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={building.name}
                    secondary={`Atrybuty: ${building.attributes.length}`}
                    primaryTypographyProps={{
                      fontSize: '13px',
                      fontWeight: building.selected ? 600 : 400,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '12px',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Collapse>
    </Box>
  );
};

export default BuildingsPanel;
