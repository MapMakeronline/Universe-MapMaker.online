"use client"

/**
 * Timeline - Trail animation control panel
 *
 * Features:
 * - Drawer slides from bottom (anchor="bottom")
 * - Play/Pause button
 * - Reload button (reset to start)
 * - Progress slider (0-100%)
 * - Distance display (current / total km)
 *
 * FAZA 3.2: UI and local state ✅
 * FAZA 3.3: useTrailProgress hook ✅
 * FAZA 3.4: useTrailAnimation hook ✅
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Slider,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { MapRef } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import type { TrailFeature } from '../types';
import { useTrailProgress } from '../hooks/useTrailProgress';
import { useTrailAnimationWithMarker } from '../hooks/useTrailAnimationWithMarker';
import TrailMarker from './TrailMarker';
import { getCameraCenterBehindMarker } from '../utils/camera.utils';
import { NAVIGATION_PITCH, NAVIGATION_ZOOM } from '../config/animation.config';

interface TimelineProps {
  open: boolean;
  onClose: () => void;
  trail: TrailFeature;
  mapRef: React.RefObject<MapRef>;
}

/**
 * Timeline Component
 *
 * Control panel for trail animation
 *
 * @param open - Drawer open state
 * @param onClose - Handler for closing drawer
 * @param trail - Active trail feature (for calculations)
 * @param mapRef - Reference to Mapbox map
 *
 * @example
 * <Timeline
 *   open={timelineOpen}
 *   onClose={() => setTimelineOpen(false)}
 *   trail={activeTrail.feature}
 *   mapRef={mapRef}
 * />
 */
