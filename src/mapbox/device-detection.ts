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
 * Get device memory in GB (Navigator.deviceMemory API)
 * Defaults to 4GB if not available.
 * Low memory devices (< 4GB) need more aggressive optimization.
 */
export const getDeviceMemory = (): number => {
  if (typeof navigator === 'undefined') return 4;
  return (navigator as any).deviceMemory || 4;
};

/**
 * Detect if the device is a low-end mobile device
 * Uses multiple heuristics: iOS detection, device memory
 */
export const isLowEndDevice = (): boolean => {
  const ios = isIOS();
  const memory = getDeviceMemory();

  // Low-end criteria:
  // - iOS device with < 4GB RAM
  return ios && memory < 4;
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
 * Get device-specific log prefix for debugging
 */
export const getDeviceLogPrefix = (): string => {
  const ios = isIOS();
  const memory = getDeviceMemory();
  const lowEnd = isLowEndDevice();

  const parts = [];
  if (ios) parts.push('iOS');
  if (lowEnd) parts.push('Low-End');
  parts.push(`${memory}GB RAM`);

  return `[${parts.join(' | ')}]`;
};
