import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project, DbInfo } from '@/lib/api/dashboard';

interface DashboardState {
  projects: Project[];
  dbInfo: DbInfo | null;
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  projects: [],
  dbInfo: null,
  selectedProject: null,
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<{ projects: Project[]; dbInfo: DbInfo }>) => {
      state.projects = action.payload.projects;
      state.dbInfo = action.payload.dbInfo;
    },
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    updateProjectInList: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.project_name === action.payload.project_name);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.selectedProject?.project_name === action.payload.project_name) {
        state.selectedProject = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearDashboard: (state) => {
      state.projects = [];
      state.dbInfo = null;
      state.selectedProject = null;
      state.error = null;
    },
  },
});

export const {
  setProjects,
  setSelectedProject,
  updateProjectInList,
  setLoading,
  setError,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
