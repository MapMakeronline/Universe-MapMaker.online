'use client';

import React, { useEffect, useRef } from 'react';
import { useControl } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import { useAppSelector } from '@/redux/hooks';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Custom Mapbox Control - Zoom to Selected Feature
 *
 * Displays a button in Mapbox's native control panel (top-right corner)
 * that zooms to the currently selected feature from Redux state.
 *
 * Only visible when a feature is selected (selectedFeatureId exists).
 */

// Helper functions for geometry processing (same as RightFABToolbar)
function extractCoordinatesFromGeometry(geometry: any): number[][] {
  if (!geometry) return [];

  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
      return geometry.coordinates;
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPoint':
      return geometry.coordinates;
    case 'MultiLineString':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    case 'GeometryCollection':
      return geometry.geometries.flatMap(extractCoordinatesFromGeometry);
    default:
      return [];
  }
}

function calculateBounds(coords: number[][]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (coords.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  coords.forEach(([lng, lat]) => {
    if (lng < minX) minX = lng;
    if (lng > maxX) maxX = lng;
    if (lat < minY) minY = lat;
    if (lat > maxY) maxY = lat;
  });

  return { minX, minY, maxX, maxY };
}

class ZoomToSelectedControlClass {
  private _map: mapboxgl.Map | null = null;
  private _container: HTMLDivElement | null = null;
  private _button: HTMLButtonElement | null = null;
  private selectedFeature: any = null;

  onAdd(map: mapboxgl.Map): HTMLElement {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.style.display = 'none'; // Hidden by default

    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.title = 'Przybliż do zaznaczonego obiektu';
    this._button.className = 'mapboxgl-ctrl-icon';
    this._button.setAttribute('aria-label', 'Przybliż do zaznaczonego');

    // Add Material Icon SVG
    const iconSvg = renderToStaticMarkup(
      <CenterFocusStrongIcon style={{ width: 20, height: 20 }} />
    );
    this._button.innerHTML = iconSvg;

    // Style the button to match Mapbox controls
    this._button.style.width = '29px';
    this._button.style.height = '29px';
    this._button.style.display = 'flex';
    this._button.style.alignItems = 'center';
    this._button.style.justifyContent = 'center';
    this._button.style.cursor = 'pointer';

    this._button.addEventListener('click', this._onClick.bind(this));

    this._container.appendChild(this._button);
    return this._container;
  }

  onRemove(): void {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = null;
    this._button = null;
    this._container = null;
  }

  private _onClick(): void {
    if (!this._map || !this.selectedFeature) return;

    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Zoom to feature using geometry or center point
    if (this.selectedFeature.geometry) {
      const coords = extractCoordinatesFromGeometry(this.selectedFeature.geometry);
      const bounds = calculateBounds(coords);

      this._map.fitBounds(
        [[bounds.minX, bounds.minY], [bounds.maxX, bounds.maxY]],
        {
          padding: 100,
          duration: 1000,
          maxZoom: 18,
        }
      );
    } else if (this.selectedFeature.coordinates) {
      this._map.flyTo({
        center: this.selectedFeature.coordinates,
        zoom: 16,
        duration: 1000,
      });
    }
  }

  // Update visibility and selected feature
  updateVisibility(selectedFeature: any): void {
    this.selectedFeature = selectedFeature;

    if (this._container) {
      if (selectedFeature) {
        this._container.style.display = 'block';
        if (this._button) {
          this._button.title = `Przybliż do: ${selectedFeature.name}`;
        }
      } else {
        this._container.style.display = 'none';
      }
    }
  }
}

interface ZoomToSelectedControlProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function ZoomToSelectedControl({
  position = 'top-right'
}: ZoomToSelectedControlProps) {
  const selectedFeatureId = useAppSelector((state) => state.features.selectedFeatureId);
  const features = useAppSelector((state) => state.features.features);
  const selectedFeature = selectedFeatureId ? features[selectedFeatureId] : null;

  const control = useControl<ZoomToSelectedControlClass>(
    () => new ZoomToSelectedControlClass(),
    { position }
  );

  // Update control visibility when selected feature changes
  useEffect(() => {
    if (control) {
      control.updateVisibility(selectedFeature);
    }
  }, [control, selectedFeature]);

  return null;
}
