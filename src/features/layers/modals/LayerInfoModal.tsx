/**
 * LAYER INFO MODAL - Modal z informacjami szczegółowymi o warstwie
 *
 * TODO: Implementacja docelowa
 * - Formularz edycji nazwy warstwy
 * - Edycja opisu
 * - Typ geometrii (read-only)
 * - Tabela atrybutów (link/przycisk)
 * - Widoczność kolumn
 * - Ustawienia widoczności (domyślne, od skali, w trybie opublikowanym)
 * - Przezroczystość warstwy (slider)
 *
 * Backend endpoint: PUT /api/layers/update/ (?)
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

interface LayerInfoModalProps {
  open: boolean;
  onClose: () => void;
  layerName?: string;
}

export const LayerInfoModal: React.FC<LayerInfoModalProps> = ({
  open,
  onClose,
  layerName = 'Warstwa',
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Informacje szczegółowe - {layerName}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            🚧 TODO: Implementacja formularza edycji warstwy
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Funkcjonalności do dodania:
          </Typography>
          <ul style={{ fontSize: '12px', color: '#666' }}>
            <li>Edycja nazwy warstwy</li>
            <li>Edycja opisu</li>
            <li>Typ geometrii (read-only)</li>
            <li>Tabela atrybutów</li>
            <li>Widoczność kolumn</li>
            <li>Ustawienia widoczności (domyślne, od skali, w trybie opublikowanym)</li>
            <li>Przezroczystość warstwy (slider 0-100%)</li>
          </ul>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={onClose}>
          Zapisz (TODO)
        </Button>
      </DialogActions>
    </Dialog>
  );
};
