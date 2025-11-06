/**
 * KOMPONENT LAYER TREE - DRZEWO WARSTW
 * 
 * Odpowiada za:
 * - Renderowanie hierarchicznej struktury warstw i grup
 * - Obsługę drag & drop między warstwami (przeciąganie, upuszczanie, wizualne wskazówki)
 * - Wyświetlanie ikon dla różnych typów warstw (grupa, warstwa)
 * - Zarządzanie rozwijaniem/zwijaniem grup
 * - Obsługę checkboxów włączania/wyłączania warstw
 * - Wizualne feedback podczas operacji drag & drop (strefy drop, kolory, animacje)
 */
'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import LayersIcon from '@mui/icons-material/Layers';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CalendarTodayIcon from '@mui/icons-material/TableView';
// Geometry type icons
import PlaceIcon from '@mui/icons-material/Place'; // Point
import TimelineIcon from '@mui/icons-material/Timeline'; // LineString
import PolylineIcon from '@mui/icons-material/Polyline'; // Polygon
import ImageIcon from '@mui/icons-material/Image'; // Raster
// Redux
import { useAppDispatch } from '@/redux/hooks';
import { setViewState } from '@/redux/slices/mapSlice';
import { transformExtentFromWebMercator, detectCRS, transformExtent } from '@/mapbox/coordinates';
// Types
import { LayerNode } from '@/types-app/layers';

type DropPosition = 'before' | 'after' | 'inside';

interface DragDropState {
  draggedItem: string | null;
  dropTarget: string | null;
  dropPosition: DropPosition;
  showMainLevelZone: boolean;
}

interface LayerTreeProps {
  warstwy: LayerNode[];
  selectedLayer: LayerNode | null;
  searchFilter: string;
  expandedGroups: string[];
  dragDropState: DragDropState;
  onLayerSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onDragStart: (e: any, id: string) => void;
  onDragEnd: () => void;
  onDragEnter: (e: any, id: string) => void;
  onDragLeave: (e: any) => void;
  onDragOver: (e: any, id?: string) => void;
  onDrop: (e: any, targetId: string) => void;
  onDropAtEnd: (e: any, groupId: string) => void;
  onLayerTreeDragOver: (e: any) => void;
  onMainLevelDragOver: (e: any) => void;
  onShowAttributeTable: (layerId: string) => void; // NEW: Show attribute table modal
}

// Colors from theme
const layerIconColors = {
  grupa: '#4fc3f7',
  wektor: '#81c784',
  raster: '#81c784',
  default: '#81c784'
} as const;

const dropZoneColors = {
  primary: '#4caf50',
  secondary: '#66bb6a',
  hover: '#4caf50'
} as const;

