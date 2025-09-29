'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Checkbox,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fab,
  Tooltip,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Layers,
  Visibility,
  VisibilityOff,
  Settings,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Print,
  Share,
  Info,
  Home,
  Edit,
  Search,
  Map as MapIcon,
  FilterList,
  Download,
  Help,
  AccountCircle,
  Notifications,
  Email,
  LocationOn,
  Place,
  Lock,
  Description,
  Assessment,
} from '@mui/icons-material';

interface LayerItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface LayerGroup {
  id: string;
  name: string;
  children?: LayerItem[];
  disabled?: boolean;
  locked?: boolean;
  expanded?: boolean;
}

const MapInterface: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [baseMap, setBaseMap] = useState('Google Maps');
  
  const [layerGroups, setLayerGroups] = useState<LayerGroup[]>([
    {
      id: 'obszary',
      name: 'OBSZARY',
      expanded: true,
      children: [
        { id: 'rewitalizacja', name: 'Obszar Rewitalizacji', color: '#e53e3e', visible: true },
        { id: 'dzialki', name: 'Działki', color: '#8b5cf6', visible: true },
        { id: 'miejscowe', name: 'MIEJSCOWE PLANY ZAGOSPODA...', color: '#8b5cf6', visible: true },
        { id: 'rastry', name: 'RASTRY - MIEJSCOWE PLANY ZAG...', color: '#8b5cf6', visible: false },
        { id: 'granice', name: 'Granice', color: '#8b5cf6', visible: false },
        { id: 'punkty', name: 'PUNKTY ADRESOWE BUDYNKÓW', color: '#8b5cf6', visible: false }
      ]
    },
    {
      id: 'wlasciwosci',
      name: 'Właściwości projektu',
      disabled: true
    },
    {
      id: 'uslugi',
      name: 'Usługi',
      expanded: false,
      children: []
    },
    {
      id: 'pobieranie',
      name: 'Pobieranie',
      locked: true
    },
    {
      id: 'metadane',
      name: 'Metadane'
    }
  ]);

  const toggleGroup = (groupId: string) => {
    setLayerGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, expanded: !group.expanded }
        : group
    ));
  };

  const toggleLayer = (groupId: string, layerId: string) => {
    setLayerGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            children: group.children?.map(layer =>
              layer.id === layerId 
                ? { ...layer, visible: !layer.visible }
                : layer
            )
          }
        : group
    ));
  };

  const getActiveLayersCount = () => {
    return layerGroups.reduce((count, group) => {
      if (group.children) {
        return count + group.children.filter(layer => layer.visible).length;
      }
      return count;
    }, 0);
  };

  const rightToolbarItems = [
    { icon: <Home />, tooltip: 'Home', color: '#e53e3e' },
    { icon: <LocationOn />, tooltip: 'Lokalizacja', color: '#e53e3e' },
    { icon: <Edit />, tooltip: 'Edycja' },
    { icon: <Place />, tooltip: 'Miejsca' },
    { icon: <Search />, tooltip: 'Wyszukaj' },
    { icon: <Info />, tooltip: 'Informacje' },
    { icon: <Print />, tooltip: 'Drukuj' },
    { icon: <Download />, tooltip: 'Pobierz' },
    { icon: <AccountCircle />, tooltip: 'Konto' },
    { icon: <Help />, tooltip: 'Pomoc' },
    { icon: <Notifications />, tooltip: 'Powiadomienia' },
    { icon: <Email />, tooltip: 'Email' },
    { icon: <Settings />, tooltip: 'Ustawienia' }
  ];

  const getGroupIcon = (group: LayerGroup) => {
    if (group.locked) return <Lock />;
    if (group.id === 'wlasciwosci') return <Description />;
    if (group.id === 'metadane') return <Assessment />;
    return <Layers />;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? 320 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
            bgcolor: '#2d3748',
            color: 'white',
            borderRight: 'none'
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #4a5568' }}>
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 300 }}>
            ogrodziemiesip
          </Typography>
        </Box>

        {/* Toolbar */}
        <Box sx={{ p: 1, borderBottom: '1px solid #4a5568' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {[
              <MyLocation />, <FilterList />, <MapIcon />, <Share />, 
              <Download />, <Print />, <Layers />, <Edit />
            ].map((icon, index) => (
              <IconButton key={index} size="small" sx={{ color: '#a0aec0' }}>
                {icon}
              </IconButton>
            ))}
          </Box>
          
          {/* Layer search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Znajdź warstwę lub grupę"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                bgcolor: '#4a5568',
                color: 'white',
                '& fieldset': { border: 'none' },
                '& input::placeholder': { color: '#a0aec0' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#a0aec0' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Layer List */}
        <List sx={{ flex: 1, py: 0, overflow: 'auto' }}>
          {layerGroups.map((group) => (
            <Box key={group.id}>
              <ListItemButton
                onClick={() => group.children && !group.disabled && toggleGroup(group.id)}
                sx={{ 
                  py: 0.5,
                  opacity: group.disabled ? 0.5 : 1,
                  bgcolor: group.id === 'obszary' ? '#4a5568' : 'transparent'
                }}
                disabled={group.disabled}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {group.children && !group.disabled ? (
                    group.expanded ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />
                  ) : (
                    getGroupIcon(group)
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={group.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    color: group.disabled ? '#718096' : '#e2e8f0'
                  }}
                />
                {group.locked && <Lock sx={{ color: '#718096', fontSize: 16 }} />}
              </ListItemButton>

              {group.children && (
                <Collapse in={group.expanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.children.map((layer) => (
                      <ListItem key={layer.id} sx={{ py: 0, pl: 4 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Checkbox
                            checked={layer.visible}
                            onChange={() => toggleLayer(group.id, layer.id)}
                            size="small"
                            sx={{ 
                              color: '#a0aec0',
                              '&.Mui-checked': { color: layer.color }
                            }}
                          />
                        </ListItemIcon>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: layer.color,
                            mr: 1,
                            borderRadius: 1
                          }}
                        />
                        <ListItemText
                          primary={layer.name}
                          primaryTypographyProps={{
                            fontSize: '0.75rem',
                            color: '#cbd5e0'
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" sx={{ color: '#718096' }}>
                            <Visibility sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#718096' }}>
                            <Download sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #4a5568' }}>
          <Typography variant="caption" sx={{ color: '#718096', display: 'block', mb: 1 }}>
            Brak udostępnionych usług
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: '#a0aec0' }}>Wybór mapy podkładowej</InputLabel>
            <Select
              value={baseMap}
              onChange={(e) => setBaseMap(e.target.value)}
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4a5568' }
              }}
            >
              <MenuItem value="Google Maps">Google Maps</MenuItem>
              <MenuItem value="OpenStreetMap">OpenStreetMap</MenuItem>
              <MenuItem value="Satellite">Satellite</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="caption" sx={{ color: '#718096', display: 'block', mt: 1 }}>
            Rozpocznij poradnik
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Map Container */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            position: 'relative',
            bgcolor: '#c8e6c9',
            backgroundImage: 'radial-gradient(circle, #a5d6a7 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* Simulated map */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: '80%',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h4" sx={{ color: '#2e7d32', opacity: 0.7 }}>
              Mapa Ogrodzieniec
            </Typography>
          </Box>

          {/* Layer Stack Indicator */}
          <Paper
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255,255,255,0.9)'
            }}
          >
            <Box sx={{ display: 'flex' }}>
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: '#e53e3e',
                    ml: i > 1 ? -0.5 : 0,
                    borderRadius: 1,
                    border: '1px solid white'
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Zoom Controls */}
          <Paper
            sx={{
              position: 'absolute',
              bottom: 100,
              left: 16,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <IconButton sx={{ borderRadius: 0 }}>
              <ZoomIn />
            </IconButton>
            <Divider />
            <IconButton sx={{ borderRadius: 0 }}>
              <ZoomOut />
            </IconButton>
          </Paper>

          {/* Attribution */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              bgcolor: 'rgba(255,255,255,0.8)',
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}
          >
            <Typography variant="caption">
              ŁutekzKanki
            </Typography>
          </Box>
        </Box>

        {/* Bottom Panel */}
        <Paper
          sx={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            bgcolor: '#f8f9fa',
            borderTop: '1px solid #e9ecef'
          }}
        >
          <Typography variant="body2" sx={{ mr: 2 }}>
            Współrzędne: 50.4501° N, 19.5142° E
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Skala: 1:50000
          </Typography>
          <Typography variant="body2">
            Aktywne warstwy: {getActiveLayersCount()}
          </Typography>
        </Paper>
      </Box>

      {/* Right Toolbar */}
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000
        }}
      >
        {rightToolbarItems.map((item, index) => (
          <Tooltip key={index} title={item.tooltip} placement="left">
            <Fab
              size="small"
              sx={{
                bgcolor: item.color || '#fff',
                color: item.color ? '#fff' : '#666',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: item.color || '#f0f0f0'
                }
              }}
            >
              {item.icon}
            </Fab>
          </Tooltip>
        ))}
      </Box>

      {/* Toggle Sidebar Button */}
      <Fab
        size="small"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        sx={{
          position: 'fixed',
          top: 16,
          left: sidebarOpen ? 336 : 16,
          zIndex: 1300,
          bgcolor: '#2d3748',
          color: 'white',
          transition: 'left 0.3s ease'
        }}
      >
        <Layers />
      </Fab>
    </Box>
  );
};

export default MapInterface;