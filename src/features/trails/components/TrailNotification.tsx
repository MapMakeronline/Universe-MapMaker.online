"use client"

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';

interface TrailNotificationProps {
  open: boolean;
  onClose: () => void;
  trailName: string;
  distance: number; // meters
  duration: number; // minutes
  warnings?: string[];
  showRefreshMessage?: boolean;
  showDeleteMessage?: boolean;
}

/**
 * Trail Import Success Notification
 *
 * Elegant centered dialog for trail import success messages
 *
 * @param open - Dialog open state
 * @param onClose - Close handler
 * @param trailName - Imported trail name
 * @param distance - Trail distance in meters
 * @param duration - Trail duration in minutes
 * @param warnings - Optional warning messages
 * @param showRefreshMessage - Show refresh instruction (default: false)
 */
export const TrailNotification: React.FC<TrailNotificationProps> = ({
  open,
  onClose,
  trailName,
  distance,
  duration,
  warnings = [],
  showRefreshMessage = false,
  showDeleteMessage = false,
}) => {
  const distanceKm = (distance / 1000).toFixed(2);

  // Two-tone color scheme: top section (content) and bottom section (actions)
  const topBgColor = showDeleteMessage
    ? '#4A5568' // Gray for delete
    : showRefreshMessage
      ? '#4A5568' // Gray for refresh
      : '#4A5568'; // Gray for success

  const bottomBgColor = 'rgb(247, 249, 252)'; // Light gray for button area (all states)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: 'none',
        }
      }}
    >
      <DialogContent sx={{ py: 4, px: 4, backgroundColor: topBgColor, color: 'white' }}>
        <Stack spacing={2} alignItems="center">
          {/* Icon */}
          {showDeleteMessage ? (
            <DeleteIcon sx={{ fontSize: 64, color: 'white' }} />
          ) : showRefreshMessage ? (
            <RefreshIcon sx={{ fontSize: 64, color: 'white' }} />
          ) : (
            <CheckCircleIcon sx={{ fontSize: 64, color: 'white' }} />
          )}

          {/* Title */}
          <Typography variant="h5" align="center" fontWeight="bold">
            {showDeleteMessage
              ? 'Trasa została usunięta!'
              : showRefreshMessage
                ? 'Odśwież stronę'
                : 'Trasa została załadowana!'}
          </Typography>

          {/* Content */}
          {!showRefreshMessage && !showDeleteMessage && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                {trailName}
              </Typography>

              <Stack spacing={1}>
                <Typography variant="body1" align="center">
                  📏 Długość: <strong>{distanceKm} km</strong>
                </Typography>
                <Typography variant="body1" align="center">
                  ⏱️ Czas: <strong>{duration} min</strong>
                </Typography>
              </Stack>

              {/* Warnings */}
              {warnings.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    ⚠️ Ostrzeżenia:
                  </Typography>
                  {warnings.map((warning, idx) => (
                    <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                      • {warning}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {showDeleteMessage && (
            <Typography variant="body1" align="center" sx={{ fontSize: '1.1rem' }}>
              Trasa <strong>"{trailName}"</strong> została pomyślnie usunięta z mapy.
            </Typography>
          )}

          {showRefreshMessage && (
            <Typography variant="body1" align="center" sx={{ fontSize: '1.1rem' }}>
              Naciśnij <strong>F5</strong>, aby zobaczyć trasę na mapie
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3, justifyContent: 'center', backgroundColor: bottomBgColor }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            bgcolor: 'rgb(247, 249, 252)',
            color: showRefreshMessage ? '#4A5568' : '#4A5568',
            fontWeight: 'bold',
            minWidth: 120,
            '&:hover': {
              bgcolor: '#4A5568',
              color: 'white',
            }
          }}
        >
          {showDeleteMessage ? 'OK' : showRefreshMessage ? 'OK' : 'Zamknij'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrailNotification;
