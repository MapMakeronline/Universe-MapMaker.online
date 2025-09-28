"use client"

import NoSSR from "@/components/NoSSR"
import MapApplication from "@/components/MapApplication"
import { Box, Typography } from "@mui/material"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function MapPage() {
  return (
    <NoSSR
      fallback={
        <Box sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
          flexDirection: "column",
          gap: 3
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            border: "6px solid #1976d2",
            borderTop: "6px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" }
            }
          }} />
          <Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold" }}>
            🗺️ Universe MapMaker
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Inicjalizacja aplikacji mapowej...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: "center" }}>
            Ładowanie komponentów Mapbox GL, LayerTree i interfejsu użytkownika
          </Typography>
        </Box>
      }
    >
      <MapApplication />
    </NoSSR>
  )
}