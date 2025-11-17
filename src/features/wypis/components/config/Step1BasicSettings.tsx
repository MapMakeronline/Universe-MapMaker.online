/**
 * Step1BasicSettings - Krok 1 wizard'a konfiguracji wypisu
 *
 * Features:
 * - Wybór nazwy konfiguracji
 * - Wybór warstwy działek (plots layer)
 * - Wybór kolumny z obrębami (precinct column)
 * - Wybór kolumny z numerami działek (plot number column)
 * - Auto-walidacja na bieżąco
 * - Podpowiedzi (tooltips)
 *
 * Required fields: wszystkie pola (name, layer, 2 columns)
 */

import React, { useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import InfoIcon from '@mui/icons-material/Info'
import LayersIcon from '@mui/icons-material/Layers'
import AbcIcon from '@mui/icons-material/Abc'

import { useGetLayerAttributesQuery } from '@/backend/layers'
import type { PlotLayerConfig } from '../../types'

interface Layer {
  id: string
  name: string
  type: 'vector' | 'raster'
}

interface Step1BasicSettingsProps {
  /** Project name */
  projectName: string
  /** Available layers from QGIS project */
  projectLayers: Layer[]
  /** Current configuration name */
  configName: string
  /** Current plots layer configuration */
  plotsLayer: PlotLayerConfig
  /** Callback when configuration changes */
  onChange: (updates: {
    name?: string
    plotsLayer?: Partial<PlotLayerConfig>
  }) => void
  /** Validation errors from parent */
  errors?: string[]
}

/**
 * Step 1: Basic Settings - Podstawowa konfiguracja wypisu
 *
 * User flow:
 * 1. Enter configuration name (required)
 * 2. Select plots layer from dropdown (only vector layers)
 * 3. Select precinct column (auto-loaded from layer attributes)
 * 4. Select plot number column (auto-loaded from layer attributes)
 * 5. Click "Dalej" when all fields filled
 */
const Step1BasicSettings: React.FC<Step1BasicSettingsProps> = ({
  projectName,
  projectLayers,
  configName,
  plotsLayer,
  onChange,
  errors = [],
}) => {
  // Filter only vector layers (plots must be vector)
  const vectorLayers = projectLayers.filter(layer => layer.type === 'vector')

  // Fetch attributes for selected plots layer
  const {
    data: attributesResponse,
    isLoading: isLoadingAttributes,
    error: attributesError,
  } = useGetLayerAttributesQuery(
    { project: projectName, layer_id: plotsLayer.id },
    { skip: !plotsLayer.id || !projectName }
  )

  // Extract attribute names from response
  const attributes = attributesResponse?.data?.feature_names || []

  // Auto-set layer name when layer ID changes
  useEffect(() => {
    if (plotsLayer.id && !plotsLayer.name) {
      const selectedLayer = vectorLayers.find(l => l.id === plotsLayer.id)
      if (selectedLayer) {
        onChange({
          plotsLayer: { name: selectedLayer.name },
        })
      }
    }
  }, [plotsLayer.id, plotsLayer.name, vectorLayers, onChange])

  // Handle configuration name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value })
  }

  // Handle plots layer selection
  const handleLayerChange = (layerId: string) => {
    const selectedLayer = vectorLayers.find(l => l.id === layerId)
    onChange({
      plotsLayer: {
        id: layerId,
        name: selectedLayer?.name || '',
        precinctColumn: '', // Reset columns when layer changes
        plotNumberColumn: '',
      },
    })
  }

  // Handle precinct column selection
  const handlePrecinctColumnChange = (column: string) => {
    onChange({
      plotsLayer: { precinctColumn: column },
    })
  }

  // Handle plot number column selection
  const handlePlotNumberColumnChange = (column: string) => {
    onChange({
      plotsLayer: { plotNumberColumn: column },
    })
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Krok 1: Podstawowe ustawienia
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Wybierz nazwę konfiguracji oraz warstwę działek z odpowiednimi kolumnami.
        </Typography>
      </Box>

      {/* Configuration Name */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Nazwa konfiguracji
          </Typography>
          <Tooltip title="Podaj unikalną nazwę dla tej konfiguracji wypisu (np. 'Wypis Wyszki', 'MPZP 2024')">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <TextField
          fullWidth
          value={configName}
          onChange={handleNameChange}
          placeholder="np. Wypis Wyszki"
          variant="outlined"
          size="medium"
          error={errors.some(e => e.includes('nazwa'))}
          helperText={
            errors.find(e => e.includes('nazwa')) ||
            'Nazwa będzie wyświetlana na liście konfiguracji'
          }
          sx={{ mb: 2 }}
        />
      </Paper>

      {/* Plots Layer Selection */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LayersIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Warstwa działek
          </Typography>
          <Tooltip title="Wybierz warstwę wektorową zawierającą granice działek">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <FormControl
          fullWidth
          error={errors.some(e => e.includes('warstwę działek'))}
          sx={{ mb: 2 }}
        >
          <InputLabel>Warstwa działek</InputLabel>
          <Select
            value={plotsLayer.id}
            onChange={(e) => handleLayerChange(e.target.value)}
            label="Warstwa działek"
          >
            <MenuItem value="">
              <em>-- Wybierz warstwę --</em>
            </MenuItem>
            {vectorLayers.map(layer => (
              <MenuItem key={layer.id} value={layer.id}>
                {layer.name}
              </MenuItem>
            ))}
          </Select>
          {errors.find(e => e.includes('warstwę działek')) && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {errors.find(e => e.includes('warstwę działek'))}
            </Typography>
          )}
        </FormControl>

        {/* Show layer info */}
        {plotsLayer.id && (
          <Alert severity="info" sx={{ mb: 0 }}>
            <Typography variant="caption">
              Wybrana warstwa: <strong>{plotsLayer.name}</strong>
              {attributes.length > 0 && (
                <>
                  <br />
                  Znaleziono <strong>{attributes.length}</strong> kolumn
                </>
              )}
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Column Selection (only visible when layer selected) */}
      {plotsLayer.id && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AbcIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Kolumny warstwy działek
            </Typography>
            <Tooltip title="Wybierz kolumny zawierające obręb i numer działki">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Loading state */}
          {isLoadingAttributes && (
            <Alert severity="info">Wczytuję kolumny warstwy...</Alert>
          )}

          {/* Error state */}
          {attributesError && (
            <Alert severity="error">
              Błąd podczas wczytywania kolumn warstwy. Spróbuj ponownie.
            </Alert>
          )}

          {/* Attributes loaded */}
          {!isLoadingAttributes && !attributesError && attributes.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Precinct Column */}
              <FormControl
                fullWidth
                error={errors.some(e => e.includes('kolumnę z obrębami'))}
              >
                <InputLabel>Kolumna z obrębami</InputLabel>
                <Select
                  value={plotsLayer.precinctColumn}
                  onChange={(e) => handlePrecinctColumnChange(e.target.value)}
                  label="Kolumna z obrębami"
                >
                  <MenuItem value="">
                    <em>-- Wybierz kolumnę --</em>
                  </MenuItem>
                  {attributes.map(attr => (
                    <MenuItem key={attr} value={attr}>
                      {attr}
                    </MenuItem>
                  ))}
                </Select>
                {errors.find(e => e.includes('kolumnę z obrębami')) && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.find(e => e.includes('kolumnę z obrębami'))}
                  </Typography>
                )}
              </FormControl>

              {/* Plot Number Column */}
              <FormControl
                fullWidth
                error={errors.some(e => e.includes('kolumnę z numerami działek'))}
              >
                <InputLabel>Kolumna z numerami działek</InputLabel>
                <Select
                  value={plotsLayer.plotNumberColumn}
                  onChange={(e) => handlePlotNumberColumnChange(e.target.value)}
                  label="Kolumna z numerami działek"
                >
                  <MenuItem value="">
                    <em>-- Wybierz kolumnę --</em>
                  </MenuItem>
                  {attributes.map(attr => (
                    <MenuItem key={attr} value={attr}>
                      {attr}
                    </MenuItem>
                  ))}
                </Select>
                {errors.find(e => e.includes('kolumnę z numerami działek')) && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.find(e => e.includes('kolumnę z numerami działek'))}
                  </Typography>
                )}
              </FormControl>

              {/* Preview */}
              {plotsLayer.precinctColumn && plotsLayer.plotNumberColumn && (
                <Alert severity="success">
                  <Typography variant="caption">
                    ✓ Konfiguracja działek gotowa:
                    <br />
                    <strong>{plotsLayer.precinctColumn}</strong> (obręb) +{' '}
                    <strong>{plotsLayer.plotNumberColumn}</strong> (numer)
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* No attributes */}
          {!isLoadingAttributes && !attributesError && attributes.length === 0 && (
            <Alert severity="warning">
              Warstwa nie zawiera żadnych kolumn. Upewnij się, że warstwa jest poprawnie załadowana
              w projekcie QGIS.
            </Alert>
          )}
        </Paper>
      )}

      {/* Validation Errors Summary */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Wypełnij wszystkie wymagane pola:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {errors.map((error, idx) => (
              <li key={idx}>
                <Typography variant="caption">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Help text */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="caption">
          <strong>Wskazówka:</strong> Po wypełnieniu wszystkich pól kliknij "Dalej", aby przejść do
          wyboru warstw planistycznych.
        </Typography>
      </Alert>
    </Box>
  )
}

export default Step1BasicSettings
