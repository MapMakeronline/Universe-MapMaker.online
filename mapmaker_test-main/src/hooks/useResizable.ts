/**
 * HOOK DO OBSŁUGI ZMIANY ROZMIARU KOMPONENTÓW
 * 
 * Odpowiada za:
 * - Zarządzanie stanem szerokości/wysokości komponentu
 * - Obsługę eventów mouse down/move/up dla resize
 * - Ograniczenia minimalnej i maksymalnej szerokości
 * - Przywracanie domyślnego rozmiaru
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

interface UseResizableReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  resetWidth: () => void;
}

export const useResizable = ({
  initialWidth,
  minWidth = 200,
  maxWidth = 600,
  onResize,
  onResizeStart,
  onResizeEnd
}: UseResizableOptions): UseResizableReturn => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(initialWidth);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, startWidthRef.current + deltaX)
    );

    setWidth(newWidth);
    onResize?.(newWidth);
  }, [isResizing, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    onResizeEnd?.();
  }, [onResizeEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    onResizeStart?.();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width, onResizeStart]);

  const resetWidth = useCallback(() => {
    setWidth(initialWidth);
    onResize?.(initialWidth);
  }, [initialWidth, onResize]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    handleMouseDown,
    resetWidth
  };
};