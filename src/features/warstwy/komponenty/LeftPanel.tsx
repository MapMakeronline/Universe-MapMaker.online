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
import { useChangeLayersOrderMutation } from '@/redux/api/projectsApi';

// Types
interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

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

const LeftPanel: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // Get layers from Redux
  const reduxLayers = useAppSelector((state) => state.layers.layers);

  // Backend mutation for persisting layer order
  const [changeLayersOrder] = useChangeLayersOrderMutation();

  // Get current project name from URL
  const projectName = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('project') || ''
    : '';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('wszystko');
  const [selectedBasemap, setSelectedBasemap] = useState('google-maps');
  const [selectedLayer, setSelectedLayer] = useState<Warstwa | null>(null);

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

  // Layer state - initialized empty, populated from Redux
  const [warstwy, setWarstwy] = useState<Warstwa[]>([]);

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
    } catch (error) {
      console.error('❌ Failed to sync layer order:', error);
      // TODO: Add user notification (toast/snackbar)
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

  const dragDropHandlers = useDragDrop(warstwy, handleDragDropMove);

  // Convert Redux LayerNode to Warstwa format
  const convertLayerNodeToWarstwa = (node: LayerNode): Warstwa => {
    const typ: 'grupa' | 'wektor' | 'raster' | 'wms' =
      node.type === 'group' ? 'grupa' :
      node.type === 'RasterLayer' ? 'raster' :
      node.type === 'VectorLayer' ? 'wektor' : 'wms';

    return {
      id: node.id,
      nazwa: node.name,
      widoczna: node.visible !== false,
      typ,
      dzieci: node.children?.map(convertLayerNodeToWarstwa),
      rozwinięta: node.childrenVisible || false,
    };
  };

  // Sync Redux layers to local state
  React.useEffect(() => {
    if (reduxLayers && reduxLayers.length > 0) {
      console.log('🔄 LeftPanel: Updating layers from Redux:', reduxLayers.length, 'layers');
      const convertedLayers = reduxLayers.map(convertLayerNodeToWarstwa);
      setWarstwy(convertedLayers);
    }
  }, [reduxLayers]);

  // Helper functions
  const findLayerById = (layers: Warstwa[], id: string): Warstwa | null => {
    for (const layer of layers) {
      if (layer.id === id) return layer;
      if (layer.dzieci) {
        const found = findLayerById(layer.dzieci, id);
        if (found) return found;
      }
    }
    return null;
  };

  const findParentGroup = (layers: Warstwa[], childId: string): Warstwa | null => {
    for (const layer of layers) {
      if (layer.dzieci) {
        const directChild = layer.dzieci.find(child => child.id === childId);
        if (directChild) return layer;
        const found = findParentGroup(layer.dzieci, childId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleLayerSelect = (id: string) => {
    const layer = findLayerById(warstwy, id);
    setSelectedLayer(layer);
  };

  const toggleVisibility = (id: string) => {
    // Check if it's a group (has children)
    const layer = findLayerById(warstwy, id);
    if (layer && layer.typ === 'grupa' && layer.dzieci) {
      // Use cascade action for groups
      dispatch(toggleGroupVisibilityCascade(id));
    } else {
      // Use regular toggle for individual layers
      dispatch(toggleLayerVisibility(id));
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
  const handleAddDataset = (data: { nazwaPlan: string; nazwaGrupy: string; temat: string }) => {
    const newLayer: Warstwa = {
      id: `dataset-${Date.now()}`,
      nazwa: data.nazwaPlan,
      widoczna: true,
      typ: 'wektor',
    };
    setWarstwy([...warstwy, newLayer]);
    setAddDatasetModalOpen(false);
    console.log('Adding new dataset:', data);
  };

  const handleAddNationalLaw = (data: { type: 'create' | 'import'; [key: string]: any }) => {
    const newLayer: Warstwa = {
      id: `national-law-${Date.now()}`,
      nazwa: data.type === 'create' ? data.nazwaApp : data.nazwaApp,
      widoczna: true,
      typ: 'wektor',
    };
    setWarstwy([...warstwy, newLayer]);
    setAddNationalLawModalOpen(false);
    console.log('Adding new national law:', data);
  };

  const handleAddLayer = (data: { nazwaWarstwy: string; typGeometrii: string; nazwaGrupy: string; columns: any[] }) => {
    const newLayer: Warstwa = {
      id: `layer-${Date.now()}`,
      nazwa: data.nazwaWarstwy,
      widoczna: true,
      typ: 'wektor',
    };
    setWarstwy([...warstwy, newLayer]);
    setAddLayerModalOpen(false);
    console.log('Adding new layer:', data);
  };

  const handleImportLayer = (data: { nazwaWarstwy: string; nazwaGrupy: string; format: string; file?: File }) => {
    const newLayer: Warstwa = {
      id: `import-${Date.now()}`,
      nazwa: data.nazwaWarstwy,
      widoczna: true,
      typ: 'wektor',
    };
    setWarstwy([...warstwy, newLayer]);
    setImportLayerModalOpen(false);
    console.log('Importing layer:', data, 'File:', data.file?.name);
  };

  const handleAddGroup = (data: { nazwaGrupy: string; grupaNadrzedna: string }) => {
    const newGroup: Warstwa = {
      id: `group-${Date.now()}`,
      nazwa: data.nazwaGrupy,
      widoczna: true,
      typ: 'grupa',
      dzieci: [],
      rozwinięta: false,
    };

    if (data.grupaNadrzedna === 'Stwórz poza grupami') {
      // Add at main level
      setWarstwy([...warstwy, newGroup]);
    } else {
      // Add to parent group
      const addToParent = (layers: Warstwa[]): Warstwa[] => {
        return layers.map(layer => {
          if (layer.id === data.grupaNadrzedna) {
            return {
              ...layer,
              dzieci: layer.dzieci ? [...layer.dzieci, newGroup] : [newGroup],
            };
          }
          if (layer.dzieci) {
            return {
              ...layer,
              dzieci: addToParent(layer.dzieci),
            };
          }
          return layer;
        });
      };
      setWarstwy(addToParent(warstwy));
    }
    setAddGroupModalOpen(false);
    console.log('Adding new group:', data);
  };

  const handleDeleteLayer = () => {
    if (selectedLayer) {
      dispatch(deleteLayer(selectedLayer.id));
      setSelectedLayer(null);
    }
  };

  const handleCreateConsultation = (data: {
    nazwa: string;
    numerUchwaly: string;
    email: string;
    dataRozpoczecia: string;
    dataZakonczenia: string;
  }) => {
    // Create a new consultation layer
    const newConsultationLayer: Warstwa = {
      id: `consultation-${Date.now()}`,
      nazwa: data.nazwa,
      widoczna: true,
      typ: 'wektor',
    };

    setWarstwy([...warstwy, newConsultationLayer]);
    setCreateConsultationModalOpen(false);
    console.log('Creating consultation:', data);
  };

  const handleLayerManager = (data: {
    deletedLayerIds: string[];
    restoredLayers: Array<{ id: string; nazwa: string; typ: 'wektor' | 'raster'; grupaNadrzedna?: string }>;
  }) => {
    // Handle deleted layers (remove from database layers list - this will be backend)
    console.log('Deleted layers:', data.deletedLayerIds);

    // Handle restored layers (add to project)
    data.restoredLayers.forEach(restoredLayer => {
      const newLayer: Warstwa = {
        id: restoredLayer.id,
        nazwa: restoredLayer.nazwa,
        widoczna: true,
        typ: restoredLayer.typ,
      };

      if (restoredLayer.grupaNadrzedna === 'Stwórz poza grupami' || !restoredLayer.grupaNadrzedna) {
        // Add at main level
        setWarstwy(prev => [...prev, newLayer]);
      } else {
        // Add to parent group
        const addToParent = (layers: Warstwa[]): Warstwa[] => {
          return layers.map(layer => {
            if (layer.id === restoredLayer.grupaNadrzedna) {
              return {
                ...layer,
                dzieci: layer.dzieci ? [...layer.dzieci, newLayer] : [newLayer],
              };
            }
            if (layer.dzieci) {
              return {
                ...layer,
                dzieci: addToParent(layer.dzieci),
              };
            }
            return layer;
          });
        };
        setWarstwy(addToParent);
      }
    });

    setLayerManagerModalOpen(false);
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
            universe-mapmaker.online
          </Box>

          <Toolbar {...toolbarHandlers} selectedLayer={selectedLayer} />
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
            warstwy={warstwy}
            selectedLayer={selectedLayer}
            searchFilter={searchFilter}
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
            warstwy={warstwy}
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
        existingGroups={warstwy}
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
        existingGroups={warstwy}
      />

      {/* Print Config Modal */}
      <PrintConfigModal
        open={printConfigModalOpen}
        onClose={() => setPrintConfigModalOpen(false)}
        onSubmit={handlePrintConfig}
        projectLayers={warstwy}
      />
    </>
  );
};

export default LeftPanel;
