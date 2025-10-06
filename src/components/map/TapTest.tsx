import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl';
import type { MapLayerMouseEvent } from 'react-map-gl';
import { Box, Alert, Snackbar } from '@mui/material';

/**
 * TapTest - Testowa funkcja wykrywania tap/click na mapie
 *
 * Desktop: Kliknij na mapie
 * Mobile: Tapnij (bez przytrzymywania - brak konfliktu z pinch-zoom)
 */
export default function TapTest() {
  const { current: map } = useMap();
  const [message, setMessage] = useState<string>('');
  const [open, setOpen] = useState(false);

  // Track touch for tap vs drag detection
  const touchStartPt = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!map) return;

    // 1) Desktop/Mobile: click handler (cleanest, works after tap on mobile)
    const handleClick = (e: MapLayerMouseEvent) => {
      const coords = `${e.lngLat.lng.toFixed(6)}, ${e.lngLat.lat.toFixed(6)}`;
      setMessage(`✅ Click/Tap Detected!\nCoordinates: ${coords}`);
      setOpen(true);

      console.log('✅ TAP TEST - CLICK:', {
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        point: e.point,
        originalEvent: e.originalEvent.type,
      });

      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    // 2) Mobile fallback: touchstart/touchend (tap vs drag detection)
    const handleTouchStart = (e: any) => {
      if (e.points?.length === 1) {
        touchStartPt.current = { x: e.point.x, y: e.point.y };
      }
    };

    const handleTouchEnd = (e: any) => {
      if (e.points?.length !== 1 || !touchStartPt.current) {
        touchStartPt.current = null;
        return;
      }

      // Check if finger moved (drag vs tap)
      const dx = Math.abs(e.point.x - touchStartPt.current.x);
      const dy = Math.abs(e.point.y - touchStartPt.current.y);
      const moved = Math.max(dx, dy) > 8; // 8px tolerance

      touchStartPt.current = null;

      if (moved) {
        console.log('🔄 TAP TEST - Touch moved (drag, not tap)');
        return; // Was a drag, not a tap
      }

      // Clean tap detected
      const coords = `${e.lngLat.lng.toFixed(6)}, ${e.lngLat.lat.toFixed(6)}`;
      setMessage(`📱 Tap Detected (touchend fallback)!\nCoordinates: ${coords}`);
      setOpen(true);

      console.log('📱 TAP TEST - TOUCHEND:', {
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        point: e.point,
        originalEvent: e.originalEvent.type,
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    };

    // Attach listeners
    map.on('click', handleClick);
    map.on('touchstart', handleTouchStart as any);
    map.on('touchend', handleTouchEnd as any);

    return () => {
      map.off('click', handleClick);
      map.off('touchstart', handleTouchStart as any);
      map.off('touchend', handleTouchEnd as any);
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
        🧪 Tap Test Active
        <br />
        <Box component="span" sx={{ fontSize: '12px', opacity: 0.8 }}>
          Desktop: Click | Mobile: Tap (no pinch conflict)
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
          severity="success"
          sx={{
            width: '100%',
            whiteSpace: 'pre-line',
            bgcolor: '#4caf50',
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
