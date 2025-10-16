import { jsPDF } from 'jspdf';
import type { ExportConfig } from '@/features/warstwy/modale/ExportPDFModal';
import { mapLogger } from '@/tools/logger';

interface PageDimensions {
  width: number;
  height: number;
}

// Page dimensions in mm
const PAGE_SIZES: Record<string, PageDimensions> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
};

/**
 * Calculate the map extent needed to fit the desired scale on the page
 */
const calculateMapExtent = (
  config: ExportConfig,
  mapCenter: [number, number],
  currentZoom: number
): { width: number; height: number } => {
  const pageDim = PAGE_SIZES[config.pageSize];
  const dimensions = config.orientation === 'portrait'
    ? { width: pageDim.width, height: pageDim.height }
    : { width: pageDim.height, height: pageDim.width };

  // Convert page dimensions from mm to meters (at the scale)
  // 1mm on map = (scale) mm in reality
  // For scale 1:2000, 1mm on map = 2000mm = 2m in reality
  const metersPerMM = config.scale / 1000;

  // Calculate map extent in meters
  const mapWidthMeters = dimensions.width * metersPerMM;
  const mapHeightMeters = dimensions.height * metersPerMM;

  return {
    width: mapWidthMeters,
    height: mapHeightMeters,
  };
};

/**
 * Draw scale bar on PDF
 */
const drawScaleBar = (
  doc: jsPDF,
  scale: number,
  x: number,
  y: number,
  widthMM: number = 50
) => {
  // Calculate the real-world distance represented by the scale bar
  const metersPerMM = scale / 1000;
  const realWorldMeters = widthMM * metersPerMM;

  // Round to nice number
  let distance = realWorldMeters;
  let unit = 'm';
  if (distance >= 1000) {
    distance = distance / 1000;
    unit = 'km';
  }

  // Round to 1, 2, 5, 10, 20, 50, etc.
  const magnitude = Math.pow(10, Math.floor(Math.log10(distance)));
  const normalized = distance / magnitude;
  let roundedDistance: number;
  if (normalized <= 1) roundedDistance = 1;
  else if (normalized <= 2) roundedDistance = 2;
  else if (normalized <= 5) roundedDistance = 5;
  else roundedDistance = 10;

  const finalDistance = roundedDistance * magnitude;
  const actualWidthMM = (finalDistance * (unit === 'km' ? 1000 : 1)) / metersPerMM;

  // Draw scale bar
  doc.setDrawColor(0);
  doc.setFillColor(255);
  doc.setLineWidth(0.5);

  // White background
  doc.rect(x - 2, y - 6, actualWidthMM + 4, 12, 'F');

  // Black and white segments
  const segments = 4;
  const segmentWidth = actualWidthMM / segments;

  for (let i = 0; i < segments; i++) {
    if (i % 2 === 0) {
      doc.setFillColor(0);
    } else {
      doc.setFillColor(255);
    }
    doc.rect(x + i * segmentWidth, y, segmentWidth, 4, 'FD');
  }

  // Border
  doc.setDrawColor(0);
  doc.rect(x, y, actualWidthMM, 4, 'S');

  // Text
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(`0`, x, y + 8);
  doc.text(`${finalDistance} ${unit}`, x + actualWidthMM, y + 8, { align: 'right' });
  doc.text(`Skala 1:${scale.toLocaleString('pl-PL')}`, x + actualWidthMM / 2, y - 2, { align: 'center' });
};

/**
 * Draw north arrow on PDF
 */
