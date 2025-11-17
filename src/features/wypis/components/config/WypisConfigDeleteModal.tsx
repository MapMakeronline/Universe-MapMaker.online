/**
 * WypisConfigDeleteModal - Confirmation modal for deleting wypis configuration
 *
 * Features:
 * - Shows config name to confirm deletion
 * - Warning about irreversible action
 * - Deletes config via backend API
 * - Shows notifications on success/error
 */

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import WarningIcon from '@mui/icons-material/Warning'
import DeleteIcon from '@mui/icons-material/Delete'

import { useRemoveWypisConfigurationMutation } from '@/backend/wypis'
import { useAppDispatch } from '@/redux/hooks'
import { showError, showSuccess } from '@/redux/slices/notificationSlice'

interface WypisConfigDeleteModalProps {
  /** Dialog open state */
  open: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** Project name */
  projectName: string
  /** Config ID to delete */
  configId: string
  /** Config name (for display) */
  configName: string
}

/**
 * WypisConfigDeleteModal - Delete confirmation dialog
 *
 * Flow:
 * 1. User clicks "Usuń" on config in manager
 * 2. Modal opens with config name
 * 3. User confirms deletion
 * 4. Backend deletes config + all associated DOCX files
 * 5. Shows success notification
 * 6. Closes modal and refreshes config list
 */
const WypisConfigDeleteModal: React.FC<WypisConfigDeleteModalProps> = ({
  open,
  onClose,
  projectName,
  configId,
  configName,
}) => {
  const dispatch = useAppDispatch()
  const [deleteConfig, { isLoading }] = useRemoveWypisConfigurationMutation()

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      console.log('🗑️ Deleting wypis configuration:', { projectName, configId, configName })

      await deleteConfig({
        project: projectName,
        config_id: configId,
      }).unwrap()

      dispatch(
        showSuccess({
          message: `Konfiguracja "${configName}" została usunięta.`,
        })
      )

      onClose()
    } catch (error: any) {
      console.error('❌ Failed to delete wypis configuration:', error)

      // Extract error message (handle both string and object formats)
      let errorMessage = 'Nieznany błąd'
      if (error?.data?.message) {
        errorMessage = typeof error.data.message === 'string'
          ? error.data.message
          : JSON.stringify(error.data.message)
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.status) {
        errorMessage = `Błąd HTTP ${error.status}`
      }

      dispatch(
        showError({
          message: `Nie udało się usunąć konfiguracji: ${errorMessage}`,
        })
      )
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Usuń konfigurację wypisu
          </Typography>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Ta operacja jest nieodwracalna!
          </Typography>
          <Typography variant="caption">
            Usunięcie konfiguracji spowoduje trwałe usunięcie:
          </Typography>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>
              <Typography variant="caption">Ustawień konfiguracji (nazwa, warstwy, kolumny)</Typography>
            </li>
            <li>
              <Typography variant="caption">Wszystkich przesłanych plików DOCX</Typography>
            </li>
            <li>
              <Typography variant="caption">Historii konfiguracji</Typography>
            </li>
          </ul>
        </Alert>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Czy na pewno chcesz usunąć konfigurację:
        </Typography>

        <Box
          sx={{
            p: 2,
            border: '2px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            bgcolor: 'error.light',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.dark' }}>
            {configName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {configId}
          </Typography>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Anuluj
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          startIcon={isLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          disabled={isLoading}
        >
          {isLoading ? 'Usuwanie...' : 'Usuń konfigurację'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WypisConfigDeleteModal
