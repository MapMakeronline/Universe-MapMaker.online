'use client';

import React, { useState, useEffect } from 'react';
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
import { WypisConfigManager } from '@/features/wypis/components/config';
import EditLayerStyleModal from '../modals/EditLayerStyleModal';
import DeleteLayerConfirmModal from '../modals/DeleteLayerConfirmModal';
import { AttributeTableModal } from '../modals';
import { AuthRequiredModal } from '@/features/auth/components';
import { useResizable, useDragDrop } from '@/hooks/index';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { LayerNode } from '@/types-app/layers';
import type { QGISLayerNode } from '@/types/qgis';
import {
  toggleLayerVisibility,
  toggleGroupExpanded,
  toggleGroupVisibilityCascade,
  expandAllGroups,
  collapseAllGroups,
  deleteLayer,
  moveLayer,
  loadLayers
} from '@/redux/slices/layersSlice';
import { useGetProjectDataQuery } from '@/backend/projects';
import { showSuccess, showError, showInfo } from '@/redux/slices/notificationSlice';
import {
  findLayerById,
  findParentGroup,
} from '@/utils/layerTreeUtils';
import { useModalManager, useDragDropSync, useLayerOperations } from '../hooks';

// Types
type FilterType = 'wszystko' | 'wektor' | 'raster' | 'wms';

/**
 * Convert QGIS backend structure to frontend LayerNode structure
 */
