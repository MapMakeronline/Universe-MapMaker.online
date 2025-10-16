'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LayersIcon from '@mui/icons-material/Layers';
import { useMap } from 'react-map-gl';
import { detect3DLayers, getExtrusionLayers, getModelLayers, get3DLayerStats } from '@/mapbox/3d-layer-detection';
import { removeCustom3DModel, listCustom3DModels } from '@/mapbox/custom-3d-models';
import { mapLogger } from '@/tools/logger';

/**
 * 3D Objects Panel Component
 *
 * Displays all 3D layers on the map:
 * - Fill-extrusion layers (buildings)
 * - Model layers (custom 3D objects - GLB/GLTF)
 *
 * Allows management of custom 3D models (delete, edit)
 */
export const Objects3DPanel: React.FC = () => {
  const { current: mapRef } = useMap();
  const [extrusionLayers, setExtrusionLayers] = useState<string[]>([]);
  const [modelLayers, setModelLayers] = useState<string[]>([]);
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);

  // Refresh 3D layers when map style changes
  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap();

    const refreshLayers = () => {
      // Get all 3D layers
      const extrusions = getExtrusionLayers(map);
      const models = getModelLayers(map);
      const customModelIds = listCustom3DModels(map);

      setExtrusionLayers(extrusions);
      setModelLayers(models);
      setCustomModels(customModelIds);

      // Log statistics
      get3DLayerStats(map);
    };

    // Initial load
    refreshLayers();

    // Listen to style changes (when user switches basemap)
    map.on('styledata', refreshLayers);

    return () => {
      map.off('styledata', refreshLayers);
    };
  }, [mapRef]);

  const handleDeleteModel = (modelId: string) => {
    if (!mapRef) return;

    const map = mapRef.getMap();
    const removed = removeCustom3DModel(map, modelId);

    if (removed) {
      // Refresh list
      const customModelIds = listCustom3DModels(map);
      setCustomModels(customModelIds);
      mapLogger.log(`✅ Deleted custom 3D model: ${modelId}`);
    }
  };

  const total3DLayers = extrusionLayers.length + modelLayers.length;

  if (total3DLayers === 0) {
    return null; // Hide panel if no 3D layers
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        bgcolor: 'background.paper',
        boxShadow: 1,
        '&:before': { display: 'none' }, // Remove default divider
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 48,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        <ViewInArIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Obiekty 3D
        </Typography>
        <Chip
          label={total3DLayers}
          size="small"
          sx={{
            height: 20,
            fontSize: '11px',
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 600,
          }}
        />
      </AccordionSummary>

      <AccordionDetails sx={{ p: 2, pt: 0 }}>
        {/* Fill-Extrusion Layers (Buildings) */}
        {extrusionLayers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LayersIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Budynki 3D ({extrusionLayers.length})
              </Typography>
            </Box>
            {extrusionLayers.map((layerId) => (
              <Box
                key={layerId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                  px: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  {layerId}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Model Layers (Custom 3D Objects) */}
        {modelLayers.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ViewInArIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Modele 3D ({modelLayers.length})
              </Typography>
            </Box>
            {modelLayers.map((layerId) => {
              const modelId = layerId.replace('model-layer-', '');
              const isCustom = customModels.includes(modelId);

              return (
                <Box
                  key={layerId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.5,
                    px: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '13px', flex: 1 }}>
                    {isCustom ? modelId : layerId}
                  </Typography>

                  {/* Actions for custom models only */}
                  {isCustom && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edytuj model">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // TODO: Open edit dialog
                            mapLogger.log(`Edit model: ${modelId}`);
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Usuń model">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteModel(modelId)}
                          sx={{ p: 0.5, color: 'error.main' }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Empty state */}
        {total3DLayers === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Brak obiektów 3D na mapie
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default Objects3DPanel;