// ===== KONFIGURACJA WIELKOŚCI I STYLÓW =====
// Obiekt konfiguracji dla wielkości i stylów drzewa warstw
const TREE_CONFIG = {
  // Ustawienia kontenera drzewa
  container: {
    padding: 1,
    scrollbar: {
      width: 8,
      borderRadius: 4
    }
  },
  
  // Odstępy i wcięcia elementów
  item: {
    padding: {
      vertical: 0.2,
      horizontal: 1
    },
    indentation: 1.5, // mnożone przez poziom
    borderRadius: 4,
    margins: {
      children: 1
    },
    // Stany wizualne przeciągania i upuszczania
    dragStates: {
      opacity: {
        dragged: 0.6,
        normal: 1
      },
      transform: {
        dragged: 'scale(1.02) rotate(2deg)',
        hover: 'translateX(4px)',
        normal: 'none'
      },
      boxShadow: {
        dragged: '0 8px 16px rgba(0,0,0,0.3)',
        dropTarget: '0 0 0 2px rgba(76, 175, 80, 0.4)',
        normal: 'none'
      }
    }
  },
  
  // Ustawienia typografii
  typography: {
    fontSize: '13px',
    fontWeight: {
      group: 500,
      layer: 400
    },
    letterSpacing: '0.2px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  
  // Elementy interaktywne
  elements: {
    expandButton: {
      size: 16,
      marginRight: 0.5
    },
    checkbox: {
      size: 16,
      marginRight: 1
    },
    iconContainer: {
      marginRight: 1,
      minWidth: 20
    },
    actionButton: {
      padding: 0.25,
      gap: 0.5
    },
    dropZone: {
      height: {
        active: 12,
        inactive: 4
      },
      indicator: {
        height: 3,
        borderRadius: 1.5,
        bottom: 2
      }
    }
  },
  
  // Kolory i stany wizualne
  colors: {
    background: {
      dragged: 'rgba(79, 195, 247, 0.3)',
      dropTarget: 'rgba(76, 175, 80, 0.2)',
      selected: 'rgba(255, 152, 0, 0.2)',
      hover: {
        normal: 'rgba(79, 195, 247, 0.15)',
        dragged: 'rgba(79, 195, 247, 0.4)',
        dropTarget: 'rgba(76, 175, 80, 0.3)',
        dropZone: 'rgba(79, 195, 247, 0.05)'
      },
      transparent: 'transparent'
    },
    border: {
      level: 'rgba(255,255,255,0.1)',
      levelHover: '#4fc3f7',
      dragged: '#4fc3f7',
      dropTarget: '#4caf50',
      selected: '#ff9800'
    },
    text: {
      visible: '#ffffff',
      hidden: 'rgba(255, 255, 255, 0.5)',
      icon: 'rgba(255, 255, 255, 0.7)',
      iconHover: '#4fc3f7'
    },
    indicators: {
      drag: '#1976d2',
      drop: '#4fc3f7',
      dropGlow: 'rgba(79, 195, 247, 0.6)',
      arrow: 'rgba(255,255,255,0.8)'
    }
  },
  
  // Konfiguracje ikon
  icon: {
    size: {
      small: 'small',
      medium: 'medium'
    }
  }
} as const;

const MAIN_LEVEL_DROP_ID = '__main_level__';

export const LayerTree: React.FC<LayerTreeProps> = ({
  warstwy,
  selectedLayer,
  searchFilter,
  expandedGroups,
  dragDropState,
  onLayerSelect,
  onToggleVisibility,
  onToggleExpansion,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDropAtEnd,
  onLayerTreeDragOver,
  onMainLevelDragOver,
  onShowAttributeTable
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { draggedItem, dropTarget, dropPosition, showMainLevelZone } = dragDropState;

  // Get icon based on layer type and geometry
  const getWarstwaIcon = (warstwa: LayerNode) => {
    const iconSize = TREE_CONFIG.icon.size.small;

    // Group/Folder
    if (warstwa.type === 'group') {
      return <FolderIcon sx={{ color: layerIconColors.grupa, fontSize: iconSize }} />;
    }

    // Raster layers
    if (warstwa.type === 'RasterLayer') {
      return <ImageIcon sx={{ color: layerIconColors.raster, fontSize: iconSize }} />;
    }

    // Vector layers - check geometry type
    if (warstwa.type === 'VectorLayer' && warstwa.geometry) {
      const geom = warstwa.geometry.toLowerCase();

      // Point geometries
      if (geom.includes('point')) {
        return <PlaceIcon sx={{ color: layerIconColors.wektor, fontSize: iconSize }} />;
      }

      // LineString geometries
      if (geom.includes('line')) {
        return <TimelineIcon sx={{ color: layerIconColors.wektor, fontSize: iconSize }} />;
      }

      // Polygon geometries
      if (geom.includes('polygon')) {
        return <PolylineIcon sx={{ color: layerIconColors.wektor, fontSize: iconSize }} />;
      }
    }

    // Default fallback
    return <LayersIcon sx={{ color: layerIconColors.default, fontSize: iconSize }} />;
  };

  const filterWarstwy = (warstwy: LayerNode[], filter: string): LayerNode[] => {
    if (!filter) return warstwy;
    return warstwy.filter(warstwa => {
      const matchesName = warstwa.name.toLowerCase().includes(filter.toLowerCase());
      const hasMatchingChildren = warstwa.children &&
        filterWarstwy(warstwa.children, filter).length > 0;
      return matchesName || hasMatchingChildren;
    }).map(warstwa => ({
      ...warstwa,
      children: warstwa.children ? filterWarstwy(warstwa.children, filter) : undefined
    }));
  };

  const renderWarstwaItem = (warstwa: LayerNode, level: number = 0): React.ReactNode => {
    const isDragged = draggedItem === warstwa.id;
    const isDropTarget = dropTarget === warstwa.id;

    return (
      <Box sx={{
        mb: -0.2,
        position: 'relative',
        ml: showMainLevelZone ? 1.5 : 0, // Delikatny margines tylko gdy w lewej strefie
        transition: 'margin-left 0.2s ease'
      }}>
        {/* Drop indicator - różne wskazówki dla różnych operacji */}
        {isDropTarget && draggedItem && dropPosition === 'inside' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: level * 1.5 * 8,
              right: 8,
              bottom: 0,
              border: `2px dashed ${dropZoneColors.primary}`,
              borderRadius: 1,
              zIndex: 999,
              pointerEvents: 'none',
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              animation: 'groupDropIndicator 1.5s infinite',
              '@keyframes groupDropIndicator': {
                '0%': { 
                  borderColor: dropZoneColors.primary,
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)'
                },
                '50%': { 
                  borderColor: dropZoneColors.secondary,
                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                  boxShadow: '0 0 16px rgba(76, 175, 80, 0.6)'
                },
                '100%': { 
                  borderColor: dropZoneColors.hover,
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)'
                }
              },
              '&::before': {
                content: '"📁"',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '16px',
                opacity: 0.7
              }
            }}
          />
        )}
        
        {isDropTarget && draggedItem && (dropPosition === 'before' || dropPosition === 'after') && (
          <Box
            sx={{
              position: 'absolute',
              top: dropPosition === 'before' ? -2 : 'auto',
              bottom: dropPosition === 'after' ? -2 : 'auto',
              left: level * 1.5 * 8,
              right: 8,
              height: 3,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1.5,
              zIndex: 1000,
              pointerEvents: 'none',
              boxShadow: '0 0 8px rgba(25, 118, 210, 0.8)',
              animation: 'preciseDropIndicator 1.2s infinite',
              '@keyframes preciseDropIndicator': {
                '0%': { 
                  opacity: 0.7, 
                  transform: 'scaleX(0.8)',
                  boxShadow: '0 0 4px rgba(25, 118, 210, 0.4)'
                },
                '50%': { 
                  opacity: 1, 
                  transform: 'scaleX(1)',
                  boxShadow: '0 0 12px rgba(25, 118, 210, 1)'
                },
                '100%': { 
                  opacity: 0.7, 
                  transform: 'scaleX(0.8)',
                  boxShadow: '0 0 4px rgba(25, 118, 210, 0.4)'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -4,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 8,
                height: 8,
                bgcolor: theme.palette.primary.main,
                borderRadius: '50%',
                boxShadow: '0 0 6px rgba(25, 118, 210, 0.8)'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -4,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 8,
                height: 8,
                bgcolor: theme.palette.primary.main,
                borderRadius: '50%',
                boxShadow: '0 0 6px rgba(25, 118, 210, 0.8)'
              }
            }}
          />
        )}
        
        <Box
          className="layer-item"
          draggable
          onClick={() => onLayerSelect(warstwa.id)}
          onDragStart={(e) => onDragStart(e as any, warstwa.id)}
          onDragEnd={onDragEnd}
          onDragEnter={(e) => onDragEnter(e as any, warstwa.id)}
          onDragLeave={onDragLeave as any}
          onDragOver={(e) => onDragOver(e as any, warstwa.id)}
          onDrop={(e) => onDrop(e as any, warstwa.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: TREE_CONFIG.item.padding.vertical,
            px: TREE_CONFIG.item.padding.horizontal,
            ml: level * TREE_CONFIG.item.indentation,
            borderRadius: TREE_CONFIG.item.borderRadius,
            cursor: isDragged ? 'grabbing' : 'pointer',
            transition: 'all 0.2s ease',
            bgcolor: isDragged ? TREE_CONFIG.colors.background.dragged : 
                     isDropTarget ? TREE_CONFIG.colors.background.dropTarget : 
                     selectedLayer?.id === warstwa.id ? TREE_CONFIG.colors.background.selected : TREE_CONFIG.colors.background.transparent,
            borderLeft: level > 0 ? `2px solid ${TREE_CONFIG.colors.border.level}` : 'none',
            border: isDragged ? `2px dashed ${TREE_CONFIG.colors.border.dragged}` : 
                    isDropTarget ? `2px solid ${TREE_CONFIG.colors.border.dropTarget}` : 
                    selectedLayer?.id === warstwa.id ? `2px solid ${TREE_CONFIG.colors.border.selected}` : 'none',
            opacity: isDragged ? TREE_CONFIG.item.dragStates.opacity.dragged : TREE_CONFIG.item.dragStates.opacity.normal,
            transform: isDragged ? TREE_CONFIG.item.dragStates.transform.dragged : TREE_CONFIG.item.dragStates.transform.normal,
            boxShadow: isDragged ? TREE_CONFIG.item.dragStates.boxShadow.dragged : 
                       isDropTarget ? TREE_CONFIG.item.dragStates.boxShadow.dropTarget : TREE_CONFIG.item.dragStates.boxShadow.normal,
            '&:hover': {
              bgcolor: isDragged ? TREE_CONFIG.colors.background.hover.dragged : 
                       isDropTarget ? TREE_CONFIG.colors.background.hover.dropTarget : 
                       TREE_CONFIG.colors.background.hover.normal,
              borderLeft: level > 0 ? `2px solid ${TREE_CONFIG.colors.border.levelHover}` : 'none',
              transform: isDragged ? TREE_CONFIG.item.dragStates.transform.dragged : TREE_CONFIG.item.dragStates.transform.hover,
              '& .layer-item__actions': {
                opacity: 1
              },
              '& .drag-handle': {
                color: theme.palette.primary.main
              }
            }
          }}
        >
          {/* Strzałka rozwijania dla grup lub placeholder dla warstw */}
          {warstwa.type === 'group' ? (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpansion(warstwa.id);
              }}
              sx={{
                width: TREE_CONFIG.elements.expandButton.size,
                height: TREE_CONFIG.elements.expandButton.size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                mr: TREE_CONFIG.elements.expandButton.marginRight,
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              <Box
                sx={{
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: expandedGroups.includes(warstwa.id) ? '6px 4px 0 4px' : '4px 0 4px 6px',
                  borderColor: expandedGroups.includes(warstwa.id)
                    ? `${theme.palette.text.secondary} transparent transparent transparent`
                    : `transparent transparent transparent ${theme.palette.text.secondary}`,
                  transition: 'all 0.2s ease'
                }}
              />
            </Box>
          ) : (
            /* Placeholder przestrzeń dla warstw - wyrównanie checkboxów */
            <Box sx={{ 
              width: TREE_CONFIG.elements.expandButton.size, 
              height: TREE_CONFIG.elements.expandButton.size, 
              mr: TREE_CONFIG.elements.expandButton.marginRight 
            }} />
          )}
          
          <Box
            component="input"
            type="checkbox"
            checked={warstwa.visible}
            onChange={() => onToggleVisibility(warstwa.id)}
            onClick={(e: any) => e.stopPropagation()}
            sx={{
              mr: TREE_CONFIG.elements.checkbox.marginRight,
              cursor: 'pointer',
              accentColor: theme.palette.primary.main,
              width: TREE_CONFIG.elements.checkbox.size,
              height: TREE_CONFIG.elements.checkbox.size,
              '&:checked': {
                accentColor: theme.palette.primary.main
              }
            }}
          />
          
          <Box sx={{
            mr: TREE_CONFIG.elements.iconContainer.marginRight,
            display: 'flex',
            alignItems: 'center',
            minWidth: TREE_CONFIG.elements.iconContainer.minWidth,
            justifyContent: 'center'
          }}>
            {getWarstwaIcon(warstwa)}
          </Box>
          
          <Tooltip
            title={warstwa.name}
            arrow
            placement="right"
            enterDelay={500} // Opóźnienie 500ms - nie przeszkadza w drag & drop
            disableInteractive // Tooltip nie blokuje interakcji
            disableHoverListener={!!draggedItem} // Wyłącz podczas przeciągania
            disableTouchListener // Wyłącz na urządzeniach mobilnych (touch nie potrzebuje hover tooltips)
          >
            <Typography
              sx={{
                fontSize: TREE_CONFIG.typography.fontSize,
                color: warstwa.visible ? theme.palette.text.primary : theme.palette.text.disabled,
                flex: 1,
                fontWeight: warstwa.type === 'group' ? TREE_CONFIG.typography.fontWeight.group : TREE_CONFIG.typography.fontWeight.layer,
                letterSpacing: TREE_CONFIG.typography.letterSpacing,
                fontFamily: TREE_CONFIG.typography.fontFamily,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer'
              }}
            >
              {warstwa.name}
            </Typography>
          </Tooltip>
          
          {/* Ikony po prawej stronie */}
          <Box className="layer-item__actions" sx={{ display: 'flex', alignItems: 'center', gap: TREE_CONFIG.elements.actionButton.gap, opacity: 1 }}>
            {/* GPS Button - Przybliż do warstwy (tylko dla warstw z extent) */}
            {warstwa.type !== 'group' && warstwa.extent && (
              <Tooltip
                title="Przybliż do warstwy"
                arrow
                enterDelay={300}
                disableInteractive
                disableHoverListener={!!draggedItem}
                disableTouchListener
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!warstwa.extent || warstwa.extent.length !== 4) {
                      console.warn('⚠️ Layer extent not available:', warstwa.name);
                      return;
                    }

                    const [minX, minY, maxX, maxY] = warstwa.extent;

                    // Detect CRS based on bottom-left corner coordinates
                    let detectedCRS = detectCRS(minX, minY);
                    console.log('🌍 Detected CRS for layer:', warstwa.name, '→', detectedCRS);

                    // FALLBACK dla unknown CRS - spróbuj wykryć z extent values
                    if (detectedCRS === 'unknown') {
                      console.warn(`⚠️ Unknown CRS for layer: ${warstwa.name}, attempting auto-detection from extent`);

                      // Heurystyka: jeśli współrzędne > 180, to projected CRS
                      if (Math.abs(minX) > 180 || Math.abs(minY) > 180) {
                        // Duże wartości sugerują Web Mercator lub Polish Grid
                        if (minX > 100000 && minX < 1000000) {
                          detectedCRS = 'EPSG:2180'; // Polski układ PL-1992
                          console.log('📍 Auto-detected Polish coordinates (EPSG:2180)');
                        } else {
                          detectedCRS = 'EPSG:3857'; // Web Mercator (fallback)
                          console.log('🌐 Auto-detected Web Mercator (EPSG:3857)');
                        }
                      } else {
                        detectedCRS = 'EPSG:4326'; // WGS84 (geographic)
                        console.log('🌍 Auto-detected geographic coordinates (EPSG:4326)');
                      }
                    }

                    let wgs84Extent: [number, number, number, number];

                    if (detectedCRS === 'EPSG:4326') {
                      wgs84Extent = [minX, minY, maxX, maxY];
                    } else if (detectedCRS === 'EPSG:3857') {
                      wgs84Extent = transformExtentFromWebMercator([minX, minY, maxX, maxY]);
                    } else if (detectedCRS === 'EPSG:2180') {
                      wgs84Extent = transformExtent([minX, minY, maxX, maxY]);
                    } else {
                      // Ostateczny fallback - użyj Web Mercator transformation
                      console.warn(`⚠️ Unsupported CRS: ${detectedCRS}, using Web Mercator transformation as fallback`);
                      dispatch(showInfo(`Warstwa "${warstwa.name}": Nieznany układ współrzędnych, używam Web Mercator`));
                      wgs84Extent = transformExtentFromWebMercator([minX, minY, maxX, maxY]);
                    }

                    const [wgs84MinX, wgs84MinY, wgs84MaxX, wgs84MaxY] = wgs84Extent;

                    // Calculate center
                    const centerLng = (wgs84MinX + wgs84MaxX) / 2;
                    const centerLat = (wgs84MinY + wgs84MaxY) / 2;

                    // Calculate appropriate zoom based on extent size
                    const extentWidth = wgs84MaxX - wgs84MinX;
                    const extentHeight = wgs84MaxY - wgs84MinY;
                    const maxDimension = Math.max(extentWidth, extentHeight);

                    let zoom = 12; // Default zoom
                    if (maxDimension > 10) zoom = 6;       // Very large extent (country-level)
                    else if (maxDimension > 1) zoom = 8;   // Large extent (region-level)
                    else if (maxDimension > 0.1) zoom = 11; // Medium extent (city-level)
                    else if (maxDimension > 0.01) zoom = 14; // Small extent (neighborhood-level)
                    else zoom = 16;                        // Very small extent (street-level)

                    console.log('🎯 Flying to layer:', warstwa.name, {
                      center: [centerLng, centerLat],
                      zoom,
                      extent: wgs84Extent,
                      detectedCRS
                    });

                    dispatch(setViewState({
                      longitude: centerLng,
                      latitude: centerLat,
                      zoom,
                      bearing: 0,
                      pitch: 0
                    }));
                  }}
                  sx={{
                    color: theme.palette.text.secondary,
                    p: TREE_CONFIG.elements.actionButton.padding,
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  <MyLocationIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Ikona kalendarza - tylko dla warstw (nie katalogów) */}
            {warstwa.type !== 'group' && (
              <Tooltip
                title="Pokaż tabele atrybutów"
                arrow
                enterDelay={300}
                disableInteractive
                disableHoverListener={!!draggedItem}
                disableTouchListener
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowAttributeTable(warstwa.id);
                  }}
                  sx={{
                    color: theme.palette.text.secondary,
                    p: TREE_CONFIG.elements.actionButton.padding,
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  <CalendarTodayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {warstwa.children && expandedGroups.includes(warstwa.id) && (
          <Box sx={{ ml: TREE_CONFIG.item.margins.children }}>
            {warstwa.children.map((dziecko: LayerNode) => (
              <React.Fragment key={dziecko.id}>
                {renderWarstwaItem(dziecko, level + 1)}
              </React.Fragment>
            ))}
            
            {/* Specjalna strefa drop na końcu grupy */}
            <Box
              onDragEnter={(e) => onDragEnter(e as any, `${warstwa.id}-end`)}
              onDragLeave={onDragLeave as any}
              onDragOver={onDragOver as any}
              onDrop={(e) => onDropAtEnd(e as any, warstwa.id)}
              sx={{
                height: draggedItem ? TREE_CONFIG.elements.dropZone.height.active : TREE_CONFIG.elements.dropZone.height.inactive,
                position: 'relative',
                cursor: draggedItem ? 'copy' : 'default',
                transition: 'height 0.2s ease',
                '&:hover': draggedItem ? {
                  bgcolor: TREE_CONFIG.colors.background.hover.dropZone
                } : {}
              }}
            >
              {/* Wskaźnik drop na końcu */}
              {dropTarget === `${warstwa.id}-end` && draggedItem && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: TREE_CONFIG.elements.dropZone.indicator.bottom,
                    left: 0,
                    right: 0,
                    height: TREE_CONFIG.elements.dropZone.indicator.height,
                    bgcolor: TREE_CONFIG.colors.indicators.drop,
                    borderRadius: TREE_CONFIG.elements.dropZone.indicator.borderRadius,
                    boxShadow: `0 0 6px ${TREE_CONFIG.colors.indicators.dropGlow}`,
                    animation: 'dropPulse 1.5s infinite',
                    pointerEvents: 'none'
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const filteredWarstwy = filterWarstwy(warstwy, searchFilter);

  return (
    <Box 
      className="layer-tree"
      onDragOver={onLayerTreeDragOver as any}
      sx={{ 
        flex: selectedLayer ? '1 1 0%' : 1,
        minHeight: 0,
        overflow: 'auto',
        p: TREE_CONFIG.container.padding,
        position: 'relative',
        '&::-webkit-scrollbar': {
          width: TREE_CONFIG.container.scrollbar.width
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'rgba(255, 255, 255, 0.1)'
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: TREE_CONFIG.container.scrollbar.borderRadius
        }
      }}
    >
      {/* Strefa drop głównego poziomu - po lewej stronie tylko gdy przeciągamy w lewo */}
      {showMainLevelZone && draggedItem && (
        <Box
          onDragOver={onMainLevelDragOver as any}
          onDrop={(e) => onDrop(e as any, MAIN_LEVEL_DROP_ID)}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 25,
            height: '100%',
            bgcolor: dropTarget === MAIN_LEVEL_DROP_ID ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
            border: dropTarget === MAIN_LEVEL_DROP_ID ? '2px solid #ff9800' : '2px dashed rgba(255, 152, 0, 0.5)',
            borderRadius: 1,
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'copy',
            transition: 'all 0.2s ease',
            animation: dropTarget === MAIN_LEVEL_DROP_ID ? 'mainLevelActive 1s infinite' : 'none',
            '@keyframes mainLevelActive': {
              '0%': { 
                bgcolor: 'rgba(255, 152, 0, 0.2)',
                borderColor: '#ff9800'
              },
              '50%': { 
                bgcolor: 'rgba(255, 152, 0, 0.3)',
                borderColor: '#ffb74d'
              },
              '100%': { 
                bgcolor: 'rgba(255, 152, 0, 0.2)',
                borderColor: '#ff9800'
              }
            }
          }}
        >
          <Typography sx={{ 
            fontSize: '9px', 
            color: theme.palette.warning.main, 
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.1,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}>
            Poziom główny
          </Typography>
        </Box>
      )}

      {filteredWarstwy.map(warstwa => (
        <React.Fragment key={warstwa.id}>
          {renderWarstwaItem(warstwa)}
        </React.Fragment>
      ))}
    </Box>
  );
};
