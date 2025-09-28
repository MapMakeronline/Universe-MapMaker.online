"use client"

import { useEffect, useRef } from "react"
import { Box, Typography } from "@mui/material"

export default function MapTestPage() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const initializeMap = async () => {
      try {
        console.log("🗺️ Starting SIMPLE Leaflet test...")

        // Import Leaflet
        const L = await import("leaflet")
        await import("leaflet/dist/leaflet.css")

        console.log("✅ Leaflet imported, version:", L.default.version)

        // Fix for default markers
        delete (L.default.Icon.Default.prototype as any)._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Create simple Leaflet map
        const map = L.default.map(mapContainer.current!, {
          center: [52.0, 19.0], // Poland
          zoom: 6,
          zoomControl: true
        })

        // Add OpenStreetMap tiles
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add a simple marker
        L.default.marker([52.2297, 21.0122])
          .addTo(map)
          .bindPopup('🏆 Warszawa - Sukces! Mapa działa!')
          .openPopup()

        console.log("🎯 SIMPLE Leaflet map loaded successfully!")

      } catch (err) {
        console.error("💥 Failed to load simple map:", err)
      }
    }

    initializeMap()
  }, [])

  return (
    <Box sx={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Box sx={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1000,
        bgcolor: "white",
        p: 1,
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="h6" sx={{ color: "#4CAF50", fontWeight: "bold" }}>
          🗺️ Simple Leaflet Test
        </Typography>
      </Box>
      <div
        ref={mapContainer}
        style={{
          height: "100%",
          width: "100%"
        }}
      />
    </Box>
  )
}