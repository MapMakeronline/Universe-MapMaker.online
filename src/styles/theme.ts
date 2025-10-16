import { createTheme, alpha } from '@mui/material/styles';

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

export const theme = createTheme({
  palette: {
    primary: {
      main: '#f75e4c', // Czerwony/koralowy MapMaker
      light: '#ff8f7c',
      dark: '#c23526',
    },
    secondary: {
      main: '#1c679d', // Niebieski MapMaker
      light: '#4a8fc7',
      dark: '#154d75',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    grey: {
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
    modal: {
      header: '#4a5568',
      headerText: '#ffffff',
      content: '#f7f9fc',
      border: '#e5e7eb',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
        sizeMedium: {
          padding: '8px 16px',
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
              backgroundColor: '#a0aec0',
              color: 'white',
            },
          }),
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'white',
            borderRadius: '4px',
            '& fieldset': {
              borderColor: '#d1d5db',
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            },
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '14px',
            padding: '12px',
          },
          '& .MuiSelect-icon': {
            color: theme.palette.text.secondary,
          },
        }),
      },
    },
    MuiDialog: {
      defaultProps: {
        maxWidth: 'sm',
        fullWidth: true,
      },
      styleOverrides: {
        paper: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.modal.header,
          color: theme.palette.modal.headerText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          fontSize: '16px',
          fontWeight: 600,
          margin: 0,
        }),
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.modal.content,
          padding: '24px',
        }),
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.modal.content,
          padding: '16px 24px',
          borderTop: `1px solid ${theme.palette.modal.border}`,
          gap: '16px',
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          minHeight: '48px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
        },
      },
    },
  },
});

export default theme;