/**
 * PROJECT PROPERTIES MODAL - Modal z właściwościami projektu
 *
 * Funkcjonalności:
 * - Pobieranie: QGS/QGZ, Zbiór APP, Metadane (placeholder)
 * - Metadane: Ustaw metadata_id, Wyświetl (placeholder), Wyszukaj (GeoNetwork), Stwórz (GeoNetwork)
 * - Usługi: WMS/WFS (copy to clipboard), CSW (placeholder)
 * - Inne projekty użytkownika: Lista wszystkich projektów
 * - Udostępnianie: Otwiera PublishLayersModal
 */
'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import { useDispatch } from 'react-redux';
import { showSuccess, showInfo, showError } from '@/redux/slices/notificationSlice';
import {
  useExportProjectMutation,
  useDownloadAppSetMutation,
  useSetMetadataMutation,
  useGetProjectsQuery,
} from '@/backend/projects';
import { LayerNode } from '@/types-app/layers';

interface ProjectPropertiesModalProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  wmsUrl?: string;
  wfsUrl?: string;
  layers?: LayerNode[];
  onOpenPublishModal?: () => void; // Callback to open PublishLayersModal
}

export const ProjectPropertiesModal: React.FC<ProjectPropertiesModalProps> = ({
  open,
  onClose,
  projectName = 'Projekt',
  wmsUrl = '',
  wfsUrl = '',
  layers = [],
  onOpenPublishModal,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [metadataId, setMetadataId] = useState('');

  // RTK Query hooks
  const [exportProject, { isLoading: isExporting }] = useExportProjectMutation();
  const [downloadAppSet, { isLoading: isDownloadingApp }] = useDownloadAppSetMutation();
  const [setMetadata, { isLoading: isSettingMetadata }] = useSetMetadataMutation();
  const { data: projectsData } = useGetProjectsQuery();

  // ========== SEKCJA 1: POBIERANIE ==========

  const handleDownloadQGS = async () => {
    try {
      dispatch(showInfo('Pobieranie QGS...'));
      await exportProject({ project: projectName, project_type: 'qgs' }).unwrap();
      dispatch(showSuccess(`Pobrano ${projectName}.qgs`));
    } catch (error: any) {
      dispatch(showError(`Błąd pobierania QGS: ${error?.data?.message || error.message}`));
    }
  };

  const handleDownloadQGZ = async () => {
    try {
      dispatch(showInfo('Pobieranie QGZ...'));
      await exportProject({ project: projectName, project_type: 'qgz' }).unwrap();
      dispatch(showSuccess(`Pobrano ${projectName}.qgz`));
    } catch (error: any) {
      dispatch(showError(`Błąd pobierania QGZ: ${error?.data?.message || error.message}`));
    }
  };

  const handleDownloadAppSet = async () => {
    try {
      dispatch(showInfo('Pobieranie zbioru APP...'));
      await downloadAppSet({ project: projectName }).unwrap();
      dispatch(showSuccess(`Pobrano ${projectName}_app.gml`));
    } catch (error: any) {
      dispatch(showError(`Błąd pobierania APP: ${error?.data?.message || error.message}`));
    }
  };

  const handleDownloadMetadata = () => {
    dispatch(showInfo('Funkcja "Pobierz metadane" będzie dostępna wkrótce'));
  };

  // ========== SEKCJA 2: METADANE ==========

  const handleSetMetadata = async () => {
    if (!metadataId.trim()) {
      dispatch(showError('Wprowadź metadata ID (UUID)'));
      return;
    }

    try {
      await setMetadata({
        project: projectName,
        metadata_id: metadataId,
      }).unwrap();
      dispatch(showSuccess('Przypisano metadane do projektu'));
      setMetadataId('');
    } catch (error: any) {
      dispatch(showError(`Błąd ustawiania metadanych: ${error?.data?.message || error.message}`));
    }
  };

  const handleViewMetadata = () => {
    dispatch(showInfo('Funkcja "Wyświetl metadane" będzie dostępna wkrótce'));
  };

  const handleSearchMetadata = () => {
    // ZMIEŃ NA WŁAŚCIWY URL GEONETWORK
    const geonetworkUrl = 'https://geonetwork.universemapmaker.online';
    window.open(
      `${geonetworkUrl}/srv/eng/catalog.search#/search?title=${encodeURIComponent(projectName)}`,
      '_blank'
    );
    dispatch(showInfo('Otwarto katalog GeoNetwork'));
  };

  const handleCreateMetadata = () => {
    // ZMIEŃ NA WŁAŚCIWY URL GEONETWORK
    const geonetworkUrl = 'https://geonetwork.universemapmaker.online';
    window.open(`${geonetworkUrl}/srv/eng/catalog.edit#/create`, '_blank');
    dispatch(showInfo('Otwarto formularz tworzenia metadanych'));
  };

  // ========== SEKCJA 3: USŁUGI ==========

  const handleCopyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    dispatch(showSuccess(`Skopiowano ${type} URL do schowka`));
  };

  const handlePublishCSW = () => {
    dispatch(showInfo('Funkcja "Publikuj CSW" będzie dostępna po dodaniu integracji z GeoNetwork'));
  };

  // ========== SEKCJA 4: INNE ==========

  const handleOpenPublish = () => {
    onClose(); // Close properties modal first
    if (onOpenPublishModal) {
      onOpenPublishModal();
    }
  };

  const handleNavigateToProject = (projectName: string) => {
    window.location.href = `/map?project=${projectName}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: theme.palette.modal.header,
          color: theme.palette.modal.headerText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '16px',
          fontWeight: 600,
          m: 0,
        }}
      >
        Właściwości projektu - {projectName}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.modal.headerText,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: theme.palette.modal.content,
          px: 2,
          py: 2,
        }}
      >
        {/* SEKCJA 1: POBIERANIE */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DownloadIcon sx={{ fontSize: '20px', color: theme.palette.primary.main }} />
              <Typography sx={{ fontWeight: 600 }}>Pobieranie</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={handleDownloadQGS}
                disabled={isExporting}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Pobierz QGS
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={handleDownloadQGZ}
                disabled={isExporting}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Pobierz QGZ
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAppSet}
                disabled={isDownloadingApp}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Pobierz zbiór APP (GML)
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={handleDownloadMetadata}
                disabled
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Pobierz metadane (wkrótce)
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SEKCJA 2: METADANE */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ fontSize: '20px', color: theme.palette.primary.main }} />
              <Typography sx={{ fontWeight: 600 }}>Metadane</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Ustaw metadata_id */}
              <Box>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', color: theme.palette.text.secondary }}>
                  Przypisz ID metadanych do projektu:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Metadata ID (UUID)"
                    value={metadataId}
                    onChange={(e) => setMetadataId(e.target.value)}
                    placeholder="123e4567-e89b-12d3-a456-426614174000"
                  />
                  <Button
                    variant="contained"
                    onClick={handleSetMetadata}
                    disabled={isSettingMetadata || !metadataId.trim()}
                    sx={{ textTransform: 'none', minWidth: '80px' }}
                  >
                    Ustaw
                  </Button>
                </Box>
              </Box>

              <Divider />

              {/* Pozostałe opcje */}
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handleViewMetadata}
                disabled
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Wyświetl metadane (wkrótce)
              </Button>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleSearchMetadata}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Wyszukaj w katalogu GeoNetwork
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateMetadata}
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Stwórz nowe metadane
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SEKCJA 3: USŁUGI */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublicIcon sx={{ fontSize: '20px', color: theme.palette.primary.main }} />
              <Typography sx={{ fontWeight: 600 }}>Usługi sieciowe</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* WMS URL */}
              {wmsUrl && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#4caf50', display: 'block', mb: 0.5 }}>
                    WMS URL:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={wmsUrl}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { fontSize: '12px' } }}
                    />
                    <IconButton onClick={() => handleCopyUrl(wmsUrl, 'WMS')} size="small">
                      <ContentCopyIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {/* WFS URL */}
              {wfsUrl && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#2196f3', display: 'block', mb: 0.5 }}>
                    WFS URL:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={wfsUrl}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input': { fontSize: '12px' } }}
                    />
                    <IconButton onClick={() => handleCopyUrl(wfsUrl, 'WFS')} size="small">
                      <ContentCopyIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {/* Brak usług */}
              {!wmsUrl && !wfsUrl && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '13px' }}>
                  Brak udostępnionych usług. Użyj przycisku "Udostępnianie" poniżej.
                </Typography>
              )}

              {/* CSW - placeholder */}
              <Button
                variant="outlined"
                onClick={handlePublishCSW}
                disabled
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Publikuj CSW (wkrótce)
              </Button>

              <Divider />

              {/* Przycisk Udostępnianie */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<ShareIcon />}
                onClick={handleOpenPublish}
                sx={{
                  bgcolor: '#2196f3',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.2,
                  '&:hover': { bgcolor: '#1976d2' }
                }}
              >
                Udostępnianie warstw
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SEKCJA 4: INNE PROJEKTY */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ fontSize: '20px', color: theme.palette.primary.main }} />
              <Typography sx={{ fontWeight: 600 }}>Inne projekty użytkownika</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List sx={{ maxHeight: '250px', overflow: 'auto', p: 0 }}>
              {projectsData?.list_of_projects && projectsData.list_of_projects.length > 0 ? (
                projectsData.list_of_projects.map((project) => (
                  <ListItem key={project.project_name} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigateToProject(project.project_name)}
                      sx={{
                        py: 1,
                        px: 2,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                              {project.project_name}
                            </Typography>
                            <Chip
                              label={project.published ? 'Publiczny' : 'Prywatny'}
                              size="small"
                              icon={project.published ? <PublicIcon /> : <LockIcon />}
                              sx={{
                                height: '20px',
                                fontSize: '11px',
                                bgcolor: project.published ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                                color: project.published ? '#4caf50' : '#9e9e9e',
                              }}
                            />
                          </Box>
                        }
                        secondary={project.projectDescription || 'Brak opisu'}
                        secondaryTypographyProps={{ sx: { fontSize: '12px', color: 'text.secondary' } }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Brak innych projektów
                </Typography>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: theme.palette.modal.content,
          px: 3,
          pb: 3,
          pt: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: theme.palette.modal.border,
            color: theme.palette.text.primary,
            textTransform: 'none',
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
};
