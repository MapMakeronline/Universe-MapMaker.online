/**
 * LayerSettingsPanel - Panel ustawień pojedynczej warstwy
 * Zawiera opacity slider, min/max zoom, style presets i inne opcje
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  Grid,
  Paper,
  alpha
} from '@mui/material'
import {
  Close as CloseIcon,
  Palette as StyleIcon,
  Visibility as VisibilityIcon,
  ZoomIn as ZoomIcon,
  Opacity as OpacityIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as ResetIcon
} from '@mui/icons-material'

import { LayerNode } from '../../state/layers/types'
import { useLayerActions, useLayerTree } from '../../state/layers/hooks'

interface LayerSettingsPanelProps {
  open: boolean
  layerId: string | null
  onClose: () => void
}

const LayerSettingsPanel: React.FC<LayerSettingsPanelProps> = ({
  open,
  layerId,
  onClose
}) => {
  const { tree } = useLayerTree()
  const { onVisibilityToggle, onOpacityChange } = useLayerActions()

  const [localSettings, setLocalSettings] = useState({
    visible: true,
    opacity: 1,
    minZoom: 0,
    maxZoom: 22,
    style: 'default'
  })

  // Find current layer
  const findLayer = (nodes: LayerNode[], id: string): LayerNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findLayer(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const currentLayer = layerId ? findLayer(tree, layerId) : null

  // Update local settings when layer changes
  useEffect(() => {
    if (currentLayer) {
      setLocalSettings({
        visible: currentLayer.visible ?? true,
        opacity: currentLayer.opacity ?? 1,
        minZoom: currentLayer.minZoom ?? 0,
        maxZoom: currentLayer.maxZoom ?? 22,
        style: 'default'
      })
    }
  }, [currentLayer])

  if (!currentLayer) {
    return null
  }

  // Style presets based on layer type
  const getStyleOptions = () => {
    switch (currentLayer.type) {
      case 'wms':
      case 'raster':
        return [
          { value: 'default', label: 'Domyślny' },
          { value: 'grayscale', label: 'Odcienie szarości' },
          { value: 'sepia', label: 'Sepia' },
          { value: 'invert', label: 'Inwersja' }
        ]
      case 'vector':
      case 'wfs':
        return [
          { value: 'default', label: 'Domyślny' },
          { value: 'simple', label: 'Prosty' },
          { value: 'detailed', label: 'Szczegółowy' },
          { value: 'minimal', label: 'Minimalny' }
        ]
      case 'mvt':
        return [
          { value: 'default', label: 'Domyślny' },
          { value: 'bright', label: 'Jasny' },
          { value: 'dark', label: 'Ciemny' },
          { value: 'satellite', label: 'Satelitarny' }
        ]
      default:
        return [{ value: 'default', label: 'Domyślny' }]
    }
  }

  const handleSave = () => {
    // Apply changes through Redux actions
    if (localSettings.visible !== currentLayer.visible) {
      onVisibilityToggle(currentLayer.id, localSettings.visible)
    }
    if (localSettings.opacity !== currentLayer.opacity) {
      onOpacityChange(currentLayer.id, localSettings.opacity)
    }

    // TODO: Handle minZoom, maxZoom, style changes
    console.log('Saving layer settings:', localSettings)
    onClose()
  }

  const handleReset = () => {
    setLocalSettings({
      visible: true,
      opacity: 1,
      minZoom: 0,
      maxZoom: 22,
      style: 'default'
    })
  }

  const getLayerTypeIcon = () => {
    const icons = {
      wms: '🗺️',
      wfs: '📍',
      raster: '🖼️',
      vector: '📐',
      mvt: '🔷',
      group: '📁'
    }
    return icons[currentLayer.type] || '📄'
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 350,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Ustawienia warstwy
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Layer info */}
          <Paper
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.2rem' }}>
                {getLayerTypeIcon()}
              </Typography>
              <Box>
                <Typography variant="subtitle1" fontWeight={500}>
                  {currentLayer.name}
                </Typography>
                <Chip
                  label={currentLayer.type.toUpperCase()}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Settings Content */}
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {/* Visibility */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VisibilityIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Widoczność
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.visible}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, visible: e.target.checked }))}
                />
              }
              label="Pokaż warstwę na mapie"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Opacity */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <OpacityIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Przezroczystość
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {Math.round(localSettings.opacity * 100)}% nieprzezroczystości
            </Typography>

            <Slider
              value={localSettings.opacity}
              onChange={(_, value) => setLocalSettings(prev => ({ ...prev, opacity: value as number }))}
              min={0}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Zoom Levels */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ZoomIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Poziomy powiększenia
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Zoom"
                  value={localSettings.minZoom}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, minZoom: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 0, max: 22 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Zoom"
                  value={localSettings.maxZoom}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, maxZoom: parseInt(e.target.value) || 22 }))}
                  inputProps={{ min: 0, max: 22 }}
                />
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Warstwa będzie widoczna między poziomami {localSettings.minZoom} a {localSettings.maxZoom}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Style Presets */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StyleIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Styl warstwy
              </Typography>
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>Wybierz styl</InputLabel>
              <Select
                value={localSettings.style}
                label="Wybierz styl"
                onChange={(e) => setLocalSettings(prev => ({ ...prev, style: e.target.value }))}
              >
                {getStyleOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Layer Source Info */}
          {currentLayer.source && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Informacje o źródle
                </Typography>

                <Paper sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                  {currentLayer.source.wms && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        WMS URL:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {currentLayer.source.wms.url}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Warstwa: {currentLayer.source.wms.layer}
                      </Typography>
                    </Box>
                  )}

                  {currentLayer.source.wfs && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        WFS URL:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {currentLayer.source.wfs.url}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Typ: {currentLayer.source.wfs.typeName}
                      </Typography>
                    </Box>
                  )}

                  {currentLayer.source.mvt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        MVT URL:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {currentLayer.source.mvt.url}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </>
          )}
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.3)
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Zapisz
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Drawer>
  )
}

export default LayerSettingsPanel