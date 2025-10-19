/**
 * Dashboard Module - Central Export
 *
 * All dashboard tabs organized by folder:
 * - own-projects/     Własne (Home icon)
 * - public-projects/  Publiczne (Globe icon)
 * - admin-panel/      Panel Admina
 * - profile/          Profil
 * - settings/         Ustawienia
 * - payments/         Płatności
 * - contact/          Kontakt
 * - shared/           Wspólne komponenty
 *
 * Usage:
 * import { OwnProjects, PublicProjects } from '@/backend/dashboard';
 */

// Tab: Własne Projekty
export * from './own-projects';

// Tab: Publiczne Projekty
export * from './public-projects';

// Shared Components
export * from './shared/ProjectCardSkeleton';
