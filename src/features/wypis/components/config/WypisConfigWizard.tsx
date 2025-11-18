/**
 * WypisConfigWizard - Main orchestrator for wypis configuration
 *
 * 3-step wizard for creating/editing wypis configuration:
 * - Step 1: Basic Settings (name, plots layer, columns)
 * - Step 2: Plan Layers (select plan layers, purpose columns, ordering)
 * - Step 3: Documents (upload DOCX files - optional)
 *
 * Features:
 * - Step-by-step navigation (Wstecz/Dalej/Zapisz)
 * - Per-step validation
 * - Progress indicator
 * - State management for entire configuration
 * - Integration with useWypisConfig hook
 */

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SaveIcon from '@mui/icons-material/Save'

import { useWypisConfig } from '../../hooks'
import { useGetWypisConfigurationQuery } from '@/backend/wypis'
import type { WypisConfigState, PlanLayerConfig } from '../../types'
import Step1BasicSettings from './Step1BasicSettings'
import Step2PlanLayers from './Step2PlanLayers'
import Step3Documents from './Step3Documents'

interface Layer {
  id: string
  name: string
  type: 'vector' | 'raster'
}

interface WypisConfigWizardProps {
  /** Dialog open state */
  open: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** Project name */
  projectName: string
  /** Config ID (null for new config, string for editing) */
  configId?: string | null
  /** Available layers from QGIS project */
  projectLayers: Layer[]
}

/**
 * WypisConfigWizard - 3-step configuration wizard
 *
 * Navigation flow:
 * Step 1 → [Dalej] → Step 2 → [Dalej] → Step 3 → [Zapisz]
 * Step 2 → [Wstecz] → Step 1
 * Step 3 → [Wstecz] → Step 2
 */
