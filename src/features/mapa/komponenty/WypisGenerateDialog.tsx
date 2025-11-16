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

import { useGetWypisConfigurationQuery, useCreateWypisMutation } from '@/backend/wypis'
import type { WypisPlot } from '@/backend/types'
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
 * WypisGenerateDialog - Draggable dialog for generating wypis PDF
 *
 * Features:
 * - Draggable window (non-blocking, can interact with map)
 * - Select configuration from list
 * - Select plots (parcels) by clicking on map
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

  const [createWypis, { isLoading: isGenerating }] = useCreateWypisMutation()

  // Auto-select first config when loaded
  useEffect(() => {
    const configs = configurationsData?.data?.config_structure || configurationsData?.data?.configurations || []
    console.log('🗺️ Wypis Dialog: Auto-select effect', {
      hasConfigs: configs.length > 0,
      configsCount: configs.length,
      selectedConfigId,
      firstConfigId: configs[0]?.id || configs[0]?.config_id,
      willAutoSelect: configs.length > 0 && !selectedConfigId,
    })

    if (configs.length > 0 && !selectedConfigId) {
      // Backend returns {id, name} not {config_id, configuration_name}
      const firstConfig = configs[0]
      const configIdToSet = firstConfig.id || firstConfig.config_id
      console.log('🗺️ Wypis Dialog: Auto-selecting config', configIdToSet)
      dispatch(setSelectedConfigId(configIdToSet))
    }
  }, [configurationsData, selectedConfigId, dispatch])

  // Clear selection on close
  useEffect(() => {
    if (!open) {
      dispatch(clearPlotSelection())
      dispatch(setSelectedConfigId(null))
    }
  }, [open, dispatch])

  const handleRemovePlot = (plot: WypisPlot) => {
    dispatch(removePlot(plot))
  }

  const handleGenerate = async () => {
    if (!selectedConfigId) {
      dispatch(showError({ message: 'Wybierz konfigurację' }))
      return
    }

    if (selectedPlots.length === 0) {
      dispatch(showError({ message: 'Wybierz przynajmniej jedną działkę' }))
      return
    }

    try {
      const fileBlob = await createWypis({
        project: projectName,
        config_id: selectedConfigId,
        plot: selectedPlots,
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
      a.download = `wypis_${selectedPlots[0].plot.number}_${Date.now()}${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      dispatch(showSuccess({
        message: `Wypis został wygenerowany i pobrany (${extension.toUpperCase()})`,
      }))

      onClose()
    } catch (error: any) {
      console.error('Error generating wypis:', error)

      // Special handling for 401 (guest users)
      if (error?.status === 401) {
        dispatch(showError({
          message: 'Generowanie wypisu wymaga zalogowania. Zaloguj się aby pobrać plik PDF.',
        }))
      } else {
        dispatch(showError({
          message: error?.data?.message || 'Błąd podczas generowania wypisu',
        }))
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
            Generuj wypis i wyrys
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
      <DialogContent sx={{ px: 3, py: 3 }}>
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
                onChange={(e) => dispatch(setSelectedConfigId(e.target.value))}
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
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Anuluj
        </Button>
        <Button
          onClick={handleGenerate}
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
          {isGenerating ? 'Generowanie...' : 'Generuj wypis'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WypisGenerateDialog
