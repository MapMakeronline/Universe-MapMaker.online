/**
 * LAYER INFO MODAL - Modal z informacjami szczegółowymi o warstwie
 *
 * Backend integration: ✅ COMPLETE
 * - Nazwa warstwy: POST /api/layer/name (renameLayer)
 * - Przezroczystość: POST /api/layer/opacity/set (setLayerOpacity)
 * - Widoczność od skali: POST /api/layer/scale (setLayerScale)
 * - Widoczność w trybie opublikowanym: POST /api/layer/published/set (setLayerPublished)
 * - Domyślne wyświetlanie: POST /api/layer/selection (setLayerVisibility)
 * - Eksport warstwy: GET /api/layer/export (exportLayer)
 *
 * Layout: Tabs (podobnie jak EditLayerStyleModal)
 * - Zakładka 1: Informacje ogólne (Nazwa, Grupa, Typ geometrii, Tabela atrybutów)
 * - Zakładka 2: Ustawienia widoczności (Przezroczystość, switche widoczności)
 * - Zakładka 3: Pobieranie (Eksport warstwy do SHP, GML, KML, GeoJSON)
 */
'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';
import {
  useRenameLayerMutation,
  useSetLayerOpacityMutation,
  useSetLayerScaleMutation,
  useSetLayerPublishedMutation,
  useSetLayerVisibilityMutation,
} from '@/backend/layers';
import { LayerNode } from '@/types-app/layers';

