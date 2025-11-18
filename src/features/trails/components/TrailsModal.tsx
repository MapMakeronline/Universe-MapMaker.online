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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // TODO (FAZA 2): Parse KML/GeoJSON file
      console.log('📁 Importing file:', file.name);
      console.log('📍 File type:', file.type);
      console.log('📏 File size:', file.size, 'bytes');

      // Symulacja uploadu (do usunięcia w FAZIE 2)
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`✅ Plik "${file.name}" został załadowany!\n\n⏳ Przetwarzanie pliku zostanie dodane w FAZIE 2.`);
      onClose();
    } catch (error) {
      console.error('❌ File import error:', error);
      setUploadError('Nie udało się wczytać pliku. Sprawdź format (KML/GeoJSON).');
    } finally {
      setIsUploading(false);
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
              cursor: isUploading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'scale(1.02)',
              },
            }}
            onClick={!isUploading ? handleImportClick : undefined}
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
                startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
                disabled={isUploading}
                onClick={handleImportClick}
              >
                {isUploading ? 'Wczytywanie...' : 'Wybierz plik'}
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
          {uploadError && (
            <Alert severity="error" onClose={() => setUploadError(null)}>
              {uploadError}
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
