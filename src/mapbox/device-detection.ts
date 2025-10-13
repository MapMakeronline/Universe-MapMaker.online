/**
 * DEVICE DETECTION UTILITIES
 *
 * Detects iOS/Safari and provides device capabilities for optimal rendering.
 * Used for optimizing 3D buildings rendering on mobile devices.
 */

/**
 * Detect if the device is running iOS (iPhone, iPad, iPod)
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Detect if the browser is Safari (both iOS and macOS)
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * Get device memory in GB (Navigator.deviceMemory API)
 * Defaults to 4GB if not available.
 * Low memory devices (< 4GB) need more aggressive optimization.
 */
export const getDeviceMemory = (): number => {
  if (typeof navigator === 'undefined') return 4;
  return (navigator as any).deviceMemory || 4;
};

/**
 * Check if the browser supports WebGL rendering
 */
export const supportsWebGL = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};

/**
 * Detect if the device is a low-end mobile device
 * Uses multiple heuristics: iOS detection, device memory, WebGL support
 */
export const isLowEndDevice = (): boolean => {
  const ios = isIOS();
  const memory = getDeviceMemory();
  const webglSupported = supportsWebGL();

  // Low-end criteria:
  // - iOS device with < 4GB RAM
  // - No WebGL support
  return (ios && memory < 4) || !webglSupported;
};

/**
 * Get optimal building height multiplier based on device capabilities
 * Low-end devices get reduced building height for better performance.
 */
export const getBuildingHeightMultiplier = (): number => {
  if (isLowEndDevice()) {
    return 0.5; // 50% height for low-end devices
  }
  if (isIOS()) {
    return 0.6; // 60% height for iOS devices
  }
  return 0.7; // 70% height for desktop/high-end devices
};

/**
 * Get optimal building opacity based on device
 * iOS Safari has better performance with slightly lower opacity.
 */
export const getBuildingOpacity = (): number => {
  return isIOS() ? 0.7 : 0.8;
};

/**
 * Get device-specific log prefix for debugging
 */
export const getDeviceLogPrefix = (): string => {
  const ios = isIOS();
  const safari = isSafari();
  const memory = getDeviceMemory();
  const lowEnd = isLowEndDevice();

  const parts = [];
  if (ios) parts.push('iOS');
  if (safari && !ios) parts.push('Safari');
  if (lowEnd) parts.push('Low-End');
  parts.push(`${memory}GB RAM`);

  return `[${parts.join(' | ')}]`;
};
