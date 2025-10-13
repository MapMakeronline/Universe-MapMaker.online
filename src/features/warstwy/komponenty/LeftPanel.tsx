'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Toolbar } from './Toolbar';
import { SearchBar } from './SearchBar';
import { LayerTree } from './LayerTree';
import { PropertiesPanel } from './PropertiesPanel';
import BuildingsPanel from './BuildingsPanel';
import AddDatasetModal from '../modale/AddDatasetModal';
import AddNationalLawModal from '../modale/AddNationalLawModal';
import AddLayerModal from '../modale/AddLayerModal';
import ImportLayerModal from '../modale/ImportLayerModal';
import AddGroupModal from '../modale/AddGroupModal';
import CreateConsultationModal from '../modale/CreateConsultationModal';
import LayerManagerModal from '../modale/LayerManagerModal';
import PrintConfigModal from '../modale/PrintConfigModal';
import { useResizable, useDragDrop } from '@/hooks/index';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { LayerNode } from '@/typy/layers';
import {
  toggleLayerVisibility,
  toggleGroupExpanded,
  toggleGroupVisibilityCascade,
  expandAllGroups,
  collapseAllGroups,
  deleteLayer,
  moveLayer
} from '@/redux/slices/layersSlice';
import { useChangeLayersOrderMutation, useGetProjectDataQuery, projectsApi } from '@/redux/api/projectsApi';
import {
  useSetLayerVisibilityMutation,
  useAddGeoJsonLayerMutation,
  useAddShapefileLayerMutation,
  useAddGMLLayerMutation,
  useDeleteLayerMutation,
} from '@/redux/api/layersApi';
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
}

