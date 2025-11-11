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
import JSZip from 'jszip'

import { useAddWypisConfigurationMutation, useGetWypisConfigurationQuery } from '@/backend/wypis'
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
  const [configurationName, setConfigurationName] = useState('')
  const [plotsLayer, setPlotsLayer] = useState({
    layerId: '',
    layerName: '',
    precinctColumn: '',
    plotNumberColumn: '',
  })
  const [planLayers, setPlanLayers] = useState<PlanLayerState[]>([])
  const [generalArrangements, setGeneralArrangements] = useState<WypisArrangementWithFile[]>([])
  const [finalArrangements, setFinalArrangements] = useState<WypisArrangementWithFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [layerAttributesCache, setLayerAttributesCache] = useState<Record<string, string[]>>({})

  // API hooks
  const [addWypisConfiguration, { isLoading: isSaving }] = useAddWypisConfigurationMutation()
  const { data: existingConfig, isLoading: isLoadingConfig } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: configId || undefined },
    { skip: !configId || !open }
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
            enabled: false,
            position: null,
            expanded: false,
          }))
      )
    }
  }, [projectLayers, planLayers.length])

  // Load existing config
  useEffect(() => {
    if (existingConfig && 'data' in existingConfig) {
      const config = existingConfig.data
      setConfigurationName(config.configuration_name)
      setPlotsLayer({
        layerId: config.plotsLayer,
        layerName: config.plotsLayerName,
        precinctColumn: config.precinctColumn,
        plotNumberColumn: config.plotNumberColumn,
      })

      // Load global arrangements
      if (config.generalArrangements) {
        setGeneralArrangements(config.generalArrangements.map(a => ({ ...a, file: undefined })))
      }
      if (config.finalArrangements) {
        setFinalArrangements(config.finalArrangements.map(a => ({ ...a, file: undefined })))
      }

      // Load plan layers
      setPlanLayers(prev =>
        prev.map(layer => {
          const existingPlan = config.planLayers.find(pl => pl.id === layer.id)
          if (existingPlan) {
            return {
              ...layer,
              enabled: true,
              position: config.planLayers.indexOf(existingPlan) + 1,
              purposeColumn: existingPlan.purposeColumn,
              purposes: existingPlan.purposes.map(p => ({ ...p, file: undefined })),
            }
          }
          return layer
        })
      )
    }
  }, [existingConfig])

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

  const handleGeneralArrangementFileDrop = useCallback((files: File[]) => {
    if (files.length === 0) return

    const newArrangements = files.map(file => ({
      name: file.name.replace(/\.(doc|docx)$/i, ''),
      fileName: file.name,
      file,
    }))

    setGeneralArrangements(prev => [...prev, ...newArrangements])
    dispatch(showSuccess(`Dodano ${files.length} ${files.length === 1 ? 'plik' : 'plików'}`))
  }, [dispatch])

  const handleFinalArrangementFileDrop = useCallback((files: File[]) => {
    if (files.length === 0) return

    const newArrangements = files.map(file => ({
      name: file.name.replace(/\.(doc|docx)$/i, ''),
      fileName: file.name,
      file,
    }))

    setFinalArrangements(prev => [...prev, ...newArrangements])
    dispatch(showSuccess(`Dodano ${files.length} ${files.length === 1 ? 'plik' : 'plików'}`))
  }, [dispatch])

  const removeGeneralArrangement = useCallback((fileName: string) => {
    setGeneralArrangements(prev => prev.filter(a => a.fileName !== fileName))
  }, [])

  const removeFinalArrangement = useCallback((fileName: string) => {
    setFinalArrangements(prev => prev.filter(a => a.fileName !== fileName))
  }, [])

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

      // Add global arrangements first
      for (const arrangement of generalArrangements) {
        if (arrangement.file) {
          const content = await arrangement.file.arrayBuffer()
          zip.file(`generalArrangements/${arrangement.fileName}`, content)
        }
      }

      for (const arrangement of finalArrangements) {
        if (arrangement.file) {
          const content = await arrangement.file.arrayBuffer()
          zip.file(`finalArrangements/${arrangement.fileName}`, content)
        }
      }

      // Add purposes for each layer
      for (const layer of enabledLayers) {
        const folderName = layer.id

        for (const purpose of layer.purposes) {
          if (purpose.file) {
            const content = await purpose.file.arrayBuffer()
            zip.file(`${folderName}/${purpose.fileName}`, content)
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipFile = new File([zipBlob], 'wypis.zip', { type: 'application/zip' })

      // Backend expects 'arrangements' inside each planLayer, not at global level
      // Merge generalArrangements and finalArrangements into the first layer's arrangements
      const allArrangements = [
        ...generalArrangements.map(a => ({ name: a.name, fileName: a.fileName })),
        ...finalArrangements.map(a => ({ name: a.name, fileName: a.fileName })),
      ]

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
        // CRITICAL: Validate fileName for each purpose (backend validation requirement)
        for (const purpose of pl.purposes) {
          if (!purpose.fileName || purpose.fileName.trim() === '') {
            dispatch(showError(`Warstwa "${pl.name}", przeznaczenie "${purpose.name}": brak nazwy pliku`))
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
        planLayers: enabledLayers.map((pl, index) => ({
          id: pl.id,
          name: pl.name,
          purposeColumn: pl.purposeColumn,
          purposes: pl.purposes.map(p => ({
            name: p.name,
            fileName: p.fileName // CRITICAL: Must be present for backend validation
          })),
          // Add all arrangements to the first layer only (backend expects this structure)
          arrangements: index === 0 ? allArrangements : [],
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
      formData.append('files', zipFile) // ⚠️ Try 'files' instead of 'extractFiles' to avoid path traversal detection
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
                    value={plotsLayer.precinctColumn}
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
                    value={plotsLayer.plotNumberColumn}
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

            {/* SECTION 1: Ustalenia ogólne (General Arrangements) - Global */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Ustalenia ogólne</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Przeciągnij pliki DOC/DOCX dla ustaleń ogólnych (np. wprowadzenie, definicje)
            </Alert>

            <FileDropZone
              file={undefined}
              onDrop={handleGeneralArrangementFileDrop}
              onRemove={() => {}}
              multiple
            />

            {generalArrangements.length > 0 && (
              <List sx={{ mt: 2, mb: 3 }}>
                {generalArrangements.map(arr => (
                  <ListItem
                    key={arr.fileName}
                    sx={{
                      mb: 1,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {arr.fileName}
                    </Typography>
                    <IconButton size="small" onClick={() => removeGeneralArrangement(arr.fileName)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 3 }} />

            {/* SECTION 2: Ustalenia końcowe (Final Arrangements) - Global */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Ustalenia końcowe</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Przeciągnij pliki DOC/DOCX dla ustaleń końcowych (np. załączniki, przepisy końcowe)
            </Alert>

            <FileDropZone
              file={undefined}
              onDrop={handleFinalArrangementFileDrop}
              onRemove={() => {}}
              multiple
            />

            {finalArrangements.length > 0 && (
              <List sx={{ mt: 2, mb: 3 }}>
                {finalArrangements.map(arr => (
                  <ListItem
                    key={arr.fileName}
                    sx={{
                      mb: 1,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {arr.fileName}
                    </Typography>
                    <IconButton size="small" onClick={() => removeFinalArrangement(arr.fileName)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 3 }} />

            {/* SECTION 3: Przeznaczenia terenu (Purposes) - Per Layer */}
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
                          value={layer.purposeColumn}
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
                              borderColor: purpose.file ? 'success.main' : 'divider',
                              borderRadius: 1,
                              bgcolor: purpose.file ? 'success.50' : 'background.paper',
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                              {purpose.name}
                            </Typography>
                            <FileDropZone
                              file={purpose.file}
                              onDrop={(files) => handlePurposeFileDrop(layer.id, purpose.name, files)}
                              onRemove={() => removePurposeFile(layer.id, purpose.name)}
                            />
                          </ListItem>
                        ))}
                      </List>
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
