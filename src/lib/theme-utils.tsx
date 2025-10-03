import React from 'react';
import { Typography, Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { SxProps, Theme } from '@mui/material/styles';

/**
 * Standardowy label dla formularzy
 */
export const FormLabel: React.FC<{ children: React.ReactNode; sx?: SxProps<Theme> }> = ({
  children,
  sx = {}
}) => (
  <Typography
    sx={{
      fontSize: '14px',
      fontWeight: 500,
      color: 'text.primary',
      mb: 1,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

/**
 * Standardowy kontener dla pola formularza (label + input)
 */
export const FormField: React.FC<{
  label?: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}> = ({ label, children, sx = {} }) => (
  <Box sx={sx}>
    {label && <FormLabel>{label}</FormLabel>}
    {children}
  </Box>
);

/**
 * Standardowy header dla Dialog z przyciskiem zamykania
 */
export const DialogHeader: React.FC<{
  title: string;
  onClose: () => void;
  sx?: SxProps<Theme>;
}> = ({ title, onClose, sx = {} }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...sx,
    }}
  >
    {title}
    <IconButton
      onClick={onClose}
      size="small"
      sx={{
        color: 'inherit',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
      }}
    >
      <CloseIcon sx={{ fontSize: '20px' }} />
    </IconButton>
  </Box>
);

/**
 * Standardowy kontener formularza z odpowiednimi odstępami
 */
export const FormContainer: React.FC<{
  children: React.ReactNode;
  gap?: number;
  sx?: SxProps<Theme>;
}> = ({ children, gap = 2.5, sx = {} }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...sx,
    }}
  >
    {children}
  </Box>
);

/**
 * Utility do tworzenia responsywnych wartości
 */
export const responsive = {
  /**
   * Ukryj na mobile
   */
  hideOnMobile: {
    display: { xs: 'none', md: 'block' },
  },
  /**
   * Ukryj na desktop
   */
  hideOnDesktop: {
    display: { xs: 'block', md: 'none' },
  },
  /**
   * Padding responsywny
   */
  padding: {
    p: { xs: 2, sm: 3 },
  },
  /**
   * Font size responsywny dla nagłówków
   */
  fontSize: {
    small: { xs: '0.875rem', sm: '1rem' },
    medium: { xs: '1rem', sm: '1.125rem' },
    large: { xs: '1.125rem', sm: '1.25rem' },
    xlarge: { xs: '1.25rem', sm: '1.5rem' },
  },
};

/**
 * Predefiniowane sx dla często używanych wzorców
 */
export const commonSx = {
  /**
   * Centruj zawartość
   */
  centerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Pełna wysokość i szerokość
   */
  fullSize: {
    width: '100%',
    height: '100%',
  },
  /**
   * Scroll container
   */
  scrollable: {
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      bgcolor: 'grey.100',
    },
    '&::-webkit-scrollbar-thumb': {
      bgcolor: 'grey.400',
      borderRadius: '4px',
      '&:hover': {
        bgcolor: 'grey.500',
      },
    },
  },
  /**
   * Card shadow
   */
  cardShadow: {
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  /**
   * Przejście dla animacji
   */
  transition: (properties: string[] = ['all']) => ({
    transition: (theme: Theme) =>
      theme.transitions.create(properties, {
        duration: theme.transitions.duration.short,
      }),
  }),
};

/**
 * Helper do tworzenia warunkowych stylów
 */
export const conditionalSx = (condition: boolean, trueSx: SxProps<Theme>, falseSx: SxProps<Theme> = {}) =>
  condition ? trueSx : falseSx;
