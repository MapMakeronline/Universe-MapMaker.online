'use client';

import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { removeNotification } from '@/redux/slices/notificationSlice';

/**
 * NotificationProvider - Global Snackbar notification system
 *
 * Displays toast notifications from Redux notification state.
 * Supports success, error, warning, info types with auto-dismiss.
 *
 * Usage:
 * ```tsx
 * import { showSuccess, showError } from '@/redux/slices/notificationSlice';
 *
 * dispatch(showSuccess('Layer saved successfully!'));
 * dispatch(showError('Failed to save layer', 8000)); // 8 seconds
 * ```
 */
export const NotificationProvider: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notification.notifications);

  // Only show first notification (FIFO queue)
  const currentNotification = notifications[0] || null;

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    // Don't close if user clicks outside (clickaway)
    if (reason === 'clickaway') {
      return;
    }

    if (currentNotification) {
      dispatch(removeNotification(currentNotification.id));
    }
  };

  return (
    <Snackbar
      open={!!currentNotification}
      autoHideDuration={currentNotification?.duration || 3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        mb: 2,
        mr: 2,
        // Lower z-index so it doesn't overlap dialogs (MUI Dialog default: 1300)
        zIndex: 1200,
      }}
    >
      {currentNotification ? (
        <Alert
          onClose={handleClose}
          severity={currentNotification.type as AlertColor}
          variant="filled"
          sx={{ width: '100%', minWidth: '300px' }}
        >
          {currentNotification.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};

// Force recompilation
