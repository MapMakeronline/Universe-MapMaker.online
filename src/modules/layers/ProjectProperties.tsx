/**
 * ProjectProperties - Panel właściwości projektu
 * Zawiera wybór podkładu mapy, metadane i ustawienia globalne
 */

'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Grid,
  Paper,
  alpha
} from '@mui/material'
import {
  Map as MapIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'

interface ProjectPropertiesProps {
  onBaseLayerChange?: (baseLayerId: string) => void
  onProjectSettingChange?: (key: string, value: any) => void
}

const ProjectProperties: React.FC<ProjectPropertiesProps> = ({
  onBaseLayerChange,
  onProjectSettingChange
}) => {
  const [selectedBaseLayer, setSelectedBaseLayer] = useState('osm')
  const [projectName, setProjectName] = useState('Nowy projekt')
  const [projectDescription, setProjectDescription] = useState('')
  const [enableClustering, setEnableClustering] = useState(true)
  const [enablePopups, setEnablePopups] = useState(true)
  const [mapOpacity, setMapOpacity] = useState(1)

  // Dostępne warstwy bazowe
  const baseLayers = [
    {
      id: 'osm',
      name: 'OpenStreetMap',
      description: 'Standardowa mapa OpenStreetMap',
      preview: '🗺️'
    },
    {
      id: 'satellite',
      name: 'Satelita',
      description: 'Zdjęcia satelitarne',
      preview: '🛰️'
    },
    {
      id: 'terrain',
      name: 'Teren',
      description: 'Mapa topograficzna',
      preview: '🏔️'
    },
    {
      id: 'dark',
      name: 'Ciemny motyw',
      description: 'Mapa w ciemnych kolorach',
      preview: '🌙'
    }
  ]

  const handleBaseLayerChange = (layerId: string) => {
    setSelectedBaseLayer(layerId)
    onBaseLayerChange?.(layerId)
  }

  const handleProjectNameChange = (name: string) => {
    setProjectName(name)
    onProjectSettingChange?.('name', name)
  }

  const handleProjectDescriptionChange = (description: string) => {
    setProjectDescription(description)
    onProjectSettingChange?.('description', description)
  }

  const handleClusteringToggle = (enabled: boolean) => {
    setEnableClustering(enabled)
    onProjectSettingChange?.('clustering', enabled)
  }

  const handlePopupsToggle = (enabled: boolean) => {
    setEnablePopups(enabled)
    onProjectSettingChange?.('popups', enabled)
  }

  const handleOpacityChange = (opacity: number) => {
    setMapOpacity(opacity)
    onProjectSettingChange?.('mapOpacity', opacity)
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Metadane projektu */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            Informacje o projekcie
          </Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          label="Nazwa projektu"
          value={projectName}
          onChange={(e) => handleProjectNameChange(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          size="small"
          label="Opis projektu"
          multiline
          rows={2}
          value={projectDescription}
          onChange={(e) => handleProjectDescriptionChange(e.target.value)}
          placeholder="Opcjonalny opis projektu..."
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Wybór warstwy bazowej */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MapIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            Warstwa bazowa
          </Typography>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Wybierz podkład</InputLabel>
          <Select
            value={selectedBaseLayer}
            label="Wybierz podkład"
            onChange={(e) => handleBaseLayerChange(e.target.value)}
          >
            {baseLayers.map((layer) => (
              <MenuItem key={layer.id} value={layer.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{layer.preview}</span>
                  <Box>
                    <Typography variant="body2">{layer.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {layer.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Podgląd aktualnej warstwy */}
        <Paper
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="primary">
              Aktualny podkład:
            </Typography>
            <Chip
              label={baseLayers.find(l => l.id === selectedBaseLayer)?.name || 'Brak'}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Ustawienia mapy */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SettingsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            Ustawienia mapy
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Clustering */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={enableClustering}
                  onChange={(e) => handleClusteringToggle(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Grupowanie punktów</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatyczne grupowanie blisko położonych punktów
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {/* Popups */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={enablePopups}
                  onChange={(e) => handlePopupsToggle(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Popupy informacyjne</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Wyświetlanie informacji po kliknięciu na obiekt
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {/* Map Opacity */}
          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Przezroczystość mapy
            </Typography>
            <Box sx={{ px: 1 }}>
              <TextField
                fullWidth
                type="range"
                size="small"
                inputProps={{
                  min: 0.1,
                  max: 1,
                  step: 0.1
                }}
                value={mapOpacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {Math.round(mapOpacity * 100)}% nieprzezroczystości
            </Typography>
          </Grid>
        </Grid>

        {/* Statystyki projektu */}
        <Paper
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5)
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Statystyki projektu:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2">
                Warstwy: <strong>5</strong>
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Grupy: <strong>2</strong>
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Widoczne: <strong>3</strong>
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                Ukryte: <strong>2</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  )
}

export default ProjectProperties