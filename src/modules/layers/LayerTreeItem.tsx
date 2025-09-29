/**
 * LayerTreeItem - Pojedynczy element drzewa z checkbox, ikonami, context menu
 * Obsługuje tri-state checkbox dla grup i akcje layer'ów
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Checkbox,
  Typography,
  IconButton,
  Slider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  alpha
} from '@mui/material'
import {
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon,
  Settings as SettingsIcon,
  TableChart as TableIcon,
  Map as LegendIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Layers as LayerIcon,
  FolderOpen as GroupIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material'

import { LayerNode } from '../../state/layers/types'
import { useLayerHelpers } from '../../state/layers/hooks'

interface LayerTreeItemProps {
  node: LayerNode
  isSelected: boolean
  miniMode?: boolean
  searchQuery?: string
  onVisibilityToggle: (nodeId: string, visible: boolean) => void
  onOpacityChange: (nodeId: string, opacity: number) => void
  onNodeSelect: (nodeId: string) => void
  onOpenSettings?: (nodeId: string) => void
  onOpenAttributes?: (nodeId: string) => void
  onOpenLegend?: (nodeId: string) => void
  onDeleteLayer?: (nodeId: string) => void
}

const LayerTreeItem: React.FC<LayerTreeItemProps> = ({
  node,
  isSelected,
  miniMode = false,
  searchQuery = '',
  onVisibilityToggle,
  onOpacityChange,
  onNodeSelect,
  onOpenSettings,
  onOpenAttributes,
  onOpenLegend,
  onDeleteLayer
}) => {
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null)
  const [showOpacitySlider, setShowOpacitySlider] = useState(false)
  const { hasVisibleChildren, getChildIds } = useLayerHelpers()

  // Highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: 0 }}>
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Calculate checkbox state for groups (tri-state)
  const checkboxState = useMemo(() => {
    if (node.type === 'group' && node.children) {
      const visibleChildren = node.children.filter(child => child.visible)

      if (visibleChildren.length === 0) {
        return 'unchecked'
      } else if (visibleChildren.length === node.children.length) {
        return 'checked'
      } else {
        return 'indeterminate'
      }
    }

    return node.visible ? 'checked' : 'unchecked'
  }, [node])

  // Handle visibility toggle with group logic
  const handleVisibilityToggle = () => {
    if (node.type === 'group' && node.children) {
      // For groups, toggle all children
      const newVisibility = checkboxState !== 'checked'
      const childIds = getChildIds(node.id)

      // Toggle group itself
      onVisibilityToggle(node.id, newVisibility)

      // Toggle all children
      childIds.forEach(childId => {
        onVisibilityToggle(childId, newVisibility)
      })
    } else {
      // For layers, simple toggle
      onVisibilityToggle(node.id, !node.visible)
    }
  }

  // Context menu handlers
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    )
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  const handleAction = (action: string) => {
    handleCloseContextMenu()

    switch (action) {
      case 'visibility':
        handleVisibilityToggle()
        break
      case 'settings':
        onOpenSettings?.(node.id)
        break
      case 'attributes':
        onOpenAttributes?.(node.id)
        break
      case 'legend':
        onOpenLegend?.(node.id)
        break
      case 'delete':
        onDeleteLayer?.(node.id)
        break
    }
  }

  // Get appropriate icon for layer type
  const getLayerIcon = () => {
    if (node.type === 'group') {
      return <GroupIcon fontSize="small" />
    }
    return <LayerIcon fontSize="small" />
  }

  // Get layer type label
  const getTypeLabel = () => {
    const typeLabels = {
      group: 'Grupa',
      wms: 'WMS',
      wfs: 'WFS',
      raster: 'Raster',
      vector: 'Vector',
      mvt: 'MVT'
    }
    return typeLabels[node.type] || node.type.toUpperCase()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        px: 1,
        cursor: 'pointer',
        borderRadius: 1,
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.action.hover, 0.5)
        },
        ...(isSelected && {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          borderLeft: (theme) => `3px solid ${theme.palette.primary.main}`
        })
      }}
      onClick={() => onNodeSelect(node.id)}
      onContextMenu={handleContextMenu}
    >
      {/* Drag Handle */}
      {!miniMode && (
        <DragIcon
          fontSize="small"
          sx={{
            color: 'text.disabled',
            cursor: 'grab',
            opacity: 0.3,
            '&:hover': { opacity: 0.7 }
          }}
        />
      )}

      {/* Visibility Checkbox */}
      <Tooltip title={node.visible ? 'Ukryj warstwę' : 'Pokaż warstwę'}>
        <Checkbox
          size="small"
          checked={checkboxState === 'checked'}
          indeterminate={checkboxState === 'indeterminate'}
          onChange={handleVisibilityToggle}
          onClick={(e) => e.stopPropagation()}
          sx={{
            p: 0.5,
            '&.Mui-checked': {
              color: 'primary.main'
            }
          }}
        />
      </Tooltip>

      {/* Layer Icon */}
      <Box
        sx={{
          color: node.visible ? 'text.primary' : 'text.disabled',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {getLayerIcon()}
      </Box>

      {/* Layer Name and Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: node.type === 'group' ? 500 : 400,
            color: node.visible ? 'text.primary' : 'text.disabled',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {highlightText(node.name, searchQuery)}
        </Typography>

        {!miniMode && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
            {/* Layer Type */}
            <Chip
              label={getTypeLabel()}
              size="small"
              variant="outlined"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                '& .MuiChip-label': { px: 0.5 }
              }}
            />

            {/* Opacity info for visible layers */}
            {node.visible && node.opacity !== undefined && node.opacity < 1 && (
              <Chip
                label={`${Math.round(node.opacity * 100)}%`}
                size="small"
                color="secondary"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      {!miniMode && node.visible && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Opacity Slider */}
          {node.type !== 'group' && node.opacity !== undefined && (
            <Box
              sx={{
                width: showOpacitySlider ? 60 : 'auto',
                transition: 'width 0.2s'
              }}
              onMouseEnter={() => setShowOpacitySlider(true)}
              onMouseLeave={() => setShowOpacitySlider(false)}
            >
              {showOpacitySlider ? (
                <Slider
                  size="small"
                  value={node.opacity}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(_, value) => onOpacityChange(node.id, value as number)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ mx: 1 }}
                />
              ) : (
                <IconButton
                  size="small"
                  sx={{ opacity: 0.7 }}
                >
                  <VisibleIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          {/* More Actions */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleContextMenu(e)
            }}
            sx={{ opacity: 0.7 }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        MenuListProps={{
          dense: true
        }}
      >
        {/* Visibility Toggle */}
        <MenuItem onClick={() => handleAction('visibility')}>
          <ListItemIcon>
            {node.visible ? <HiddenIcon fontSize="small" /> : <VisibleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {node.visible ? 'Ukryj' : 'Pokaż'}
          </ListItemText>
        </MenuItem>

        {/* Layer Settings */}
        {node.type !== 'group' && (
          <MenuItem onClick={() => handleAction('settings')}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ustawienia</ListItemText>
          </MenuItem>
        )}

        {/* Layer Attributes (for WFS) */}
        {node.type === 'wfs' && (
          <MenuItem onClick={() => handleAction('attributes')}>
            <ListItemIcon>
              <TableIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Tabela atrybutów</ListItemText>
          </MenuItem>
        )}

        {/* Layer Legend */}
        {node.legendUrl && (
          <MenuItem onClick={() => handleAction('legend')}>
            <ListItemIcon>
              <LegendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Legenda</ListItemText>
          </MenuItem>
        )}

        {/* Delete */}
        <MenuItem
          onClick={() => handleAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Usuń</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default LayerTreeItem