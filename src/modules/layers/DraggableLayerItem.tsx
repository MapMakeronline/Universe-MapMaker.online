/**
 * DraggableLayerItem - Pojedynczy element drzewa z drag & drop
 * Obsługuje przeciąganie, edycję nazw i all tree interactions
 */

'use client'

import React, { useState, useRef, useEffect, CSSProperties } from 'react'
import {
  Box,
  Typography,
  Checkbox,
  Slider,
  IconButton,
  TextField,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material'
import {
  ExpandMore as ExpandIcon,
  ChevronRight as CollapseIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon
} from '@mui/icons-material'
import {
  useSortable,
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { LayerNode } from '../../state/layers/types'
import { useLayerTree, useLayerActions } from '../../state/layers/hooks'

interface DraggableLayerItemProps {
  node: LayerNode & { parentId?: string | null; depth?: number; index?: number }
  depth: number
  miniMode?: boolean
  searchQuery?: string
  isActive?: boolean
  isOver?: boolean
  isDragOverlay?: boolean
}

// Custom animate layout changes to prevent layout shifts
const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasMutating: false })

const DraggableLayerItem: React.FC<DraggableLayerItemProps> = ({
  node,
  depth,
  miniMode = false,
  searchQuery = '',
  isActive = false,
  isOver = false,
  isDragOverlay = false
}) => {
  const theme = useTheme()
  const { expandedNodes, selectedNodes } = useLayerTree()
  const {
    onVisibilityToggle,
    onOpacityChange,
    onNameUpdate,
    onSetExpanded,
    onSetSelected,
    onOpenSettings,
    onOpenAttributes
  } = useLayerActions()

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.name)
  const [showOpacity, setShowOpacity] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  const isExpanded = expandedNodes.includes(node.id)
  const isSelected = selectedNodes.includes(node.id)
  const hasChildren = node.children && node.children.length > 0

  // Sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: node.id,
    animateLayoutChanges,
    disabled: isEditing || isDragOverlay
  })

  // Calculate styles
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const handleExpand = () => {
    if (!hasChildren) return

    const newExpanded = isExpanded
      ? expandedNodes.filter(id => id !== node.id)
      : [...expandedNodes, node.id]

    onSetExpanded(newExpanded)
  }

  const handleSelect = () => {
    const newSelected = isSelected
      ? selectedNodes.filter(id => id !== node.id)
      : [...selectedNodes, node.id]

    onSetSelected(newSelected)
  }

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onVisibilityToggle(node.id, !node.visible)
  }

  const handleOpacityChange = (value: number | number[]) => {
    const opacity = Array.isArray(value) ? value[0] : value
    onOpacityChange(node.id, opacity / 100)
  }

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditValue(node.name)
  }

  const handleEditSave = () => {
    if (editValue.trim() && editValue !== node.name) {
      onNameUpdate(node.id, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditValue(node.name)
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const getLayerIcon = () => {
    const icons = {
      group: '📁',
      wms: '🗺️',
      wfs: '📍',
      raster: '🖼️',
      vector: '📐',
      mvt: '🔷'
    }
    return icons[node.type] || '📄'
  }

  const shouldHighlight = searchQuery &&
    node.name.toLowerCase().includes(searchQuery.toLowerCase())

  const highlightText = (text: string) => {
    if (!searchQuery || !shouldHighlight) return text

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Box
          key={index}
          component="span"
          sx={{
            bgcolor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            px: 0.5,
            borderRadius: 0.5
          }}
        >
          {part}
        </Box>
      ) : (
        part
      )
    )
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        pl: depth * 2,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        cursor: isDragOverlay ? 'grabbing' : 'default',
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.16)
          : isOver
          ? alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
        borderRadius: 1,
        border: isOver ? `2px dashed ${theme.palette.primary.main}` : '2px solid transparent',
        transition: theme.transitions.create(['background-color', 'border-color']),
        '&:hover': {
          bgcolor: !isSelected && !isOver
            ? alpha(theme.palette.action.hover, 0.5)
            : undefined
        }
      }}
      {...attributes}
    >
      {/* Drag Handle */}
      <Tooltip
        title="Przeciągnij w górę/dół aby zmienić kolejność, w prawo aby spakować do foldera, w lewo aby wyciągnąć z foldera"
        placement="top"
      >
        <IconButton
          size="small"
          sx={{
            cursor: 'grab',
            opacity: isActive ? 1 : 0.3,
            '&:hover': { opacity: 1 },
            mr: 0.5
          }}
          {...listeners}
        >
          <DragIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Expand/Collapse */}
      <IconButton
        size="small"
        onClick={handleExpand}
        sx={{
          visibility: hasChildren ? 'visible' : 'hidden',
          mr: 0.5
        }}
      >
        {isExpanded ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
      </IconButton>

      {/* Selection Checkbox */}
      <Checkbox
        size="small"
        checked={isSelected}
        onChange={handleSelect}
        sx={{ mr: 1 }}
      />

      {/* Layer Icon */}
      <Typography sx={{ fontSize: '1rem', mr: 1 }}>
        {getLayerIcon()}
      </Typography>

      {/* Layer Name */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <TextField
            ref={editInputRef}
            size="small"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditCancel}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
                height: '28px'
              }
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              fontWeight: node.type === 'group' ? 600 : 400,
              color: node.visible ? 'text.primary' : 'text.disabled',
              textDecoration: node.visible ? 'none' : 'line-through',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {highlightText(node.name)}
          </Typography>
        )}
      </Box>

      {/* Controls */}
      {!miniMode && !isEditing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Edit Button */}
          <IconButton
            size="small"
            onClick={handleEditStart}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          {/* Visibility Toggle */}
          <IconButton
            size="small"
            onClick={handleVisibilityToggle}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            {node.visible ? (
              <VisibleIcon fontSize="small" />
            ) : (
              <HiddenIcon fontSize="small" />
            )}
          </IconButton>

          {/* Opacity Slider */}
          {node.visible && node.type !== 'group' && (
            <Box
              sx={{
                width: showOpacity ? 80 : 20,
                transition: theme.transitions.create('width'),
                overflow: 'hidden'
              }}
              onMouseEnter={() => setShowOpacity(true)}
              onMouseLeave={() => setShowOpacity(false)}
            >
              <Slider
                size="small"
                value={(node.opacity || 1) * 100}
                onChange={(_, value) => handleOpacityChange(value)}
                min={0}
                max={100}
                sx={{
                  py: 0.5,
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12
                  }
                }}
              />
            </Box>
          )}

          {/* More Options */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onOpenSettings(node.id)
            }}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={handleEditSave}>
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleEditCancel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

export default DraggableLayerItem