'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tabs,
  Tab,
  Box,
  TextField,
  MenuItem,
  Slider,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Collapse,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useTheme } from '@mui/material/styles';
// Styles API integration (RTK Query)
import {
  useGetLayerRendererQuery,
  useSetLayerStyleMutation,
  useClassifyValuesMutation,
  type RGBAColor,
  type BaseSymbol,
  type StyleConfiguration,
  type CategorizationCategory,
} from '@/backend/styles';
// Layers API integration (RTK Query)
import {
  useGetLayerAttributesQuery,
  useImportLayerStyleMutation,
  useAddLabelMutation,
  useSetLayerOpacityMutation,
} from '@/backend/layers';
import { showSuccess, showError } from '@/redux/slices/notificationSlice';
import { useAppDispatch } from '@/redux/hooks';
import {
  hexToRgba,
  rgbaToHex,
  getUnitValue,
  getUnitName,
  getStrokeStyleValue,
  getStrokeStyleName,
  getJoinStyleValue,
  getJoinStyleName,
  alphaToOpacity,
  opacityToAlpha,
} from '@/utils/colorConversion';

// TODO: Export style endpoint not yet implemented in @/backend/layers
const useLazyExportStyleQuery = () => [async () => {}, { data: null, isLoading: false }] as any;

// Temporary mock types (will be replaced when backend types are finalized)
type SymbolLayer = any;
type SimpleFillAttributes = any;
type Category = any;

interface EditLayerStyleModalProps {
  open: boolean;
  onClose: () => void;
  layerName?: string;
  layerId?: string; // UUID warstwy
  projectName?: string; // Nazwa projektu z URL
}

// Interface for single fill layer
interface FillLayer {
  id: string;
  fillType: string;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: string;
  strokeOpacity: number;
  joinStyle: string;
  offsetX: number;
  offsetY: number;
  unit: string;
  expanded: boolean;
}

interface CategorizedValue {
  symbol: string; // hex color code (e.g., "#ea8989")
  value: string;
  legend: string;
}

interface CategorizedStyle {
  columnName: string;
  categories: CategorizedValue[];
}

