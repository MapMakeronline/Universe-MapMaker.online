"use client"

import React, { useState, useEffect } from 'react'
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
 * WypisGenerateDialog - Dialog for generating wypis PDF
 *
 * Features:
 * - Select configuration from list
 * - Select plots (parcels) with checkboxes
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
    const configs = configurationsData?.config_structure || configurationsData?.configurations || []
    if (configs.length > 0 && !selectedConfigId) {
      // Backend returns {id, name} not {config_id, configuration_name}
      const firstConfig = configs[0]
      dispatch(setSelectedConfigId(firstConfig.id || firstConfig.config_id))
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
      const pdfBlob = await createWypis({
        project: projectName,
        config_id: selectedConfigId,
        plot: selectedPlots,
      }).unwrap()

      // Download PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wypis_${selectedPlots[0].plot.number}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      dispatch(showSuccess({
        message: 'Wypis został wygenerowany i pobrany',
      }))

      onClose()
    } catch (error: any) {
      console.error('Error generating wypis:', error)
      dispatch(showError({
        message: error?.data?.message || 'Błąd podczas generowania wypisu',
      }))
    }
  }

  const configurations = configurationsData?.config_structure || configurationsData?.configurations || []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '12px',
          maxHeight: '80vh',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#2c3e50',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
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
