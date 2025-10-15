'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-map-gl';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { useTheme, useMediaQuery } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LayersIcon from '@mui/icons-material/Layers';
import { useAppSelector } from '@/redux/hooks';
import { mapLogger } from '@/narzedzia/logger';
import type { LayerNode } from '@/typy/layers';

// Szerokość prawego toolbara + marginesy (IDENTYCZNE jak w MobileFAB)
const RIGHT_TOOLBAR_WIDTH = 56;
const RIGHT_TOOLBAR_MARGIN = 16;

interface QGISFeature {
  layerName: string;
  properties: Record<string, any>;
  geometry?: any;
}

interface QGISIdentifyToolProps {
  projectName?: string;
}

/**
 * NIEZALEŻNE narzędzie identyfikacji QGIS Server
 *
 * NIE używa IdentifyTool ani drawSlice - całkowicie osobna funkcja!
 *
 * Funkcjonalność:
 * - FAB button do aktywacji trybu identyfikacji
 * - Kliknięcie na mapę → zapytanie do QGIS Server (/api/layer/features)
 * - Modal z wynikami dla wszystkich widocznych warstw
 * - Własny state (nie współdzieli z innymi narzędziami)
 */
const QGISIdentifyTool: React.FC<QGISIdentifyToolProps> = ({ projectName }) => {
  const theme = useTheme();
  const { current: mapRef } = useMap();
  const layers = useAppSelector((state) => state.layers.layers);
  const token = useAppSelector((state) => state.auth.token); // Pobierz token z Redux

  // Własny state (NIE używa drawSlice!)
  const [isActive, setIsActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [features, setFeatures] = useState<QGISFeature[]>([]);
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Responsywność
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fabRightPosition = isMobile ? 16 : RIGHT_TOOLBAR_WIDTH + RIGHT_TOOLBAR_MARGIN + 8;

  // Helper: Transformacja współrzędnych WGS84 (EPSG:4326) → Web Mercator (EPSG:3857)
  // WORKAROUND dla backend bug: backend nie transformuje współrzędnych!
  const transformWGS84toWebMercator = useCallback((lon: number, lat: number): [number, number] => {
    // Web Mercator projection (EPSG:3857)
    // https://en.wikipedia.org/wiki/Web_Mercator_projection
    const R = 6378137; // Earth radius in meters

    const x = R * (lon * Math.PI / 180);
    const y = R * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 360)));

    return [x, y];
  }, []);

  // Helper: Pobierz wszystkie widoczne warstwy z ID (rekurencyjnie)
  const getVisibleLayers = useCallback((layerNodes: LayerNode[]): Array<{ id: string; name: string; type: string }> => {
    const visible: Array<{ id: string; name: string; type: string }> = [];
    for (const node of layerNodes) {
      if (node.visible && node.type !== 'group' && node.name && node.id) {
        visible.push({
          id: node.id,
          name: node.name,
          type: node.type || 'polygon' // Domyślnie polygon jeśli brak typu
        });
      }
      if (node.children) {
        visible.push(...getVisibleLayers(node.children));
      }
    }
    return visible;
  }, []);

  // Helper: Zapytanie do QGIS Server (używa /api/layer/feature/coordinates POST)
  const queryQGISFeatures = useCallback(async (
    point: [number, number],
    bbox: [number, number, number, number]
  ): Promise<QGISFeature[]> => {
    if (!projectName) {
      mapLogger.log('🔍 QGIS Identify: Brak nazwy projektu');
      return [];
    }

    const visibleLayers = getVisibleLayers(layers);
    if (visibleLayers.length === 0) {
      mapLogger.log('🔍 QGIS Identify: Brak widocznych warstw');
      return [];
    }

    mapLogger.log('🔍 QGIS Identify: Odpytywanie warstw', {
      project: projectName,
      layers: visibleLayers.map(l => `${l.name} (${l.id})`),
      point,
      bbox
    });

    const allFeatures: QGISFeature[] = [];

    // Zapytaj wszystkie widoczne warstwy (sekwencyjnie)
    for (const layer of visibleLayers) {
      try {
        // Przygotuj headers z tokenem autoryzacyjnym
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Dodaj token jeśli jest dostępny
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        } else {
          mapLogger.warn('🔍 QGIS Identify: Brak tokenu autoryzacyjnego - zapytanie może się nie powieść');
        }

        // WORKAROUND: Transformuj współrzędne WGS84 → EPSG:3857
        // Backend BUG: nie transformuje współrzędnych poprawnie!
        // Backend tworzy punkt z WGS84 współrzędnych ale z SRID 3857 bez transformacji
        const [x3857, y3857] = transformWGS84toWebMercator(point[0], point[1]);

        mapLogger.log(`🔍 QGIS Identify: Transformacja współrzędnych dla "${layer.name}":`, {
          wgs84: point,
          epsg3857: [x3857.toFixed(2), y3857.toFixed(2)]
        });

        // Używamy FETCH bezpośrednio - endpoint /api/layer/feature/coordinates wymaga POST!
        // WAŻNE: Wysyłamy współrzędne w EPSG:3857 (Web Mercator) zamiast WGS84!
        const response = await fetch('https://api.universemapmaker.online/api/layer/feature/coordinates', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            project: projectName,
            layer_id: layer.id,  // UŻYWAMY ID, NIE NAZWY!
            point: [x3857, y3857], // EPSG:3857 - Web Mercator (metry, nie stopnie!)
            layer_type: layer.type // "polygon", "line", "point"
          })
        });

        if (response.status === 401) {
          mapLogger.error('🔍 QGIS Identify: ❌ Token nieważny lub wygasł (401 Unauthorized)');
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          mapLogger.error(`🔍 QGIS Identify: Błąd HTTP ${response.status} dla warstwy "${layer.name}"`, errorText);
          continue;
        }

        const data = await response.json();

        // DEBUG: Wyświetl pełną odpowiedź backendu
        mapLogger.log(`🔍 QGIS Identify: 📦 Odpowiedź dla warstwy "${layer.name}":`, {
          success: data.success,
          message: data.message,
          hasData: !!data.data,
          hasFeaturesKey: !!data.data?.features,
          featuresCount: data.data?.features?.length || 0,
          fullResponse: data
        });

        if (data.success && data.data?.features && data.data.features.length > 0) {
          mapLogger.log(`🔍 QGIS Identify: ✅ Znaleziono ${data.data.features.length} obiektów w warstwie "${layer.name}"`);

          // Transformuj features
          const transformed: QGISFeature[] = data.data.features.map((feature: any) => ({
            layerName: layer.name,
            properties: feature.properties || {},
            geometry: feature.geometry,
          }));

          allFeatures.push(...transformed);
        } else if (!data.success) {
          mapLogger.warn(`🔍 QGIS Identify: ⚠️ API zwróciło success: false dla "${layer.name}"`, data.message);
        } else if (data.data?.features?.length === 0) {
          mapLogger.log(`🔍 QGIS Identify: ℹ️ Brak obiektów w tym miejscu dla warstwy "${layer.name}"`);
        }
      } catch (error) {
        mapLogger.error(`🔍 QGIS Identify: Błąd zapytania warstwy "${layer.name}"`, error);
      }
    }

    mapLogger.log(`🔍 QGIS Identify: Łącznie znaleziono obiektów: ${allFeatures.length}`);
    return allFeatures;
  }, [projectName, layers, getVisibleLayers, token, transformWGS84toWebMercator]);

  // Obsługa kliknięcia na mapę
  useEffect(() => {
    mapLogger.log('🔍 QGIS Identify: useEffect triggered', {
      hasMapRef: !!mapRef,
      isActive,
      projectName,
    });

    // WAŻNE: Najpierw sprawdź czy mapa jest dostępna (niezależnie od isActive)
    if (!mapRef) {
      mapLogger.warn('🔍 QGIS Identify: ⚠️ mapRef is null - waiting for map initialization');
      return; // Czekaj na mapę
    }

    const map = mapRef.getMap();
    if (!map) {
      mapLogger.warn('🔍 QGIS Identify: ⚠️ map.getMap() returned null - waiting for map');
      return; // Czekaj na inicjalizację mapy
    }

    mapLogger.log('🔍 QGIS Identify: ✅ Map is available', {
      mapLoaded: map.loaded(),
      isActive,
    });

    // Teraz sprawdź czy narzędzie jest aktywne
    if (!isActive) {
      // Przywróć normalny kursor gdy nieaktywne
      map.getCanvas().style.cursor = '';
      mapLogger.log('🔍 QGIS Identify: Inactive - cursor restored');
      return;
    }

    // ✅ Mapa dostępna + narzędzie aktywne → Zarejestruj handler
    mapLogger.log('🔍 QGIS Identify: ✅ Registering click handler', {
      projectName,
      layersCount: layers.length,
    });

    // Zmień kursor na "help"
    map.getCanvas().style.cursor = 'help';
    mapLogger.log('🔍 QGIS Identify: Cursor changed to "help"');

    const handleMapClick = async (e: any) => {
      mapLogger.log('🔍 QGIS Identify: ===== KLIKNIĘCIE NA MAPĘ =====', {
        lngLat: e.lngLat,
        point: e.point,
        isActive,
        projectName
      });

      setIsLoading(true);

      const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setClickCoordinates(clickPoint);

      // Utwórz bbox wokół punktu kliknięcia (tolerance: 0.01 stopnia ~ 1km)
      const tolerance = 0.01; // Zwiększono z 0.001 dla lepszego wykrywania
      const bbox: [number, number, number, number] = [
        e.lngLat.lng - tolerance, // minLng (West)
        e.lngLat.lat - tolerance, // minLat (South)
        e.lngLat.lng + tolerance, // maxLng (East)
        e.lngLat.lat + tolerance  // maxLat (North)
      ];

      mapLogger.log('🔍 QGIS Identify: 📍 Kliknięcie w:', {
        lon: clickPoint[0],
        lat: clickPoint[1],
        bbox,
        tolerance: `${tolerance}° (~1km)`
      });

      // Zapytaj QGIS Server
      const qgisFeatures = await queryQGISFeatures(clickPoint, bbox);

      setFeatures(qgisFeatures);
      setModalOpen(true);
      setIsLoading(false);
    };

    map.on('click', handleMapClick);
    mapLogger.log('🔍 QGIS Identify: Event listener zarejestrowany! Czekam na kliknięcia...');

    return () => {
      mapLogger.log('🔍 QGIS Identify: Cleanup - usuwam event listener');
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, isActive, projectName, layers, queryQGISFeatures]);

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    mapLogger.log(`🔍 QGIS Identify FAB: ${newState ? 'AKTYWOWANY' : 'DEZAKTYWOWANY'}`);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFeatures([]);
    setClickCoordinates(null);
  };

  return (
    <>
      {/* FAB Button */}
      <Tooltip
        title={isActive ? 'Wyłącz identyfikację QGIS' : 'Włącz identyfikację QGIS (kliknij na mapę)'}
        placement="left"
      >
        <Fab
          onClick={handleToggle}
          aria-label={isActive ? 'Wyłącz identyfikację' : 'Włącz identyfikację'}
          sx={{
            position: 'fixed',
            bottom: 150, // Powyżej MobileFAB (80px)
            right: fabRightPosition,
            zIndex: 1300,
            transition: 'right 0.3s ease-in-out',
            bgcolor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            opacity: isActive ? 1 : 0.7,
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          {isActive ? <InfoIcon /> : <InfoOutlinedIcon />}
        </Fab>
      </Tooltip>

      {/* Modal z wynikami */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '8px',
            maxHeight: isMobile ? '100%' : '80vh',
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon />
            <Typography variant="h6">
              Identyfikacja QGIS ({features.length} {features.length === 1 ? 'obiekt' : 'obiekty'})
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseModal}
            size="small"
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            bgcolor: '#f7f9fc',
            px: 3,
            py: 3,
          }}
        >
          {isLoading ? (
            <Typography>Ładowanie...</Typography>
          ) : features.length === 0 ? (
            <Typography color="text.secondary">
              Nie znaleziono obiektów w tym miejscu.
              {clickCoordinates && ` (${clickCoordinates[0].toFixed(5)}, ${clickCoordinates[1].toFixed(5)})`}
            </Typography>
          ) : (
            <>
              {/* Współrzędne kliknięcia */}
              {clickCoordinates && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Współrzędne:</strong> {clickCoordinates[0].toFixed(6)}, {clickCoordinates[1].toFixed(6)}
                  </Typography>
                </Box>
              )}

              {/* Lista obiektów */}
              {features.map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <LayersIcon fontSize="small" />
                    {feature.layerName}
                  </Typography>

                  {/* Tabela atrybutów */}
                  {Object.keys(feature.properties).length > 0 ? (
                    <Table size="small">
                      <TableBody>
                        {Object.entries(feature.properties).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell
                              sx={{
                                fontWeight: 500,
                                color: 'text.secondary',
                                width: '40%',
                                borderBottom: '1px solid #f0f0f0',
                              }}
                            >
                              {key}
                            </TableCell>
                            <TableCell
                              sx={{
                                borderBottom: '1px solid #f0f0f0',
                                wordBreak: 'break-word',
                              }}
                            >
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Brak atrybutów
                    </Typography>
                  )}
                </Box>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            bgcolor: '#f7f9fc',
            px: 3,
            pb: 3,
            pt: 0,
          }}
        >
          <Button
            onClick={handleCloseModal}
            variant="contained"
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QGISIdentifyTool;
