import { createTheme, responsiveFontSizes, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    mobile: true;
    tablet: true;
    desktop: true;
  }

  interface Palette {
    modal: {
      header: string;
      headerText: string;
      content: string;
      border: string;
    };
  }

  interface PaletteOptions {
    modal?: {
      header?: string;
      headerText?: string;
      content?: string;
      border?: string;
    };
  }
}

/**
 * OPTIMIZED MUI THEME SYSTEM
 *
 * Key optimizations:
 * 1. CSS Variables enabled - dynamic theming without re-renders
 * 2. responsiveFontSizes() - automatic responsive typography
 * 3. Optimized component defaults - reduced inline sx props
 * 4. Color palette with proper contrast ratios
 * 5. Performance-optimized configuration
 *
 * Usage:
 * import { themeOptimized } from '@/style/theme.optimized';
 * <ThemeProvider theme={themeOptimized}>...</ThemeProvider>
 */

const baseTheme = createTheme({
  // Enable CSS variables for dynamic theming (MUI v5.1+)
  cssVariables: true,

  palette: {
    mode: 'light',
    primary: {
      main: '#f75e4c', // Coral/Red MapMaker brand
      light: '#ff8f7c',
      dark: '#c23526',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1c679d', // Blue MapMaker accent
      light: '#4a8fc7',
      dark: '#154d75',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    modal: {
      header: '#4a5568',
      headerText: '#ffffff',
      content: '#f7f9fc',
      border: '#e5e7eb',
    },
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Base font sizes - will be made responsive by responsiveFontSizes()
    h1: {
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 400,
      lineHeight: 1.43,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 1200,
      xl: 1536,
      mobile: 0,
      tablet: 768,
      desktop: 1200,
    },
  },

  spacing: 8,

  shape: {
    borderRadius: 8,
  },

  components: {
    // MuiCssBaseline - Global styles (hoisted, non-rerendering)
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          margin: 0,
          padding: 0,
        },
        '#__next': {
          height: '100%',
        },
      },
    },

    // MuiPaper - Cards, Modals, Drawers
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
        }),
      },
    },

    // MuiDrawer - Side panels
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
        }),
      },
    },

    // MuiButton - All buttons
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          borderRadius: theme.shape.borderRadius,
          fontWeight: 500,
          transition: theme.transitions.create(
            ['background-color', 'box-shadow', 'border-color'],
            { duration: theme.transitions.duration.short }
          ),
        }),
        sizeMedium: {
          padding: '8px 16px',
        },
        sizeSmall: {
          padding: '6px 12px',
        },
        sizeLarge: {
          padding: '10px 20px',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'secondary' },
          style: ({ theme }) => ({
            backgroundColor: theme.palette.modal.header,
            color: theme.palette.modal.headerText,
            '&:hover': {
              backgroundColor: '#2d3748',
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }),
        },
      ],
    },

    // MuiIconButton - Icon buttons
    MuiIconButton: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          transition: theme.transitions.create(['background-color'], {
            duration: theme.transitions.duration.short,
          }),
        }),
      },
    },

    // MuiTextField - Form inputs
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius / 2,
            transition: theme.transitions.create(['border-color', 'box-shadow'], {
              duration: theme.transitions.duration.short,
            }),
            '& fieldset': {
              borderColor: theme.palette.grey[300],
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '14px',
            padding: '12px',
          },
          '& .MuiInputLabel-root': {
            fontSize: '14px',
          },
        }),
      },
    },

    // MuiSelect - Dropdowns
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        icon: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
    },

    // MuiDialog - Modals
    MuiDialog: {
      defaultProps: {
        maxWidth: 'sm',
        fullWidth: true,
      },
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[24],
        }),
      },
    },

    // MuiDialogTitle - Modal headers
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.modal.header,
          color: theme.palette.modal.headerText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing(2, 3),
          fontSize: '16px',
          fontWeight: 600,
          margin: 0,
        }),
      },
    },

    // MuiDialogContent - Modal content
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.modal.content,
          padding: theme.spacing(3),
        }),
      },
    },

    // MuiDialogActions - Modal footer
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.modal.content,
          padding: theme.spacing(2, 3),
          borderTop: `1px solid ${theme.palette.modal.border}`,
          gap: theme.spacing(2),
        }),
      },
    },

    // MuiTab - Tabs
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          minHeight: 48,
          transition: theme.transitions.create(['color', 'background-color'], {
            duration: theme.transitions.duration.short,
          }),
        }),
      },
    },

    // MuiTabs - Tab container
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
      },
    },

    // MuiCard - Card components
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
        }),
      },
    },

    // MuiCardContent - Card content
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(2),
          '&:last-child': {
            paddingBottom: theme.spacing(2),
          },
        }),
      },
    },

    // MuiTooltip - Tooltips
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.grey[800],
          fontSize: '12px',
          padding: theme.spacing(1, 1.5),
        }),
      },
    },

    // MuiChip - Chips
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius / 2,
          fontWeight: 500,
        }),
      },
    },

    // MuiAlert - Alerts
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },

    // MuiLinearProgress - Progress bars
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },

    // MuiCircularProgress - Loading spinners
    MuiCircularProgress: {
      defaultProps: {
        size: 40,
        thickness: 4,
      },
    },
  },
});

/**
 * Apply responsive font sizes automatically
 * This makes typography scale properly across breakpoints
 */
export const themeOptimized = responsiveFontSizes(baseTheme, {
  breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
  factor: 3, // Higher = more aggressive scaling
});

export default themeOptimized;
