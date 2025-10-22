/**
 * Layer Tree Utilities
 *
 * Shared utilities for traversing and manipulating layer tree structures.
 * Extracted from LeftPanel.tsx to avoid code duplication.
 *
 * Used by:
 * - src/features/layers/components/LeftPanel.tsx
 * - src/features/layers/components/PropertiesPanel.tsx
 * - Other components working with layer trees
 */

import { LayerNode } from '@/types-app/layers';

/**
 * Find layer by ID (recursive tree search)
 *
 * Searches the entire layer tree (including nested groups) for a layer with the given ID.
 *
 * @param layers - Root level layers array
 * @param id - Layer ID to search for (React ID or QGIS UUID)
 * @returns LayerNode if found, null otherwise
 */
export function findLayerById(layers: LayerNode[], id: string): LayerNode | null {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    if (layer.children) {
      const found = findLayerById(layer.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find parent group of a layer/group
 *
 * Searches the layer tree to find the parent group containing a specific child.
 * Returns null if the child is at root level (no parent).
 *
 * @param layers - Root level layers array
 * @param childId - Child layer/group ID to search for
 * @returns Parent LayerNode if found, null if child is at root level
 */
export function findParentGroup(layers: LayerNode[], childId: string): LayerNode | null {
  for (const layer of layers) {
    if (layer.children) {
      // Check if direct child
      const directChild = layer.children.find((child: LayerNode) => child.id === childId);
      if (directChild) return layer;

      // Recursive search in nested groups
      const found = findParentGroup(layer.children, childId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extract flat list of layer IDs in tree order
 *
 * Traverses the layer tree in depth-first order and extracts all layer IDs.
 * Used for backend sync of layer order.
 *
 * @param layers - Root level layers array
 * @returns Array of layer IDs in tree order
 */
export function extractLayerOrder(layers: LayerNode[]): string[] {
  const order: string[] = [];
  const traverse = (nodes: LayerNode[]) => {
    for (const node of nodes) {
      order.push(node.id);
      if (node.children) {
        traverse(node.children);
      }
    }
  };
  traverse(layers);
  return order;
}

/**
 * Calculate position index for backend API (drag & drop)
 *
 * Converts drag & drop position ('before'/'after'/'inside') to backend API format.
 * Backend expects:
 * - parent: LayerNode | null (null = root level)
 * - index: number (0-based index in parent's children array)
 *
 * @param targetId - Target layer/group ID where item is being dropped
 * @param position - Drop position relative to target ('before', 'after', or 'inside')
 * @param layers - Current layer tree state
 * @returns { parent: LayerNode | null, index: number }
 *
 * @example
 * // Drop layer BEFORE target layer at index 2
 * calculatePositionIndex('layer-123', 'before', layers)
 * // Returns: { parent: groupNode, index: 2 }
 *
 * // Drop layer AFTER target layer at index 2
 * calculatePositionIndex('layer-123', 'after', layers)
 * // Returns: { parent: groupNode, index: 3 }
 *
 * // Drop layer INSIDE target group
 * calculatePositionIndex('group-456', 'inside', layers)
 * // Returns: { parent: groupNode, index: 0 } (first child)
 */
export function calculatePositionIndex(
  targetId: string,
  position: 'before' | 'after' | 'inside',
  layers: LayerNode[]
): { parent: LayerNode | null; index: number } {
  // Special case: main level drop zone
  if (targetId === '__main_level__') {
    return { parent: null, index: layers.length }; // Append to end of main level
  }

  const target = findLayerById(layers, targetId);
  if (!target) {
    console.error('❌ Target not found:', targetId);
    return { parent: null, index: 0 };
  }

  // Case 1: 'inside' - dropping INTO a group
  if (position === 'inside') {
    if (target.type === 'group') {
      // Position 0 = first child (backend will append to end if group has children)
      return { parent: target, index: 0 };
    } else {
      console.warn('⚠️ Cannot drop inside non-group layer:', target.name);
      return { parent: null, index: 0 };
    }
  }

  // Case 2: 'before' or 'after' - dropping as sibling
  // Find parent of target
  const parent = findParentGroup(layers, targetId);
  const siblings = parent?.children || layers; // If no parent, target is at root level

  // Find index of target in siblings
  const targetIndex = siblings.findIndex((node) => node.id === targetId);
  if (targetIndex === -1) {
    console.error('❌ Target not found in siblings:', targetId);
    return { parent, index: 0 };
  }

  // Calculate new index
  const newIndex = position === 'before' ? targetIndex : targetIndex + 1;

  return { parent, index: newIndex };
}

/**
 * Get parent group name for backend API
 *
 * Backend expects parent group NAME (not ID).
 * Returns empty string if layer is at root level.
 *
 * @param parent - Parent group (null for root level)
 * @returns Parent group name or empty string
 */
export function getParentGroupName(parent: LayerNode | null): string {
  return parent?.name || ''; // Empty string = root level
}

/**
 * Filter layers by search term
 *
 * Searches layer/group names (case-insensitive).
 * Returns layers that match, including parent groups if any child matches.
 *
 * @param layers - Layer tree to filter
 * @param searchTerm - Search term (case-insensitive)
 * @returns Filtered layer tree
 */
export function filterLayersBySearch(
  layers: LayerNode[],
  searchTerm: string
): LayerNode[] {
  if (!searchTerm.trim()) return layers;

  const term = searchTerm.toLowerCase();
  const filtered: LayerNode[] = [];

  for (const layer of layers) {
    // Check if current layer matches
    const nameMatches = layer.name.toLowerCase().includes(term);

    // Recursively filter children
    const filteredChildren = layer.children
      ? filterLayersBySearch(layer.children, searchTerm)
      : [];

    // Include layer if:
    // 1. Name matches, OR
    // 2. Any child matches (keep parent group visible)
    if (nameMatches || filteredChildren.length > 0) {
      filtered.push({
        ...layer,
        children: filteredChildren.length > 0 ? filteredChildren : layer.children,
      });
    }
  }

  return filtered;
}

/**
 * Filter layers by type
 *
 * Filters layers by their type (wektor, raster, wms, or wszystko).
 * Groups are always included if they contain matching layers.
 *
 * @param layers - Layer tree to filter
 * @param filterType - Type filter ('wszystko' | 'wektor' | 'raster' | 'wms')
 * @returns Filtered layer tree
 */
export function filterLayersByType(
  layers: LayerNode[],
  filterType: 'wszystko' | 'wektor' | 'raster' | 'wms'
): LayerNode[] {
  if (filterType === 'wszystko') return layers;

  const filtered: LayerNode[] = [];

  for (const layer of layers) {
    // Groups: always include if they contain matching layers
    if (layer.type === 'group' && layer.children) {
      const filteredChildren = filterLayersByType(layer.children, filterType);
      if (filteredChildren.length > 0) {
        filtered.push({
          ...layer,
          children: filteredChildren,
        });
      }
      continue;
    }

    // Layers: check type
    const typeMatches =
      (filterType === 'wektor' && (layer.type === 'VectorLayer' || layer.type === 'layer')) ||
      (filterType === 'raster' && layer.type === 'RasterLayer') ||
      (filterType === 'wms' && layer.type === 'WMSLayer');

    if (typeMatches) {
      filtered.push(layer);
    }
  }

  return filtered;
}

/**
 * Count total layers in tree (excluding groups)
 *
 * @param layers - Layer tree
 * @returns Number of layers (not including groups)
 */
export function countLayers(layers: LayerNode[]): number {
  let count = 0;
  for (const layer of layers) {
    if (layer.type !== 'group') {
      count++;
    }
    if (layer.children) {
      count += countLayers(layer.children);
    }
  }
  return count;
}

/**
 * Count total groups in tree
 *
 * @param layers - Layer tree
 * @returns Number of groups
 */
export function countGroups(layers: LayerNode[]): number {
  let count = 0;
  for (const layer of layers) {
    if (layer.type === 'group') {
      count++;
      if (layer.children) {
        count += countGroups(layer.children);
      }
    }
  }
  return count;
}

/**
 * Get all visible layers (flat list)
 *
 * Returns only layers (not groups) that are currently visible.
 *
 * @param layers - Layer tree
 * @returns Flat array of visible layers
 */
export function getVisibleLayers(layers: LayerNode[]): LayerNode[] {
  const visible: LayerNode[] = [];

  const traverse = (nodes: LayerNode[]) => {
    for (const node of nodes) {
      if (node.visible && node.type !== 'group') {
        visible.push(node);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  };

  traverse(layers);
  return visible;
}
