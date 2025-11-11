import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { WypisPlot, WypisPlotWithDestinations } from '@/backend/types';

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
  selectedPlots: WypisPlotWithDestinations[]; // Selected plots with spatial development data

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
     * Add plot with destinations to selection
     * @param plot - Plot with spatial development data
     */
    addPlot: (state, action: PayloadAction<WypisPlotWithDestinations>) => {
      const exists = state.selectedPlots.find(
        (p) => p.plot.precinct === action.payload.plot.precinct && p.plot.number === action.payload.plot.number
      );
      if (!exists) {
        state.selectedPlots.push(action.payload);
      }
    },

    /**
     * Remove plot from selection
     * @param plot - Plot identifier {precinct, number}
     */
    removePlot: (state, action: PayloadAction<WypisPlot>) => {
      state.selectedPlots = state.selectedPlots.filter(
        (p) => !(p.plot.precinct === action.payload.precinct && p.plot.number === action.payload.number)
      );
    },

    /**
     * Toggle plot selection for PDF generation (DEPRECATED - use addPlot/removePlot)
     * @param plot - Plot to toggle (add if not exists, remove if exists)
     */
    togglePlotSelection: (state, action: PayloadAction<WypisPlot>) => {
      const index = state.selectedPlots.findIndex(
        (p) => p.plot.precinct === action.payload.precinct && p.plot.number === action.payload.number
      );

      if (index >= 0) {
        // Plot already selected - remove it
        state.selectedPlots.splice(index, 1);
      }
      // Note: Adding without destinations is not recommended - use addPlot instead
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
  addPlot,
  removePlot,
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
