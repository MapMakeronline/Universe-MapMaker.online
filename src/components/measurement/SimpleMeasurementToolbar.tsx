'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setMeasurementMode,
  clearAllMeasurements,
  removeMeasurement,
} from '@/store/slices/drawSlice';

const SimpleMeasurementToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { measurement } = useAppSelector((state) => state.draw);

  const toolbarStyle = {
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    zIndex: 1000,
    minWidth: '150px',
    maxHeight: '400px',
    overflowY: 'auto' as const
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

  const handleDistanceMode = () => {
    const newMode = !measurement.isDistanceMode;
    dispatch(setMeasurementMode({
      distance: newMode,
      area: false
    }));
  };

  const handleAreaMode = () => {
    const newMode = !measurement.isAreaMode;
    dispatch(setMeasurementMode({
      distance: false,
      area: newMode
    }));
  };

  const handleClearAll = () => {
    dispatch(clearAllMeasurements());
  };

  return (
    <div style={toolbarStyle}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>
        Narzędzia pomiarowe
      </div>

      <button
        style={measurement.isDistanceMode ? activeButtonStyle : buttonStyle}
        onClick={handleDistanceMode}
        title="Mierz odległość między punktami"
      >
        📏 Odległość
      </button>

      <button
        style={measurement.isAreaMode ? activeButtonStyle : buttonStyle}
        onClick={handleAreaMode}
        title="Mierz powierzchnię obszaru"
      >
        📐 Powierzchnia
      </button>

      {(measurement.isDistanceMode || measurement.isAreaMode) && (
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #1976d2'
        }}>
          {measurement.isDistanceMode && "Kliknij 2 punkty na mapie"}
          {measurement.isAreaMode && "Kliknij punkty na mapie, podwójne kliknięcie kończy"}
        </div>
      )}

      <hr style={{ margin: '5px 0', border: '0.5px solid #eee' }} />

      <button
        style={clearButtonStyle}
        onClick={handleClearAll}
        disabled={measurement.measurements.length === 0}
        title="Wyczyść wszystkie pomiary"
      >
        🗑 Wyczyść wszystkie
      </button>

      {/* Lista wyników pomiarów */}
      {measurement.measurements.length > 0 && (
        <>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>
            Wyniki pomiarów:
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {measurement.measurements.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px',
                border: '1px solid #eee',
                borderRadius: '3px',
                marginBottom: '3px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {m.type === 'distance' ? '📏' : '📐'} {m.type === 'distance' ? 'Odległość' : 'Powierzchnia'}
                  </div>
                  <div>{m.label}</div>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#dc004e'
                  }}
                  onClick={() => dispatch(removeMeasurement(m.id))}
                  title="Usuń pomiar"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {measurement.measurements.length > 0 && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Pomiary: {measurement.measurements.length}
        </div>
      )}
    </div>
  );
};

export default SimpleMeasurementToolbar;