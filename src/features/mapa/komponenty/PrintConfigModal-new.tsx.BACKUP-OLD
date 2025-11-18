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
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Grid from '@mui/material/Grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'
import DownloadIcon from '@mui/icons-material/Download'
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
  arrangements: WypisArrangementWithFile[]
  enabled: boolean
  position: number | null
}

const steps = [
  'Nazwa i konfiguracja',
  'Warstwa działek',
  'Warstwy planów',
  'Pliki i ustalenia',
]

/**
 * WypisConfigModal - Improved UX/UI for Wypis configuration
 *
 * NEW FEATURES:
 * - Stepper UI (4 steps) - clear progress visualization
 * - Compact layout - less scrolling, better density
 * - Visual validation - green checks / red X indicators
 * - Summary card - preview before saving
 * - Better color coding - clear status distinction
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

  // Stepper state
  const [activeStep, setActiveStep] = useState(0)

  // Form state
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(configId || null)
  const [configurationName, setConfigurationName] = useState('')
  const [plotsLayer, setPlotsLayer] = useState({
    layerId: '',
    layerName: '',
    precinctColumn: '',
    plotNumberColumn: '',
  })
  const [planLayers, setPlanLayers] = useState<PlanLayerState[]>([])
  const [layerAttributesCache, setLayerAttributesCache] = useState<Record<string, string[]>>({})

  // API hooks
  const [addWypisConfiguration, { isLoading: isSaving }] = useAddWypisConfigurationMutation()

  const { data: configurationsListResponse } = useGetWypisConfigurationQuery(
    { project: projectName },
    { skip: !projectName || !open }
  )

  const { data: existingConfig, isLoading: isLoadingConfig } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: selectedConfigId || undefined },
    { skip: !selectedConfigId || !open }
  )

  const { data: plotsLayerAttributes } = useGetLayerAttributesQuery(
    { project: projectName, layer_id: plotsLayer.layerId },
    { skip: !plotsLayer.layerId || !open }
  )

  const [getColumnValues] = useLazyGetColumnValuesQuery()

  // Dynamically fetch attributes for layers
  useEffect(() => {
    if (!open) return

    const fetchLayerAttributes = async (layerId: string) => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(
          `https://api.universemapmaker.online/api/layer/attributes/names?project=${projectName}&layer_id=${layerId}`,
          { headers: { 'Authorization': token ? `Token ${token}` : '' } }
        )
        const data = await response.json()
        if (data?.data?.feature_names) {
          setLayerAttributesCache(prev => ({ ...prev, [layerId]: data.data.feature_names }))
        }
      } catch (error) {
        console.error(`Failed to fetch attributes for ${layerId}:`, error)
      }
    }

    if (plotsLayer.layerId && plotsLayerAttributes?.data?.feature_names) {
      setLayerAttributesCache(prev => ({
        ...prev,
        [plotsLayer.layerId]: plotsLayerAttributes.data.feature_names,
      }))
    }

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
            arrangements: [],
            enabled: false,
            position: null,
          }))
      )
    }
  }, [projectLayers, planLayers.length])

  // Load existing config
  useEffect(() => {
    if (existingConfig?.success && existingConfig.data) {
      const config = existingConfig.data
      setConfigurationName(config.configuration_name || '')

      setPlotsLayer({
        layerId: config.plotsLayer,
        layerName: config.plotsLayerName,
        precinctColumn: config.precinctColumn,
        plotNumberColumn: config.plotNumberColumn,
      })

      setPlanLayers(prev =>
        prev.map(layer => {
          const existingPlan = config.planLayers.find(pl => pl.id === layer.id)
          if (existingPlan) {
            return {
              ...layer,
              enabled: true,
              position: config.planLayers.indexOf(existingPlan) + 1,
              purposeColumn: existingPlan.purposeColumn,
              purposes: existingPlan.purposes.map(p => ({
                ...p,
                file: undefined,
                existingFileName: p.fileName
              })),
              arrangements: existingPlan.arrangements?.map(a => ({
                ...a,
                file: undefined,
                existingFileName: a.fileName
              })) || [],
            }
          }
          return layer
        })
      )
    }
  }, [existingConfig, projectName])

  const getLayerColumns = useCallback((layerId: string): string[] => {
    if (layerAttributesCache[layerId]) {
      return layerAttributesCache[layerId]
    }
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
            arrangements: newEnabled ? layer.arrangements : [],
          }
        }
        return layer
      })
    )
  }, [])

  const setPlanLayerPurposeColumn = useCallback(async (layerId: string, column: string) => {
    setPlanLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, purposeColumn: column, purposes: [] } : layer))
    )

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

  const downloadFile = useCallback(async (layerId: string, fileName: string) => {
    if (!selectedConfigId) {
      dispatch(showError('Nie wybrano konfiguracji'))
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const url = `https://api.universemapmaker.online/projects/${projectName}/wypis/${selectedConfigId}/${layerId}/${fileName}`

      const response = await fetch(url, {
        headers: { 'Authorization': token ? `Token ${token}` : '' },
      })

      if (!response.ok) throw new Error('Nie udało się pobrać pliku')

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

  // Validation for each step
  const isStep1Valid = () => configurationName.trim() !== ''
  const isStep2Valid = () => plotsLayer.layerId && plotsLayer.precinctColumn && plotsLayer.plotNumberColumn
  const isStep3Valid = () => {
    const enabled = planLayers.filter(pl => pl.enabled)
    return enabled.length > 0 && enabled.every(pl => pl.purposeColumn)
  }
  const isStep4Valid = () => {
    const enabled = planLayers.filter(pl => pl.enabled)
    return enabled.every(pl =>
      // CRITICAL: Require NEW files (not existingFileName) because backend needs ZIP with all files
      pl.purposes.every(p => p.file) &&
      pl.arrangements.length > 0 &&
      pl.arrangements.every(a => a.file)
    )
  }

  const getStepValidation = (step: number) => {
    switch (step) {
      case 0: return isStep1Valid()
      case 1: return isStep2Valid()
      case 2: return isStep3Valid()
      case 3: return isStep4Valid()
      default: return false
    }
  }

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1)
    }
  }

  const handleSave = useCallback(async () => {
    try {
      // Pre-validation: Check if all files are uploaded
      const enabled = planLayers.filter(pl => pl.enabled)

      for (const layer of enabled) {
        // Check purposes
        const missingPurposes = layer.purposes.filter(p => !p.file)
        if (missingPurposes.length > 0) {
          dispatch(showError(`Warstwa "${layer.name}": Brak plików dla przeznaczenia: ${missingPurposes.map(p => p.name).join(', ')}`))
          return
        }

        // Check arrangements
        if (layer.arrangements.length === 0) {
          dispatch(showError(`Warstwa "${layer.name}": Dodaj przynajmniej jedno ustalenie (plik DOC/DOCX)`))
          return
        }

        const missingArrangements = layer.arrangements.filter(a => !a.file)
        if (missingArrangements.length > 0) {
          dispatch(showError(`Warstwa "${layer.name}": Brak plików dla ustaleń: ${missingArrangements.map(a => a.name).join(', ')}`))
          return
        }
      }

      const zip = new JSZip()
      const enabledLayers = planLayers
        .filter(pl => pl.enabled)
        .sort((a, b) => (a.position || 0) - (b.position || 0))

      // Build ZIP with all files
      for (const layer of enabledLayers) {
        const folderName = layer.id

        // Add arrangements (required!)
        for (const arrangement of layer.arrangements) {
          if (arrangement.file) {
            const content = await arrangement.file.arrayBuffer()
            zip.file(`${folderName}/${arrangement.fileName}`, content)
          }
        }

        // Add purposes (required!)
        for (const purpose of layer.purposes) {
          if (purpose.file) {
            const content = await purpose.file.arrayBuffer()
            zip.file(`${folderName}/${purpose.fileName}`, content)
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipFile = new File([zipBlob], 'wypis.zip', { type: 'application/zip' })

      // Validation: Check ZIP is not empty
      if (zipFile.size < 100) {
        dispatch(showError('ZIP jest pusty! Dodaj pliki DOC/DOCX dla wszystkich przeznaczenia i ustaleń.'))
        console.error('❌ Empty ZIP detected:', zipFile.size, 'bytes')
        return
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

      const configurationJson = JSON.stringify(configuration)

      // DEBUG: Log request payload
      console.log('🔍 Sending wypis configuration:', {
        project: projectName,
        config_id: configId || '(auto-generate)',
        configuration_preview: {
          configuration_name: configuration.configuration_name,
          plotsLayer: configuration.plotsLayer,
          planLayers_count: configuration.planLayers.length,
        },
        zipFile_size: `${(zipFile.size / 1024).toFixed(1)} KB`,
        zipFile_has_content: zipFile.size > 100, // ZIP header is ~100 bytes
      })

      const result = await addWypisConfiguration({
        project: projectName,
        configuration: configurationJson,
        extractFiles: zipFile,
        ...(configId && { config_id: configId }) // Only include config_id if editing existing config
      }).unwrap()

      console.log('✅ Configuration saved successfully:', result)
      dispatch(showSuccess(configId ? 'Zaktualizowano konfigurację' : 'Zapisano konfigurację'))
      onClose()
    } catch (error: any) {
      console.error('❌ Save failed:', error)
      console.error('Error details:', {
        status: error?.status,
        statusText: error?.statusText,
        data: error?.data,
        message: error?.data?.message || error?.message,
      })
      const errorMessage = error?.data?.message || error?.message || 'Błąd zapisu - sprawdź console'
      dispatch(showError(errorMessage))
    }
  }, [planLayers, configurationName, plotsLayer, projectName, configId, addWypisConfiguration, dispatch, onClose])

  const enabledLayers = planLayers.filter(pl => pl.enabled)
  const totalPurposes = enabledLayers.reduce((sum, pl) => sum + pl.purposes.length, 0)
  // Count only NEW files (not existingFileName) - backend requires ZIP with all files
  const uploadedPurposes = enabledLayers.reduce((sum, pl) =>
    sum + pl.purposes.filter(p => p.file).length, 0
  )
  const totalArrangements = enabledLayers.reduce((sum, pl) => sum + pl.arrangements.length, 0)
  const uploadedArrangements = enabledLayers.reduce((sum, pl) =>
    sum + pl.arrangements.filter(a => a.file).length, 0
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px', maxHeight: '95vh' } }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {configId ? 'Edytuj konfigurację' : 'Nowa konfiguracja wypisu'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Krok {activeStep + 1} z {steps.length}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={((activeStep + 1) / steps.length) * 100}
        sx={{ height: 6 }}
      />

      <DialogContent sx={{ px: 3, py: 3 }}>
        {isLoadingConfig ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* STEP 1: Nazwa i konfiguracja */}
            <Step>
              <StepLabel
                optional={isStep1Valid() ? <Chip label="Gotowe" size="small" color="success" icon={<CheckCircleIcon />} /> : null}
              >
                Nazwa i konfiguracja
              </StepLabel>
              <StepContent>
                {configurationsListResponse?.success && configurationsListResponse.data?.config_structure?.length > 0 && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Załaduj istniejącą konfigurację</InputLabel>
                    <Select
                      value={selectedConfigId || ''}
                      onChange={(e) => setSelectedConfigId(e.target.value || null)}
                      label="Załaduj istniejącą konfigurację"
                      size="small"
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
                  placeholder="np. MPZP Warszawa Śródmieście"
                  error={!isStep1Valid() && configurationName.length > 0}
                  helperText={!isStep1Valid() && configurationName.length > 0 ? "Nazwa jest wymagana" : ""}
                  sx={{ mb: 2 }}
                />

                <Button variant="contained" onClick={handleNext} disabled={!isStep1Valid()}>
                  Dalej
                </Button>
              </StepContent>
            </Step>

            {/* STEP 2: Warstwa działek */}
            <Step>
              <StepLabel
                optional={isStep2Valid() ? <Chip label="Gotowe" size="small" color="success" icon={<CheckCircleIcon />} /> : null}
              >
                Warstwa działek
              </StepLabel>
              <StepContent>
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
                    size="small"
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
                        size="small"
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
                        size="small"
                      >
                        {getLayerColumns(plotsLayer.layerId).map(col => (
                          <MenuItem key={col} value={col}>{col}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button onClick={handleBack}>Wstecz</Button>
                  <Button variant="contained" onClick={handleNext} disabled={!isStep2Valid()}>
                    Dalej
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* STEP 3: Warstwy planów */}
            <Step>
              <StepLabel
                optional={isStep3Valid() ? <Chip label="Gotowe" size="small" color="success" icon={<CheckCircleIcon />} /> : null}
              >
                Warstwy planów ({enabledLayers.length} wybrane)
              </StepLabel>
              <StepContent>
                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                  Zaznacz warstwy planów i wybierz kolumny z przeznaczeniem terenu
                </Alert>

                <Grid container spacing={1}>
                  {planLayers.map(layer => (
                    <Grid item xs={12} key={layer.id}>
                      <Card variant="outlined" sx={{ bgcolor: layer.enabled ? 'success.50' : 'grey.50' }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                              control={<Checkbox checked={layer.enabled} onChange={() => togglePlanLayer(layer.id)} />}
                              label={
                                <Typography variant="body2" sx={{ fontWeight: layer.enabled ? 600 : 400 }}>
                                  {layer.name}
                                </Typography>
                              }
                              sx={{ flex: 1 }}
                            />

                            {layer.enabled && (
                              <FormControl sx={{ minWidth: 180 }} size="small">
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
                            )}

                            {layer.enabled && layer.purposeColumn && (
                              <Chip
                                label={`${layer.purposes.length} przeznaczenia`}
                                size="small"
                                color={layer.purposes.length > 0 ? "primary" : "default"}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button onClick={handleBack}>Wstecz</Button>
                  <Button variant="contained" onClick={handleNext} disabled={!isStep3Valid()}>
                    Dalej
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* STEP 4: Pliki i ustalenia */}
            <Step>
              <StepLabel
                optional={
                  isStep4Valid() ? (
                    <Chip label="Gotowe" size="small" color="success" icon={<CheckCircleIcon />} />
                  ) : (
                    <Chip label={`${uploadedPurposes}/${totalPurposes} plików`} size="small" color="warning" />
                  )
                }
              >
                Pliki i ustalenia
              </StepLabel>
              <StepContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>⚠️ Wymagane nowe pliki!</Typography>
                  Musisz dodać pliki DOC/DOCX dla WSZYSTKICH przeznaczenia i ustaleń. Backend wymaga ZIP z kompletnymi plikami.
                </Alert>

                {!isStep4Valid() && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Brakujące pliki: {totalPurposes + totalArrangements - uploadedPurposes - uploadedArrangements}
                    </Typography>
                    Sprawdź każdą warstwę i dodaj brakujące pliki DOC/DOCX.
                  </Alert>
                )}

                {/* Summary card */}
                <Card variant="outlined" sx={{ mb: 2, bgcolor: 'info.50', borderColor: 'info.main' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Podsumowanie:</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Warstwy planów:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{enabledLayers.length}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Przeznaczenia:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{totalPurposes}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Pliki przeznaczenia:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: uploadedPurposes === totalPurposes ? 'success.main' : 'warning.main' }}>
                          {uploadedPurposes}/{totalPurposes}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Pliki ustaleń:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: uploadedArrangements === totalArrangements && totalArrangements > 0 ? 'success.main' : 'error.main' }}>
                          {uploadedArrangements}/{totalArrangements}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* File upload sections for each enabled layer */}
                {enabledLayers.map((layer, idx) => (
                  <Card key={layer.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                        {idx + 1}. {layer.name}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Przeznaczenia:</Typography>
                      <List dense sx={{ mb: 2 }}>
                        {layer.purposes.map(purpose => (
                          <ListItem key={purpose.name} sx={{ px: 0, py: 0.5 }}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {purpose.name}
                                </Typography>
                                {purpose.file ? (
                                  <Chip label="Nowy plik ✓" size="small" color="success" />
                                ) : purpose.existingFileName ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip label="Wymagany nowy plik" size="small" color="warning" icon={<ErrorIcon />} />
                                    <IconButton
                                      size="small"
                                      onClick={() => downloadFile(layer.id, purpose.existingFileName!)}
                                      title={`Pobierz: ${purpose.existingFileName}`}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Chip label="Brak pliku" size="small" color="error" icon={<ErrorIcon />} />
                                )}
                              </Box>
                              <FileDropZone
                                file={purpose.file}
                                onDrop={(files) => handlePurposeFileDrop(layer.id, purpose.name, files)}
                                onRemove={() => removePurposeFile(layer.id, purpose.name)}
                              />
                            </Box>
                          </ListItem>
                        ))}
                      </List>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Ustalenia dla tej warstwy {layer.arrangements.length === 0 && <ErrorIcon fontSize="small" color="error" sx={{ ml: 0.5 }} />}
                      </Typography>
                      <FileDropZone
                        file={undefined}
                        onDrop={(files) => handleArrangementFileDrop(layer.id, files)}
                        onRemove={() => {}}
                        multiple
                      />

                      {layer.arrangements.length > 0 && (
                        <List dense sx={{ mt: 1 }}>
                          {layer.arrangements.map(arrangement => (
                            <ListItem
                              key={arrangement.fileName}
                              sx={{
                                mb: 0.5,
                                p: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'grey.50',
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <TextField
                                  value={arrangement.name}
                                  onChange={(e) => updateArrangementName(layer.id, arrangement.fileName, e.target.value)}
                                  placeholder="Nazwa ustalenia"
                                  size="small"
                                  fullWidth
                                  sx={{ mb: 0.5 }}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {arrangement.fileName}
                                  {arrangement.existingFileName && ' (zapisany)'}
                                  {arrangement.file && ' (nowy plik)'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                {arrangement.existingFileName && !arrangement.file && (
                                  <IconButton
                                    size="small"
                                    onClick={() => downloadFile(layer.id, arrangement.existingFileName!)}
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
                    </CardContent>
                  </Card>
                ))}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button onClick={handleBack}>Wstecz</Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined">
          Anuluj
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || isLoadingConfig || !isStep4Valid()}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? 'Zapisywanie...' : configId ? 'Zaktualizuj' : 'Zapisz konfigurację'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WypisConfigModal
