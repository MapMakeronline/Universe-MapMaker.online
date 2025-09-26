"use client"

import { useState } from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Collapse,
  Divider,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material"
import { ExpandLess, ExpandMore, Search, Settings, Add } from "@mui/icons-material"
import { Panel } from "@/components/ui/Panel"
import { Button } from "@/components/ui/Button"
import { useAppSelector, useAppDispatch } from "@/state/hooks"
import {
  selectLayerGroups,
  selectVisibleLayers,
  toggleLayerVisibility,
  toggleGroupExpanded,
  selectExpandedGroups,
} from "@/state/slices/layersSlice"

export function LayersPanel() {
  const dispatch = useAppDispatch()
  const layerGroups = useAppSelector(selectLayerGroups)
  const visibleLayers = useAppSelector(selectVisibleLayers)
  const expandedGroups = useAppSelector(selectExpandedGroups)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredGroups = layerGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.layers.some((layer) => layer.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <Panel title="Warstwy" onClose={() => {}}>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Szukaj warstw..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Add Layer Button */}
        <Button
          variant="outlined"
          startIcon={<Add />}
          fullWidth
          onClick={() => {
            // TODO: Open add layer dialog
          }}
        >
          Dodaj warstwę
        </Button>

        <Divider />

        {/* Layer Groups */}
        <List sx={{ flex: 1, overflow: "auto" }}>
          {filteredGroups.map((group) => (
            <Box key={group.id}>
              <ListItem button onClick={() => dispatch(toggleGroupExpanded(group.id))} sx={{ pl: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {group.name}
                      </Typography>
                      <Chip label={group.layers.length} size="small" variant="outlined" />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton size="small">
                    <Settings fontSize="small" />
                  </IconButton>
                  {expandedGroups.includes(group.id) ? <ExpandLess /> : <ExpandMore />}
                </ListItemSecondaryAction>
              </ListItem>

              <Collapse in={expandedGroups.includes(group.id)}>
                <List sx={{ pl: 2 }}>
                  {group.layers.map((layer) => (
                    <ListItem key={layer.id} dense>
                      <ListItemText
                        primary={layer.name}
                        secondary={layer.source}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={visibleLayers.includes(layer.id)}
                          onChange={() => dispatch(toggleLayerVisibility(layer.id))}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
      </Box>
    </Panel>
  )
}
