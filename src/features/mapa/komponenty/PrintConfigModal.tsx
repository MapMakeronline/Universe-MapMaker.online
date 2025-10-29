"use client"

/**
 * PrintConfigModal - Modal for Wypis/Wyrys configuration
 *
 * MVP Implementation - Basic functionality:
 * - Add/Edit wypis configuration
 * - Select parcel layer and columns
 * - Add plan layers with purposes
 *
 * TODO (Future enhancements):
 * - Multi-step wizard
 * - PDF file upload
 * - Live JSON preview
 * - Arrangements configuration
 */

import React, { useState, useEffect } from 'react'
import JSZip from 'jszip'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  useAddWypisConfigurationMutation,
  useGetWypisConfigurationQuery,
} from '@/backend/wypis'
import { useGetLayerAttributesQuery, useLazyGetColumnValuesQuery } from '@/backend/layers'
import type {
  WypisConfigFormState,
  WypisPurpose,
  WypisArrangement,
  WypisConfiguration,
} from '@/backend/types'

interface QGISLayer {
  id: string
  name: string
  columns?: string[]
}

interface PrintConfigModalProps {
  open: boolean
  onClose: () => void
  projectName: string
  configId?: string // If editing existing configuration
  availableLayers: QGISLayer[] // Layers from QGIS project
}

const initialFormState: WypisConfigFormState = {
  configurationName: '',
  plotsLayer: {
    layerId: '',
    layerName: '',
    precinctColumn: '',
    plotNumberColumn: '',
  },
  planLayers: [],
  transparencySettings: '',
}

