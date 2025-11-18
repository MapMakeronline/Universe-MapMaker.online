/**
 * useWypisConfig - Business logic hook for Wypis configuration
 *
 * Handles:
 * - Configuration validation (per step)
 * - Saving configuration to backend (RTK Query)
 * - ZIP file creation for DOCX documents
 * - Error handling and loading states
 *
 * Usage:
 * ```tsx
 * const { saveConfiguration, isLoading, validateStep, canProceed } = useWypisConfig(projectName, configId)
 * ```
 */

import { useState } from 'react'
import JSZip from 'jszip'
import { useAppDispatch } from '@/redux/hooks'
import { showSuccess, showError } from '@/redux/slices/notificationSlice'
import {
  useAddWypisConfigurationMutation,
  useAddWypisDocumentsMutation,
} from '@/backend/wypis'
import type {
  WypisConfigState,
  UseWypisConfigReturn,
  SaveConfigurationResult,
  PlanLayerConfig,
} from '../types'

/**
 * Hook for managing wypis configuration business logic
 *
 * @param projectName - QGIS project name
 * @param configId - Optional config ID (for editing existing config)
 * @returns Hook methods and state
 */
export function useWypisConfig(
  projectName: string,
  configId?: string | null
): UseWypisConfigReturn {
  const dispatch = useAppDispatch()
  const [addConfiguration, { isLoading: isSavingConfig }] = useAddWypisConfigurationMutation()
  const [addDocuments, { isLoading: isUploadingDocs }] = useAddWypisDocumentsMutation()
  const [customError, setCustomError] = useState<any>(null)

  /**
   * Validate Step 1: Basic Settings
   * Required: name, plots layer, precinct column, plot number column
   */
  const validateStep1 = (config: WypisConfigState): string[] => {
    const errors: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Podaj nazwę konfiguracji')
    }

    if (!config.plotsLayer.id) {
      errors.push('Wybierz warstwę działek')
    }

    if (!config.plotsLayer.precinctColumn) {
      errors.push('Wybierz kolumnę z obrębami')
    }

    if (!config.plotsLayer.plotNumberColumn) {
      errors.push('Wybierz kolumnę z numerami działek')
    }

    return errors
  }

  /**
   * Validate Step 2: Plan Layers
   * Required: at least one plan layer with purpose column selected
   * (purposes array can be empty - it's loaded from backend after purposeColumn selection)
   */
  const validateStep2 = (config: WypisConfigState): string[] => {
    const errors: string[] = []

    // Filter layers with purposeColumn configured (purposes can be empty!)
    const configuredLayers = config.planLayers.filter(l => l.purposeColumn)

    if (configuredLayers.length === 0) {
      errors.push('Wybierz przynajmniej jedną warstwę planistyczną (kolumnę z symbolami przeznaczenia)')
    }

    return errors
  }

  /**
   * Validate Step 3: Documents
   * Optional step - documents can be uploaded later via bulk upload
   */
  const validateStep3 = (config: WypisConfigState): string[] => {
    const errors: string[] = []

    // Step 3 is optional - user can upload documents later
    // Just warn if no documents are provided

    const totalDestinations = config.planLayers
      .filter(l => l.enabled)
      .reduce((sum, layer) => {
        return sum + (layer.purposes.length || 0) + (layer.arrangements.length || 0)
      }, 0)

    const documentsUploaded = config.documents.size

    if (totalDestinations > 0 && documentsUploaded === 0) {
      // This is a warning, not an error
      // errors.push(`Nie dodano żadnych plików DOCX (${totalDestinations} przeznaczeo wymaga dokumentów)`)
    }

    return errors
  }

  /**
   * Validate specific step
   */
  const validateStep = (step: 1 | 2 | 3, config: WypisConfigState): string[] => {
    switch (step) {
      case 1:
        return validateStep1(config)
      case 2:
        return validateStep2(config)
      case 3:
        return validateStep3(config)
      default:
        return []
    }
  }

  /**
   * Check if can proceed to next step (no validation errors)
   */
  const canProceed = (step: 1 | 2 | 3, config: WypisConfigState): boolean => {
    const errors = validateStep(step, config)
    return errors.length === 0
  }

  /**
   * Create ZIP file with DOCX documents for initial configuration
   *
   * Structure:
   * wypis.zip
   * ├── plan_layer_id_1/
   * │   ├── dokument_formalny.docx
   * │   ├── ustalenia_ogolne.docx
   * │   └── SC.docx
   * └── plan_layer_id_2/
   *     └── ...
   */
  const createConfigZip = async (config: WypisConfigState): Promise<File> => {
    const zip = new JSZip()

    // Group documents by plan layer
    config.planLayers
      .filter(layer => layer.enabled)
      .forEach(layer => {
        // Add arrangements (general/final provisions)
        layer.arrangements.forEach(arrangement => {
          if (arrangement.file) {
            zip.file(`${layer.id}/${arrangement.name}.docx`, arrangement.file)
          }
        })

        // Add purposes (land use types)
        layer.purposes.forEach(purpose => {
          if (purpose.file) {
            zip.file(`${layer.id}/${purpose.name}.docx`, purpose.file)
          }
        })
      })

    // Generate ZIP as blob
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // Convert to File object
    return new File([zipBlob], 'wypis.zip', { type: 'application/zip' })
  }

  /**
   * Create ZIP file with additional documents (for Step 3)
   * Uses Map<destinationName, File> from config.documents
   *
   * Structure:
   * wypis.zip
   * ├── plan_layer_id/
   * │   ├── SC.docx
   * │   └── MW.docx
   */
  const createAdditionalDocumentsZip = async (
    config: WypisConfigState,
    planLayers: PlanLayerConfig[]
  ): Promise<File> => {
    const zip = new JSZip()

    // Map destination names to plan layer IDs
    config.documents.forEach((file, destinationName) => {
      // Find which plan layer this destination belongs to
      const planLayer = planLayers.find(layer =>
        layer.purposes.some(p => p.name === destinationName) ||
        layer.arrangements.some(a => a.name === destinationName)
      )

      if (planLayer) {
        zip.file(`${planLayer.id}/${destinationName}.docx`, file)
      } else {
        console.warn(`⚠️ Could not find plan layer for destination: ${destinationName}`)
      }
    })

    // Generate ZIP as blob
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // Convert to File object
    return new File([zipBlob], 'wypis.zip', { type: 'application/zip' })
  }

  /**
   * Build configuration JSON for backend
   * Matches backend expected structure from documentation
   */
  const buildConfigurationJSON = (config: WypisConfigState): string => {
    const configObject = {
      configuration_name: config.name,
      plotsLayer: config.plotsLayer.id,
      plotsLayerName: config.plotsLayer.name,
      precinctColumn: config.plotsLayer.precinctColumn,
      plotNumberColumn: config.plotsLayer.plotNumberColumn,
      planLayers: config.planLayers
        .filter(layer => layer.enabled)
        .sort((a, b) => (a.position || 0) - (b.position || 0)) // Sort by position
        .map(layer => ({
          id: layer.id,
          name: layer.name,
          purposeColumn: layer.purposeColumn,
          purposes: layer.purposes.map(p => ({
            name: p.name,
            fileName: p.fileName || `${p.name}.docx`,
          })),
          arrangements: layer.arrangements.map(a => ({
            name: a.name,
            fileName: a.fileName || `${a.name}.docx`,
          })),
        })),
    }

    return JSON.stringify(configObject)
  }

  /**
   * Save configuration to backend
   *
   * Steps:
   * 1. Validate all steps
   * 2. Create ZIP with initial DOCX files (from plan layers)
   * 3. Call addWypisConfiguration endpoint (multipart/form-data)
   * 4. If additional documents exist (config.documents), call addWypisDocuments
   * 5. Show success/error notification
   */
  const saveConfiguration = async (
    config: WypisConfigState
  ): Promise<SaveConfigurationResult> => {
    try {
      setCustomError(null)

      // Validate all steps
      const step1Errors = validateStep1(config)
      const step2Errors = validateStep2(config)
      const step3Errors = validateStep3(config)

      const allErrors = [...step1Errors, ...step2Errors, ...step3Errors]

      if (allErrors.length > 0) {
        const errorMessage = `Błędy walidacji:\n${allErrors.join('\n')}`
        setCustomError(errorMessage)
        dispatch(showError(errorMessage))
        return { success: false, config_id: '', message: errorMessage }
      }

      // Step 1: Create ZIP with initial DOCX files
      const extractFilesZip = await createConfigZip(config)

      // Step 2: Build configuration JSON (must be stringified!)
      const configurationJSON = buildConfigurationJSON(config)

      console.log('💾 Saving wypis configuration:', {
        project: projectName,
        config_id: configId,
        configuration: JSON.parse(configurationJSON),
        zipSize: extractFilesZip.size,
      })

      // Step 3: Call backend endpoint - Add/Update Configuration
      const response = await addConfiguration({
        project: projectName,
        config_id: configId || undefined,
        configuration: configurationJSON,
        extractFiles: extractFilesZip,
      }).unwrap()

      console.log('✅ Configuration saved:', response)

      // Step 4: Upload additional documents (if any)
      if (config.documents.size > 0) {
        console.log(`📤 Uploading ${config.documents.size} additional documents...`)

        const additionalDocsZip = await createAdditionalDocumentsZip(
          config,
          config.planLayers.filter(l => l.enabled)
        )

        await addDocuments({
          project: projectName,
          config_id: response.config_id,
          wypis: additionalDocsZip,
        }).unwrap()

        console.log('✅ Additional documents uploaded')
      }

      // Success notification
      const successMessage = configId
        ? 'Konfiguracja wypisu została zaktualizowana'
        : 'Konfiguracja wypisu została utworzona'

      dispatch(showSuccess(successMessage))

      return {
        success: true,
        config_id: response.config_id,
        message: successMessage,
      }
    } catch (error: any) {
      console.error('❌ Error saving configuration:', error)

      const errorMessage = error?.data?.message || 'Błąd podczas zapisywania konfiguracji'
      setCustomError(error)
      dispatch(showError(errorMessage))

      return {
        success: false,
        config_id: '',
        message: errorMessage,
      }
    }
  }

  return {
    saveConfiguration,
    isLoading: isSavingConfig || isUploadingDocs,
    error: customError,
    validateStep,
    canProceed,
  }
}
