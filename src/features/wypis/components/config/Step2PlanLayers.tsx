/**
 * Step2PlanLayers - Krok 2 wizard'a konfiguracji wypisu
 *
 * Features:
 * - Lista warstw wektorowych z checkboxami
 * - Dla zaznaczonych: wybór kolumny z symbolami przeznaczenia
 * - Automatyczne wczytywanie unique values z kolumny
 * - Pole pozycji (sortowanie kolejności warstw)
 * - Preview załadowanych przeznaczeo
 *
 * Required: min. 1 warstwa z purpose column
 */

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import InfoIcon from '@mui/icons-material/Info'
import LayersIcon from '@mui/icons-material/Layers'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'

import { useGetLayerAttributesQuery } from '@/backend/layers'
import type { PlanLayerConfig } from '../../types'
import PlanLayerCard from './PlanLayerCard'

interface Layer {
  id: string
  name: string
  type: 'vector' | 'raster'
}

interface Step2PlanLayersProps {
  /** Project name */
  projectName: string
  /** Available layers from QGIS project */
  projectLayers: Layer[]
  /** Current plan layers configuration */
  planLayers: PlanLayerConfig[]
  /** Callback when plan layers change */
  onChange: (planLayers: PlanLayerConfig[]) => void
  /** Validation errors from parent */
  errors?: string[]
}

/**
 * Step 2: Plan Layers - Wybór warstw planistycznych
 *
 * User flow:
 * 1. Enable/disable plan layers (checkbox on each card)
 * 2. For enabled layers: select purpose column
 * 3. System auto-loads unique values from column (purposes)
 * 4. Set position number for ordering (optional)
 * 5. Click "Dalej" when at least 1 layer configured
 */
const Step2PlanLayers: React.FC<Step2PlanLayersProps> = ({
  projectName,
  projectLayers,
  planLayers,
  onChange,
  errors = [],
}) => {
  // Filter only vector layers
  const vectorLayers = projectLayers.filter(layer => layer.type === 'vector')

  // Cache for layer attributes (to avoid multiple RTK Query calls)
  const [attributesCache, setAttributesCache] = useState<Record<string, string[]>>({})

  // Fetch attributes for ALL enabled plan layers
  const enabledLayers = planLayers.filter(l => l.enabled)

  // Use RTK Query hooks for each enabled layer (conditional rendering)
  const attributeQueries = enabledLayers.map(layer =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useGetLayerAttributesQuery(
      { project: projectName, layer_id: layer.id },
      { skip: !layer.id || !projectName }
    )
  )

  // Update cache when attributes are loaded
  useEffect(() => {
    attributeQueries.forEach((query, idx) => {
      const layer = enabledLayers[idx]
      if (query.data?.data?.feature_names && !attributesCache[layer.id]) {
        setAttributesCache(prev => ({
          ...prev,
          [layer.id]: query.data.data.feature_names,
        }))
      }
    })
  }, [attributeQueries, enabledLayers, attributesCache])

  // Handle layer configuration change
  const handleLayerChange = (layerId: string, updates: Partial<PlanLayerConfig>) => {
    const updatedLayers = planLayers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    )
    onChange(updatedLayers)
  }

  // Auto-assign positions when layer is enabled
  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    const updatedLayers = planLayers.map(layer => {
      if (layer.id === layerId) {
        // If enabling and no position set, assign next available position
        if (enabled && layer.position === null) {
          const maxPosition = Math.max(
            0,
            ...planLayers.filter(l => l.enabled && l.position !== null).map(l => l.position!)
          )
          return { ...layer, enabled, position: maxPosition + 1 }
        }
        return { ...layer, enabled }
      }
      return layer
    })
    onChange(updatedLayers)
  }

  // Sort layers: enabled first (by position), then disabled (alphabetically)
  const sortedLayers = [...planLayers].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1
    if (!a.enabled && b.enabled) return 1
    if (a.enabled && b.enabled) {
      return (a.position || 999) - (b.position || 999)
    }
    return a.name.localeCompare(b.name)
  })

  // Stats
  const enabledCount = enabledLayers.length
  const configuredCount = enabledLayers.filter(
    l => l.purposeColumn && l.purposes.length > 0
  ).length

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Krok 2: Warstwy planistyczne
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Wybierz warstwy zawierające strefy planistyczne i określ kolumny z symbolami przeznaczenia.
        </Typography>
      </Box>

      {/* Summary Stats */}
      {enabledCount > 0 && (
        <Alert
          severity={configuredCount === enabledCount ? 'success' : 'warning'}
          icon={configuredCount === enabledCount ? <CheckCircleIcon /> : <WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            {configuredCount === enabledCount ? (
              <>
                ✓ Skonfigurowano <strong>{configuredCount}</strong> z <strong>{enabledCount}</strong>{' '}
                włączonych warstw
              </>
            ) : (
              <>
                Skonfigurowano <strong>{configuredCount}</strong> z <strong>{enabledCount}</strong>{' '}
                włączonych warstw. Dokończ konfigurację pozostałych.
              </>
            )}
          </Typography>
        </Alert>
      )}

      {/* Plan Layers List */}
      <Box sx={{ mb: 3 }}>
        {sortedLayers.map(layer => {
          const attributes = attributesCache[layer.id] || []
          const isLoadingAttrs = enabledLayers.some(
            l => l.id === layer.id && attributeQueries.find(q => q.isLoading)
          )

          return (
            <PlanLayerCard
              key={layer.id}
              projectName={projectName}
              layer={layer}
              attributes={attributes}
              isLoadingAttributes={isLoadingAttrs}
              onChange={(updates) => {
                // Handle enabled toggle separately for auto-position
                if ('enabled' in updates) {
                  handleLayerToggle(layer.id, updates.enabled!)
                } else {
                  handleLayerChange(layer.id, updates)
                }
              }}
            />
          )
        })}
      </Box>

      {/* No vector layers warning */}
      {vectorLayers.length === 0 && (
        <Alert severity="warning" icon={<LayersIcon />}>
          <Typography variant="body2">
            Projekt nie zawiera warstw wektorowych. Upewnij się, że projekt QGIS ma załadowane warstwy
            z planami miejscowymi.
          </Typography>
        </Alert>
      )}

      {/* No layers enabled warning */}
      {vectorLayers.length > 0 && enabledCount === 0 && (
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            Zaznacz przynajmniej jedną warstwę planistyczną, aby kontynuować.
          </Typography>
        </Alert>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Błędy walidacji:
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
          <strong>Wskazówka:</strong> Warstwy pojawią się w wypisie w kolejności według pola "Pozycja".
          Możesz zmienić kolejność ręcznie lub użyć automatycznego numerowania.
        </Typography>
      </Alert>
    </Box>
  )
}

export default Step2PlanLayers
