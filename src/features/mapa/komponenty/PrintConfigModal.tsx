"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoIcon from '@mui/icons-material/Info'
import DownloadIcon from '@mui/icons-material/Download'
import JSZip from 'jszip'

import { useAddWypisConfigurationMutation, useGetWypisConfigurationsQuery } from '@/backend/projects'
import { useGetWypisConfigurationQuery } from '@/backend/wypis'
import { useGetLayerAttributesQuery, useLazyGetColumnValuesQuery } from '@/backend/layers'
import type { WypisPurposeWithFile, WypisArrangementWithFile } from '@/backend/types'
import { useAppDispatch } from '@/redux/hooks'
import { showSuccess, showError } from '@/redux/slices/notificationSlice'
import FileDropZone from './FileDropZone'

interface Layer {
  id: string
  name: string
  type: 'vector' | 'raster'
  attributes?: string[]
}

interface WypisConfigModalProps {
  open: boolean
  onClose: () => void
  projectName: string
  configId?: string | null
  projectLayers: Layer[]
}

interface PlanLayerState {
  id: string
  name: string
  purposeColumn: string
  purposes: WypisPurposeWithFile[]
  arrangements: WypisArrangementWithFile[]  // Arrangements per plan (backend structure)
  enabled: boolean
  position: number | null
  expanded: boolean
}

/**
 * WypisConfigModal - Configuration modal for Wypis i Wyrys
 *
 * Features:
 * - Select plots layer and columns (obręb, numer działki)
 * - Select plan layers with ordering
 * - Drag & drop DOC/DOCX files for purposes (auto-detected from column)
 * - Add/remove arrangements with drag & drop
 * - Full validation and ZIP creation
 */
