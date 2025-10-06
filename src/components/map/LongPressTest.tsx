import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl';
import type { MapLayerMouseEvent } from 'react-map-gl';
import { Box, Alert, Snackbar } from '@mui/material';

/**
 * LongPressTest - Testowa funkcja długiego kliknięcia na mapie
 *
 * Desktop: Przytrzymaj LPM przez 500ms
 * Mobile: Przytrzymaj palec przez 500ms
 */
export default function LongPressTest() {
  const { current: map } = useMap();
  const [message, setMessage] = useState<string>('');
  const [open, setOpen] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressActive = useRef(false);
  const startCoords = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleMouseDown = (e: MapLayerMouseEvent) => {
      longPressActive.current = false;
      startCoords.current = [e.lngLat.lng, e.lngLat.lat];

      // Start long press timer (500ms)
      longPressTimer.current = setTimeout(() => {
        longPressActive.current = true;

        // Haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        const coords = `${e.lngLat.lng.toFixed(6)}, ${e.lngLat.lat.toFixed(6)}`;
        setMessage(`🔵 Long Press Detected!\nCoordinates: ${coords}`);
        setOpen(true);

        console.log('🔵 LONG PRESS TEST:', {
          coordinates: [e.lngLat.lng, e.lngLat.lat],
          point: e.point,
          originalEvent: e.originalEvent.type,
        });
      }, 500);
    };

    const handleMouseUp = () => {
      // Clear timer if released before 500ms
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!longPressActive.current && startCoords.current) {
        // Regular click (released before 500ms)
        console.log('🟢 REGULAR CLICK:', startCoords.current);
      }

      longPressActive.current = false;
      startCoords.current = null;
    };

    const handleMouseMove = (e: MapLayerMouseEvent) => {
      // Cancel long press if user moves too much (>10px)
      if (longPressTimer.current && startCoords.current) {
        const threshold = 10; // pixels
        const dx = Math.abs(e.point.x - (startCoords.current[0] || 0));
        const dy = Math.abs(e.point.y - (startCoords.current[1] || 0));

        if (dx > threshold || dy > threshold) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
          longPressActive.current = false;
        }
      }
    };

    // Attach listeners
    map.on('mousedown', handleMouseDown);
    map.on('touchstart', handleMouseDown as any);
    map.on('mouseup', handleMouseUp);
    map.on('touchend', handleMouseUp as any);
    map.on('mousemove', handleMouseMove);
    map.on('touchmove', handleMouseMove as any);

    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      map.off('mousedown', handleMouseDown);
      map.off('touchstart', handleMouseDown as any);
      map.off('mouseup', handleMouseUp);
      map.off('touchend', handleMouseUp as any);
      map.off('mousemove', handleMouseMove);
      map.off('touchmove', handleMouseMove as any);
    };
  }, [map]);

  return (
    <>
      {/* Floating info box */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          px: 3,
          py: 1.5,
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        🧪 Long Press Test Active
        <br />
        <Box component="span" sx={{ fontSize: '12px', opacity: 0.8 }}>
          Desktop: Hold LMB 500ms | Mobile: Hold finger 500ms
        </Box>
      </Box>

      {/* Snackbar for results */}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity="info"
          sx={{
            width: '100%',
            whiteSpace: 'pre-line',
            bgcolor: '#1976d2',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' },
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}
