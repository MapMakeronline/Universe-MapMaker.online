"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import {
  useAddWypisConfigurationMutation,
  useGetWypisConfigurationQuery,
  useRemoveWypisConfigurationMutation,
} from '@/backend/wypis'
import type { WypisConfigFormState, WypisPurpose, WypisArrangement } from '@/backend/types'

interface QGISLayer {
  id: string
  name: string
  columns?: string[]
}

interface WypisConfigModalProps {
  open: boolean
  onClose: () => void
  projectName: string
  configId?: string // If editing existing configuration
}

/**
 * WypisConfigModal - Multi-step modal dla konfiguracji wypisu i wyrysu
 *
 * Krok 1: Lista konfiguracji (wybór istniejącej lub nowa)
 * Krok 2: Edycja konfiguracji (nazwa, warstwa, kolumny, przeznaczenia)
 */
const WypisConfigModal: React.FC<WypisConfigModalProps> = ({
  open,
  onClose,
  onSave,
  existingConfigs,
  projectLayers
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Multi-step state
  const [step, setStep] = useState<'list' | 'edit'>(existingConfigs.length > 0 ? 'list' : 'edit')

  // Edycja konfiguracji
  const [editingConfig, setEditingConfig] = useState<WypisConfig>({
    id: Date.now().toString(),
    nazwa: '',
    warstwaId: '',
    kolumnaObreb: 'NAZWA_OBRE',
    kolumnaNumer: 'NUMER_DZIA',
    przeznaczenia: []
  })

  const [newPrzeznaczenie, setNewPrzeznaczenie] = useState({
    uchwalaNr: '',
    uchwalaNazwa: ''
  })

  const handleSelectConfig = (config: WypisConfig) => {
    setEditingConfig({ ...config })
    setStep('edit')
  }

  const handleNewConfig = () => {
    setEditingConfig({
      id: Date.now().toString(),
      nazwa: '',
      warstwaId: '',
      kolumnaObreb: 'NAZWA_OBRE',
      kolumnaNumer: 'NUMER_DZIA',
      przeznaczenia: []
    })
    setStep('edit')
  }

  const handleDeleteConfig = (configId: string) => {
    // TODO: Implement delete from backend/storage
    console.log('Delete config:', configId)
  }

  const handleAddPrzeznaczenie = () => {
    if (!newPrzeznaczenie.uchwalaNr.trim()) return

    setEditingConfig({
      ...editingConfig,
      przeznaczenia: [
        ...editingConfig.przeznaczenia,
        {
          id: Date.now().toString(),
          uchwalaNr: newPrzeznaczenie.uchwalaNr,
          uchwalaNazwa: newPrzeznaczenie.uchwalaNazwa
        }
      ]
    })

    setNewPrzeznaczenie({ uchwalaNr: '', uchwalaNazwa: '' })
  }

  const handleEditPrzeznaczenie = (id: string) => {
    const przeznaczenie = editingConfig.przeznaczenia.find(p => p.id === id)
    if (przeznaczenie) {
      setNewPrzeznaczenie({
        uchwalaNr: przeznaczenie.uchwalaNr,
        uchwalaNazwa: przeznaczenie.uchwalaNazwa
      })
      handleDeletePrzeznaczenie(id)
    }
  }

  const handleDeletePrzeznaczenie = (id: string) => {
    setEditingConfig({
      ...editingConfig,
      przeznaczenia: editingConfig.przeznaczenia.filter(p => p.id !== id)
    })
  }

  const handleSave = () => {
    onSave(editingConfig)
    onClose()
  }

  const handleBack = () => {
    if (step === 'edit' && existingConfigs.length > 0) {
      setStep('list')
    } else {
      onClose()
    }
  }

  const isFormValid = () => {
    return editingConfig.nazwa.trim() !== '' && editingConfig.warstwaId !== ''
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '8px',
          maxHeight: isMobile ? '100%' : '80vh',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#34495e',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '18px',
          fontWeight: 600,
        }}
      >
        {step === 'list' ? 'Konfiguracja wypisu' : 'Konfiguracja wypisu'}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#ecf0f1',
          px: 3,
          py: 3,
        }}
      >
        {step === 'list' ? (
          /* ========== KROK 1: LISTA KONFIGURACJI ========== */
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#2c3e50',
                mb: 2,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              Wybierz konfigurację z listy:
            </Typography>

            <List sx={{ bgcolor: 'white', borderRadius: 1 }}>
              {existingConfigs.map((config, index) => (
                <Box key={config.id}>
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: '#f7f9fc',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => handleSelectConfig(config)}
                  >
                    <ListItemText
                      primary={config.nazwa}
                      secondary={`Warstwa: ${projectLayers.find(l => l.id === config.warstwaId)?.name || 'Brak'}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectConfig(config)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConfig(config.id)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < existingConfigs.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Box>
        ) : (
          /* ========== KROK 2: EDYCJA KONFIGURACJI ========== */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Nazwa wypisu */}
            <TextField
              label="Nazwa wypisu"
              fullWidth
              size="small"
              value={editingConfig.nazwa}
              onChange={(e) => setEditingConfig({ ...editingConfig, nazwa: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                }
              }}
            />

            {/* Wybierz warstwę działek */}
            <FormControl fullWidth size="small">
              <InputLabel>Wybierz warstwę działek:</InputLabel>
              <Select
                value={editingConfig.warstwaId}
                label="Wybierz warstwę działek:"
                onChange={(e) => setEditingConfig({ ...editingConfig, warstwaId: e.target.value })}
                sx={{ bgcolor: 'white' }}
              >
                {projectLayers.map(layer => (
                  <MenuItem key={layer.id} value={layer.id}>
                    {layer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Kolumna obręb */}
            <FormControl fullWidth size="small">
              <InputLabel>Kolumna obręb:</InputLabel>
              <Select
                value={editingConfig.kolumnaObreb}
                label="Kolumna obręb:"
                onChange={(e) => setEditingConfig({ ...editingConfig, kolumnaObreb: e.target.value })}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="NAZWA_OBRE">NAZWA_OBRE</MenuItem>
                <MenuItem value="OBREB">OBREB</MenuItem>
                <MenuItem value="GMINA">GMINA</MenuItem>
              </Select>
            </FormControl>

            {/* Kolumna numer działki */}
            <FormControl fullWidth size="small">
              <InputLabel>Kolumna numer działki:</InputLabel>
              <Select
                value={editingConfig.kolumnaNumer}
                label="Kolumna numer działki:"
                onChange={(e) => setEditingConfig({ ...editingConfig, kolumnaNumer: e.target.value })}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="NUMER_DZIA">NUMER_DZIA</MenuItem>
                <MenuItem value="NR_DZIALKI">NR_DZIALKI</MenuItem>
                <MenuItem value="NUMER">NUMER</MenuItem>
              </Select>
            </FormControl>

            {/* Dodaj warstwę przeznaczenia planu */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#2c3e50' }}>
                  Dodaj warstwę przeznaczenia planu
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddPrzeznaczenie}
                  disabled={!newPrzeznaczenie.uchwalaNr.trim()}
                  sx={{
                    textTransform: 'none',
                    fontSize: '13px'
                  }}
                >
                  Wybierz z listy
                </Button>
              </Box>

              {/* Nowe przeznaczenie input */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  placeholder="Uchwała nr..."
                  size="small"
                  fullWidth
                  value={newPrzeznaczenie.uchwalaNr}
                  onChange={(e) => setNewPrzeznaczenie({ ...newPrzeznaczenie, uchwalaNr: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
                />
              </Box>

              {/* Lista przeznaczenia */}
              <List sx={{ bgcolor: 'white', borderRadius: 1, maxHeight: '200px', overflow: 'auto' }}>
                {editingConfig.przeznaczenia.map((przeznaczenie, index) => (
                  <Box key={przeznaczenie.id}>
                    <ListItem
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1
                      }}
                    >
                      <ListItemText
                        primary={przeznaczenie.uchwalaNazwa || przeznaczenie.uchwalaNr}
                        primaryTypographyProps={{ fontSize: '14px' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPrzeznaczenie(przeznaczenie.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePrzeznaczenie(przeznaczenie.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < editingConfig.przeznaczenia.length - 1 && <Divider />}
                  </Box>
                ))}
                {editingConfig.przeznaczenia.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Brak przeznaczenia terenu"
                      primaryTypographyProps={{ fontSize: '14px', color: '#95a5a6' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#ecf0f1',
          px: 3,
          pb: 3,
          pt: 0,
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={handleBack}
          variant="contained"
          sx={{
            bgcolor: '#34495e',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              bgcolor: '#2c3e50',
            },
          }}
        >
          Powrót
        </Button>

        {step === 'list' ? (
          <Button
            onClick={handleNewConfig}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#27ae60',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#229954',
              },
            }}
          >
            Nowa konfiguracja
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!isFormValid()}
            sx={{
              bgcolor: '#27ae60',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: '#229954',
              },
              '&:disabled': {
                bgcolor: '#bdc3c7',
              },
            }}
          >
            Zapisz
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default WypisConfigModal
