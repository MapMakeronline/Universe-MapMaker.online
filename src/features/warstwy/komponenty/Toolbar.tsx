/**
 * KOMPONENT TOOLBAR - PASEK NARZĘDZI
 *
 * Odpowiada za:
 * - Renderowanie paska narzędzi z ikonami akcji
 * - Obsługę głównych funkcji aplikacji (dodawanie warstw, eksport, import)
 * - Zarządzanie akcjami na mapie (zoom, reset widoku, pomiary)
 * - Przełączanie trybu edycji/podglądu
 * - Shortcuts do najważniejszych funkcjonalności
 * - Tooltips z opisami narzędzi
 */
'use client';

import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import PublishIcon from '@mui/icons-material/Publish';
import AddIcon from '@mui/icons-material/CreateNewFolder';
import ClearIcon from '@mui/icons-material/DeleteForever';
import ChatIcon from '@mui/icons-material/Forum';
import StarIcon from '@mui/icons-material/FolderSpecial';
import EditIcon from '@mui/icons-material/Edit';

interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

interface ToolbarProps {
  onAddInspireDataset: () => void;
  onAddNationalLaw: () => void;
  onAddLayer: () => void;
  onImportLayer: () => void;
  onAddGroup: () => void;
  onRemoveLayer: () => void;
  onCreateConsultation: () => void;
  onLayerManager: () => void;
  onPrintConfig: () => void;
  selectedLayer?: Warstwa | null;
  isOwner?: boolean;
}

// Obiekt konfiguracji dla wielkości i stylów paska narzędzi
const TOOLBAR_CONFIG = {
  // Ustawienia kontenera
  container: {
    gap: 0.5,
    marginBottom: 0.1,
    paddingHorizontal: 1
  },

  // Ustawienia przycisków
  button: {
    padding: 0.5,
    minWidth: 'auto',
    size: 'small' as const
  },

  // Ustawienia ikon
  icon: {
    fontSize: '18px'
  }
} as const;

// Funkcja pomocnicza dla spójnego stylowania przycisków paska narzędzi
const ToolbarButton: React.FC<{
  title: string;
  onClick: () => void;
  icon: React.ReactElement;
  isDanger?: boolean;
  className?: string;
  disabled?: boolean;
}> = ({ title, onClick, icon, isDanger = false, className, disabled = false }) => {
  const theme = useTheme();

  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          size={TOOLBAR_CONFIG.button.size}
          onClick={onClick}
          className={className}
          disabled={disabled}
          sx={{
            color: theme.palette.text.secondary,
            p: TOOLBAR_CONFIG.button.padding,
            minWidth: TOOLBAR_CONFIG.button.minWidth,
            '&:hover': {
              color: isDanger ? theme.palette.error.main : theme.palette.primary.main
            },
            '&.Mui-disabled': {
              color: theme.palette.action.disabled,
            }
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: TOOLBAR_CONFIG.icon.fontSize } })}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddInspireDataset,
  onAddNationalLaw,
  onAddLayer,
  onImportLayer,
  onAddGroup,
  onRemoveLayer,
  onCreateConsultation,
  onLayerManager,
  onPrintConfig,
  selectedLayer,
  isOwner = true
}) => {
  // For non-owners (read-only mode), hide all editing tools
  if (!isOwner) {
    return null;
  }

  return (
    <Box sx={{
      display: 'flex',
      gap: TOOLBAR_CONFIG.container.gap,
      mb: TOOLBAR_CONFIG.container.marginBottom,
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      px: TOOLBAR_CONFIG.container.paddingHorizontal
    }}>
      <ToolbarButton
        title="Dodaj zbiór danych - INSPIRE"
        onClick={onAddInspireDataset}
        icon={<PublicIcon />}
        className="toolbar-icon"
      />

      <ToolbarButton
        title="Dodaj zbiór danych - PRAWO KRAJOWE"
        onClick={onAddNationalLaw}
        icon={<MapIcon />}
      />

      <ToolbarButton
        title="Dodaj warstwę"
        onClick={onAddLayer}
        icon={<AddToPhotosIcon />}
      />

      <ToolbarButton
        title="Importuj warstwę"
        onClick={onImportLayer}
        icon={<PublishIcon />}
      />

      <ToolbarButton
        title="Dodaj grupę"
        onClick={onAddGroup}
        icon={<AddIcon />}
      />

      <ToolbarButton
        title="Usuń grupę lub warstwę"
        onClick={onRemoveLayer}
        icon={<ClearIcon />}
        isDanger={true}
        disabled={!selectedLayer}
      />

      <ToolbarButton
        title="Utwórz konsultacje społeczne"
        onClick={onCreateConsultation}
        icon={<ChatIcon />}
      />

      <ToolbarButton
        title="Menedżer warstw"
        onClick={onLayerManager}
        icon={<StarIcon />}
      />

      <ToolbarButton
        title="Konfiguracja wyrysu i wypisu"
        onClick={onPrintConfig}
        icon={<EditIcon />}
      />
    </Box>
  );
};
