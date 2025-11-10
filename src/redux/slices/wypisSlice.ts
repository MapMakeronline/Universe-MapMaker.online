import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { WypisPlot } from '@/backend/types';

/**
 * Redux slice for Wypis i Wyrys (Print Configuration) state management
 *
 * Handles:
 * - Configuration modal state (open/close, editing mode)
 * - Generate modal state (plot selection)
 * - Selected plots for PDF generation
 * - Current editing configuration ID
 */

interface WypisState {
  /**
   * Configuration modal state
   */
  configModalOpen: boolean;
  editingConfigId: string | null; // null = creating new config, string = editing existing

  /**
   * Generate modal state
   */
  generateModalOpen: boolean;
  selectedConfigId: string | null; // Selected config for PDF generation
  selectedPlots: WypisPlot[]; // Selected plots for PDF generation

  /**
   * Visibility flag for DocumentFAB
   * Set to true when at least one configuration exists
   */
  hasConfigurations: boolean;
}

const initialState: WypisState = {
  configModalOpen: false,
  editingConfigId: null,
  generateModalOpen: false,
  selectedConfigId: null,
  selectedPlots: [],
  hasConfigurations: false,
};

export const wypisSlice = createSlice({
  name: 'wypis',
  initialState,
  reducers: {
    /**
     * Open configuration modal
     * @param configId - null for new config, string for editing existing
     */
    openConfigModal: (state, action: PayloadAction<string | null>) => {
      state.configModalOpen = true;
      state.editingConfigId = action.payload;
    },

    /**
     * Close configuration modal and reset editing state
     */
    closeConfigModal: (state) => {
      state.configModalOpen = false;
      state.editingConfigId = null;
    },

    /**
     * Open generate modal
     * @param configId - Configuration ID to use for PDF generation
     */
    openGenerateModal: (state, action: PayloadAction<string | null>) => {
      state.generateModalOpen = true;
      state.selectedConfigId = action.payload;
      state.selectedPlots = []; // Reset selected plots
    },

    /**
     * Close generate modal and reset state
     */
    closeGenerateModal: (state) => {
      state.generateModalOpen = false;
      state.selectedConfigId = null;
      state.selectedPlots = [];
    },

    /**
     * Toggle plot selection for PDF generation
     * @param plot - Plot to toggle (add if not exists, remove if exists)
     */
    togglePlotSelection: (state, action: PayloadAction<WypisPlot>) => {
      const index = state.selectedPlots.findIndex(
        (p) => p.precinct === action.payload.precinct && p.number === action.payload.number
      );

      if (index >= 0) {
        // Plot already selected - remove it
        state.selectedPlots.splice(index, 1);
      } else {
        // Plot not selected - add it
        state.selectedPlots.push(action.payload);
      }
    },

    /**
     * Clear all selected plots
     */
    clearPlotSelection: (state) => {
      state.selectedPlots = [];
    },

    /**
     * Set hasConfigurations flag
     * Called after fetching configurations list
     * @param hasConfigurations - true if at least one config exists
     */
    setHasConfigurations: (state, action: PayloadAction<boolean>) => {
      state.hasConfigurations = action.payload;
    },

    /**
     * Set selected config ID for PDF generation
     * @param configId - Configuration ID
     */
    setSelectedConfigId: (state, action: PayloadAction<string | null>) => {
      state.selectedConfigId = action.payload;
    },
  },
});

// Export actions
export const {
  openConfigModal,
  closeConfigModal,
  openGenerateModal,
  closeGenerateModal,
  togglePlotSelection,
  clearPlotSelection,
  setHasConfigurations,
  setSelectedConfigId,
} = wypisSlice.actions;

// Export reducer
export default wypisSlice.reducer;

// Selectors
export const selectWypisState = (state: { wypis: WypisState }) => state.wypis;
export const selectConfigModalOpen = (state: { wypis: WypisState }) => state.wypis.configModalOpen;
export const selectEditingConfigId = (state: { wypis: WypisState }) => state.wypis.editingConfigId;
export const selectGenerateModalOpen = (state: { wypis: WypisState }) => state.wypis.generateModalOpen;
export const selectSelectedConfigId = (state: { wypis: WypisState }) => state.wypis.selectedConfigId;
export const selectSelectedPlots = (state: { wypis: WypisState }) => state.wypis.selectedPlots;
export const selectHasConfigurations = (state: { wypis: WypisState }) => state.wypis.hasConfigurations;
