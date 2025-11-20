/**
 * useTrailAnimation - Smooth camera animation following trail
 *
 * FAZA 3.4: Camera animation using RAF + Mapbox easeTo
 *
 * Features:
 * - requestAnimationFrame loop for smooth 60fps animation
 * - Fixed 2-minute duration (regardless of trail length)
 * - Camera follows trail using map.easeTo()
 * - Play/Pause control
 * - Auto-stop at 100%
 * - Instant camera update on progress change (seek)
 * - User can zoom/pan during animation (essential: false)
 *
 * Uses Mapbox GL JS map.easeTo() for camera movement
 */

import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl';

interface UseTrailAnimationProps {
  isPlaying: boolean;
  progress: number;
  setProgress: (progress: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  mapRef: React.RefObject<MapRef>;
  currentPoint: [number, number] | null;
  currentBearing: number;
  followCamera: boolean; // NEW: Control if camera should follow trail
}

const ANIMATION_DURATION = 120000; // 2 minutes in milliseconds (120,000ms)

/**
 * useTrailAnimation Hook
 *
 * Animates camera along trail using RAF loop
 *
 * @param isPlaying - Animation play state
 * @param progress - Current progress (0-1)
 * @param setProgress - Function to update progress
 * @param setIsPlaying - Function to update play state
 * @param mapRef - Reference to Mapbox map
 * @param currentPoint - Current position [lng, lat]
 * @param currentBearing - Current direction (degrees)
 *
 * @example
 * useTrailAnimation({
 *   isPlaying,
 *   progress,
 *   setProgress,
 *   setIsPlaying,
 *   mapRef,
 *   currentPoint,
 *   currentBearing,
 * });
 */
export function useTrailAnimation({
  isPlaying,
  progress,
  setProgress,
  setIsPlaying,
  mapRef,
  currentPoint,
  currentBearing,
  followCamera,
}: UseTrailAnimationProps): void {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Effect 1: Update camera position when progress changes (seek/manual change)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !currentPoint) return;

    // Only move camera if followCamera is true
    if (!followCamera) {
      console.log('📌 Camera follow disabled, skipping update');
      return;
    }

    // Move camera to current point (regardless of play state)
    try {
      map.easeTo({
        center: currentPoint,
        bearing: currentBearing,
        pitch: 60,
        duration: 500, // Longer duration for manual seek (smoother transition)
        essential: false, // Allow user interactions (zoom/pan)
      });

      console.log('🎯 Camera updated (seek):', {
        progress: `${(progress * 100).toFixed(1)}%`,
        center: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
        bearing: `${currentBearing.toFixed(1)}°`,
      });
    } catch (error) {
      console.error('❌ Camera update error:', error);
    }
  }, [progress, currentPoint, currentBearing, mapRef, followCamera]);

  // Effect 2: Animation loop (only when playing)
  useEffect(() => {
    // Only animate when playing
    if (!isPlaying) {
      // Cancel animation frame if paused
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        lastTimestampRef.current = null;
      }
      return;
    }

    // Guard: Check if map is available
    const map = mapRef.current?.getMap();
    if (!map) {
      console.warn('⚠️ useTrailAnimation: Map not available');
      return;
    }

    // Guard: Check if current point exists
    if (!currentPoint) {
      console.warn('⚠️ useTrailAnimation: No current point');
      return;
    }

    // Animation loop using RAF
    const animate = (timestamp: number) => {
      // Initialize timestamp on first frame
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      // Calculate elapsed time since last frame
      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      // Calculate progress increment (deltaTime / total duration)
      // For 2 minutes (120,000ms), this gives smooth progression
      const progressIncrement = deltaTime / ANIMATION_DURATION;

      // Update progress
      const newProgress = Math.min(progress + progressIncrement, 1.0);
      setProgress(newProgress);

      // Move camera to current point (only if followCamera is true)
      if (followCamera) {
        try {
          map.easeTo({
            center: currentPoint,
            bearing: currentBearing,
            pitch: 60, // Tilted view for better trail visibility
            duration: 100, // Short duration for smooth following (100ms)
            essential: false, // Allow user interactions (zoom/pan during animation)
          });

          console.log('🎥 Camera moved:', {
            progress: `${(newProgress * 100).toFixed(1)}%`,
            center: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
            bearing: `${currentBearing.toFixed(1)}°`,
          });
        } catch (error) {
          console.error('❌ Camera movement error:', error);
        }
      } else {
        console.log('📌 Camera follow disabled, animation continues without camera update');
      }

      // Check if animation reached end
      if (newProgress >= 1.0) {
        console.log('🏁 Animation completed');
        setIsPlaying(false); // Stop animation
        setProgress(1.0); // Ensure exactly 1.0
        animationFrameRef.current = null;
        lastTimestampRef.current = null;
        return; // Exit animation loop
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    console.log('▶️ Starting animation from', `${(progress * 100).toFixed(1)}%`);
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        console.log('🛑 Cancelling animation');
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        lastTimestampRef.current = null;
      }
    };
  }, [
    isPlaying,
    progress,
    setProgress,
    setIsPlaying,
    mapRef,
    currentPoint,
    currentBearing,
    followCamera,
  ]);
}

export default useTrailAnimation;