export default function EditLayerStyleModal({ open, onClose, layerName, layerId, projectName }: EditLayerStyleModalProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceExistingStyle, setReplaceExistingStyle] = useState(true);

  // Layer opacity (global for entire QGIS layer, 0-100%)
  const [layerOpacityPercent, setLayerOpacityPercent] = useState(100);
  const [isUpdatingOpacity, setIsUpdatingOpacity] = useState(false);

  // RTK Query mutations
  const [setLayerOpacity] = useSetLayerOpacityMutation();

  // Tab 1: Pojedynczy symbol - ARRAY of fill layers
  const [fillLayers, setFillLayers] = useState<FillLayer[]>([
    {
      id: '1',
      fillType: 'Simple Fill',
      fillColor: '#ea8989',
      fillOpacity: 100,
      strokeColor: '#000000',
      strokeWidth: 0.26,
      strokeStyle: 'Linia ciągła',
      strokeOpacity: 100,
      joinStyle: 'Ścięty',
      offsetX: 0,
      offsetY: 0,
      unit: 'Milimetry',
      expanded: true,
    }
  ]);

  // Tab 2: Wartość unikalna - state
  const [categorizedStyle, setCategorizedStyle] = useState<CategorizedStyle>({
    columnName: '',
    categories: [],
  });

  // Tab 4: Etykietowanie - state
  const [labelConfig, setLabelConfig] = useState({
    columnName: '',
    color: '#000000',
    size: 8,
    minScale: 1,
    maxScale: 1000000,
  });

  // RTK Query hooks
  const { data: rendererData, isLoading: isLoadingRenderer } = useGetLayerRendererQuery(
    { project: projectName!, layer_id: layerId! },
    { skip: !open || !projectName || !layerId }
  );

  const { data: attributesData } = useGetLayerAttributesQuery(
    { project: projectName!, layer_id: layerId! },
    { skip: !open || !projectName || !layerId }
  );

  const [setStyle, { isLoading: isSaving }] = useSetLayerStyleMutation();
  const [classify, { isLoading: isClassifying }] = useClassifyValuesMutation();
  const [importStyle, { isLoading: isImporting }] = useImportLayerStyleMutation();
  const [triggerExportStyle, { isLoading: isExporting }] = useLazyExportStyleQuery();
  const [addLabel, { isLoading: isAddingLabel }] = useAddLabelMutation();

  // Load existing style when modal opens (same as original)
  useEffect(() => {
    if (!open || !rendererData) return;

    console.log('📥 Loading existing style:', rendererData);

    try {
      if (rendererData.data.renderer === 'Single Symbol') {
        const backendSymbol = rendererData.data.symbols;
        const convertedFillLayers: FillLayer[] = backendSymbol.fills.map((fill, index) => ({
          id: fill.id || `layer-${index}`,
          fillType: fill.symbol_type,
          fillColor: rgbaToHex(fill.attributes.fill_color),
          fillOpacity: alphaToOpacity(fill.attributes.fill_color[3]),
          strokeColor: rgbaToHex(fill.attributes.stroke_color),
          strokeWidth: fill.attributes.stroke_width.width_value,
          strokeStyle: getStrokeStyleName(fill.attributes.stroke_style),
          strokeOpacity: alphaToOpacity(fill.attributes.stroke_color[3]),
          joinStyle: getJoinStyleName(fill.attributes.join_style),
          offsetX: fill.attributes.offset.x,
          offsetY: fill.attributes.offset.y,
          unit: getUnitName(fill.attributes.offset.unit),
          expanded: index === 0,
        }));
        setFillLayers(convertedFillLayers);
        setActiveTab(0);
      } else if (rendererData.data.renderer === 'Categorized') {
        const convertedCategories: CategorizedValue[] = rendererData.data.categories.map(cat => ({
          symbol: rgbaToHex(cat.symbol.fill.color),
          value: cat.value,
          legend: cat.label,
        }));
        setCategorizedStyle({
          columnName: rendererData.data.value,
          categories: convertedCategories,
        });
        setActiveTab(1);
      }
    } catch (error) {
      console.error('❌ Error loading style:', error);
      dispatch(showError('Nie udało się załadować stylu warstwy'));
    }
  }, [open, rendererData, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Add new fill layer
  const addFillLayer = () => {
    const newFillLayer: FillLayer = {
      id: Date.now().toString(),
      fillType: 'Simple Fill',
      fillColor: '#ea8989',
      fillOpacity: 100,
      strokeColor: '#000000',
      strokeWidth: 0.26,
      strokeStyle: 'Linia ciągła',
      strokeOpacity: 100,
      joinStyle: 'Ścięty',
      offsetX: 0,
      offsetY: 0,
      unit: 'Milimetry',
      expanded: true,
    };
    setFillLayers([...fillLayers, newFillLayer]);
  };

  // Remove fill layer
  const removeFillLayer = (id: string) => {
    setFillLayers(fillLayers.filter(layer => layer.id !== id));
  };

  // Toggle expand/collapse fill layer
  const toggleFillLayer = (id: string) => {
    setFillLayers(fillLayers.map(layer =>
      layer.id === id ? { ...layer, expanded: !layer.expanded } : layer
    ));
  };

  // Update fill layer property
  const updateFillLayer = (id: string, updates: Partial<FillLayer>) => {
    setFillLayers(fillLayers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };

  // Debounced handler for layer opacity changes
  const updateLayerOpacityDebounced = useCallback(
    async (opacityPercent: number) => {
      if (!projectName || !layerId) return;

      setIsUpdatingOpacity(true);
      try {
        // Convert percent (0-100) to backend format (0-255)
        const opacityValue = Math.round((opacityPercent / 100) * 255);

        await setLayerOpacity({
          project: projectName,
          layer_id: layerId,
          opacity: opacityValue,
        }).unwrap();

        dispatch(showSuccess('Przezroczystość warstwy została zmieniona'));
      } catch (error: any) {
        console.error('Error updating layer opacity:', error);
        dispatch(showError(error?.data?.message || 'Błąd podczas zmiany przezroczystości'));
      } finally {
        setIsUpdatingOpacity(false);
      }
    },
    [projectName, layerId, setLayerOpacity, dispatch]
  );

  // Debounce wrapper (300ms delay)
  const debouncedOpacityUpdate = useRef<NodeJS.Timeout | null>(null);
  const handleLayerOpacityChange = (value: number) => {
    // Clamp value 0-100
    const clampedValue = Math.max(0, Math.min(100, value));
    setLayerOpacityPercent(clampedValue);

    // Clear previous timeout
    if (debouncedOpacityUpdate.current) {
      clearTimeout(debouncedOpacityUpdate.current);
    }

    // Set new timeout
    debouncedOpacityUpdate.current = setTimeout(() => {
      updateLayerOpacityDebounced(clampedValue);
    }, 300);
  };

  // Handle Classify button click (Tab 2)
  const handleClassify = async () => {
    if (!projectName || !layerId || !categorizedStyle.columnName) {
      dispatch(showError('Wybierz kolumnę do klasyfikacji'));
      return;
    }

    try {
      const result = await classify({
        project: projectName,
        layer_id: layerId,
        column: categorizedStyle.columnName,
      }).unwrap();

      console.log('✅ Classified categories:', result.data);

      const convertedCategories: CategorizedValue[] = result.data.map(cat => ({
        symbol: rgbaToHex(cat.symbol.fill.color),
        value: cat.value,
        legend: cat.label,
      }));

      setCategorizedStyle({
        ...categorizedStyle,
        categories: convertedCategories,
      });

      dispatch(showSuccess(`Sklasyfikowano ${convertedCategories.length} kategorii`));
    } catch (error: any) {
      console.error('❌ Classify error:', error);
      dispatch(showError(error?.data?.message || 'Nie udało się sklasyfikować wartości'));
    }
  };

  // Handle file selection for import (Tab 3)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.qml') || fileName.endsWith('.sld')) {
        setSelectedFile(file);
        dispatch(showSuccess(`Wybrano plik: ${file.name}`));
      } else {
        dispatch(showError('Nieobsługiwany format pliku. Wybierz plik .qml lub .sld'));
        event.target.value = '';
      }
    }
  };

  // Handle import style from QML/SLD (Tab 3)
  const handleImportStyle = async () => {
    if (!selectedFile || !projectName || !layerId) {
      dispatch(showError('Nie wybrano pliku lub brak danych projektu'));
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData with ONLY the file
      // RTK Query endpoint will append project and layer_id
      const formData = new FormData();
      formData.append('style', selectedFile);

      console.log('📤 Sending style import request:', {
        project: projectName,
        layer_id: layerId,
        fileName: selectedFile.name,
      });

      await importStyle({
        project: projectName,
        layer_id: layerId,
        files: formData,
      }).unwrap();

      dispatch(showSuccess('Styl został pomyślnie zaimportowany'));
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error: any) {
      console.error('❌ Import style error:', error);
      console.error('❌ Error data:', JSON.stringify(error?.data, null, 2));
      console.error('❌ Error status:', error?.status);

      const errorMessage = error?.data?.message
        || error?.data?.error
        || error?.message
        || 'Nie udało się zaimportować stylu';

      dispatch(showError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export style (Tab 1: Pobierz)
  const handleExportStyle = async (format: 'qml' | 'sld') => {
    if (!projectName || !layerId) {
      dispatch(showError('Brak wymaganych danych projektu'));
      return;
    }

    try {
      const result = await triggerExportStyle({
        project: projectName,
        layer_id: layerId,
        style_format: format,
      }).unwrap();

      // Create blob and download
      const blob = result as Blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${layerName}_style.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      dispatch(showSuccess(`Styl został pobrany jako ${format.toUpperCase()}`));
    } catch (error: any) {
      console.error('❌ Export style error:', error);
      dispatch(showError(error?.data?.message || 'Nie udało się pobrać stylu'));
    }
  };

  // Handle add label (Tab 3: Etykietowanie)
  const handleAddLabel = async () => {
    if (!projectName || !layerId || !labelConfig.columnName) {
      dispatch(showError('Wybierz kolumnę dla etykiet'));
      return;
    }

    try {
      // Convert hex color to RGBA array
      const colorRgba = hexToRgba(labelConfig.color, 255);

      await addLabel({
        project: projectName,
        layer_id: layerId,
        textColor: colorRgba,
        fontSize: labelConfig.size,
        minScale: labelConfig.minScale,
        maxScale: labelConfig.maxScale,
        columnName: labelConfig.columnName,
      }).unwrap();

      dispatch(showSuccess('Etykiety zostały dodane do warstwy'));
      onClose();
    } catch (error: any) {
      console.error('❌ Add label error:', error);
      dispatch(showError(error?.data?.message || 'Nie udało się dodać etykiet'));
    }
  };

  const handleSave = async () => {
    console.log('🔵 handleSave called', { projectName, layerId, activeTab });

    if (!projectName || !layerId) {
      dispatch(showError('Brak wymaganych danych projektu'));
      return;
    }

    // Tab 3 uses separate import handler
    if (activeTab === 2) {
      await handleImportStyle();
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 0) {
        // Tab 1: Single Symbol - same as original implementation
        const backendFills: SymbolLayer[] = fillLayers.map((fill, index) => ({
          symbol_type: fill.fillType as any,
          id: fill.id,
          enabled: true,
          attributes: {
            fill_color: hexToRgba(fill.fillColor, opacityToAlpha(fill.fillOpacity)),
            fill_style: 1,
            stroke_color: hexToRgba(fill.strokeColor, opacityToAlpha(fill.strokeOpacity)),
            stroke_width: {
              width_value: fill.strokeWidth,
              unit: getUnitValue(fill.unit),
            },
            stroke_style: getStrokeStyleValue(fill.strokeStyle),
            join_style: getJoinStyleValue(fill.joinStyle),
            offset: {
              x: fill.offsetX,
              y: fill.offsetY,
              unit: getUnitValue(fill.unit),
            },
          },
        }));

        const backendSymbol: BackendSymbol = {
          symbol_type: 'fill',
          fill: {
            color: hexToRgba(fillLayers[0].fillColor, opacityToAlpha(fillLayers[0].fillOpacity)),
            opacity: fillLayers[0].fillOpacity / 100,
            unit: getUnitValue(fillLayers[0].unit),
          },
          fills: backendFills,
        };

        await setStyle({
          project: projectName,
          id: layerId,
          style_configuration: {
            renderer: 'Single Symbol' as const,
            symbols: backendSymbol,
          },
        }).unwrap();

        dispatch(showSuccess('Styl warstwy został zapisany'));
        onClose();
      } else {
        // Tab 2: Categorized - same as original
        if (!categorizedStyle.columnName || categorizedStyle.categories.length === 0) {
          dispatch(showError('Dodaj co najmniej jedną kategorię'));
          return;
        }

        const backendCategories: Category[] = categorizedStyle.categories.map((cat, index) => ({
          symbol: {
            symbol_type: 'fill',
            fill: {
              color: hexToRgba(cat.symbol, 255),
              opacity: 1.0,
              unit: 0,
            },
            fills: [
              {
                symbol_type: 'Simple Fill',
                id: `${index}.0`,
                enabled: true,
                attributes: {
                  fill_color: hexToRgba(cat.symbol, 255),
                  fill_style: 1,
                  stroke_color: [0, 0, 0, 255],
                  stroke_width: { width_value: 0.26, unit: 0 },
                  stroke_style: 1,
                  join_style: 128,
                  offset: { x: 0, y: 0, unit: 0 },
                },
              },
            ],
          },
          value: cat.value,
          label: cat.legend,
        }));

        await setStyle({
          project: projectName,
          id: layerId,
          style_configuration: {
            renderer: 'Categorized',
            value: categorizedStyle.columnName,
            categories: backendCategories,
          },
        }).unwrap();

        dispatch(showSuccess('Styl kategorii został zapisany'));
        onClose();
      }
    } catch (error: any) {
      console.error('❌ Save style error:', error);
      dispatch(showError(error?.data?.message || 'Nie udało się zapisać stylu warstwy'));
    } finally {
      setIsLoading(false);
    }
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
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
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
        }}
      >
        Zarządzaj stylem
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          bgcolor: '#f7f9fc',
          borderBottom: `1px solid ${theme.palette.divider}`,
          '& .MuiTab-root': {
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            minHeight: '48px',
          },
        }}
      >
        <Tab label="Edytuj" />
        <Tab label="Pobierz" />
        <Tab label="Importuj" />
        <Tab label="Etykietowanie" />
      </Tabs>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 3,
          minHeight: '400px',
        }}
      >
        {/* Tab 1: Edytuj (Same as Pojedynczy symbol in original) */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* LAYER OPACITY (Global for entire QGIS layer) */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                p: 2,
                bgcolor: 'white',
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 2 }}>
                Krycie warstwy (Layer Opacity)
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Slider */}
                <Slider
                  value={layerOpacityPercent}
                  onChange={(e, value) => handleLayerOpacityChange(value as number)}
                  min={0}
                  max={100}
                  disabled={isUpdatingOpacity || !projectName || !layerId}
                  sx={{
                    flex: 1,
                    color: '#ef4444', // Red color (like in screenshot)
                    '& .MuiSlider-thumb': {
                      width: 16,
                      height: 16,
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#ef4444',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: '#e5e7eb',
                    },
                  }}
                />

                {/* Input with % */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={layerOpacityPercent}
                    onChange={(e) => handleLayerOpacityChange(parseInt(e.target.value) || 0)}
                    disabled={isUpdatingOpacity || !projectName || !layerId}
                    sx={{ width: '70px' }}
                    inputProps={{ min: 0, max: 100 }}
                  />
                  <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
                    %
                  </Typography>
                </Box>
              </Box>

              {/* Loading indicator */}
              {isUpdatingOpacity && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Aktualizowanie...
                </Typography>
              )}

              {/* Info text */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Przezroczystość całej warstwy (0% = przezroczysta, 100% = nieprzezroczysta)
              </Typography>
            </Box>

            {/* Wypełnienie + button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                Wypełnienie
              </Typography>
              <IconButton
                size="small"
                onClick={addFillLayer}
                sx={{
                  bgcolor: '#4a5568',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  '&:hover': { bgcolor: '#2d3748' }
                }}
              >
                <AddIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Box>

            {/* List of fill layers - SAME AS ORIGINAL (lines 467-745) */}
            {fillLayers.map((fillLayer, index) => (
              <Box
                key={fillLayer.id}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                {/* Fill layer header */}
                <Box
                  sx={{
                    bgcolor: '#3a4556',
                    color: 'white',
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleFillLayer(fillLayer.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '13px' }}>
                      {fillLayer.fillType}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ color: 'white', p: 0.5 }}
                    >
                      {fillLayer.expanded ? <ExpandLessIcon sx={{ fontSize: '18px' }} /> : <ExpandMoreIcon sx={{ fontSize: '18px' }} />}
                    </IconButton>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFillLayer(fillLayer.id);
                    }}
                    sx={{
                      color: 'white',
                      p: 0.5,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                    }}
                  >
                    <RemoveIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Box>

                {/* Fill layer content */}
                <Collapse in={fillLayer.expanded}>
                  <Box sx={{ bgcolor: 'white', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Kolor wypełnienia */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Kolor wypełnienia
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={fillLayer.fillColor}
                          onChange={(e) => updateFillLayer(fillLayer.id, { fillColor: e.target.value })}
                          style={{ width: '60px', height: '38px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          value={fillLayer.fillColor}
                          onChange={(e) => updateFillLayer(fillLayer.id, { fillColor: e.target.value })}
                        />
                      </Box>
                    </Box>

                    {/* Kolor obrysu */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Kolor obrysu
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={fillLayer.strokeColor}
                          onChange={(e) => updateFillLayer(fillLayer.id, { strokeColor: e.target.value })}
                          style={{ width: '60px', height: '38px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          value={fillLayer.strokeColor}
                          onChange={(e) => updateFillLayer(fillLayer.id, { strokeColor: e.target.value })}
                        />
                      </Box>
                    </Box>

                    {/* Szerokość obrysu */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Szerokość obrysu
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={fillLayer.strokeWidth}
                        onChange={(e) => updateFillLayer(fillLayer.id, { strokeWidth: parseFloat(e.target.value) })}
                      />
                    </Box>

                    {/* Krycie (Opacity) */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                          Krycie
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={fillLayer.fillOpacity}
                            onChange={(e) => updateFillLayer(fillLayer.id, { fillOpacity: parseFloat(e.target.value) })}
                            sx={{ width: '70px' }}
                            inputProps={{ min: 0, max: 100 }}
                          />
                          <Typography sx={{ fontSize: '14px' }}>%</Typography>
                        </Box>
                      </Box>
                      <Slider
                        value={fillLayer.fillOpacity}
                        onChange={(e, value) => updateFillLayer(fillLayer.id, { fillOpacity: value as number })}
                        min={0}
                        max={100}
                        sx={{
                          '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        )}

        {/* Tab 2: Pobierz (Download style file) */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.text.primary }}>
              Pobierz styl warstwy
            </Typography>
            <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary, textAlign: 'center', maxWidth: '400px' }}>
              Wybierz format do zapisania stylu warstwy ({layerName})
            </Typography>

            {/* Format selection buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => handleExportStyle('qml')}
                disabled={isExporting}
                sx={{
                  bgcolor: '#4a5568',
                  '&:hover': { bgcolor: '#2d3748' },
                  minWidth: '150px',
                  py: 1.5,
                }}
              >
                {isExporting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Pobierz QML'}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => handleExportStyle('sld')}
                disabled={isExporting}
                sx={{
                  bgcolor: '#4a5568',
                  '&:hover': { bgcolor: '#2d3748' },
                  minWidth: '150px',
                  py: 1.5,
                }}
              >
                {isExporting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Pobierz SLD'}
              </Button>
            </Box>

            <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, textAlign: 'center', maxWidth: '500px', mt: 2 }}>
              • QML - format QGIS (rekomendowany dla projektów QGIS)<br />
              • SLD - uniwersalny format OGC (kompatybilny z GeoServer, MapServer)
            </Typography>
          </Box>
        )}

        {/* Tab 3: Importuj */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
                Zaimportuj styl z pliku QML lub SLD
              </Typography>
              <Typography sx={{ fontSize: '12px', color: theme.palette.warning.main, mt: 0.5 }}>
                ⚠️ Uwaga: Import dodaje nowe warstwy symbolizacji do istniejących. Jeśli chcesz zastąpić cały styl, najpierw usuń istniejące warstwy w zakładce &quot;Edytuj&quot;.
              </Typography>
            </Box>

            {/* File upload area */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: '8px',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                bgcolor: 'white',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: '#fafafa',
                },
              }}
            >
              <UploadFileIcon sx={{ fontSize: '48px', color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 500, textAlign: 'center' }}>
                {selectedFile ? selectedFile.name : 'Upuść plik tutaj lub kliknij, aby wybrać z dysku (.qml)'}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, textAlign: 'center' }}>
                Obsługiwane formaty: QML, SLD
              </Typography>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept=".qml,.sld"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <Box
                sx={{
                  bgcolor: 'white',
                  p: 2,
                  borderRadius: '4px',
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                  {selectedFile.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <CloseIcon sx={{ fontSize: '18px' }} />
                </IconButton>
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={handleImportStyle}
              disabled={!selectedFile || isImporting}
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                py: 1.5,
              }}
            >
              {isImporting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Importuj'}
            </Button>
          </Box>
        )}

        {/* Tab 4: Etykietowanie */}
        {activeTab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Nazwa kolumny */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                Nazwa kolumny
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={labelConfig.columnName}
                onChange={(e) => setLabelConfig({ ...labelConfig, columnName: e.target.value })}
                placeholder="Wybierz kolumnę z tekstem etykiety"
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="">Wybierz z listy</MenuItem>
                {attributesData?.data?.feature_names.map((attrName) => (
                  <MenuItem key={attrName} value={attrName}>
                    {attrName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Kolor etykiety */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                Kolor etykiety
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <input
                  type="color"
                  value={labelConfig.color}
                  onChange={(e) => setLabelConfig({ ...labelConfig, color: e.target.value })}
                  style={{
                    width: '60px',
                    height: '38px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  value={labelConfig.color}
                  onChange={(e) => setLabelConfig({ ...labelConfig, color: e.target.value })}
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            </Box>

            {/* Rozmiar etykiety */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                Rozmiar etykiety
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={labelConfig.size}
                onChange={(e) => setLabelConfig({ ...labelConfig, size: parseInt(e.target.value) })}
                sx={{ bgcolor: 'white' }}
              >
                {[6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size} pt
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Minimalna skala */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                Minimalna skala
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={labelConfig.minScale}
                onChange={(e) => setLabelConfig({ ...labelConfig, minScale: parseInt(e.target.value) })}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value={1}>1:1</MenuItem>
                <MenuItem value={100}>1:100</MenuItem>
                <MenuItem value={500}>1:500</MenuItem>
                <MenuItem value={1000}>1:1,000</MenuItem>
                <MenuItem value={2500}>1:2,500</MenuItem>
                <MenuItem value={5000}>1:5,000</MenuItem>
                <MenuItem value={10000}>1:10,000</MenuItem>
                <MenuItem value={25000}>1:25,000</MenuItem>
                <MenuItem value={50000}>1:50,000</MenuItem>
              </TextField>
              <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mt: 0.5 }}>
                Etykiety będą widoczne przy zbliżeniu większym niż ta skala
              </Typography>
            </Box>

            {/* Maksymalna skala */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                Maksymalna skala
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={labelConfig.maxScale}
                onChange={(e) => setLabelConfig({ ...labelConfig, maxScale: parseInt(e.target.value) })}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value={10000}>1:10,000</MenuItem>
                <MenuItem value={25000}>1:25,000</MenuItem>
                <MenuItem value={50000}>1:50,000</MenuItem>
                <MenuItem value={100000}>1:100,000</MenuItem>
                <MenuItem value={250000}>1:250,000</MenuItem>
                <MenuItem value={500000}>1:500,000</MenuItem>
                <MenuItem value={1000000}>1:1,000,000</MenuItem>
                <MenuItem value={2500000}>1:2,500,000</MenuItem>
                <MenuItem value={10000000}>1:10,000,000</MenuItem>
              </TextField>
              <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mt: 0.5 }}>
                Etykiety będą widoczne przy oddaleniu mniejszym niż ta skala
              </Typography>
            </Box>

            {/* Add label button */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleAddLabel}
              disabled={!labelConfig.columnName || isAddingLabel}
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                py: 1.5,
                mt: 2,
              }}
            >
              {isAddingLabel ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Włącz'}
            </Button>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          pb: 3,
          pt: 0,
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {activeTab === 1 || activeTab === 2 || activeTab === 3 ? 'Zamknij' : 'Anuluj'}
        </Button>
        {/* Show Save button only for tab 0 (Edytuj) - other tabs have their own action buttons */}
        {activeTab === 0 && (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isLoading || isSaving}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {isLoading || isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
