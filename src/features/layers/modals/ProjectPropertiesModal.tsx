/**
 * PROJECT PROPERTIES MODAL - Modal z właściwościami projektu
 *
 * TODO: Implementacja docelowa
 * - Usługi (WMS, WFS, CSW URLs - copy to clipboard)
 * - Pobieranie (QGS/QGZ, Zbiór APP, Metadane)
 * - Metadane (Wyświetl, Wyszukaj, Stwórz)
 * - Inne projekty użytkownika (lista)
 * - Publish Services (modal z wyborem warstw)
 *
 * Backend endpoints:
 * - GET /api/projects/{project}/services/ (?)
 * - POST /dashboard/projects/publish/ (już istnieje - PublishServicesModal)
 */
'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

interface ProjectPropertiesModalProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  wmsUrl?: string;
  wfsUrl?: string;
}

export const ProjectPropertiesModal: React.FC<ProjectPropertiesModalProps> = ({
  open,
  onClose,
  projectName = 'Projekt',
  wmsUrl = '',
  wfsUrl = '',
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Właściwości projektu - {projectName}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            🚧 TODO: Implementacja właściwości projektu
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Funkcjonalności do dodania:
          </Typography>
          <ul style={{ fontSize: '12px', color: '#666' }}>
            <li><strong>Usługi</strong> - WMS URL: {wmsUrl || 'Brak'}, WFS URL: {wfsUrl || 'Brak'}, CSW (copy to clipboard)</li>
            <li><strong>Pobieranie</strong> - QGS/QGZ (modal już istnieje), Zbiór APP, Metadane</li>
            <li><strong>Metadane</strong> - Wyświetl, Wyszukaj, Stwórz</li>
            <li><strong>Inne projekty użytkownika</strong> - Lista projektów</li>
            <li><strong>Publish Services</strong> - Otwórz PublishServicesModal</li>
          </ul>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="warning.main">
            ⚠️ Istniejące modale do ponownego użycia:
          </Typography>
          <ul style={{ fontSize: '12px', color: '#666' }}>
            <li>DownloadProjectModal - pobieranie QGS/QGZ (już podłączony)</li>
            <li>PublishServicesModal - publikacja usług WMS/WFS (już podłączony)</li>
          </ul>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zamknij</Button>
      </DialogActions>
    </Dialog>
  );
};