const LeftPanel: React.FC<LeftPanelProps> = ({ isOwner = true }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // Get layers and expandedGroups from Redux
  const reduxLayers = useAppSelector((state) => state.layers.layers);
  const expandedGroups = useAppSelector((state) => state.layers.expandedGroups);

  // Backend mutations
  const [changeLayersOrder] = useChangeLayersOrderMutation();
  const [setLayerVisibility] = useSetLayerVisibilityMutation();
  const [addGeoJsonLayer] = useAddGeoJsonLayerMutation();
  const [addShapefileLayer] = useAddShapefileLayerMutation();
  const [addGMLLayer] = useAddGMLLayerMutation();
  const [deleteLayerFromBackend] = useDeleteLayerMutation();

  // Get current project name from URL
  const projectName = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('project') || ''
    : '';

  // Fetch project data to get the display name
  const { data: projectData } = useGetProjectDataQuery(
    { project: projectName, published: false },
    { skip: !projectName }
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Hooks
  const { width, isResizing, handleMouseDown } = useResizable({
    initialWidth: parseInt(SIDEBAR_CONFIG.sidebar.width),
    minWidth: parseInt(SIDEBAR_CONFIG.sidebar.minWidth),
    maxWidth: parseInt(SIDEBAR_CONFIG.sidebar.maxWidth),
  });

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

  // Helper: Sync layer order with backend
  const syncLayerOrderWithBackend = async () => {
    if (!projectName) {
      console.warn('⚠️ No project name - skipping backend sync');
      dispatch(showError('Nie można zapisać - brak nazwy projektu'));
      return;
    }

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
  };

  // Drag & drop handlers with Redux integration + backend sync
  const handleDragDropMove = async (layerId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    // 1. Update Redux state (optimistic update)
    dispatch(moveLayer({ layerId, targetId, position }));

    // 2. Sync with backend after a short delay (debounce for multiple rapid moves)
    setTimeout(() => {
      syncLayerOrderWithBackend();
    }, 500);
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
          projectName,
          layerName: layer.name,
          visible: !previousVisibility,
        }).unwrap();

        console.log('✅ Layer visibility synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync layer visibility:', error);

        // 3. Rollback on error - revert Redux state
        dispatch(toggleLayerVisibility(id));
        dispatch(showError(`Nie udało się zapisać widoczności warstwy "${layer.name}"`, 6000));
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

    // Show loading notification
    dispatch(showInfo(`Importowanie warstwy "${data.nazwaWarstwy}"...`, 10000));

    try {
      // Route to appropriate backend endpoint based on format
      switch (data.format) {
        case 'geoJSON':
          console.log('📥 Importing GeoJSON layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
            epsg: data.epsg,
          });

          await addGeoJsonLayer({
            project_name: projectName,
            layer_name: data.nazwaWarstwy,
            geojson: data.file!,
            epsg: data.epsg,
          }).unwrap();
          break;

        case 'shp':
          // Extract files by extension from FileList
          const filesArray = Array.from(data.files || []);
          const shpFile = filesArray.find(f => f.name.toLowerCase().endsWith('.shp'));
          const shxFile = filesArray.find(f => f.name.toLowerCase().endsWith('.shx'));
          const dbfFile = filesArray.find(f => f.name.toLowerCase().endsWith('.dbf'));
          const prjFile = filesArray.find(f => f.name.toLowerCase().endsWith('.prj'));
          const cpgFile = filesArray.find(f => f.name.toLowerCase().endsWith('.cpg'));
          const qpjFile = filesArray.find(f => f.name.toLowerCase().endsWith('.qpj'));

          if (!shpFile) {
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
          const parent = data.nazwaGrupy === 'Stwórz poza grupami' ? '' : data.nazwaGrupy;

          await addShapefileLayer({
            project: projectName,
            layer_name: data.nazwaWarstwy,
            parent: parent,
            shpFile,
            shxFile,
            dbfFile,
            prjFile,
            cpgFile,
            qpjFile,
            epsg: data.epsg,
          }).unwrap();
          break;

        case 'gml':
          console.log('📥 Importing GML layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
          });

          await addGMLLayer({
            projectName,
            layerName: data.nazwaWarstwy,
            file: data.file!,
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

      dispatch(showSuccess(`Warstwa "${data.nazwaWarstwy}" została zaimportowana!`, 5000))
    } catch (error: any) {
      console.error('❌ Failed to import layer:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Log full error data for debugging
      if (error?.data) {
        console.error('Backend error data:', error.data);
      }

      dispatch(showError(`Nie udało się zaimportować warstwy: ${errorMessage}`, 8000));
    }
  };

  const handleAddGroup = (data: { nazwaGrupy: string; grupaNadrzedna: string }) => {
    setAddGroupModalOpen(false);
    console.log('TODO: Adding new group:', data);
    dispatch(showInfo('Dodawanie grupy - wkrótce dostępne'));
  };

  /**
   * Delete layer with backend sync
   *
   * Process:
   * 1. Confirm deletion (user already clicked delete button)
   * 2. Delete from backend (PostGIS + tree.json)
   * 3. Remove from Redux state
   * 4. Close properties panel
   *
   * Backend endpoint: POST /api/layer/remove/database
   * - Removes layer from PostGIS database
   * - Updates project tree.json
   * - Cleans up layer styles and metadata
   */
  const handleDeleteLayer = async () => {
    if (!selectedLayer) {
      console.warn('⚠️ No layer selected for deletion');
      return;
    }

    if (!projectName) {
      dispatch(showError('Nie można usunąć warstwy - brak nazwy projektu'));
      return;
    }

    // Don't allow deleting groups (for now)
    if (selectedLayer.type === 'group') {
      dispatch(showInfo('Usuwanie grup nie jest jeszcze obsługiwane'));
      return;
    }

    const layerName = selectedLayer.name;
    const layerId = selectedLayer.id;

    try {
      console.log('🗑️ Deleting layer:', { project: projectName, layer: layerName });

      // Show loading notification
      dispatch(showInfo(`Usuwanie warstwy "${layerName}"...`, 8000));

      // 1. Delete from backend first
      await deleteLayerFromBackend({
        projectName,
        layerName,
      }).unwrap();

      console.log('✅ Layer deleted from backend');

      // 2. Remove from Redux state (optimistic update after backend success)
      dispatch(deleteLayer(layerId));

      // 3. Close properties panel
      setSelectedLayer(null);

      // 4. Show success message
      dispatch(showSuccess(`Warstwa "${layerName}" została usunięta`, 5000));

      // RTK Query automatically invalidates cache and refetches project data
    } catch (error: any) {
      console.error('❌ Failed to delete layer:', error);

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.message || 'Nieznany błąd';
      dispatch(showError(`Nie udało się usunąć warstwy: ${errorMessage}`, 8000));

      // Don't remove from Redux if backend deletion failed
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

  const handlePrintConfig = (data: {
    nazwaWypisu: string;
    warstwaId: string;
    kolumnaObreb: string;
    kolumnaNumerDzialki: string;
    warstwyPrzeznaczenia: any[];
  }) => {
    console.log('Print config data:', data);
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
      {/* Toggle button */}
      <IconButton
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        sx={{
          position: 'fixed',
          top: 20,
          left: sidebarCollapsed ? 20 : width + 20,
          zIndex: 1300,
          transition: isResizing ? 'none' : 'left 0.3s ease',
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 2,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          }
        }}
      >
        {sidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
      </IconButton>

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
            {projectData?.name || projectName || 'universe-mapmaker.online'}
          </Box>

          <Toolbar {...toolbarHandlers} selectedLayer={selectedLayer} isOwner={isOwner} />
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
          {/* 3D Buildings Panel */}
          <BuildingsPanel />

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
            onEditLayerStyle={() => console.log('Edit style')}
            onManageLayer={() => console.log('Manage layer')}
            onLayerLabeling={() => console.log('Layer labeling')}
            findParentGroup={findParentGroup}
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

      {/* Print Config Modal */}
      <PrintConfigModal
        open={printConfigModalOpen}
        onClose={() => setPrintConfigModalOpen(false)}
        onSubmit={handlePrintConfig}
        projectLayers={layers}
      />
    </>
  );
};

export default LeftPanel;
