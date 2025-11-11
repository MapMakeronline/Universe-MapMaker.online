"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Description from '@mui/icons-material/Description'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import Draggable from 'react-draggable'
import Paper, { PaperProps } from '@mui/material/Paper'

// Draggable Paper Component
function DraggablePaper(props: PaperProps) {
  const nodeRef = useRef<HTMLDivElement>(null)

  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper ref={nodeRef} {...props} />
    </Draggable>
  )
}

const DocumentFAB: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedObreb, setSelectedObreb] = useState<string>('')
  const [selectedNumer, setSelectedNumer] = useState<string>('')

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedObreb('')
    setSelectedNumer('')
  }

  const handleWyrys = () => {
    console.log('Wyrys clicked:', { obreb: selectedObreb, numer: selectedNumer })
    // TODO: Implement wyrys functionality
  }

  const handleDalej = () => {
    console.log('Dalej clicked:', { obreb: selectedObreb, numer: selectedNumer })
    // TODO: Implement dalej (next step) functionality
  }

  return (
    <>
      <Fab
        onClick={handleOpenModal}
        sx={{
          position: 'fixed',
          top: 226,
          right: 16,
          zIndex: 1400,
          width: 56,
          height: 56,
          bgcolor: theme.palette.primary.main,
          color: 'white',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            transform: 'scale(1.05)',
          },
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Description sx={{ fontSize: 24 }} />
      </Fab>

      {/* Wypis i wyrys Modal - Draggable */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperComponent={isMobile ? Paper : DraggablePaper}
        aria-labelledby="draggable-dialog-title"
        hideBackdrop
        disableScrollLock
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '12px',
            maxWidth: '480px',
            m: 0,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto', // Modal catches events
          }
        }}
        sx={{
          pointerEvents: 'none', // Dialog wrapper doesn't catch events (pass-through)
        }}
      >
        {/* Header - Draggable */}
        <DialogTitle
          id="draggable-dialog-title"
          sx={{
            bgcolor: '#2c3e50',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
            fontSize: '18px',
            fontWeight: 600,
            cursor: isMobile ? 'default' : 'move',
            userSelect: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && (
              <DragIndicatorIcon
                sx={{
                  fontSize: '20px',
                  opacity: 0.7,
                  mr: 0.5
                }}
              />
            )}
            Wypis i wyrys
          </Box>
          <IconButton
            onClick={handleCloseModal}
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
          {/* Instrukcja */}
          <Typography
            sx={{
              fontSize: '14px',
              color: '#2c3e50',
              mb: 3,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            Wskaż działkę na mapie, a następnie wybierz jedną z listy:
          </Typography>

          {/* Tabela z działkami */}
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '8px',
              border: '1px solid #bdc3c7',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                bgcolor: '#34495e',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              <Box sx={{ p: 2, borderRight: '1px solid #2c3e50' }}>
                Obręb działki:
              </Box>
              <Box sx={{ p: 2 }}>
                Numer działki:
              </Box>
            </Box>

            {/* Empty state / List of plots */}
            <Box
              sx={{
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#95a5a6',
                fontSize: '14px',
                p: 3,
              }}
            >
              {/* TODO: Display list of plots from map click */}
              Brak działek. Kliknij na mapę aby wybrać działkę.
            </Box>
          </Box>
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
            onClick={handleCloseModal}
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

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={handleWyrys}
              variant="outlined"
              disabled={!selectedObreb || !selectedNumer}
              sx={{
                borderColor: '#95a5a6',
                color: '#34495e',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  borderColor: '#7f8c8d',
                  bgcolor: 'rgba(52, 73, 94, 0.05)',
                },
                '&:disabled': {
                  borderColor: '#ecf0f1',
                  color: '#bdc3c7',
                },
              }}
            >
              Wyrys
            </Button>

            <Button
              onClick={handleDalej}
              variant="contained"
              disabled={!selectedObreb || !selectedNumer}
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
              Dalej
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DocumentFAB
