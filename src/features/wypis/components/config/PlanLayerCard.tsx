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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LayersIcon from '@mui/icons-material/Layers'
import AbcIcon from '@mui/icons-material/Abc'

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
    if (layer.purposeColumn && layer.purposes.length === 0) {
      console.log(`🔍 Fetching unique values for column: ${layer.purposeColumn}`)

      fetchColumnValues({
        project: projectName,
        layer_id: layer.id,
        column_name: layer.purposeColumn,
      })
    }
  }, [layer.purposeColumn, layer.id, layer.purposes.length, projectName, fetchColumnValues])

  // Update purposes when column values are loaded
  useEffect(() => {
    if (columnValuesData?.data && layer.purposes.length === 0) {
      const uniqueValues = columnValuesData.data  // Backend returns { data: [...] }
      console.log(`✅ Loaded ${uniqueValues.length} unique purposes for layer ${layer.name}`, uniqueValues)

      const purposes: PurposeConfig[] = uniqueValues.map(value => ({
        name: String(value).trim(),
        file: null,
        fileName: undefined,
      }))

      onChange({ purposes })
    }
  }, [columnValuesData, layer.purposes.length, layer.name, onChange])

  // Handle purpose column selection
  const handlePurposeColumnChange = (column: string) => {
    onChange({
      purposeColumn: column,
      purposes: [], // Reset purposes when column changes
    })
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        border: '2px solid',
        borderColor: layer.purposeColumn ? 'success.main' : 'grey.300',
        bgcolor: 'background.paper',
        transition: 'all 0.2s',
      }}
    >
      {/* Header: Layer Name */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LayersIcon color="primary" />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            flex: 1,
            color: 'text.primary',
          }}
        >
          {layer.name}
        </Typography>

        {/* Configured badge */}
        {layer.purposeColumn && layer.purposes.length > 0 && (
          <Chip
            label={`✓ Skonfigurowano (${layer.purposes.length} przeznaczeo)`}
            size="small"
            color="success"
          />
        )}
      </Box>

      {/* Configuration - always visible */}
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
    </Paper>
  )
}

export default PlanLayerCard
