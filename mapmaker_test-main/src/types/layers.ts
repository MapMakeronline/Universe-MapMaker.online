/**
 * TYPY TYPESCRIPT - DEFINICJE TYPÓW DLA WARSTW
 * 
 * Odpowiada za:
 * - Definicję interfejsów dla wszystkich typów warstw (Warstwa, grupa, raster, wektor)
 * - Typy dla drag & drop (DragDropState, DropPosition)
 * - Interfejsy komponentów UI (props dla Sidebar, LayerTree, PropertiesPanel)
 * - Typy dla filtrów i wyszukiwania
 * - Enumeracje i unie typów dla różnych stanów aplikacji
 * - Type safety dla całej aplikacji
 */

// import { DragEvent } from 'react'; // Tymczasowo wyłączone z powodu problemów z typami

// Tymczasowy alias dla eventów drag & drop
type DragEventType = any;

export interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  rozwinięta?: boolean;
  dzieci?: Warstwa[];
}

export type FilterType = 'wszystko' | 'wektor' | 'raster' | 'wms';

export type DropPosition = 'before' | 'after' | 'inside';

export type DropOperation = 'reorder' | 'move-to-group' | 'move-between-groups';

export interface ExpandedSections {
  'informacje-ogolne': boolean;
  'pobieranie': boolean;
  'widocznosc': boolean;
  'informacje-szczegolowe': boolean;
  'informacje-szczegolowe-grupa': boolean;
  'uslugi': boolean;
  'metadane': boolean;
  'inne-projekty': boolean;
  // Sekcje dla warstwy (z prefiksem warstwy-)
  'warstwa-informacje-ogolne': boolean;
  'warstwa-pobieranie': boolean;
  'warstwa-widocznosc': boolean;
  'warstwa-informacje-szczegolowe': boolean;
  'warstwa-styl-warstwy': boolean;
  // Sekcje dla grup (z prefiksem grupa-)
  'grupa-informacje-ogolne': boolean;
  'grupa-pobieranie': boolean;
  'grupa-widocznosc': boolean;
  'grupa-informacje-szczegolowe': boolean;
  [key: string]: boolean;
}

export interface CheckboxStates {
  // Właściwości grupy - sekcja Widoczność
  grupaDomyslneWyswietlanie: boolean;
  
  // Właściwości warstwy - sekcja Widoczność
  warstwaDomyslneWyswietlanie: boolean;
  warstwaWidocznoscOdSkali: boolean;
  warstwaWidocznoscTrybOpublikowany: boolean;
  [key: string]: boolean;
}

export interface LayerManagementHookReturn {
  warstwy: Warstwa[];
  setWarstwy: (warstwy: Warstwa[]) => void;
  selectedLayer: Warstwa | null;
  setSelectedLayer: (layer: Warstwa | null) => void;
  toggleVisibility: (id: string) => void;
  toggleExpansion: (id: string) => void;
  findLayerById: (layers: Warstwa[], id: string) => Warstwa | null;
  findParentGroup: (layers: Warstwa[], childId: string) => Warstwa | null;
  filterWarstwy: (warstwy: Warstwa[], filter: string) => Warstwa[];
}

export interface DragDropState {
  draggedItem: string | null;
  dropTarget: string | null;
  dropPosition: DropPosition;
  showMainLevelZone: boolean;
}

export interface LayerTreeProps {
  warstwy: Warstwa[];
  selectedLayer: Warstwa | null;
  searchFilter: string;
  dragDropState: DragDropState;
  onLayerSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onDragStart: (e: DragEventType, id: string) => void;
  onDragEnd: () => void;
  onDragEnter: (e: DragEventType, id: string) => void;
  onDragLeave: (e: DragEventType) => void;
  onDragOver: (e: DragEventType, id?: string) => void;
  onDrop: (e: DragEventType, targetId: string) => void;
  onDropAtEnd: (e: DragEventType, groupId: string) => void;
  onLayerTreeDragOver: (e: DragEventType) => void;
  onMainLevelDragOver: (e: DragEventType) => void;
}

export interface PropertiesPanelProps {
  selectedLayer: Warstwa | null;
  warstwy: Warstwa[];
  expandedSections: ExpandedSections;
  checkboxStates: CheckboxStates;
  onToggleSection: (sectionId: string) => void;
  onToggleCheckbox: (checkboxName: string) => void;
  onClosePanel: () => void;
  onEditLayerStyle: () => void;
  onManageLayer: () => void;
  onLayerLabeling: () => void;
  findParentGroup: (layers: Warstwa[], childId: string) => Warstwa | null;
}

export interface SearchBarProps {
  searchFilter: string;
  onSearchChange: (filter: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterMenuOpen: boolean;
  onFilterMenuToggle: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export interface ToolbarProps {
  onAddInspireDataset: () => void;
  onAddNationalLaw: () => void;
  onAddLayer: () => void;
  onImportLayer: () => void;
  onAddGroup: () => void;
  onRemoveLayer: () => void;
  onCreateConsultation: () => void;
  onLayerManager: () => void;
  onPrintConfig: () => void;
}

export interface BasemapSelectorProps {
  selectedBasemap: string;
  onBasemapChange: (basemap: string) => void;
}

export interface SidebarProps {
  collapsed: boolean;
  warstwy: Warstwa[];
  selectedLayer: Warstwa | null;
  searchFilter: string;
  selectedFilter: FilterType;
  filterMenuOpen: boolean;
  expandedSections: ExpandedSections;
  checkboxStates: CheckboxStates;
  dragDropState: DragDropState;
  selectedBasemap: string;
  onToggle: () => void;
  onLayerSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onSearchChange: (filter: string) => void;
  onFilterChange: (filter: FilterType) => void;
  onFilterMenuToggle: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleSection: (sectionId: string) => void;
  onToggleCheckbox: (checkboxName: string) => void;
  onClosePanelSelection: () => void;
  onEditLayerStyle: () => void;
  onManageLayer: () => void;
  onLayerLabeling: () => void;
  onBasemapChange: (basemap: string) => void;
  onDragStart: (e: DragEventType, id: string) => void;
  onDragEnd: () => void;
  onDragEnter: (e: DragEventType, id: string) => void;
  onDragLeave: (e: DragEventType) => void;
  onDragOver: (e: DragEventType, id?: string) => void;
  onDrop: (e: DragEventType, targetId: string) => void;
  onDropAtEnd: (e: DragEventType, groupId: string) => void;
  onLayerTreeDragOver: (e: DragEventType) => void;
  onMainLevelDragOver: (e: DragEventType) => void;
  findParentGroup: (layers: Warstwa[], childId: string) => Warstwa | null;
  // Toolbar props
  onAddInspireDataset: () => void;
  onAddNationalLaw: () => void;
  onAddLayer: () => void;
  onImportLayer: () => void;
  onAddGroup: () => void;
  onRemoveLayer: () => void;
  onCreateConsultation: () => void;
  onLayerManager: () => void;
  onPrintConfig: () => void;
}
