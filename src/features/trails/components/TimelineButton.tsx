"use client"

/**
 * TimelineButton - Floating Action Button for trail animation
 *
 * Features:
 * - Shows Play icon when trail is loaded
 * - Positioned in bottom-right corner of map
 * - Opens Timeline control panel on click
 * - Visible only when activeTrail exists
 *
 * Uses Material-UI Fab component
 */

import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface TimelineButtonProps {
  visible: boolean;
  onClick: () => void;
}

/**
 * TimelineButton Component
 *
 * Floating Action Button that triggers trail animation timeline
 *
 * @param visible - Show/hide button (true when activeTrail exists)
 * @param onClick - Handler for opening Timeline panel
 *
 * @example
 * <TimelineButton
 *   visible={!!activeTrail}
 *   onClick={() => setTimelineOpen(true)}
 * />
 */
export function TimelineButton({ visible, onClick }: TimelineButtonProps) {
  if (!visible) return null;

  return (
    <Tooltip title="Animuj trasę" placement="left">
      <Fab
        color="primary"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 16, // Same level as LayersFAB (bottom-left corner)
          right: 24,
          zIndex: 1400, // Same as LayersFAB
          width: 56,
          height: 56,
          boxShadow: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        <PlayArrowIcon />
      </Fab>
    </Tooltip>
  );
}

export default TimelineButton;
