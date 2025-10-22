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
import { useGetProjectDataQuery } from '@/backend/projects';
import { showSuccess, showError, showInfo } from '@/redux/slices/notificationSlice';
import {
  findLayerById,
  findParentGroup,
} from '@/utils/layerTreeUtils';
import { useModalManager, useDragDropSync, useLayerOperations } from '../hooks';

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

  // Modal state management (centralized)
  const { modals, openModal, closeModal } = useModalManager();

  // Drag & drop with backend sync
  const { handleDragDropMove } = useDragDropSync(layers, projectName);

  // Layer operations (CRUD with backend sync)
  const { handleImportLayer, handleAddGroup, handleDeleteLayer, toggleVisibility } = useLayerOperations(
    projectName,
    layers
  );

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

  const dragDropHandlers = useDragDrop(layers, handleDragDropMove);

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
    console.log('TODO: Adding new dataset:', data);
    dispatch(showInfo('Dodawanie datasetu - wkrótce dostępne'));
  };

  const handleAddNationalLaw = (data: { type: 'create' | 'import'; [key: string]: any }) => {
    closeModal('addNationalLaw');
    console.log('TODO: Adding new national law:', data);
    dispatch(showInfo('Dodawanie prawa krajowego - wkrótce dostępne'));
  };

  const handleAddLayer = (data: { nazwaWarstwy: string; typGeometrii: string; nazwaGrupy: string; columns: any[] }) => {
    closeModal('addLayer');
    console.log('TODO: Adding new layer:', data);
    dispatch(showInfo('Dodawanie warstwy - wkrótce dostępne'));
  };

  // Delete layer wrapper - call hook with selectedLayer and handle success
  const handleDeleteLayerWrapper = async () => {
    const success = await handleDeleteLayer(selectedLayer);
    if (success) {
      setSelectedLayer(null); // Close properties panel on success
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
    console.log('TODO: Creating consultation:', data);
    dispatch(showInfo('Tworzenie konsultacji - wkrótce dostępne'));
  };

  const handleLayerManager = (data: {
    deletedLayerIds: string[];
    restoredLayers: Array<{ id: string; nazwa: string; typ: 'wektor' | 'raster'; grupaNadrzedna?: string }>;
  }) => {
    closeModal('layerManager');
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

    closeModal('printConfig');
  };

  const toolbarHandlers = {
    onAddInspireDataset: () => openModal('addDataset'),
    onAddNationalLaw: () => openModal('addNationalLaw'),
    onAddLayer: () => openModal('addLayer'),
    onImportLayer: () => openModal('importLayer'),
    onAddGroup: () => openModal('addGroup'),
    onRemoveLayer: handleDeleteLayerWrapper,
    onCreateConsultation: () => openModal('createConsultation'),
    onLayerManager: () => openModal('layerManager'),
    onPrintConfig: () => openModal('printConfig')
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
            onEditLayerStyle={() => openModal('editLayerStyle')}
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

      {/* Wypis Config Modal */}
      <WypisConfigModal
        open={modals.printConfig}
        onClose={() => closeModal('printConfig')}
        onSave={handleSaveWypisConfig}
        existingConfigs={existingWypisConfigs}
        projectLayers={layers.filter(l => l.type !== 'group').map(l => ({ id: l.id, name: l.name }))}
      />

      {/* Edit Layer Style Modal */}
      <EditLayerStyleModal
        open={modals.editLayerStyle}
        onClose={() => closeModal('editLayerStyle')}
        layerName={selectedLayer?.name}
        layerId={selectedLayer?.id}
        projectName={projectName}
      />
    </>
  );
};

export default LeftPanel;
