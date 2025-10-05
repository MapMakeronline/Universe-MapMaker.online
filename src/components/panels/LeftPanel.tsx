'use client';

import React, { useState } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { Toolbar } from './components/Toolbar';
import { SearchBar } from './components/SearchBar';
import { LayerTree } from './components/LayerTree';
import { PropertiesPanel } from './components/PropertiesPanel';
import BuildingsPanel from './components/BuildingsPanel';
import AddDatasetModal from './AddDatasetModal';
import AddNationalLawModal from './AddNationalLawModal';
import AddLayerModal from './AddLayerModal';
import ImportLayerModal from './ImportLayerModal';
import AddGroupModal from './AddGroupModal';
import CreateConsultationModal from './CreateConsultationModal';
import LayerManagerModal from './LayerManagerModal';
import PrintConfigModal from './PrintConfigModal';
import { useResizable, useDragDrop } from '../../hooks';

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

  const [warstwy, setWarstwy] = useState<Warstwa[]>([
    {
      id: 'obszar-rewitalizacji',
      nazwa: 'Obszar Rewitalizacji',
      widoczna: true,
      typ: 'grupa',
      rozwinięta: true,
      dzieci: [
        {
          id: 'miejscowe-plany',
          nazwa: 'MIEJSCOWE PLANY ZAGOSPODAROWANIA...',
          widoczna: true,
          typ: 'grupa',
          rozwinięta: false,
          dzieci: [
            { id: 'xxvii-282-2001', nazwa: 'XXVII_282_2001', widoczna: true, typ: 'wektor' },
            { id: 'xxxvii-283-2001', nazwa: 'XXXVII_283_2001', widoczna: true, typ: 'wektor' },
            { id: 'xxxvii-286-2001', nazwa: 'XXXVII_286_2001', widoczna: true, typ: 'wektor' },
            { id: 'xlii-307-2002', nazwa: 'XLII_307_2002', widoczna: true, typ: 'wektor' },
            { id: 'xlii-308-2002', nazwa: 'XLII_308_2002', widoczna: true, typ: 'wektor' },
            { id: 'xlviii-335-2002', nazwa: 'XLVIII_335_2002', widoczna: true, typ: 'wektor' },
            { id: 'xxxviii-325-2005', nazwa: 'XXXVIII_325_2005', widoczna: true, typ: 'wektor' }
          ]
        },
        {
          id: 'granice',
          nazwa: 'Granice',
          widoczna: false,
          typ: 'grupa',
          rozwinięta: true,
          dzieci: [
            { id: 'granica-miasta-gminy', nazwa: 'Granica Miasta i Gminy', widoczna: false, typ: 'wektor' },
            { id: 'granica-miasta-ogrodzieniec', nazwa: 'Granica Miasta Ogrodzieniec', widoczna: false, typ: 'wektor' },
            { id: 'granice-obreby-geodezyjne', nazwa: 'Granice obręby geodezyjne...', widoczna: false, typ: 'wektor' },
            { id: 'granice-dzialek-1-10000', nazwa: '(< 1:10000) Granice działek ...', widoczna: false, typ: 'wektor' }
          ]
        }
      ]
    }
  ]);

  // Hooks
  const { width, isResizing, handleMouseDown } = useResizable({
    initialWidth: parseInt(SIDEBAR_CONFIG.sidebar.width),
    minWidth: parseInt(SIDEBAR_CONFIG.sidebar.minWidth),
    maxWidth: parseInt(SIDEBAR_CONFIG.sidebar.maxWidth),
  });

  const dragDropHandlers = useDragDrop(warstwy, setWarstwy);

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
    const updateWarstwy = (warstwy: Warstwa[]): Warstwa[] => {
      return warstwy.map(warstwa => {
        if (warstwa.id === id) {
          const newWarstwa = { ...warstwa, widoczna: !warstwa.widoczna };
          if (newWarstwa.dzieci) {
            newWarstwa.dzieci = newWarstwa.dzieci.map(dziecko => ({
              ...dziecko,
              widoczna: newWarstwa.widoczna
            }));
          }
          return newWarstwa;
        }
        if (warstwa.dzieci) {
          return { ...warstwa, dzieci: updateWarstwy(warstwa.dzieci) };
        }
        return warstwa;
      });
    };
    setWarstwy(updateWarstwy(warstwy));
  };

  const toggleExpansion = (id: string) => {
    const updateExpansion = (warstwy: Warstwa[]): Warstwa[] => {
      return warstwy.map(warstwa => {
        if (warstwa.id === id && warstwa.typ === 'grupa') {
          return { ...warstwa, rozwinięta: !warstwa.rozwinięta };
        }
        if (warstwa.dzieci) {
          return { ...warstwa, dzieci: updateExpansion(warstwa.dzieci) };
        }
        return warstwa;
      });
    };
    setWarstwy(updateExpansion(warstwy));
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
    const expandAllRecursive = (warstwy: Warstwa[]): Warstwa[] => {
      return warstwy.map(warstwa => ({
        ...warstwa,
        rozwinięta: warstwa.typ === 'grupa',
        dzieci: warstwa.dzieci ? expandAllRecursive(warstwa.dzieci) : undefined
      }));
    };
    setWarstwy(expandAllRecursive(warstwy));
  };

  const collapseAll = () => {
    const collapseAllRecursive = (warstwy: Warstwa[]): Warstwa[] => {
      return warstwy.map(warstwa => ({
        ...warstwa,
        rozwinięta: false,
        dzieci: warstwa.dzieci ? collapseAllRecursive(warstwa.dzieci) : undefined
      }));
    };
    setWarstwy(collapseAllRecursive(warstwy));
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
      const deleteLayerRecursive = (layers: Warstwa[], targetId: string): Warstwa[] => {
        return layers.filter(layer => {
          if (layer.id === targetId) {
            return false; // Remove this layer
          }
          if (layer.dzieci) {
            layer.dzieci = deleteLayerRecursive(layer.dzieci, targetId);
          }
          return true;
        });
      };

      const updatedWarstwy = deleteLayerRecursive(warstwy, selectedLayer.id);
      setWarstwy(updatedWarstwy);
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
