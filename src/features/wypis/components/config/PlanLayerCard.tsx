/**
 * PlanLayerCard - Pojedyncza karta warstwy planistycznej
 *
 * Features:
 * - Checkbox do włączenia/wyłączenia warstwy
 * - Select kolumny z symbolami przeznaczenia
 * - Pole pozycji (sortowanie)
 * - Auto-fetch unique values from column
 *
 * Reusable component for Step2PlanLayers
 */

import React, { useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LayersIcon from '@mui/icons-material/Layers'
import AbcIcon from '@mui/icons-material/Abc'
import NumbersIcon from '@mui/icons-material/Numbers'

import { useLazyGetColumnValuesQuery } from '@/backend/layers'
import type { PlanLayerConfig, PurposeConfig } from '../../types'

interface PlanLayerCardProps {
  /** Project name */
  projectName: string
  /** Plan layer configuration */
  layer: PlanLayerConfig
  /** Available attributes for this layer */
  attributes: string[]
  /** Whether attributes are still loading */
  isLoadingAttributes: boolean
  /** Callback when layer configuration changes */
  onChange: (updates: Partial<PlanLayerConfig>) => void
}

/**
 * PlanLayerCard - Single plan layer configuration card
 *
 * Shows:
 * - Layer name + checkbox (enable/disable)
 * - Purpose column selector
 * - Position number (for ordering)
 * - Preview of loaded purposes
 */
const PlanLayerCard: React.FC<PlanLayerCardProps> = ({
  projectName,
  layer,
  attributes,
  isLoadingAttributes,
  onChange,
}) => {
  // Lazy query for fetching unique column values
  const [fetchColumnValues, { data: columnValuesData, isLoading: isLoadingColumnValues }] =
    useLazyGetColumnValuesQuery()

  // Auto-fetch purposes when purpose column is selected
  useEffect(() => {
    if (layer.enabled && layer.purposeColumn && layer.purposes.length === 0) {
      console.log(`🔍 Fetching unique values for column: ${layer.purposeColumn}`)

      fetchColumnValues({
        project: projectName,
        layer_id: layer.id,
        column_name: layer.purposeColumn,
      })
    }
  }, [layer.enabled, layer.purposeColumn, layer.id, layer.purposes.length, projectName, fetchColumnValues])

  // Update purposes when column values are loaded
  useEffect(() => {
    if (columnValuesData?.data?.unique_values && layer.purposes.length === 0) {
      const uniqueValues = columnValuesData.data.unique_values
      console.log(`✅ Loaded ${uniqueValues.length} unique purposes for layer ${layer.name}`)

      const purposes: PurposeConfig[] = uniqueValues.map(value => ({
        name: String(value).trim(),
        file: null,
        fileName: undefined,
      }))

      onChange({ purposes })
    }
  }, [columnValuesData, layer.purposes.length, layer.name, onChange])

  // Handle enable/disable checkbox
  const handleToggleEnabled = () => {
    onChange({ enabled: !layer.enabled })
  }

  // Handle purpose column selection
  const handlePurposeColumnChange = (column: string) => {
    onChange({
      purposeColumn: column,
      purposes: [], // Reset purposes when column changes
    })
  }

  // Handle position change
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    onChange({ position: isNaN(value) ? null : value })
  }

  return (
    <Paper
      elevation={layer.enabled ? 2 : 0}
      sx={{
        p: 2,
        mb: 2,
        border: layer.enabled ? '2px solid' : '1px solid',
        borderColor: layer.enabled ? 'primary.main' : 'grey.300',
        bgcolor: layer.enabled ? 'primary.light' : 'background.paper',
        opacity: layer.enabled ? 1 : 0.7,
        transition: 'all 0.2s',
      }}
    >
      {/* Header: Checkbox + Layer Name */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: layer.enabled ? 2 : 0 }}>
        <Checkbox checked={layer.enabled} onChange={handleToggleEnabled} />
        <LayersIcon color={layer.enabled ? 'primary' : 'disabled'} />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: layer.enabled ? 600 : 400,
            flex: 1,
            color: layer.enabled ? 'text.primary' : 'text.secondary',
          }}
        >
          {layer.name}
        </Typography>

        {/* Position badge */}
        {layer.enabled && layer.position !== null && (
          <Chip
            icon={<NumbersIcon />}
            label={`Pozycja ${layer.position}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Configuration (only visible when enabled) */}
      {layer.enabled && (
        <Box sx={{ pl: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Purpose Column Selector */}
          <FormControl fullWidth size="small">
            <InputLabel>Kolumna z symbolami przeznaczenia</InputLabel>
            <Select
              value={layer.purposeColumn}
              onChange={(e) => handlePurposeColumnChange(e.target.value)}
              label="Kolumna z symbolami przeznaczenia"
              disabled={isLoadingAttributes}
              startAdornment={<AbcIcon sx={{ mr: 1, color: 'action.disabled' }} />}
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
          </FormControl>

          {/* Position Number */}
          <TextField
            label="Pozycja w kolejności"
            type="number"
            value={layer.position || ''}
            onChange={handlePositionChange}
            size="small"
            placeholder="np. 1"
            helperText="Określa kolejność warstwy w generowanym wypisie"
            InputProps={{
              startAdornment: <NumbersIcon sx={{ mr: 1, color: 'action.disabled' }} />,
            }}
          />

          {/* Loading unique values */}
          {isLoadingColumnValues && layer.purposeColumn && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Wczytuję wartości z kolumny "{layer.purposeColumn}"...
              </Typography>
            </Box>
          )}

          {/* Preview loaded purposes */}
          {layer.purposes.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Znalezione przeznaczenia ({layer.purposes.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {layer.purposes.map((purpose, idx) => (
                  <Chip
                    key={idx}
                    label={purpose.name}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Warning if no column selected */}
          {!layer.purposeColumn && (
            <Typography variant="caption" color="warning.main">
              ⚠ Wybierz kolumnę z symbolami przeznaczenia
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  )
}

export default PlanLayerCard
