'use client';

import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import OwnProjects from '../../../src/components/dashboard/OwnProjects';
import PublicProjects from '../../../src/components/dashboard/PublicProjects';
import UserProfile from '../../../src/components/dashboard/UserProfile';
import UserSettings from '../../../src/components/dashboard/UserSettings';
import Contact from '../../../src/components/dashboard/Contact';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
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
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState('own');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'own':
        return <OwnProjects />;
      case 'public':
        return <PublicProjects />;
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return <UserSettings />;
      case 'payments':
        return <UserProfile />; // For now, redirect to profile
      case 'contact':
        return <Contact />;
      default:
        return <OwnProjects />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderCurrentPage()}
      </DashboardLayout>
    </ThemeProvider>
  );
}