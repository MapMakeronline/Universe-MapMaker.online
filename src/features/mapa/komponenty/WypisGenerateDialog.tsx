"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import CloseIcon from '@mui/icons-material/Close'
import DescriptionIcon from '@mui/icons-material/Description'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { useGetWypisConfigurationQuery, useCreateWypisMutation } from '@/backend/wypis'
import type { WypisPlot, WypisPlotWithDestinations, WypisPlanLayer } from '@/backend/types'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { showSuccess, showError } from '@/redux/slices/notificationSlice'
import {
  selectSelectedPlots,
  selectSelectedConfigId,
  removePlot,
  clearPlotSelection,
  setSelectedConfigId,
} from '@/redux/slices/wypisSlice'

interface WypisGenerateDialogProps {
  open: boolean
  onClose: () => void
  projectName: string
  availablePlots: Array<{
    precinct: string
    number: string
  }>
}

/**
 * Draggable Paper component using simple mouse events
 * No external libraries needed - lightweight and React 19 compatible
 */
function DraggablePaper(props: any) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const paperRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the header (has data-drag-handle attribute)
    const target = e.target as HTMLElement
    if (!target.closest('[data-drag-handle]')) {
      return
    }

    if (paperRef.current) {
      const rect = paperRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  return (
    <Paper
      {...props}
      ref={paperRef}
      onMouseDown={handleMouseDown}
      style={{
        ...props.style,
        position: 'fixed',
        left: position.x || props.style?.left,
        top: position.y || props.style?.top,
        transform: position.x ? 'none' : props.style?.transform,
        margin: 0,
      }}
      sx={{
        ...props.sx,
        userSelect: isDragging ? 'none' : 'auto',
      }}
    />
  )
}

/**
 * WypisGenerateDialog - Multi-step draggable dialog for generating wypis PDF
 *
 * Features:
 * - Draggable window (non-blocking, can interact with map)
 * - Step 1: Select configuration + plots (parcels) by clicking on map
 * - Step 2: Select destinations (for logged users with spatial data)
 * - Generate PDF via backend
 * - Auto-download PDF file
 */
