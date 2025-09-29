'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(19.9449799);
  const [lat, setLat] = useState(50.0646501);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    if (map.current) return; // Inicjalizuj tylko raz

    // WAŻNE: Token MUSI być ustawiony przed new Map()
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12', // Nowszy styl
      center: [lng, lat],
      zoom: zoom
    });

    // Aktualizuj stan gdy mapa się porusza
    map.current.on('move', () => {
      if (map.current) {
        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Pusta dependency array = mount tylko raz

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Sidebar z info */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '12px',
        fontFamily: 'monospace',
        margin: '12px',
        borderRadius: '4px'
      }}>
        <div>🗺️ Universe MapMaker</div>
        <div>Longitude: {lng}</div>
        <div>Latitude: {lat}</div>
        <div>Zoom: {zoom}</div>
        <div style={{ marginTop: '8px', fontSize: '12px' }}>
          Token: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅' : '❌'}
        </div>
      </div>

      {/* Map container z absolutnymi wymiarami */}
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}

