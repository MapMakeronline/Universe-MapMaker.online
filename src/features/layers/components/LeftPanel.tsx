'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { Toolbar } from './Toolbar';
import { SearchBar } from './SearchBar';
import { LayerTree } from './LayerTree';
import { PropertiesPanel } from './PropertiesPanel';
import AddDatasetModal from '../modals/AddDatasetModal';
import AddNationalLawModal from '../modals/AddNationalLawModal';
import AddLayerModal from '../modals/AddLayerModal';
import ImportLayerModal from '../modals/ImportLayerModal';
import AddGroupModal from '../modals/AddGroupModal';
import CreateConsultationModal from '../modals/CreateConsultationModal';
import LayerManagerModal from '../modals/LayerManagerModal';
import WypisConfigModal from '../../mapa/komponenty/WypisConfigModal';
import EditLayerStyleModal from '../modals/EditLayerStyleModal';
import { useResizable, useDragDrop } from '@/hooks/index';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { LayerNode } from '@/types-app/layers';
import {
  toggleLayerVisibility,
  toggleGroupExpanded,
  toggleGroupVisibilityCascade,
  expandAllGroups,
  collapseAllGroups,
  deleteLayer,
  moveLayer
} from '@/redux/slices/layersSlice';
import { useGetProjectDataQuery, projectsApi, useChangeLayersOrderMutation } from '@/backend/projects';
import {
  useAddGeoJsonLayerMutation,
  useAddShpLayerMutation,
  useAddGmlLayerMutation,
  useAddRasterLayerMutation,
  useSetLayerVisibilityMutation,
} from '@/backend/layers';
import {
  useAddGroupMutation,
  useRemoveGroupsAndLayersMutation,
} from '@/backend/groups';
import { showSuccess, showError, showInfo } from '@/redux/slices/notificationSlice';

// Types
type FilterType = 'wszystko' | 'wektor' | 'raster' | 'wms';

const SIDEBAR_CONFIG = {
  sidebar: {
    width: '320px',
    minWidth: '280px',
    maxWidth: '600px',
    headerHeight: '50px',
  },
  typography: {
    titleFontSize: '18px',
  },
  elements: {
    headerPadding: 2,
  }
};

interface LeftPanelProps {
  isOwner?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  width?: number;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  isOwner = true,
  isCollapsed: externalCollapsed,
  onToggle: externalOnToggle,
  width: externalWidth
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // DEBUG: Log isOwner prop
  console.log('🔧 LeftPanel received props:', { isOwner, externalCollapsed });

  // Get layers and expandedGroups from Redux
  const reduxLayers = useAppSelector((state) => state.layers.layers);
  const expandedGroups = useAppSelector((state) => state.layers.expandedGroups);

  // Backend mutations
  const [changeLayersOrder] = useChangeLayersOrderMutation();
  const [setLayerVisibility] = useSetLayerVisibilityMutation();
  const [addGeoJsonLayer] = useAddGeoJsonLayerMutation();
  const [addShpLayer] = useAddShpLayerMutation();
  const [addGmlLayer] = useAddGmlLayerMutation();
  const [addRasterLayer] = useAddRasterLayerMutation();
  const [addGroup] = useAddGroupMutation();
  const [removeGroupsAndLayers] = useRemoveGroupsAndLayersMutation();

  // Get current project name from URL
  const projectName = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('project') || ''
    : '';

  // Fetch project data to get the display name
  const { data: projectData } = useGetProjectDataQuery(
    { project: projectName, published: false },
    { skip: !projectName }
  );

  // Get current project info from Redux (includes custom_project_name)
  const currentProject = useAppSelector((state) => state.projects.currentProject);

  // Use external control if provided, otherwise use internal state
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const sidebarCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleSidebar = externalOnToggle || (() => setInternalCollapsed(!internalCollapsed));
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('wszystko');
  const [selectedBasemap, setSelectedBasemap] = useState('google-maps');
  const [selectedLayer, setSelectedLayer] = useState<LayerNode | null>(null);