const WypisGenerateDialog: React.FC<WypisGenerateDialogProps> = ({
  open,
  onClose,
  projectName,
  availablePlots,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const dispatch = useAppDispatch()

  // Redux state
  const selectedPlots = useAppSelector(selectSelectedPlots)
  const selectedConfigId = useAppSelector(selectSelectedConfigId)

  // RTK Query hooks
  const { data: configurationsData, isLoading: isLoadingConfigs } = useGetWypisConfigurationQuery(
    { project: projectName },
    { skip: !projectName || !open }
  )

  // Fetch full configuration details (for step 2 - destination selection)
  const { data: configDetailsData, isLoading: isLoadingConfigDetails } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: selectedConfigId || '' },
    { skip: !open || !projectName || !selectedConfigId }
  )

  const [createWypis, { isLoading: isGenerating }] = useCreateWypisMutation()

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [currentPlotIndex, setCurrentPlotIndex] = useState(0)
  const [plotSelections, setPlotSelections] = useState<Map<string, Set<string>>>(new Map())

  // Auto-select LAST config when loaded (newest configuration)
  useEffect(() => {
    const configs = configurationsData?.data?.config_structure || configurationsData?.data?.configurations || []
    console.log('🗺️ Wypis Dialog: Auto-select effect', {
      hasConfigs: configs.length > 0,
      configsCount: configs.length,
      selectedConfigId,
      lastConfigId: configs[configs.length - 1]?.id || configs[configs.length - 1]?.config_id,
      willAutoSelect: configs.length > 0 && !selectedConfigId,
    })

    if (configs.length > 0 && !selectedConfigId) {
      // Select LAST config (newest) instead of first
      const lastConfig = configs[configs.length - 1]
      const configIdToSet = lastConfig.id || lastConfig.config_id
      console.log('🗺️ Wypis Dialog: Auto-selecting LAST config (newest)', configIdToSet)
      dispatch(setSelectedConfigId(configIdToSet))
    }
  }, [configurationsData, selectedConfigId, dispatch])

  // Clear selection on close
  useEffect(() => {
    if (!open) {
      dispatch(clearPlotSelection())
      dispatch(setSelectedConfigId(null))
      setCurrentStep(1) // Reset to step 1
      setCurrentPlotIndex(0)
      setPlotSelections(new Map())
    }
  }, [open, dispatch])

  // Get plan layers from configuration details (for step 2)
  const planLayers: WypisPlanLayer[] = configDetailsData?.data?.planLayers || []

  // Initialize destination selections when entering step 2
  useEffect(() => {
    if (currentStep !== 2 || selectedPlots.length === 0 || planLayers.length === 0) return

    const newSelections = new Map<string, Set<string>>()

    selectedPlots.forEach((plotWithDest) => {
      const plotKey = `${plotWithDest.plot.precinct}-${plotWithDest.plot.number}`
      const selectedDestinations = new Set<string>()

      // Auto-select ONLY destinations that are on the plot (have coverage > 0%)
      planLayers.forEach((planLayer, planIdx) => {
        const existingPlanDest = plotWithDest.plot_destinations?.find(pd => pd.plan_id === planLayer.id)

        if (!existingPlanDest) return // Skip if plan layer not on plot

        let hasAnySelected = false

        // Check arrangements (always include ALL if plan exists - arrangements don't have coverage)
        planLayer.arrangements?.forEach((arrangement, arrIdx) => {
          selectedDestinations.add(`plan-${planIdx}-arr-${arrIdx}`)
          hasAnySelected = true
        })

        // Check purposes (only if coverage > 0%)
        planLayer.purposes?.forEach((purpose, purposeIdx) => {
          const existingPurpose = existingPlanDest.destinations?.find(d => d.name === purpose.name && d.includes)
          if (existingPurpose) {
            const coverage = parseFloat(existingPurpose.covering || '0')
            if (coverage > 0) {
              selectedDestinations.add(`plan-${planIdx}-purpose-${purposeIdx}`)
              hasAnySelected = true
            }
          }
        })

        // Add plan header checkbox if any destination is selected
        if (hasAnySelected) {
          selectedDestinations.add(`plan-${planIdx}`)
        }
      })

      newSelections.set(plotKey, selectedDestinations)
    })

    setPlotSelections(newSelections)
  }, [currentStep, selectedPlots, planLayers])

  const handleRemovePlot = (plot: WypisPlot) => {
    dispatch(removePlot(plot))
  }

  const handleNext = () => {
    if (!selectedConfigId) {
      dispatch(showError('Wybierz konfigurację'))
      return
    }

    if (selectedPlots.length === 0) {
      dispatch(showError('Wybierz przynajmniej jedną działkę'))
      return
    }

    // Check if any plot has destinations (for logged users)
    const hasDestinations = selectedPlots.some(plot => plot.plot_destinations && plot.plot_destinations.length > 0)

    if (hasDestinations) {
      // Go to step 2 (destination selection)
      setCurrentStep(2)
    } else {
      // For guests (no destinations), generate directly
      handleGenerateWypis()
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handlePrevPlot = () => {
    setCurrentPlotIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextPlot = () => {
    setCurrentPlotIndex((prev) => Math.min(selectedPlots.length - 1, prev + 1))
  }

  const handleToggleDestination = (key: string) => {
    const currentPlot = selectedPlots[currentPlotIndex]
    if (!currentPlot) return

    const currentPlotKey = `${currentPlot.plot.precinct}-${currentPlot.plot.number}`
    const newSelections = new Map(plotSelections)
    const plotSelectionsSet = new Set(plotSelections.get(currentPlotKey) || new Set())

    if (plotSelectionsSet.has(key)) {
      plotSelectionsSet.delete(key)
    } else {
      plotSelectionsSet.add(key)
    }

    newSelections.set(currentPlotKey, plotSelectionsSet)
    setPlotSelections(newSelections)
  }

  const handleTogglePlan = (planIdx: number, planLayer: WypisPlanLayer) => {
    const currentPlot = selectedPlots[currentPlotIndex]
    if (!currentPlot) return

    const currentPlotKey = `${currentPlot.plot.precinct}-${currentPlot.plot.number}`
    const planKey = `plan-${planIdx}`
    const newSelections = new Map(plotSelections)
    const plotSelectionsSet = new Set(plotSelections.get(currentPlotKey) || new Set())

    // Check if all destinations in this plan are selected
    const arrangementKeys = planLayer.arrangements?.map((_: any, arrIdx: number) =>
      `plan-${planIdx}-arr-${arrIdx}`
    ) || []
    const purposeKeys = planLayer.purposes?.map((_: any, purposeIdx: number) =>
      `plan-${planIdx}-purpose-${purposeIdx}`
    ) || []
    const allDestKeys = [...arrangementKeys, ...purposeKeys]

    const allSelected = allDestKeys.every(key => plotSelectionsSet.has(key))

    if (allSelected) {
      // Uncheck plan and all destinations
      plotSelectionsSet.delete(planKey)
      allDestKeys.forEach(key => plotSelectionsSet.delete(key))
    } else {
      // Check plan and all destinations
      plotSelectionsSet.add(planKey)
      allDestKeys.forEach(key => plotSelectionsSet.add(key))
    }

    newSelections.set(currentPlotKey, plotSelectionsSet)
    setPlotSelections(newSelections)
  }

  const handleToggleAll = () => {
    const currentPlot = selectedPlots[currentPlotIndex]
    if (!currentPlot) return

    const currentPlotKey = `${currentPlot.plot.precinct}-${currentPlot.plot.number}`
    const newSelections = new Map(plotSelections)
    const currentSelections = plotSelections.get(currentPlotKey) || new Set()
    const plotSelectionsSet = new Set<string>()

    // Check if currently all selected
    const allKeys: string[] = []
    planLayers.forEach((planLayer, planIdx) => {
      allKeys.push(`plan-${planIdx}`)
      planLayer.arrangements?.forEach((_: any, arrIdx: number) => {
        allKeys.push(`plan-${planIdx}-arr-${arrIdx}`)
      })
      planLayer.purposes?.forEach((_: any, purposeIdx: number) => {
        allKeys.push(`plan-${planIdx}-purpose-${purposeIdx}`)
      })
    })

    const allSelected = allKeys.every(key => currentSelections.has(key))

    if (!allSelected) {
      // Select all
      allKeys.forEach(key => plotSelectionsSet.add(key))
    }
    // If all selected, leave plotSelectionsSet empty (uncheck all)

    newSelections.set(currentPlotKey, plotSelectionsSet)
    setPlotSelections(newSelections)
  }

  // Helper to get coverage % from plot_destinations (if exists)
  const getCoverage = (plotIndex: number, planLayerId: string, destinationName: string): string | null => {
    const plot = selectedPlots[plotIndex]
    if (!plot?.plot_destinations) return null

    const planDest = plot.plot_destinations.find(pd => pd.plan_id === planLayerId)
    if (!planDest) return null

    const dest = planDest.destinations?.find(d => d.name === destinationName)
    return dest?.covering || null
  }

  const handleGenerateWypis = async () => {
    console.log('🗺️ Wypis Dialog: Generating wypis with config', {
      selectedConfigId,
      projectName,
      plotsCount: selectedPlots.length,
    })

    // Build plots with selected destinations from step 2
    const plotsWithSelectedDestinations = selectedPlots.map((plotWithDest) => {
      const plotKey = `${plotWithDest.plot.precinct}-${plotWithDest.plot.number}`
      const selections = plotSelections.get(plotKey) || new Set<string>()

      // Build plot_destinations based on selections and configuration
      const plot_destinations = planLayers.map((planLayer, planIdx) => {
        // Only include plan if plan checkbox is selected
        if (!selections.has(`plan-${planIdx}`)) {
          return null
        }

        // Get coverage for this plan layer (if exists in plot_destinations)
        const existingPlanDest = plotWithDest.plot_destinations?.find(pd => pd.plan_id === planLayer.id)
        const planCoverage = existingPlanDest?.covering || '0.0%'

        // Build destinations array with correct order:
        // 1. "ogólne" (general provisions) - FIRST
        // 2. Purposes (SC, SG, SI, etc.) - MIDDLE
        // 3. "końcowe" (final provisions) - LAST
        const destinations = []

        // 1. Add "ogólne" arrangement (case-insensitive)
        planLayer.arrangements?.forEach((arrangement, arrIdx) => {
          if (selections.has(`plan-${planIdx}-arr-${arrIdx}`) &&
              arrangement.name.toLowerCase().includes('ogólne')) {
            destinations.push({
              name: arrangement.name,
              covering: '', // Arrangements don't have coverage %
              includes: true,
            })
          }
        })

        // 2. Add selected purposes (SC, SG, SI, etc.)
        planLayer.purposes?.forEach((purpose, purposeIdx) => {
          if (selections.has(`plan-${planIdx}-purpose-${purposeIdx}`)) {
            const coverage = getCoverage(selectedPlots.indexOf(plotWithDest), planLayer.id, purpose.name) || '0.0%'
            destinations.push({
              name: purpose.name,
              covering: coverage,
              includes: true,
            })
          }
        })

        // 3. Add "końcowe" arrangement (case-insensitive)
        planLayer.arrangements?.forEach((arrangement, arrIdx) => {
          if (selections.has(`plan-${planIdx}-arr-${arrIdx}`) &&
              arrangement.name.toLowerCase().includes('końcowe')) {
            destinations.push({
              name: arrangement.name,
              covering: '', // Arrangements don't have coverage %
              includes: true,
            })
          }
        })

        if (destinations.length === 0) {
          return null // Don't include plan if no destinations selected
        }

        return {
          plan_name: planLayer.name,
          plan_id: planLayer.id,
          covering: planCoverage,
          includes: true,
          destinations,
        }
      }).filter(plan => plan !== null) // Remove null plans

      return {
        ...plotWithDest,
        plot_destinations,
      }
    })

    try {
      const fileBlob = await createWypis({
        project: projectName,
        config_id: selectedConfigId,
        plot: plotsWithSelectedDestinations,
      }).unwrap()

      // Detect file type from Blob MIME type
      const isPDF = fileBlob.type === 'application/pdf'
      const isDOCX = fileBlob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      // Determine file extension
      let extension = '.pdf' // Default
      if (isDOCX) {
        extension = '.docx'
      } else if (isPDF) {
        extension = '.pdf'
      }

      // Download file with correct extension
      const url = window.URL.createObjectURL(fileBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wypis_${plotsWithSelectedDestinations[0].plot.number}_${Date.now()}${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      dispatch(showSuccess(`Wypis został wygenerowany i pobrany (${extension.toUpperCase()})`))

      onClose()
    } catch (error: any) {
      console.error('Error generating wypis:', error)

      // Special handling for 401 (guest users)
      if (error?.status === 401) {
        dispatch(showError('Generowanie wypisu wymaga zalogowania. Zaloguj się aby pobrać plik PDF.'))
      } else {
        dispatch(showError(error?.data?.message || 'Błąd podczas generowania wypisu'))
      }
    }
  }

  const configurations = configurationsData?.data?.config_structure || configurationsData?.data?.configurations || []

  // Only close on mobile when clicking backdrop, on desktop only close via X button
  const handleClose = (_event: any, reason: string) => {
    // Prevent closing when clicking outside on desktop
    if (!isMobile && reason === 'backdropClick') {
      return
    }
    onClose()
  }

  // Get current plot for step 2
  const currentPlot = selectedPlots[currentPlotIndex]
  const currentPlotKey = currentPlot ? `${currentPlot.plot.precinct}-${currentPlot.plot.number}` : ''
  const currentSelections = plotSelections.get(currentPlotKey) || new Set<string>()

  // Check if all destinations are selected (for "Zaznacz wszystkie" button text)
  const allKeys: string[] = []
  planLayers.forEach((planLayer, planIdx) => {
    allKeys.push(`plan-${planIdx}`)
    planLayer.arrangements?.forEach((_: any, arrIdx: number) => {
      allKeys.push(`plan-${planIdx}-arr-${arrIdx}`)
    })
    planLayer.purposes?.forEach((_: any, purposeIdx: number) => {
      allKeys.push(`plan-${planIdx}-purpose-${purposeIdx}`)
    })
  })
  const allSelected = allKeys.length > 0 && allKeys.every(key => currentSelections.has(key))

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={false} // CHANGED: Never fullScreen - allows map interaction on mobile
      hideBackdrop={true} // CHANGED: Always hide backdrop - allows map clicks
      disableEnforceFocus // Allows clicking on map behind dialog
      disableScrollLock // Allows scrolling map behind dialog
      PaperComponent={isMobile ? undefined : DraggablePaper} // Draggable on desktop only
      sx={{
        // CRITICAL: Allow clicks to pass through to map
        pointerEvents: 'none',
      }}
      PaperProps={{
        sx: {
          // CRITICAL: Re-enable pointer events on dialog itself
          pointerEvents: 'auto',
          borderRadius: isMobile ? '12px 12px 0 0' : '12px',
          maxHeight: isMobile ? '60vh' : '80vh',
          // Position dialog
          position: 'fixed',
          ...(isMobile ? {
            // Mobile: Bottom sheet
            bottom: 0,
            left: 0,
            right: 0,
            top: 'auto',
            transform: 'none',
            margin: 0,
            width: '100%',
            maxWidth: '100%',
          } : {
            // Desktop: Top center (draggable)
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            m: 0,
          }),
        }
      }}
    >
      {/* Header - Draggable handle */}
      <DialogTitle
        data-drag-handle // Mark as drag handle
        sx={{
          bgcolor: '#2c3e50',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          cursor: isMobile ? 'default' : 'move', // Move cursor on desktop for drag affordance
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {currentStep === 1 ? 'Generuj wypis i wyrys' : 'Wypis i wyrys'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 3, bgcolor: currentStep === 2 ? '#f5f5f5' : 'inherit' }}>
        {/* STEP 1: Configuration + Plot Selection */}
        {currentStep === 1 && (
          <>
            {isLoadingConfigs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : configurations.length === 0 ? (
              <Alert severity="warning">
                <Typography variant="body2">
                  Brak konfiguracji wypisu. Utwórz konfigurację przed generowaniem wypisu.
                </Typography>
              </Alert>
            ) : (
              <>
                {/* Configuration selector */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Wybierz konfigurację</InputLabel>
                  <Select
                    value={selectedConfigId || ''}
                    onChange={(e) => {
                      console.log('🗺️ Wypis Dialog: Config changed', {
                        oldConfigId: selectedConfigId,
                        newConfigId: e.target.value,
                        clearingPlots: selectedPlots.length > 0,
                      })

                      // CRITICAL: Clear selected plots when changing config
                      // because plots were fetched with old config's layer/column names
                      if (selectedPlots.length > 0) {
                        dispatch(clearPlotSelection())
                        dispatch(showSuccess('Zmieniono konfigurację - wybierz działki ponownie'))
                        console.log('🗺️ Wypis Dialog: Cleared plots due to config change')
                      }

                      dispatch(setSelectedConfigId(e.target.value))
                    }}
                    label="Wybierz konfigurację"
                  >
                    {configurations.map(config => (
                      <MenuItem key={config.id || config.config_id} value={config.id || config.config_id}>
                        {config.name || config.configuration_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Selected plots display */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Wybrane działki:
                </Typography>

                {selectedPlots.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Brak wybranych działek. Kliknij na mapę, aby wybrać działkę z warstwy.
                    </Typography>
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    {selectedPlots.map((plotWithDest, index) => (
                      <Box
                        key={`${plotWithDest.plot.precinct}-${plotWithDest.plot.number}-${index}`}
                        sx={{
                          width: '100%',
                          m: 0,
                          py: 1,
                          px: 1.5,
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          bgcolor: '#f9f9f9',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Obręb: {plotWithDest.plot.precinct}, Działka: {plotWithDest.plot.number}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemovePlot(plotWithDest.plot)}
                          >
                            Usuń
                          </Button>
                        </Box>
                        {plotWithDest.plot_destinations.length > 0 && (
                          <Box sx={{ pl: 1, borderLeft: '2px solid #2c3e50' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              Przeznaczenie:
                            </Typography>
                            {plotWithDest.plot_destinations.map((dest, idx) => (
                              <Typography key={idx} variant="caption" sx={{ display: 'block', pl: 1 }}>
                                • {dest.plan_id} (pokrycie: {dest.covering})
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Selected count */}
                {selectedPlots.length > 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Wybrano <strong>{selectedPlots.length}</strong> {selectedPlots.length === 1 ? 'działkę' : 'działek'}
                    </Typography>
                  </Alert>
                )}
              </>
            )}
          </>
        )}

        {/* STEP 2: Destination Selection */}
        {currentStep === 2 && currentPlot && (
          <>
            {isLoadingConfigDetails ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Instructions */}
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Wybierz z listy dostępnych przeznaczeń te, na podstawie których ma zostać wygenerowany wypis
                </Typography>

                {/* Plot navigation */}
                {selectedPlots.length > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <IconButton
                      onClick={handlePrevPlot}
                      disabled={currentPlotIndex === 0}
                      sx={{ color: '#2c3e50' }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <Box sx={{ mx: 2, textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Numer działki: {currentPlot.plot.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Obręb działki: {currentPlot.plot.precinct}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={handleNextPlot}
                      disabled={currentPlotIndex === selectedPlots.length - 1}
                      sx={{ color: '#2c3e50' }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                )}

                {selectedPlots.length === 1 && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Numer działki: {currentPlot.plot.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Obręb działki: {currentPlot.plot.precinct}
                    </Typography>
                  </Box>
                )}

                {/* "Zaznacz wszystkie" button */}
                <Box sx={{ mb: 2, textAlign: 'right' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleToggleAll}
                    sx={{
                      borderColor: '#2c3e50',
                      color: '#2c3e50',
                      '&:hover': {
                        borderColor: '#27ae60',
                        bgcolor: 'rgba(39, 174, 96, 0.1)',
                      },
                    }}
                  >
                    {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                  </Button>
                </Box>

                {/* Destinations list - ALL from configuration */}
                <Box sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}>
                  {planLayers.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Brak dostępnych warstw planistycznych w konfiguracji
                    </Typography>
                  )}

                  {planLayers.map((planLayer, planIdx) => {
                    const planKey = `plan-${planIdx}`
                    const isPlanChecked = currentSelections.has(planKey)

                    // Get coverage for this plan (if exists in plot_destinations)
                    const existingPlanDest = currentPlot.plot_destinations?.find(pd => pd.plan_id === planLayer.id)
                    const planCoverage = existingPlanDest?.covering || '0.0%'

                    return (
                      <Box key={planIdx} sx={{ mb: 2 }}>
                        {/* Plan header checkbox */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isPlanChecked}
                              onChange={() => handleTogglePlan(planIdx, planLayer)}
                              sx={{
                                color: '#2c3e50',
                                '&.Mui-checked': { color: '#27ae60' }
                              }}
                            />
                          }
                          label={
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {planLayer.name} - przeznaczenie terenu ({planCoverage})
                            </Typography>
                          }
                          sx={{
                            width: '100%',
                            bgcolor: '#e3f2fd',
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            mb: 1,
                          }}
                        />

                        {/* Destinations (arrangements + purposes) */}
                        <Box sx={{ pl: 4 }}>
                          {/* Arrangements (Ustalenia ogólne, etc.) */}
                          {planLayer.arrangements?.map((arrangement, arrIdx) => {
                            const arrKey = `plan-${planIdx}-arr-${arrIdx}`
                            const isArrChecked = currentSelections.has(arrKey)

                            return (
                              <FormControlLabel
                                key={`arr-${arrIdx}`}
                                control={
                                  <Checkbox
                                    checked={isArrChecked}
                                    onChange={() => handleToggleDestination(arrKey)}
                                    sx={{
                                      color: '#2c3e50',
                                      '&.Mui-checked': { color: '#27ae60' }
                                    }}
                                  />
                                }
                                label={
                                  <Typography variant="body2">
                                    {arrangement.name}
                                  </Typography>
                                }
                                sx={{ width: '100%', py: 0.5 }}
                              />
                            )
                          })}

                          {/* Purposes (ZL, SO, etc.) */}
                          {planLayer.purposes?.map((purpose, purposeIdx) => {
                            const purposeKey = `plan-${planIdx}-purpose-${purposeIdx}`
                            const isPurposeChecked = currentSelections.has(purposeKey)
                            const coverage = getCoverage(currentPlotIndex, planLayer.id, purpose.name)

                            return (
                              <FormControlLabel
                                key={`purpose-${purposeIdx}`}
                                control={
                                  <Checkbox
                                    checked={isPurposeChecked}
                                    onChange={() => handleToggleDestination(purposeKey)}
                                    sx={{
                                      color: '#2c3e50',
                                      '&.Mui-checked': { color: '#27ae60' }
                                    }}
                                  />
                                }
                                label={
                                  <Typography variant="body2">
                                    {purpose.name} {coverage && `(${coverage})`}
                                  </Typography>
                                }
                                sx={{ width: '100%', py: 0.5 }}
                              />
                            )
                          })}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 2, bgcolor: currentStep === 2 ? '#f5f5f5' : 'inherit' }}>
        {/* STEP 1 Buttons */}
        {currentStep === 1 && (
          <>
            <Button onClick={onClose} variant="outlined">
              Anuluj
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={isGenerating || !selectedConfigId || selectedPlots.length === 0 || configurations.length === 0}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <DescriptionIcon />}
              sx={{
                bgcolor: '#27ae60',
                '&:hover': {
                  bgcolor: '#229954',
                },
              }}
            >
              {isGenerating ? 'Generowanie...' : 'Dalej'}
            </Button>
          </>
        )}

        {/* STEP 2 Buttons */}
        {currentStep === 2 && (
          <>
            <Button onClick={handleBack} variant="outlined">
              Wstecz
            </Button>
            <Button
              onClick={handleGenerateWypis}
              variant="contained"
              disabled={isGenerating || isLoadingConfigDetails}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <DescriptionIcon />}
              sx={{
                bgcolor: '#27ae60',
                '&:hover': {
                  bgcolor: '#229954',
                },
              }}
            >
              {isGenerating ? 'Generowanie...' : 'Generuj'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default WypisGenerateDialog
