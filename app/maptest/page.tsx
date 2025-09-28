"use client"

import { Box, Typography, Paper, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useRouter } from "next/navigation"
import NoSSR from "@/components/NoSSR"
import SimpleMap from "@/components/SimpleMap"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function MapTestPage() {
  const router = useRouter()

  const handleMapLoad = (map: any) => {
    console.log("✅ Map loaded in test page:", map)
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: "divider" }}>
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

          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">
              🧪 Test mapy Mapbox
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diagnoza i testowanie komponentu mapy
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Map Container */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Paper sx={{ height: "100%", overflow: "hidden" }}>
          <NoSSR
            fallback={
              <Box sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#f5f5f5"
              }}>
                <Typography>🔄 Przygotowywanie mapy...</Typography>
              </Box>
            }
          >
            <SimpleMap onMapLoad={handleMapLoad} />
          </NoSSR>
        </Paper>
      </Box>

      {/* Debug Info */}
      <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          🔍 Debug Info:
        </Typography>
        <Typography variant="caption" sx={{ display: "block" }}>
          • Token: {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? "✅ Set" : "❌ Missing"}
        </Typography>
        <Typography variant="caption" sx={{ display: "block" }}>
          • Environment: {process.env.NODE_ENV}
        </Typography>
        <Typography variant="caption" sx={{ display: "block" }}>
          • Check browser console for detailed logs
        </Typography>
      </Paper>
    </Box>
  )
}