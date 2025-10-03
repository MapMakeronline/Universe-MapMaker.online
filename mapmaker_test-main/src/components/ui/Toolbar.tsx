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
import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Public as PublicIcon,
  Map as MapIcon,
  AddToPhotos as AddToPhotosIcon,
  Publish as PublishIcon,
  CreateNewFolder as AddIcon,
  DeleteForever as ClearIcon,
  Forum as ChatIcon,
  FolderSpecial as StarIcon,
  EditDocument as EditIcon
} from '@mui/icons-material';
import { ToolbarProps } from '@/types/layers';

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
  },
  
  // Kolory
  colors: {
    default: 'rgba(255, 255, 255, 0.8)',
    hover: '#4fc3f7',
    danger: '#ff6b6b'
  }
} as const;

// Funkcja pomocnicza dla spójnego stylowania przycisków paska narzędzi
const ToolbarButton: React.FC<{
  title: string;
  onClick: () => void;
  icon: React.ReactElement;
  isDanger?: boolean;
  className?: string;
}> = ({ title, onClick, icon, isDanger = false, className }) => (
  <Tooltip title={title} arrow>
    <IconButton
      size={TOOLBAR_CONFIG.button.size}
      onClick={onClick}
      className={className}
      sx={{
        color: TOOLBAR_CONFIG.colors.default,
        p: TOOLBAR_CONFIG.button.padding,
        minWidth: TOOLBAR_CONFIG.button.minWidth,
        '&:hover': { 
          color: isDanger ? TOOLBAR_CONFIG.colors.danger : TOOLBAR_CONFIG.colors.hover 
        }
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: TOOLBAR_CONFIG.icon.fontSize } })}
    </IconButton>
  </Tooltip>
);

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddInspireDataset,
  onAddNationalLaw,
  onAddLayer,
  onImportLayer,
  onAddGroup,
  onRemoveLayer,
  onCreateConsultation,
  onLayerManager,
  onPrintConfig
}) => {
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
