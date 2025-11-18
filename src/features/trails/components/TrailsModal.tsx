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
import { MapRef } from 'react-map-gl';
import { useFileImport, validateTrailFile } from '../hooks/useFileImport';
import { useAppDispatch } from '@/redux/hooks';
import { setActiveTrail } from '@/redux/slices/trailsSlice';
import type { Trail } from '../types';

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
  const { importFile, isLoading, error, result } = useFileImport();

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
          createdAt: new Date(),
          source: 'upload',
          fileName: file.name,
          fileType: file.name.split('.').pop() as 'kml' | 'geojson',
        },
      };

      // Save to Redux (and localStorage via middleware)
      dispatch(setActiveTrail(trail));

      // Show success message with warnings
      const warnings = parsed.warnings.length > 0
        ? `\n\n⚠️ Ostrzeżenia:\n${parsed.warnings.join('\n')}`
        : '';

      alert(`✅ Trasa "${trail.feature.properties.name}" została załadowana!\n\n📏 Długość: ${(trail.feature.properties.distance! / 1000).toFixed(2)} km\n⏱️ Czas: ${trail.feature.properties.duration} min${warnings}`);

      // Close modal
      onClose();
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

  return (
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
          {/* Opis */}
          <Typography variant="body2" color="text.secondary">
            Wybierz sposób dodania trasy do mapy:
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
                onClick={handleImportClick}
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
  );
};

export default TrailsModal;
