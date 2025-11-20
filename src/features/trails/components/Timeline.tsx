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
 * FAZA 3.2: UI and local state only
 * FAZA 3.3: Will add useTrailProgress hook
 * FAZA 3.4: Will add useTrailAnimation hook
 */

import React, { useState } from 'react';
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
import { MapRef } from 'react-map-gl';
import type { TrailFeature } from '../types';

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

  // Placeholder values (FAZA 3.3 will calculate real values)
  const totalDistance = trail.properties.distance
    ? trail.properties.distance / 1000 // meters to km
    : 10.0; // fallback
  const currentDistance = progress * totalDistance;

  // Handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? '⏸️ Timeline: Paused' : '▶️ Timeline: Playing');
  };

  const handleReload = () => {
    setIsPlaying(false);
    setProgress(0);
    console.log('🔄 Timeline: Reloaded to start');
  };

  const handleSeek = (event: Event, value: number | number[]) => {
    const newProgress = (value as number) / 100; // Convert 0-100 to 0-1
    setProgress(newProgress);
    setIsPlaying(false); // Pause when seeking
    console.log(`⏭️ Timeline: Seeked to ${Math.round(newProgress * 100)}%`);
  };

  return (
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
            {currentDistance.toFixed(1)} / {totalDistance.toFixed(1)} km
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {Math.round(progress * 100)}%
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Timeline;
