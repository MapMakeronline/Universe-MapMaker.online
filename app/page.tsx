"use client"

import { useState } from "react"
import { Box, Container, Typography, Paper, Button } from "@mui/material"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [message, setMessage] = useState("Universe MapMaker is ready for deployment!")

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 0,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            sx={{ color: "#2c3e50", mb: 1 }}
          >
            🗺️ Universe MapMaker
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 300 }}
          >
            Profesjonalne narzędzie do tworzenia i analizy map
          </Typography>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4
      }}>
        <Container maxWidth="md">
          <Paper
            elevation={6}
            sx={{
              p: 6,
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              textAlign: "center"
            }}
          >
            <Typography variant="h4" sx={{ mb: 3, color: "#2c3e50" }}>
              🚀 Aplikacja została pomyślnie wdrożona!
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, fontSize: "1.1rem", lineHeight: 1.6 }}>
              {message}
            </Typography>

            <Typography variant="caption" sx={{ display: "block", mb: 3, color: "success.main", fontWeight: "bold" }}>
              ✅ Mapbox GL JS + LayerTree • Hybrid fallback • Production Ready!
            </Typography>

            <Box sx={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  setMessage("Uruchamiam aplikację mapową Mapbox GL JS...")
                  setTimeout(() => router.push("/map"), 500)
                }}
                sx={{
                  px: 5,
                  py: 1.5,
                  background: "linear-gradient(45deg, #1976d2 30%, #1565c0 90%)",
                  boxShadow: "0 4px 8px 2px rgba(25, 118, 210, .3)",
                  fontSize: "1.1rem",
                  fontWeight: "bold"
                }}
              >
                🗺️ Otwórz Universe MapMaker
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  setMessage("Uruchamiam test Mapbox GL JS...")
                  setTimeout(() => router.push("/mapboxtest"), 500)
                }}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderColor: "#4CAF50",
                  color: "#4CAF50",
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "rgba(76, 175, 80, 0.1)"
                  }
                }}
              >
                🧪 Mapbox Test + LayerTree
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 4,
                color: "text.secondary",
                fontSize: "0.9rem"
              }}
            >
              Build: {new Date().toLocaleString()} | Status: Production Ready ✅
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}