export function Timeline({ open, onClose, trail, mapRef }: TimelineProps) {
  // Local state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1 (0% - 100%)
  const [followCamera, setFollowCamera] = useState(true); // Camera follow state

  // Shared marker ref (used by both TrailMarker and animation hook)
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // FAZA 3.3: Real-time trail calculations using turf.js
  const {
    totalDistance,
    currentDistance,
    currentPoint,
    currentBearing,
    remainingDistance,
  } = useTrailProgress(trail, progress);

  // REFACTORED (2025-11-20): Unified animation hook (camera + marker in sync)
  const { syncCameraPosition, syncMarkerPosition } = useTrailAnimationWithMarker({
    isPlaying,
    progress,
    setProgress,
    setIsPlaying,
    mapRef,
    markerRef, // Shared ref
    currentPoint,
    currentBearing,
    followCamera,
    visible: open, // Marker visible when Timeline is open
  });

  // Handlers
  const handlePlayPause = () => {
    if (!isPlaying) {
      // Enable camera follow
      setFollowCamera(true);

      // SOLUTION B: Instant jump to trail position (ALWAYS works, no dependency on marker init)
      const map = mapRef.current?.getMap();
      if (map && currentPoint) {
        const cameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);

        map.jumpTo({
          center: cameraPos,
          bearing: currentBearing,
          pitch: NAVIGATION_PITCH,
          zoom: NAVIGATION_ZOOM,
          // Google Maps style: marker in lower 1/3 of screen, more road visible ahead
          padding: { top: 700, bottom: 100, left: 0, right: 0 },
        });

        // CRITICAL: Sync both marker AND camera position refs so RAF loop can start
        syncMarkerPosition(currentPoint, currentBearing); // ✅ Initialize marker refs (required for RAF loop start)
        syncCameraPosition(cameraPos, currentBearing);    // ✅ Initialize camera refs (smooth follow)

        console.log('🎯 Play: Camera jumped to trail position', {
          trailPos: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
          cameraPos: `[${cameraPos[0].toFixed(4)}, ${cameraPos[1].toFixed(4)}]`,
          bearing: currentBearing,
          progress: Math.round(progress * 100) + '%',
        });
      } else {
        console.error('❌ Play: currentPoint is NULL, cannot center camera');
      }
    }
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? '⏸️ Timeline: Paused' : '▶️ Timeline: Playing + Camera follow enabled');
  };

  const handleReload = () => {
    setIsPlaying(false);
    setProgress(0);
    setFollowCamera(true); // Reset camera follow on reload
    console.log('🔄 Timeline: Reloaded to start');
  };

  const handleCenterCamera = () => {
    // CRITICAL: Always enable camera follow first
    setFollowCamera(true);

    const map = mapRef.current?.getMap();
    if (!map) {
      console.error('❌ Center Camera: mapRef.current is NULL');
      return;
    }

    // Always use trail position (calculated from current progress)
    // This is CONSISTENT and ALWAYS available (no dependency on marker init)
    if (!currentPoint) {
      console.error('❌ Center Camera: currentPoint is NULL');
      return;
    }

    // Calculate camera position 80m behind trail position
    const cameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);

    // Instant jump to trail position (works in all situations: playing, paused, scrolled)
    map.jumpTo({
      center: cameraPos,
      bearing: currentBearing,
      pitch: NAVIGATION_PITCH,
      zoom: NAVIGATION_ZOOM,
      // Google Maps style: marker in lower 1/3 of screen, more road visible ahead
      padding: { top: 700, bottom: 100, left: 0, right: 0 },
    });

    // CRITICAL: Sync camera position refs so RAF loop knows where camera is
    syncCameraPosition(cameraPos, currentBearing);

    console.log('🎯 Center Camera: Jumped to trail position', {
      trailPos: `[${currentPoint[0].toFixed(4)}, ${currentPoint[1].toFixed(4)}]`,
      cameraPos: `[${cameraPos[0].toFixed(4)}, ${cameraPos[1].toFixed(4)}]`,
      bearing: currentBearing,
      progress: Math.round(progress * 100) + '%',
      isPlaying,
    });
  };

  const handleSeek = (event: Event, value: number | number[]) => {
    const newProgress = (value as number) / 100; // Convert 0-100 to 0-1
    setProgress(newProgress);
    setIsPlaying(false); // Pause when seeking
    console.log(`⏭️ Timeline: Seeked to ${Math.round(newProgress * 100)}%`);
  };

  // Effect: Auto-enable camera follow when Timeline opens
  useEffect(() => {
    if (open) {
      // Hook will automatically center camera via jumpTo() + LERP
      setFollowCamera(true);
      console.log('🎬 Timeline: Opened, camera follow enabled, hook will center');
    }
  }, [open]); // ✅ FIXED: Only trigger on Timeline open, not on currentPoint changes (which happen 60 times/sec during animation)

  // Effect: Detect user map interactions and disable camera follow
  useEffect(() => {
    const map = mapRef.current?.getMap();

    // Early return WITH cleanup function registration to prevent listener leak
    if (!map) {
      return () => {
        // Empty cleanup - ensures effect cleanup is always registered
      };
    }

    const handleUserInteraction = () => {
      // Use setState with callback to always get current state
      setFollowCamera((currentFollowCamera) => {
        if (currentFollowCamera) {
          console.log('👆 User interaction detected, camera follow disabled');
          return false;
        }
        return currentFollowCamera;
      });
    };

    // Listen to ONLY user-initiated events (not programmatic map.jumpTo)
    // 'dragstart' = user drags map
    // 'wheel' = user scrolls to zoom (NOT triggered by map.jumpTo!)
    map.on('dragstart', handleUserInteraction);
    map.on('wheel', handleUserInteraction);

    return () => {
      map.off('dragstart', handleUserInteraction);
      map.off('wheel', handleUserInteraction);
    };
  }, [mapRef]); // ✅ FIXED: Removed followCamera dependency

  // Effect: Sync camera position refs after seek (Bug #13 fix)
  useEffect(() => {
    // When user seeks while NOT playing, sync camera refs to new position
    // This prevents stale refs causing camera jump on next Play
    if (!isPlaying && progress > 0 && currentPoint) {
      const cameraPos = getCameraCenterBehindMarker(currentPoint, currentBearing);
      syncCameraPosition(cameraPos, currentBearing);
      console.log('🔄 Timeline: Synced camera refs after seek', {
        progress: `${Math.round(progress * 100)}%`,
        cameraPos: `[${cameraPos[0].toFixed(4)}, ${cameraPos[1].toFixed(4)}]`,
      });
    }
  }, [progress, isPlaying, currentPoint, currentBearing, syncCameraPosition]);

  return (
    <>
      {/* Trail Marker - rendered OUTSIDE Drawer to have direct map access */}
      <TrailMarker
        mapRef={mapRef}
        markerRef={markerRef} // Share ref with animation hook
        visible={open} // Show marker when Timeline is open
      />

      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        hideBackdrop // No backdrop overlay (no dimming)
        variant="persistent" // Stays open, doesn't close on outside click
        SlideProps={{
          timeout: 300, // Smooth slide animation
        }}
        PaperProps={{
          sx: {
            width: 'auto', // Auto width based on content
            maxWidth: '50vw', // Max 50% of viewport width
            minWidth: 500, // Minimum width for controls
            height: 80, // Compact height
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTopLeftRadius: 20, // Rounded left corners
            borderBottomLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            position: 'fixed',
            bottom: 16, // Same level as TimelineButton
            right: 96, // Slides from right, stops left of FAB (24 + 56 + 16 = 96px)
            top: 'auto', // Override default top positioning
          },
        }}
      >
      <Box
        sx={{
          px: 2, // Horizontal padding (smaller)
          py: 1, // Vertical padding (smaller)
          display: 'flex',
          alignItems: 'center',
          gap: 1, // Smaller gap
          height: '100%',
        }}
      >
        {/* Play/Pause Button */}
        <IconButton
          onClick={handlePlayPause}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: 48,
            height: 48,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        {/* Reload Button */}
        <IconButton
          onClick={handleReload}
          sx={{
            bgcolor: 'grey.300',
            width: 48,
            height: 48,
            '&:hover': {
              bgcolor: 'grey.400',
            },
          }}
        >
          <ReplayIcon />
        </IconButton>

        {/* Center Camera Button */}
        <IconButton
          onClick={handleCenterCamera}
          sx={{
            bgcolor: followCamera ? 'success.main' : 'grey.300',
            color: followCamera ? 'white' : 'text.primary',
            width: 48,
            height: 48,
            '&:hover': {
              bgcolor: followCamera ? 'success.dark' : 'grey.400',
            },
          }}
        >
          <CenterFocusStrongIcon />
        </IconButton>

        {/* Progress Slider */}
        <Slider
          value={progress * 100}
          onChange={handleSeek}
          min={0}
          max={100}
          step={0.1}
          sx={{
            flex: 1,
            mx: 2,
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              backgroundColor: 'primary.main',
            },
            '& .MuiSlider-track': {
              backgroundColor: 'primary.main',
              height: 6,
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'grey.300',
              height: 6,
            },
          }}
        />

        {/* Distance Display */}
        <Box sx={{ minWidth: 100, textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
            {(currentDistance / 1000).toFixed(1)} / {(totalDistance / 1000).toFixed(1)} km
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {Math.round(progress * 100)}%
          </Typography>
        </Box>
      </Box>
    </Drawer>
    </>
  );
}

export default Timeline;
