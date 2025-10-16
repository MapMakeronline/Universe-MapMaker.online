'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import OwnProjects from './OwnProjects';
import PublicProjects from './PublicProjects';
import UserProfile from './UserProfile';
import UserSettings from './UserSettings';
import Contact from './Contact';
import AdminPanel from './AdminPanel';

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
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </DashboardLayout>
  );
}