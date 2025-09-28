"use client"

import { useState } from "react"
import { Box, Typography, Paper, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamic import to prevent SSR issues
const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#f5f5f5",
      flexDirection: "column",
      gap: 2
    }}>
      <Box sx={{
        width: 60,
        height: 60,
        border: "4px solid #1976d2",
        borderTop: "4px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }} />
      <Typography variant="h6" color="primary">
        🗺️ Ładowanie mapy...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Próba Mapbox → fallback OpenStreetMap
      </Typography>
    </Box>
  )
})

export default function HybridTestPage() {
  const router = useRouter()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapType, setMapType] = useState<string>("...")

  const handleMapLoad = (map: any) => {
    console.log("✅ Map loaded in hybrid test:", map)
    setMapLoaded(true)

    // Detect which map type loaded
    if (map.getStyle && map.addSource) {
      setMapType("Mapbox GL JS")
    } else if (map.addLayer && map._layers) {
      setMapType("Leaflet (OpenStreetMap)")
    } else {
      setMapType("Unknown")
    }
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: "divider", zIndex: 1100 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => router.push("/")}
            sx={{
              background: "rgba(25, 118, 210, 0.1)",
              "&:hover": { background: "rgba(25, 118, 210, 0.2)" }
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h1" fontWeight="bold">
              🧪 Hybrid Map Test
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mapbox GL JS → OpenStreetMap fallback • Status: {mapLoaded ? `✅ ${mapType}` : "🔄 Ładowanie..."}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Map Container */}
      <Box sx={{ flex: 1, position: "relative" }}>
        <MapboxMap onMapLoad={handleMapLoad} />

        {/* Info Panel */}
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <Paper sx={{ p: 2, opacity: 0.95, bgcolor: "background.paper" }}>
            <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
              🗺️ {mapType}
            </Typography>
            <Typography variant="caption" sx={{ display: "block" }}>
              📍 Centrum: Polska (52.0°N, 19.0°E)
            </Typography>
            <Typography variant="caption" sx={{ display: "block" }}>
              🎯 Status: {mapLoaded ? "Aktywna" : "Ładowanie..."}
            </Typography>
            <Typography variant="caption" sx={{ display: "block" }}>
              🔄 Automatyczny fallback: OpenStreetMap
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}