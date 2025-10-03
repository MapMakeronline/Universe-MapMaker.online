'use client';

import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/lib/theme';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import OwnProjects from '../../../src/components/dashboard/OwnProjects';
import PublicProjects from '../../../src/components/dashboard/PublicProjects';
import UserProfile from '../../../src/components/dashboard/UserProfile';
import UserSettings from '../../../src/components/dashboard/UserSettings';
import Contact from '../../../src/components/dashboard/Contact';

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