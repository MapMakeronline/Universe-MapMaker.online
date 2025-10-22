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
import SettingsIcon from '@mui/icons-material/Settings';
import { BasemapSelector } from './BasemapSelector';
import { PublishServicesModal } from '../modals/PublishServicesModal';
import DownloadProjectModal from '../modals/DownloadProjectModal';
import {
  PANEL_CONFIG,
  renderLabel,
  renderValue,
  renderFieldBox,
  renderCheckbox,
  renderActionButton,
  renderSection
} from './PropertiesPanelHelpers';
import { usePropertyModals } from '../hooks/usePropertyModals';
import { usePropertyOperations } from '../hooks/usePropertyOperations';
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
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(true); // Domyślnie zwinięty

  // Modal state management
  const { modals, openModal, closeModal } = usePropertyModals();

  // Backend operations
  const { handleDownload, handlePublish, isExporting, isPublishing } = usePropertyOperations(projectName, warstwy);

  // Wrapper functions with theme pre-applied
  const label = (text: string) => renderLabel(text, theme);
  const value = (text: string, italic?: boolean) => renderValue(text, theme, italic);
  const checkbox = (name: string, checked: boolean) => renderCheckbox(name, checked, theme, onToggleCheckbox);
  const button = (label: string, onClick: () => void, width?: string) => renderActionButton(label, onClick, theme, width);
  const section = (id: string, title: string, children: React.ReactNode, hasLock?: boolean, actionIcon?: React.ReactNode) =>
    renderSection({ sectionId: id, title, children, theme, expandedSections, onToggleSection, hasLock, actionIcon });

  // Wrapper for handleDownload to close modal after operation
  const handleDownloadWithModal = async (format: 'qgs' | 'qgz') => {
    const success = await handleDownload(format);
    if (success || !success) { // Close modal regardless of success
      closeModal('download');
    }
  };

  // Wrapper for handlePublish to close modal after operation
  const handlePublishWithModal = async (selectedLayerIds: string[]) => {
    const success = await handlePublish(selectedLayerIds);
    if (success) {
      closeModal('publish');
    }
  };

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
                {section('grupa-informacje-ogolne', 'Informacje ogólne', (
                  <>
                    {renderFieldBox(
                      <>
                        {label('Nazwa')}
                        {value('MIEJSCOWE PLANY ZAGOSPODAROWANIA PRZESTRZENNEGO')}
                      </>
                    )}

                    {renderFieldBox(
                      <>
                        {label('Grupa')}
                        {value(selectedLayer?.id ? (findParentGroup(warstwy, selectedLayer.id)?.nazwa || 'Grupa główna') : 'Grupa główna')}
                      </>,
                      false
                    )}
                  </>
                ))}

                {section('grupa-pobieranie', 'Pobieranie', (
                  button('Grupa', () => console.log('Pobierz grupę'))
                ), true)}

                {section('grupa-widocznosc', 'Widoczność', (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Domyślne wyświetlanie grupy
                      </Typography>
                      {checkbox('grupaDomyslneWyswietlanie', checkboxStates.grupaDomyslneWyswietlanie)}
                    </Box>
                    {button('Zapisz', () => console.log('Zapisz widoczność grupy'))}
                  </>
                ))}

                {section('grupa-informacje-szczegolowe', 'Informacje szczegółowe', (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                      Legenda
                    </Typography>
                    {button('Pokaż', () => console.log('Pokaż legendę grupy'))}
                  </Box>
                ))}
              </>
            ) : (
              <>
                {/* WŁAŚCIWOŚCI WARSTWY */}
                {section('warstwa-informacje-ogolne', 'Informacje ogólne', (
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
                      {button('Pokaż', () => console.log('Pokaż tabelę atrybutów warstwy'))}
                    </Box>
                  </>
                ))}

                {section('warstwa-pobieranie', 'Pobieranie', (
                  button('Warstwa', () => console.log('Pobierz warstwę'))
                ), true)}

                {section('warstwa-widocznosc', 'Widoczność', (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Widoczność kolumn
                      </Typography>
                      {button('Edytuj', () => console.log('Edytuj widoczność kolumn'), '60px')}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Domyślne wyświetlanie warstwy
                      </Typography>
                      {checkbox('warstwaDomyslneWyswietlanie', checkboxStates.warstwaDomyslneWyswietlanie)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Widoczność od zadanej skali
                      </Typography>
                      {checkbox('warstwaWidocznoscOdSkali', checkboxStates.warstwaWidocznoscOdSkali)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                        Widoczność w trybie opublikowanym
                      </Typography>
                      {checkbox('warstwaWidocznoscTrybOpublikowany', checkboxStates.warstwaWidocznoscTrybOpublikowany)}
                    </Box>

                    {button('Zapisz', () => console.log('Zapisz ustawienia widoczności warstwy'))}

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

                {section('warstwa-informacje-szczegolowe', 'Informacje szczegółowe', (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                      Legenda
                    </Typography>
                    {button('Pokaż', () => console.log('Pokaż legendę warstwy'))}
                  </Box>
                ))}

                {section('warstwa-styl-warstwy', 'Styl warstwy', (
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.8, flexWrap: 'wrap' }}>
                    {button('Edytuj', () => {
                      console.log('🎨 Opening Edit Layer Style Modal');
                      onEditLayerStyle();
                    }, '60px')}
                    {button('Zarządzaj', onManageLayer, '70px')}
                    {button('Etykietowanie', onLayerLabeling, '90px')}
                  </Box>
                ), true)}
              </>
            )}
          </>
        ) : (
          <>
            {/* WŁAŚCIWOŚCI PROJEKTU */}
            {section(
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
                  openModal('publish');
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

            {section('pobieranie', 'Pobieranie', (
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
                  onClick={() => openModal('download')}
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

            {section('metadane', 'Metadane', (
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

            {section('inne-projekty', 'Inne projekty użytkownika', (
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
        open={modals.publish}
        projectName={projectName}
        layers={warstwy}
        onClose={() => closeModal('publish')}
        onPublish={handlePublishWithModal}
        isLoading={isPublishing}
      />

      {/* Download Project Modal */}
      <DownloadProjectModal
        open={modals.download}
        onClose={() => closeModal('download')}
        onDownload={handleDownloadWithModal}
        isLoading={isExporting}
      />
    </Box>
  );
};
