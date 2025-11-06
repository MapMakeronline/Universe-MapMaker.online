/**
 * useModalManager Hook
 *
 * Centralized modal state management for LeftPanel component.
 * Extracted from LeftPanel.tsx to reduce complexity and improve maintainability.
 *
 * Manages open/close state for 9 different modals:
 * - AddDatasetModal
 * - AddNationalLawModal
 * - AddLayerModal
 * - ImportLayerModal
 * - AddGroupModal
 * - CreateConsultationModal
 * - LayerManagerModal
 * - PrintConfigModal (WypisConfigModal)
 * - EditLayerStyleModal
 *
 * Usage:
 * const { modals, openModal, closeModal } = useModalManager();
 *
 * // Open a modal
 * openModal('importLayer');
 *
 * // Close a modal
 * closeModal('importLayer');
 *
 * // Check if modal is open
 * {modals.importLayer && <ImportLayerModal ... />}
 */

import { useState } from 'react';

/**
 * Modal types available in the system
 */
export type ModalType =
  | 'addDataset'
  | 'addNationalLaw'
  | 'addLayer'
  | 'importLayer'
  | 'addGroup'
  | 'createConsultation'
  | 'layerManager'
  | 'printConfig'
  | 'editLayerStyle'
  | 'deleteLayerConfirm'
  | 'attributeTable';

/**
 * Modal state interface
 * All modals default to closed (false)
 */
export interface ModalState {
  addDataset: boolean;
  addNationalLaw: boolean;
  addLayer: boolean;
  importLayer: boolean;
  addGroup: boolean;
  createConsultation: boolean;
  layerManager: boolean;
  printConfig: boolean;
  editLayerStyle: boolean;
  deleteLayerConfirm: boolean;
  attributeTable: boolean;
}

/**
 * useModalManager Hook
 *
 * Provides centralized modal state management with open/close functions.
 *
 * @returns {object} Modal state and control functions
 * @returns {ModalState} modals - Current state of all modals (true = open, false = closed)
 * @returns {function} openModal - Function to open a specific modal
 * @returns {function} closeModal - Function to close a specific modal
 * @returns {function} closeAllModals - Function to close all modals at once
 */
export function useModalManager() {
  const [modals, setModals] = useState<ModalState>({
    addDataset: false,
    addNationalLaw: false,
    addLayer: false,
    importLayer: false,
    addGroup: false,
    createConsultation: false,
    layerManager: false,
    printConfig: false,
    editLayerStyle: false,
    deleteLayerConfirm: false,
    attributeTable: false,
  });

  /**
   * Open a specific modal
   *
   * @param modal - Modal type to open
   *
   * @example
   * openModal('importLayer');
   */
  const openModal = (modal: ModalType) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  /**
   * Close a specific modal
   *
   * @param modal - Modal type to close
   *
   * @example
   * closeModal('importLayer');
   */
  const closeModal = (modal: ModalType) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  /**
   * Close all modals at once
   *
   * Useful for cleanup or reset operations.
   *
   * @example
   * closeAllModals();
   */
  const closeAllModals = () => {
    setModals({
      addDataset: false,
      addNationalLaw: false,
      addLayer: false,
      importLayer: false,
      addGroup: false,
      createConsultation: false,
      layerManager: false,
      printConfig: false,
      editLayerStyle: false,
      deleteLayerConfirm: false,
      attributeTable: false,
    });
  };

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };
}
