/**
 * Trails Slice - Redux state management for trails (Frontend only)
 *
 * Features:
 * - Store active trail and all imported trails
 * - Animation state for timeline/camera
 * - Automatic localStorage sync (persist across sessions)
 *
 * All data stored in browser (no backend)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Trail, TrailAnimationState } from '@/features/trails/types';
import type { RootState } from '../store';

interface TrailsState {
  activeTrail: Trail | null; // Currently displayed trail
  trails: Trail[]; // All imported trails
  animation: TrailAnimationState | null; // Animation state (FAZA 3)
}

const initialState: TrailsState = {
  activeTrail: null,
  trails: [],
  animation: null,
};

/**
 * Load trails from localStorage (browser only)
 */
function loadFromLocalStorage(): TrailsState {
  // Check if we're in browser environment (not SSR)
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const saved = localStorage.getItem('trails');
    if (saved) {
      const parsed = JSON.parse(saved);
      // No need to restore Date objects - createdAt is now ISO string
      console.log('📦 Trails loaded from localStorage:', parsed.trails.length);
      return parsed;
    }
  } catch (error) {
    console.error('Error loading trails from localStorage:', error);
  }
  return initialState;
}

/**
 * Save trails to localStorage (browser only)
 */
function saveToLocalStorage(state: TrailsState) {
  // Check if we're in browser environment (not SSR)
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('trails', JSON.stringify(state));
    console.log('💾 Trails saved to localStorage');
  } catch (error) {
    console.error('Error saving trails to localStorage:', error);
  }
}

const trailsSlice = createSlice({
  name: 'trails',
  initialState: loadFromLocalStorage(),
  reducers: {
    /**
     * Set active trail (displayed on map)
     */
    setActiveTrail: (state, action: PayloadAction<Trail>) => {
      console.log('🔄 trailsSlice: setActiveTrail', {
        oldTrail: state.activeTrail ? {
          name: state.activeTrail.feature.properties.name,
          id: state.activeTrail.id
        } : null,
        newTrail: {
          name: action.payload.feature.properties.name,
          id: action.payload.id
        }
      });

      state.activeTrail = action.payload;

      // Add to trails array if not already present
      const exists = state.trails.some((t) => t.id === action.payload.id);
      if (!exists) {
        state.trails.push(action.payload);
      }

      saveToLocalStorage(state);
    },

    /**
     * Clear active trail (remove from map)
     */
    clearActiveTrail: (state) => {
      console.log('🗑️ trailsSlice: clearActiveTrail', {
        oldTrail: state.activeTrail ? {
          name: state.activeTrail.feature.properties.name,
          id: state.activeTrail.id
        } : null
      });

      state.activeTrail = null;
      state.animation = null;
      saveToLocalStorage(state);
    },

    /**
     * Delete trail by ID
     */
    deleteTrail: (state, action: PayloadAction<string>) => {
      const trailId = action.payload;

      // Remove from trails array
      state.trails = state.trails.filter((t) => t.id !== trailId);

      // Clear if it was active
      if (state.activeTrail?.id === trailId) {
        state.activeTrail = null;
        state.animation = null;
      }

      saveToLocalStorage(state);
    },

    /**
     * Clear all trails
     */
    clearAllTrails: (state) => {
      state.activeTrail = null;
      state.trails = [];
      state.animation = null;
      saveToLocalStorage(state);
    },

    /**
     * Set animation state (for Timeline - FAZA 3)
     */
    setAnimationState: (state, action: PayloadAction<TrailAnimationState>) => {
      state.animation = action.payload;
      // Don't save animation state to localStorage (ephemeral)
    },

    /**
     * Update animation progress (for Timeline - FAZA 3)
     */
    updateAnimationProgress: (state, action: PayloadAction<number>) => {
      if (state.animation) {
        state.animation.progress = action.payload;
      }
    },

    /**
     * Toggle animation play/pause (for Timeline - FAZA 3)
     */
    toggleAnimationPlay: (state) => {
      if (state.animation) {
        state.animation.isPlaying = !state.animation.isPlaying;
      }
    },

    /**
     * Set animation speed (for Timeline - FAZA 3)
     */
    setAnimationSpeed: (state, action: PayloadAction<number>) => {
      if (state.animation) {
        state.animation.speed = action.payload;
      }
    },
  },
});

// Actions
export const {
  setActiveTrail,
  clearActiveTrail,
  deleteTrail,
  clearAllTrails,
  setAnimationState,
  updateAnimationProgress,
  toggleAnimationPlay,
  setAnimationSpeed,
} = trailsSlice.actions;

// Selectors
export const selectActiveTrail = (state: RootState) => state.trails.activeTrail;
export const selectAllTrails = (state: RootState) => state.trails.trails;
export const selectAnimationState = (state: RootState) => state.trails.animation;
export const selectHasActiveTrail = (state: RootState) => !!state.trails.activeTrail;
export const selectTrailsCount = (state: RootState) => state.trails.trails.length;

// Reducer
export default trailsSlice.reducer;
