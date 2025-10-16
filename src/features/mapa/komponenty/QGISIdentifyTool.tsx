'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-map-gl';
import Fab from '@mui/material/Fab';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
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
import ApartmentIcon from '@mui/icons-material/Apartment'; // Ikona budynku (3D Buildings)
import HexagonIcon from '@mui/icons-material/Hexagon'; // Ikona poligonu (QGIS layers)
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { mapLogger } from '@/tools/logger';
import type { LayerNode } from '@/types-app/layers';
import { addFeature, selectFeature, setAttributeModalOpen } from '@/redux/slices/featuresSlice';
import type { MapFeature } from '@/redux/slices/featuresSlice';
import { query3DBuildingsAtPoint, get3DBuildingsSource } from '@/mapbox/3d-picking';
import { detect3DLayers, has3DLayers } from '@/mapbox/3d-layer-detection';
import { getFeatureInfo } from '@/mapbox/qgis-layers';

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
  const dispatch = useAppDispatch();
  const layers = useAppSelector((state) => state.layers.layers);
  const mapboxFeaturesStore = useAppSelector((state) => state.features); // For 3D buildings (Mapbox)

  // Własny state (NIE używa drawSlice!)
  const [isActive, setIsActive] = useState(false);
  const [identifyType, setIdentifyType] = useState<'qgis' | '3d-buildings' | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [features, setFeatures] = useState<QGISFeature[]>([]); // QGIS backend features
  const [clickCoordinates, setClickCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Responsywność
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fabRightPosition = isMobile ? 16 : RIGHT_TOOLBAR_WIDTH + RIGHT_TOOLBAR_MARGIN + 8;

  // REMOVED: transformWGS84toWebMercator - now handled by getFeatureInfo in qgis-layers.ts

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

  // Helper: Zapytanie do QGIS Server (WMS GetFeatureInfo)
  const queryQGISFeatures = useCallback(async (
    point: [number, number],
    mapInstance: mapboxgl.Map
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

    mapLogger.log('🔍 QGIS Identify: Odpytywanie warstw przez QGIS Server (WMS GetFeatureInfo)', {
      project: projectName,
      layers: visibleLayers.map(l => `${l.name} (${l.id})`),
      point
    });

    const allFeatures: QGISFeature[] = [];

    // Zapytaj wszystkie widoczne warstwy (sekwencyjnie)
    for (const layer of visibleLayers) {
      try {
        mapLogger.log(`🔍 QGIS Identify: Zapytanie do warstwy "${layer.name}"...`);

        // Użyj getFeatureInfo z qgis-layers.ts (WMS GetFeatureInfo)
        const result = await getFeatureInfo(
          projectName,
          layer.name, // WAŻNE: Używamy layer.name (nazwa warstwy), NIE layer.id (UUID)!
          point,
          mapInstance,
          10 // FEATURE_COUNT: max 10 obiektów na warstwę
        );

        if (!result.success) {
          mapLogger.error(`🔍 QGIS Identify: Błąd dla warstwy "${layer.name}"`, result.error);
          continue;
        }

        // QGIS Server zwraca GeoJSON FeatureCollection
        const features = result.data?.features || [];

        if (features.length > 0) {
          mapLogger.log(`🔍 QGIS Identify: ✅ Znaleziono ${features.length} obiektów w warstwie "${layer.name}"`);

          // Transformuj features do QGISFeature interface
          const transformed: QGISFeature[] = features.map((feature: any) => ({
            layerName: layer.name,
            properties: feature.properties || {},
            geometry: feature.geometry,
          }));

          allFeatures.push(...transformed);
        } else {
          mapLogger.log(`🔍 QGIS Identify: ℹ️ Brak obiektów w tym miejscu dla warstwy "${layer.name}"`);
        }
      } catch (error) {
        mapLogger.error(`🔍 QGIS Identify: Błąd zapytania warstwy "${layer.name}"`, error);
      }
    }

    mapLogger.log(`🔍 QGIS Identify: Łącznie znaleziono obiektów: ${allFeatures.length}`);
    return allFeatures;
  }, [projectName, layers, getVisibleLayers]);

  // Obsługa kliknięcia na mapę (MOBILE + DESKTOP COMPATIBLE)
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

    // Track touch start for tap vs drag detection (MOBILE FIX!)
    let touchStartPt: { x: number; y: number } | null = null;

    const handleMapClick = async (e: any) => {
      mapLogger.log('🔍 QGIS Identify: ===== KLIKNIĘCIE NA MAPĘ =====', {
        lngLat: e.lngLat,
        point: e.point,
        isActive,
        projectName
      });

      triggerHapticFeedback(); // Haptic feedback on map click

      setIsLoading(true);

      const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setClickCoordinates(clickPoint);

      mapLogger.log('🔍 QGIS Identify: 📍 Kliknięcie w:', {
        lon: clickPoint[0],
        lat: clickPoint[1]
      });

      // ==================== IDENTIFY MODE LOGIC ====================
      if (identifyType === '3d-buildings') {
        // ==================== 3D BUILDINGS MODE ====================
        const mapHas3DLayers = has3DLayers(map);

        mapLogger.log('🏢 3D Buildings Identify: Checking for 3D layers', {
          has3DLayers: mapHas3DLayers,
          pitch: map.getPitch(),
        });

        if (!mapHas3DLayers) {
          mapLogger.warn('🏢 3D Buildings Identify: No 3D layers found - switching to 2D style may help');
          setIsLoading(false);
          return;
        }

        // Use 3D picking utility (12px tolerance)
        const building3DFeatures = query3DBuildingsAtPoint(map, e.point, 12);

        if (building3DFeatures.length === 0) {
          mapLogger.log('🏢 3D Buildings Identify: No buildings found at this point');
          setIsLoading(false);
          return;
        }

        const firstFeature = building3DFeatures[0];
        const featureId = firstFeature.id?.toString() || `building-${Date.now()}`;

        mapLogger.log('🏢 3D Buildings Identify: Building selected', {
          id: featureId,
          properties: firstFeature.properties
        });

        triggerHapticFeedback();

        // Check if building already exists in Redux store
        let building = mapboxFeaturesStore.features[featureId];

        if (!building) {
          // Create new building entry
          const coordinates: [number, number] = firstFeature.geometry?.type === 'Point'
            ? (firstFeature.geometry.coordinates as [number, number])
            : [e.lngLat.lng, e.lngLat.lat];

          const newBuilding: MapFeature = {
            id: featureId,
            type: 'building',
            name: `Budynek ${featureId}`,
            coordinates,
            layer: get3DBuildingsSource(map) || '3d-buildings',
            geometry: firstFeature.geometry,
            attributes: Object.entries(firstFeature.properties || {}).map(([key, value]) => ({
              key,
              value,
            })),
          };

          dispatch(addFeature(newBuilding));
          building = newBuilding;
        }

        // Select and open modal
        dispatch(selectFeature(building.id));
        dispatch(setAttributeModalOpen(true));
        setIsLoading(false);

      } else if (identifyType === 'qgis') {
        // ==================== QGIS LAYERS MODE ====================
        const qgisFeatures = await queryQGISFeatures(clickPoint, map);

        setFeatures(qgisFeatures);
        setModalOpen(true);
        setIsLoading(false);

        // Haptic feedback when features found
        if (qgisFeatures.length > 0) {
          triggerHapticFeedback();
        }
      }
    };

    // Desktop: click handler (works after tap on mobile when no drag/pinch)
    map.on('click', handleMapClick);
    mapLogger.log('🔍 QGIS Identify: ✅ Desktop click listener registered');

    // Mobile fallback: touchstart/touchend pattern (tap vs drag detection)
    const handleTouchStart = (e: any) => {
      if (e.points?.length === 1) {
        touchStartPt = { x: e.point.x, y: e.point.y };
        mapLogger.log('🔍 QGIS Identify: 📱 Touch start detected');
      }
    };

    const handleTouchEnd = (e: any) => {
      if (e.points?.length !== 1 || !touchStartPt) {
        touchStartPt = null;
        return;
      }

      // Check if user moved finger (drag vs tap)
      const dx = Math.abs(e.point.x - touchStartPt.x);
      const dy = Math.abs(e.point.y - touchStartPt.y);
      const moved = Math.max(dx, dy) > 8; // 8px tolerance

      touchStartPt = null;

      if (moved) {
        mapLogger.log('🔍 QGIS Identify: 🔄 Touch moved - ignoring (drag, not tap)');
        return; // Was a drag, not a tap
      }

      // Clean tap detected - trigger identify
      mapLogger.log('🔍 QGIS Identify: ✅ Clean tap detected (touchend fallback)');
      handleMapClick(e);
    };

    map.on('touchstart', handleTouchStart);
    map.on('touchend', handleTouchEnd);
    mapLogger.log('🔍 QGIS Identify: ✅ Mobile touch listeners registered');

    return () => {
      mapLogger.log('🔍 QGIS Identify: Cleanup - usuwam event listeners');
      map.off('click', handleMapClick);
      map.off('touchstart', handleTouchStart);
      map.off('touchend', handleTouchEnd);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, isActive, projectName, layers, queryQGISFeatures]);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 50ms vibration
    }
  };

  const handleIdentifyTypeSelect = (type: 'qgis' | '3d-buildings') => {
    triggerHapticFeedback(); // Haptic feedback on selection
    setIdentifyType(type);
    setIsActive(true);
    setSpeedDialOpen(false);
    mapLogger.log(`🔍 Identify: Aktywowano tryb ${type === 'qgis' ? 'QGIS Layers' : '3D Buildings'}`);
  };

  const handleDeactivate = () => {
    triggerHapticFeedback();
    setIsActive(false);
    setIdentifyType(null);
    setSpeedDialOpen(false);
    mapLogger.log('🔍 Identify: DEZAKTYWOWANY');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFeatures([]);
    setClickCoordinates(null);
  };

  return (
    <>
      {/* SpeedDial with identify options */}
      {!isActive ? (
        <SpeedDial
          ariaLabel="Identify tools"
          icon={<SpeedDialIcon icon={<InfoOutlinedIcon sx={{ fontSize: 28 }} />} />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => {
            triggerHapticFeedback();
            setSpeedDialOpen(true);
          }}
          open={speedDialOpen}
          direction="left"
          FabProps={{
            size: isMobile ? 'large' : 'medium',
          }}
          sx={{
            position: 'fixed',
            bottom: 16, // Bottom right corner
            right: 16,
            zIndex: 1400,
            transition: 'right 0.3s ease-in-out',
            '& .MuiSpeedDial-fab': {
              bgcolor: theme.palette.primary.main,
              width: isMobile ? 64 : 56,
              height: isMobile ? 64 : 56,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            },
          }}
        >
          {/* QGIS Layers Identify */}
          <SpeedDialAction
            key="qgis"
            icon={<HexagonIcon sx={{ fontSize: 24 }} />}
            tooltipTitle="Identyfikuj warstwy QGIS"
            onClick={() => handleIdentifyTypeSelect('qgis')}
            FabProps={{
              sx: {
                width: isMobile ? 52 : 48,
                height: isMobile ? 52 : 48,
                '&:active': {
                  transform: 'scale(0.9)',
                },
              },
            }}
          />
          {/* 3D Buildings Identify */}
          <SpeedDialAction
            key="3d-buildings"
            icon={<ApartmentIcon sx={{ fontSize: 24 }} />}
            tooltipTitle="Identyfikuj budynki 3D"
            onClick={() => handleIdentifyTypeSelect('3d-buildings')}
            FabProps={{
              sx: {
                width: isMobile ? 52 : 48,
                height: isMobile ? 52 : 48,
                '&:active': {
                  transform: 'scale(0.9)',
                },
              },
            }}
          />
        </SpeedDial>
      ) : (
        // Active mode - show active icon (changes based on selected type)
        <Tooltip
          title={`Aktywne: ${identifyType === 'qgis' ? 'QGIS Layers' : '3D Buildings'} (kliknij aby wyłączyć)`}
          placement="left"
        >
          <Fab
            onClick={handleDeactivate}
            size={isMobile ? 'large' : 'medium'}
            aria-label="Wyłącz identyfikację"
            sx={{
              position: 'fixed',
              bottom: 16, // Bottom right corner
              right: 16,
              zIndex: 1400,
              transition: 'right 0.3s ease-in-out',
              width: isMobile ? 64 : 56,
              height: isMobile ? 64 : 56,
              bgcolor: theme.palette.primary.main, // Primary color when active
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              '&:active': {
                transform: 'scale(0.95)',
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            {/* Show icon based on active identify type */}
            {identifyType === 'qgis' ? (
              <HexagonIcon sx={{ fontSize: isMobile ? 32 : 24 }} />
            ) : (
              <ApartmentIcon sx={{ fontSize: isMobile ? 32 : 24 }} />
            )}
          </Fab>
        </Tooltip>
      )}

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
