"use client"

import React from 'react'
import { useDropzone } from 'react-dropzone'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

interface FileDropZoneProps {
  file?: File
  onDrop: (files: File[]) => void
  onRemove: () => void
  accept?: Record<string, string[]>
  maxSize?: number
  placeholder?: string
  disabled?: boolean
}

/**
 * FileDropZone - Reusable drag & drop component for file uploads
 *
 * Features:
 * - Drag & drop file upload
 * - Click to browse files
 * - File type validation (DOC/DOCX by default)
 * - File size validation (50MB by default)
 * - Visual feedback (hover, disabled states)
 * - File preview with remove button
 *
 * Used for:
 * - Wypis purposes file upload
 * - Wypis arrangements file upload
 */
const FileDropZone: React.FC<FileDropZoneProps> = ({
  file,
  onDrop,
  onRemove,
  accept = {
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize = 50 * 1024 * 1024, // 50MB
  placeholder = 'Przeciągnij plik DOC/DOCX tutaj lub kliknij, aby wybrać',
  disabled = false,
}) => {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept,
    maxSize,
    multiple: false,
    disabled,
    onDrop,
    onDropRejected: (fileRejections) => {
      console.error('File rejected:', fileRejections)
      if (fileRejections[0]?.errors[0]?.code === 'file-too-large') {
        alert(`Plik jest za duży. Maksymalny rozmiar: ${maxSize / (1024 * 1024)}MB`)
      } else if (fileRejections[0]?.errors[0]?.code === 'file-invalid-type') {
        alert('Nieprawidłowy typ pliku. Dozwolone: .doc, .docx')
      }
    },
  })

  // If file exists, show file preview
  if (file) {
    return (
      <Box
        sx={{
          border: '2px solid #2ecc71',
          borderRadius: '8px',
          p: 2,
          bgcolor: '#e8f5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: '#d5e8d4',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <DescriptionIcon sx={{ color: '#27ae60', fontSize: 28 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: '#27ae60',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#7f8c8d' }}>
              {(file.size / 1024).toFixed(1)} KB
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onRemove}
          disabled={disabled}
          sx={{
            color: '#e74c3c',
            '&:hover': {
              bgcolor: '#fadbd8',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    )
  }

  // Dropzone (no file)
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: isDragReject
          ? '2px dashed #e74c3c'
          : isDragActive
          ? '2px dashed #3498db'
          : '2px dashed #bdc3c7',
        borderRadius: '8px',
        p: 3,
        textAlign: 'center',
        bgcolor: isDragReject
          ? '#fadbd8'
          : isDragActive
          ? '#ebf5fb'
          : disabled
          ? '#f5f5f5'
          : '#ecf0f1',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1,
        '&:hover': !disabled
          ? {
              bgcolor: '#d5dbdb',
              borderColor: '#95a5a6',
            }
          : {},
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon
        sx={{
          fontSize: 40,
          color: isDragReject ? '#e74c3c' : isDragActive ? '#3498db' : '#7f8c8d',
          mb: 1,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color: isDragReject ? '#e74c3c' : '#2c3e50',
          fontWeight: 500,
        }}
      >
        {isDragReject
          ? 'Nieprawidłowy typ pliku lub rozmiar'
          : isDragActive
          ? 'Upuść plik tutaj...'
          : placeholder}
      </Typography>
      <Typography variant="caption" sx={{ color: '#95a5a6', display: 'block', mt: 1 }}>
        Dozwolone: .doc, .docx (max {maxSize / (1024 * 1024)}MB)
      </Typography>
    </Box>
  )
}

export default FileDropZone
