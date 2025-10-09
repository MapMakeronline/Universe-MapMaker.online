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
import { mapLogger } from '@/narzedzia/logger';
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
// Async Thunks (DEPRECATED - Use RTK Query hooks from @/redux/api/projectsApi)
// ============================================================================
// ⚠️ DEPRECATED: These async thunks are kept for backward compatibility only.
// New code should use RTK Query hooks:
// - useGetProjectsQuery() instead of dispatch(fetchProjects())
// - useCreateProjectMutation() instead of dispatch(createProject())
// - useDeleteProjectMutation() instead of dispatch(deleteProject())
// - useTogglePublishMutation() instead of dispatch(togglePublishProject())
//
// See: src/store/api/projectsApi.ts for RTK Query implementation
// See: src/components/dashboard/OwnProjectsRTK.tsx for usage example
//
// These will be removed in a future version.
// ============================================================================

/**
 * Fetch all projects for the authenticated user
 * @deprecated Use useGetProjectsQuery() from @/redux/api/projectsApi instead
 */
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      mapLogger.info('Fetching projects from backend...');
      const response = await unifiedProjectsApi.getProjects();
      mapLogger.info('Projects fetched successfully:', {
        count: response.list_of_projects?.length || 0,
        projects: response.list_of_projects?.slice(0, 5).map(p => p.project_name),
      });
      return response;
    } catch (error: any) {
      mapLogger.error('Failed to fetch projects:', error);
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

/**
 * Create a new project
 */
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: CreateProjectData, { rejectWithValue, dispatch }) => {
    try {
      const project = await unifiedProjectsApi.createProject(data);
      mapLogger.info('Project created:', project);

      // Refresh project list after creation
      dispatch(fetchProjects());

      return project;
    } catch (error: any) {
      mapLogger.error('Failed to create project:', error);
      return rejectWithValue(error.message || 'Failed to create project');
    }
  }
);

/**
 * Update project metadata
 */
export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async (data: UpdateProjectData, { rejectWithValue, dispatch }) => {
    try {
      const result = await unifiedProjectsApi.updateProject(data);
      mapLogger.info('Project updated:', result);

      // Refresh project list after update
      dispatch(fetchProjects());

      return { projectName: data.project, ...result };
    } catch (error: any) {
      mapLogger.error('Failed to update project:', error);
      return rejectWithValue(error.message || 'Failed to update project');
    }
  }
);

/**
 * Delete a project
 */
export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectName: string, { rejectWithValue, dispatch }) => {
    try {
      const result = await unifiedProjectsApi.deleteProject(projectName);
      mapLogger.info('Project deleted:', projectName);

      // Refresh project list after deletion
      dispatch(fetchProjects());

      return { projectName, ...result };
    } catch (error: any) {
      mapLogger.error('Failed to delete project:', error);
      return rejectWithValue(error.message || 'Failed to delete project');
    }
  }
);

/**
 * Publish/unpublish a project
 */
export const togglePublishProject = createAsyncThunk(
  'projects/togglePublishProject',
  async ({ projectName, publish }: { projectName: string; publish: boolean }, { rejectWithValue, dispatch }) => {
    try {
      const result = await unifiedProjectsApi.togglePublish(projectName, publish);
      mapLogger.info(`Project ${publish ? 'published' : 'unpublished'}:`, projectName);

      // Refresh project list
      dispatch(fetchProjects());

      return { projectName, publish, ...result };
    } catch (error: any) {
      mapLogger.error('Failed to toggle publish state:', error);
      return rejectWithValue(error.message || 'Failed to toggle publish state');
    }
  }
);

/**
 * Change project domain
 */
export const changeProjectDomain = createAsyncThunk(
  'projects/changeProjectDomain',
  async ({ projectName, newDomain }: { projectName: string; newDomain: string }, { rejectWithValue, dispatch }) => {
    try {
      const result = await unifiedProjectsApi.changeDomain(projectName, newDomain);
      mapLogger.info('Project domain changed:', { projectName, newDomain });

      // Refresh project list
      dispatch(fetchProjects());

      return { projectName, newDomain, ...result };
    } catch (error: any) {
      mapLogger.error('Failed to change domain:', error);
      return rejectWithValue(error.message || 'Failed to change domain');
    }
  }
);

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
  extraReducers: (builder) => {
    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<ProjectsResponse>) => {
        state.isLoading = false;
        // Use entity adapter to set all projects (replaces array, maintains normalization)
        projectsAdapter.setAll(state, action.payload.list_of_projects);
        state.dbInfo = action.payload.db_info;
        state.lastFetch = Date.now();
        mapLogger.info(`Fetched ${action.payload.list_of_projects.length} projects`);
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create project
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state) => {
        state.isLoading = false;
        // Projects list will be refreshed by fetchProjects
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update project
    builder
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state) => {
        state.isLoading = false;
        // Projects list will be refreshed by fetchProjects
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        // Use Entity Adapter to remove the project (O(1) deletion)
        projectsAdapter.removeOne(state, action.meta.arg);

        // Clear current project if it was deleted
        if (state.currentProject?.project_name === action.meta.arg) {
          state.currentProject = null;
        }
        // Note: fetchProjects is still dispatched for backend sync
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Toggle publish
    builder
      .addCase(togglePublishProject.pending, (state) => {
        state.error = null;
      })
      .addCase(togglePublishProject.fulfilled, (state) => {
        // Projects list will be refreshed by fetchProjects
      })
      .addCase(togglePublishProject.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Change domain
    builder
      .addCase(changeProjectDomain.pending, (state) => {
        state.error = null;
      })
      .addCase(changeProjectDomain.fulfilled, (state) => {
        // Projects list will be refreshed by fetchProjects
      })
      .addCase(changeProjectDomain.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
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
