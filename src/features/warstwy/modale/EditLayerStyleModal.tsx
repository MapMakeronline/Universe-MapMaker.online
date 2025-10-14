'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme } from '@mui/material/styles';

interface EditLayerStyleModalProps {
  open: boolean;
  onClose: () => void;
  layerName?: string;
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
  symbol: string;
  value: string;
  legend: string;
}

interface CategorizedStyle {
  columnName: string;
  categories: CategorizedValue[];
}

export default function EditLayerStyleModal({ open, onClose, layerName }: EditLayerStyleModalProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

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

  const handleSave = () => {
    const styleData = {
      type: activeTab === 0 ? 'single' : 'categorized',
      fillLayers: activeTab === 0 ? fillLayers : null,
      categorizedStyle: activeTab === 1 ? categorizedStyle : null,
    };

    console.log('💾 Zapisywanie stylu warstwy:', styleData);
    onClose();
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
        Edytuj styl warstwy
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
        <Tab label="Pojedynczy symbol" />
        <Tab label="Wartość unikalna" />
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
        {/* Tab 1: Pojedynczy symbol - MULTIPLE FILL LAYERS */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

            {/* List of fill layers */}
            {fillLayers.map((fillLayer, index) => (
              <Box
                key={fillLayer.id}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                {/* Fill layer header (collapsible) */}
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

                {/* Fill layer content (collapsible) */}
                <Collapse in={fillLayer.expanded}>
                  <Box sx={{ bgcolor: 'white', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Typ symbolu */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Typ symbolu
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={fillLayer.fillType}
                        onChange={(e) => updateFillLayer(fillLayer.id, { fillType: e.target.value })}
                      >
                        <MenuItem value="Simple Fill">Simple Fill</MenuItem>
                      </TextField>
                    </Box>

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

                    {/* Styl wypełnienia */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Styl wypełnienia
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value="Wypełniony"
                      >
                        <MenuItem value="Wypełniony">Wypełniony</MenuItem>
                      </TextField>
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
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={fillLayer.strokeWidth}
                          onChange={(e) => updateFillLayer(fillLayer.id, { strokeWidth: parseFloat(e.target.value) })}
                        />
                        <TextField
                          select
                          size="small"
                          value={fillLayer.unit}
                          onChange={(e) => updateFillLayer(fillLayer.id, { unit: e.target.value })}
                          sx={{ minWidth: '140px' }}
                        >
                          <MenuItem value="Milimetry">Milimetry</MenuItem>
                          <MenuItem value="Piksele">Piksele</MenuItem>
                          <MenuItem value="Punkty">Punkty</MenuItem>
                        </TextField>
                      </Box>
                    </Box>

                    {/* Styl obrysu */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Styl obrysu
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={fillLayer.strokeStyle}
                        onChange={(e) => updateFillLayer(fillLayer.id, { strokeStyle: e.target.value })}
                      >
                        <MenuItem value="Linia ciągła">Linia ciągła</MenuItem>
                        <MenuItem value="Linia przerywana">Linia przerywana</MenuItem>
                        <MenuItem value="Linia kropkowana">Linia kropkowana</MenuItem>
                      </TextField>
                    </Box>

                    {/* Styl połączenia */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Styl połączenia
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={fillLayer.joinStyle}
                        onChange={(e) => updateFillLayer(fillLayer.id, { joinStyle: e.target.value })}
                      >
                        <MenuItem value="Ścięty">Ścięty</MenuItem>
                        <MenuItem value="Zaokrąglony">Zaokrąglony</MenuItem>
                        <MenuItem value="Ostry">Ostry</MenuItem>
                      </TextField>
                    </Box>

                    {/* Przesunięcie */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Przesunięcie
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                          <Typography sx={{ fontSize: '12px', minWidth: '20px' }}>X:</Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={fillLayer.offsetX}
                            onChange={(e) => updateFillLayer(fillLayer.id, { offsetX: parseFloat(e.target.value) })}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                          <Typography sx={{ fontSize: '12px', minWidth: '20px' }}>Y:</Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={fillLayer.offsetY}
                            onChange={(e) => updateFillLayer(fillLayer.id, { offsetY: parseFloat(e.target.value) })}
                          />
                        </Box>
                        <TextField
                          select
                          size="small"
                          value={fillLayer.unit}
                          sx={{ minWidth: '140px' }}
                        >
                          <MenuItem value="Milimetry">Milimetry</MenuItem>
                        </TextField>
                      </Box>
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

                    {/* Jednostka */}
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                        Jednostka
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={fillLayer.unit}
                        onChange={(e) => updateFillLayer(fillLayer.id, { unit: e.target.value })}
                      >
                        <MenuItem value="Milimetry">Milimetry</MenuItem>
                        <MenuItem value="Piksele">Piksele</MenuItem>
                        <MenuItem value="Punkty">Punkty</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        )}

        {/* Tab 2: Wartość unikalna */}
        {activeTab === 1 && (
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
                value={categorizedStyle.columnName}
                onChange={(e) => setCategorizedStyle({ ...categorizedStyle, columnName: e.target.value })}
                placeholder="Wybierz z listy"
              >
                <MenuItem value="">Wybierz z listy</MenuItem>
                <MenuItem value="kategoria">kategoria</MenuItem>
                <MenuItem value="typ">typ</MenuItem>
                <MenuItem value="nazwa">nazwa</MenuItem>
              </TextField>
            </Box>

            {/* Przyciski akcji */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#4a5568',
                  '&:hover': { bgcolor: '#2d3748' },
                  textTransform: 'none',
                  fontSize: '13px',
                }}
                onClick={() => console.log('Klasyfikuj clicked')}
              >
                Klasyfikuj
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#4a5568',
                  '&:hover': { bgcolor: '#2d3748' },
                  textTransform: 'none',
                  fontSize: '13px',
                }}
                onClick={() => {
                  const newCategory: CategorizedValue = {
                    symbol: '',
                    value: '',
                    legend: '',
                  };
                  setCategorizedStyle({
                    ...categorizedStyle,
                    categories: [...categorizedStyle.categories, newCategory],
                  });
                }}
              >
                Dodaj
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#4a5568',
                  '&:hover': { bgcolor: '#2d3748' },
                  textTransform: 'none',
                  fontSize: '13px',
                }}
                onClick={() => {
                  if (categorizedStyle.categories.length > 0) {
                    setCategorizedStyle({
                      ...categorizedStyle,
                      categories: categorizedStyle.categories.slice(0, -1),
                    });
                  }
                }}
              >
                Usuń
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#4a5568',
                  '&:hover': { bgcolor: '#2d3748' },
                  textTransform: 'none',
                  fontSize: '13px',
                }}
                onClick={() => setCategorizedStyle({ ...categorizedStyle, categories: [] })}
              >
                Usuń wszystkie
              </Button>
            </Box>

            {/* Tabela */}
            <Box sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#4a5568' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '13px', py: 1.5 }}>
                      Symbol
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '13px', py: 1.5 }}>
                      Wartość
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '13px', py: 1.5 }}>
                      Legenda
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categorizedStyle.categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary, fontSize: '13px' }}>
                        Brak kategorii. Kliknij "Dodaj" aby utworzyć nową kategorię.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categorizedStyle.categories.map((category, index) => (
                      <TableRow key={index} sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={category.symbol}
                            onChange={(e) => {
                              const newCategories = [...categorizedStyle.categories];
                              newCategories[index].symbol = e.target.value;
                              setCategorizedStyle({ ...categorizedStyle, categories: newCategories });
                            }}
                            placeholder="Symbol"
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={category.value}
                            onChange={(e) => {
                              const newCategories = [...categorizedStyle.categories];
                              newCategories[index].value = e.target.value;
                              setCategorizedStyle({ ...categorizedStyle, categories: newCategories });
                            }}
                            placeholder="Wartość"
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={category.legend}
                            onChange={(e) => {
                              const newCategories = [...categorizedStyle.categories];
                              newCategories[index].legend = e.target.value;
                              setCategorizedStyle({ ...categorizedStyle, categories: newCategories });
                            }}
                            placeholder="Legenda"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
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
          Anuluj
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
