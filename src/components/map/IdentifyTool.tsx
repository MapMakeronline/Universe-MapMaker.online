'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl';
import { useAppSelector } from '@/store/hooks';
import { mapLogger } from '@/lib/logger';
import IdentifyModal from '../panels/IdentifyModal';

interface FeatureProperty {
  key: string;
  value: any;
}

interface IdentifiedFeature {
  layer: string;
  sourceLayer?: string;
  properties: FeatureProperty[];
  geometry?: {
    type: string;
    coordinates?: any;
  };
}

const IdentifyTool = () => {
  const { current: map } = useMap();
  const { identify } = useAppSelector((state) => state.draw);

  const [modalOpen, setModalOpen] = useState(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<IdentifiedFeature[]>([]);
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | undefined>();

  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: any) => {
      // Only handle clicks when identify mode is active
      if (!identify.isActive) return;

      const features = map.queryRenderedFeatures(e.point);

      mapLogger.log('🔍 Identify: Clicked at', e.lngLat);
      mapLogger.log('🔍 Identify: Found features', features.length);

      if (features.length > 0) {
        // Transform features to our format
        const transformed: IdentifiedFeature[] = features.map((feature: any) => {
          const properties: FeatureProperty[] = Object.entries(feature.properties || {}).map(
            ([key, value]) => ({
              key,
              value,
            })
          );

          return {
            layer: feature.layer?.id || 'Unknown Layer',
            sourceLayer: feature.sourceLayer,
            properties,
            geometry: feature.geometry ? {
              type: feature.geometry.type,
              coordinates: feature.geometry.coordinates,
            } : undefined,
          };
        });

        setIdentifiedFeatures(transformed);
        setClickCoordinates([e.lngLat.lng, e.lngLat.lat]);
        setModalOpen(true);
      } else {
        // Show modal even with no features
        setIdentifiedFeatures([]);
        setClickCoordinates([e.lngLat.lng, e.lngLat.lat]);
        setModalOpen(true);
      }
    };

    // Add click handler
    map.on('click', handleMapClick);

    // Change cursor when identify mode is active
    if (identify.isActive) {
      map.getCanvas().style.cursor = 'help';
    } else {
      map.getCanvas().style.cursor = '';
    }

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [map, identify.isActive]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setIdentifiedFeatures([]);
    setClickCoordinates(undefined);
  };

  return (
    <IdentifyModal
      open={modalOpen}
      onClose={handleCloseModal}
      features={identifiedFeatures}
      coordinates={clickCoordinates}
    />
  );
};

export default IdentifyTool;