function convertQGISToLayerNode(qgisNode: QGISLayerNode): LayerNode {
  const layerId = qgisNode.type === 'group'
    ? qgisNode.name // Groups: use NAME
    : qgisNode.id;   // Layers: use QGIS UUID

  const baseNode: LayerNode = {
    id: layerId,
    name: qgisNode.name,
    visible: qgisNode.visible !== false,
    opacity: 'opacity' in qgisNode ? qgisNode.opacity / 255 : 1,
    type: qgisNode.type,
    extent: qgisNode.extent && qgisNode.extent.length === 4
      ? (qgisNode.extent as [number, number, number, number])
      : undefined,
    geometry: 'geometry' in qgisNode ? qgisNode.geometry : undefined, // Copy geometry type for icon display
  };

  // Handle group layers
  if (qgisNode.type === 'group') {
    baseNode.childrenVisible = qgisNode.childrenVisible !== false;
    baseNode.children = qgisNode.children?.map(convertQGISToLayerNode) || [];
  }

  return baseNode;
}

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
  onShowAttributeTable?: (layerId: string) => void; // NEW: Callback to open AttributeTablePanel in page.tsx
  onWidthChange?: (width: number) => void; // NEW: Callback to report width changes to parent
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  isOwner = true,
  isCollapsed: externalCollapsed,
  onShowAttributeTable: onShowAttributeTableFromParent,
  onToggle: externalOnToggle,
  width: externalWidth,
  onWidthChange
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // Get layers and expandedGroups from Redux
  const reduxLayers = useAppSelector((state) => state.layers.layers);
  const expandedGroups = useAppSelector((state) => state.layers.expandedGroups);

  // Check if user is authenticated
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Layer state - use Redux directly (MUST be declared before any hook that uses it)
  const layers = reduxLayers;

  // Get current project name from URL
  const projectName = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('project') || ''
    : '';

  // Fetch project data to get the display name
  const {
    data: projectData,
    refetch: refetchProjectData,
    isLoading: isProjectDataLoading,
    error: projectDataError,
  } = useGetProjectDataQuery(
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

  // Modal state management (centralized)
  const { modals, openModal, closeModal } = useModalManager();

  // Auth required modal state
  const [authRequiredModalOpen, setAuthRequiredModalOpen] = useState(false);
  const [authRequiredAction, setAuthRequiredAction] = useState('');

  // Drag & drop with backend sync
  const { handleDragDropMove } = useDragDropSync(layers, projectName);

  // Layer operations (CRUD with backend sync)
  const { handleAddLayer: handleAddLayerBackend, handleImportLayer, handleAddGroup, handleDeleteLayer, toggleVisibility } = useLayerOperations(
    projectName,
    layers
  );

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

  // Hooks - use external width if provided
  const resizable = useResizable({
    initialWidth: externalWidth || parseInt(SIDEBAR_CONFIG.sidebar.width),
    minWidth: parseInt(SIDEBAR_CONFIG.sidebar.minWidth),
    maxWidth: parseInt(SIDEBAR_CONFIG.sidebar.maxWidth),
  });
  const width = externalWidth || resizable.width;
  const isResizing = resizable.isResizing;
  const handleMouseDown = resizable.handleMouseDown;

  const dragDropHandlers = useDragDrop(layers, handleDragDropMove);

  // Report width changes to parent (for AttributeTablePanel offset)
  useEffect(() => {
    if (onWidthChange) {
      // Report actual width when expanded, 0 when collapsed
      const effectiveWidth = sidebarCollapsed ? 0 : width;
      onWidthChange(effectiveWidth);
    }
  }, [width, sidebarCollapsed, onWidthChange]);

  // Helper functions
  const handleLayerSelect = (id: string) => {
    const layer = findLayerById(layers, id);
    setSelectedLayer(layer);
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
    closeModal('addDataset');
    dispatch(showInfo('Dodawanie datasetu - wkrótce dostępne'));
  };

  const handleAddNationalLaw = (data: { type: 'create' | 'import'; [key: string]: any }) => {
    closeModal('addNationalLaw');
    dispatch(showInfo('Dodawanie prawa krajowego - wkrótce dostępne'));
  };

  const handleAddLayer = async (data: { nazwaWarstwy: string; typGeometrii: string; nazwaGrupy: string; columns: any[] }) => {
    closeModal('addLayer');
    // Call backend handler from useLayerOperations hook
    await handleAddLayerBackend(data);
  };

  // Auth-protected wrapper for editing layer style
  const handleEditLayerStyleClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('edytować styl warstwy');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('editLayerStyle');
  };

  // Auth-protected wrapper for managing layer
  const handleManageLayerClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('zarządzać warstwą');
      setAuthRequiredModalOpen(true);
      return;
    }
  };

  // Auth-protected wrapper for layer labeling
  const handleLayerLabelingClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('edytować etykiety warstwy');
      setAuthRequiredModalOpen(true);
      return;
    }
  };

  // Auth-protected wrapper for deleting layer
  const handleDeleteLayerClick = () => {
    if (!selectedLayer) {
      dispatch(showError('Nie wybrano warstwy do usunięcia'));
      return;
    }
    if (!isAuthenticated) {
      setAuthRequiredAction('usunąć warstwę');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('deleteLayerConfirm');
  };

  // Show attribute table for layer
  const handleShowAttributeTable = (layerId: string) => {
    // Use parent callback if provided (panel mode), otherwise use modal
    if (onShowAttributeTableFromParent) {
      onShowAttributeTableFromParent(layerId);
    } else {
      // Fallback to modal mode (deprecated)
      const layer = findLayerById(layers, layerId);
      if (!layer) {
        console.error('❌ Layer not found in tree! layerId:', layerId);
        dispatch(showError('Nie znaleziono warstwy'));
        return;
      }
      setSelectedLayer(layer);
      openModal('attributeTable');
    }
  };

  // Delete layer confirmed - execute deletion
  const handleDeleteLayerConfirmed = async () => {
    closeModal('deleteLayerConfirm');
    const success = await handleDeleteLayer(selectedLayer);
    if (success) {
      setSelectedLayer(null); // Close properties panel on success
      // Manually refetch project data to update layer tree
      const result = await refetchProjectData();

      // Force Redux state update with fresh data
      if (result.data && result.data.children) {
        const qgisLayers = result.data.children || [];
        const convertedLayers = qgisLayers.map(convertQGISToLayerNode);
        dispatch(loadLayers(convertedLayers));
      }
    }
  };

  const handleCreateConsultation = (data: {
    nazwa: string;
    numerUchwaly: string;
    email: string;
    dataRozpoczecia: string;
    dataZakonczenia: string;
  }) => {
    closeModal('createConsultation');
    dispatch(showInfo('Tworzenie konsultacji - wkrótce dostępne'));
  };

  const handleLayerManager = (data: {
    deletedLayerIds: string[];
    restoredLayers: Array<{ id: string; nazwa: string; typ: 'wektor' | 'raster'; grupaNadrzedna?: string }>;
  }) => {
    closeModal('layerManager');
    dispatch(showInfo('Zarządzanie warstwami - wkrótce dostępne'));
  };

  // Auth-protected wrapper for adding INSPIRE dataset
  const handleAddInspireDatasetClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('dodać zbiór danych INSPIRE');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('addDataset');
  };

  // Auth-protected wrapper for adding national law
  const handleAddNationalLawClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('dodać prawo krajowe');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('addNationalLaw');
  };

  // Auth-protected wrapper for adding layer
  const handleAddLayerClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('dodać nową warstwę');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('addLayer');
  };

  // Auth-protected wrapper for importing layer with project validation
  const handleImportLayerClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('importować warstwę');
      setAuthRequiredModalOpen(true);
      return;
    }

    // Check if project data is loading or has error
    if (isProjectDataLoading) {
      dispatch(showInfo('Ładowanie projektu...'));
      return;
    }

    if (projectDataError) {
      const errorData = projectDataError as any;
      const errorMessage = errorData?.data?.message || 'Nie można załadować projektu';

      console.error('❌ Project validation failed:', {
        error: errorData,
        message: errorMessage,
      });

      dispatch(showError(
        `${errorMessage}. ` +
        'Aby dodać warstwy, musisz najpierw utworzyć projekt przez "Dashboard → Nowy Projekt" ' +
        'lub zaimportować plik .qgs/.qgz.'
      ));
      return;
    }

    // Project is valid, open import modal
    openModal('importLayer');
  };

  // Auth-protected wrapper for adding group
  const handleAddGroupClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('dodać nową grupę');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('addGroup');
  };

  // Auth-protected wrapper for creating consultation
  const handleCreateConsultationClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('utworzyć konsultację');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('createConsultation');
  };

  // Auth-protected wrapper for layer manager
  const handleLayerManagerClick = () => {
    if (!isAuthenticated) {
      setAuthRequiredAction('zarządzać warstwami');
      setAuthRequiredModalOpen(true);
      return;
    }
    openModal('layerManager');
  };

  const toolbarHandlers = {
    onAddInspireDataset: handleAddInspireDatasetClick,
    onAddNationalLaw: handleAddNationalLawClick,
    onAddLayer: handleAddLayerClick,
    onImportLayer: handleImportLayerClick,
    onAddGroup: handleAddGroupClick,
    onRemoveLayer: handleDeleteLayerClick,
    onCreateConsultation: handleCreateConsultationClick,
    onLayerManager: handleLayerManagerClick,
    onPrintConfig: () => openModal('printConfig') // Print is read-only, no auth needed
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
            onShowAttributeTable={handleShowAttributeTable}
          />

          <PropertiesPanel
            selectedLayer={selectedLayer}
            warstwy={layers}
            expandedSections={expandedSections}
            checkboxStates={checkboxStates}
            onToggleSection={toggleSection}
            onToggleCheckbox={toggleCheckbox}
            onClosePanel={() => setSelectedLayer(null)}
            onEditLayerStyle={handleEditLayerStyleClick}
            onManageLayer={handleManageLayerClick}
            onLayerLabeling={handleLayerLabelingClick}
            onDeleteLayer={handleDeleteLayerClick}
            onShowAttributeTable={handleShowAttributeTable}
            findParentGroup={findParentGroup}
            projectName={projectName}
            wmsUrl={projectData?.wms_url || ''}
            wfsUrl={projectData?.wfs_url || ''}
            onRefetchProject={refetchProjectData}
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
        open={modals.addDataset}
        onClose={() => closeModal('addDataset')}
        onSubmit={handleAddDataset}
      />

      {/* Add National Law Modal */}
      <AddNationalLawModal
        open={modals.addNationalLaw}
        onClose={() => closeModal('addNationalLaw')}
        onSubmit={handleAddNationalLaw}
      />

      {/* Add Layer Modal */}
      <AddLayerModal
        open={modals.addLayer}
        onClose={() => closeModal('addLayer')}
        onSubmit={handleAddLayer}
        availableGroups={layers}
      />

      {/* Import Layer Modal */}
      <ImportLayerModal
        open={modals.importLayer}
        onClose={() => closeModal('importLayer')}
        onSubmit={handleImportLayer}
      />

      {/* Add Group Modal */}
      <AddGroupModal
        open={modals.addGroup}
        onClose={() => closeModal('addGroup')}
        onSubmit={handleAddGroup}
        existingGroups={layers}
      />

      {/* Create Consultation Modal */}
      <CreateConsultationModal
        open={modals.createConsultation}
        onClose={() => closeModal('createConsultation')}
        onSubmit={handleCreateConsultation}
      />

      {/* Layer Manager Modal */}
      <LayerManagerModal
        open={modals.layerManager}
        onClose={() => closeModal('layerManager')}
        onSubmit={handleLayerManager}
        existingGroups={layers}
      />

      {/* Wypis Config Manager (NEW REFACTORED VERSION) */}
      <WypisConfigManager
        open={modals.printConfig}
        onClose={() => closeModal('printConfig')}
        projectName={projectName}
        projectLayers={(layers || []).filter(l => l.type !== 'group').map(l => ({
          id: l.id,
          name: l.name,
          type: l.type === 'raster' ? 'raster' : 'vector',
        }))}
        selectedConfigId={null} // TODO: Get from wypis state
        onSelectConfig={(configId) => {
          // TODO: Set selected config in wypis state
          console.log('Selected wypis config:', configId)
        }}
      />

      {/* Edit Layer Style Modal */}
      <EditLayerStyleModal
        open={modals.editLayerStyle}
        onClose={() => closeModal('editLayerStyle')}
        layerName={selectedLayer?.name}
        layerId={selectedLayer?.id}
        projectName={projectName}
      />

      {/* Delete Layer Confirmation Modal */}
      <DeleteLayerConfirmModal
        open={modals.deleteLayerConfirm}
        onClose={() => closeModal('deleteLayerConfirm')}
        onConfirm={handleDeleteLayerConfirmed}
        layerName={selectedLayer?.name || 'warstwy'}
      />

      {/* Attribute Table Modal */}
      {selectedLayer && (
        <AttributeTableModal
          open={modals.attributeTable}
          onClose={() => closeModal('attributeTable')}
          projectName={projectName}
          layerId={selectedLayer.id}
          layerName={selectedLayer.name}
        />
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        open={authRequiredModalOpen}
        onClose={() => setAuthRequiredModalOpen(false)}
        action={authRequiredAction}
      />
    </>
  );
};

export default LeftPanel;
