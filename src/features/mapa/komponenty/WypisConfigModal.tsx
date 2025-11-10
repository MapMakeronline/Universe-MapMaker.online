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
import type { WypisPurposeWithFile, WypisArrangementWithFile } from '@/backend/types'
import { useAppDispatch } from '@/redux/hooks'
import { showNotification } from '@/redux/slices/notificationSlice'
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
  projectLayers,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const dispatch = useAppDispatch()

  const [addWypisConfiguration, { isLoading: isSaving }] = useAddWypisConfigurationMutation()
  const { data: existingConfig, isLoading: isLoadingConfig } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: configId || undefined },
    { skip: !configId || !open }
  )

  // Form state
  const [configurationName, setConfigurationName] = useState('')
  const [plotsLayer, setPlotsLayer] = useState({
    layerId: '',
    layerName: '',
    precinctColumn: '',
    plotNumberColumn: '',
  })
  const [planLayers, setPlanLayers] = useState<PlanLayerState[]>([])
  const [newArrangementName, setNewArrangementName] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<string[]>([])

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
              arrangements: existingPlan.arrangements.map(a => ({ ...a, file: undefined })),
            }
          }
          return layer
        })
      )
    }
  }, [existingConfig])

  const getLayerColumns = useCallback((layerId: string): string[] => {
    const layer = projectLayers.find(l => l.id === layerId)
    return layer?.attributes || []
  }, [projectLayers])

  const getUniquePurposeValues = useCallback((layerId: string, purposeColumn: string): string[] => {
    // TODO: Backend endpoint to get unique values from layer column
    // For now, return mock data based on common MPZP symbols
    return ['MN', 'MW', 'U', 'UP', 'US', 'ZP', 'KD', 'KDD', 'KDW', 'KDZ']
  }, [])

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

  const setPlanLayerPosition = useCallback((layerId: string, position: number) => {
    setPlanLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, position } : layer))
    )
  }, [])

  const setPlanLayerPurposeColumn = useCallback((layerId: string, column: string) => {
    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          const uniqueValues = getUniquePurposeValues(layerId, column)
          return {
            ...layer,
            purposeColumn: column,
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
  }, [getUniquePurposeValues])

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

    dispatch(showNotification({ message: `Dodano: ${file.name}`, severity: 'success' }))
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

  const addArrangement = useCallback((layerId: string) => {
    const name = newArrangementName[layerId]?.trim()
    if (!name) {
      dispatch(showNotification({ message: 'Wprowadź nazwę ustalenia', severity: 'error' }))
      return
    }

    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          const exists = layer.arrangements.some(a => a.name === name)
          if (exists) {
            dispatch(showNotification({ message: 'Ustalenie już istnieje', severity: 'error' }))
            return layer
          }
          return {
            ...layer,
            arrangements: [...layer.arrangements, { name, fileName: `${name}.docx`, file: undefined }],
          }
        }
        return layer
      })
    )

    setNewArrangementName(prev => ({ ...prev, [layerId]: '' }))
  }, [newArrangementName, dispatch])

  const handleArrangementFileDrop = useCallback((layerId: string, arrangementName: string, files: File[]) => {
    if (files.length === 0) return
    const file = files[0]

    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            arrangements: layer.arrangements.map(a =>
              a.name === arrangementName ? { ...a, file, fileName: file.name } : a
            ),
          }
        }
        return layer
      })
    )

    dispatch(showNotification({ message: `Dodano: ${file.name}`, severity: 'success' }))
  }, [dispatch])

  const removeArrangementFile = useCallback((layerId: string, arrangementName: string) => {
    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            arrangements: layer.arrangements.map(a =>
              a.name === arrangementName ? { ...a, file: undefined } : a
            ),
          }
        }
        return layer
      })
    )
  }, [])

  const deleteArrangement = useCallback((layerId: string, arrangementName: string) => {
    setPlanLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            arrangements: layer.arrangements.filter(a => a.name !== arrangementName),
          }
        }
        return layer
      })
    )
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
        errors.push(`"${layer.name}": Brak plików dla: ${missingPurposes.map(p => p.name).join(', ')}`)
      }
      const missingArrangements = layer.arrangements.filter(a => !a.file)
      if (missingArrangements.length > 0) {
        errors.push(`"${layer.name}": Brak plików ustaleń: ${missingArrangements.map(a => a.name).join(', ')}`)
      }
    }

    return errors
  }, [configurationName, plotsLayer, planLayers])

  const handleSave = useCallback(async () => {
    const validationErrors = validateConfiguration()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      dispatch(showNotification({ message: 'Popraw błędy walidacji', severity: 'error' }))
      return
    }

    setErrors([])

    try {
      const zip = new JSZip()
      const enabledLayers = planLayers
        .filter(pl => pl.enabled)
        .sort((a, b) => (a.position || 0) - (b.position || 0))

      for (const layer of enabledLayers) {
        const folderName = layer.id

        for (const purpose of layer.purposes) {
          if (purpose.file) {
            const content = await purpose.file.arrayBuffer()
            zip.file(`${folderName}/${purpose.fileName}`, content)
          }
        }

        for (const arrangement of layer.arrangements) {
          if (arrangement.file) {
            const content = await arrangement.file.arrayBuffer()
            zip.file(`${folderName}/${arrangement.fileName}`, content)
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipFile = new File([zipBlob], 'wypis.zip', { type: 'application/zip' })

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
          purposes: pl.purposes.map(p => ({ name: p.name, fileName: p.fileName })),
          arrangements: pl.arrangements.map(a => ({ name: a.name, fileName: a.fileName })),
        })),
      }

      const formData = new FormData()
      formData.append('project', projectName)
      formData.append('configuration', JSON.stringify(configuration))
      formData.append('file', zipFile)
      if (configId) {
        formData.append('config_id', configId)
      }

      await addWypisConfiguration(formData).unwrap()

      dispatch(showNotification({
        message: configId ? 'Zaktualizowano konfigurację' : 'Zapisano konfigurację',
        severity: 'success',
      }))

      onClose()
    } catch (error: any) {
      console.error('Error saving:', error)
      dispatch(showNotification({
        message: error?.data?.message || 'Błąd zapisu',
        severity: 'error',
      }))
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
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {configId ? 'Edytuj konfigurację' : 'Nowa konfiguracja wypisu'}
        </Typography>
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

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Warstwy planów</Typography>

            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              <strong>Uwaga:</strong> Funkcja skali przezroczystości będzie dostępna w przyszłej wersji.
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
                        {layer.name} - Przeznaczenia i ustalenia
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="h6" sx={{ mb: 2 }}>Przeznaczenia terenu (purposes)</Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Przeciągnij pliki DOC/DOCX dla każdego przeznaczenia
                      </Alert>

                      <List sx={{ mb: 3 }}>
                        {layer.purposes.map(purpose => (
                          <ListItem key={purpose.name} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2c3e50' }}>
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

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="h6" sx={{ mb: 2 }}>Ustalenia ogólne (arrangements)</Typography>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Nazwa ustalenia"
                          value={newArrangementName[layer.id] || ''}
                          onChange={(e) => setNewArrangementName({ ...newArrangementName, [layer.id]: e.target.value })}
                          fullWidth
                          size="small"
                          placeholder="np. Rozdział 1"
                        />
                        <Button
                          variant="contained"
                          onClick={() => addArrangement(layer.id)}
                          startIcon={<AddIcon />}
                          disabled={!newArrangementName[layer.id]?.trim()}
                        >
                          Dodaj
                        </Button>
                      </Box>

                      <List>
                        {layer.arrangements.map(arr => (
                          <ListItem key={arr.name} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{arr.name}</Typography>
                              <IconButton size="small" onClick={() => deleteArrangement(layer.id, arr.name)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <FileDropZone
                              file={arr.file}
                              onDrop={(files) => handleArrangementFileDrop(layer.id, arr.name, files)}
                              onRemove={() => removeArrangementFile(layer.id, arr.name)}
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
