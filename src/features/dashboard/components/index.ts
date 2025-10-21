/**
 * Dashboard Components - Central Export
 *
 * All dashboard components organized by folder:
 * - layout/           Dashboard & DashboardLayout (routing, shell)
 * - own-projects/     Własne Projekty (Home icon)
 * - public-projects/  Publiczne Projekty (Globe icon)
 * - settings/         Ustawienia
 * - profile/          Profil użytkownika
 * - contact/          Kontakt
 * - admin/            Panel Admina
 * - shared/           Wspólne komponenty
 *
 * Usage:
 * import { Dashboard, OwnProjects, PublicProjects, UserSettings } from '@/features/dashboard/components';
 */

// Layout (Dashboard routing & shell)
export * from './layout';

// Admin Panel
export * from './admin';

// Tab: Własne Projekty
export * from './own-projects';

// Tab: Publiczne Projekty
export * from './public-projects';

// Tab: Ustawienia
export * from './settings';

// Tab: Profil
export * from './profile';

// Tab: Kontakt
export * from './contact';

// Shared Components
export * from './shared';
