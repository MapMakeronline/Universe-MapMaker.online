"use client"

import type React from "react"
import { useState } from "react"
import { Paper, IconButton, Tooltip, Box, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material"
import {
  Home,
  Place,
  Edit,
  DirectionsWalk,
  Straighten,
  Search,
  Info,
  Print,
  Description,
  MyLocation,
  ContentCut,
  Keyboard,
  Email,
  Settings,
  Map,
} from "@mui/icons-material"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setMeasurementMode, clearAllMeasurements } from "@/store/slices/drawSlice"
import { setMapStyle } from "@/store/slices/mapSlice"
import { MAP_STYLES } from "@/lib/mapbox/config"

const TOOLBAR_WIDTH = 56

const RightToolbar: React.FC = () => {
  const dispatch = useAppDispatch()
  const { measurement } = useAppSelector((state) => state.draw)
  const { mapStyle } = useAppSelector((state) => state.map)

  const [styleMenuAnchor, setStyleMenuAnchor] = useState<null | HTMLElement>(null)

  const handleDistanceMeasure = () => {
    dispatch(
      setMeasurementMode({
        distance: !measurement.isDistanceMode,
        area: false,
      }),
    )
  }

  const handleAreaMeasure = () => {
    dispatch(
      setMeasurementMode({
        distance: false,
        area: !measurement.isAreaMode,
      }),
    )
  }

  const handleClearMeasurements = () => {
    dispatch(clearAllMeasurements())
  }

  const handleStyleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStyleMenuAnchor(event.currentTarget)
  }

  const handleStyleMenuClose = () => {
    setStyleMenuAnchor(null)
  }

  const handleStyleChange = (styleUrl: string) => {
    dispatch(setMapStyle(styleUrl))
    handleStyleMenuClose()
  }

  const handleScreenshot = () => {
    // TODO: Implement map screenshot
    console.log("Screenshot feature coming soon...")
  }

  const handleAddMarker = () => {
    // TODO: Implement marker adding
    console.log("Add marker feature coming soon...")
  }

  interface Tool {
    id: string;
    icon?: any;
    tooltip?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    active?: boolean;
    disabled?: boolean;
  }

  const tools: Tool[] = [
    {
      id: "home",
      icon: Home,
      tooltip: "Strona główna",
      onClick: () => console.log("Home"),
      active: false,
    },
    { id: "divider-1" },
    {
      id: "location",
      icon: Place,
      tooltip: "Lokalizacja",
      onClick: handleAddMarker,
      active: false,
    },
    {
      id: "edit",
      icon: Edit,
      tooltip: "Edytuj",
      onClick: () => console.log("Edit"),
      active: false,
    },
    {
      id: "walk",
      icon: DirectionsWalk,
      tooltip: "Trasa piesza",
      onClick: () => console.log("Walking route"),
      active: false,
    },
    {
      id: "distance",
      icon: Straighten,
      tooltip: "Pomiar odległości",
      onClick: handleDistanceMeasure,
      active: measurement.isDistanceMode,
    },
    {
      id: "search",
      icon: Search,
      tooltip: "Szukaj",
      onClick: () => console.log("Search"),
      active: false,
    },
    {
      id: "info",
      icon: Info,
      tooltip: "Informacje",
      onClick: () => console.log("Info"),
      active: false,
    },
    {
      id: "print",
      icon: Print,
      tooltip: "Drukuj",
      onClick: handleScreenshot,
      active: false,
    },
    {
      id: "document",
      icon: Description,
      tooltip: "Dokument",
      onClick: () => console.log("Document"),
      active: false,
    },
    {
      id: "target",
      icon: MyLocation,
      tooltip: "Moja lokalizacja",
      onClick: () => console.log("My location"),
      active: false,
    },
    {
      id: "cut",
      icon: ContentCut,
      tooltip: "Wytnij",
      onClick: handleAreaMeasure,
      active: measurement.isAreaMode,
    },
    {
      id: "keyboard",
      icon: Keyboard,
      tooltip: "Skróty klawiszowe",
      onClick: () => console.log("Keyboard shortcuts"),
      active: false,
    },
    { id: "divider-2" },
    {
      id: "email",
      icon: Email,
      tooltip: "Kontakt",
      onClick: () => console.log("Contact"),
      active: false,
    },
    {
      id: "style",
      icon: Map,
      tooltip: "Zmień styl mapy",
      onClick: (e) => handleStyleMenuOpen(e),
      active: false,
    },
    {
      id: "settings",
      icon: Settings,
      tooltip: "Ustawienia",
      onClick: () => console.log("Settings"),
      active: false,
    },
  ]

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          width: TOOLBAR_WIDTH,
          maxHeight: "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 1,
          zIndex: 1200,
          borderRadius: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "action.hover",
            borderRadius: "4px",
            "&:hover": {
              background: "action.selected",
            },
          },
        }}
      >
        {tools.map((tool, index) => {
          if (tool.id.startsWith("divider")) {
            return (
              <Divider
                key={tool.id}
                sx={{
                  width: "100%",
                  my: 0.5,
                }}
              />
            )
          }

          const IconComponent = tool.icon!

          return (
            <Tooltip key={tool.id} title={tool.tooltip} placement="left">
              <span>
                <IconButton
                  onClick={event => tool.onClick?.(event)}
                  disabled={tool.disabled}
                  size="small"
                  sx={{
                    width: 40,
                    height: 40,
                    my: 0.5,
                    borderRadius: 1,
                    backgroundColor: tool.active ? 'primary.main' : 'transparent',
                    color: tool.active ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: tool.active ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <IconComponent sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>
          )
        })}

        {/* Measurement info */}
        {(measurement.isDistanceMode || measurement.isAreaMode) && (
          <Box
            sx={{
              position: "absolute",
              right: "100%",
              top: 0,
              mr: 1,
              bgcolor: "background.paper",
              color: "text.primary",
              p: 1.5,
              borderRadius: 1,
              boxShadow: 2,
              minWidth: 140,
              fontSize: "0.75rem",
              border: 1,
              borderColor: 'divider',
            }}
          >
            {measurement.isDistanceMode && "Kliknij punkty na mapie"}
            {measurement.isAreaMode && "Kliknij punkty obszaru"}
          </Box>
        )}
      </Paper>

      {/* Map Style Menu */}
      <Menu
        anchorEl={styleMenuAnchor}
        open={Boolean(styleMenuAnchor)}
        onClose={handleStyleMenuClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
      >
        {Object.entries(MAP_STYLES).map(([key, style]) => (
          <MenuItem
            key={key}
            onClick={() => handleStyleChange(style.style)}
            selected={mapStyle === style.style}
          >
            <ListItemIcon>
              <Map fontSize="small" />
            </ListItemIcon>
            <ListItemText>{style.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default RightToolbar