'use client';

import React, { useState } from 'react';
import {
  Drawer,
  Paper,
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Layers,
  Draw,
  Palette,
  FilterList,
  Straighten,
  ChevronLeft,
  Menu,
} from '@mui/icons-material';
import LayerTree from './LayerTree';
import DrawingTools from './DrawingTools';
import MeasurementTools from './MeasurementTools';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`left-panel-tabpanel-${index}`}
      aria-labelledby={`left-panel-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PANEL_WIDTH = 320;

const LeftPanel: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const panelContent = (
    <Box sx={{ width: PANEL_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab
            icon={<Layers />}
            label="Warstwy"
            id="left-panel-tab-0"
            aria-controls="left-panel-tabpanel-0"
          />
          <Tab
            icon={<Draw />}
            label="Rysuj"
            id="left-panel-tab-1"
            aria-controls="left-panel-tabpanel-1"
          />
          <Tab
            icon={<Palette />}
            label="Legenda"
            id="left-panel-tab-2"
            aria-controls="left-panel-tabpanel-2"
          />
          <Tab
            icon={<FilterList />}
            label="Filtry"
            id="left-panel-tab-3"
            aria-controls="left-panel-tabpanel-3"
          />
          <Tab
            icon={<Straighten />}
            label="Pomiary"
            id="left-panel-tab-4"
            aria-controls="left-panel-tabpanel-4"
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <TabPanel value={activeTab} index={0}>
          <LayerTree />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DrawingTools />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Legenda Mapy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Legenda będzie wyświetlać symbole i kolory używane na mapie.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warstwy:
              </Typography>
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2">• POI - Punkty zainteresowania</Typography>
                <Typography variant="body2">• Budynki - Struktury architektoniczne</Typography>
                <Typography variant="body2">• Infrastruktura - Drogi i transport</Typography>
                <Typography variant="body2">• Natura - Tereny zielone</Typography>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Filtry Danych
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Tutaj możesz filtrować dane wyświetlane na mapie.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Dostępne filtry:
              </Typography>
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2">• Filtr czasowy</Typography>
                <Typography variant="body2">• Filtr kategorii</Typography>
                <Typography variant="body2">• Filtr odległości</Typography>
                <Typography variant="body2">• Filtr atrybutów</Typography>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <MeasurementTools />
        </TabPanel>
      </Box>
    </Box>
  );

  // Mobile: drawer overlay
  if (isMobile) {
    return (
      <>
        {/* Menu button for mobile */}
        <IconButton
          onClick={togglePanel}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
            },
          }}
        >
          <Menu />
        </IconButton>

        <Drawer
          anchor="left"
          open={isOpen}
          onClose={togglePanel}
          variant="temporary"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: PANEL_WIDTH,
            },
          }}
        >
          {panelContent}
        </Drawer>
      </>
    );
  }

  // Desktop: persistent sidebar
  return (
    <>
      {isOpen && (
        <Paper
          elevation={2}
          sx={{
            width: PANEL_WIDTH,
            height: '100%',
            position: 'relative',
            borderRadius: 0,
            zIndex: 1200,
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={togglePanel}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <ChevronLeft />
          </IconButton>

          {panelContent}
        </Paper>
      )}

      {/* Open button when panel is closed */}
      {!isOpen && (
        <IconButton
          onClick={togglePanel}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
            },
          }}
        >
          <Menu />
        </IconButton>
      )}
    </>
  );
};

export default LeftPanel;