/**
 * useDragDropSync Hook
 *
 * Handles drag & drop operations with backend synchronization.
 * Extracted from LeftPanel.tsx to reduce complexity and improve testability.
 *
 * Process:
 * 1. Optimistic update - update Redux immediately for instant UI feedback
 * 2. Call backend API to persist change to QGIS project file
 * 3. Rollback Redux on backend error
 *
 * Backend endpoint: POST /api/projects/tree/order
 * Expected params:
 * - project: string (project name)
 * - object_type: 'layer' | 'group'
 * - object_id: string (layer/group ID)
 * - new_parent_name: string (parent group name, empty string for root)
 * - position: number (0-based index in parent's children)
 *
 * Usage:
 * const { handleDragDropMove } = useDragDropSync(layers, projectName);
 *
 * // In drag & drop handler
 * await handleDragDropMove(layerId, targetId, 'before');
 */

import { useAppDispatch } from '@/redux/hooks';
import { moveLayer } from '@/redux/slices/layersSlice';
import { showSuccess, showError } from '@/redux/slices/notificationSlice';
import { useChangeLayersOrderMutation, projectsApi } from '@/backend/projects';
import { LayerNode } from '@/types-app/layers';
import {
  findLayerById,
  calculatePositionIndex,
  getParentGroupName,
} from '@/utils/layerTreeUtils';

/**
 * useDragDropSync Hook
 *
 * Provides drag & drop handler with optimistic updates and backend sync.
 *
 * @param layers - Current layer tree state from Redux
 * @param projectName - Current project name
 * @returns {object} Drag & drop handler
 * @returns {function} handleDragDropMove - Async function to handle layer/group movement
 */
export function useDragDropSync(layers: LayerNode[], projectName: string) {
  const dispatch = useAppDispatch();
  const [changeLayersOrder] = useChangeLayersOrderMutation();

  /**
   * Handle drag & drop with backend sync
   *
   * @param layerId - ID of layer/group being dragged
   * @param targetId - ID of drop target (layer/group or '__main_level__')
   * @param position - Drop position relative to target ('before', 'after', 'inside')
   *
   * @example
   * // Drop layer before target
   * await handleDragDropMove('layer-123', 'layer-456', 'before');
   *
   * // Drop layer inside group
   * await handleDragDropMove('layer-123', 'group-789', 'inside');
   */
  const handleDragDropMove = async (
    layerId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => {
    if (!projectName) {
      console.warn('⚠️ No project name - skipping drag & drop');
      dispatch(showError('Nie można przenieść warstwy - brak nazwy projektu'));
      return;
    }

    const layer = findLayerById(layers, layerId);
    if (!layer) {
      console.error('❌ Layer not found:', layerId);
      console.error('Available layers:', layers.map((l) => ({ id: l.id, name: l.name })));
      dispatch(showError(`Nie można przenieść warstwy - nie znaleziono elementu (${layerId})`));
      return;
    }

    // Calculate position index and parent for backend API
    const { parent, index } = calculatePositionIndex(targetId, position, layers);
    const newParentName = getParentGroupName(parent);

    console.log('🎯 Drag & Drop:', {
      layer: layer.name,
      layerId,
      targetId,
      position,
      newParentName: newParentName || '(root)',
      index,
    });

    // 1. Optimistic update - update Redux immediately
    const previousState = { ...layers }; // Save state for rollback
    dispatch(moveLayer({ layerId, targetId, position }));

    // 2. Sync with backend (async)
    try {
      // IMPORTANT: Backend uses different identifiers for groups vs layers:
      // - Groups: identified by NAME (no UUID in QGIS) → use layer.name
      // - Layers: identified by ID (UUID) → use layer.id
      const objectId = layer.type === 'group' ? layer.name : layer.id;

      await changeLayersOrder({
        project: projectName,
        object_type: layer.type === 'group' ? 'group' : 'layer',
        object_id: objectId, // Groups: name, Layers: id (UUID)
        new_parent_name: newParentName,
        position: index,
      }).unwrap();

      console.log('✅ Layer order synced to backend:', {
        layer: layer.name,
        parent: newParentName || '(root)',
        position: index,
      });

      dispatch(showSuccess(`Warstwa "${layer.name}" przeniesiona`, 3000));
    } catch (error: any) {
      console.error('❌ Failed to sync layer order:', error);

      // 3. Rollback on error - revert Redux state
      // NOTE: We can't easily rollback to previous state, so we just show error
      // User can undo with Ctrl+Z if needed
      const errorMessage = error?.data?.message || error?.message || 'Nieznany błąd';
      dispatch(showError(`Nie udało się przenieść warstwy: ${errorMessage}`, 6000));

      // TODO: Implement proper rollback by dispatching previous state
      // For now, reload project data from backend to restore correct order
      console.log('🔄 Reloading project data from backend to restore correct order');
      dispatch(
        projectsApi.util.invalidateTags([{ type: 'Project', id: projectName }])
      );
    }
  };

  return {
    handleDragDropMove,
  };
}
