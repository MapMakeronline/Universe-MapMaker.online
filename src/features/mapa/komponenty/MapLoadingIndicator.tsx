/**
 * MapLoadingIndicator - Global loading indicator for map operations
 *
 * Displays ongoing loading operations in bottom-right corner of the map.
 * Position: Above LayersFAB, below RightFABToolbar
 * Responsive: Adjusts position based on LeftPanel state and screen size
 */

'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppSelector } from '@/redux/hooks';

interface MapLoadingIndicatorProps {
  isLeftPanelOpen: boolean;
}

const MapLoadingIndicator: React.FC<MapLoadingIndicatorProps> = ({ isLeftPanelOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { tasks } = useAppSelector((state) => state.loading);

  // Track elapsed time for each task
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});

  // Update elapsed time every second
  useEffect(() => {
    if (tasks.length === 0) {
      setElapsedTimes({});
      return;
    }

    const interval = setInterval(() => {
      const newElapsedTimes: Record<string, number> = {};
      tasks.forEach((task) => {
        newElapsedTimes[task.id] = Math.floor((Date.now() - task.startTime) / 1000);
      });
      setElapsedTimes(newElapsedTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Format elapsed time (e.g., "5s", "1m 23s")
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Don't render if no tasks
  if (tasks.length === 0) return null;

  // LeftPanel width (matches LayersFAB.tsx)
  const LEFT_PANEL_WIDTH = 320;

  // Position: Above LayersFAB (bottom: 16px), adjust for LeftPanel
  const bottomPosition = 80; // 16px (LayersFAB bottom) + 56px (FAB height) + 8px gap
  const rightPosition = 16;

  return (
    <Collapse in={tasks.length > 0}>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: bottomPosition,
          right: rightPosition,
          zIndex: 1300, // Below modals (1400), above map controls
          minWidth: isMobile ? 200 : 280,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            bgcolor: theme.palette.primary.main,
            color: 'white',
          }}
        >
          <CircularProgress size={20} thickness={5} sx={{ color: 'white' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Ładowanie ({tasks.length})
          </Typography>
        </Box>

        {/* Task List */}
        <Box
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.400',
              borderRadius: 3,
            },
          }}
        >
          {tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <CircularProgress size={16} thickness={5} />
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.message}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}
              >
                {formatTime(elapsedTimes[task.id] || 0)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Collapse>
  );
};

export default MapLoadingIndicator;