interface LayerInfoModalProps {
  open: boolean;
  onClose: () => void;
  layer: LayerNode | null;
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
      id={`layer-info-tabpanel-${index}`}
      aria-labelledby={`layer-info-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const LayerInfoModal: React.FC<LayerInfoModalProps> = ({
  open,
  onClose,
  layer,
}) => {
  const theme = useTheme();

  // Get project name from URL params
  const searchParams = useSearchParams();
  const projectName = searchParams?.get('project');

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Form state (initialized from layer data when modal opens)
  const [name, setName] = useState('');
  const [opacity, setOpacity] = useState(100);
  const [defaultVisible, setDefaultVisible] = useState(true);
  const [scaleVisible, setScaleVisible] = useState(false);
  const [publishedVisible, setPublishedVisible] = useState(true);

  // Export state
  const [exportFormat, setExportFormat] = useState<'ESRI SHAPEFILE' | 'GML' | 'KML' | 'GEOJSON'>('GEOJSON');
  const [exportEpsg, setExportEpsg] = useState<number>(4326);
  const [isExporting, setIsExporting] = useState(false);

  // RTK Query mutations
  const [renameLayer, { isLoading: isRenamingLayer }] = useRenameLayerMutation();
  const [updateLayerOpacity, { isLoading: isSettingOpacity }] = useSetLayerOpacityMutation();
  const [updateLayerScale, { isLoading: isSettingScale }] = useSetLayerScaleMutation();
  const [updateLayerPublished, { isLoading: isSettingPublished }] = useSetLayerPublishedMutation();
  const [updateLayerVisibility, { isLoading: isSettingVisibility }] = useSetLayerVisibilityMutation();

  // Combined loading state
  const isSaving = isRenamingLayer || isSettingOpacity || isSettingScale || isSettingPublished || isSettingVisibility;

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Original layer name for comparison (to detect changes)
  const [originalName, setOriginalName] = useState('');

  // Reset form when modal opens with new layer data
  React.useEffect(() => {
    if (open && layer) {
      console.log('📝 LayerInfoModal opened with layer:', layer);
      console.log('📝 projectName:', projectName);
      console.log('📝 layer.id:', layer.id);

      // Initialize form with current layer data
      setName(layer.name || '');
      setOriginalName(layer.name || '');
      setOpacity(Math.round((layer.opacity || 1) * 100)); // Convert 0-1 to 0-100%
      setDefaultVisible(layer.visible !== undefined ? layer.visible : true);
      setScaleVisible(false); // TODO: Get from backend
      setPublishedVisible(true); // TODO: Get from backend
      setError(null);
      setActiveTab(0); // Reset to first tab
    }
  }, [open, layer, projectName]);

  const handleSave = async () => {
    if (!projectName || !layer?.id) {
      setError('Brak nazwy projektu lub ID warstwy');
      return;
    }

    setError(null);
    const errors: string[] = [];

    // 1. Update layer name (if changed)
    if (name !== originalName) {
      try {
        console.log('📝 Renaming layer:', { project: projectName, layer_id: layer.id, new_name: name });
        await renameLayer({
          project: projectName,
          layer_id: layer.id,
          new_name: name,
        }).unwrap();
        console.log('✅ Layer renamed successfully');
      } catch (err: any) {
        console.error('❌ Error renaming layer:', err);
        errors.push('Zmiana nazwy: ' + (err?.data?.message || 'błąd'));
      }
    }

    // 2. Update opacity (convert 0-100% to 0-255 for backend)
    try {
      const opacityValue = Math.round((opacity / 100) * 255);
      console.log('🎨 Setting layer opacity:', { project: projectName, layer_id: layer.id, opacity: opacityValue });
      await updateLayerOpacity({
        project: projectName,
        layer_id: layer.id,
        opacity: opacityValue,
      }).unwrap();
      console.log('✅ Opacity set successfully');
    } catch (err: any) {
      console.error('❌ Error setting opacity:', err);
      errors.push('Przezroczystość: ' + (err?.data?.message || 'błąd'));
    }

    // 3. Update scale visibility
    try {
      if (scaleVisible) {
        console.log('📏 Setting layer scale visibility:', { project: projectName, layer_id: layer.id });
        await updateLayerScale({
          project: projectName,
          layer_id: layer.id,
          max_scale: 100,
          min_scale: 10000,
          turn_off: false,
        }).unwrap();
      } else {
        console.log('📏 Turning off layer scale visibility:', { project: projectName, layer_id: layer.id });
        await updateLayerScale({
          project: projectName,
          layer_id: layer.id,
          max_scale: 100,
          min_scale: 10000,
          turn_off: true,
        }).unwrap();
      }
      console.log('✅ Scale visibility set successfully');
    } catch (err: any) {
      console.error('❌ Error setting scale visibility:', err);
      errors.push('Skala widoczności: ' + (err?.data?.message || 'błąd backendu (500)'));
    }

    // 4. Update published visibility
    try {
      console.log('🌐 Setting layer published status:', { project: projectName, layer_id: layer.id, published: publishedVisible });
      await updateLayerPublished({
        project: projectName,
        layer_id: layer.id,
        published: publishedVisible,
      }).unwrap();
      console.log('✅ Published status set successfully');
    } catch (err: any) {
      console.error('❌ Error setting published status:', err);
      errors.push('Status publikacji: ' + (err?.data?.message || 'błąd'));
    }

    // 5. Update default visibility
    try {
      console.log('👁️ Setting layer default visibility:', { project: projectName, layer_id: layer.id, checked: defaultVisible });
      await updateLayerVisibility({
        project: projectName,
        layer_id: layer.id,
        checked: defaultVisible,
      }).unwrap();
      console.log('✅ Default visibility set successfully');
    } catch (err: any) {
      console.error('❌ Error setting default visibility:', err);
      errors.push('Domyślna widoczność: ' + (err?.data?.message || 'błąd'));
    }

    // Show errors if any, otherwise close modal
    if (errors.length > 0) {
      setError(`Niektóre zmiany nie zostały zapisane:\n${errors.join('\n')}`);
    } else {
      console.log('✅ All layer properties saved successfully');
      onClose();
    }
  };

  const handleExport = async () => {
    if (!projectName || !layer?.id) {
      setError('Brak nazwy projektu lub ID warstwy');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Build export URL
      const exportUrl = new URL('/api/layer/export', 'https://api.universemapmaker.online');
      exportUrl.searchParams.set('project', projectName);
      exportUrl.searchParams.set('layer_id', layer.id);
      exportUrl.searchParams.set('epsg', exportEpsg.toString());
      exportUrl.searchParams.set('layer_format', exportFormat);

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu autoryzacji');
      }

      console.log('📥 Exporting layer:', {
        project: projectName,
        layer_id: layer.id,
        format: exportFormat,
        epsg: exportEpsg,
        url: exportUrl.toString(),
      });

      // Fetch the file
      const response = await fetch(exportUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Błąd podczas eksportowania warstwy' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Set filename based on format
      const extension = exportFormat === 'ESRI SHAPEFILE' ? 'zip' :
                       exportFormat === 'GML' ? 'gml' :
                       exportFormat === 'KML' ? 'kml' :
                       'geojson';
      link.download = `${layer.name}_${exportFormat}.${extension}`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ Layer exported successfully');
    } catch (err: any) {
      console.error('❌ Error exporting layer:', err);
      setError(err?.message || 'Błąd podczas eksportowania warstwy');
    } finally {
      setIsExporting(false);
    }
  };

  // Don't render if no layer selected
  if (!layer) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        Informacje szczegółowe - {layer.name}
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="zamknij"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="zakładki informacji o warstwie"
        >
          <Tab label="Informacje ogólne" id="layer-info-tab-0" />
          <Tab label="Ustawienia widoczności" id="layer-info-tab-1" />
          <Tab label="Pobieranie" id="layer-info-tab-2" />
        </Tabs>
      </Box>

      <DialogContent sx={{ minHeight: 400 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tab Panel 1: Informacje ogólne */}
        <TabPanel value={activeTab} index={0}>
          {/* Nazwa */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Nazwa
            </Typography>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              disabled={isSaving}
              placeholder="Nazwa warstwy"
            />
          </Box>

          {/* Grupa */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Grupa
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Brak grupy nadrzędnej
            </Typography>
          </Box>

          {/* Typ geometrii */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Typ geometrii
            </Typography>
            <Chip
              label={layer.typ === 'wektor' ? 'Multi-polygon' : layer.typ}
              size="small"
              sx={{
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                fontWeight: 400,
              }}
            />
          </Box>

          {/* Tabela atrybutów */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Tabela atrybutów
            </Typography>
            <Button
              variant="text"
              size="small"
              disabled
              sx={{
                textTransform: 'none',
                color: 'text.disabled',
                justifyContent: 'flex-start',
                pl: 0,
              }}
            >
              Pokaż
            </Button>
          </Box>
        </TabPanel>

        {/* Tab Panel 2: Ustawienia widoczności */}
        <TabPanel value={activeTab} index={1}>
          {/* Przezroczystość warstwy */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Przezroczystość warstwy: {opacity}%
            </Typography>
            <Slider
              value={opacity}
              onChange={(_, value) => setOpacity(value as number)}
              min={0}
              max={100}
              step={5}
              disabled={isSaving}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="auto"
              sx={{ mt: 2 }}
            />
          </Box>

          {/* Domyślne wyświetlanie warstwy */}
          <FormControlLabel
            control={
              <Switch
                checked={defaultVisible}
                onChange={(e) => setDefaultVisible(e.target.checked)}
                size="small"
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Domyślne wyświetlanie warstwy</Typography>
                <Typography variant="caption" color="text.secondary">
                  Warstwa będzie widoczna po załadowaniu projektu
                </Typography>
              </Box>
            }
            sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
          />

          {/* Widoczność od zadanej skali */}
          <FormControlLabel
            control={
              <Switch
                checked={scaleVisible}
                onChange={(e) => setScaleVisible(e.target.checked)}
                size="small"
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Widoczność od zadanej skali</Typography>
                <Typography variant="caption" color="text.secondary">
                  Warstwa będzie widoczna tylko w określonym zakresie skal
                </Typography>
              </Box>
            }
            sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
          />

          {/* Widoczność w trybie opublikowanym */}
          <FormControlLabel
            control={
              <Switch
                checked={publishedVisible}
                onChange={(e) => setPublishedVisible(e.target.checked)}
                size="small"
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Widoczność w trybie opublikowanym</Typography>
                <Typography variant="caption" color="text.secondary">
                  Warstwa będzie widoczna w wersji publicznej projektu
                </Typography>
              </Box>
            }
            sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
          />
        </TabPanel>

        {/* Tab Panel 3: Pobieranie */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Eksportuj warstwę do różnych formatów plików
          </Typography>

          {/* Format eksportu */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Format eksportu</InputLabel>
            <Select
              value={exportFormat}
              label="Format eksportu"
              onChange={(e) => setExportFormat(e.target.value as any)}
              disabled={isExporting}
            >
              <MenuItem value="GEOJSON">GeoJSON (.geojson)</MenuItem>
              <MenuItem value="ESRI SHAPEFILE">Shapefile (.zip)</MenuItem>
              <MenuItem value="GML">GML (.gml)</MenuItem>
              <MenuItem value="KML">KML (.kml)</MenuItem>
            </Select>
          </FormControl>

          {/* Układ współrzędnych EPSG */}
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel>Układ współrzędnych EPSG</InputLabel>
            <Select
              value={exportEpsg}
              label="Układ współrzędnych EPSG"
              onChange={(e) => setExportEpsg(Number(e.target.value))}
              disabled={isExporting}
            >
              <MenuItem value={4326}>EPSG:4326 (WGS 84)</MenuItem>
              <MenuItem value={2180}>EPSG:2180 (PUWG 1992)</MenuItem>
              <MenuItem value={3857}>EPSG:3857 (Web Mercator)</MenuItem>
              <MenuItem value={4277}>EPSG:4277 (OSGB 1936)</MenuItem>
            </Select>
          </FormControl>

          {/* Przycisk pobierania */}
          <Button
            variant="contained"
            fullWidth
            startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={isExporting || !projectName || !layer.id}
            sx={{ py: 1.5 }}
          >
            {isExporting ? 'Eksportowanie...' : 'Pobierz warstwę'}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            {exportFormat === 'ESRI SHAPEFILE' && 'Plik ZIP zawierający: .shp, .shx, .dbf, .prj, .cpg'}
            {exportFormat === 'GML' && 'Geography Markup Language (OGC standard)'}
            {exportFormat === 'KML' && 'Keyhole Markup Language (Google Earth)'}
            {exportFormat === 'GEOJSON' && 'Popularny format JSON dla danych geograficznych'}
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Anuluj
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !projectName || !layer.id}
          sx={{ minWidth: 140 }}
        >
          {isSaving ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Zapisywanie...
            </>
          ) : (
            'Zapisz zmiany'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
