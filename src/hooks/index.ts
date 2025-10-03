/**
 * HOOKS INDEX - ZBIÓR UNIWERSALNYCH HOOKÓW
 *
 * Odpowiada za:
 * - useResizable - zarządzanie zmianą rozmiaru komponentów
 * - useDragDrop - zarządzanie przeciąganiem warstw
 * - Centralne miejsce eksportu wszystkich hooków
 */

export { useResizable } from './useResizable';
export { useDragDrop } from './useDragDrop';
export type { DragDropState, DropPosition } from './useDragDrop';
