/**
 * Color Conversion Utilities
 * Convert between hex colors (#RRGGBB) and RGBA arrays [R, G, B, A]
 */

import type { RGBAColor } from '@/backend/styles';

/**
 * Convert hex color to RGBA array
 * @param hex - Hex color string (e.g., "#ea8989" or "ea8989")
 * @param alpha - Alpha value (0-255), defaults to 255 (opaque)
 * @returns RGBA color array [R, G, B, A]
 */
export function hexToRgba(hex: string, alpha: number = 255): RGBAColor {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return [r, g, b, alpha];
}

/**
 * Convert RGBA array OR object to hex color
 * @param rgba - RGBA as [R, G, B, A] array OR {r, g, b, a} object
 * @returns Hex color string (e.g., "#ea8989")
 */
export function rgbaToHex(rgba: RGBAColor | { r: number; g: number; b: number; a?: number } | null | undefined): string {
  if (!rgba) {
    return '#000000'; // Default black
  }

  const toHex = (value: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  // Handle object format: {r, g, b, a}
  if (typeof rgba === 'object' && !Array.isArray(rgba) && 'r' in rgba) {
    const { r, g, b } = rgba;
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Handle array format: [r, g, b, a]
  if (Array.isArray(rgba)) {
    const [r, g, b] = rgba;
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return '#000000'; // Fallback
}

/**
 * Convert opacity percentage (0-100) to alpha value (0-255)
 * @param opacityPercent - Opacity percentage (0-100)
 * @returns Alpha value (0-255)
 */
export function opacityToAlpha(opacityPercent: number): number {
  return Math.round((opacityPercent / 100) * 255);
}

/**
 * Convert alpha value (0-255) to opacity percentage (0-100)
 * @param alpha - Alpha value (0-255)
 * @returns Opacity percentage (0-100)
 */
export function alphaToOpacity(alpha: number): number {
  return Math.round((alpha / 255) * 100);
}

/**
 * Get enum value for unit dropdown
 * Maps UI dropdown values to backend UnitType (0=MM, 1=MapUnit, 2=Pixels, 3=Percentage)
 */
export function getUnitValue(unitName: string): 0 | 1 | 2 | 3 {
  switch (unitName) {
    case 'Milimetry': return 0;
    case 'Punkty mapy': return 1;
    case 'Piksele': return 2;
    case 'Procent': return 3;
    default: return 0; // Default to MM
  }
}

/**
 * Get unit name from enum value
 * Maps backend UnitType to UI dropdown values
 */
export function getUnitName(unitValue: 0 | 1 | 2 | 3): string {
  switch (unitValue) {
    case 0: return 'Milimetry';
    case 1: return 'Punkty mapy';
    case 2: return 'Piksele';
    case 3: return 'Procent';
    default: return 'Milimetry';
  }
}

/**
 * Get stroke style value from name
 * Maps UI dropdown to backend StrokeStyleType
 */
export function getStrokeStyleValue(styleName: string): 0 | 1 | 2 | 3 | 4 | 5 {
  switch (styleName) {
    case 'Brak linii': return 0;
    case 'Linia ciągła': return 1;
    case 'Linia przerywana': return 2;
    case 'Linia kropkowana': return 3;
    case 'Kreska-kropka': return 4;
    case 'Kreska-kropka-kropka': return 5;
    default: return 1; // Default to solid
  }
}

/**
 * Get stroke style name from value
 */
export function getStrokeStyleName(styleValue: 0 | 1 | 2 | 3 | 4 | 5): string {
  switch (styleValue) {
    case 0: return 'Brak linii';
    case 1: return 'Linia ciągła';
    case 2: return 'Linia przerywana';
    case 3: return 'Linia kropkowana';
    case 4: return 'Kreska-kropka';
    case 5: return 'Kreska-kropka-kropka';
    default: return 'Linia ciągła';
  }
}

/**
 * Get join style value from name
 * Maps UI dropdown to backend JoinStyleType
 */
export function getJoinStyleValue(styleName: string): 0 | 64 | 128 {
  switch (styleName) {
    case 'Ostry': return 0; // Miter
    case 'Ścięty': return 64; // Bevel
    case 'Zaokrąglony': return 128; // Round
    default: return 128; // Default to round
  }
}

/**
 * Get join style name from value
 */
export function getJoinStyleName(styleValue: 0 | 64 | 128): string {
  switch (styleValue) {
    case 0: return 'Ostry';
    case 64: return 'Ścięty';
    case 128: return 'Zaokrąglony';
    default: return 'Zaokrąglony';
  }
}
