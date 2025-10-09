'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/lib/theme';
import DashboardLayout from '../../../src/components/dashboard/DashboardLayout';
import OwnProjects from '../../../src/components/dashboard/OwnProjectsIntegrated';
import PublicProjects from '../../../src/components/dashboard/PublicProjects';
import UserProfile from '../../../src/components/dashboard/UserProfile';
import UserSettings from '../../../src/components/dashboard/UserSettings';
import Contact from '../../../src/components/dashboard/Contact';
import AdminPanel from '../../../src/components/dashboard/AdminPanel';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Map tab parameter to page names: 0 = own, 1 = public
  const getInitialPage = () => {
    if (tabParam === '1') return 'public';
    if (tabParam === '0') return 'own';
    return 'own'; // Default
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());

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
      case 'admin':
        return <AdminPanel />;
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