// Redux slice for managing QGIS projects from GeoCraft backend
// REFACTORED Phase 1: Now uses unified API service
// REFACTORED Phase 2: Now uses Entity Adapter for normalized state
import { createSlice, createAsyncThunk, createEntityAdapter, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { unifiedProjectsApi } from '@/api/endpointy/unified-projects';
import type {
  Project,
  ProjectsResponse,
  CreateProjectData,
  UpdateProjectData,
  DbInfo,
} from '@/api/typy/types';
import { mapLogger } from '@/tools/logger';
import type { RootState } from '../store';

// ============================================================================
// Entity Adapter Configuration
// ============================================================================

/**
 * Entity Adapter for normalized project state
 * Benefits:
 * - O(1) lookups by project_name instead of O(n) array searches
 * - Automatic CRUD operations
 * - Built-in selectors for common queries
 * - Prevents duplicate entries
 */
const projectsAdapter = createEntityAdapter<Project>({
  selectId: (project) => project.project_name,
  sortComparer: (a, b) => {
    // Sort by date (newest first), fallback to name
    const dateCompare = b.project_date.localeCompare(a.project_date);
    return dateCompare !== 0 ? dateCompare : a.project_name.localeCompare(b.project_name);
  },
});

// ============================================================================
// State Interface
// ============================================================================

interface ProjectsState extends ReturnType<typeof projectsAdapter.getInitialState> {
  currentProject: Project | null;
  dbInfo: DbInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: ProjectsState = projectsAdapter.getInitialState({
  currentProject: null,
  dbInfo: null,
  isLoading: false,
  error: null,
  lastFetch: null,
});

// ============================================================================
// NOTE: Async thunks removed - RTK Query is now used exclusively
// ============================================================================
// All project CRUD operations are now handled by RTK Query hooks:
// - useGetProjectsQuery() - Fetch projects with auto-caching
// - useCreateProjectMutation() - Create new project
// - useDeleteProjectMutation() - Delete project
// - useTogglePublishMutation() - Publish/unpublish project
//
// See: src/redux/api/projectsApi.ts for RTK Query implementation
// See: src/features/dashboard/komponenty/OwnProjects.tsx for usage example
// ============================================================================

// ============================================================================
// Slice Definition
// ============================================================================

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
      if (action.payload) {
        mapLogger.info('Current project set:', action.payload.project_name);
      }
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
      mapLogger.info('Current project cleared');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProjectInList: (state, action: PayloadAction<Partial<Project> & { project_name: string }>) => {
      // Use Entity Adapter's updateOne for O(1) update
      const existingProject = state.entities[action.payload.project_name];
      if (existingProject) {
        projectsAdapter.updateOne(state, {
          id: action.payload.project_name,
          changes: action.payload,
        });

        // Update current project if it's the one being updated
        if (state.currentProject?.project_name === action.payload.project_name) {
          state.currentProject = { ...state.currentProject, ...action.payload };
        }
      }
    },
  },
  // No extraReducers needed - RTK Query handles all async operations
});

export const {
  setCurrentProject,
  clearCurrentProject,
  clearError,
  updateProjectInList,
} = projectsSlice.actions;

export default projectsSlice.reducer;

// ============================================================================
// Selectors (Entity Adapter + Memoized)
// ============================================================================

/**
 * Export entity adapter selectors
 * These provide O(1) lookups and are automatically memoized
 */
export const {
  selectAll: selectAllProjects,        // Get all projects as sorted array
  selectById: selectProjectById,       // Get project by ID (O(1) lookup!)
  selectIds: selectProjectIds,         // Get all project IDs
  selectEntities: selectProjectEntities, // Get projects as { [id]: Project } map
  selectTotal: selectTotalProjects,    // Get total count
} = projectsAdapter.getSelectors<RootState>((state) => state.projects);

/**
 * Basic state selectors
 */
export const selectCurrentProject = (state: RootState) => state.projects.currentProject;
export const selectDbInfo = (state: RootState) => state.projects.dbInfo;
export const selectProjectsLoading = (state: RootState) => state.projects.isLoading;
export const selectProjectsError = (state: RootState) => state.projects.error;
export const selectLastFetch = (state: RootState) => state.projects.lastFetch;

/**
 * Memoized selectors using createSelector for performance
 * These only recompute when dependencies change
 */

// Select published projects (memoized)
export const selectPublishedProjects = createSelector(
  [selectAllProjects],
  (projects) => projects.filter((p) => p.published)
);

// Select unpublished/private projects (memoized)
export const selectUnpublishedProjects = createSelector(
  [selectAllProjects],
  (projects) => projects.filter((p) => !p.published)
);

// Select projects by category (memoized)
export const selectProjectsByCategory = (category: string) =>
  createSelector([selectAllProjects], (projects) =>
    projects.filter((p) => p.categories === category)
  );

// Select project count by status (memoized)
export const selectProjectCounts = createSelector([selectAllProjects], (projects) => ({
  total: projects.length,
  published: projects.filter((p) => p.published).length,
  unpublished: projects.filter((p) => !p.published).length,
}));

/**
 * Backward compatibility selectors
 * For components still using old selector names
 */
export const selectProjects = selectAllProjects; // Legacy alias
export const selectProjectByName = (projectName: string) => (state: RootState) =>
  selectProjectById(state, projectName); // Legacy alias with different signature
