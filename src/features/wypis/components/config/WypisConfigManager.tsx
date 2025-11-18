/**
 * WypisConfigManager - Manager for multiple wypis configurations
 *
 * Features:
 * - List all existing wypis configurations
 * - Create new configuration (opens WypisConfigWizard)
 * - Edit existing configuration (opens WypisConfigWizard with configId)
 * - Delete configuration with confirmation
 * - Set active configuration for wypis generation
 *
 * UI: Dialog with list of configs + action buttons
 */

import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DescriptionIcon from '@mui/icons-material/Description'

import { useGetWypisConfigurationQuery } from '@/backend/wypis'
import WypisConfigWizard from './WypisConfigWizard'
import WypisConfigDeleteModal from './WypisConfigDeleteModal'

interface Layer {
  id: string
  name: string
  type: 'vector' | 'raster'
}

interface WypisConfigManagerProps {
  /** Dialog open state */
  open: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** Project name */
  projectName: string
  /** Available layers from QGIS project */
  projectLayers: Layer[]
  /** Currently selected config ID (for wypis generation) */
  selectedConfigId?: string | null
  /** Callback when user selects a config */
  onSelectConfig?: (configId: string) => void
}

/**
 * WypisConfigManager - Manage multiple wypis configurations
 *
 * Flow:
 * 1. User opens manager → sees list of all configs
 * 2. Click "Nowa konfiguracja" → opens WypisConfigWizard (configId=null)
 * 3. Click "Edytuj" on config → opens WypisConfigWizard (configId=string)
 * 4. Click "Usuń" on config → opens confirmation dialog
 * 5. Click on config name → sets as active config for wypis generation
 */
const WypisConfigManager: React.FC<WypisConfigManagerProps> = ({
  open,
  onClose,
  projectName,
  projectLayers,
  selectedConfigId,
  onSelectConfig,
}) => {
  // Fetch list of all wypis configurations for this project
  const { data: configsData, isLoading, error } = useGetWypisConfigurationQuery(
    { project: projectName },
    { skip: !open || !projectName }
  )

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null)
  const [deletingConfigName, setDeletingConfigName] = useState<string>('')

  // Extract config list
  const configs = configsData?.data?.config_structure || []

  // Handle create new config
  const handleCreateNew = () => {
    setEditingConfigId(null)
    setWizardOpen(true)
  }

  // Handle edit existing config
  const handleEdit = (configId: string) => {
    setEditingConfigId(configId)
    setWizardOpen(true)
  }

  // Handle delete config
  const handleDelete = (configId: string, configName: string) => {
    setDeletingConfigId(configId)
    setDeletingConfigName(configName)
    setDeleteModalOpen(true)
  }

  // Handle wizard close
  const handleWizardClose = () => {
    setWizardOpen(false)
    setEditingConfigId(null)
    // Refetch configs list after wizard closes
  }

  // Handle select config (for wypis generation)
  const handleSelectConfig = (configId: string) => {
    if (onSelectConfig) {
      onSelectConfig(configId)
    }
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        {/* Header */}
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Konfiguracje wypisu
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Zarządzaj konfiguracjami wypisu z rejestru gruntów dla projektu <strong>{projectName}</strong>
          </Typography>
        </DialogTitle>

        {/* Content */}
        <DialogContent dividers>
          {/* Loading state */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Wczytuję konfiguracje...
              </Typography>
            </Box>
          )}

          {/* Error state */}
          {error && (
            <Alert severity="error">
              <Typography variant="body2">
                Nie udało się wczytać konfiguracji wypisu. Spróbuj ponownie.
              </Typography>
            </Alert>
          )}

          {/* Empty state */}
          {!isLoading && !error && configs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Brak konfiguracji wypisu
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Utwórz pierwszą konfigurację, aby móc generować wypisy z rejestru gruntów.
              </Typography>
            </Box>
          )}

          {/* Configs list */}
          {!isLoading && !error && configs.length > 0 && (
            <List>
              {configs.map((config: any) => {
                const isSelected = config.id === selectedConfigId

                return (
                  <ListItem
                    key={config.id}
                    component="button"
                    onClick={() => handleSelectConfig(config.id)}
                    sx={{
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'grey.300',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: isSelected ? 'primary.light' : 'background.paper',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.light' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                            {config.name}
                          </Typography>
                          {isSelected && (
                            <Chip
                              label="Aktywna"
                              size="small"
                              color="primary"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          ID: {config.id}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edytuj konfigurację">
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(config.id)
                          }}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Usuń konfigurację">
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(config.id, config.name)
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          )}
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={onClose}>Zamknij</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{
              bgcolor: '#27ae60',
              '&:hover': {
                bgcolor: '#229954',
              },
            }}
          >
            Nowa konfiguracja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wizard for create/edit */}
      <WypisConfigWizard
        open={wizardOpen}
        onClose={handleWizardClose}
        projectName={projectName}
        configId={editingConfigId}
        projectLayers={projectLayers}
      />

      {/* Delete confirmation modal */}
      <WypisConfigDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        projectName={projectName}
        configId={deletingConfigId || ''}
        configName={deletingConfigName}
      />
    </>
  )
}

export default WypisConfigManager
