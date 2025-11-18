import React, { useState, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import JSZip from 'jszip'

import { useAddWypisDocumentsMutation } from '@/backend/wypis'
import { useAppDispatch } from '@/redux/hooks'
import { showSuccess, showError } from '@/redux/slices/notificationSlice'

interface FileMapping {
  destinationType: 'arrangement' | 'purpose'
  destinationName: string
  destinationIndex: number
  planLayerIndex: number
  file: File | null
  autoMatched: boolean
  uploaded: boolean
  error: string | null
}

interface WypisBulkUploadModalProps {
  open: boolean
  onClose: () => void
  planLayers: Array<{
    id: string
    name: string
    arrangements?: Array<{ name: string; fileName?: string }>
    purposes?: Array<{ name: string; fileName?: string }>
  }>
  projectName: string
  configId: string
  onUploadComplete: () => void
}

/**
 * WypisBulkUploadModal - Masowy upload plików DOCX dla konfiguracji wypisu
 *
 * Features:
 * - Drag & drop całego folderu z plikami DOCX
 * - Automatyczne dopasowanie po nazwie pliku (SC.docx → SC)
 * - Wizualna korekta dopasowań (dropdown)
 * - Progress bar z uploadem pojedynczych plików
 * - Podsumowanie: sukces/błędy/pominięte
 */
const WypisBulkUploadModal: React.FC<WypisBulkUploadModalProps> = ({
  open,
  onClose,
  planLayers,
  projectName,
  configId,
  onUploadComplete,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileMappings, setFileMappings] = useState<FileMapping[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dispatch = useAppDispatch()
  const [addWypisDocuments] = useAddWypisDocumentsMutation()

  // Build list of all destinations (arrangements + purposes) from configuration
  const allDestinations = planLayers.flatMap((planLayer, planIdx) => {
    const arrangements = planLayer.arrangements?.map((arr, arrIdx) => ({
      destinationType: 'arrangement' as const,
      destinationName: arr.name,
      destinationIndex: arrIdx,
      planLayerIndex: planIdx,
      fileName: arr.fileName,
    })) || []

    const purposes = planLayer.purposes?.map((purpose, purposeIdx) => ({
      destinationType: 'purpose' as const,
      destinationName: purpose.name,
      destinationIndex: purposeIdx,
      planLayerIndex: planIdx,
      fileName: purpose.fileName,
    })) || []

    return [...arrangements, ...purposes]
  })

  // Auto-match files to destinations based on filename
  const autoMatchFiles = useCallback((files: File[]) => {
    const mappings: FileMapping[] = allDestinations.map((dest) => {
      // Try to find matching file
      // Match by filename without extension (e.g., "SC.docx" → "SC")
      const matchedFile = files.find(file => {
        const fileNameWithoutExt = file.name.replace(/\.(docx|doc)$/i, '').trim()
        const destName = dest.destinationName.trim()

        // Case-insensitive exact match
        return fileNameWithoutExt.toLowerCase() === destName.toLowerCase()
      })

      return {
        ...dest,
        file: matchedFile || null,
        autoMatched: !!matchedFile,
        uploaded: false,
        error: null,
      }
    })

    setFileMappings(mappings)
  }, [allDestinations])

  // Handle folder drag & drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const items = Array.from(e.dataTransfer.items)
    const files: File[] = []

    // Extract all DOCX files from dropped items
    items.forEach(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file && /\.(docx|doc)$/i.test(file.name)) {
          files.push(file)
        }
      }
    })

    if (files.length === 0) {
      return
    }

    setUploadedFiles(files)
    autoMatchFiles(files)
  }, [autoMatchFiles])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const docxFiles = files.filter(file => /\.(docx|doc)$/i.test(file.name))

    if (docxFiles.length === 0) {
      return
    }

    setUploadedFiles(docxFiles)
    autoMatchFiles(docxFiles)
  }, [autoMatchFiles])

  // Handle manual file selection for specific destination
  const handleFileChange = (mappingIndex: number, file: File | null) => {
    const newMappings = [...fileMappings]
    newMappings[mappingIndex] = {
      ...newMappings[mappingIndex],
      file,
      autoMatched: false,
    }
    setFileMappings(newMappings)
  }

  /**
   * Upload all mapped files
   *
   * Backend expects ZIP archive with structure:
   * wypis.zip
   * ├── plan_id_1/
   * │   ├── arrangement1.docx
   * │   ├── purpose1.docx
   * └── plan_id_2/
   *     └── ...
   *
   * Plan layer ID = plan layer's ID from config
   * File name = destinationName + ".docx"
   */
  const handleUploadAll = async () => {
    setIsUploading(true)
    setUploadProgress(10)

    try {
      const mappingsWithFiles = fileMappings.filter(m => m.file !== null)

      if (mappingsWithFiles.length === 0) {
        dispatch(showError({ message: 'Nie wybrano żadnych plików do uploadu' }))
        setIsUploading(false)
        return
      }

      // Step 1: Create ZIP archive with JSZip
      setUploadProgress(20)
      const zip = new JSZip()

      // Group files by plan layer ID
      const filesByPlanLayer = new Map<string, FileMapping[]>()

      mappingsWithFiles.forEach(mapping => {
        const planLayer = planLayers[mapping.planLayerIndex]
        if (!planLayer) return

        const planLayerId = planLayer.id

        if (!filesByPlanLayer.has(planLayerId)) {
          filesByPlanLayer.set(planLayerId, [])
        }
        filesByPlanLayer.get(planLayerId)!.push(mapping)
      })

      // Add files to ZIP grouped by plan_id folders
      for (const [planLayerId, mappings] of filesByPlanLayer.entries()) {
        const folder = zip.folder(planLayerId)

        if (!folder) {
          throw new Error(`Failed to create folder for plan layer ${planLayerId}`)
        }

        for (const mapping of mappings) {
          if (!mapping.file) continue

          // File name = destinationName + ".docx"
          const fileName = `${mapping.destinationName}.docx`
          folder.file(fileName, mapping.file)
        }
      }

      setUploadProgress(50)

      // Step 2: Generate ZIP blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      })

      setUploadProgress(70)

      // Step 3: Upload ZIP to backend
      await addWypisDocuments({
        project: projectName,
        config_id: configId,
        wypis: zipBlob,
      }).unwrap()

      setUploadProgress(100)

      // Step 4: Mark all files as uploaded
      const newMappings = fileMappings.map(mapping => {
        if (mapping.file) {
          return { ...mapping, uploaded: true, error: null }
        }
        return mapping
      })
      setFileMappings(newMappings)

      dispatch(showSuccess({ message: `Przesłano ${mappingsWithFiles.length} plików DOCX` }))
      onUploadComplete()
    } catch (error: any) {
      console.error('Upload error:', error)
      dispatch(showError({
        message: error?.data?.message || 'Błąd podczas uploadu plików DOCX'
      }))

      // Mark all files as failed
      const newMappings = fileMappings.map(mapping => {
        if (mapping.file && !mapping.uploaded) {
          return { ...mapping, error: 'Upload failed' }
        }
        return mapping
      })
      setFileMappings(newMappings)
    } finally {
      setIsUploading(false)
    }
  }

  // Reset state on close
  const handleClose = () => {
    setUploadedFiles([])
    setFileMappings([])
    setUploadProgress(0)
    onClose()
  }

  // Stats
  const totalDestinations = fileMappings.length
  const mappedCount = fileMappings.filter(m => m.file !== null).length
  const uploadedCount = fileMappings.filter(m => m.uploaded).length
  const errorCount = fileMappings.filter(m => m.error !== null).length
  const unmappedCount = totalDestinations - mappedCount

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderOpenIcon />
          <Typography variant="h6">Masowy import plików DOCX</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Step 1: Drop zone (if no files uploaded yet) */}
        {uploadedFiles.length === 0 && (
          <Box
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: isDragging ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => document.getElementById('folder-input')?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Przeciągnij folder z plikami DOCX
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              lub kliknij, aby wybrać pliki
            </Typography>
            <input
              id="folder-input"
              type="file"
              multiple
              accept=".docx,.doc"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="caption">
                ✓ Automatyczne dopasowanie po nazwie pliku<br />
                ✓ Podgląd dopasowań przed uploadem<br />
                ✓ Możliwość ręcznej korekty
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Step 2: File mappings (if files uploaded) */}
        {uploadedFiles.length > 0 && (
          <>
            {/* Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                Znaleziono {uploadedFiles.length} plików DOCX
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip
                  label={`${mappedCount} dopasowane`}
                  color="success"
                  size="small"
                  icon={<CheckCircleIcon />}
                />
                {unmappedCount > 0 && (
                  <Chip
                    label={`${unmappedCount} bez pliku`}
                    color="warning"
                    size="small"
                    icon={<WarningIcon />}
                  />
                )}
                {uploadedCount > 0 && (
                  <Chip
                    label={`${uploadedCount} przesłane`}
                    color="primary"
                    size="small"
                  />
                )}
                {errorCount > 0 && (
                  <Chip
                    label={`${errorCount} błędy`}
                    color="error"
                    size="small"
                    icon={<ErrorIcon />}
                  />
                )}
              </Box>
            </Box>

            {/* Upload progress */}
            {isUploading && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Przesyłanie: {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}

            {/* File mappings list */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {planLayers.map((planLayer, planIdx) => {
                const planMappings = fileMappings.filter(m => m.planLayerIndex === planIdx)

                if (planMappings.length === 0) return null

                return (
                  <Box key={planIdx} sx={{ mb: 3 }}>
                    {/* Plan layer header */}
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                      {planLayer.name}
                    </Typography>

                    {/* Destinations */}
                    {planMappings.map((mapping, idx) => {
                      const globalIndex = fileMappings.findIndex(
                        m => m.destinationName === mapping.destinationName &&
                             m.planLayerIndex === mapping.planLayerIndex
                      )

                      return (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 1,
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: mapping.uploaded ? 'success.main' : mapping.error ? 'error.main' : 'grey.300',
                            bgcolor: mapping.uploaded ? 'success.light' : mapping.error ? 'error.light' : 'background.paper',
                          }}
                        >
                          {/* Destination name */}
                          <Box sx={{ flex: '0 0 120px' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {mapping.destinationName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {mapping.destinationType === 'arrangement' ? 'Ustalenie' : 'Przeznaczenie'}
                            </Typography>
                          </Box>

                          {/* File selector */}
                          <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth size="small" disabled={isUploading || mapping.uploaded}>
                              <InputLabel>Plik DOCX</InputLabel>
                              <Select
                                value={mapping.file?.name || ''}
                                onChange={(e) => {
                                  const selectedFile = uploadedFiles.find(f => f.name === e.target.value)
                                  handleFileChange(globalIndex, selectedFile || null)
                                }}
                                label="Plik DOCX"
                              >
                                <MenuItem value="">
                                  <em>Brak pliku</em>
                                </MenuItem>
                                {uploadedFiles.map((file, fileIdx) => (
                                  <MenuItem key={fileIdx} value={file.name}>
                                    {file.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>

                          {/* Status icon */}
                          <Box sx={{ flex: '0 0 40px', textAlign: 'center' }}>
                            {mapping.uploaded && <CheckCircleIcon color="success" />}
                            {mapping.error && <ErrorIcon color="error" />}
                            {mapping.autoMatched && !mapping.uploaded && !mapping.error && (
                              <CheckCircleIcon color="action" titleAccess="Automatycznie dopasowany" />
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )
              })}
            </Box>

            {/* Error messages */}
            {errorCount > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Wystąpiły błędy podczas uploadu {errorCount} plików. Sprawdź listę powyżej.
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          {uploadedCount > 0 ? 'Zamknij' : 'Anuluj'}
        </Button>
        {uploadedFiles.length > 0 && (
          <Button
            variant="contained"
            onClick={handleUploadAll}
            disabled={isUploading || mappedCount === 0 || uploadedCount === mappedCount}
            startIcon={isUploading ? undefined : <CloudUploadIcon />}
          >
            {isUploading ? 'Przesyłanie...' : `Prześlij ${mappedCount} plików`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default WypisBulkUploadModal
