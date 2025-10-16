/**
 * Layer Converter - Konwersja między LayerNode (Redux) a Warstwa (LeftPanel)
 *
 * Tymczasowe rozwiązanie do czasu pełnego refaktoru LeftPanel
 */

import { LayerNode } from '@/types-app/layers';

// Legacy interface from LeftPanel
export interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

/**
 * Konwertuje LayerNode (Redux) na Warstwa (LeftPanel)
 */
export function layerNodeToWarstwa(node: LayerNode, expanded: boolean = false): Warstwa {
  return {
    id: node.id,
    nazwa: node.name,
    widoczna: node.visible,
    typ: node.type === 'group' ? 'grupa' : (node.sourceType === 'raster' ? 'raster' : 'wektor'),
    dzieci: node.children?.map(child => layerNodeToWarstwa(child, expanded)),
    rozwinięta: node.type === 'group' ? expanded : undefined,
  };
}

/**
 * Konwertuje tablicę LayerNode na tablicę Warstwa
 */
export function layerNodesToWarstwy(nodes: LayerNode[], expandedGroups: string[] = []): Warstwa[] {
  return nodes.map(node => {
    const expanded = expandedGroups.includes(node.id);
    return layerNodeToWarstwa(node, expanded);
  });
}

/**
 * Konwertuje Warstwa (LeftPanel) na LayerNode (Redux)
 */
export function warstwaToLayerNode(warstwa: Warstwa): LayerNode {
  return {
    id: warstwa.id,
    name: warstwa.nazwa,
    type: warstwa.typ === 'grupa' ? 'group' : 'layer',
    visible: warstwa.widoczna,
    opacity: 1,
    sourceType: warstwa.typ === 'raster' ? 'raster' : 'vector',
    children: warstwa.dzieci?.map(warstwaToLayerNode),
  };
}
