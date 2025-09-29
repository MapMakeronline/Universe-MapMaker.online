'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  Timeline,
  Pentagon,
  CropDin,
  Clear,
  GetApp,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDrawMode, clearAllFeatures } from '@/store/slices/drawSlice';
import { DrawTools } from '@/types/geometry';

const DrawingTools: React.FC = () => {
  const dispatch = useAppDispatch();
  const { draw } = useAppSelector((state) => state.draw);

  const handleToolSelect = (mode: string) => {
    console.log('🖱️ MUI DrawingTools: Selected tool mode:', mode);
    console.log('🖱️ MUI DrawingTools: Current Redux state before dispatch:', draw);
    console.log('🖱️ MUI DrawingTools: Dispatching setDrawMode...');
    dispatch(setDrawMode(mode as any));
    console.log('🖱️ MUI DrawingTools: setDrawMode dispatched');

    // Test if dispatch worked
    setTimeout(() => {
      console.log('🖱️ MUI DrawingTools: Redux state after dispatch (100ms later):', draw);
    }, 100);
  };

  const handleClear = () => {
    dispatch(clearAllFeatures());
  };

  const handleExport = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: draw.features,
    };

    const dataStr = JSON.stringify(geojson, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'mapa-obiekty.geojson';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const IconMap = {
    LocationOn,
    Timeline,
    Pentagon,
    CropDin,
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ px: 2, py: 1, fontWeight: 600 }}>
        Narzędzia rysowania
      </Typography>

      <Box sx={{ px: 2, pb: 2 }}>
        {/* Drawing tools */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {DrawTools.map((tool) => {
            const IconComponent = IconMap[tool.icon as keyof typeof IconMap];
            const isActive = draw.mode === tool.mode;

            return (
              <Tooltip key={tool.mode} title={tool.tooltip} placement="right">
                <Button
                  variant={isActive ? "contained" : "outlined"}
                  startIcon={<IconComponent />}
                  onClick={() => handleToolSelect(tool.mode)}
                  size="small"
                  sx={{
                    justifyContent: 'flex-start',
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  {tool.label}
                </Button>
              </Tooltip>
            );
          })}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Wyczyść wszystkie obiekty" placement="right">
            <span>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClear}
                size="small"
                color="error"
                disabled={draw.features.length === 0}
                sx={{ justifyContent: 'flex-start' }}
              >
                Wyczyść
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Eksportuj jako GeoJSON" placement="right">
            <span>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExport}
                size="small"
                disabled={draw.features.length === 0}
                sx={{ justifyContent: 'flex-start' }}
              >
                Eksportuj
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Stats */}
        {draw.features.length > 0 && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption">
              Obiekty: {draw.features.length}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DrawingTools;