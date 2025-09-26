"use client"

import { useState } from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Chip,
} from "@mui/material"
import { Straighten, CropFree, Delete, Clear, History } from "@mui/icons-material"
import { Panel } from "@/components/ui/Panel"
import { Button } from "@/components/ui/Button"
import { useAppSelector, useAppDispatch } from "@/state/hooks"
import {
  selectMeasurementMode,
  selectMeasurements,
  selectMeasurementHistory,
  setMode,
  clearMeasurements,
  deleteMeasurement,
} from "@/state/slices/measurementSlice"

export function MeasurementPanel() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectMeasurementMode)
  const measurements = useAppSelector(selectMeasurements)
  const history = useAppSelector(selectMeasurementHistory)

  const [showHistory, setShowHistory] = useState(false)

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance.toFixed(2)} m`
    }
    return `${(distance / 1000).toFixed(2)} km`
  }

  const formatArea = (area: number) => {
    if (area < 10000) {
      return `${area.toFixed(2)} m²`
    }
    return `${(area / 10000).toFixed(2)} ha`
  }

  return (
    <Panel title="Pomiary" onClose={() => {}}>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Measurement Mode */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Tryb pomiaru
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => newMode && dispatch(setMode(newMode))}
            fullWidth
            size="small"
          >
            <ToggleButton value="distance">
              <Straighten fontSize="small" sx={{ mr: 1 }} />
              Odległość
            </ToggleButton>
            <ToggleButton value="area">
              <CropFree fontSize="small" sx={{ mr: 1 }} />
              Powierzchnia
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Current Measurements */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2">Aktualne pomiary</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Clear />}
              onClick={() => dispatch(clearMeasurements())}
              disabled={measurements.length === 0}
            >
              Wyczyść
            </Button>
          </Box>

          <List sx={{ maxHeight: 200, overflow: "auto" }}>
            {measurements.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Brak pomiarów"
                  secondary="Kliknij na mapie, aby rozpocząć pomiar"
                  primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            ) : (
              measurements.map((measurement) => (
                <ListItem key={measurement.id} dense>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">
                          {measurement.type === "distance" ? "Odległość" : "Powierzchnia"}
                        </Typography>
                        <Chip
                          label={
                            measurement.type === "distance"
                              ? formatDistance(measurement.value)
                              : formatArea(measurement.value)
                          }
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={new Date(measurement.timestamp).toLocaleString()}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => dispatch(deleteMeasurement(measurement.id))}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Box>

        <Divider />

        {/* History Toggle */}
        <Button variant="outlined" startIcon={<History />} onClick={() => setShowHistory(!showHistory)} fullWidth>
          {showHistory ? "Ukryj historię" : "Pokaż historię"}
        </Button>

        {/* History */}
        {showHistory && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Historia pomiarów
            </Typography>
            <List sx={{ maxHeight: 150, overflow: "auto" }}>
              {history.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="Brak historii"
                    primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                  />
                </ListItem>
              ) : (
                history.map((measurement) => (
                  <ListItem key={measurement.id} dense>
                    <ListItemText
                      primary={
                        measurement.type === "distance"
                          ? formatDistance(measurement.value)
                          : formatArea(measurement.value)
                      }
                      secondary={new Date(measurement.timestamp).toLocaleString()}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        )}
      </Box>
    </Panel>
  )
}