const WypisConfigWizard: React.FC<WypisConfigWizardProps> = ({
  open,
  onClose,
  projectName,
  configId,
  projectLayers,
}) => {
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Configuration state
  const [config, setConfig] = useState<WypisConfigState>({
    name: '',
    plotsLayer: {
      id: '',
      name: '',
      precinctColumn: '',
      plotNumberColumn: '',
    },
    planLayers: [],
    documents: new Map(),
  })

  // Fetch existing configuration (if editing)
  const { data: existingConfigData, isLoading: isLoadingConfig } = useGetWypisConfigurationQuery(
    { project: projectName, config_id: configId || '' },
    { skip: !configId || !open }
  )

  // Load existing configuration into state (if editing)
  useEffect(() => {
    if (configId && existingConfigData?.data && open) {
      const existingConfig = existingConfigData.data
      console.log('📥 Loading existing wypis configuration:', existingConfig)

      setConfig({
        name: existingConfig.configuration_name || '',
        plotsLayer: {
          id: existingConfig.plotsLayer || '',
          name: existingConfig.plotsLayerName || '',
          precinctColumn: existingConfig.precinctColumn || '',
          plotNumberColumn: existingConfig.plotNumberColumn || '',
        },
        planLayers: existingConfig.planLayers?.map((pl: any) => ({
          id: pl.id,
          name: pl.name,
          purposeColumn: pl.purposeColumn || '',
          purposes: pl.purposes || [],
          arrangements: pl.arrangements || [],
          enabled: true, // Existing layers are enabled
          position: null, // Will be auto-assigned
          expanded: false,
        })) || [],
        documents: new Map(), // Documents loaded separately
      })
    }
  }, [configId, existingConfigData, open])

  // Initialize plan layers from project layers (on mount for NEW config)
  useEffect(() => {
    if (!configId && projectLayers.length > 0 && config.planLayers.length === 0) {
      const initialPlanLayers: PlanLayerConfig[] = projectLayers
        .filter(layer => layer.type === 'vector')
        .map(layer => ({
          id: layer.id,
          name: layer.name,
          purposeColumn: '',
          purposes: [],
          arrangements: [],
          enabled: true, // Always enabled (no checkbox)
          position: null, // Not used (no position field)
          expanded: false,
        }))

      setConfig(prev => ({ ...prev, planLayers: initialPlanLayers }))
    }
  }, [configId, projectLayers, config.planLayers.length])

  // Use business logic hook
  const { saveConfiguration, isLoading, validateStep, canProceed } = useWypisConfig(
    projectName,
    configId || null
  )

  // Handle configuration updates (generic)
  const handleConfigUpdate = (updates: Partial<WypisConfigState>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Handle plots layer updates (Step 1)
  const handlePlotsLayerUpdate = (updates: { name?: string; plotsLayer?: Partial<typeof config.plotsLayer> }) => {
    if (updates.name !== undefined) {
      setConfig(prev => ({ ...prev, name: updates.name! }))
    }
    if (updates.plotsLayer) {
      setConfig(prev => ({
        ...prev,
        plotsLayer: { ...prev.plotsLayer, ...updates.plotsLayer },
      }))
    }
  }

  // Handle plan layers updates (Step 2)
  const handlePlanLayersUpdate = (planLayers: PlanLayerConfig[]) => {
    setConfig(prev => ({ ...prev, planLayers }))
  }

  // Handle documents updates (Step 3)
  const handleDocumentsUpdate = (documents: Map<string, File>) => {
    setConfig(prev => ({ ...prev, documents }))
  }

  // Navigation: Go to next step
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)
    }
  }

  // Navigation: Go to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  // Save configuration
  const handleSave = async () => {
    const result = await saveConfiguration(config)
    if (result.success) {
      onClose()
    }
  }

  // Reset state on close
  const handleClose = () => {
    setCurrentStep(1)
    setConfig({
      name: '',
      plotsLayer: { id: '', name: '', precinctColumn: '', plotNumberColumn: '' },
      planLayers: [],
      documents: new Map(),
    })
    onClose()
  }

  // Validation errors for current step
  const currentStepErrors = validateStep(currentStep, config)

  // Can proceed to next step
  const canGoNext = canProceed(currentStep, config)

  // Steps configuration for Stepper
  const steps = [
    { label: 'Działki', description: 'Warstwa i kolumny' },
    { label: 'Plany', description: 'Warstwy planistyczne' },
    { label: 'Dokumenty', description: 'Pliki DOCX (opcjonalne)' },
  ]

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {configId ? 'Edytuj konfigurację wypisu' : 'Nowa konfiguracja wypisu'}
          </Typography>
          <IconButton onClick={handleClose} size="small" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={currentStep - 1} sx={{ mt: 2 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        {/* Loading state when fetching existing config */}
        {isLoadingConfig && configId && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Wczytuję konfigurację...
            </Typography>
          </Box>
        )}

        {/* Step 1 */}
        {!isLoadingConfig && currentStep === 1 && (
          <Step1BasicSettings
            projectName={projectName}
            projectLayers={projectLayers}
            configName={config.name}
            plotsLayer={config.plotsLayer}
            onChange={handlePlotsLayerUpdate}
            errors={currentStepErrors}
          />
        )}

        {/* Step 2 */}
        {!isLoadingConfig && currentStep === 2 && (
          <Step2PlanLayers
            projectName={projectName}
            projectLayers={projectLayers}
            planLayers={config.planLayers}
            onChange={handlePlanLayersUpdate}
            errors={currentStepErrors}
          />
        )}

        {/* Step 3 */}
        {!isLoadingConfig && currentStep === 3 && (
          <Step3Documents
            projectName={projectName}
            configId={configId || 'temp'} // Use 'temp' for new configs
            planLayers={config.planLayers}
            documents={config.documents}
            onChange={handleDocumentsUpdate}
            errors={currentStepErrors}
          />
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        {/* Left: Back button (Step 2 & 3) */}
        <Box>
          {currentStep > 1 && (
            <Button
              onClick={handleBack}
              startIcon={<ChevronLeftIcon />}
              disabled={isLoading}
            >
              Wstecz
            </Button>
          )}
        </Box>

        {/* Right: Cancel + Next/Save */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Anuluj
          </Button>

          {/* Next button (Step 1 & 2) */}
          {currentStep < 3 && (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<ChevronRightIcon />}
              disabled={!canGoNext || isLoading}
            >
              Dalej
            </Button>
          )}

          {/* Save button (Step 3) */}
          {currentStep === 3 && (
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={isLoading}
              sx={{
                bgcolor: '#27ae60',
                '&:hover': {
                  bgcolor: '#229954',
                },
              }}
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz konfigurację'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default WypisConfigWizard
