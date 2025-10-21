'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
// Import tab components directly to avoid circular dependencies
import { OwnProjects } from '../own-projects';
import { PublicProjects } from '../public-projects';
import { UserSettings } from '../settings';
import { UserProfile } from '../profile';
import { Contact } from '../contact';
// import { AdminPanel } from '../admin'; // TODO: Enable when needed

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
        // TODO: Migrate AdminPanel to @/backend
        return <UserProfile />; // Temporary redirect to profile
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
