/**
 * LayerSidebar - Główny panel warstw z drawerem
 * Permanent drawer (desktop) z header, search, tree i footer
 */

'use client'

import React, { useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Toolbar,
  InputAdornment,
  Divider,
  Collapse
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  CreateNewFolder as FolderIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  RestartAlt as ResetIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowRight as CollapseIcon
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'

import DraggableLayerTree from './DraggableLayerTree'
import ProjectProperties from './ProjectProperties'
import { useLayerActions } from '../../state/layers/hooks'

interface LayerSidebarProps {
  open: boolean
  onClose?: () => void
  variant?: 'permanent' | 'temporary'
  width?: number
  miniWidth?: number
}

const LayerSidebar: React.FC<LayerSidebarProps> = ({
  open = true,
  onClose,
  variant = 'permanent',
  width = 320,
  miniWidth = 72
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [projectPropsOpen, setProjectPropsOpen] = useState(false)
  const [isMini, setIsMini] = useState(false)

  const drawerWidth = isMini ? miniWidth : width

  const {
    onSearch,
    onReset,
    onAddLayer,
    onAddGroup,
    onExport,
    onImport
  } = useLayerActions()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const handleReset = () => {
    onReset()
  }

  const handleAddLayer = () => {
    // TODO: Otworzyć dialog dodawania warstwy
    console.log('Add layer dialog')
  }

  const handleAddGroup = () => {
    // TODO: Otworzyć dialog dodawania grupy
    console.log('Add group dialog')
  }

  const handleImport = () => {
    // TODO: Otworzyć file picker
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.xml,.qgs'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onImport(file)
      }
    }
    input.click()
  }

  const handleExport = () => {
    onExport('json')
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6)
        }}
      >
        {!isMini && (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 2
              }}
            >
              🗺️ Warstwy projektu
            </Typography>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <IconButton
                size="small"
                onClick={handleAddLayer}
                sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleAddGroup}
                sx={{ bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1) }}
              >
                <FolderIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleImport}>
                <ImportIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleExport}>
                <ExportIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Search field */}
            <TextField
              fullWidth
              size="small"
              placeholder="Znajdź warstwę lub grupę"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: (theme) => alpha(theme.palette.background.default, 0.6)
                }
              }}
            />
          </>
        )}
      </Box>

      {/* Layer Tree */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <DraggableLayerTree
          searchQuery={searchQuery}
          miniMode={isMini}
        />
      </Box>

      {/* Project Properties Panel */}
      {!isMini && (
        <Box>
          <Divider />
          <Box
            sx={{
              p: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
            onClick={() => setProjectPropsOpen(!projectPropsOpen)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Właściwości projektu
            </Typography>
            {projectPropsOpen ? <ExpandIcon /> : <CollapseIcon />}
          </Box>
          <Collapse in={projectPropsOpen}>
            <ProjectProperties />
          </Collapse>
        </Box>
      )}

      {/* Footer with Reset button */}
      {!isMini && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            sx={{
              borderRadius: 2,
              py: 1
            }}
          >
            Reset warstw
          </Button>
        </Box>
      )}
    </Box>
  )

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: (theme) => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          })
        }
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default LayerSidebar