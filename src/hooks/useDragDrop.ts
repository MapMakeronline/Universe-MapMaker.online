/**
 * HOOK DRAG & DROP - ZARZĄDZANIE PRZECIĄGANIEM WARSTW
 *
 * Odpowiada za:
 * - Logikę drag & drop między warstwami i grupami
 * - Wykrywanie pozycji drop (before, after, inside dla grup)
 * - Walidację dozwolonych operacji (nie można wrzucić grupy do swojego dziecka)
 * - Znajdowanie ścieżek elementów w hierarchii
 * - Rekurencyjne wyszukiwanie elementów w zagnieżdżonych strukturach
 * - Zarządzanie stanem przeciągania (draggedItem, dropTarget, dropPosition)
 * - Cleanup po zakończeniu operacji drag & drop
 */
import { useState } from 'react';

export type DropPosition = 'before' | 'after' | 'inside';

export interface DragDropState {
  draggedItem: string | null;
  dropTarget: string | null;
  dropPosition: DropPosition;
  showMainLevelZone: boolean;
}

interface LayerNode {
  id: string;
  dzieci?: LayerNode[];
  [key: string]: any;
}

const MAIN_LEVEL_DROP_ID = '__main_level__';

export const useDragDrop = <T extends LayerNode>(
  items: T[],
  setItems: (items: T[]) => void
) => {
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    draggedItem: null,
    dropTarget: null,
    dropPosition: 'before',
    showMainLevelZone: false
  });

  // Funkcja do znajdowania ścieżki elementu w hierarchii
  const findElementPath = (nodes: T[], targetId: string, currentPath: number[] = []): number[] | null => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === targetId) {
        return [...currentPath, i];
      }
      if (nodes[i].dzieci) {
        const found = findElementPath(nodes[i].dzieci as T[], targetId, [...currentPath, i]);
        if (found) return found;
      }
    }
    return null;
  };

  // Funkcja do rekurencyjnego znajdowania elementu w całej hierarchii
  const findElementById = (nodes: T[], targetId: string): T | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.dzieci) {
        const found = findElementById(node.dzieci as T[], targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Funkcja do usuwania elementu z hierarchii
  const removeElementAtPath = (nodes: T[], path: number[]): { newItems: T[], removedElement: T | null } => {
    if (path.length === 0) return { newItems: nodes, removedElement: null };

    const newItems = [...nodes];
    let current: any = newItems;
    let removedElement: T | null = null;

    // Nawiguj do właściwego miejsca
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]].dzieci) {
        current[path[i]] = { ...current[path[i]], dzieci: [...current[path[i]].dzieci!] };
        current = current[path[i]].dzieci!;
      }
    }

    // Usuń element z ostatniego poziomu
    const finalIndex = path[path.length - 1];
    if (finalIndex >= 0 && finalIndex < current.length) {
      removedElement = current[finalIndex];
      current.splice(finalIndex, 1);
    }

    return { newItems, removedElement };
  };

  // Funkcja do wstawiania elementu w hierarchii
  const insertElementAtPath = (nodes: T[], element: T, path: number[], position: DropPosition): T[] => {
    if (path.length === 0) {
      // Wstawianie na głównym poziomie
      const newItems = [...nodes];
      if (position === 'before') {
        newItems.splice(0, 0, element);
      } else {
        newItems.push(element);
      }
      return newItems;
    }

    const newItems = [...nodes];
    let current: any = newItems;

    // Nawiguj do właściwego miejsca
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]].dzieci) {
        current[path[i]] = { ...current[path[i]], dzieci: [...current[path[i]].dzieci!] };
        current = current[path[i]].dzieci!;
      }
    }

    const finalIndex = path[path.length - 1];

    if (position === 'inside') {
      // Wstawianie do grupy jako dziecko
      const targetNode = current[finalIndex];
      if (targetNode.dzieci !== undefined) {
        current[finalIndex] = {
          ...targetNode,
          dzieci: targetNode.dzieci ? [...targetNode.dzieci, element] : [element],
          rozwinięta: true // Automatycznie rozwiń grupę
        };
      }
    } else if (position === 'before') {
      current.splice(finalIndex, 0, element);
    } else { // 'after'
      current.splice(finalIndex + 1, 0, element);
    }

    return newItems;
  };

  // Sprawdź czy target nie jest dzieckiem dragged item
  const isDescendant = (parentId: string, childId: string): boolean => {
    const findInTree = (nodes: T[], searchId: string): T | null => {
      for (const node of nodes) {
        if (node.id === searchId) return node;
        if (node.dzieci) {
          const found = findInTree(node.dzieci as T[], searchId);
          if (found) return found;
        }
      }
      return null;
    };

    const parent = findInTree(items, parentId);
    if (!parent || !parent.dzieci) return false;

    const checkChildren = (nodes: T[]): boolean => {
      for (const node of nodes) {
        if (node.id === childId) return true;
        if (node.dzieci && checkChildren(node.dzieci as T[])) return true;
      }
      return false;
    };

    return checkChildren(parent.dzieci as T[]);
  };

  const cleanupDragState = () => {
    setDragDropState({
      draggedItem: null,
      dropTarget: null,
      dropPosition: 'before',
      showMainLevelZone: false
    });
  };

  const handleDragStart = (e: any, id: string) => {
    console.log('🟢 Drag started:', id);
    setDragDropState(prev => ({ ...prev, draggedItem: id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    cleanupDragState();
  };

  const handleDragEnter = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔵 Drag enter on:', id);

    if (dragDropState.draggedItem && dragDropState.draggedItem !== id) {
      // Sprawdź czy nie próbujemy przeciągnąć elementu na samego siebie lub na swoje dziecko
      const isValidTarget = !isDescendant(dragDropState.draggedItem, id);
      if (isValidTarget) {
        // Określ pozycję drop na podstawie pozycji myszy względem elementu
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const elementMiddle = rect.top + rect.height / 2;

        const position = mouseY < elementMiddle ? 'before' : 'after';

        setDragDropState(prev => ({
          ...prev,
          dropTarget: id,
          dropPosition: position
        }));
        console.log('✅ Valid target set:', id, 'position:', position);
      } else {
        console.log('❌ Invalid target (descendant):', id);
      }
    }
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    // Sprawdź czy naprawdę opuszczamy element (nie przechodzimy do dziecka)
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeavingElement = (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );

    if (isLeavingElement) {
      setDragDropState(prev => ({
        ...prev,
        dropTarget: null,
        dropPosition: 'before'
      }));
    }
  };

  const handleDragOver = (e: any, id?: string) => {
    e.preventDefault();
    e.stopPropagation();

    // WAŻNE: Bez tego onDrop się nie wykonuje!
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    // Zaawansowana detekcja typu operacji podczas przeciągania
    if (dragDropState.draggedItem && id && id !== dragDropState.draggedItem) {
      const isValidTarget = !isDescendant(dragDropState.draggedItem, id);
      if (isValidTarget) {
        const target = findElementById(items, id);
        if (!target) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const elementTop = rect.top;
        const elementHeight = rect.height;
        const relativeY = (mouseY - elementTop) / elementHeight;

        let position: DropPosition = 'before';

        // Jeśli target to grupa i mysz jest w środkowej części (25%-75%), to group drop
        if (target.dzieci !== undefined && relativeY > 0.25 && relativeY < 0.75) {
          position = 'inside';
        } else {
          // Standardowe before/after dla reordering
          position = relativeY < 0.5 ? 'before' : 'after';
        }

        // Aktualizuj state tylko gdy się zmieni
        if (dragDropState.dropTarget !== id || dragDropState.dropPosition !== position) {
          setDragDropState(prev => ({
            ...prev,
            dropTarget: id,
            dropPosition: position
          }));
        }
      }
    }
  };

  const handleLayerTreeDragOver = (e: any) => {
    if (!dragDropState.draggedItem) return;

    // Sprawdź pozycję myszy względem kontenera
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const leftEdge = rect.left;

    // Jeśli mysz jest w pierwszych 30px od lewej krawędzi, pokaż strefę główną
    const isInLeftZone = mouseX - leftEdge < 30;

    if (isInLeftZone !== dragDropState.showMainLevelZone) {
      setDragDropState(prev => ({
        ...prev,
        showMainLevelZone: isInLeftZone
      }));
    }
  };

  const handleMainLevelDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    if (dragDropState.draggedItem && dragDropState.dropTarget !== MAIN_LEVEL_DROP_ID) {
      setDragDropState(prev => ({
        ...prev,
        dropTarget: MAIN_LEVEL_DROP_ID,
        dropPosition: 'after' // Nie używane, ale dla kompatybilności
      }));
    }
  };

  const handleDrop = (e: any, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔴 ADVANCED DROP! Target:', targetId, 'Dragged:', dragDropState.draggedItem);

    if (!dragDropState.draggedItem || dragDropState.draggedItem === targetId) {
      console.log('❌ Invalid drop');
      setDragDropState(prev => ({ ...prev, dropTarget: null, showMainLevelZone: false }));
      return;
    }

    // Specjalna obsługa dla strefy głównego poziomu
    if (targetId === MAIN_LEVEL_DROP_ID) {
      console.log('🏠 DROP TO MAIN LEVEL!');

      const draggedPath = findElementPath(items, dragDropState.draggedItem);
      if (!draggedPath) {
        console.log('❌ Could not find dragged element path');
        setDragDropState(prev => ({ ...prev, dropTarget: null }));
        return;
      }

      let newItems = [...items];

      // Usuń element z aktualnej pozycji
      const { newItems: itemsAfterRemoval, removedElement } = removeElementAtPath(newItems, draggedPath);
      if (!removedElement) {
        console.log('❌ Could not remove element');
        setDragDropState(prev => ({ ...prev, dropTarget: null }));
        return;
      }

      // Dodaj na koniec głównego poziomu
      newItems = [...itemsAfterRemoval, removedElement];

      console.log('✅ Main level drop completed');
      setItems(newItems);
      cleanupDragState();
      return;
    }

    // Sprawdź czy nie próbujemy wrzucić grupy do jej własnego dziecka
    if (isDescendant(dragDropState.draggedItem, targetId)) {
      console.log('❌ Cannot drop parent into its own child');
      cleanupDragState();
      return;
    }

    // Znajdź ścieżki do elementów
    const draggedPath = findElementPath(items, dragDropState.draggedItem);
    const targetPath = findElementPath(items, targetId);

    if (!draggedPath || !targetPath) {
      console.log('❌ Could not find element paths');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    let newItems = [...items];

    // 1. Usuń przeciągnięty element
    const { newItems: itemsAfterRemoval, removedElement } = removeElementAtPath(newItems, draggedPath);
    if (!removedElement) {
      console.log('❌ Could not remove dragged element');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    console.log('📦 Removed element:', removedElement.id);
    newItems = itemsAfterRemoval;

    // 2. Znajdź nową ścieżkę do targetu (po usunięciu elementu)
    const newTargetPath = findElementPath(newItems, targetId);
    if (!newTargetPath) {
      console.log('❌ Could not find target after removal');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    // 3. Wstaw element w nowym miejscu
    if (dragDropState.dropPosition === 'inside') {
      console.log('📁 Moving to group:', targetId);
      newItems = insertElementAtPath(newItems, removedElement, newTargetPath, 'inside');
    } else {
      console.log('📋 Reordering/moving between groups:', dragDropState.dropPosition);
      newItems = insertElementAtPath(newItems, removedElement, newTargetPath, dragDropState.dropPosition);
    }

    console.log('✅ Hierarchy operation completed');
    setItems(newItems);

    cleanupDragState();
  };

  const handleDropAtEnd = (e: any, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragDropState.draggedItem) {
      console.log('❌ No dragged item for end drop');
      return;
    }

    // Sprawdź czy nie próbujemy wrzucić grupy do jej własnego dziecka
    if (isDescendant(dragDropState.draggedItem, groupId)) {
      console.log('❌ Cannot drop parent into its own child');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    console.log(`🎯 Advanced drop at end of group: ${groupId}, item: ${dragDropState.draggedItem}`);

    // Znajdź ścieżki
    const draggedPath = findElementPath(items, dragDropState.draggedItem);
    const groupPath = findElementPath(items, groupId);

    if (!draggedPath || !groupPath) {
      console.log('❌ Could not find element paths');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    let newItems = [...items];

    // Usuń element z aktualnej pozycji
    const { newItems: itemsAfterRemoval, removedElement } = removeElementAtPath(newItems, draggedPath);
    if (!removedElement) {
      console.log('❌ Could not remove element');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    newItems = itemsAfterRemoval;

    // Znajdź nową ścieżkę do grupy (po usunięciu elementu)
    const newGroupPath = findElementPath(newItems, groupId);
    if (!newGroupPath) {
      console.log('❌ Could not find group after removal');
      setDragDropState(prev => ({ ...prev, dropTarget: null }));
      return;
    }

    // Wstaw na koniec grupy
    newItems = insertElementAtPath(newItems, removedElement, newGroupPath, 'inside');

    console.log('✅ Advanced end drop completed');
    setItems(newItems);

    cleanupDragState();
  };

  return {
    dragDropState,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleLayerTreeDragOver,
    handleMainLevelDragOver,
    handleDrop,
    handleDropAtEnd
  };
};
