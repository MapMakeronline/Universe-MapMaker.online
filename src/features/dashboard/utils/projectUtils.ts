/**
 * Project Utilities
 * Shared helper functions for project-related operations
 */

import { getProjectCreatedAt } from '@/backend';
import type { Project } from '@/backend';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

/**
 * Get thumbnail URL for a project
 * Returns project logo URL if exists, otherwise returns default SVG thumbnail
 *
 * Note: If backend logo fails to load (404), the CardMedia component will
 * handle the error via onError callback and fallback to default SVG
 */
export const getThumbnailUrl = (project: Project): string => {
  if (project.logoExists) {
    return `${API_URL}/api/projects/logo/${project.project_name}`;
  }
  return '/default-project-thumbnail.svg';
};

/**
 * Format project date/time for display
 * Converts backend format (project_date + project_time) to localized string
 *
 * Backend format: project_date="15-01-25", project_time="14:30"
 * Output: "15 sty 2025, 14:30" (Polish locale)
 *
 * @param project - Project object with project_date and project_time
 * @returns Formatted date string or 'Brak daty' if missing
 */
export const formatProjectDateTime = (project: Project): string => {
  if (!project.project_date || !project.project_time) {
    return 'Brak daty';
  }

  try {
    // Convert backend format (DD-MM-YY, HH:MM) to ISO timestamp
    const isoString = getProjectCreatedAt(project);
    const date = new Date(isoString);

    // Format: 15 sty 2025, 14:30
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Failed to format project date:', project.project_date, project.project_time, e);
    return 'Nieprawidłowa data';
  }
};
