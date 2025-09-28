"use client"

import { useEffect, useRef, useState } from "react"
import { Box, Typography } from "@mui/material"

// Dynamic import to ensure client-side only
const initializeMap = async (container: HTMLDivElement) => {
  try {
    // Check if token exists
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    console.log("🔑 Mapbox token check:", token ? "Token available" : "❌ NO TOKEN")

    if (!token) {
      throw new Error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is not set")
    }

    // Dynamic import of mapbox-gl
    const mapboxgl = await import("mapbox-gl")
    await import("mapbox-gl/dist/mapbox-gl.css")

    console.log("📦 Mapbox GL loaded:", mapboxgl.default.version)

    // Set access token
    mapboxgl.default.accessToken = token

    // Create map
    const map = new mapboxgl.default.Map({
      container: container,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [19.0, 52.0], // Poland center
      zoom: 6
    })

    console.log("🗺️ Map instance created")

    // Add load event
    map.on("load", () => {
      console.log("✅ Map loaded successfully!")
    })

    // Add error handling
    map.on("error", (e) => {
      console.error("❌ Map error:", e.error)
    })

    return map
  } catch (error) {
    console.error("❌ Map initialization error:", error)
    throw error
  }
}

export interface SimpleMapProps {
  onMapLoad?: (map: any) => void
}

export default function SimpleMap({ onMapLoad }: SimpleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    console.log("🚀 Starting map initialization...")

    initializeMap(mapContainer.current)
      .then((map) => {
        setMapInstance(map)
        setIsLoading(false)
        onMapLoad?.(map)

        map.on("load", () => {
          console.log("🎯 Map fully loaded and ready")
        })
      })
      .catch((err) => {
        console.error("💥 Failed to initialize map:", err)
        setError(err.message)
        setIsLoading(false)
      })

    return () => {
      if (mapInstance) {
        console.log("🧹 Cleaning up map")
        mapInstance.remove()
      }
    }
  }, [])

  if (error) {
    return (
      <Box sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#ffebee",
        flexDirection: "column",
        p: 3
      }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          ❌ Błąd ładowania mapy
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", mb: 2 }}>
          {error}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sprawdź console przeglądarki dla więcej szczegółów
        </Typography>
      </Box>
    )
  }

  if (isLoading) {
    return (
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
          width: 50,
          height: 50,
          border: "4px solid #1976d2",
          borderTop: "4px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" }
          }
        }} />
        <Typography variant="body1" color="primary">
          🗺️ Ładowanie mapy Mapbox GL...
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Inicjalizacja biblioteki mapowej
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%"
        }}
      />

      {/* Debug info */}
      <Box sx={{
        position: "absolute",
        top: 10,
        left: 10,
        bgcolor: "rgba(0,0,0,0.7)",
        color: "white",
        p: 1,
        borderRadius: 1,
        fontSize: "12px",
        zIndex: 1000
      }}>
        🗺️ Map: {mapInstance ? "Active" : "Loading"}
      </Box>
    </Box>
  )
}