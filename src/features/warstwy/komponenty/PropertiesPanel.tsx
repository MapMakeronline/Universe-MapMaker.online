/**
 * KOMPONENT PROPERTIES PANEL - PANEL WŁAŚCIWOŚCI WARSTWY
 * 
 * Odpowiada za:
 * - Wyświetlanie szczegółowych właściwości wybranej warstwy
 * - Edycję ustawień warstwy (przezroczystość, widoczność, style)
 * - Zarządzanie sekcjami rozwijalnymi (Style, Filtry, Metadane)
 * - Formularz edycji parametrów warstwy
 * - Akcje na warstwie (usuwanie, duplikowanie, eksport)
 * - Podgląd informacji o warstwie (typ, source, rozmiar)
 */
'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import { BasemapSelector } from './BasemapSelector';
import { PublishServicesModal } from '../modale/PublishServicesModal';
import { usePublishWMSWFSMutation } from '@/redux/api/projectsApi';
import { useAppDispatch } from '@/redux/hooks';
import { showSuccess, showError, showInfo } from '@/redux/slices/notificationSlice';
// Types defined locally for now
interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

interface ExpandedSections {
  [key: string]: boolean;
}

interface CheckboxStates {
  [key: string]: boolean;
}

interface PropertiesPanelProps {
  selectedLayer: Warstwa | null;
  warstwy: Warstwa[];
  expandedSections: ExpandedSections;
  checkboxStates: CheckboxStates;
  onToggleSection: (sectionId: string) => void;
  onToggleCheckbox: (checkboxName: string) => void;
  onClosePanel: () => void;
  onEditLayerStyle: () => void;
  onManageLayer: () => void;
  onLayerLabeling: () => void;
  findParentGroup: (layers: Warstwa[], childId: string) => Warstwa | null;
  projectName?: string;
  wmsUrl?: string;
  wfsUrl?: string;
}

// ===== KONFIGURACJA WIELKOŚCI I STYLÓW =====

