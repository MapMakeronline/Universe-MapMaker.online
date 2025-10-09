// Redux slice for managing QGIS projects from GeoCraft backend
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectsApi } from '@/lib/api/projects';
import type {
  Project,
  ProjectsResponse,
  CreateProjectData,
  UpdateProjectData,
  DbInfo,
} from '@/lib/api/types';
import { mapLogger } from '@/lib/logger';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  dbInfo: DbInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  dbInfo: null,
  isLoading: false,
  error: null,
  lastFetch: null,
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Fetch all projects for the authenticated user
 */
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🗺️ MAP Fetching projects from backend...');
      const response = await projectsApi.getProjects();
      console.log('🗺️ MAP Projects fetched:', {
        count: response.list_of_projects?.length || 0,
        projects: response.list_of_projects?.map(p => p.project_name),
      });
      return response;
    } catch (error: any) {
      console.error('🗺️ MAP Failed to fetch projects:', error);
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
      const project = await projectsApi.createProject(data);
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
      const result = await projectsApi.updateProject(data);
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
      const result = await projectsApi.deleteProject(projectName);
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
      const result = await projectsApi.publishProject(projectName, publish);
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
      const result = await projectsApi.changeDomain(projectName, newDomain);
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
      const index = state.projects.findIndex(
        (p) => p.project_name === action.payload.project_name
      );
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload };

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
        state.projects = action.payload.list_of_projects;
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
        // Clear current project if it was deleted
        if (state.currentProject?.project_name === action.meta.arg) {
          state.currentProject = null;
        }
        // Projects list will be refreshed by fetchProjects
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
// Selectors
// ============================================================================

export const selectProjects = (state: { projects: ProjectsState }) => state.projects.projects;
export const selectCurrentProject = (state: { projects: ProjectsState }) => state.projects.currentProject;
export const selectDbInfo = (state: { projects: ProjectsState }) => state.projects.dbInfo;
export const selectProjectsLoading = (state: { projects: ProjectsState }) => state.projects.isLoading;
export const selectProjectsError = (state: { projects: ProjectsState }) => state.projects.error;
export const selectLastFetch = (state: { projects: ProjectsState }) => state.projects.lastFetch;

// Memoized selectors
export const selectProjectByName = (projectName: string) => (state: { projects: ProjectsState }) =>
  state.projects.projects.find((p) => p.project_name === projectName);

export const selectPublishedProjects = (state: { projects: ProjectsState }) =>
  state.projects.projects.filter((p) => p.published);

export const selectUnpublishedProjects = (state: { projects: ProjectsState }) =>
  state.projects.projects.filter((p) => !p.published);
