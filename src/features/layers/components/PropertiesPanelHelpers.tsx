/**
 * PROPERTIES PANEL RENDER HELPERS
 *
 * Reusable UI builder functions for PropertiesPanel component.
 * Extracted to reduce component complexity and improve reusability.
 */
'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Theme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';

// ===== KONFIGURACJA WIELKOŚCI I STYLÓW =====

export const PANEL_CONFIG = {
  // Główne wymiary panelu
  panel: {
    height: '260px', // Wysokość całego panelu właściwości
    headerHeight: '40px', // Wysokość nagłówka panelu
    contentPadding: '0px', // Padding dla zawartości (nieużywane)
  },

   // Czcionki i tekst
  typography: {
    headerFontSize: '15px', // Rozmiar czcionki w nagłówku panelu
    sectionTitleFontSize: '15px', // Rozmiar tytułów sekcji
    labelFontSize: '11px', // Rozmiar etykiet pól
    valueFontSize: '11px', // Rozmiar wartości w polach
    buttonFontSize: '10px', // Rozmiar czcionki w przyciskach
    iconSize: '14px', // Rozmiar ikon w sekcjach
    closeIconSize: '14px', // Rozmiar ikony zamknięcia
  },

  // Elementy interfejsu (jednostki MUI: liczby = * 8px, stringi = dokładne wartości)
  elements: {
    sectionMarginBottom: 0.8, // Odstęp między sekcjami (0.8 * 8px = 6.4px)
    sectionContentMarginLeft: 2, // Wcięcie zawartości sekcji (2 * 8px = 16px)
    sectionContentMarginTop: 1, // Odstęp góra zawartości sekcji (1 * 8px = 8px)
    fieldMarginBottom: 0.8, // Odstęp między polami (0.8 * 8px = 6.4px)
    checkboxSize: '16px', // Rozmiar checkboxów (jednostka dokładna)
    buttonPaddingX: 2, // Padding poziomy przycisków (2 * 8px = 16px)
    buttonPaddingY: 0.3, // Padding pionowy przycisków (0.3 * 8px = 2.4px)
    buttonMinWidth: '60px', // Minimalna szerokość przycisków
    sliderHeight: '6px', // Wysokość sliderów
    sliderThumbSize: '14px', // Rozmiar suwaka slidera
  },

    // Kolory (dla łatwej zmiany motywu)
  colors: {
    panelBackground: 'rgba(50, 50, 50, 0.95)',
    headerBackground: 'rgba(40, 40, 40, 0.9)',
    buttonBackground: 'rgba(70, 80, 90, 0.8)',
    buttonBorder: 'rgba(100, 110, 120, 0.6)',
    buttonHoverBackground: 'rgba(79, 195, 247, 0.2)',
    buttonHoverBorder: 'rgba(79, 195, 247, 0.4)',
    accent: '#4fc3f7',
    text: 'white',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
  }

  };

// ===== RENDER HELPER FUNCTIONS =====

export const renderLabel = (text: string, theme: Theme) => (
  <Typography sx={{
    fontSize: PANEL_CONFIG.typography.labelFontSize,
    color: theme.palette.text.primary,
    mb: 0.5
  }}>
    {text}
  </Typography>
);

export const renderValue = (text: string, theme: Theme, italic: boolean = true) => (
  <Typography sx={{
    fontSize: PANEL_CONFIG.typography.valueFontSize,
    color: theme.palette.text.primary,
    fontStyle: italic ? 'italic' : 'normal',
    lineHeight: 1.3
  }}>
    {text}
  </Typography>
);

export const renderFieldBox = (children: React.ReactNode, marginBottom: boolean = true) => (
  <Box sx={{ mb: marginBottom ? PANEL_CONFIG.elements.fieldMarginBottom : 0 }}>
    {children}
  </Box>
);

export const renderCheckbox = (
  checkboxName: string,
  isChecked: boolean,
  theme: Theme,
  onToggle: (checkboxName: string) => void
) => (
  <Box
    sx={{
      width: PANEL_CONFIG.elements.checkboxSize,
      height: PANEL_CONFIG.elements.checkboxSize,
      border: '1px solid rgba(255, 255, 255, 0.5)',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      bgcolor: isChecked ? `${theme.palette.primary.main}30` : 'transparent',
      '&:hover': {
        borderColor: theme.palette.primary.main
      }
    }}
    onClick={() => onToggle(checkboxName)}
  >
    {isChecked && (
      <Box sx={{
        width: 8,
        height: 4,
        borderLeft: '2px solid white',
        borderBottom: '2px solid white',
        transform: 'rotate(-45deg)',
        mt: '-1px'
      }} />
    )}
  </Box>
);

export const renderActionButton = (
  label: string,
  onClick: () => void,
  theme: Theme,
  width: string = 'fit-content'
) => (
  <Box
    sx={{
      bgcolor: theme.palette.action.hover,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '4px',
      px: width === 'fit-content' ? 2 : 1.5,
      py: 0.3,
      cursor: 'pointer',
      fontSize: PANEL_CONFIG.typography.buttonFontSize,
      color: theme.palette.text.primary,
      fontWeight: 500,
      textAlign: 'center',
      width: width,
      minWidth: width === 'fit-content' ? PANEL_CONFIG.elements.buttonMinWidth : width,
      '&:hover': {
        bgcolor: theme.palette.action.selected,
        borderColor: theme.palette.primary.main
      }
    }}
    onClick={onClick}
  >
    {label}
  </Box>
);

interface RenderSectionProps {
  sectionId: string;
  title: string;
  children: React.ReactNode;
  theme: Theme;
  expandedSections: { [key: string]: boolean };
  onToggleSection: (sectionId: string) => void;
  hasLock?: boolean;
  actionIcon?: React.ReactNode;
}

export const renderSection = ({
  sectionId,
  title,
  children,
  theme,
  expandedSections,
  onToggleSection,
  hasLock = false,
  actionIcon
}: RenderSectionProps) => (
  <Box sx={{ mb: PANEL_CONFIG.elements.sectionMarginBottom }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 1,
      }}
    >
      <Box
        onClick={() => onToggleSection(sectionId)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          flex: 1,
          '&:hover': { color: theme.palette.primary.main }
        }}
      >
        {expandedSections[sectionId] ?
          <ExpandMoreIcon sx={{
            fontSize: PANEL_CONFIG.typography.iconSize,
            color: theme.palette.text.secondary,
            mr: 0.5
          }} /> :
          <ChevronRightIcon sx={{
            fontSize: PANEL_CONFIG.typography.iconSize,
            color: theme.palette.text.secondary,
            mr: 0.5
          }} />
        }
        <Typography sx={{
          color: theme.palette.text.primary,
          fontSize: PANEL_CONFIG.typography.sectionTitleFontSize,
          fontWeight: 500
        }}>
          {title}
        </Typography>
        {hasLock && (
          <LockIcon sx={{
            ml: 1,
            fontSize: '12px',
            color: theme.palette.text.secondary,
            cursor: 'help'
          }} />
        )}
      </Box>
      {actionIcon && (
        <Box sx={{ ml: 'auto' }}>
          {actionIcon}
        </Box>
      )}
    </Box>

    {expandedSections[sectionId] && (
      <Box sx={{
        ml: PANEL_CONFIG.elements.sectionContentMarginLeft,
        mt: PANEL_CONFIG.elements.sectionContentMarginTop
      }}>
        {children}
      </Box>
    )}
  </Box>
);
