/**
 * PROPERTY MODALS HOOK
 *
 * Manages modal state for PropertiesPanel component.
 * Extracted to reduce component complexity and improve reusability.
 */
'use client';

import { useState } from 'react';

export type PropertyModalType = 'publish' | 'download';

interface ModalState {
  publish: boolean;
  download: boolean;
}

export function usePropertyModals() {
  const [modals, setModals] = useState<ModalState>({
    publish: false,
    download: false,
  });

  const openModal = (modal: PropertyModalType) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: PropertyModalType) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const closeAllModals = () => {
    setModals({
      publish: false,
      download: false,
    });
  };

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };
}
