'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setDrawMode, clearAllFeatures } from '@/redux/slices/drawSlice';

const SimpleDrawingToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { draw } = useAppSelector((state) => state.draw);

  const toolbarStyle = {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    zIndex: 1000,
    minWidth: '120px'
  };

  const buttonStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#1976d2',
    color: 'white',
    border: '1px solid #1976d2'
  };

  const clearButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc004e',
    color: 'white',
    border: '1px solid #dc004e'
  };

  const handleToolSelect = (mode: string) => {
    dispatch(setDrawMode(mode as any));
  };

  const handleClearAll = () => {
    dispatch(clearAllFeatures());
  };

  return (
    <div style={toolbarStyle}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>
        Narzędzia rysowania
      </div>

      <button
        style={draw.mode === 'draw_point' ? activeButtonStyle : buttonStyle}
        onClick={() => handleToolSelect('draw_point')}
        title="Rysuj punkt"
      >
        📍 Punkt
      </button>

      <button
        style={draw.mode === 'draw_line_string' ? activeButtonStyle : buttonStyle}
        onClick={() => handleToolSelect('draw_line_string')}
        title="Rysuj linię"
      >
        📏 Linia
      </button>

      <button
        style={draw.mode === 'draw_polygon' ? activeButtonStyle : buttonStyle}
        onClick={() => handleToolSelect('draw_polygon')}
        title="Rysuj polygon"
      >
        ⬟ Polygon
      </button>

      <button
        style={draw.mode === 'draw_rectangle' ? activeButtonStyle : buttonStyle}
        onClick={() => handleToolSelect('draw_rectangle')}
        title="Rysuj prostokąt"
      >
        ⬜ Prostokąt
      </button>

      <button
        style={draw.mode === 'simple_select' ? activeButtonStyle : buttonStyle}
        onClick={() => handleToolSelect('simple_select')}
        title="Wybierz/edytuj obiekty"
      >
        ↖ Wybierz
      </button>

      <hr style={{ margin: '5px 0', border: '0.5px solid #eee' }} />

      <button
        style={clearButtonStyle}
        onClick={handleClearAll}
        disabled={draw.features.length === 0}
        title="Wyczyść wszystkie obiekty"
      >
        🗑 Wyczyść
      </button>

      <button
        style={buttonStyle}
        onClick={() => {
          const geojson = {
            type: 'FeatureCollection',
            features: draw.features,
          };
          const dataStr = JSON.stringify(geojson, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = 'mapa-obiekty.geojson';
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
        }}
        disabled={draw.features.length === 0}
        title="Eksportuj do GeoJSON"
      >
        💾 Eksport
      </button>

      {draw.features.length > 0 && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Obiekty: {draw.features.length}
        </div>
      )}
    </div>
  );
};

export default SimpleDrawingToolbar;