'use client';

import React, { useState, useEffect, useRef } from 'react';
import Fab from '@mui/material/Fab';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { useMediaQuery } from '@mui/material';
import Add from '@mui/icons-material/Add';
import Check from '@mui/icons-material/Check';
import Place from '@mui/icons-material/Place';
import Timeline from '@mui/icons-material/Timeline';
import Polyline from '@mui/icons-material/Polyline';
import Close from '@mui/icons-material/Close';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setDrawMode } from '@/redux/slices/drawSlice';
import { addDrawnLayer } from '@/redux/slices/layersSlice';
type FABMode = 'draw-select' | 'drawing';
type DrawType = 'point' | 'line' | 'polygon' | null;

// Szerokość prawego toolbara + marginesy
const RIGHT_TOOLBAR_WIDTH = 56;
const RIGHT_TOOLBAR_MARGIN = 16;

interface MobileFABProps {}

const MobileFAB: React.FC<MobileFABProps> = () => {
  const theme = useTheme();
  const { current: map } = useMap();
  const dispatch = useAppDispatch();
  const { draw, identify } = useAppSelector((state) => state.draw);

  // Responsywność
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fabRightPosition = 16; // Fixed right position (no more right toolbar)

  const [mode, setMode] = useState<FABMode>('draw-select');
  const [selectedDrawType, setSelectedDrawType] = useState<DrawType>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Reset drawing mode when identify is activated
  useEffect(() => {
    if (identify.isActive && mode === 'drawing') {
      console.log('🔍 MobileFAB: Identify active - resetting drawing mode');
      dispatch(setDrawMode('simple_select'));
      setMode('draw-select');
      setSelectedDrawType(null);
      setSpeedDialOpen(false);
    }
  }, [identify.isActive, mode, dispatch]);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 50ms vibration
    }
  };

  const handleDrawTypeSelect = (type: DrawType) => {
    triggerHapticFeedback(); // Haptic feedback on selection

    setSelectedDrawType(type);
    setMode('drawing');
    setSpeedDialOpen(false);

    // Activate native Mapbox GL Draw mode via Redux
    // TRYB POZOSTAJE AKTYWNY - użytkownik może rysować wiele elementów
    let drawMode = 'simple_select';
    switch (type) {
      case 'point':
        drawMode = 'draw_point';
        break;
      case 'line':
        drawMode = 'draw_line_string';
        break;
      case 'polygon':
        drawMode = 'draw_polygon';
        break;
    }

    dispatch(setDrawMode(drawMode as any));
    console.log('📱 Activated Mapbox GL Draw mode:', drawMode, '- można dodać wiele elementów');
  };

  const handleConfirmDrawing = () => {
    triggerHapticFeedback(); // Haptic feedback on confirm

    // Pobierz WSZYSTKIE narysowane features z Redux
    if (draw.features.length > 0) {
      const typeName = selectedDrawType === 'point' ? 'Punkty'
        : selectedDrawType === 'line' ? 'Linie'
        : 'Poligony';

      const newLayerName = `${typeName} - ${new Date().toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      console.log(`📱 Tworzenie nowej warstwy: "${newLayerName}" z ${draw.features.length} elementami:`, draw.features);

      // Zapisz jako warstwę w drzewie warstw
      dispatch(addDrawnLayer({
        name: newLayerName,
        type: selectedDrawType!,
        features: draw.features,
      }));

      // Powiadomienie dla użytkownika
      alert(`✓ Utworzono warstwę "${newLayerName}" z ${draw.features.length} elementami`);
    } else {
      alert('⚠ Nie narysowano żadnych elementów. Dodaj przynajmniej jeden element przed zatwierdzeniem.');
      return;
    }

    // Powrót do trybu select i przejście do wyboru typu rysowania (nie lokalizacji!)
    dispatch(setDrawMode('simple_select'));
    setMode('draw-select');
    setSpeedDialOpen(true);
    setSelectedDrawType(null);
  };

  const renderFAB = () => {
    // HIDE FAB when identify mode is active (prevents blocking identify tool)
    if (identify.isActive) {
      return null;
    }

    switch (mode) {
      case 'draw-select':
        return (
          <SpeedDial
            ariaLabel="Drawing tools"
            icon={<SpeedDialIcon icon={<Add sx={{ fontSize: 28 }} />} />}
            onClose={() => setSpeedDialOpen(false)}
            onOpen={() => {
              triggerHapticFeedback();
              setSpeedDialOpen(true);
            }}
            open={speedDialOpen}
            direction="left"
            FabProps={{
              size: isMobile ? 'large' : 'medium', // Larger on mobile for better touch target
            }}
            sx={{
              position: 'fixed',
              top: 366, // Under MeasurementFAB
              right: fabRightPosition,
              zIndex: 1400, // Higher than modals (1300) to stay on top
              transition: 'right 0.3s ease-in-out',
              '& .MuiSpeedDial-fab': {
                bgcolor: theme.palette.primary.main,
                width: isMobile ? 64 : 56, // Larger touch target on mobile
                height: isMobile ? 64 : 56,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
                // Better touch feedback
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
            }}
          >
            <SpeedDialAction
              key="point"
              icon={<Place sx={{ fontSize: 24 }} />}
              tooltipTitle="Punkt"
              onClick={() => handleDrawTypeSelect('point')}
              FabProps={{
                sx: {
                  width: isMobile ? 52 : 48, // Larger action buttons on mobile
                  height: isMobile ? 52 : 48,
                  '&:active': {
                    transform: 'scale(0.9)',
                  },
                },
              }}
            />
            <SpeedDialAction
              key="line"
              icon={<Timeline sx={{ fontSize: 24 }} />}
              tooltipTitle="Linia"
              onClick={() => handleDrawTypeSelect('line')}
              FabProps={{
                sx: {
                  width: isMobile ? 52 : 48,
                  height: isMobile ? 52 : 48,
                  '&:active': {
                    transform: 'scale(0.9)',
                  },
                },
              }}
            />
            <SpeedDialAction
              key="polygon"
              icon={<Polyline sx={{ fontSize: 24 }} />}
              tooltipTitle="Poligon"
              onClick={() => handleDrawTypeSelect('polygon')}
              FabProps={{
                sx: {
                  width: isMobile ? 52 : 48,
                  height: isMobile ? 52 : 48,
                  '&:active': {
                    transform: 'scale(0.9)',
                  },
                },
              }}
            />
          </SpeedDial>
        );

      case 'drawing':
        return (
          <Box
            sx={{
              position: 'fixed',
              top: 366, // Under MeasurementFAB
              right: fabRightPosition,
              zIndex: 1400, // Higher than modals (1300) to stay on top
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'right 0.3s ease-in-out',
            }}
          >
            {/* Confirm button - larger on mobile for better touch target */}
            <Fab
              color="success"
              size={isMobile ? 'large' : 'medium'}
              onClick={handleConfirmDrawing}
              sx={{
                bgcolor: theme.palette.success.main,
                width: isMobile ? 64 : 56, // Larger touch target on mobile
                height: isMobile ? 64 : 56,
                '&:hover': {
                  bgcolor: theme.palette.success.dark,
                },
                // Better touch feedback
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: theme.palette.success.dark,
                },
              }}
            >
              <Check sx={{ fontSize: isMobile ? 32 : 24 }} />
            </Fab>
          </Box>
        );

      default:
        return null;
    }
  };

  return renderFAB();
};

export default MobileFAB;
