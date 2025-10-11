// Notification Slice - Global toast/snackbar notifications
// Supports success, error, warning, info messages

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // Auto-dismiss after X milliseconds (default: 6000)
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    /**
     * Add a new notification
     */
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id'>>
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()}`,
        duration: action.payload.duration ?? 6000, // Default 6 seconds
      };
      state.notifications.push(notification);
    },

    /**
     * Remove notification by ID
     */
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },

    /**
     * Clear all notifications
     */
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// ============================================================================
// Helper Actions (shortcuts for common notification types)
// ============================================================================

export const { addNotification, removeNotification, clearAllNotifications } =
  notificationSlice.actions;

/**
 * Helper: Show success notification
 */
export const showSuccess = (message: string, duration?: number) =>
  addNotification({ message, type: 'success', duration });

/**
 * Helper: Show error notification
 */
export const showError = (message: string, duration?: number) =>
  addNotification({ message, type: 'error', duration });

/**
 * Helper: Show warning notification
 */
export const showWarning = (message: string, duration?: number) =>
  addNotification({ message, type: 'warning', duration });

/**
 * Helper: Show info notification
 */
export const showInfo = (message: string, duration?: number) =>
  addNotification({ message, type: 'info', duration });

export default notificationSlice.reducer;
