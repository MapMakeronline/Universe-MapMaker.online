"use client"

import type React from "react"

import { useState } from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
} from "@mui/material"
import {
  ExpandLess,
  ExpandMore,
  Search,
  Visibility,
  VisibilityOff,
  Info,
  Folder,
  FolderOpen,
  Layers,
  Add,
} from "@mui/icons-material"
import { Button } from "@/components/ui/Button"
import { useAppSelector, useAppDispatch } from "@/state/hooks"
import {
  selectLayersByGroup,
  selectVisibleLayers,
  toggleLayerVisibility,
  toggleGroupExpanded,
  setSelectedLayer,
  selectSelectedLayerId,
} from "@/state/slices/layersSlice"
import { spacing } from "@/lib/theme"

/**
 * Layer Panel component - Tree/List view of layer groups and layers
 * Features: visibility toggle, layer info, folder icons, search, drag & drop reordering
 */
export function LayerPanel() {
  const dispatch = useAppDispatch()
  const layerGroups = useAppSelector(selectLayersByGroup)
  const visibleLayers = useAppSelector(selectVisibleLayers)
  const selectedLayerId = useAppSelector(selectSelectedLayerId)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter groups and layers based on search term
  const filteredGroups = layerGroups
    .map((group) => ({
      ...group,
      layers: group.layers.filter((layer) => layer.name.toLowerCase().includes(searchTerm.toLowerCase())),
    }))
    .filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()) || group.layers.length > 0)

  const handleLayerSelect = (layerId: string) => {
    dispatch(setSelectedLayer(layerId === selectedLayerId ? null : layerId))
  }

  const handleVisibilityToggle = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    dispatch(toggleLayerVisibility(layerId))
  }

  const handleGroupToggle = (groupId: string) => {
    dispatch(toggleGroupExpanded(groupId))
  }

  const isLayerVisible = (layerId: string) => {
    return visibleLayers.some((layer) => layer.id === layerId)
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: spacing.md,
        gap: spacing.md,
      }}
    >
      {/* Header */}
      <Box>
        <Typography variant="h6" component="h2" gutterBottom>
          Warstwy
        </Typography>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Szukaj warstw..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: spacing.md }}
        />

        {/* Add Layer Button */}
        <Button
          variant="outlined"
          startIcon={<Add />}
          fullWidth
          onClick={() => {
            // TODO: Open add layer dialog
            console.log("Add layer clicked")
          }}
          aria-label="Dodaj nową warstwę"
        >
          Dodaj warstwę
        </Button>
      </Box>

      <Divider />

      {/* Layer Groups List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List dense>
          {filteredGroups.map((group) => (
            <Box key={group.id}>
              {/* Group Header */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleGroupToggle(group.id)}
                  aria-label={`${group.expanded ? "Zwiń" : "Rozwiń"} grupę ${group.name}`}
                >
                  <ListItemIcon>
                    {group.expanded ? <FolderOpen fontSize="small" /> : <Folder fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {group.name}
                        </Typography>
                        <Chip
                          label={group.layers.length}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.75rem" }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {group.expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>

              {/* Group Layers */}
              <Collapse in={group.expanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {group.layers.map((layer) => (
                    <ListItem
                      key={layer.id}
                      disablePadding
                      sx={{
                        pl: spacing.lg,
                        bgcolor: selectedLayerId === layer.id ? "action.selected" : "transparent",
                      }}
                    >
                      <ListItemButton
                        onClick={() => handleLayerSelect(layer.id)}
                        selected={selectedLayerId === layer.id}
                        aria-label={`Wybierz warstwę ${layer.name}`}
                      >
                        <ListItemIcon>
                          <Layers fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.name}
                          secondary={`Z-index: ${layer.z}`}
                          primaryTypographyProps={{ variant: "body2" }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {/* Layer Info Button */}
                            <Tooltip title="Informacje o warstwie">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // TODO: Show layer info dialog
                                  console.log("Layer info:", layer.id)
                                }}
                                aria-label={`Informacje o warstwie ${layer.name}`}
                              >
                                <Info fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {/* Visibility Toggle */}
                            <Tooltip title={isLayerVisible(layer.id) ? "Ukryj warstwę" : "Pokaż warstwę"}>
                              <IconButton
                                size="small"
                                onClick={(e) => handleVisibilityToggle(layer.id, e)}
                                aria-label={`${isLayerVisible(layer.id) ? "Ukryj" : "Pokaż"} warstwę ${layer.name}`}
                              >
                                {isLayerVisible(layer.id) ? (
                                  <Visibility fontSize="small" />
                                ) : (
                                  <VisibilityOff fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: spacing.xl,
              color: "text.secondary",
            }}
          >
            <Layers sx={{ fontSize: 48, mb: spacing.md, opacity: 0.5 }} />
            <Typography variant="body2">{searchTerm ? "Nie znaleziono warstw" : "Brak warstw"}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
