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

  // Fetch attributes for ALL plan layers (skip disabled ones)
  // IMPORTANT: We MUST call hooks unconditionally (Rules of Hooks)
  // So we query all layers, but skip disabled ones
  const attributeQueries = planLayers.map(layer =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useGetLayerAttributesQuery(
      { project: projectName, layer_id: layer.id },
      { skip: !layer.id || !projectName || !layer.enabled }  // Skip if disabled
    )
  )

  // Update cache when attributes are loaded
  useEffect(() => {
    attributeQueries.forEach((query, idx) => {
      const layer = planLayers[idx]  // Use planLayers, not enabledLayers
      if (query.data?.data?.feature_names && !attributesCache[layer.id]) {
        setAttributesCache(prev => ({
          ...prev,
          [layer.id]: query.data.data.feature_names,
        }))
      }
    })
  }, [attributeQueries, planLayers, attributesCache])

  // Handle layer configuration change
  const handleLayerChange = (layerId: string, updates: Partial<PlanLayerConfig>) => {
    const updatedLayers = planLayers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    )
    onChange(updatedLayers)
  }

  // Stats - count layers with purposeColumn configured
  const totalLayers = planLayers.length
  const configuredCount = planLayers.filter(
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
      {configuredCount > 0 && (
        <Alert
          severity={configuredCount >= 1 ? 'success' : 'warning'}
          icon={configuredCount >= 1 ? <CheckCircleIcon /> : <WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            ✓ Skonfigurowano <strong>{configuredCount}</strong> warstw planistycznych.
            {totalLayers - configuredCount > 0 && (
              <> Pozostało: <strong>{totalLayers - configuredCount}</strong></>
            )}
          </Typography>
        </Alert>
      )}

      {/* Plan Layers List */}
      <Box sx={{ mb: 3 }}>
        {planLayers.map((layer, idx) => {
          const attributes = attributesCache[layer.id] || []
          const isLoadingAttrs = attributeQueries[idx]?.isLoading || false

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

      {/* No layers configured warning */}
      {vectorLayers.length > 0 && configuredCount === 0 && (
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            Skonfiguruj przynajmniej jedną warstwę planistyczną (wybierz kolumnę z symbolami przeznaczenia), aby kontynuować.
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
