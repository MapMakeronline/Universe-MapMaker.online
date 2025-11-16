"use client"

import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DescriptionIcon from '@mui/icons-material/Description'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

interface WypisPreviewModalProps {
  open: boolean
  onClose: () => void
  fileBlob: Blob | null
  fileName: string
  isAuthenticated: boolean
}

/**
 * WypisPreviewModal - Preview and download modal for Wypis documents
 *
 * Features:
 * - PDF preview (embedded viewer for logged users)
 * - DOCX info (download only for anonymous users)
 * - Auto-download option
 * - File size display
 * - File type indicator
 */
const WypisPreviewModal: React.FC<WypisPreviewModalProps> = ({
  open,
  onClose,
  fileBlob,
  fileName,
  isAuthenticated,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'unknown'>('unknown')
  const [fileSize, setFileSize] = useState<string>('')

  useEffect(() => {
    if (fileBlob) {
      // Detect file type
      if (fileBlob.type === 'application/pdf') {
        setFileType('pdf')
        // Create object URL for PDF preview
        const url = window.URL.createObjectURL(fileBlob)
        setPreviewUrl(url)
      } else if (
        fileBlob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        setFileType('docx')
        setPreviewUrl(null) // DOCX can't be previewed in browser
      } else {
        setFileType('unknown')
        setPreviewUrl(null)
      }

      // Format file size
      const sizeInKB = fileBlob.size / 1024
      const sizeInMB = sizeInKB / 1024
      if (sizeInMB >= 1) {
        setFileSize(`${sizeInMB.toFixed(2)} MB`)
      } else {
        setFileSize(`${sizeInKB.toFixed(2)} KB`)
      }
    }

    // Cleanup object URL on unmount
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl)
      }
    }
  }, [fileBlob, fileName])

  const handleDownload = () => {
    if (!fileBlob) return

    const url = window.URL.createObjectURL(fileBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    // Close modal after download
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ fontSize: 60, color: '#e74c3c' }} />
      case 'docx':
        return <DescriptionIcon sx={{ fontSize: 60, color: '#3498db' }} />
      default:
        return <DescriptionIcon sx={{ fontSize: 60, color: '#95a5a6' }} />
    }
  }

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'pdf':
        return 'Dokument PDF (tylko do odczytu)'
      case 'docx':
        return 'Dokument Word (edytowalny)'
      default:
        return 'Nieznany format'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={fileType === 'pdf' ? 'lg' : 'sm'}
      fullWidth
      PaperProps={{
        sx: {
          minHeight: fileType === 'pdf' ? '80vh' : 'auto',
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
          <VisibilityIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Podgląd wypisu
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
        {!fileBlob ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* File Info */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                p: 2,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
              }}
            >
              {getFileIcon()}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {getFileTypeLabel()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rozmiar: {fileSize}
                </Typography>
              </Box>
            </Box>

            {/* PDF Preview (Logged Users) */}
            {fileType === 'pdf' && previewUrl && (
              <Box
                sx={{
                  width: '100%',
                  height: '60vh',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <iframe
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title="Podgląd PDF"
                />
              </Box>
            )}

            {/* DOCX Info (Anonymous Users) */}
            {fileType === 'docx' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Dokument Word (DOCX)</strong> - plik edytowalny do pobrania.
                </Typography>
                <Typography variant="body2">
                  ✅ Możesz edytować plik w Microsoft Word, LibreOffice Writer lub Google Docs
                  <br />
                  ✅ Polskie znaki są zachowane (kodowanie UTF-8)
                  <br />
                  ✅ Format umożliwia modyfikację treści, formatowania i stylów
                </Typography>
              </Alert>
            )}

            {/* User Type Info */}
            {isAuthenticated ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Użytkownik zalogowany</strong> - otrzymujesz plik PDF (tylko do odczytu)
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Użytkownik anonimowy</strong> - otrzymujesz edytowalny plik DOCX
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
          onClick={handleDownload}
          variant="contained"
          disabled={!fileBlob}
          startIcon={<DownloadIcon />}
          sx={{
            bgcolor: '#27ae60',
            '&:hover': {
              bgcolor: '#229954',
            },
          }}
        >
          Pobierz plik
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WypisPreviewModal