const PrintConfigModal: React.FC<PrintConfigModalProps> = ({
  open,
  onClose,
  projectName,
  configId,
  availableLayers,
}) => {
  const [formData, setFormData] = useState<WypisConfigFormState>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // RTK Query hooks
  const [addConfiguration, { isLoading: isSaving }] = useAddWypisConfigurationMutation()
  const { data: existingConfig, isLoading: isLoadingConfig } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: configId },
    { skip: !configId || !open }
  )

  // Fetch layer attributes (columns) for selected plots layer
  const { data: plotsLayerAttributes } = useGetLayerAttributesQuery(
    { project: projectName, layer_id: formData.plotsLayer.layerId },
    { skip: !formData.plotsLayer.layerId }
  )

  // Available columns for selected plots layer
  const availableColumns = plotsLayerAttributes?.data?.feature_names || []

  // Load existing configuration if editing
  useEffect(() => {
    if (existingConfig && 'data' in existingConfig) {
      const config = existingConfig.data
      setFormData({
        configurationName: config.configuration_name,
        plotsLayer: {
          layerId: config.plotsLayer,
          layerName: config.plotsLayerName,
          precinctColumn: config.precinctColumn,
          plotNumberColumn: config.plotNumberColumn,
        },
        planLayers: config.planLayers.map((pl, index) => ({
          ...pl,
          enabled: true,
          position: index + 1,
        })),
        transparencySettings: '',
      })
    }
  }, [existingConfig])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && !configId) {
      setFormData(initialFormState)
      setErrors({})
    }
  }, [open, configId])

  const handleSubmit = async () => {
    // Validation
    const validationErrors: Record<string, string> = {}

    if (!formData.configurationName.trim()) {
      validationErrors.configurationName = 'Nazwa konfiguracji jest wymagana'
    }

    if (!formData.plotsLayer.layerId) {
      validationErrors.plotsLayer = 'Wybierz warstwę działek'
    }

    if (!formData.plotsLayer.precinctColumn) {
      validationErrors.precinctColumn = 'Wybierz kolumnę z obrębem'
    }

    if (!formData.plotsLayer.plotNumberColumn) {
      validationErrors.plotNumberColumn = 'Wybierz kolumnę z numerem działki'
    }

    const enabledLayers = formData.planLayers.filter((pl) => pl.enabled)
    if (enabledLayers.length === 0) {
      validationErrors.planLayers = 'Wybierz przynajmniej jedną warstwę planu'
    }

    // Validate files - all purposes and arrangements must have files
    const missingFiles: string[] = []
    enabledLayers.forEach((pl) => {
      pl.purposes.forEach((p, idx) => {
        if (!p.file) {
          missingFiles.push(`${pl.name} → Przeznaczenie ${idx + 1} "${p.name}"`)
        }
      })
      pl.arrangements.forEach((a, idx) => {
        if (!a.file) {
          missingFiles.push(`${pl.name} → Ustalenie ${idx + 1} "${a.name}"`)
        }
      })
    })

    if (missingFiles.length > 0) {
      validationErrors.submit = `Brakuje plików dla:\n${missingFiles.join('\n')}`
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      // Step 1: Create ZIP file with all PDFs
      const zip = new JSZip()

      for (const pl of enabledLayers) {
        // Add purposes files
        for (const purpose of pl.purposes) {
          if (purpose.file) {
            zip.file(`${pl.id}/${purpose.fileName}`, purpose.file)
          }
        }

        // Add arrangements files
        for (const arrangement of pl.arrangements) {
          if (arrangement.file) {
            zip.file(`${pl.id}/${arrangement.fileName}`, arrangement.file)
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Step 2: Create configuration JSON (without File objects)
      const configPayload: WypisConfiguration = {
        configuration_name: formData.configurationName,
        plotsLayer: formData.plotsLayer.layerId,
        plotsLayerName: formData.plotsLayer.layerName,
        precinctColumn: formData.plotsLayer.precinctColumn,
        plotNumberColumn: formData.plotsLayer.plotNumberColumn,
        planLayers: enabledLayers
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((pl) => ({
            id: pl.id,
            name: pl.name,
            purposeColumn: pl.purposeColumn,
            purposes: pl.purposes.map(({ name, fileName }) => ({ name, fileName })),
            arrangements: pl.arrangements.map(({ name, fileName }) => ({ name, fileName })),
          })),
      }

      // Step 3: Send multipart/form-data with ZIP + JSON
      const formDataPayload = new FormData()
      formDataPayload.append('project', projectName)
      if (configId) {
        formDataPayload.append('config_id', configId)
      }
      formDataPayload.append('configuration', JSON.stringify(configPayload))
      formDataPayload.append('file', zipBlob, 'documents.zip')

      // Send via RTK Query mutation (FormData automatically uses multipart/form-data)
      await addConfiguration(formDataPayload).unwrap()

      onClose()
    } catch (error: any) {
      console.error('Błąd podczas zapisywania konfiguracji:', error)
      setErrors({ submit: error?.data?.message || 'Błąd podczas zapisywania konfiguracji' })
    }
  }

  const handleAddPlanLayer = (layerId: string) => {
    if (!layerId) return

    const layer = availableLayers.find((l) => l.id === layerId)
    if (!layer) return

    // Check if already added
    if (formData.planLayers.find((pl) => pl.id === layerId)) {
      setErrors({ planLayers: 'Ta warstwa została już dodana' })
      return
    }

    const newPlanLayer = {
      id: layer.id,
      name: layer.name,
      purposeColumn: '', // Will be selected by user
      purposes: [],
      arrangements: [],
      enabled: true,
      position: formData.planLayers.filter((pl) => pl.enabled).length + 1,
    }

    setFormData({
      ...formData,
      planLayers: [...formData.planLayers, newPlanLayer],
    })
    setErrors({}) // Clear errors
  }

  const handleRemovePlanLayer = (index: number) => {
    setFormData({
      ...formData,
      planLayers: formData.planLayers.filter((_, i) => i !== index),
    })
  }

  const handlePlotsLayerChange = (layerId: string) => {
    const layer = availableLayers.find((l) => l.id === layerId)
    if (layer) {
      setFormData({
        ...formData,
        plotsLayer: {
          layerId: layer.id,
          layerName: layer.name,
          precinctColumn: '', // Will be set by user after columns load from API
          plotNumberColumn: '', // Will be set by user after columns load from API
        },
      })
    }
  }

  // Auto-select columns when they load from API
  useEffect(() => {
    if (availableColumns.length > 0 && !formData.plotsLayer.precinctColumn) {
      const obreColumn = availableColumns.find((c) => c.toLowerCase().includes('obr'))
      const numerColumn = availableColumns.find((c) => c.toLowerCase().includes('numer'))

      if (obreColumn || numerColumn) {
        setFormData((prev) => ({
          ...prev,
          plotsLayer: {
            ...prev.plotsLayer,
            precinctColumn: obreColumn || availableColumns[0] || '',
            plotNumberColumn: numerColumn || availableColumns[1] || '',
          },
        }))
      }
    }
  }, [availableColumns, formData.plotsLayer.precinctColumn])

  if (isLoadingConfig) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: '#34495e',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Konfiguracja wypisu
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#ecf0f1', p: 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2.5}>
          {/* Configuration Name */}
          <TextField
            label="Nazwa konfiguracji"
            fullWidth
            size="small"
            value={formData.configurationName}
            onChange={(e) =>
              setFormData({ ...formData, configurationName: e.target.value })
            }
            error={!!errors.configurationName}
            helperText={errors.configurationName}
            placeholder="np. MPZP, SUiKZP"
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
          />

          {/* Plots Layer Section */}
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: 'white' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Warstwa działek
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Wybierz warstwę działek</InputLabel>
              <Select
                value={formData.plotsLayer.layerId}
                label="Wybierz warstwę działek"
                onChange={(e) => handlePlotsLayerChange(e.target.value)}
                error={!!errors.plotsLayer}
              >
                {availableLayers.map((layer) => (
                  <MenuItem key={layer.id} value={layer.id}>
                    {layer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.plotsLayer.layerId && (
              <>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Kolumna z obrębem</InputLabel>
                  <Select
                    value={formData.plotsLayer.precinctColumn}
                    label="Kolumna z obrębem"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plotsLayer: {
                          ...formData.plotsLayer,
                          precinctColumn: e.target.value,
                        },
                      })
                    }
                    error={!!errors.precinctColumn}
                  >
                    {availableColumns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Kolumna z numerem działki</InputLabel>
                  <Select
                    value={formData.plotsLayer.plotNumberColumn}
                    label="Kolumna z numerem działki"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plotsLayer: {
                          ...formData.plotsLayer,
                          plotNumberColumn: e.target.value,
                        },
                      })
                    }
                    error={!!errors.plotNumberColumn}
                  >
                    {availableColumns.map((col) => (
                      <MenuItem key={col} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>

          {/* Plan Layers Section */}
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: 'white' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Warstwy planu zagospodarowania
            </Typography>

            {errors.planLayers && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.planLayers}
              </Alert>
            )}

            {/* Add Layer Dropdown */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>+ Dodaj warstwę</InputLabel>
              <Select
                value=""
                label="+ Dodaj warstwę"
                onChange={(e) => handleAddPlanLayer(e.target.value)}
              >
                {availableLayers
                  .filter((l) => !formData.planLayers.find((pl) => pl.id === l.id))
                  .map((layer) => (
                    <MenuItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Plan Layers List */}
            {formData.planLayers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Brak warstw planu. Kliknij "Dodaj warstwę" aby rozpocząć.
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {formData.planLayers.map((planLayer, index) => (
                  <PlanLayerConfigCard
                    key={planLayer.id}
                    planLayer={planLayer}
                    index={index}
                    projectName={projectName}
                    onUpdate={(updatedLayer) => {
                      const updated = [...formData.planLayers]
                      updated[index] = updatedLayer
                      setFormData({ ...formData, planLayers: updated })
                    }}
                    onRemove={() => handleRemovePlanLayer(index)}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Transparency Notice */}
          <Alert severity="info">
            <strong>Uwaga:</strong> Funkcja skali przezroczystości jest obecnie ustawiona
            na stałe w systemie i będzie dostępna w przyszłej wersji.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#ecf0f1', p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: '#34495e', '&:hover': { bgcolor: '#2c3e50' } }}
        >
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving}
          sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * PlanLayerConfigCard - Expandable card for configuring a single plan layer
 * Includes:
 * - Column selection
 * - Purposes (przeznaczenia) configuration
 * - Arrangements (ustalenia) configuration
 */
interface PlanLayerConfigCardProps {
  planLayer: WypisConfigFormState['planLayers'][0]
  index: number
  projectName: string
  onUpdate: (updated: WypisConfigFormState['planLayers'][0]) => void
  onRemove: () => void
}

const PlanLayerConfigCard: React.FC<PlanLayerConfigCardProps> = ({
  planLayer,
  index,
  projectName,
  onUpdate,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [newArrangement, setNewArrangement] = useState({ name: '', fileName: '' })
  const [loadingPurposes, setLoadingPurposes] = useState(false)

  // Fetch columns for this layer
  const { data: layerAttributes } = useGetLayerAttributesQuery(
    { project: projectName, layer_id: planLayer.id },
    { skip: !planLayer.id }
  )

  const layerColumns = layerAttributes?.data?.feature_names || []

  // Lazy query for fetching unique column values
  const [fetchColumnValues, { data: columnValuesData }] = useLazyGetColumnValuesQuery()

  // Auto-load purposes when column is selected
  useEffect(() => {
    if (planLayer.purposeColumn && planLayer.purposes.length === 0 && !loadingPurposes) {
      setLoadingPurposes(true)
      fetchColumnValues({
        project: projectName,
        layer_id: planLayer.id,
        column_name: planLayer.purposeColumn,
      })
    }
  }, [planLayer.purposeColumn, planLayer.purposes.length, loadingPurposes, projectName, planLayer.id, fetchColumnValues])

  // When column values are loaded, create purposes with empty fileNames
  useEffect(() => {
    if (columnValuesData?.data && loadingPurposes) {
      const uniqueValues = columnValuesData.data
      const newPurposes: WypisPurpose[] = uniqueValues.map((value: string) => ({
        name: value,
        fileName: '', // User must fill this manually
      }))

      onUpdate({
        ...planLayer,
        purposes: newPurposes,
      })
      setLoadingPurposes(false)
    }
  }, [columnValuesData, loadingPurposes])

  const handleUpdatePurposeFileName = (purposeIndex: number, fileName: string) => {
    const updatedPurposes = [...planLayer.purposes]
    updatedPurposes[purposeIndex] = {
      ...updatedPurposes[purposeIndex],
      fileName,
    }
    onUpdate({
      ...planLayer,
      purposes: updatedPurposes,
    })
  }

  const handleReloadPurposes = () => {
    if (planLayer.purposeColumn) {
      setLoadingPurposes(true)
      fetchColumnValues({
        project: projectName,
        layer_id: planLayer.id,
        column_name: planLayer.purposeColumn,
      })
    }
  }

  const handleAddArrangement = () => {
    if (!newArrangement.name.trim() || !newArrangement.fileName.trim()) return

    onUpdate({
      ...planLayer,
      arrangements: [...planLayer.arrangements, { ...newArrangement }],
    })
    setNewArrangement({ name: '', fileName: '' })
  }

  const handleRemoveArrangement = (arrangementIndex: number) => {
    onUpdate({
      ...planLayer,
      arrangements: planLayer.arrangements.filter((_, i) => i !== arrangementIndex),
    })
  }

  return (
    <Box
      sx={{
        border: '1px solid #ddd',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#f5f5f5',
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {planLayer.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {planLayer.purposes.length} przeznaczenia, {planLayer.arrangements.length} ustaleń
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Expandable Content */}
      {expanded && (
        <Box sx={{ p: 2, bgcolor: 'white' }}>
          {/* Column Selection */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Kolumna z przeznaczeniem</InputLabel>
            <Select
              value={planLayer.purposeColumn}
              label="Kolumna z przeznaczeniem"
              onChange={(e) =>
                onUpdate({ ...planLayer, purposeColumn: e.target.value })
              }
            >
              {layerColumns.map((col) => (
                <MenuItem key={col} value={col}>
                  {col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Purposes Section */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Przeznaczenia terenu (purposes)
              </Typography>
              {planLayer.purposeColumn && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleReloadPurposes}
                  disabled={loadingPurposes}
                  sx={{ fontSize: '11px', py: 0.5, px: 1 }}
                >
                  {loadingPurposes ? 'Ładowanie...' : 'Odśwież'}
                </Button>
              )}
            </Box>

            {!planLayer.purposeColumn ? (
              <Alert severity="info" sx={{ fontSize: '12px' }}>
                Wybierz kolumnę z przeznaczeniem aby załadować wartości
              </Alert>
            ) : planLayer.purposes.length === 0 ? (
              <Alert severity="warning" sx={{ fontSize: '12px' }}>
                {loadingPurposes ? 'Ładowanie wartości...' : 'Brak wartości w kolumnie'}
              </Alert>
            ) : (
              <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                {planLayer.purposes.map((purpose, pIndex) => (
                  <ListItem
                    key={pIndex}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      py: 1,
                      borderBottom: pIndex < planLayer.purposes.length - 1 ? '1px solid #e0e0e0' : 'none',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {purpose.name}
                      </Typography>
                      {purpose.file && (
                        <Typography variant="caption" color="success.main">
                          ✓ {(purpose.file.size / 1024).toFixed(1)} KB
                        </Typography>
                      )}
                    </Box>

                    <Box display="flex" gap={1}>
                      <TextField
                        size="small"
                        placeholder="Nazwa pliku (np. MN.pdf)"
                        value={purpose.fileName}
                        onChange={(e) => handleUpdatePurposeFileName(pIndex, e.target.value)}
                        error={!purpose.fileName}
                        sx={{ flex: 1 }}
                      />

                      <Button
                        component="label"
                        variant={purpose.file ? "contained" : "outlined"}
                        size="small"
                        color={purpose.file ? "success" : "primary"}
                        sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                      >
                        {purpose.file ? '✓ Wybrano' : 'Wybierz plik'}
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx,.odt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Validate file type
                              const validExtensions = ['.pdf', '.doc', '.docx', '.odt']
                              const ext = '.' + file.name.split('.').pop()?.toLowerCase()

                              if (!validExtensions.includes(ext)) {
                                alert('Dozwolone formaty: PDF, DOC, DOCX, ODT')
                                return
                              }

                              const updated = [...planLayer.purposes]
                              updated[pIndex] = {
                                ...updated[pIndex],
                                file,
                                fileName: file.name
                              }
                              onUpdate({ ...planLayer, purposes: updated })
                            }
                          }}
                        />
                      </Button>
                    </Box>

                    {purpose.file && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Plik: {purpose.file.name}
                      </Typography>
                    )}

                    {!purpose.file && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        Wymagane: wybierz plik PDF
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Arrangements Section */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Ustalenia ogólne (arrangements)
            </Typography>

            {/* Add Arrangement Form */}
            <Box display="flex" gap={1} mb={1}>
              <TextField
                size="small"
                placeholder="Nazwa (np. Rozdział 1)"
                value={newArrangement.name}
                onChange={(e) => setNewArrangement({ ...newArrangement, name: e.target.value })}
                fullWidth
              />
              <TextField
                size="small"
                placeholder="Plik (np. rozdzial_1.pdf)"
                value={newArrangement.fileName}
                onChange={(e) => setNewArrangement({ ...newArrangement, fileName: e.target.value })}
                fullWidth
              />
              <IconButton
                size="small"
                color="primary"
                onClick={handleAddArrangement}
                disabled={!newArrangement.name.trim() || !newArrangement.fileName.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Arrangements List */}
            <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
              {planLayer.arrangements.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="Brak ustaleń"
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              ) : (
                planLayer.arrangements.map((arrangement, aIndex) => (
                  <ListItem key={aIndex} sx={{ display: 'block', py: 1.5 }}>
                    {/* Arrangement Name (read-only) */}
                    <Typography variant="body2" fontWeight={500} mb={1}>
                      {arrangement.name}
                    </Typography>

                    {/* File Upload Section */}
                    <Box display="flex" gap={1} alignItems="center">
                      <TextField
                        size="small"
                        placeholder="Nazwa pliku (np. rozdzial_1.pdf)"
                        value={arrangement.fileName}
                        onChange={(e) => {
                          const updated = [...planLayer.arrangements]
                          updated[aIndex] = {
                            ...updated[aIndex],
                            fileName: e.target.value
                          }
                          onUpdate({ ...planLayer, arrangements: updated })
                        }}
                        error={!arrangement.fileName}
                        sx={{ flex: 1 }}
                      />

                      <Button
                        component="label"
                        variant={arrangement.file ? "contained" : "outlined"}
                        size="small"
                        color={arrangement.file ? "success" : "primary"}
                        sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                      >
                        {arrangement.file ? '✓ Wybrano' : 'Wybierz plik'}
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx,.odt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Validate file extension
                              const validExtensions = ['.pdf', '.doc', '.docx', '.odt']
                              const ext = '.' + file.name.split('.').pop()?.toLowerCase()
                              if (!validExtensions.includes(ext)) {
                                alert('Dozwolone formaty: PDF, DOC, DOCX, ODT')
                                return
                              }

                              // Update arrangement with file
                              const updated = [...planLayer.arrangements]
                              updated[aIndex] = {
                                ...updated[aIndex],
                                file,
                                fileName: file.name // Auto-fill filename
                              }
                              onUpdate({ ...planLayer, arrangements: updated })
                            }
                          }}
                        />
                      </Button>

                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => handleRemoveArrangement(aIndex)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* File info */}
                    {arrangement.file && (
                      <Typography variant="caption" color="text.secondary" mt={0.5}>
                        {(arrangement.file.size / 1024).toFixed(1)} KB
                      </Typography>
                    )}

                    {!arrangement.fileName && (
                      <Typography variant="caption" color="error" mt={0.5}>
                        Wymagane
                      </Typography>
                    )}
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default PrintConfigModal
