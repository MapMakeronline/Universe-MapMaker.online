"use client"

import React, { useState, useRef } from "react"
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Divider,
  InputAdornment,
} from "@mui/material"
import {
  ExpandLess,
  ExpandMore,
  Layers as LayersIcon,
  Search as SearchIcon,
  Visibility,
  VisibilityOff,
  Map as MapIcon,
} from "@mui/icons-material"
import { useAppSelector, useAppDispatch } from "@/src/store/hooks"
import { selectLayers, toggleLayerVisibility } from "@/src/store/slices/layersSlice"

interface LayerPanelProps {
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function LayerPanel({ searchInputRef }: LayerPanelProps) {
  const dispatch = useAppDispatch()
  const layers = useAppSelector(selectLayers)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["base", "overlays"]))

  const internalSearchRef = useRef<HTMLInputElement>(null)
  const searchRef = searchInputRef || internalSearchRef

  const filteredLayers = layers.filter(
    (layer) =>
      layer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layer.group.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const groupedLayers = filteredLayers.reduce(
    (groups, layer) => {
      if (!groups[layer.group]) {
        groups[layer.group] = []
      }
      groups[layer.group].push(layer)
      return groups
    },
    {} as Record<string, typeof layers>,
  )

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const handleLayerToggle = (layerId: string) => {
    dispatch(toggleLayerVisibility(layerId))
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Search */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <TextField
          ref={searchRef}
          fullWidth
          size="small"
          placeholder="Szukaj warstw..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{
            "aria-label": "Szukaj warstw",
            autoComplete: "off",
          }}
        />
      </Box>

      {/* Layer Groups */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List dense>
          {Object.entries(groupedLayers).map(([groupName, groupLayers]) => (
            <React.Fragment key={groupName}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => toggleGroup(groupName)}
                  sx={{
                    minHeight: 48,
                    "@media (max-width: 768px)": {
                      minHeight: 56,
                    },
                  }}
                >
                  <ListItemIcon>
                    <LayersIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight="medium">
                        {groupName} ({groupLayers.length})
                      </Typography>
                    }
                  />
                  {expandedGroups.has(groupName) ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>

              <Collapse in={expandedGroups.has(groupName)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {groupLayers.map((layer) => (
                    <ListItem key={layer.id} disablePadding sx={{ pl: 2 }}>
                      <ListItemButton
                        sx={{
                          minHeight: 44,
                          "@media (max-width: 768px)": {
                            minHeight: 52,
                          },
                        }}
                      >
                        <ListItemIcon>
                          <MapIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.name}
                          secondary={layer.description}
                          primaryTypographyProps={{
                            variant: "body2",
                            noWrap: true,
                          }}
                          secondaryTypographyProps={{
                            variant: "caption",
                            noWrap: true,
                          }}
                        />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLayerToggle(layer.id)
                          }}
                          size="large"
                          sx={{
                            minWidth: 40,
                            minHeight: 40,
                            "@media (max-width: 768px)": {
                              minWidth: 48,
                              minHeight: 48,
                            },
                          }}
                          aria-label={layer.visible ? "Ukryj warstwę" : "Pokaż warstwę"}
                        >
                          {layer.visible ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>

              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  )
}
