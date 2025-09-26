"use client"

import { useRef, useEffect, useState } from "react"
import { Box, Fab, Typography, Paper, Tooltip } from "@mui/material"
import { Add, Remove, MyLocation } from "@mui/icons-material"
import dynamic from "next/dynamic"
import { spacing, zIndex } from "@/lib/theme"

const mapboxgl = dynamic(() => import("mapbox-gl"), { ssr: false })

export interface InitialViewport {
  lng: number
  lat: number
  zoom: number
  pitch?: number
  bearing?: number
}

interface MapViewProps {
  initialViewport?: InitialViewport
  onMapLoad?: (map: mapboxgl.Map) => void
  onMapError?: (error: string) => void
}

/**
 * MapView component - Main map display with zoom controls and scale bar
 * Client component with dynamic import to prevent SSR issues
 *
 * @param initialViewport - Optional initial map viewport settings
 * @param onMapLoad - Callback when map is loaded
 * @param onMapError - Callback when map error occurs
 */
export function MapView({
  initialViewport = { lng: 19.9449799, lat: 50.0646501, zoom: 10 },
  onMapLoad,
  onMapError,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(initialViewport.zoom)
  const [scale, setScale] = useState("1:100000")

  // Get Mapbox token from environment
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken || mapRef.current) {
      return
    }

    let mounted = true

    const initializeMap = async () => {
      try {
        // Dynamic import mapbox-gl
        const mapboxgl = await import("mapbox-gl")

        // Set access token
        mapboxgl.default.accessToken = mapboxToken

        // Create map instance
        const map = new mapboxgl.default.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [initialViewport.lng, initialViewport.lat],
          zoom: initialViewport.zoom,
          pitch: initialViewport.pitch || 0,
          bearing: initialViewport.bearing || 0,
          antialias: true,
          maxZoom: 20,
          minZoom: 1,
        })

        if (!mounted) {
          map.remove()
          return
        }

        mapRef.current = map

        // Setup event listeners
        map.on("load", () => {
          if (!mounted) return
          setIsLoaded(true)
          console.log("[MapView] Map loaded successfully")
          onMapLoad?.(map)
        })

        map.on("error", (error) => {
          if (!mounted) return
          const errorMessage = error.error?.message || "Map error occurred"
          console.error("[MapView] Map error:", errorMessage)
          onMapError?.(errorMessage)
        })

        map.on("zoom", () => {
          if (!mounted) return
          const zoom = map.getZoom()
          setCurrentZoom(zoom)
          // Calculate approximate scale (simplified)
          const scale = Math.round(591657527.591555 / Math.pow(2, zoom))
          setScale(`1:${scale.toLocaleString()}`)
        })

        map.on("move", () => {
          if (!mounted) return
          // Update scale on move as well
          const zoom = map.getZoom()
          const scale = Math.round(591657527.591555 / Math.pow(2, zoom))
          setScale(`1:${scale.toLocaleString()}`)
        })
      } catch (error) {
        if (!mounted) return
        const errorMessage = error instanceof Error ? error.message : "Failed to initialize map"
        console.error("[MapView] Initialization error:", errorMessage)
        onMapError?.(errorMessage)
      }
    }

    initializeMap()

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mapboxToken, initialViewport, onMapLoad, onMapError])

  const handleZoomIn = () => {
    if (mapRef.current && isLoaded) {
      mapRef.current.zoomIn({ duration: 300 })
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current && isLoaded) {
      mapRef.current.zoomOut({ duration: 300 })
    }
  }

  const handleRecenter = () => {
    if (mapRef.current && isLoaded) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            mapRef.current?.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              duration: 1000,
            })
          },
          (error) => {
            console.warn("[MapView] Geolocation error:", error)
            // Fallback to initial viewport
            mapRef.current?.flyTo({
              center: [initialViewport.lng, initialViewport.lat],
              zoom: initialViewport.zoom,
              duration: 1000,
            })
          },
        )
      } else {
        // Fallback to initial viewport
        mapRef.current?.flyTo({
          center: [initialViewport.lng, initialViewport.lat],
          zoom: initialViewport.zoom,
          duration: 1000,
        })
      }
    }
  }

  if (!mapboxToken) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: spacing.lg,
        }}
      >
        <Paper sx={{ p: spacing.lg, textAlign: "center", maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom color="error">
            Brak tokenu Mapbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aby wyświetlić mapę, skonfiguruj token Mapbox w zmiennych środowiskowych.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Map Container */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: "100%",
          height: "100%",
          "& .mapboxgl-canvas": {
            outline: "none",
          },
          "& .mapboxgl-ctrl-attrib": {
            fontSize: "11px",
          },
        }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            zIndex: zIndex.modal,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Ładowanie mapy...
          </Typography>
        </Box>
      )}

      {/* Zoom Controls */}
      <Box
        sx={{
          position: "absolute",
          top: spacing.md,
          right: spacing.md,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          zIndex: zIndex.modal - 100,
        }}
      >
        <Tooltip title="Powiększ" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={handleZoomIn}
            disabled={!isLoaded}
            aria-label="Powiększ mapę"
            sx={{ boxShadow: 2 }}
          >
            <Add />
          </Fab>
        </Tooltip>

        <Tooltip title="Pomniejsz" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={handleZoomOut}
            disabled={!isLoaded}
            aria-label="Pomniejsz mapę"
            sx={{ boxShadow: 2 }}
          >
            <Remove />
          </Fab>
        </Tooltip>

        <Tooltip title="Wyśrodkuj na mojej lokalizacji" placement="left">
          <Fab
            size="small"
            color="secondary"
            onClick={handleRecenter}
            disabled={!isLoaded}
            aria-label="Wyśrodkuj na mojej lokalizacji"
            sx={{ boxShadow: 2 }}
          >
            <MyLocation />
          </Fab>
        </Tooltip>
      </Box>

      {/* Scale Bar */}
      <Paper
        sx={{
          position: "absolute",
          bottom: spacing.md,
          left: spacing.md,
          px: spacing.md,
          py: spacing.sm,
          zIndex: zIndex.modal - 100,
          bgcolor: "background.paper",
          opacity: 0.9,
        }}
      >
        <Typography variant="caption" component="div">
          Skala: {scale}
        </Typography>
      </Paper>
    </Box>
  )
}
