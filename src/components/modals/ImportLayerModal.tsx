'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';

interface ImportLayerModalProps {
  open: boolean;
  onClose: () => void;
}

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
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ImportLayerModal({ open, onClose }: ImportLayerModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [layerName, setLayerName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [wmsLink, setWmsLink] = useState('');
  const [wfsLink, setWfsLink] = useState('');
  const [epsgCode, setEpsgCode] = useState('3857');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedFiles(null); // Clear selected files when switching tabs
  };

  const handleSubmit = () => {
    console.log('Import layer:', { activeTab, layerName, groupName, selectedFiles });
    onClose();
  };

  const handleFileSelect = (files: FileList | null) => {
    setSelectedFiles(files);
    if (files && files.length > 0) {
      console.log('Selected files:', Array.from(files).map(f => f.name));
    }
  };

  const openFileDialog = (accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };
    input.click();
  };

  const renderFileUploadArea = (fileTypes: string, acceptTypes: string, description?: string) => {
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
    };

    return (
      <Paper
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: '#fafafa',
          cursor: 'pointer',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: '#f5f5f5',
          },
        }}
        onClick={() => openFileDialog(acceptTypes)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Upuść plik tutaj lub kliknij, aby wybrać z dysku ({fileTypes})
        </Typography>
        {description && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        )}
        {selectedFiles && selectedFiles.length > 0 && (
          <Box sx={{ mt: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="body2" color="primary">
              Wybrane pliki: {Array.from(selectedFiles).map(f => f.name).join(', ')}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '700px',
          width: '90%',
        },
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#4a5568',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        px: 3,
        fontSize: '16px',
        fontWeight: 600,
        m: 0,
      }}>
        Importuj warstwę
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="CSV" />
            <Tab label="gml" />
            <Tab label="shp" />
            <Tab label="geoJSON" />
            <Tab label="geoTIFF" />
            <Tab label="WMS" />
            <Tab label="WFS" />
          </Tabs>
        </Box>

        {/* CSV Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Nazwa warstwy"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Nazwa grupy</InputLabel>
              <Select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                label="Nazwa grupy"
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Grupa 1">Grupa 1</MenuItem>
                <MenuItem value="Grupa 2">Grupa 2</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="body2" color="textSecondary" gutterBottom>
            <strong>Wymagany plik z rozszerzeniem: .csv</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Należy załączyć plik CSV wygenerowany przez dedykowany skrypt. Opis skryptu:
            <br />
            https://docs.google.com/document/d/1ZqMP4i0oHLrDbc9h0XAzXZz5RvJtrmV9IPlTiqDoEw/edit?usp=sharing
          </Typography>

          {renderFileUploadArea('.csv', '.csv')}
        </TabPanel>

        {/* GML Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Nazwa warstwy"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Nazwa grupy</InputLabel>
              <Select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                label="Nazwa grupy"
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Grupa 1">Grupa 1</MenuItem>
                <MenuItem value="Grupa 2">Grupa 2</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {renderFileUploadArea('.gml', '.gml')}
        </TabPanel>

        {/* SHP Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Nazwa warstwy"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Nazwa grupy</InputLabel>
              <Select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                label="Nazwa grupy"
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Grupa 1">Grupa 1</MenuItem>
                <MenuItem value="Grupa 2">Grupa 2</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Typography variant="body2" sx={{ minWidth: '80px', pt: 1 }}>
              EPSG:
            </Typography>
            <FormControl size="small" sx={{ minWidth: '120px' }}>
              <Select
                value={epsgCode}
                onChange={(e) => setEpsgCode(e.target.value)}
              >
                <MenuItem value="3857">3857</MenuItem>
                <MenuItem value="4326">4326</MenuItem>
                <MenuItem value="2180">2180</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="body2" color="textSecondary" gutterBottom>
            <strong>Wymagane pliki z rozszerzeniem: .shp .shx .dbf</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            *Wybierz EPSG z listy dostępnych lub dodaj jeden z plików (.prj lub .qpj)
          </Typography>

          {renderFileUploadArea('.shp, .shx, .dbf, .cpj, .prj, .qpj, .qix, .cpg, .sbn, .sbx, .atx, .ixs, .mxs, .xml', '.shp,.shx,.dbf,.cpj,.prj,.qpj,.qix,.cpg,.sbn,.sbx,.atx,.ixs,.mxs,.xml')}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Błędy geometrii są naprawiane automatycznie
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Kodowanie znaków: UTF-8
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ID układu współrzędnych projektu : EPSG 3857
            </Typography>
          </Box>
        </TabPanel>

        {/* GeoJSON Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Nazwa warstwy"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Nazwa grupy</InputLabel>
              <Select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                label="Nazwa grupy"
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Grupa 1">Grupa 1</MenuItem>
                <MenuItem value="Grupa 2">Grupa 2</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {renderFileUploadArea('.geojson', '.geojson,.json')}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Błędy geometrii są naprawiane automatycznie
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Kodowanie znaków: UTF-8
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ID układu współrzędnych projektu : EPSG 3857
            </Typography>
          </Box>
        </TabPanel>

        {/* GeoTIFF Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Nazwa warstwy"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Nazwa grupy</InputLabel>
              <Select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                label="Nazwa grupy"
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Grupa 1">Grupa 1</MenuItem>
                <MenuItem value="Grupa 2">Grupa 2</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {renderFileUploadArea('.tiff, .TIFF, .TIF, .tif', '.tiff,.tif')}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Błędy geometrii są naprawiane automatycznie
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ID układu współrzędnych projektu : EPSG 3857
            </Typography>
          </Box>
        </TabPanel>

        {/* WMS Tab */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: '80px' }}>
              Link WMS
            </Typography>
            <TextField
              fullWidth
              value={wmsLink}
              onChange={(e) => setWmsLink(e.target.value)}
              size="small"
              placeholder="Wprowadź URL WMS"
            />
            <Button 
              variant="contained" 
              sx={{ 
                minWidth: '100px',
                bgcolor: '#4a5568',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Pobierz
            </Button>
          </Box>

          <Paper
            sx={{
              minHeight: '200px',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Brak dostępnych warstw do wyświetlenia
            </Typography>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              variant="outlined" 
              fullWidth
              sx={{
                color: '#4a5568',
                borderColor: '#4a5568',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#4a5568',
                  color: 'white',
                },
              }}
            >
              Wyczyść
            </Button>
            <Button 
              variant="outlined" 
              fullWidth
              sx={{
                color: '#4a5568',
                borderColor: '#4a5568',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#4a5568',
                  color: 'white',
                },
              }}
            >
              Zaznacz wszystkie
            </Button>
            <Button 
              variant="contained" 
              fullWidth
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Import
            </Button>
          </Box>
        </TabPanel>

        {/* WFS Tab */}
        <TabPanel value={activeTab} index={6}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: '80px' }}>
              Link WFS
            </Typography>
            <TextField
              fullWidth
              value={wfsLink}
              onChange={(e) => setWfsLink(e.target.value)}
              size="small"
              placeholder="Wprowadź URL WFS"
            />
            <Button 
              variant="contained" 
              sx={{ 
                minWidth: '100px',
                bgcolor: '#4a5568',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Pobierz
            </Button>
          </Box>

          <Paper
            sx={{
              minHeight: '200px',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Brak dostępnych warstw do wyświetlenia
            </Typography>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              variant="outlined" 
              fullWidth
              sx={{
                color: '#4a5568',
                borderColor: '#4a5568',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#4a5568',
                  color: 'white',
                },
              }}
            >
              Wyczyść
            </Button>
            <Button 
              variant="outlined" 
              fullWidth
              sx={{
                color: '#4a5568',
                borderColor: '#4a5568',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#4a5568',
                  color: 'white',
                },
              }}
            >
              Zaznacz wszystkie
            </Button>
            <Button 
              variant="contained" 
              fullWidth
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Import
            </Button>
          </Box>
        </TabPanel>

        {/* Bottom buttons for file upload tabs */}
        {activeTab < 5 && (
          <Box sx={{ p: 3, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={onClose}
              sx={{
                color: '#4a5568',
                borderColor: '#4a5568',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#4a5568',
                  color: 'white',
                },
              }}
            >
              Anuluj
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                px: 4,
                py: 1,
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Import
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}