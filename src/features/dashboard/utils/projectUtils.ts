/**
 * Project Utilities
 * Shared helper functions for project-related operations
 */

interface Project {
  project_name: string;
  logoExists?: boolean;
}

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
