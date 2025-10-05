'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Fab, SpeedDial, SpeedDialAction, SpeedDialIcon, useTheme, Box, useMediaQuery } from '@mui/material';
import {
  MyLocation,
  Add,
  Check,
  Place,
  Timeline,
  Polyline,
  Apartment,
  Close,
} from '@mui/icons-material';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDrawMode } from '@/store/slices/drawSlice';
import { addDrawnLayer } from '@/store/slices/layersSlice';
import { setBuildingSelectMode } from '@/store/slices/buildingsSlice';

type FABMode = 'location' | 'draw-select' | 'drawing' | 'building-select';
type DrawType = 'point' | 'line' | 'polygon' | null;

// Szerokość prawego toolbara + marginesy
const RIGHT_TOOLBAR_WIDTH = 56;
const RIGHT_TOOLBAR_MARGIN = 16;

interface MobileFABProps {
  geolocateControlRef?: React.RefObject<any>;
}

const MobileFAB: React.FC<MobileFABProps> = ({ geolocateControlRef }) => {
  const theme = useTheme();
  const { current: map } = useMap();
  const dispatch = useAppDispatch();
  const { draw } = useAppSelector((state) => state.draw);
  const { isBuildingSelectModeActive } = useAppSelector((state) => state.buildings);

  // Responsywność - na mobile (sm i poniżej) toolbar jest przewijalny, więc FAB może być bliżej prawej krawędzi
  // Na desktop (md i powyżej) FAB musi ustąpić prawemu toolbarowi
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fabRightPosition = isMobile ? 16 : RIGHT_TOOLBAR_WIDTH + RIGHT_TOOLBAR_MARGIN + 8;

  const [mode, setMode] = useState<FABMode>('location');
  const [selectedDrawType, setSelectedDrawType] = useState<DrawType>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Sync local mode state with Redux building select mode
  useEffect(() => {
    if (!isBuildingSelectModeActive && mode === 'building-select') {
      // Building was selected, go back to draw-select menu
      setMode('draw-select');
      setSpeedDialOpen(true);
    }
  }, [isBuildingSelectModeActive, mode]);

  const handleLocationClick = () => {
    // Użyj natywnego GeolocateControl z Mapbox jeśli dostępny
    if (geolocateControlRef?.current) {
      geolocateControlRef.current.trigger();

      // Nasłuchuj zdarzenia geolocate aby zmienić tryb po lokalizacji
      const geolocateControl = geolocateControlRef.current;
      const handleGeolocate = () => {
        setMode('draw-select');
        setSpeedDialOpen(true);
        geolocateControl.off('geolocate', handleGeolocate);
      };
      geolocateControl.on('geolocate', handleGeolocate);
    } else {
      // Fallback: użyj standardowej geolokalizacji przeglądarki
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map?.flyTo({
              center: [longitude, latitude],
              zoom: 16,
              duration: 1500, // Szybsza animacja (1.5s zamiast domyślnych ~2.5s)
              essential: true,
              curve: 1.2, // Mniejsza krzywizna = bardziej bezpośrednia trasa
              speed: 1.5, // Szybsza prędkość animacji
            });
            setMode('draw-select');
            setSpeedDialOpen(true);
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('Nie można pobrać lokalizacji. Sprawdź uprawnienia przeglądarki.');
          }
        );
      }
    }
  };

  const handleDrawTypeSelect = (type: DrawType) => {
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
    console.log('Activated Mapbox GL Draw mode:', drawMode, '- można dodać wiele elementów');
  };

  const handleConfirmDrawing = () => {
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

      console.log(`Tworzenie nowej warstwy: "${newLayerName}" z ${draw.features.length} elementami:`, draw.features);

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
    switch (mode) {
      case 'location':
        return (
          <Fab
            color="primary"
            onClick={handleLocationClick}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: fabRightPosition,
              zIndex: 1300,
              transition: 'right 0.3s ease-in-out',
            }}
          >
            <MyLocation />
          </Fab>
        );

      case 'draw-select':
        return (
          <SpeedDial
            ariaLabel="Drawing tools"
            icon={<SpeedDialIcon icon={<Add />} />}
            onClose={() => setSpeedDialOpen(false)}
            onOpen={() => setSpeedDialOpen(true)}
            open={speedDialOpen}
            direction="left"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: fabRightPosition,
              zIndex: 1300,
              transition: 'right 0.3s ease-in-out',
              '& .MuiSpeedDial-fab': {
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              },
            }}
          >
            <SpeedDialAction
              key="point"
              icon={<Place />}
              tooltipTitle="Punkt"
              onClick={() => handleDrawTypeSelect('point')}
            />
            <SpeedDialAction
              key="line"
              icon={<Timeline />}
              tooltipTitle="Linia"
              onClick={() => handleDrawTypeSelect('line')}
            />
            <SpeedDialAction
              key="polygon"
              icon={<Polyline />}
              tooltipTitle="Poligon"
              onClick={() => handleDrawTypeSelect('polygon')}
            />
            <SpeedDialAction
              key="building"
              icon={<Apartment />}
              tooltipTitle="Budynek 3D"
              onClick={() => {
                setMode('building-select');
                setSpeedDialOpen(false);
                dispatch(setBuildingSelectMode(true));
              }}
            />
          </SpeedDial>
        );

      case 'drawing':
        return (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: fabRightPosition,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'right 0.3s ease-in-out',
            }}
          >
            {/* Confirm button */}
            <Fab
              color="success"
              size="medium"
              onClick={handleConfirmDrawing}
              sx={{
                bgcolor: theme.palette.success.main,
                '&:hover': {
                  bgcolor: theme.palette.success.dark,
                },
              }}
            >
              <Check />
            </Fab>
          </Box>
        );

      case 'building-select':
        return (
          <Fab
            color="error"
            onClick={() => {
              setMode('draw-select');
              setSpeedDialOpen(true);
              dispatch(setBuildingSelectMode(false));
            }}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: fabRightPosition,
              zIndex: 1300,
              transition: 'right 0.3s ease-in-out',
            }}
          >
            <Close />
          </Fab>
        );

      default:
        return null;
    }
  };

  return renderFAB();
};

export default MobileFAB;
