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
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import PaletteIcon from '@mui/icons-material/Palette';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import { BasemapSelector } from './BasemapSelector';
import { PublishServicesModal } from '../modals/PublishServicesModal';
import { PublishLayersModal } from '../modals/PublishLayersModal';
import DownloadProjectModal from '../modals/DownloadProjectModal';
import { LayerInfoModal } from '../modals/LayerInfoModal';
import { BasemapSelectorModal } from '../modals/BasemapSelectorModal';
import { ProjectPropertiesModal } from '../modals/ProjectPropertiesModal';
import { usePropertyModals } from '../hooks/usePropertyModals';
import { usePropertyOperations } from '../hooks/usePropertyOperations';
import { showSuccess } from '@/redux/slices/notificationSlice';

// Panel configuration constants
const PANEL_CONFIG = {
  panel: {
    height: '260px',
    headerHeight: '40px',
    contentPadding: '0px',
  },
  typography: {
    headerFontSize: '15px',
    iconSize: '14px',
    closeIconSize: '14px',
  },
};

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
  onDeleteLayer: () => void;
  findParentGroup: (layers: Warstwa[], childId: string) => Warstwa | null;
  projectName?: string;
  wmsUrl?: string;
  wfsUrl?: string;
  onRefetchProject?: () => void; // Callback to refetch project data after layer changes
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
  onDeleteLayer,
  findParentGroup,
  projectName = '',
  wmsUrl = '',
  wfsUrl = '',
  onRefetchProject
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Modals state
  const [layerInfoModalOpen, setLayerInfoModalOpen] = React.useState(false);
  const [basemapModalOpen, setBasemapModalOpen] = React.useState(false);
  const [projectPropertiesModalOpen, setProjectPropertiesModalOpen] = React.useState(false);

  // Modal state management
  const { modals, openModal, closeModal } = usePropertyModals();

  // Backend operations
  const { handleDownload, handlePublish, handleUnpublish, isExporting, isPublishing, isUnpublishing } = usePropertyOperations(projectName, warstwy);

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
      closeModal('publishLayers');
    }
  };

  // Wrapper for handleUnpublish to close modal after operation
  const handleUnpublishWithModal = async () => {
    const success = await handleUnpublish();
    if (success) {
      closeModal('publishLayers');
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
      }}
    >
      {/* NAGŁÓWKI-PRZYCISKI DLA WARSTWY/GRUPY */}
      {selectedLayer && (
        <>
          {selectedLayer.typ === 'grupa' ? (
            // GRUPA - 1 nagłówek-przycisk
            <Box
              onClick={() => setLayerInfoModalOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 0.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.default,
                minHeight: PANEL_CONFIG.panel.headerHeight,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                <InfoIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
                <Typography
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: PANEL_CONFIG.typography.headerFontSize,
                    fontWeight: 500,
                  }}
                >
                  Informacje szczegółowe
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
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
            </Box>
          ) : (
            // WARSTWA - 3 nagłówki-przyciski
            <>
              <Box
                onClick={() => setLayerInfoModalOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 0.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.default,
                  minHeight: PANEL_CONFIG.panel.headerHeight,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                  <InfoIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
                  <Typography
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: PANEL_CONFIG.typography.headerFontSize,
                      fontWeight: 500,
                    }}
                  >
                    Informacje szczegółowe
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
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
              </Box>

              <Box
                onClick={() => {
                  console.log('🎨 Opening Edit Layer Style Modal');
                  onEditLayerStyle();
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 0.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.default,
                  minHeight: PANEL_CONFIG.panel.headerHeight,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                  <PaletteIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
                  <Typography
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: PANEL_CONFIG.typography.headerFontSize,
                      fontWeight: 500,
                    }}
                  >
                    Styl warstwy
                  </Typography>
                  <LockIcon sx={{ fontSize: '12px', ml: 0.5, color: theme.palette.text.secondary }} />
                </Box>
              </Box>
            </>
          )}
        </>
      )}

      {/* NAGŁÓWEK-PRZYCISK DLA PROJEKTU (gdy nic nie wybrane) */}
      {!selectedLayer && (
        <Box
          onClick={() => setProjectPropertiesModalOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 0.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.default,
            minHeight: PANEL_CONFIG.panel.headerHeight,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <SettingsIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
            <Typography
              sx={{
                color: theme.palette.text.primary,
                fontSize: PANEL_CONFIG.typography.headerFontSize,
                fontWeight: 500,
              }}
            >
              Właściwości projektu
            </Typography>
          </Box>
        </Box>
      )}

      {/* Mapa podkładowa - Nagłówek-przycisk (jak "Właściwości projektu") */}
      <Box
        onClick={() => setBasemapModalOpen(true)}
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 0.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          minHeight: PANEL_CONFIG.panel.headerHeight,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
          <MapIcon sx={{ fontSize: PANEL_CONFIG.typography.iconSize, color: theme.palette.text.secondary }} />
          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontSize: PANEL_CONFIG.typography.headerFontSize,
              fontWeight: 500,
            }}
          >
            Mapa podkładowa
          </Typography>
        </Box>
      </Box>

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

      {/* Layer Info Modal */}
      <LayerInfoModal
        open={layerInfoModalOpen}
        onClose={() => setLayerInfoModalOpen(false)}
        layer={selectedLayer}
        onSave={onRefetchProject}
      />

      {/* Basemap Selector Modal */}
      <BasemapSelectorModal
        open={basemapModalOpen}
        onClose={() => setBasemapModalOpen(false)}
      />

      {/* Project Properties Modal */}
      <ProjectPropertiesModal
        open={projectPropertiesModalOpen}
        onClose={() => setProjectPropertiesModalOpen(false)}
        projectName={projectName}
        wmsUrl={wmsUrl}
        wfsUrl={wfsUrl}
        layers={warstwy}
        onOpenPublishModal={() => openModal('publishLayers')}
      />

      {/* Publish Layers Modal (NEW) - For WMS/WFS publication with custom positioning */}
      <PublishLayersModal
        open={modals.publishLayers}
        projectName={projectName}
        layers={warstwy}
        onClose={() => closeModal('publishLayers')}
        onPublish={handlePublishWithModal}
        onUnpublish={handleUnpublishWithModal}
        isLoading={isPublishing || isUnpublishing}
      />
    </Box>
  );
};