const drawNorthArrow = (
  doc: jsPDF,
  x: number,
  y: number,
  size: number = 10
) => {
  // Draw simple north arrow
  doc.setDrawColor(0);
  doc.setFillColor(0);
  doc.setLineWidth(0.5);

  // Arrow
  const arrowPoints = [
    [x, y - size],           // Top
    [x - size/3, y],         // Bottom left
    [x, y - size/2],         // Middle
    [x + size/3, y],         // Bottom right
    [x, y - size],           // Back to top
  ];

  doc.setFillColor(0);
  doc.triangle(x, y - size, x - size/3, y, x, y - size/2, 'F');
  doc.setFillColor(255);
  doc.triangle(x, y - size, x + size/3, y, x, y - size/2, 'F');

  // Border
  doc.setDrawColor(0);
  doc.line(x, y - size, x - size/3, y);
  doc.line(x, y - size, x + size/3, y);
  doc.line(x - size/3, y, x + size/3, y);

  // N letter
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('N', x, y - size - 2, { align: 'center' });
};

/**
 * Draw coordinates on PDF
 */
const drawCoordinates = (
  doc: jsPDF,
  center: [number, number],
  x: number,
  y: number
) => {
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(
    `Współrzędne: ${center[1].toFixed(6)}°N, ${center[0].toFixed(6)}°E`,
    x,
    y,
    { align: 'center' }
  );
};

/**
 * Export map to PDF
 */
export const exportMapToPDF = async (
  mapInstance: any,
  config: ExportConfig
): Promise<void> => {
  mapLogger.log('📄 Starting PDF export with config:', config);

  try {
    // Get page dimensions
    const pageDim = PAGE_SIZES[config.pageSize];
    const dimensions = config.orientation === 'portrait'
      ? { width: pageDim.width, height: pageDim.height }
      : { width: pageDim.height, height: pageDim.width };

    // Create PDF
    const doc = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.pageSize.toLowerCase() as any,
    });

    // Get current map state
    const center = mapInstance.getCenter();
    const zoom = mapInstance.getZoom();

    mapLogger.log('📍 Map center:', center);
    mapLogger.log('🔍 Map zoom:', zoom);

    // Calculate required map extent for the scale
    const mapExtent = calculateMapExtent(config, [center.lng, center.lat], zoom);
    mapLogger.log('📐 Calculated map extent (meters):', mapExtent);

    // Get map canvas
    const canvas = mapInstance.getCanvas();

    // Wait for map to be idle
    await new Promise<void>((resolve) => {
      if (mapInstance.loaded()) {
        resolve();
      } else {
        mapInstance.once('load', () => resolve());
      }
    });

    // Capture map as image
    const mapImage = canvas.toDataURL('image/png', 1.0);

    // Calculate map area on PDF (leave margins for scale, title, etc.)
    const margin = 10;
    const titleHeight = 15;
    const footerHeight = 20;

    const mapWidth = dimensions.width - 2 * margin;
    const mapHeight = dimensions.height - margin - titleHeight - footerHeight;
    const mapX = margin;
    const mapY = titleHeight;

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(config.title, dimensions.width / 2, 10, { align: 'center' });

    // Add map image
    doc.addImage(
      mapImage,
      'PNG',
      mapX,
      mapY,
      mapWidth,
      mapHeight,
      undefined,
      'FAST'
    );

    // Add border around map
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(mapX, mapY, mapWidth, mapHeight);

    // Add scale bar
    if (config.includeScale) {
      drawScaleBar(
        doc,
        config.scale,
        margin + 10,
        dimensions.height - 15
      );
    }

    // Add north arrow
    if (config.includeNorthArrow) {
      drawNorthArrow(
        doc,
        dimensions.width - margin - 10,
        dimensions.height - 25
      );
    }

    // Add coordinates
    if (config.includeCoordinates) {
      drawCoordinates(
        doc,
        [center.lng, center.lat],
        dimensions.width / 2,
        dimensions.height - 5
      );
    }

    // Add generation date
    doc.setFontSize(7);
    doc.setTextColor(128);
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(
      `Wygenerowano: ${dateStr}`,
      margin,
      dimensions.height - 5
    );

    // Save PDF
    const fileName = `${config.title.replace(/\s+/g, '_')}_${config.scale}.pdf`;
    doc.save(fileName);

    mapLogger.log('✅ PDF exported successfully:', fileName);
  } catch (error) {
    mapLogger.error('❌ PDF export failed:', error);
    throw error;
  }
};
