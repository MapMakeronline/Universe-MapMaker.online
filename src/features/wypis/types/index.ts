/**
 * TypeScript types for Wypis Configuration Wizard
 *
 * These types define the structure of wypis configuration state
 * used across the step-by-step wizard.
 */

/**
 * Plot layer configuration (Warstwa działek)
 * Defines which layer contains land plots and column names
 */
export interface PlotLayerConfig {
  /** Layer ID (from QGIS project) */
  id: string
  /** Display name of the layer */
  name: string
  /** Column name containing precinct/obręb (e.g., "NAZWA_OBRE") */
  precinctColumn: string
  /** Column name containing plot number (e.g., "NUMER_DZIA") */
  plotNumberColumn: string
}

/**
 * Purpose/destination configuration (Przeznaczenie planistyczne)
 * Represents a single land use purpose from planning zone
 */
export interface PurposeConfig {
  /** Purpose name/symbol (e.g., "SC", "SG", "MW") */
  name: string
  /** Associated DOCX file for this purpose (optional) */
  file?: File | null
  /** File name from existing config (for editing) */
  fileName?: string
}

/**
 * Arrangement configuration (Ustalenia ogólne/końcowe)
 * Represents general/final provisions document
 */
export interface ArrangementConfig {
  /** Arrangement name (e.g., "Ustalenia ogólne", "Dokument formalny") */
  name: string
  /** Associated DOCX file for this arrangement (optional) */
  file?: File | null
  /** File name from existing config (for editing) */
  fileName?: string
}

/**
 * Plan layer configuration (Warstwa planistyczna)
 * Defines a planning zone layer with purposes and arrangements
 */
export interface PlanLayerConfig {
  /** Layer ID (from QGIS project) */
  id: string
  /** Display name of the layer */
  name: string
  /** Column name containing purpose symbols (e.g., "symbol", "przeznaczenie") */
  purposeColumn: string
  /** List of purposes (land use types) */
  purposes: PurposeConfig[]
  /** List of arrangements (general/final provisions) */
  arrangements: ArrangementConfig[]
  /** Whether this layer is enabled in configuration */
  enabled: boolean
  /** Display order position (1-based index for sorting) */
  position: number | null
  /** UI state: whether accordion is expanded */
  expanded?: boolean
}

/**
 * Complete wypis configuration state
 * Used throughout the wizard to manage configuration data
 */
export interface WypisConfigState {
  /** Configuration name (user-defined) */
  name: string
  /** Plot layer configuration (Step 1) */
  plotsLayer: PlotLayerConfig
  /** Plan layers configuration (Step 2) */
  planLayers: PlanLayerConfig[]
  /** Additional documents mapped by destination name (Step 3) */
  documents: Map<string, File>
}

/**
 * Validation errors for each wizard step
 */
export interface WypisConfigValidation {
  step1: string[]
  step2: string[]
  step3: string[]
}

/**
 * Hook return type for useWypisConfig
 */
export interface UseWypisConfigReturn {
  /** Save configuration to backend */
  saveConfiguration: (config: WypisConfigState) => Promise<SaveConfigurationResult>
  /** Whether save operation is in progress */
  isLoading: boolean
  /** Error from save operation (if any) */
  error: any | null
  /** Validate configuration for specific step */
  validateStep: (step: 1 | 2 | 3, config: WypisConfigState) => string[]
  /** Check if can proceed to next step */
  canProceed: (step: 1 | 2 | 3, config: WypisConfigState) => boolean
}

/**
 * Result from saveConfiguration operation
 */
export interface SaveConfigurationResult {
  success: boolean
  config_id: string
  message?: string
}
