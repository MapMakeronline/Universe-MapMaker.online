"use client"

import { Box } from "@mui/material"
import { MapView } from "@/components/ui/MapView"

/**
 * Main application page - displays the map view within the app layout
 */
export default function AppPage() {
  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <MapView />
    </Box>
  )
}
