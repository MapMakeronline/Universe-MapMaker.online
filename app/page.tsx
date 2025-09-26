"use client"

import { Box, Container, Typography, Paper } from "@mui/material"
import { MapContainer } from "@/components/map"
import { LayersPanel } from "@/components/panels/LayersPanel"
import { ParcelsPanel } from "@/components/panels/ParcelsPanel"
import { MeasurementPanel } from "@/components/panels/MeasurementPanel"
import { Toolbar } from "@/components/ui/Toolbar"
import { useAppSelector } from "@/state/hooks"
import { selectActivePanel } from "@/state/slices/uiSlice"

export default function HomePage() {
  const activePanel = useAppSelector(selectActivePanel)

  const renderActivePanel = () => {
    switch (activePanel) {
      case "layers":
        return <LayersPanel />
      case "parcels":
        return <ParcelsPanel />
      case "measurement":
        return <MeasurementPanel />
      default:
        return null
    }
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth={false}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Universe MapMaker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Profesjonalne narzędzie do tworzenia i analizy map
          </Typography>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Map Container */}
        <Box sx={{ flex: 1, position: "relative" }}>
          <MapContainer />

          {/* Floating Toolbar */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1000,
            }}
          >
            <Toolbar />
          </Box>
        </Box>

        {/* Side Panel */}
        {activePanel && (
          <Box
            sx={{
              width: 400,
              borderLeft: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {renderActivePanel()}
          </Box>
        )}
      </Box>
    </Box>
  )
}
