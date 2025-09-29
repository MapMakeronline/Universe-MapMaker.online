'use client';

import React from 'react';
import { Box } from '@mui/material';
import MapContainer from '@/components/map/MapContainer';
import LeftPanel from '@/components/panels/LeftPanel';
import RightToolbar from '@/components/panels/RightToolbar';

export default function MapPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Lewy panel - warstwy, narzędzia, legenda */}
      <LeftPanel />

      {/* Główna mapa */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          position: 'relative',
          height: '100vh',
        }}
      >
        <MapContainer>
          {/* Draw Tools, Geocoder, Popups będą dodane tutaj */}
        </MapContainer>
      </Box>

      {/* Prawy toolbar - pomiary, ustawienia */}
      <RightToolbar />
    </Box>
  );
}