const WypisConfigModal: React.FC<WypisConfigModalProps> = ({
  open,
  onClose,
  projectName,
  configId,
  projectLayers = [],
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const dispatch = useAppDispatch()

  // Form state (must be declared before hooks that use them)
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(configId || null)
  const [configurationName, setConfigurationName] = useState('')
  const [plotsLayer, setPlotsLayer] = useState({
    layerId: '',
    layerName: '',
    precinctColumn: '',
    plotNumberColumn: '',
  })
  const [planLayers, setPlanLayers] = useState<PlanLayerState[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [layerAttributesCache, setLayerAttributesCache] = useState<Record<string, string[]>>({})

  // API hooks
  const [addWypisConfiguration, { isLoading: isSaving }] = useAddWypisConfigurationMutation()

  // Fetch list of configurations
  const { data: configurationsListResponse } = useGetWypisConfigurationsQuery(
    { project: projectName },
    { skip: !projectName || !open }
  )

  // Fetch specific configuration when selected
  const { data: existingConfig, isLoading: isLoadingConfig } = useGetWypisConfigurationsQuery(
    { project: projectName, config_id: selectedConfigId || undefined },
    { skip: !selectedConfigId || !open }
  )

  // Fetch attributes for the selected plots layer
  const { data: plotsLayerAttributes } = useGetLayerAttributesQuery(
    { project: projectName, layer_id: plotsLayer.layerId },
    { skip: !plotsLayer.layerId || !open }
  )

  // Lazy query for fetching unique column values
  const [getColumnValues] = useLazyGetColumnValuesQuery()

  // Dynamically fetch attributes for enabled plan layers
  useEffect(() => {
    if (!open) return

    const fetchLayerAttributes = async (layerId: string) => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(
          `https://api.universemapmaker.online/api/layer/attributes/names?project=${projectName}&layer_id=${layerId}`,
          {
            headers: {
              'Authorization': token ? `Token ${token}` : '',
            }
          }
        )
        const data = await response.json()
        if (data?.data?.feature_names) {
          setLayerAttributesCache(prev => ({
            ...prev,
            [layerId]: data.data.feature_names,
          }))
        }
      } catch (error) {
        console.error(`Failed to fetch attributes for ${layerId}:`, error)
      }
    }

    // Fetch for plots layer
    if (plotsLayer.layerId && plotsLayerAttributes?.data?.feature_names) {
      setLayerAttributesCache(prev => ({
        ...prev,
        [plotsLayer.layerId]: plotsLayerAttributes.data.feature_names,
      }))
    }

    // Fetch for all enabled plan layers
    for (const layer of planLayers.filter(l => l.enabled)) {
      if (!layerAttributesCache[layer.id]) {
        fetchLayerAttributes(layer.id)
      }
    }
  }, [open, plotsLayer.layerId, plotsLayerAttributes, planLayers, projectName])

  // Initialize plan layers
  useEffect(() => {
    if (projectLayers.length > 0 && planLayers.length === 0) {
      setPlanLayers(
        projectLayers
          .filter(layer => layer.type === 'vector')
          .map(layer => ({
            id: layer.id,
            name: layer.name,
            purposeColumn: '',
            purposes: [],
            arrangements: [],  // Initialize empty arrangements array
            enabled: false,
            position: null,
            expanded: false,
          }))
      )
    }
  }, [projectLayers, planLayers.length])

  // Load existing config
  useEffect(() => {
    if (existingConfig?.success && existingConfig.data) {
      const config = existingConfig.data
      console.log('🔍 Loading existing config:', config)
      setConfigurationName(config.configuration_name || '')

      // Set plots layer WITH manual attribute fetch trigger
      setPlotsLayer({
        layerId: config.plotsLayer,
        layerName: config.plotsLayerName,
        precinctColumn: config.precinctColumn,
        plotNumberColumn: config.plotNumberColumn,
      })

      // Manually trigger attribute fetch for plots layer (workaround for race condition)
      // This ensures attributes are available before rendering the dropdowns
      const fetchPlotsLayerAttributes = async () => {
        if (!config.plotsLayer || !projectName) return

        try {
          const response = await fetch(
            `https://api.universemapmaker.online/api/layer/attributes?project=${projectName}&layer_id=${config.plotsLayer}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${localStorage.getItem('authToken')}`,
              },
            }
          )
          const data = await response.json()
          if (data?.data?.Types) {
            const attributeNames = Object.keys(data.data.Types)
            setLayerAttributesCache(prev => ({
              ...prev,
              [config.plotsLayer]: attributeNames,
            }))
            console.log('✅ Loaded attributes for plots layer:', attributeNames)
          }
        } catch (error) {
          console.error('Failed to fetch plots layer attributes:', error)
        }
      }

      fetchPlotsLayerAttributes()

      // Load plan layers WITH arrangements (preserve existing file info)
      setPlanLayers(prev =>
        prev.map(layer => {
          const existingPlan = config.planLayers.find(pl => pl.id === layer.id)
          if (existingPlan) {
            // Manually fetch attributes for this plan layer (workaround for race condition)
            const fetchPlanLayerAttributes = async () => {
              if (!projectName) return

              try {
                const response = await fetch(
                  `https://api.universemapmaker.online/api/layer/attributes?project=${projectName}&layer_id=${layer.id}`,
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Token ${localStorage.getItem('authToken')}`,
                    },
                  }
                )
                const data = await response.json()
                if (data?.data?.Types) {
                  const attributeNames = Object.keys(data.data.Types)
                  setLayerAttributesCache(prev => ({
                    ...prev,
                    [layer.id]: attributeNames,
                  }))
                  console.log(`✅ Loaded attributes for plan layer ${layer.name}:`, attributeNames)
                }
              } catch (error) {
                console.error(`Failed to fetch plan layer attributes for ${layer.name}:`, error)
              }
            }

            fetchPlanLayerAttributes()

            return {
              ...layer,
              enabled: true,
              position: config.planLayers.indexOf(existingPlan) + 1,
              purposeColumn: existingPlan.purposeColumn,
              purposes: existingPlan.purposes.map(p => ({
                ...p,
                file: undefined,
                existingFileName: p.fileName  // Preserve fileName from backend
              })),
              arrangements: existingPlan.arrangements?.map(a => ({
                ...a,
                file: undefined,
                existingFileName: a.fileName  // Preserve fileName from backend
              })) || [],
            }
          }
          return layer
        })
      )
    }
  }, [existingConfig, projectName])

  const getLayerColumns = useCallback((layerId: string): string[] => {
    // Check cache first (works for all layers including plots layer)
    if (layerAttributesCache[layerId]) {
      return layerAttributesCache[layerId]
    }
    // Fallback to projectLayers attributes (usually empty)
    const layer = projectLayers.find(l => l.id === layerId)
    return layer?.attributes || []
  }, [layerAttributesCache, projectLayers])

  const togglePlanLayer = useCallback((layerId: string) => {
    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          const newEnabled = !layer.enabled
          return {
            ...layer,
            enabled: newEnabled,
            position: newEnabled ? prev.filter(l => l.enabled).length + 1 : null,
            purposeColumn: newEnabled ? layer.purposeColumn : '',
            purposes: newEnabled ? layer.purposes : [],
          }
        }
        return layer
      })
    )
  }, [])

  const setPlanLayerPosition = useCallback((layerId: string, position: number) => {
    setPlanLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, position } : layer))
    )
  }, [])

  const setPlanLayerPurposeColumn = useCallback(async (layerId: string, column: string) => {
    // First set the column (so dropdown shows selected value immediately)
    setPlanLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, purposeColumn: column, purposes: [] } : layer))
    )

    // Then fetch unique values from backend
    try {
      const result = await getColumnValues({
        project: projectName,
        layer_id: layerId,
        column_name: column,
      }).unwrap()

      if (result?.data && Array.isArray(result.data)) {
        const uniqueValues = result.data.map(v => String(v)).filter(v => v.trim() !== '')

        setPlanLayers(prev =>
          prev.map(layer => {
            if (layer.id === layerId) {
              return {
                ...layer,
                purposes: uniqueValues.map(value => ({
                  name: value,
                  fileName: `${value}.docx`,
                  file: undefined,
                })),
              }
            }
            return layer
          })
        )
      }
    } catch (error) {
      console.error(`Failed to fetch unique values for ${layerId}.${column}:`, error)
      dispatch(showError('Nie udało się pobrać wartości kolumny'))
    }
  }, [projectName, getColumnValues, dispatch])

  const togglePlanLayerExpanded = useCallback((layerId: string) => {
    setPlanLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, expanded: !layer.expanded } : layer))
    )
  }, [])

  const handlePurposeFileDrop = useCallback((layerId: string, purposeName: string, files: File[]) => {
    if (files.length === 0) return
    const file = files[0]

    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            purposes: layer.purposes.map(p =>
              p.name === purposeName ? { ...p, file, fileName: file.name } : p
            ),
          }
        }
        return layer
      })
    )

    dispatch(showSuccess(`Dodano: ${file.name}`))
  }, [dispatch])

  const removePurposeFile = useCallback((layerId: string, purposeName: string) => {
    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            purposes: layer.purposes.map(p =>
              p.name === purposeName ? { ...p, file: undefined } : p
            ),
          }
        }
        return layer
      })
    )
  }, [])

  // Arrangement management handlers (per plan)
  const handleArrangementFileDrop = useCallback((layerId: string, files: File[]) => {
    if (files.length === 0) return

    const newArrangements = files.map(file => ({
      name: file.name.replace(/\.(doc|docx)$/i, ''),
      fileName: file.name,
      file,
    }))

    setPlanLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, arrangements: [...layer.arrangements, ...newArrangements] }
          : layer
      )
    )
    dispatch(showSuccess(`Dodano ${files.length} ${files.length === 1 ? 'ustalenie' : 'ustaleń'}`))
  }, [dispatch])

  const removeArrangement = useCallback((layerId: string, fileName: string) => {
    setPlanLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, arrangements: layer.arrangements.filter(a => a.fileName !== fileName) }
          : layer
      )
    )
  }, [])

  const updateArrangementName = useCallback((layerId: string, fileName: string, newName: string) => {
    setPlanLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? {
              ...layer,
              arrangements: layer.arrangements.map(a =>
                a.fileName === fileName ? { ...a, name: newName } : a
              ),
            }
          : layer
      )
    )
  }, [])

  // Download saved file from server
  const downloadFile = useCallback(async (layerId: string, fileName: string) => {
    if (!selectedConfigId) {
      dispatch(showError('Nie wybrano konfiguracji'))
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const url = `https://api.universemapmaker.online/projects/${projectName}/wypis/${selectedConfigId}/${layerId}/${fileName}`

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
      })

      if (!response.ok) {
        throw new Error('Nie udało się pobrać pliku')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      dispatch(showSuccess(`Pobrano: ${fileName}`))
    } catch (error) {
      console.error('Download error:', error)
      dispatch(showError('Nie udało się pobrać pliku'))
    }
  }, [projectName, selectedConfigId, dispatch])

  const validateConfiguration = useCallback((): string[] => {
    const errors: string[] = []

    if (!configurationName.trim()) {
      errors.push('Nazwa konfiguracji jest wymagana')
    }
    if (!plotsLayer.layerId) {
      errors.push('Wybierz warstwę działek')
    }
    if (!plotsLayer.precinctColumn) {
      errors.push('Wybierz kolumnę obrębu')
    }
    if (!plotsLayer.plotNumberColumn) {
      errors.push('Wybierz kolumnę numeru działki')
    }

    const enabled = planLayers.filter(pl => pl.enabled)
    if (enabled.length === 0) {
      errors.push('Dodaj przynajmniej jedną warstwę planu')
    }

    for (const layer of enabled) {
      if (!layer.purposeColumn) {
        errors.push(`"${layer.name}": Wybierz kolumnę przeznaczenia`)
      }
      const missingPurposes = layer.purposes.filter(p => !p.file)
      if (missingPurposes.length > 0) {
        errors.push(`"${layer.name}": Brak plików dla przeznaczenia: ${missingPurposes.map(p => p.name).join(', ')}`)
      }
    }

    return errors
  }, [configurationName, plotsLayer, planLayers])

  const handleSave = useCallback(async () => {
    const validationErrors = validateConfiguration()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      dispatch(showError('Popraw błędy walidacji'))
      return
    }

    setErrors([])

    try {
      const zip = new JSZip()
      const enabledLayers = planLayers
        .filter(pl => pl.enabled)
        .sort((a, b) => (a.position || 0) - (b.position || 0))

      // Add arrangements and purposes for each layer
      for (const layer of enabledLayers) {
        const folderName = layer.id

        // Add arrangements to ZIP (inside layer folder)
        for (const arrangement of layer.arrangements) {
          if (arrangement.file) {
            const content = await arrangement.file.arrayBuffer()
            zip.file(`${folderName}/${arrangement.fileName}`, content)
          }
        }

        // Add purposes to ZIP
        for (const purpose of layer.purposes) {
          if (purpose.file) {
            const content = await purpose.file.arrayBuffer()
            zip.file(`${folderName}/${purpose.fileName}`, content)
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipFile = new File([zipBlob], 'wypis.zip', { type: 'application/zip' })

      // CRITICAL: Validate all required fields before sending
      if (!plotsLayer.layerId || !plotsLayer.precinctColumn || !plotsLayer.plotNumberColumn) {
        dispatch(showError('Warstwa działek: wszystkie pola są wymagane (warstwa, kolumna obręb, kolumna numer)'))
        return
      }

      if (enabledLayers.length === 0) {
        dispatch(showError('Musisz dodać przynajmniej jedną warstwę planu'))
        return
      }

      // Validate each plan layer
      for (const pl of enabledLayers) {
        if (!pl.purposeColumn) {
          dispatch(showError(`Warstwa "${pl.name}": nie wybrano kolumny z przeznaczeniem`))
          return
        }
        if (!pl.purposes || pl.purposes.length === 0) {
          dispatch(showError(`Warstwa "${pl.name}": brak przeznaczenia (pusta kolumna przeznaczenia?)`))
          return
        }
        // CRITICAL: Backend requires at least 1 arrangement per plan
        if (!pl.arrangements || pl.arrangements.length === 0) {
          dispatch(showError(`Warstwa "${pl.name}": brak ustaleń (dodaj przynajmniej jedno ustalenie)`))
          return
        }
        // CRITICAL: Validate fileName for each purpose (backend validation requirement)
        for (const purpose of pl.purposes) {
          if (!purpose.fileName || purpose.fileName.trim() === '') {
            dispatch(showError(`Warstwa "${pl.name}", przeznaczenie "${purpose.name}": brak nazwy pliku`))
            return
          }
        }
        // Validate fileName for each arrangement
        for (const arrangement of pl.arrangements) {
          if (!arrangement.fileName || arrangement.fileName.trim() === '') {
            dispatch(showError(`Warstwa "${pl.name}", ustalenie "${arrangement.name}": brak nazwy pliku`))
            return
          }
        }
      }

      const configuration = {
        configuration_name: configurationName,
        plotsLayer: plotsLayer.layerId,
        plotsLayerName: plotsLayer.layerName,
        precinctColumn: plotsLayer.precinctColumn,
        plotNumberColumn: plotsLayer.plotNumberColumn,
        planLayers: enabledLayers.map(pl => ({
          id: pl.id,
          name: pl.name,
          purposeColumn: pl.purposeColumn,
          purposes: pl.purposes.map(p => ({
            name: p.name,
            fileName: p.fileName
          })),
          arrangements: pl.arrangements.map(a => ({
            name: a.name,
            fileName: a.fileName
          })),
        })),
      }

      // DEBUG: Log configuration object BEFORE stringifying
      console.log('=== DEBUG: Configuration Object ===')
      console.log('Configuration Name:', configuration.configuration_name)
      console.log('Plots Layer ID:', configuration.plotsLayer)
      console.log('Precinct Column:', configuration.precinctColumn)
      console.log('Plot Number Column:', configuration.plotNumberColumn)
      console.log('Plan Layers Count:', configuration.planLayers.length)
      configuration.planLayers.forEach((pl, idx) => {
        console.log(`\nPlan Layer ${idx + 1}:`, {
          id: pl.id,
          name: pl.name,
          purposeColumn: pl.purposeColumn,
          purposesCount: pl.purposes.length,
          arrangementsCount: pl.arrangements.length,
        })
        pl.purposes.forEach((p, pIdx) => {
          console.log(`  Purpose ${pIdx + 1}:`, { name: p.name, fileName: p.fileName })
        })
      })

      const configurationJson = JSON.stringify(configuration)
      console.log('\n=== DEBUG: Configuration JSON (length: ' + configurationJson.length + ' chars) ===')
      console.log(configurationJson)

      const formData = new FormData()
      formData.append('project', projectName)
      formData.append('configuration', configurationJson) // Single stringify only!
      formData.append('extractFiles', zipFile) // Backend requires 'extractFiles' parameter
      if (configId) {
        formData.append('config_id', configId)
      }

      // DEBUG: Log FormData contents
      console.log('\n=== DEBUG: FormData Contents ===')
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, `[File: ${value.name}, ${value.size} bytes]`)
        } else {
          console.log(`${key}:`, value)
        }
      }

      console.log('\n=== DEBUG: Sending request to backend ===')
      const result = await addWypisConfiguration(formData).unwrap()
      console.log('=== DEBUG: Backend response ===', result)

      dispatch(showSuccess(configId ? 'Zaktualizowano konfigurację' : 'Zapisano konfigurację'))

      onClose()
    } catch (error: any) {
      console.error('=== ERROR: Save failed ===', error)
      console.error('Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.data?.message || error?.message,
      })
      console.error('=== FULL BACKEND RESPONSE ===', JSON.stringify(error?.data, null, 2))
      dispatch(showError(error?.data?.message || 'Błąd zapisu'))
    }
  }, [validateConfiguration, planLayers, configurationName, plotsLayer, projectName, configId, addWypisConfiguration, dispatch, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px', maxHeight: '90vh' } }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#34495e',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontWeight: 600,
        }}
      >
        {configId ? 'Edytuj konfigurację' : 'Nowa konfiguracja wypisu'}
        <IconButton onClick={onClose} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {isLoadingConfig ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Popraw błędy:</Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </Alert>
            )}

            {/* Configuration Selector - Show saved configurations */}
            {configurationsListResponse?.success && configurationsListResponse.data?.config_structure && configurationsListResponse.data.config_structure.length > 0 && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Wybierz istniejącą konfigurację (opcjonalnie)</InputLabel>
                <Select
                  value={selectedConfigId || ''}
                  onChange={(e) => {
                    const configId = e.target.value || null
                    setSelectedConfigId(configId)
                  }}
                  label="Wybierz istniejącą konfigurację (opcjonalnie)"
                >
                  <MenuItem value="">
                    <em>Nowa konfiguracja</em>
                  </MenuItem>
                  {configurationsListResponse.data.config_structure.map((config: any) => (
                    <MenuItem key={config.id} value={config.id}>
                      {config.name || config.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Nazwa konfiguracji"
              value={configurationName}
              onChange={(e) => setConfigurationName(e.target.value)}
              required
              fullWidth
              sx={{ mb: 3 }}
              placeholder="np. MPZP Warszawa Śródmieście"
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Warstwa działek</Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Warstwa działek</InputLabel>
              <Select
                value={plotsLayer.layerId}
                onChange={(e) => {
                  const layer = projectLayers.find(l => l.id === e.target.value)
                  setPlotsLayer({
                    layerId: e.target.value,
                    layerName: layer?.name || '',
                    precinctColumn: '',
                    plotNumberColumn: '',
                  })
                }}
                label="Warstwa działek"
              >
                {projectLayers.filter(l => l.type === 'vector').map(l => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {plotsLayer.layerId && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Kolumna - Obręb</InputLabel>
                  <Select
                    value={getLayerColumns(plotsLayer.layerId).includes(plotsLayer.precinctColumn) ? plotsLayer.precinctColumn : ''}
                    onChange={(e) => setPlotsLayer({ ...plotsLayer, precinctColumn: e.target.value })}
                    label="Kolumna - Obręb"
                  >
                    {getLayerColumns(plotsLayer.layerId).map(col => (
                      <MenuItem key={col} value={col}>{col}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Kolumna - Numer działki</InputLabel>
                  <Select
                    value={getLayerColumns(plotsLayer.layerId).includes(plotsLayer.plotNumberColumn) ? plotsLayer.plotNumberColumn : ''}
                    onChange={(e) => setPlotsLayer({ ...plotsLayer, plotNumberColumn: e.target.value })}
                    label="Kolumna - Numer działki"
                  >
                    {getLayerColumns(plotsLayer.layerId).map(col => (
                      <MenuItem key={col} value={col}>{col}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Warstwy planów z przeznaczeniami i ustaleniami (per-layer) */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Warstwy planów i przeznaczenia</Typography>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              Wybierz warstwy planu i dodaj pliki DOC/DOCX dla każdego przeznaczenia terenu
            </Alert>

            {planLayers.map(layer => (
              <Box key={layer.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: layer.enabled ? 2 : 0 }}>
                  <Checkbox checked={layer.enabled} onChange={() => togglePlanLayer(layer.id)} />
                  <Typography sx={{ flex: 1 }}>{layer.name}</Typography>

                  {layer.enabled && (
                    <>
                      <TextField
                        type="number"
                        label="Pozycja"
                        value={layer.position || ''}
                        onChange={(e) => setPlanLayerPosition(layer.id, parseInt(e.target.value) || 0)}
                        sx={{ width: 100, mr: 2 }}
                        size="small"
                      />
                      <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Kolumna przeznaczenia</InputLabel>
                        <Select
                          value={getLayerColumns(layer.id).includes(layer.purposeColumn) ? layer.purposeColumn : ''}
                          onChange={(e) => setPlanLayerPurposeColumn(layer.id, e.target.value)}
                          label="Kolumna przeznaczenia"
                        >
                          {getLayerColumns(layer.id).map(col => (
                            <MenuItem key={col} value={col}>{col}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Box>

                {layer.enabled && layer.purposeColumn && (
                  <Accordion expanded={layer.expanded} onChange={() => togglePlanLayerExpanded(layer.id)} sx={{ bgcolor: '#f5f5f5' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {layer.name} - {layer.purposes.filter(p => p.file).length}/{layer.purposes.length} przeznaczenia
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="h6" sx={{ mb: 2 }}>Przeznaczenia terenu</Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Przeciągnij pliki DOC/DOCX dla każdego przeznaczenia (wykryte z kolumny: {layer.purposeColumn})
                      </Alert>

                      <List sx={{ display: 'grid', gap: 2 }}>
                        {layer.purposes.map(purpose => (
                          <ListItem
                            key={purpose.name}
                            sx={{
                              flexDirection: 'column',
                              alignItems: 'stretch',
                              p: 2,
                              border: '1px solid',
                              borderColor: (purpose.file || purpose.existingFileName) ? 'success.main' : 'divider',
                              borderRadius: 1,
                              bgcolor: (purpose.file || purpose.existingFileName) ? 'success.50' : 'background.paper',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {purpose.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {purpose.existingFileName && !purpose.file && (
                                  <>
                                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      ✓ Zapisany: {purpose.existingFileName}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => downloadFile(layer.id, purpose.existingFileName!)}
                                      sx={{ color: 'primary.main' }}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                                {purpose.file && (
                                  <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    ⟳ Nowy plik
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <FileDropZone
                              file={purpose.file}
                              onDrop={(files) => handlePurposeFileDrop(layer.id, purpose.name, files)}
                              onRemove={() => removePurposeFile(layer.id, purpose.name)}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Divider sx={{ my: 3 }} />

                      {/* Arrangements section for this layer */}
                      <Typography variant="h6" sx={{ mb: 2 }}>Ustalenia dla tej warstwy</Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Dodaj pliki DOC/DOCX dla ustaleń tej warstwy (np. "Ustalenia ogólne", "Ustalenia końcowe").
                        Backend wymaga co najmniej jednego ustalenia!
                      </Alert>

                      <FileDropZone
                        file={undefined}
                        onDrop={(files) => handleArrangementFileDrop(layer.id, files)}
                        onRemove={() => {}}
                        multiple
                      />

                      {layer.arrangements.length > 0 && (
                        <List sx={{ mt: 2 }}>
                          {layer.arrangements.map(arrangement => (
                            <ListItem
                              key={arrangement.fileName}
                              sx={{
                                mb: 1,
                                p: 2,
                                border: '1px solid',
                                borderColor: arrangement.existingFileName ? 'success.main' : 'divider',
                                borderRadius: 1,
                                bgcolor: arrangement.existingFileName ? 'success.50' : 'grey.50',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <TextField
                                  value={arrangement.name}
                                  onChange={(e) => updateArrangementName(layer.id, arrangement.fileName, e.target.value)}
                                  placeholder="Nazwa ustalenia"
                                  size="small"
                                  fullWidth
                                  sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Plik: {arrangement.fileName}
                                </Typography>
                                {arrangement.existingFileName && !arrangement.file && (
                                  <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                    ✓ Zapisany plik
                                  </Typography>
                                )}
                                {arrangement.file && (
                                  <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                    ⟳ Nowy plik do uploadowania
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                {arrangement.existingFileName && !arrangement.file && (
                                  <IconButton
                                    size="small"
                                    onClick={() => downloadFile(layer.id, arrangement.existingFileName!)}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() => removeArrangement(layer.id, arrangement.fileName)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            ))}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined">Anuluj</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || isLoadingConfig}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? 'Zapisywanie...' : configId ? 'Zaktualizuj' : 'Zapisz'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WypisConfigModal