  // Modal states
  const [addDatasetModalOpen, setAddDatasetModalOpen] = useState(false);
  const [addNationalLawModalOpen, setAddNationalLawModalOpen] = useState(false);
  const [addLayerModalOpen, setAddLayerModalOpen] = useState(false);
  const [importLayerModalOpen, setImportLayerModalOpen] = useState(false);
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [createConsultationModalOpen, setCreateConsultationModalOpen] = useState(false);
  const [layerManagerModalOpen, setLayerManagerModalOpen] = useState(false);
  const [printConfigModalOpen, setPrintConfigModalOpen] = useState(false);
  const [editLayerStyleModalOpen, setEditLayerStyleModalOpen] = useState(false);

  // Wypis configurations state
  const [existingWypisConfigs, setExistingWypisConfigs] = useState<any[]>([]);

  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'informacje-ogolne': false,
    'pobieranie': false,
    'widocznosc': false,
    'informacje-szczegolowe': false,
    'uslugi': false,
    'metadane': false,
    'inne-projekty': false,
    'warstwa-informacje-ogolne': false,
    'warstwa-pobieranie': false,
    'warstwa-widocznosc': false,
    'warstwa-informacje-szczegolowe': false,
    'warstwa-styl-warstwy': false,
    'grupa-informacje-ogolne': false,
    'grupa-pobieranie': false,
    'grupa-widocznosc': false,
    'grupa-informacje-szczegolowe': false
  });

  const [checkboxStates, setCheckboxStates] = useState<{[key: string]: boolean}>({
    grupaDomyslneWyswietlanie: true,
    warstwaDomyslneWyswietlanie: true,
    warstwaWidocznoscOdSkali: false,
    warstwaWidocznoscTrybOpublikowany: true
  });

  // Layer state - NO local state, use Redux directly!
  const layers = reduxLayers; // Direct reference to Redux state

  // Hooks - use external width if provided
  const resizable = useResizable({
    initialWidth: externalWidth || parseInt(SIDEBAR_CONFIG.sidebar.width),
    minWidth: parseInt(SIDEBAR_CONFIG.sidebar.minWidth),
    maxWidth: parseInt(SIDEBAR_CONFIG.sidebar.maxWidth),
  });
  const width = externalWidth || resizable.width;
  const isResizing = resizable.isResizing;
  const handleMouseDown = resizable.handleMouseDown;

  // Helper: Extract flat list of layer IDs in order (for backend)
  const extractLayerOrder = (layers: LayerNode[]): string[] => {
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
  };

  /**
   * Calculate position index for backend API
   *
   * Backend expects 0-based index in the target parent's children array.
   * This function converts drag & drop position ('before'/'after'/'inside') to index.
   *
   * @param targetId - Target layer/group ID
   * @param position - Drop position relative to target
   * @param layers - Current layer tree
   * @returns { parent: LayerNode | null, index: number }
   */
  const calculatePositionIndex = (
    targetId: string,
    position: 'before' | 'after' | 'inside',
    layers: LayerNode[]
  ): { parent: LayerNode | null; index: number } => {
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
  };

  /**
   * Find parent group name for backend API
   *
   * Backend expects parent group NAME (not ID).
   * Returns empty string if layer is at root level.
   *
   * @param parent - Parent group (null for root level)
   * @returns Parent group name or empty string
   */
  const getParentGroupName = (parent: LayerNode | null): string => {
    return parent?.name || ''; // Empty string = root level
  };

  // Helper: Sync layer order with backend
  const syncLayerOrderWithBackend = async () => {
    if (!projectName) {
      console.warn('⚠️ No project name - skipping backend sync');
      dispatch(showError('Nie można zapisać - brak nazwy projektu'));
      return;
    }

    // TODO: Backend endpoint /api/projects/change_layers_order does not exist (404)
    // This endpoint should save layer order to QGS file, but it's not implemented yet.
    // For now, layer order is stored only in Redux state (client-side).
    // When backend implements this endpoint, uncomment the code below.

    /*
    try {
      const order = extractLayerOrder(reduxLayers);
      console.log('💾 Syncing layer order to backend:', order);

      await changeLayersOrder({
        project_name: projectName,
        order,
      }).unwrap();

      console.log('✅ Layer order synced successfully');
      dispatch(showSuccess('Kolejność warstw zapisana', 3000));
    } catch (error) {
      console.error('❌ Failed to sync layer order:', error);
      dispatch(showError('Nie udało się zapisać kolejności warstw', 6000));
    }
    */

    // Temporary: Just log to console (Redux state is already updated by drag & drop)
    const order = extractLayerOrder(reduxLayers);
    console.log('💾 Layer order updated (client-side only, backend sync disabled):', order);
  };

  /**
   * Drag & Drop handler with backend sync
   *
   * Process:
   * 1. Optimistic update - update Redux immediately for instant UI feedback
   * 2. Call backend API to persist change to QGS file
   * 3. Rollback Redux on backend error
   *
   * Backend endpoint: POST /api/projects/tree/order
   * Expected params:
   * - project: string (project name)
   * - object_type: 'layer' | 'group'
   * - object_id: string (layer/group ID)
   * - new_parent_name: string (parent group name, empty string for root)
   * - position: number (0-based index in parent's children)
   */
  const handleDragDropMove = async (layerId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (!projectName) {
      console.warn('⚠️ No project name - skipping drag & drop');
      dispatch(showError('Nie można przenieść warstwy - brak nazwy projektu'));
      return;
    }

    const layer = findLayerById(layers, layerId);
    if (!layer) {
      console.error('❌ Layer not found:', layerId);
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
      await changeLayersOrder({
        project: projectName,
        object_type: layer.type === 'group' ? 'group' : 'layer',
        object_id: layerId, // Backend expects layer ID (not name)
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
        projectsApi.util.invalidateTags([
          { type: 'Project', id: projectName }
        ])
      );
    }
  };

  const dragDropHandlers = useDragDrop(layers, handleDragDropMove);

  // Helper functions
  const findLayerById = (layers: LayerNode[], id: string): LayerNode | null => {
    for (const layer of layers) {
      if (layer.id === id) return layer;
      if (layer.children) {
        const found = findLayerById(layer.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const findParentGroup = (layers: LayerNode[], childId: string): LayerNode | null => {
    for (const layer of layers) {
      if (layer.children) {
        const directChild = layer.children.find((child: LayerNode) => child.id === childId);
        if (directChild) return layer;
        const found = findParentGroup(layer.children, childId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleLayerSelect = (id: string) => {
    const layer = findLayerById(layers, id);
    setSelectedLayer(layer);
  };

  /**
   * Toggle layer visibility with backend sync
   *
   * For groups: cascades visibility to all children (Redux only - backend doesn't store group visibility)
   * For individual layers: syncs with backend via /api/layer/selection
   *
   * Uses optimistic updates with rollback on error
   */
  const toggleVisibility = async (id: string) => {
    if (!projectName) {
      console.warn('⚠️ No project name - skipping visibility toggle');
      dispatch(showError('Nie można zmienić widoczności - brak nazwy projektu'));
      return;
    }

    const layer = findLayerById(layers, id);
    if (!layer) {
      console.warn('⚠️ Layer not found:', id);
      return;
    }

    // 1. Optimistic update - update Redux immediately for instant UI feedback
    if (layer.type === 'group' && layer.children) {
      // Groups: cascade to all children (Redux only)
      dispatch(toggleGroupVisibilityCascade(id));
      console.log('👁️ Toggled group visibility (Redux only):', layer.name);
      return;
    } else {
      // Individual layer: toggle in Redux first
      const previousVisibility = layer.visible;
      dispatch(toggleLayerVisibility(id));
      console.log('👁️ Toggling layer visibility:', layer.name, '→', !previousVisibility);

      // 2. Sync with backend (async)
      try {
        await setLayerVisibility({
          project: projectName,
          layer_id: id, // Use layer ID (not name)
          checked: !previousVisibility, // Backend expects 'checked' (not 'visible')
        }).unwrap();

        console.log('✅ Layer visibility synced to backend:', {
          layer: layer.name,
          id,
          visible: !previousVisibility
        });
      } catch (error: any) {
        console.error('❌ Failed to sync layer visibility:', error);

        // 3. Rollback on error - revert Redux state
        dispatch(toggleLayerVisibility(id));

        const errorMessage = error?.data?.message || error?.message || 'Nieznany błąd';
        dispatch(showError(`Nie udało się zapisać widoczności: ${errorMessage}`, 6000));
      }
    }
  };

  const toggleExpansion = (id: string) => {
    dispatch(toggleGroupExpanded(id));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleCheckbox = (checkboxName: string) => {
    setCheckboxStates(prev => ({
      ...prev,
      [checkboxName]: !prev[checkboxName]
    }));
  };

  const expandAll = () => {
    dispatch(expandAllGroups());
  };

  const collapseAll = () => {
    dispatch(collapseAllGroups());
  };

  // Modal handlers
  // TODO: Phase 4 - Rewrite these to use Redux + Backend API
  const handleAddDataset = (data: { nazwaPlan: string; nazwaGrupy: string; temat: string }) => {
    setAddDatasetModalOpen(false);
    console.log('TODO: Adding new dataset:', data);
    dispatch(showInfo('Dodawanie datasetu - wkrótce dostępne'));
  };

  const handleAddNationalLaw = (data: { type: 'create' | 'import'; [key: string]: any }) => {
    setAddNationalLawModalOpen(false);
    console.log('TODO: Adding new national law:', data);
    dispatch(showInfo('Dodawanie prawa krajowego - wkrótce dostępne'));
  };

  const handleAddLayer = (data: { nazwaWarstwy: string; typGeometrii: string; nazwaGrupy: string; columns: any[] }) => {
    setAddLayerModalOpen(false);
    console.log('TODO: Adding new layer:', data);
    dispatch(showInfo('Dodawanie warstwy - wkrótce dostępne'));
  };

  /**
   * Import layer from file (GeoJSON, Shapefile, GML)
   *
   * Supports:
   * - GeoJSON (.geojson, .json)
   * - Shapefile (.shp + .shx, .dbf, .prj, .cpg, etc.)
   * - GML (.gml)
   *
   * Backend automatically:
   * - Validates geometry
   * - Fixes invalid geometries
   * - Imports to PostGIS
   * - Updates project tree.json
   * - Generates layer styling
   */
  const handleImportLayer = async (data: {
    nazwaWarstwy: string;
    nazwaGrupy: string;
    format: string;
    file?: File;
    files?: FileList | null; // Multiple files for Shapefile
    epsg?: string;
  }) => {
    if (!projectName) {
      dispatch(showError('Nie można zaimportować warstwy - brak nazwy projektu'));
      return;
    }

    // Validation
    if (data.format === 'shp') {
      // For Shapefile, check if files (multiple) are provided
      if (!data.files || data.files.length === 0) {
        dispatch(showError('Nie wybrano plików do importu (wymagane: .shp, .shx, .dbf)'));
        return;
      }
    } else {
      // For other formats, check single file
      if (!data.file) {
        dispatch(showError('Nie wybrano pliku do importu'));
        return;
      }
    }

    if (!data.nazwaWarstwy.trim()) {
      dispatch(showError('Nazwa warstwy nie może być pusta'));
      return;
    }

    // Close modal immediately for better UX
    setImportLayerModalOpen(false);

    // Show loading notification (context='layer' will auto-replace previous layer notifications)
    dispatch(showInfo(`Importowanie warstwy "${data.nazwaWarstwy}"...`, 10000, 'layer'));

    try {
      // Route to appropriate backend endpoint based on format
      switch (data.format) {
        case 'geoJSON':
          console.log('📥 Importing GeoJSON layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
          });

          const parentGeoJson = data.nazwaGrupy === 'Stwórz poza grupami' ? '' : data.nazwaGrupy;
          const formDataGeoJson = new FormData();
          // Backend expects simple field name 'geojson' (not 'uploaded_layer.geojson')
          formDataGeoJson.append('geojson', data.file!);

          await addGeoJsonLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentGeoJson,
            },
            files: formDataGeoJson,
          }).unwrap();
          break;

        case 'shp':
          // Extract files by extension from FileList
          console.log('🔍 DEBUG - Shapefile import data:', {
            hasFiles: !!data.files,
            filesCount: data.files?.length,
            filesList: data.files ? Array.from(data.files).map(f => f.name) : []
          });

          const filesArray = Array.from(data.files || []);
          const shpFile = filesArray.find(f => f.name.toLowerCase().endsWith('.shp'));
          const shxFile = filesArray.find(f => f.name.toLowerCase().endsWith('.shx'));
          const dbfFile = filesArray.find(f => f.name.toLowerCase().endsWith('.dbf'));
          const prjFile = filesArray.find(f => f.name.toLowerCase().endsWith('.prj'));
          const cpgFile = filesArray.find(f => f.name.toLowerCase().endsWith('.cpg'));
          const qpjFile = filesArray.find(f => f.name.toLowerCase().endsWith('.qpj'));

          console.log('📦 Extracted Shapefile components:', {
            shp: shpFile?.name,
            shx: shxFile?.name,
            dbf: dbfFile?.name,
            prj: prjFile?.name,
            cpg: cpgFile?.name,
            qpj: qpjFile?.name
          });

          if (!shpFile) {
            console.error('❌ No .shp file found in:', filesArray.map(f => f.name));
            throw new Error('Plik .shp jest wymagany');
          }

          console.log('📥 Importing Shapefile layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            files: filesArray.map(f => f.name),
            epsg: data.epsg,
          });

          // Backend expects "project" not "project_name"
          // CRITICAL: Backend requires 'parent' field (group name or empty string)
          const parentShp = data.nazwaGrupy === 'Stwórz poza grupami' ? '' : data.nazwaGrupy;

          // Create FormData with all Shapefile components
          // IMPORTANT: Backend expects field names WITHOUT prefix: shp, shx, dbf, prj, cpg
          // (Documentation is wrong - it says uploaded_layer.shp but backend uses just 'shp')
          const formDataShp = new FormData();
          if (shpFile) formDataShp.append('shp', shpFile);
          if (shxFile) formDataShp.append('shx', shxFile);
          if (dbfFile) formDataShp.append('dbf', dbfFile);
          if (prjFile) formDataShp.append('prj', prjFile);
          if (cpgFile) formDataShp.append('cpg', cpgFile);
          if (qpjFile) formDataShp.append('qpj', qpjFile);

          await addShpLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentShp,
              epsg: data.epsg ? parseInt(data.epsg) : undefined,
              encoding: 'UTF-8',
            },
            files: formDataShp,
          }).unwrap();
          break;

        case 'gml':
          console.log('📥 Importing GML layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
          });

          const parentGml = data.nazwaGrupy === 'Stwórz poza grupami' ? '' : data.nazwaGrupy;
          const formDataGml = new FormData();
          // Backend expects simple field name 'gml' (not 'uploaded_layer.gml')
          formDataGml.append('gml', data.file!);

          await addGmlLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentGml,
            },
            files: formDataGml,
          }).unwrap();
          break;

        case 'geoTIFF':
          console.log('📥 Importing GeoTIFF raster layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
          });

          const parentTiff = data.nazwaGrupy === 'Stwórz poza grupami' ? '' : data.nazwaGrupy;
          const formDataTiff = new FormData();
          // Backend expects simple field name 'raster' (not 'uploaded_layer.tif')
          formDataTiff.append('raster', data.file!);

          await addRasterLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentTiff,
            },
            files: formDataTiff,
          }).unwrap();
          break;

        default:
          throw new Error(`Nieobsługiwany format: ${data.format}`);
      }

      console.log('✅ Layer imported successfully');

      // ✅ MANUAL REFETCH - Force regenerate tree.json from backend
      // RTK Query cache invalidation doesn't work between separate APIs (layersApi vs projectsApi)
      // So we manually invalidate the 'Project' tag in projectsApi to trigger refetch
      console.log('🔄 Triggering manual refetch of project data (tree.json)');
      dispatch(
        projectsApi.util.invalidateTags([
          { type: 'Project', id: projectName }
        ])
      );

      // Success notification (replaces "Importowanie..." notification)
      dispatch(showSuccess(`Warstwa "${data.nazwaWarstwy}" została zaimportowana!`, 5000, 'layer'))
    } catch (error: any) {
      console.error('❌ Failed to import layer:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Log full error data for debugging
      if (error?.data) {
        console.error('Backend error data:', error.data);
      }

      // Error notification (replaces "Importowanie..." notification)
      dispatch(showError(`Nie udało się zaimportować warstwy: ${errorMessage}`, 8000, 'layer'));
    }
  };

  /**
   * Add Group with backend sync
   *
   * Process:
   * 1. Validate input
   * 2. Call backend API to create group in QGS file
   * 3. Refetch project data (tree.json) to update Redux state
   * 4. Show success notification
   *
   * Backend endpoint: POST /api/groups/add
   * Documentation: docs/backend/groups_api_docs.md (lines 16-60)
   */
  const handleAddGroup = async (data: { nazwaGrupy: string; grupaNadrzedna: string }) => {
    if (!projectName) {
      dispatch(showError('Nie można dodać grupy - brak nazwy projektu'));
      return;
    }

    // Validation
    if (!data.nazwaGrupy.trim()) {
      dispatch(showError('Nazwa grupy nie może być pusta'));
      return;
    }

    // Close modal immediately for better UX
    setAddGroupModalOpen(false);

    // Show loading notification (context='group' will auto-replace previous group notifications)
    dispatch(showInfo(`Tworzenie grupy "${data.nazwaGrupy}"...`, 8000, 'group'));

    try {
      // Determine parent group name
      // "Stwórz poza grupami" → empty string (root level)
      // Otherwise → group name (not ID!)
      const parentGroupName = data.grupaNadrzedna === 'Stwórz poza grupami'
        ? ''
        : data.grupaNadrzedna;

      console.log('➕ Adding group:', {
        project: projectName,
        groupName: data.nazwaGrupy,
        parent: parentGroupName || '(root)',
      });

      // Call backend API
      await addGroup({
        project: projectName,
        group_name: data.nazwaGrupy,
        parent: parentGroupName,
      }).unwrap();

      console.log('✅ Group added successfully');

      // RTK Query automatically invalidates 'Project' tag and refetches tree.json
      // Redux state will update automatically via QGISProjectLoader

      // Success notification (replaces "Tworzenie grupy..." notification)
      dispatch(showSuccess(`Grupa "${data.nazwaGrupy}" została utworzona!`, 5000, 'group'));
    } catch (error: any) {
      console.error('❌ Failed to add group:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Error notification (replaces "Tworzenie grupy..." notification)
      dispatch(showError(`Nie udało się dodać grupy: ${errorMessage}`, 8000, 'group'));
    }
  };

  /**
   * Delete layer or group with backend sync
   *
   * Supports:
   * - Individual layers (via /api/groups/layer/remove with layers=[id])
   * - Groups (via /api/groups/layer/remove with groups=[name])
   *
   * Process:
   * 1. Validate selection (layer or group)
   * 2. Call backend API to remove from QGS file
   * 3. Optionally delete from PostgreSQL database
   * 4. Refetch project data (tree.json) to update Redux state
   * 5. Close properties panel
   *
   * Backend endpoint: POST /api/groups/layer/remove
   * Documentation: docs/backend/groups_api_docs.md (lines 63-105)
   *
   * IMPORTANT:
   * - groups: array of group NAMES (not IDs!)
   * - layers: array of layer IDs
   * - remove_from_database: true to delete from PostgreSQL
   */
  const handleDeleteLayer = async () => {
    if (!selectedLayer) {
      console.warn('⚠️ No layer/group selected for deletion');
      return;
    }

    if (!projectName) {
      dispatch(showError('Nie można usunąć - brak nazwy projektu'));
      return;
    }

    const isGroup = selectedLayer.type === 'group';
    const itemName = selectedLayer.name;
    const itemId = selectedLayer.id;
    const itemType = isGroup ? 'grupy' : 'warstwy';
    // Use context based on item type: 'group' or 'layer'
    const notificationContext = isGroup ? 'group' : 'layer';

    try {
      console.log(`🗑️ Deleting ${itemType}:`, {
        project: projectName,
        name: itemName,
        id: itemId,
        type: selectedLayer.type,
      });

      // Show loading notification
      dispatch(showInfo(`Usuwanie ${itemType} "${itemName}"...`, 8000, notificationContext));

      // Call unified backend endpoint for both groups and layers
      await removeGroupsAndLayers({
        project: projectName,
        groups: isGroup ? [itemName] : [], // Groups use NAMES
        layers: isGroup ? [] : [itemId], // Layers use IDs
        remove_from_database: true, // Delete from PostgreSQL
      }).unwrap();

      console.log(`✅ ${itemType} deleted from backend`);

      // RTK Query automatically invalidates 'Project' tag and refetches tree.json
      // Redux state will update automatically via QGISProjectLoader

      // Close properties panel
      setSelectedLayer(null);

      // Show success message (replaces "Usuwanie..." notification)
      dispatch(showSuccess(`${isGroup ? 'Grupa' : 'Warstwa'} "${itemName}" została usunięta`, 5000, notificationContext));
    } catch (error: any) {
      console.error(`❌ Failed to delete ${itemType}:`, error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Error notification (replaces "Usuwanie..." notification)
      dispatch(showError(`Nie udało się usunąć ${itemType}: ${errorMessage}`, 8000, notificationContext));
    }
  };

  const handleCreateConsultation = (data: {
    nazwa: string;
    numerUchwaly: string;
    email: string;
    dataRozpoczecia: string;
    dataZakonczenia: string;
  }) => {
    setCreateConsultationModalOpen(false);
    console.log('TODO: Creating consultation:', data);
    dispatch(showInfo('Tworzenie konsultacji - wkrótce dostępne'));
  };

  const handleLayerManager = (data: {
    deletedLayerIds: string[];
    restoredLayers: Array<{ id: string; nazwa: string; typ: 'wektor' | 'raster'; grupaNadrzedna?: string }>;
  }) => {
    setLayerManagerModalOpen(false);
    console.log('TODO: Layer manager:', data);
    dispatch(showInfo('Zarządzanie warstwami - wkrótce dostępne'));
  };

  const handleSaveWypisConfig = (config: any) => {
    console.log('💾 Saving wypis config:', config);

    // Check if updating existing or adding new
    const existingIndex = existingWypisConfigs.findIndex(c => c.id === config.id);

    if (existingIndex >= 0) {
      // Update existing
      const updatedConfigs = [...existingWypisConfigs];
      updatedConfigs[existingIndex] = config;
      setExistingWypisConfigs(updatedConfigs);
      dispatch(showSuccess(`Konfiguracja "${config.nazwa}" została zaktualizowana`, 3000));
    } else {
      // Add new
      setExistingWypisConfigs([...existingWypisConfigs, config]);
      dispatch(showSuccess(`Konfiguracja "${config.nazwa}" została utworzona`, 3000));
    }

    // TODO: Save to backend
    // await saveWypisConfigToBackend(config);

    setPrintConfigModalOpen(false);
  };

  const toolbarHandlers = {
    onAddInspireDataset: () => setAddDatasetModalOpen(true),
    onAddNationalLaw: () => setAddNationalLawModalOpen(true),
    onAddLayer: () => setAddLayerModalOpen(true),
    onImportLayer: () => setImportLayerModalOpen(true),
    onAddGroup: () => setAddGroupModalOpen(true),
    onRemoveLayer: handleDeleteLayer,
    onCreateConsultation: () => setCreateConsultationModalOpen(true),
    onLayerManager: () => setLayerManagerModalOpen(true),
    onPrintConfig: () => setPrintConfigModalOpen(true)
  };

  return (
    <>
      {/* Sidebar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: sidebarCollapsed ? -width : 0,
          height: '100vh',
          width: width,
          bgcolor: theme.palette.background.paper,
          boxShadow: sidebarCollapsed ? 'none' : 2,
          transition: isResizing ? 'none' : 'left 0.3s ease',
          zIndex: 1200,
          borderRight: sidebarCollapsed ? 'none' : `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box sx={{
          p: SIDEBAR_CONFIG.elements.headerPadding,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          textAlign: 'center',
          minHeight: SIDEBAR_CONFIG.sidebar.headerHeight
        }}>
          <Box
            component="h6"
            sx={{
              color: theme.palette.text.primary,
              mb: 1,
              fontSize: SIDEBAR_CONFIG.typography.titleFontSize,
              fontWeight: 400,
              letterSpacing: '2px',
              textTransform: 'lowercase',
              margin: 0
            }}
          >
            {/* ✅ Display custom_project_name (user-friendly) instead of .qgs filename */}
            {currentProject?.custom_project_name || projectName || 'universe-mapmaker.online'}
          </Box>

          {/* TEMPORARY: Always show full toolbar during development (isOwner={true}) */}
          <Toolbar {...toolbarHandlers} selectedLayer={selectedLayer} isOwner={true} />
          <SearchBar
            searchFilter={searchFilter}
            onSearchChange={setSearchFilter}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            filterMenuOpen={filterMenuOpen}
            onFilterMenuToggle={() => setFilterMenuOpen(!filterMenuOpen)}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        </Box>

        {/* Content */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <LayerTree
            warstwy={layers}
            selectedLayer={selectedLayer}
            searchFilter={searchFilter}
            expandedGroups={expandedGroups}
            dragDropState={dragDropHandlers.dragDropState}
            onLayerSelect={handleLayerSelect}
            onToggleVisibility={toggleVisibility}
            onToggleExpansion={toggleExpansion}
            onDragStart={dragDropHandlers.handleDragStart}
            onDragEnd={dragDropHandlers.handleDragEnd}
            onDragEnter={dragDropHandlers.handleDragEnter}
            onDragLeave={dragDropHandlers.handleDragLeave}
            onDragOver={dragDropHandlers.handleDragOver}
            onDrop={dragDropHandlers.handleDrop}
            onDropAtEnd={dragDropHandlers.handleDropAtEnd}
            onLayerTreeDragOver={dragDropHandlers.handleLayerTreeDragOver}
            onMainLevelDragOver={dragDropHandlers.handleMainLevelDragOver}
          />

          <PropertiesPanel
            selectedLayer={selectedLayer}
            warstwy={layers}
            expandedSections={expandedSections}
            checkboxStates={checkboxStates}
            onToggleSection={toggleSection}
            onToggleCheckbox={toggleCheckbox}
            onClosePanel={() => setSelectedLayer(null)}
            onEditLayerStyle={() => setEditLayerStyleModalOpen(true)}
            onManageLayer={() => console.log('Manage layer')}
            onLayerLabeling={() => console.log('Layer labeling')}
            findParentGroup={findParentGroup}
            projectName={projectName}
            wmsUrl={projectData?.wms_url || ''}
            wfsUrl={projectData?.wfs_url || ''}
          />
        </Box>

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              position: 'absolute',
              top: 0,
              right: -2,
              width: 4,
              height: '100%',
              cursor: 'ew-resize',
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
              zIndex: 1201,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                width: 2,
                height: 40,
                bgcolor: isResizing ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.3)',
                borderRadius: 1,
                opacity: isResizing ? 1 : 0.5,
                transition: 'opacity 0.2s ease, background-color 0.2s ease'
              }}
            />
          </Box>
        )}
      </Box>

      {/* Add Dataset Modal */}
      <AddDatasetModal
        open={addDatasetModalOpen}
        onClose={() => setAddDatasetModalOpen(false)}
        onSubmit={handleAddDataset}
      />

      {/* Add National Law Modal */}
      <AddNationalLawModal
        open={addNationalLawModalOpen}
        onClose={() => setAddNationalLawModalOpen(false)}
        onSubmit={handleAddNationalLaw}
      />

      {/* Add Layer Modal */}
      <AddLayerModal
        open={addLayerModalOpen}
        onClose={() => setAddLayerModalOpen(false)}
        onSubmit={handleAddLayer}
      />

      {/* Import Layer Modal */}
      <ImportLayerModal
        open={importLayerModalOpen}
        onClose={() => setImportLayerModalOpen(false)}
        onSubmit={handleImportLayer}
      />

      {/* Add Group Modal */}
      <AddGroupModal
        open={addGroupModalOpen}
        onClose={() => setAddGroupModalOpen(false)}
        onSubmit={handleAddGroup}
        existingGroups={layers}
      />

      {/* Create Consultation Modal */}
      <CreateConsultationModal
        open={createConsultationModalOpen}
        onClose={() => setCreateConsultationModalOpen(false)}
        onSubmit={handleCreateConsultation}
      />

      {/* Layer Manager Modal */}
      <LayerManagerModal
        open={layerManagerModalOpen}
        onClose={() => setLayerManagerModalOpen(false)}
        onSubmit={handleLayerManager}
        existingGroups={layers}
      />

      {/* Wypis Config Modal */}
      <WypisConfigModal
        open={printConfigModalOpen}
        onClose={() => setPrintConfigModalOpen(false)}
        onSave={handleSaveWypisConfig}
        existingConfigs={existingWypisConfigs}
        projectLayers={layers.filter(l => l.type !== 'group').map(l => ({ id: l.id, name: l.name }))}
      />

      {/* Edit Layer Style Modal */}
      <EditLayerStyleModal
        open={editLayerStyleModalOpen}
        onClose={() => setEditLayerStyleModalOpen(false)}
        layerName={selectedLayer?.name}
        layerId={selectedLayer?.id}
        projectName={projectName}
      />
    </>
  );
};

export default LeftPanel;
