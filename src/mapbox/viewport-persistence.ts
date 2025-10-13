/**
 * VIEWPORT PERSISTENCE UTILITY
 *
 * Saves and restores map viewport (camera position) between sessions using sessionStorage.
 * Viewport expires after 5 minutes to prevent stale camera positions.
 *
 * Use cases:
 * - User navigates to dashboard and back → viewport restored
 * - User reloads page → viewport restored (within 5 minutes)
 * - User closes tab and reopens → viewport cleared (sessionStorage cleared)
 */

import { mapLogger } from '@/narzedzia/logger';

/**
 * ViewState interface matching Redux mapSlice
 */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

const VIEWPORT_KEY = 'mapbox_viewport';
const VIEWPORT_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface StoredViewport {
  viewState: ViewState;
  timestamp: number;
  projectName: string;
}

/**
 * Save viewport to sessionStorage (expires after 5 minutes)
 *
 * @param projectName - Current project name (viewport is project-specific)
 * @param viewState - Map viewport state to save
 */
export const saveViewport = (
  projectName: string,
  viewState: ViewState
): void => {
  const data: StoredViewport = {
    viewState,
    timestamp: Date.now(),
    projectName
  };

  try {
    sessionStorage.setItem(VIEWPORT_KEY, JSON.stringify(data));
    mapLogger.log('💾 Saved viewport to sessionStorage:', {
      project: projectName,
      viewport: viewState,
      expiresIn: `${VIEWPORT_EXPIRY / 1000}s`
    });
  } catch (e) {
    mapLogger.error('❌ Failed to save viewport:', e);
  }
};

/**
 * Load viewport from sessionStorage (if not expired)
 *
 * @param projectName - Current project name
 * @returns Saved viewport or null if expired/not found
 */
export const loadViewport = (projectName: string): ViewState | null => {
  try {
    const data = sessionStorage.getItem(VIEWPORT_KEY);
    if (!data) {
      mapLogger.log('ℹ️ No saved viewport found');
      return null;
    }

    const stored: StoredViewport = JSON.parse(data);

    // Check if expired (5 minutes)
    const elapsed = Date.now() - stored.timestamp;
    if (elapsed > VIEWPORT_EXPIRY) {
      mapLogger.log('⏰ Viewport expired (> 5 minutes), using default');
      sessionStorage.removeItem(VIEWPORT_KEY);
      return null;
    }

    // Check if same project
    if (stored.projectName !== projectName) {
      mapLogger.log('🔄 Different project, using default viewport', {
        saved: stored.projectName,
        current: projectName
      });
      return null;
    }

    const remainingSeconds = Math.floor((VIEWPORT_EXPIRY - elapsed) / 1000);
    mapLogger.log('✅ Restored viewport from sessionStorage:', {
      project: projectName,
      viewport: stored.viewState,
      age: `${Math.floor(elapsed / 1000)}s`,
      expiresIn: `${remainingSeconds}s`
    });

    return stored.viewState;
  } catch (e) {
    mapLogger.error('❌ Failed to load viewport:', e);
    return null;
  }
};

/**
 * Clear viewport from sessionStorage
 * Useful when user explicitly changes project or logs out
 */
export const clearViewport = (): void => {
  sessionStorage.removeItem(VIEWPORT_KEY);
  mapLogger.log('🗑️ Cleared viewport from sessionStorage');
};

/**
 * Get remaining time before viewport expires (in seconds)
 *
 * @returns Remaining seconds or 0 if not saved/expired
 */
export const getViewportExpiryTime = (): number => {
  try {
    const data = sessionStorage.getItem(VIEWPORT_KEY);
    if (!data) return 0;

    const stored: StoredViewport = JSON.parse(data);
    const elapsed = Date.now() - stored.timestamp;
    const remaining = Math.max(0, VIEWPORT_EXPIRY - elapsed);

    return Math.floor(remaining / 1000); // Convert to seconds
  } catch (e) {
    mapLogger.error('❌ Failed to get expiry time:', e);
    return 0;
  }
};

/**
 * Check if viewport is currently saved
 *
 * @returns True if viewport exists in sessionStorage
 */
export const hasStoredViewport = (): boolean => {
  const data = sessionStorage.getItem(VIEWPORT_KEY);
  return data !== null;
};

/**
 * Get stored viewport info (for debugging)
 *
 * @returns Viewport metadata or null
 */
export const getStoredViewportInfo = (): {
  projectName: string;
  age: number; // seconds
  expiresIn: number; // seconds
} | null => {
  try {
    const data = sessionStorage.getItem(VIEWPORT_KEY);
    if (!data) return null;

    const stored: StoredViewport = JSON.parse(data);
    const elapsed = Date.now() - stored.timestamp;
    const remaining = Math.max(0, VIEWPORT_EXPIRY - elapsed);

    return {
      projectName: stored.projectName,
      age: Math.floor(elapsed / 1000),
      expiresIn: Math.floor(remaining / 1000)
    };
  } catch (e) {
    mapLogger.error('❌ Failed to get viewport info:', e);
    return null;
  }
};

/**
 * Auto-save viewport with debouncing
 * Returns a cleanup function to clear the interval
 *
 * @param projectName - Current project name
 * @param getViewState - Function to get current viewport
 * @param interval - Save interval in milliseconds (default: 10 seconds)
 * @returns Cleanup function
 */
export const autoSaveViewport = (
  projectName: string,
  getViewState: () => ViewState | null,
  interval: number = 10000 // 10 seconds
): (() => void) => {
  mapLogger.log('🔄 Started auto-save viewport', { interval: `${interval / 1000}s` });

  const intervalId = setInterval(() => {
    const viewState = getViewState();
    if (viewState) {
      saveViewport(projectName, viewState);
    }
  }, interval);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    mapLogger.log('⏹️ Stopped auto-save viewport');
  };
};
