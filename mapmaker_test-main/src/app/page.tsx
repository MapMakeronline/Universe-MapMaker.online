/**
 * GŁÓWNA STRONA APLIKACJI MAPMAKER
 * 
 * Odpowiada za:
 * - Renderowanie głównego interfejsu użytkownika
 * - Zarządzanie stanem aplikacji (warstwy, filtry, sidebar)
 * - Koordynację między komponentami UI (Sidebar, LayerTree, PropertiesPanel)
 * - Obsługę drag & drop między warstwami
 * - Funkcjonalność wyszukiwania i filtrowania warstw
 */
'use client';

import { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { Sidebar } from '@/components/ui/Sidebar';
import { useDragDrop } from '@/hooks/useDragDrop';
import { 
  Warstwa, 
  FilterType, 
  ExpandedSections, 
  CheckboxStates 
} from '@/types/layers';
import { sidebarStyles } from '@/config/theme';

export default function HomePage() {
  // Stan UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(sidebarStyles.width);
  const [isResizing, setIsResizing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('wszystko');
  const [selectedBasemap, setSelectedBasemap] = useState('google-maps');

  // Stan dla rozwijanych sekcji w panelu właściwości
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    'informacje-ogolne': false,
    'pobieranie': false,
    'widocznosc': false,
    'informacje-szczegolowe': false,
    'informacje-szczegolowe-grupa': false,
    'uslugi': false,
    'metadane': false,
    'inne-projekty': false,
    // Sekcje dla warstwy (z prefiksem warstwy-)
    'warstwa-informacje-ogolne': false,
    'warstwa-pobieranie': false,
    'warstwa-widocznosc': false,
    'warstwa-informacje-szczegolowe': false,
    'warstwa-styl-warstwy': false,
    // Sekcje dla grup (z prefiksem grupa-)
    'grupa-informacje-ogolne': false,
    'grupa-pobieranie': false,
    'grupa-widocznosc': false,
    'grupa-informacje-szczegolowe': false
  });

  // Stany dla checkboxów w różnych sekcjach
  const [checkboxStates, setCheckboxStates] = useState<CheckboxStates>({
    // Właściwości grupy - sekcja Widoczność
    grupaDomyslneWyswietlanie: true,
    
    // Właściwości warstwy - sekcja Widoczność
    warstwaDomyslneWyswietlanie: true,
    warstwaWidocznoscOdSkali: false,
    warstwaWidocznoscTrybOpublikowany: true
  });

  // Dane warstw - tymczasowo na sztywno
  const [selectedLayer, setSelectedLayer] = useState<Warstwa | null>(null);
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

  // Hook do obsługi drag & drop
  const dragDropHandlers = useDragDrop(warstwy, setWarstwy);

  // === HANDLER FUNCTIONS ===

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
        // Sprawdź czy dziecko jest bezpośrednio w tej grupie
        const directChild = layer.dzieci.find(child => child.id === childId);
        if (directChild) {
          return layer;
        }
        // Sprawdź rekurencyjnie w podgrupach
        const found = findParentGroup(layer.dzieci, childId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleLayerSelect = (id: string) => {
    const layer = findLayerById(warstwy, id);
    setSelectedLayer(layer);
    console.log('Selected layer:', layer?.nazwa);
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
    console.log(`Toggle checkbox: ${checkboxName}`, !checkboxStates[checkboxName]);
  };

  // === ENDPOINT HANDLERS ===
  
  const handleEditLayerStyle = async () => {
    if (!selectedLayer) {
      console.warn('Brak wybranej warstwy do edycji');
      return;
    }

    try {
      console.log(`🎨 Edytuj styl warstwy: ${selectedLayer.nazwa}`);
      console.log('📡 Wywołanie endpointu: POST /api/layers/style/edit');
      console.log('📦 Payload:', {
        layerId: selectedLayer.id,
        layerName: selectedLayer.nazwa,
        action: 'edit'
      });
    } catch (error) {
      console.error('❌ Błąd podczas edycji stylu:', error);
    }
  };

  const handleManageLayer = async () => {
    if (!selectedLayer) {
      console.warn('Brak wybranej warstwy do zarządzania');
      return;
    }

    try {
      console.log(`⚙️ Zarządzaj warstwą: ${selectedLayer.nazwa}`);
      console.log('📡 Wywołanie endpointu: POST /api/layers/manage');
      console.log('📦 Payload:', {
        layerId: selectedLayer.id,
        layerName: selectedLayer.nazwa,
        layerType: selectedLayer.typ,
        action: 'manage'
      });
    } catch (error) {
      console.error('❌ Błąd podczas zarządzania warstwą:', error);
    }
  };

  const handleLayerLabeling = async () => {
    if (!selectedLayer) {
      console.warn('Brak wybranej warstwy do etykietowania');
      return;
    }

    try {
      console.log(`🏷️ Etykietowanie warstwy: ${selectedLayer.nazwa}`);
      console.log('📡 Wywołanie endpointu: POST /api/layers/labels');
      console.log('📦 Payload:', {
        layerId: selectedLayer.id,
        layerName: selectedLayer.nazwa,
        layerType: selectedLayer.typ,
        action: 'labeling'
      });
    } catch (error) {
      console.error('❌ Błąd podczas etykietowania:', error);
    }
  };

  // === TOOLBAR HANDLERS ===
  
  const toolbarHandlers = {
    onAddInspireDataset: () => console.log('Dodaj zbiór danych INSPIRE'),
    onAddNationalLaw: () => console.log('Dodaj zbiór danych PRAWO KRAJOWE'),
    onAddLayer: () => console.log('Dodaj warstwę'),
    onImportLayer: () => console.log('Importuj warstwę'),
    onAddGroup: () => console.log('Dodaj grupę'),
    onRemoveLayer: () => console.log('Usuń grupę lub warstwę'),
    onCreateConsultation: () => console.log('Utwórz konsultacje społeczne'),
    onLayerManager: () => console.log('Menedżer warstw'),
    onPrintConfig: () => console.log('Konfiguracja wyrysu i wypisu')
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Tło z Google Maps */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.05)),
            url("https://media.wired.com/photos/59269cd37034dc5f91bec0f1/191:100/w_1280,c_limit/GoogleMapTA.jpg?mbid=social_retweet")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -1
        }}
      />
      
      {/* Toggle button - zawsze widoczny */}
      <IconButton
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="sidebar-toggle"
        sx={{
          position: 'fixed',
          top: 20,
          left: sidebarCollapsed ? 20 : sidebarWidth + 20,
          zIndex: 1300,
          transition: isResizing ? 'none' : 'left 0.3s ease',
        }}
      >
        {sidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
      </IconButton>

      {/* Sidebar - wyodrębniony do osobnego komponentu */}
      <Sidebar
        collapsed={sidebarCollapsed}
        warstwy={warstwy}
        selectedLayer={selectedLayer}
        searchFilter={searchFilter}
        selectedFilter={selectedFilter}
        filterMenuOpen={filterMenuOpen}
        expandedSections={expandedSections}
        onWidthChange={(width: number) => setSidebarWidth(width)}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
        checkboxStates={checkboxStates}
        dragDropState={dragDropHandlers.dragDropState}
        selectedBasemap={selectedBasemap}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLayerSelect={handleLayerSelect}
        onToggleVisibility={toggleVisibility}
        onToggleExpansion={toggleExpansion}
        onSearchChange={setSearchFilter}
        onFilterChange={setSelectedFilter}
        onFilterMenuToggle={() => setFilterMenuOpen(!filterMenuOpen)}
        onExpandAll={() => console.log('Expand all')}
        onCollapseAll={() => console.log('Collapse all')}
        onToggleSection={toggleSection}
        onToggleCheckbox={toggleCheckbox}
        onClosePanelSelection={() => setSelectedLayer(null)}
        onEditLayerStyle={handleEditLayerStyle}
        onManageLayer={handleManageLayer}
        onLayerLabeling={handleLayerLabeling}
        onBasemapChange={setSelectedBasemap}
        onDragStart={dragDropHandlers.handleDragStart}
        onDragEnd={dragDropHandlers.handleDragEnd}
        onDragEnter={dragDropHandlers.handleDragEnter}
        onDragLeave={dragDropHandlers.handleDragLeave}
        onDragOver={dragDropHandlers.handleDragOver}
        onDrop={dragDropHandlers.handleDrop}
        onDropAtEnd={dragDropHandlers.handleDropAtEnd}
        onLayerTreeDragOver={dragDropHandlers.handleLayerTreeDragOver}
        onMainLevelDragOver={dragDropHandlers.handleMainLevelDragOver}
        findParentGroup={findParentGroup}
        {...toolbarHandlers}
      />

      {/* Główna obszar treści */}
      <Box
        sx={{
          flex: 1,
          marginLeft: sidebarCollapsed ? 0 : sidebarWidth,
          transition: 'margin-left 0.3s ease',
          position: 'relative'
        }}
      >
        {/* Tutaj może być mapa lub inna zawartość */}
      </Box>
    </Box>
  );
}
