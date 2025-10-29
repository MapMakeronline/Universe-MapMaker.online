/**
 * Loading Slice - Global loading state management
 *
 * Manages a queue of loading operations with IDs, messages, and timestamps.
 * Used by MapLoadingIndicator to show ongoing operations in bottom-right corner.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LoadingTask {
  id: string;
  message: string;
  startTime: number;
}

interface LoadingState {
  tasks: LoadingTask[];
}

const initialState: LoadingState = {
  tasks: [],
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    /**
     * Add a new loading task to the queue
     * @param id - Unique identifier for the task (e.g., 'wfs-fetch', 'layer-load-123')
     * @param message - User-friendly message (e.g., 'Ładowanie działek...')
     */
    addLoadingTask: (state, action: PayloadAction<{ id: string; message: string }>) => {
      const { id, message } = action.payload;

      // Don't add duplicate tasks
      if (state.tasks.some(task => task.id === id)) {
        return;
      }

      state.tasks.push({
        id,
        message,
        startTime: Date.now(),
      });
    },

    /**
     * Remove a loading task from the queue
     * @param id - Task ID to remove
     */
    removeLoadingTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },

    /**
     * Clear all loading tasks (e.g., on error or reset)
     */
    clearAllLoadingTasks: (state) => {
      state.tasks = [];
    },
  },
});

export const {
  addLoadingTask,
  removeLoadingTask,
  clearAllLoadingTasks,
} = loadingSlice.actions;

export default loadingSlice.reducer;
