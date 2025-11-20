"use client"

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DrawIcon from '@mui/icons-material/Draw';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { MapRef } from 'react-map-gl';
import { useFileImport, validateTrailFile } from '../hooks/useFileImport';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActiveTrail, clearActiveTrail, selectActiveTrail } from '@/redux/slices/trailsSlice';
import type { Trail } from '../types';
import { TrailNotification } from './TrailNotification';

interface TrailsModalProps {
  open: boolean;
  onClose: () => void;
  mapRef: React.RefObject<MapRef>;
  projectName?: string;
}

const TrailsModal: React.FC<TrailsModalProps> = ({
  open,
  onClose,
  mapRef,
  projectName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const activeTrail = useAppSelector(selectActiveTrail);
  const { importFile, isLoading, error, result } = useFileImport();

  // Notification states
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showDeleteNotification, setShowDeleteNotification] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    trailName: string;
    distance: number;
    duration: number;
    warnings: string[];
  } | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file before import
    const validationError = validateTrailFile(file);
    if (validationError) {
      alert(`❌ ${validationError}`);
      return;
    }

    try {
      // Import file using hook
      const parsed = await importFile(file);

      if (!parsed) {
        // Error already handled by hook
        return;
      }

      if (parsed.errors.length > 0) {
        alert(`❌ Błąd importu:\n\n${parsed.errors.join('\n')}`);
        return;
      }

      if (parsed.trails.length === 0) {
        alert('❌ Nie znaleziono żadnych tras w pliku');
        return;
      }

      // Create Trail object
      const trail: Trail = {
        id: Date.now().toString(),
        feature: parsed.trails[0], // First trail
        metadata: {
          createdAt: new Date().toISOString(), // ISO string for Redux serialization
          source: 'upload',
          fileName: file.name,
          fileType: file.name.split('.').pop() as 'kml' | 'geojson',
        },
      };

      // Save to Redux (and localStorage via middleware)
      dispatch(setActiveTrail(trail));

      // Prepare notification data
      setNotificationData({
        trailName: trail.feature.properties.name,
        distance: trail.feature.properties.distance!,
        duration: trail.feature.properties.duration!,
        warnings: parsed.warnings,
      });

      // Close modal first
      onClose();

      // Show success notification
      setShowSuccessNotification(true);
    } catch (error: any) {
      console.error('❌ File import error:', error);
      alert(`❌ Błąd podczas importu pliku:\n\n${error.message}`);
    } finally {
      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrawManually = () => {
    console.log('✏️ Draw trail manually clicked');
    alert('✏️ Ręczne rysowanie tras zostanie dodane w FAZIE 5!\n\nNa razie użyj opcji importu pliku.');
    // TODO (FAZA 5): Enable Mapbox drawing mode
    // onClose(); // Zostaw modal otwarty dopóki nie ma funkcjonalności
  };

  const handleRemoveTrail = () => {
    if (activeTrail) {
      // Save trail data for confirm dialog
      setNotificationData({
        trailName: activeTrail.feature.properties.name,
        distance: activeTrail.feature.properties.distance || 0,
        duration: activeTrail.feature.properties.duration || 0,
        warnings: [],
      });

      // Show confirmation dialog
      setShowConfirmDeleteDialog(true);
    }
  };

  const handleConfirmDelete = () => {
    // User confirmed deletion
    setShowConfirmDeleteDialog(false);
    dispatch(clearActiveTrail());
    onClose();

    // Show delete notification
    setShowDeleteNotification(true);
  };

  const handleCancelDelete = () => {
    // User canceled deletion
    setShowConfirmDeleteDialog(false);
    setNotificationData(null);
  };

  // Handle success notification close
  const handleSuccessNotificationClose = () => {
    setShowSuccessNotification(false);
    setNotificationData(null); // Clean up data
  };

  // Handle delete notification close
  const handleDeleteNotificationClose = () => {
    setShowDeleteNotification(false);
    setNotificationData(null); // Clean up data
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Trasy turystyczne
        </Typography>
        <Button
          onClick={onClose}
          size="small"
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ py: 2 }}>
          {/* Aktualna trasa - pokaż jeśli jest załadowana */}
          {activeTrail && (
            <Box
              sx={{
                border: 2,
                borderColor: 'success.main',
                borderRadius: 2,
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'success.dark' : 'success.light',
              }}
            >
              <Stack spacing={1}>
                <Typography variant="h6" color="success.dark">
                  ✅ Aktywna trasa: {activeTrail.feature.properties.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📏 Długość: {(activeTrail.feature.properties.distance! / 1000).toFixed(2)} km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ⏱️ Czas: {activeTrail.feature.properties.duration} min
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  📁 Źródło: {activeTrail.metadata.fileName}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleRemoveTrail}
                  sx={{ mt: 1 }}
                >
                  🗑️ Usuń trasę
                </Button>
              </Stack>
            </Box>
          )}

          {/* Opis */}
          <Typography variant="body2" color="text.secondary">
            {activeTrail ? 'Możesz dodać nową trasę (poprzednia zostanie zastąpiona):' : 'Wybierz sposób dodania trasy do mapy:'}
          </Typography>

          {/* Opcja A: Import pliku */}
          <Box
            sx={{
              border: 2,
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 3,
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'scale(1.02)',
              },
            }}
            onClick={!isLoading ? handleImportClick : undefined}
          >
            <Stack spacing={2} alignItems="center">
              <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Typography variant="h6" align="center">
                Importuj plik z trasą
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Wgraj plik KML lub GeoJSON z Google My Maps, Garmin, Strava lub innych aplikacji.
              </Typography>
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
                disabled={isLoading}
              >
                {isLoading ? 'Wczytywanie...' : 'Wybierz plik'}
              </Button>
              <Typography variant="caption" color="text.disabled">
                Obsługiwane formaty: .kml, .geojson, .json
              </Typography>
            </Stack>
          </Box>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,.geojson,.json,application/vnd.google-earth.kml+xml,application/geo+json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Separator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
            <Typography variant="body2" color="text.secondary">
              lub
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          </Box>

          {/* Opcja B: Rysuj ręcznie */}
          <Box
            sx={{
              border: 2,
              borderColor: 'grey.300',
              borderRadius: 2,
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main',
                transform: 'scale(1.02)',
              },
            }}
            onClick={handleDrawManually}
          >
            <Stack spacing={2} alignItems="center">
              <DrawIcon sx={{ fontSize: 48, color: 'grey.600' }} />
              <Typography variant="h6" align="center">
                Narysuj trasę ręcznie
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Kliknij punkty na mapie, aby stworzyć własną trasę turystyczną.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DrawIcon />}
                onClick={handleDrawManually}
              >
                Rozpocznij rysowanie
              </Button>
              <Typography variant="caption" color="text.disabled">
                Dostępne wkrótce (FAZA 5)
              </Typography>
            </Stack>
          </Box>

          {/* Error message */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>

    {/* Confirmation dialog for deletion */}
    {showConfirmDeleteDialog && notificationData && (
      <Dialog
        open={showConfirmDeleteDialog}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundImage: 'none',
          }
        }}
      >
        <DialogContent sx={{ py: 4, px: 4, backgroundColor: '#4A5568', color: 'white' }}>
          <Stack spacing={2} alignItems="center">
            <DeleteIcon sx={{ fontSize: 64, color: 'white' }} />
            <Typography variant="h5" align="center" fontWeight="bold">
              Potwierdź usunięcie trasy
            </Typography>
            <Typography variant="body1" align="center" sx={{ fontSize: '1.1rem' }}>
              Czy na pewno chcesz usunąć trasę <strong>"{notificationData.trailName}"</strong>?
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Trasa zostanie usunięta z mapy.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 3, justifyContent: 'center', backgroundColor: 'rgb(247, 249, 252)' }}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            size="large"
            sx={{
              borderColor: '#4A5568',
              color: '#4A5568',
              fontWeight: 'bold',
              minWidth: 120,
              '&:hover': {
                borderColor: '#4A5568',
                bgcolor: 'rgba(74, 85, 104, 0.1)',
              }
            }}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'rgb(211, 47, 47)',
              color: 'white',
              fontWeight: 'bold',
              minWidth: 120,
              '&:hover': {
                bgcolor: 'rgb(183, 28, 28)',
              }
            }}
          >
            Usuń
          </Button>
        </DialogActions>
      </Dialog>
    )}

    {notificationData && (
      <>
        <TrailNotification
          open={showSuccessNotification}
          onClose={handleSuccessNotificationClose}
          trailName={notificationData.trailName}
          distance={notificationData.distance}
          duration={notificationData.duration}
          warnings={notificationData.warnings}
          showRefreshMessage={false}
          showDeleteMessage={false}
        />

        <TrailNotification
          open={showDeleteNotification}
          onClose={handleDeleteNotificationClose}
          trailName={notificationData.trailName}
          distance={notificationData.distance}
          duration={notificationData.duration}
          warnings={[]}
          showRefreshMessage={false}
          showDeleteMessage={true}
        />
      </>
    )}
  </>
  );
};

export default TrailsModal;
