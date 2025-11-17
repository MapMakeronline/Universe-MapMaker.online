/**
 * Step3Documents - Krok 3 wizard'a konfiguracji wypisu
 *
 * Features:
 * - Przycisk "Masowy upload" → opens WypisBulkUploadModal
 * - Lista wszystkich przeznaczeo (purposes + arrangements)
 * - Status: uploaded / missing
 * - Optional step - dokumenty można przesłać później
 *
 * Note: This step delegates file upload to WypisBulkUploadModal
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import InfoIcon from '@mui/icons-material/Info'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import DescriptionIcon from '@mui/icons-material/Description'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'

import type { PlanLayerConfig } from '../../types'
import WypisBulkUploadModal from '../WypisBulkUploadModal'

interface Step3DocumentsProps {
  /** Project name */
  projectName: string
  /** Config ID (for uploading additional documents) */
  configId: string
  /** Plan layers from Step 2 (to show all destinations) */
  planLayers: PlanLayerConfig[]
  /** Additional documents uploaded in this step */
  documents: Map<string, File>
  /** Callback when documents change */
  onChange: (documents: Map<string, File>) => void
  /** Validation errors from parent */
  errors?: string[]
}

/**
 * Step 3: Documents - Upload plików DOCX
 *
 * User flow:
 * 1. Click "Masowy upload" button
 * 2. WypisBulkUploadModal opens with all destinations
 * 3. User uploads ZIP or individual files
 * 4. Modal auto-matches files to destinations
 * 5. Click "Zapisz konfigurację" (this step is optional)
 *
 * Note: Documents can also be uploaded later via dashboard
 */
const Step3Documents: React.FC<Step3DocumentsProps> = ({
  projectName,
  configId,
  planLayers,
  documents,
  onChange,
  errors = [],
}) => {
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false)

  // Build list of all destinations (purposes + arrangements) from plan layers
  const allDestinations = planLayers
    .filter(layer => layer.enabled)
    .flatMap(layer => {
      const purposes = layer.purposes.map(p => ({
        planLayerName: layer.name,
        planLayerId: layer.id,
        destinationType: 'purpose' as const,
        destinationName: p.name,
        fileName: p.fileName,
        file: p.file,
      }))

      const arrangements = (layer.arrangements || []).map(a => ({
        planLayerName: layer.name,
        planLayerId: layer.id,
        destinationType: 'arrangement' as const,
        destinationName: a.name,
        fileName: a.fileName,
        file: a.file,
      }))

      return [...arrangements, ...purposes]  // Arrangements first (as per backend order)
    })

  // Check which destinations have files
  const destinationsWithFiles = allDestinations.filter(
    dest => dest.file || documents.has(dest.destinationName)
  )

  // Stats
  const totalDestinations = allDestinations.length
  const uploadedCount = destinationsWithFiles.length
  const missingCount = totalDestinations - uploadedCount

  // Handle bulk upload modal close
  const handleBulkUploadComplete = () => {
    setBulkUploadModalOpen(false)
    // TODO: Reload plan layers to get updated file info
    // For now, WypisBulkUploadModal handles upload directly to backend
  }

  // Transform plan layers to format expected by WypisBulkUploadModal
  const bulkUploadPlanLayers = planLayers
    .filter(layer => layer.enabled)
    .map(layer => ({
      id: layer.id,
      name: layer.name,
      arrangements: layer.arrangements,
      purposes: layer.purposes,
    }))

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Krok 3: Dokumenty DOCX (opcjonalny)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Prześlij pliki DOCX dla wszystkich przeznaczeo. Możesz to zrobić teraz lub później.
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOpenIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Status plików
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${uploadedCount} / ${totalDestinations}`}
              color={uploadedCount === totalDestinations ? 'success' : 'warning'}
              size="small"
              icon={uploadedCount === totalDestinations ? <CheckCircleIcon /> : <WarningIcon />}
            />
          </Box>
        </Box>

        {/* Bulk Upload Button */}
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setBulkUploadModalOpen(true)}
          fullWidth
          sx={{
            bgcolor: '#27ae60',
            '&:hover': {
              bgcolor: '#229954',
            },
          }}
        >
          Masowy upload plików DOCX
        </Button>

        {missingCount > 0 && (
          <Alert severity="info" sx={{ mt: 2 }} icon={<InfoIcon />}>
            <Typography variant="caption">
              Brakuje <strong>{missingCount}</strong> plików. Kliknij "Masowy upload", aby przesłać wszystkie
              dokumenty naraz.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Destinations List */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Wymagane pliki ({totalDestinations})
        </Typography>

        <List dense>
          {allDestinations.map((dest, idx) => {
            const hasFile = dest.file || documents.has(dest.destinationName)

            return (
              <ListItem
                key={idx}
                sx={{
                  border: '1px solid',
                  borderColor: hasFile ? 'success.light' : 'grey.300',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: hasFile ? 'success.light' : 'background.paper',
                }}
              >
                <ListItemIcon>
                  {hasFile ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <DescriptionIcon color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {dest.destinationName}
                      </Typography>
                      <Chip
                        label={dest.destinationType === 'arrangement' ? 'Ustalenie' : 'Przeznaczenie'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {dest.planLayerName} → {dest.destinationName}.docx
                    </Typography>
                  }
                />
                {hasFile && (
                  <Chip
                    label="Przesłano"
                    size="small"
                    color="success"
                    icon={<CheckCircleIcon />}
                  />
                )}
              </ListItem>
            )
          })}
        </List>
      </Paper>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Błędy walidacji:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {errors.map((error, idx) => (
              <li key={idx}>
                <Typography variant="caption">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Help text */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="caption">
          <strong>Wskazówka:</strong> Ten krok jest opcjonalny. Możesz przesłać pliki DOCX później przez
          dashboard. Kliknij "Zapisz konfigurację", aby dokończyć tworzenie wypisu.
        </Typography>
      </Alert>

      {/* Optional: Success message */}
      {uploadedCount === totalDestinations && totalDestinations > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            ✓ Wszystkie pliki DOCX zostały przesłane! Możesz teraz zapisać konfigurację.
          </Typography>
        </Alert>
      )}

      {/* Bulk Upload Modal */}
      <WypisBulkUploadModal
        open={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        planLayers={bulkUploadPlanLayers}
        projectName={projectName}
        configId={configId}
        onUploadComplete={handleBulkUploadComplete}
      />
    </Box>
  )
}

export default Step3Documents
