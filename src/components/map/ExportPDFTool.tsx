'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/store/hooks';
import { exportMapToPDF } from '@/lib/mapbox/pdfExport';
import type { ExportConfig } from '@/components/panels/ExportPDFModal';

interface ExportPDFToolProps {
  config: ExportConfig | null;
  onComplete: () => void;
}

const ExportPDFTool: React.FC<ExportPDFToolProps> = ({ config, onComplete }) => {
  const { current: map } = useMap();

  useEffect(() => {
    if (!config || !map) return;

    const exportPDF = async () => {
      try {
        await exportMapToPDF(map, config);
      } catch (error) {
        console.error('PDF export failed:', error);
      } finally {
        onComplete();
      }
    };

    exportPDF();
  }, [config, map, onComplete]);

  return null;
};

export default ExportPDFTool;
