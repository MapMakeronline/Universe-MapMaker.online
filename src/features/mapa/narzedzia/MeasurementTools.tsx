'use client';

import React, { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  addMeasurementPoint,
  clearMeasurementPoints,
  addMeasurement,
  setMeasurementMode,
} from '@/redux/slices/drawSlice';
import {
  createDistanceMeasurement,
  createAreaMeasurement,
} from '@/tools/turf/measurements';

const MeasurementTools: React.FC = () => {
  const { current: map } = useMap();
  const dispatch = useAppDispatch();
  const { measurement } = useAppSelector((state) => state.draw);
  const [isMapReady, setIsMapReady] = useState(false);

  // Check if map is ready
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();
    if (!mapInstance) return;

    const checkMapReady = () => {
      if (mapInstance.isStyleLoaded()) {
        setIsMapReady(true);
      }
    };

    if (mapInstance.isStyleLoaded()) {
      setIsMapReady(true);
    } else {
      mapInstance.on('styledata', checkMapReady);
    }

    return () => {
      mapInstance.off('styledata', checkMapReady);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    const handleMapClick = (e: any) => {
      const { isDistanceMode, isAreaMode, activePoints } = measurement;
      console.log('📏 MEASUREMENT HANDLER: Click received', { isDistanceMode, isAreaMode });

      if (!isDistanceMode && !isAreaMode) return;

      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      dispatch(addMeasurementPoint(point));

      const newPoints = [...activePoints, point];

      // Distance measurement (needs at least 2 points)
      if (isDistanceMode && newPoints.length >= 2) {
        const measurementId = `distance_${Date.now()}`;
        const measurement = createDistanceMeasurement(measurementId, newPoints);
        dispatch(addMeasurement(measurement));

        // If it's the second point, finish measurement
        if (newPoints.length === 2) {
          dispatch(setMeasurementMode({ distance: false, area: false }));
          dispatch(clearMeasurementPoints());
        }
      }

      // Area measurement (needs at least 3 points)
      if (isAreaMode && newPoints.length >= 3) {
        const measurementId = `area_${Date.now()}`;
        const measurement = createAreaMeasurement(measurementId, newPoints);
        dispatch(addMeasurement(measurement));

        // Continue adding points until user finishes (double-click or button)
        // For now, we'll finish after 3 points
        if (newPoints.length === 3) {
          dispatch(setMeasurementMode({ distance: false, area: false }));
          dispatch(clearMeasurementPoints());
        }
      }
    };

    const handleDoubleClick = (e: any) => {
      // Finish area measurement on double-click
      if (measurement.isAreaMode && measurement.activePoints.length >= 3) {
        dispatch(setMeasurementMode({ distance: false, area: false }));
        dispatch(clearMeasurementPoints());
      }
    };

    // Add event listeners
    map.on('click', handleMapClick);
    map.on('dblclick', handleDoubleClick);

    return () => {
      // IMPORTANT: Check if map still exists before cleanup
      if (!map) return;

      try {
        map.off('click', handleMapClick);
        map.off('dblclick', handleDoubleClick);
      } catch (error) {
        console.warn('⚠️ MeasurementTools: Error removing event listeners:', error);
      }
    };
  }, [map, isMapReady, dispatch, measurement]);

  // Add measurement lines/polygons to map
  useEffect(() => {
    if (!map || !isMapReady) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return;
    const sourceId = 'measurement-source';
    const lineLayerId = 'measurement-lines';
    const pointLayerId = 'measurement-points';

    // Remove existing layers and source
    if (mapInstance.getLayer(lineLayerId)) mapInstance.removeLayer(lineLayerId);
    if (mapInstance.getLayer(pointLayerId)) mapInstance.removeLayer(pointLayerId);
    if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);

    // Create GeoJSON for measurements
    const features: any[] = [];

    // Add measurement lines/polygons
    measurement.measurements.forEach((m) => {
      if (m.type === 'distance' && m.coordinates.length >= 2) {
        features.push({
          type: 'Feature',
          properties: { type: 'distance', id: m.id, label: m.label },
          geometry: {
            type: 'LineString',
            coordinates: m.coordinates,
          },
        });
      } else if (m.type === 'area' && m.coordinates.length >= 3) {
        const closedCoords = [...m.coordinates];
        if (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] ||
            closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1]) {
          closedCoords.push(closedCoords[0]);
        }
        features.push({
          type: 'Feature',
          properties: { type: 'area', id: m.id, label: m.label },
          geometry: {
            type: 'Polygon',
            coordinates: [closedCoords],
          },
        });
      }

      // Add measurement points
      m.coordinates.forEach((coord, index) => {
        features.push({
          type: 'Feature',
          properties: {
            type: 'measurement-point',
            measurementId: m.id,
            pointIndex: index
          },
          geometry: {
            type: 'Point',
            coordinates: coord,
          },
        });
      });
    });

    // Add active measurement points
    measurement.activePoints.forEach((coord, index) => {
      features.push({
        type: 'Feature',
        properties: { type: 'active-point', pointIndex: index },
        geometry: {
          type: 'Point',
          coordinates: coord,
        },
      });
    });

    // Add active measurement line/polygon
    if (measurement.activePoints.length >= 2) {
      if (measurement.isDistanceMode) {
        features.push({
          type: 'Feature',
          properties: { type: 'active-distance' },
          geometry: {
            type: 'LineString',
            coordinates: measurement.activePoints,
          },
        });
      } else if (measurement.isAreaMode && measurement.activePoints.length >= 3) {
        const closedCoords = [...measurement.activePoints];
        closedCoords.push(closedCoords[0]);
        features.push({
          type: 'Feature',
          properties: { type: 'active-area' },
          geometry: {
            type: 'Polygon',
            coordinates: [closedCoords],
          },
        });
      }
    }

    // Add source and layers
    mapInstance.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    // Add line layer
    mapInstance.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      filter: ['in', ['get', 'type'], ['literal', ['distance', 'active-distance']]],
      paint: {
        'line-color': '#dc004e',
        'line-width': 3,
        'line-opacity': 0.8,
      },
    });

    // Add polygon layer
    mapInstance.addLayer({
      id: lineLayerId + '-fill',
      type: 'fill',
      source: sourceId,
      filter: ['in', ['get', 'type'], ['literal', ['area', 'active-area']]],
      paint: {
        'fill-color': '#dc004e',
        'fill-opacity': 0.3,
      },
    });

    mapInstance.addLayer({
      id: lineLayerId + '-stroke',
      type: 'line',
      source: sourceId,
      filter: ['in', ['get', 'type'], ['literal', ['area', 'active-area']]],
      paint: {
        'line-color': '#dc004e',
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });

    // Add point layer
    mapInstance.addLayer({
      id: pointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['in', ['get', 'type'], ['literal', ['measurement-point', 'active-point']]],
      paint: {
        'circle-color': '#ffffff',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#dc004e',
      },
    });

    return () => {
      // IMPORTANT: Check if map and mapInstance still exist before cleanup
      if (!map) return;

      const cleanupMapInstance = map.getMap?.();
      if (!cleanupMapInstance) return;

      try {
        if (cleanupMapInstance.getLayer(lineLayerId)) cleanupMapInstance.removeLayer(lineLayerId);
        if (cleanupMapInstance.getLayer(lineLayerId + '-fill')) cleanupMapInstance.removeLayer(lineLayerId + '-fill');
        if (cleanupMapInstance.getLayer(lineLayerId + '-stroke')) cleanupMapInstance.removeLayer(lineLayerId + '-stroke');
        if (cleanupMapInstance.getLayer(pointLayerId)) cleanupMapInstance.removeLayer(pointLayerId);
        if (cleanupMapInstance.getSource(sourceId)) cleanupMapInstance.removeSource(sourceId);
      } catch (error) {
        console.warn('⚠️ MeasurementTools: Error removing layers/source during cleanup:', error);
      }
    };
  }, [map, isMapReady, measurement.measurements, measurement.activePoints, measurement.isDistanceMode, measurement.isAreaMode]);

  return null; // This component doesn't render anything
};

export default MeasurementTools;