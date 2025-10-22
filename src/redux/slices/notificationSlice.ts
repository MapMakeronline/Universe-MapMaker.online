// Notification Slice - Global toast/snackbar notifications
// Supports success, error, warning, info messages

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification context - groups related notifications together
 * Notifications with the same context will replace each other instead of stacking
 */
export type NotificationContext =
  | 'group'      // Group operations (add, delete, rename)
  | 'layer'      // Layer operations (add, delete, import, visibility)
  | 'project'    // Project operations (create, delete, update)
  | 'auth'       // Authentication (login, logout, register)
  | 'general';   // General notifications (no context replacement)

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // Auto-dismiss after X milliseconds (default: 6000)
  context?: NotificationContext; // Context for smart replacement
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
     * If context is provided, removes all previous notifications with the same context
     */
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id'>>
    ) => {
      // If context is provided, remove all notifications with the same context
      // This prevents stacking of related notifications (e.g., "Creating group..." → "Group created!")
      if (action.payload.context && action.payload.context !== 'general') {
        state.notifications = state.notifications.filter(
          (n) => n.context !== action.payload.context
        );
      }

      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()}`,
        duration: action.payload.duration ?? 6000, // Default 6 seconds
        context: action.payload.context ?? 'general', // Default to general if not specified
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
 * @param message - Notification message
 * @param duration - Auto-dismiss duration in ms (default: 6000)
 * @param context - Notification context for smart replacement
 */
export const showSuccess = (
  message: string,
  duration?: number,
  context?: NotificationContext
) => addNotification({ message, type: 'success', duration, context });

/**
 * Helper: Show error notification
 * @param message - Notification message
 * @param duration - Auto-dismiss duration in ms (default: 6000)
 * @param context - Notification context for smart replacement
 */
export const showError = (
  message: string,
  duration?: number,
  context?: NotificationContext
) => addNotification({ message, type: 'error', duration, context });

/**
 * Helper: Show warning notification
 * @param message - Notification message
 * @param duration - Auto-dismiss duration in ms (default: 6000)
 * @param context - Notification context for smart replacement
 */
export const showWarning = (
  message: string,
  duration?: number,
  context?: NotificationContext
) => addNotification({ message, type: 'warning', duration, context });

/**
 * Helper: Show info notification
 * @param message - Notification message
 * @param duration - Auto-dismiss duration in ms (default: 6000)
 * @param context - Notification context for smart replacement
 */
export const showInfo = (
  message: string,
  duration?: number,
  context?: NotificationContext
) => addNotification({ message, type: 'info', duration, context });

export default notificationSlice.reducer;