const PANEL_CONFIG = {
  // Główne wymiary panelu
  panel: {
    height: '260px', // Wysokość całego panelu właściwości
    headerHeight: '40px', // Wysokość nagłówka panelu
    contentPadding: '0px', // Padding dla zawartości (nieużywane)
  },
  
   // Czcionki i tekst
  typography: {
    headerFontSize: '15px', // Rozmiar czcionki w nagłówku panelu
    sectionTitleFontSize: '15px', // Rozmiar tytułów sekcji
    labelFontSize: '11px', // Rozmiar etykiet pól
    valueFontSize: '11px', // Rozmiar wartości w polach
    buttonFontSize: '10px', // Rozmiar czcionki w przyciskach
    iconSize: '14px', // Rozmiar ikon w sekcjach
    closeIconSize: '14px', // Rozmiar ikony zamknięcia
  },
  
  // Elementy interfejsu (jednostki MUI: liczby = * 8px, stringi = dokładne wartości)
  elements: {
    sectionMarginBottom: 0.8, // Odstęp między sekcjami (0.8 * 8px = 6.4px)
    sectionContentMarginLeft: 2, // Wcięcie zawartości sekcji (2 * 8px = 16px)
    sectionContentMarginTop: 1, // Odstęp góra zawartości sekcji (1 * 8px = 8px)
    fieldMarginBottom: 0.8, // Odstęp między polami (0.8 * 8px = 6.4px)
    checkboxSize: '16px', // Rozmiar checkboxów (jednostka dokładna)
    buttonPaddingX: 2, // Padding poziomy przycisków (2 * 8px = 16px)
    buttonPaddingY: 0.3, // Padding pionowy przycisków (0.3 * 8px = 2.4px)
    buttonMinWidth: '60px', // Minimalna szerokość przycisków
    sliderHeight: '6px', // Wysokość sliderów
    sliderThumbSize: '14px', // Rozmiar suwaka slidera
  },
  
    // Kolory (dla łatwej zmiany motywu)
  colors: {
    panelBackground: 'rgba(50, 50, 50, 0.95)',
    headerBackground: 'rgba(40, 40, 40, 0.9)',
    buttonBackground: 'rgba(70, 80, 90, 0.8)',
    buttonBorder: 'rgba(100, 110, 120, 0.6)',
    buttonHoverBackground: 'rgba(79, 195, 247, 0.2)',
    buttonHoverBorder: 'rgba(79, 195, 247, 0.4)',
    accent: '#4fc3f7',
    text: 'white',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
  }
  
  };

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedLayer,
  warstwy,
  expandedSections,
  checkboxStates,
  onToggleSection,
  onToggleCheckbox,
  onClosePanel,
  onEditLayerStyle,
  onManageLayer,
  onLayerLabeling,
  findParentGroup,
  projectName = '',
  wmsUrl = '',
  wfsUrl = ''
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(true); // Domyślnie zwinięty

  // WMS/WFS Publication State
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);
  const [publishWMSWFS, { isLoading: isPublishing }] = usePublishWMSWFSMutation();

  // Handle WMS/WFS Publication
  const handlePublish = async (selectedLayerIds: string[]) => {
    if (!projectName) {
      dispatch(showError('Nie można opublikować - brak nazwy projektu'));
      return;
    }

    if (selectedLayerIds.length === 0) {
      dispatch(showError('Wybierz co najmniej jedną warstwę do publikacji'));
      return;
    }

    // Check auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    console.log('🔐 WMS/WFS Publish - Auth token:', token ? '✅ present' : '❌ missing');
    console.log('📦 Publishing layers:', selectedLayerIds);
    console.log('📁 Project:', projectName);

    // Build children array with layer tree structure
    // Backend expects: { project_name: string, children: [{type: 'VectorLayer', id, name, geometry}] }
    const buildLayerTree = (layerIds: string[], allLayers: Warstwa[]): any[] => {
      const children: any[] = [];

      // Helper to find layer by ID in tree
      const findLayer = (id: string, layers: Warstwa[]): Warstwa | null => {
        for (const layer of layers) {
          if (layer.id === id) return layer;
          if (layer.dzieci) {
            const found = findLayer(id, layer.dzieci);
            if (found) return found;
          }
        }
        return null;
      };

      for (const layerId of layerIds) {
        const layer = findLayer(layerId, allLayers);
        if (layer) {
          // Map local types to QGIS types
          let layerType = 'VectorLayer';
          if (layer.typ === 'raster') layerType = 'RasterLayer';
          else if (layer.typ === 'grupa') layerType = 'group';

          children.push({
            type: layerType,
            id: layer.id,
            name: layer.nazwa,
            visible: layer.widoczna,
            // Add geometry for vector layers (backend needs this)
            geometry: layer.typ === 'wektor' ? 'MultiPolygon' : undefined
          });
        }
      }

      return children;
    };

    const children = buildLayerTree(selectedLayerIds, warstwy);
    console.log('🌳 Built layer tree for publication:', children);
    console.log('🌳 Layer tree JSON:', JSON.stringify(children, null, 2));

    // Show loading notification
    dispatch(showInfo(`Publikowanie ${selectedLayerIds.length} warstw jako WMS/WFS...`, 10000));

    try {
      const result = await publishWMSWFS({
        project_name: projectName, // Backend expects project_name, not project!
        children: children,        // Backend expects children array, not layers array!
      }).unwrap();

      console.log('✅ WMS/WFS Publication successful:', result);

      // Extract URLs from result.data (backend wraps URLs in data object)
      const wmsUrl = result.data?.wms_url || result.wms_url || '';
      const wfsUrl = result.data?.wfs_url || result.wfs_url || '';

      // Show success with URLs
      const successMsg = `Opublikowano ${selectedLayerIds.length} warstw!\n` +
        `WMS: ${wmsUrl}\n` +
        `WFS: ${wfsUrl}`;
      dispatch(showSuccess(successMsg, 8000));

      setPublishModalOpen(false);

      // RTK Query automatically invalidates cache and refetches project data with new URLs
    } catch (error: any) {
      console.error('❌ WMS/WFS Publication failed:', error);
      console.error('❌ Error status:', error?.status);
      console.error('❌ Error data:', error?.data);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.detail || error?.message || 'Nieznany błąd';
      dispatch(showError(`Nie udało się opublikować usług: ${errorMessage}`, 8000));
    }
  };

  // Pomocnicze funkcje do renderowania elementów z konfiguracją
  const renderLabel = (text: string) => (
    <Typography sx={{ 
      fontSize: PANEL_CONFIG.typography.labelFontSize, 
      color: theme.palette.text.primary, 
      mb: 0.5 
    }}>
      {text}
    </Typography>
  );

  const renderValue = (text: string, italic: boolean = true) => (
    <Typography sx={{ 
      fontSize: PANEL_CONFIG.typography.valueFontSize, 
      color: theme.palette.text.primary, 
      fontStyle: italic ? 'italic' : 'normal',
      lineHeight: 1.3
    }}>
      {text}
    </Typography>
  );

  const renderFieldBox = (children: React.ReactNode, marginBottom: boolean = true) => (
    <Box sx={{ mb: marginBottom ? PANEL_CONFIG.elements.fieldMarginBottom : 0 }}>
      {children}
    </Box>
  );

  const renderCheckbox = (checkboxName: string, isChecked: boolean) => (
    <Box
      sx={{
        width: PANEL_CONFIG.elements.checkboxSize,
        height: PANEL_CONFIG.elements.checkboxSize,
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        bgcolor: isChecked ? `${theme.palette.primary.main}30` : 'transparent',
        '&:hover': {
          borderColor: theme.palette.primary.main
        }
      }}
      onClick={() => onToggleCheckbox(checkboxName)}
    >
      {isChecked && (
        <Box sx={{ 
          width: 8, 
          height: 4, 
          borderLeft: '2px solid white',
          borderBottom: '2px solid white',
          transform: 'rotate(-45deg)',
          mt: '-1px'
        }} />
      )}
    </Box>
  );

  const renderActionButton = (label: string, onClick: () => void, width: string = 'fit-content') => (
    <Box
      sx={{
        bgcolor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '4px',
        px: width === 'fit-content' ? 2 : 1.5,
        py: 0.3,
        cursor: 'pointer',
        fontSize: PANEL_CONFIG.typography.buttonFontSize,
        color: theme.palette.text.primary,
        fontWeight: 500,
        textAlign: 'center',
        width: width,
        minWidth: width === 'fit-content' ? PANEL_CONFIG.elements.buttonMinWidth : width,
        '&:hover': {
          bgcolor: theme.palette.action.selected,
          borderColor: theme.palette.primary.main
        }
      }}
      onClick={onClick}
    >
      {label}
    </Box>
  );

  const renderSection = (
    sectionId: string,
    title: string,
    children: React.ReactNode,
    hasLock: boolean = false,
    actionIcon?: React.ReactNode
  ) => (
    <Box sx={{ mb: PANEL_CONFIG.elements.sectionMarginBottom }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Box
          onClick={() => onToggleSection(sectionId)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            flex: 1,
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          {expandedSections[sectionId] ?
            <ExpandMoreIcon sx={{
              fontSize: PANEL_CONFIG.typography.iconSize,
              color: theme.palette.text.secondary,
              mr: 0.5
            }} /> :
            <ChevronRightIcon sx={{
              fontSize: PANEL_CONFIG.typography.iconSize,
              color: theme.palette.text.secondary,
              mr: 0.5
            }} />
          }
          <Typography sx={{
            color: theme.palette.text.primary,
            fontSize: PANEL_CONFIG.typography.sectionTitleFontSize,
            fontWeight: 500
          }}>
            {title}
          </Typography>
          {hasLock && (
            <LockIcon sx={{
              ml: 1,
              fontSize: '12px',
              color: theme.palette.text.secondary,
              cursor: 'help'
            }} />
          )}
        </Box>
        {actionIcon && (
          <Box sx={{ ml: 'auto' }}>
            {actionIcon}
          </Box>
        )}
      </Box>

      {expandedSections[sectionId] && (
        <Box sx={{
          ml: PANEL_CONFIG.elements.sectionContentMarginLeft,
          mt: PANEL_CONFIG.elements.sectionContentMarginTop
        }}>
          {children}
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        flexShrink: 0,
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        height: isPanelCollapsed ? PANEL_CONFIG.panel.headerHeight : PANEL_CONFIG.panel.height,
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out'
      }}
    >
      {/* Nagłówek panelu właściwości - klikalny do collapse/expand */}
      <Box
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 0.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          minHeight: PANEL_CONFIG.panel.headerHeight,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
          {isPanelCollapsed ? (
            <ChevronRightIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
          )}
          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontSize: PANEL_CONFIG.typography.headerFontSize,
              fontWeight: 500,
            }}
          >
            {selectedLayer
              ? `Właściwości ${selectedLayer.typ === 'grupa' ? 'grupy' : 'warstwy'}`
              : 'Właściwości projektu'
            }
          </Typography>
        </Box>
        {selectedLayer && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Zapobiega collapse przy kliknięciu Close
              onClosePanel();
            }}
            sx={{
              color: theme.palette.text.secondary,
              p: 0.5,
              '&:hover': { color: '#ff6b6b' }
            }}
          >
            <CloseIcon sx={{ fontSize: PANEL_CONFIG.typography.closeIconSize }} />
          </IconButton>
        )}
      </Box>

      {/* Zawartość panelu właściwości - scrollable */}
      <Box sx={{ flex: 1, p: `${PANEL_CONFIG.panel.contentPadding}px`, overflow: 'auto' }}>
        {selectedLayer ? (
        <>
          {/* WŁAŚCIWOŚCI GRUPY */}
            {selectedLayer.typ === 'grupa' ? (
              <>
                {renderSection('grupa-informacje-ogolne', 'Informacje ogólne', (
                  <>
                    {renderFieldBox(
                      <>
                        {renderLabel('Nazwa')}
                        {renderValue('MIEJSCOWE PLANY ZAGOSPODAROWANIA PRZESTRZENNEGO')}
                      </>
                    )}
                    
                    {renderFieldBox(
                      <>
                        {renderLabel('Grupa')}
                        {renderValue(selectedLayer?.id ? (findParentGroup(warstwy, selectedLayer.id)?.nazwa || 'Grupa główna') : 'Grupa główna')}
                      </>,
                      false
                    )}
                  </>
                ))}

                {renderSection('grupa-pobieranie', 'Pobieranie', (
                  renderActionButton('Grupa', () => console.log('Pobierz grupę'))
                ), true)}

                {renderSection('grupa-widocznosc', 'Widoczność', (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Domyślne wyświetlanie grupy
                      </Typography>
                      {renderCheckbox('grupaDomyslneWyswietlanie', checkboxStates.grupaDomyslneWyswietlanie)}
                    </Box>
                    {renderActionButton('Zapisz', () => console.log('Zapisz widoczność grupy'))}
                  </>
                ))}

                {renderSection('grupa-informacje-szczegolowe', 'Informacje szczegółowe', (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                      Legenda
                    </Typography>
                    {renderActionButton('Pokaż', () => console.log('Pokaż legendę grupy'))}
                  </Box>
                ))}
              </>
            ) : (
              <>
                {/* WŁAŚCIWOŚCI WARSTWY */}
                {renderSection('warstwa-informacje-ogolne', 'Informacje ogólne', (
                  <>
                    <Box sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary, mb: 0.5 }}>
                        Nazwa
                      </Typography>
                      <Typography sx={{
                        fontSize: '11px',
                        color: theme.palette.text.primary,
                        fontStyle: 'italic',
                        lineHeight: 1.3
                      }}>
                        {selectedLayer.nazwa}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary, mb: 0.5 }}>
                        Grupa
                      </Typography>
                      <Typography sx={{
                        fontSize: '11px',
                        color: theme.palette.text.primary,
                        fontStyle: 'italic'
                      }}>
                        {selectedLayer.id ? (findParentGroup(warstwy, selectedLayer.id)?.nazwa || 'Brak grupy nadrzędnej') : 'Brak grupy nadrzędnej'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary, mb: 0.5 }}>
                        Typ geometrii
                      </Typography>
                      <Typography sx={{
                        fontSize: '11px',
                        color: theme.palette.text.primary,
                        fontStyle: 'italic'
                      }}>
                        Multi-polygon
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Tabela atrybutów
                      </Typography>
                      {renderActionButton('Pokaż', () => console.log('Pokaż tabelę atrybutów warstwy'))}
                    </Box>
                  </>
                ))}

                {renderSection('warstwa-pobieranie', 'Pobieranie', (
                  renderActionButton('Warstwa', () => console.log('Pobierz warstwę'))
                ), true)}

                {renderSection('warstwa-widocznosc', 'Widoczność', (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Widoczność kolumn
                      </Typography>
                      {renderActionButton('Edytuj', () => console.log('Edytuj widoczność kolumn'), '60px')}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Domyślne wyświetlanie warstwy
                      </Typography>
                      {renderCheckbox('warstwaDomyslneWyswietlanie', checkboxStates.warstwaDomyslneWyswietlanie)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Widoczność od zadanej skali
                      </Typography>
                      {renderCheckbox('warstwaWidocznoscOdSkali', checkboxStates.warstwaWidocznoscOdSkali)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Widoczność w trybie opublikowanym
                      </Typography>
                      {renderCheckbox('warstwaWidocznoscTrybOpublikowany', checkboxStates.warstwaWidocznoscTrybOpublikowany)}
                    </Box>

                    {renderActionButton('Zapisz', () => console.log('Zapisz ustawienia widoczności warstwy'))}

                    {/* Przezroczystość warstwy ze sliderem */}
                    <Box sx={{ mb: 1, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                          Przezroczystość warstwy
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              bgcolor: theme.palette.action.hover,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: '4px',
                              px: 1,
                              py: 0.3,
                              fontSize: '10px',
                              color: theme.palette.text.primary,
                              minWidth: '30px',
                              textAlign: 'center'
                            }}
                          >
                            60
                          </Box>
                          <Typography sx={{ fontSize: '10px', color: theme.palette.text.primary }}>
                            %
                          </Typography>
                        </Box>
                      </Box>

                      {/* Slider */}
                      <Box sx={{ position: 'relative', height: '6px', bgcolor: theme.palette.action.hover, borderRadius: '3px' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '60%',
                            height: '100%',
                            bgcolor: theme.palette.primary.main,
                            borderRadius: '3px'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '60%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 14,
                            height: 14,
                            bgcolor: theme.palette.background.paper,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: `2px solid ${theme.palette.primary.main}`,
                            '&:hover': {
                              bgcolor: theme.palette.primary.main
                            }
                          }}
                          onClick={() => console.log('Zmień przezroczystość warstwy')}
                        />
                      </Box>
                    </Box>
                  </>
                ))}

                {renderSection('warstwa-informacje-szczegolowe', 'Informacje szczegółowe', (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                      Legenda
                    </Typography>
                    {renderActionButton('Pokaż', () => console.log('Pokaż legendę warstwy'))}
                  </Box>
                ))}

                {renderSection('warstwa-styl-warstwy', 'Styl warstwy', (
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.8, flexWrap: 'wrap' }}>
                    {renderActionButton('Edytuj', () => {
                      console.log('🎨 Opening Edit Layer Style Modal');
                      onEditLayerStyle();
                    }, '60px')}
                    {renderActionButton('Zarządzaj', onManageLayer, '70px')}
                    {renderActionButton('Etykietowanie', onLayerLabeling, '90px')}
                  </Box>
                ), true)}
              </>
            )}
          </>
        ) : (
          <>
            {/* WŁAŚCIWOŚCI PROJEKTU */}
            {renderSection(
              'uslugi',
              'Usługi',
              (
                <>
                  {wmsUrl || wfsUrl ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      {wmsUrl && (
                        <Box
                          sx={{
                            bgcolor: 'rgba(76, 175, 80, 0.2)',
                            border: '1px solid rgba(76, 175, 80, 0.4)',
                            borderRadius: '4px',
                            px: 1.5,
                            py: 0.5,
                            cursor: 'pointer',
                            fontSize: '10px',
                            color: '#66bb6a',
                            fontWeight: 500,
                            '&:hover': {
                              bgcolor: 'rgba(76, 175, 80, 0.3)',
                            }
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(wmsUrl);
                            console.log('✅ WMS URL copied:', wmsUrl);
                            dispatch(showSuccess('Skopiowano WMS URL do schowka', 3000));
                          }}
                        >
                          WMS
                        </Box>
                      )}
                      {wfsUrl && (
                        <Box
                          sx={{
                            bgcolor: 'rgba(33, 150, 243, 0.2)',
                            border: '1px solid rgba(33, 150, 243, 0.4)',
                            borderRadius: '4px',
                            px: 1.5,
                            py: 0.5,
                            cursor: 'pointer',
                            fontSize: '10px',
                            color: '#42a5f5',
                            fontWeight: 500,
                            '&:hover': {
                              bgcolor: 'rgba(33, 150, 243, 0.3)',
                            }
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(wfsUrl);
                            console.log('✅ WFS URL copied:', wfsUrl);
                            dispatch(showSuccess('Skopiowano WFS URL do schowka', 3000));
                          }}
                        >
                          WFS
                        </Box>
                      )}
                      <Box
                        sx={{
                          bgcolor: 'rgba(255, 152, 0, 0.2)',
                          border: '1px solid rgba(255, 152, 0, 0.4)',
                          borderRadius: '4px',
                          px: 1.5,
                          py: 0.5,
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: '#ffa726',
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: 'rgba(255, 152, 0, 0.3)',
                          }
                        }}
                        onClick={() => console.log('CSW clicked')}
                      >
                        CSW
                      </Box>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary, mb: 1, fontStyle: 'italic' }}>
                      Brak udostępnionych usług
                    </Typography>
                  )}
                </>
              ),
              false,
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setPublishModalOpen(true);
                }}
                sx={{
                  color: theme.palette.text.secondary,
                  p: 0.5,
                  '&:hover': { color: theme.palette.primary.main }
                }}
              >
                <SettingsIcon sx={{ fontSize: '14px' }} />
              </IconButton>
            )}

            {renderSection('pobieranie', 'Pobieranie', (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(79, 195, 247, 0.2)',
                    border: '1px solid rgba(79, 195, 247, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#4fc3f7',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(79, 195, 247, 0.3)',
                    }
                  }}
                  onClick={() => console.log('QGS/QGZ clicked')}
                >
                  QGS/QGZ
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(79, 195, 247, 0.2)',
                    border: '1px solid rgba(79, 195, 247, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#4fc3f7',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(79, 195, 247, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Zbiór APP clicked')}
                >
                  Zbiór APP
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(79, 195, 247, 0.2)',
                    border: '1px solid rgba(79, 195, 247, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#4fc3f7',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(79, 195, 247, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Metadane clicked')}
                >
                  Metadane
                </Box>
              </Box>
            ))}

            {renderSection('metadane', 'Metadane', (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(156, 39, 176, 0.2)',
                    border: '1px solid rgba(156, 39, 176, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#ab47bc',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(156, 39, 176, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Wyświetl clicked')}
                >
                  Wyświetl
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(63, 81, 181, 0.2)',
                    border: '1px solid rgba(63, 81, 181, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#5c6bc0',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(63, 81, 181, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Wyszukaj clicked')}
                >
                  Wyszukaj
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#66bb6a',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(76, 175, 80, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Stwórz clicked')}
                >
                  Stwórz
                </Box>
              </Box>
            ))}

            {renderSection('inne-projekty', 'Inne projekty użytkownika', (
              <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                Brak innych projektów
              </Typography>
            ))}
          </>
        )}
      </Box>

      {/* Mapa podkładowa - ZAWSZE widoczna (nawet gdy panel collapsed) */}
      <BasemapSelector />

      {/* WMS/WFS Publication Modal */}
      <PublishServicesModal
        open={publishModalOpen}
        projectName={projectName}
        layers={warstwy}
        onClose={() => setPublishModalOpen(false)}
        onPublish={handlePublish}
        isLoading={isPublishing}
      />
    </Box>
  );
};
