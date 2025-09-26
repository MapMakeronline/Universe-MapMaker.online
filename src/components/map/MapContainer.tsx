"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Box, Alert, CircularProgress, Typography } from "@mui/material"
import { useAppSelector, useAppDispatch } from "@/state/hooks"
import { createMapInstance, isMapboxSupported } from "@/lib/mapbox/loader"
import { MapRuntime } from "@/lib/mapbox/runtime"
import type { MapInstance, MapEventHandlers } from "@/lib/mapbox/types"

interface MapContainerProps {
  accessToken: string
  style?: string
  center?: [number, number]
  zoom?: number
  onMapLoad?: (runtime: MapRuntime) => void
  onMapError?: (error: string) => void
  className?: string
}

export default function MapContainer({
  accessToken,
  style = "mapbox://styles/mapbox/streets-v12",
  center = [19.9449799, 50.0646501], // Kraków, Poland
  zoom = 10,
  onMapLoad,
  onMapError,
  className,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<MapInstance | null>(null)
  const mapRuntime = useRef<MapRuntime | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.ui.theme)

  // Check browser support
  useEffect(() => {
    isMapboxSupported().then(setIsSupported)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !accessToken || isSupported === false) {
      return
    }

    let mounted = true

    const initializeMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const instance = await createMapInstance({
          container: mapContainer.current!,
          style: theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : style,
          center,
          zoom,
          accessToken,
          minZoom: 1,
          maxZoom: 20,
          maxBounds: [
            [-180, -85],
            [180, 85],
          ], // World bounds
        })

        if (!mounted) return

        if (instance.error) {
          setError(instance.error)
          onMapError?.(instance.error)
          return
        }

        mapInstance.current = instance
        mapRuntime.current = new MapRuntime(instance.map)

        // Setup event handlers
        const eventHandlers: MapEventHandlers = {
          onLoad: () => {
            if (!mounted) return
            setIsLoading(false)
            console.log("[MapContainer] Map loaded successfully")
            onMapLoad?.(mapRuntime.current!)
          },
          onError: (error) => {
            if (!mounted) return
            const errorMessage = error.message || "Map error occurred"
            setError(errorMessage)
            onMapError?.(errorMessage)
          },
          onClick: (event) => {
            console.log("[MapContainer] Map clicked:", event.lngLat)
          },
          onMove: (event) => {
            // Handle map move events
          },
          onZoom: (event) => {
            // Handle zoom events
          },
        }

        mapRuntime.current.setEventHandlers(eventHandlers)
      } catch (err) {
        if (!mounted) return
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize map"
        setError(errorMessage)
        onMapError?.(errorMessage)
      }
    }

    initializeMap()

    return () => {
      mounted = false
      if (mapRuntime.current) {
        mapRuntime.current.destroy()
        mapRuntime.current = null
      }
      if (mapInstance.current?.map) {
        mapInstance.current.map.remove()
        mapInstance.current = null
      }
    }
  }, [accessToken, style, center, zoom, theme, onMapLoad, onMapError, isSupported])

  // Handle theme changes
  useEffect(() => {
    if (mapInstance.current?.map && mapRuntime.current) {
      const newStyle = theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : style
      mapInstance.current.map.setStyle(newStyle)
    }
  }, [theme, style])

  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    // Force re-initialization by changing a key prop or calling init again
    window.location.reload()
  }, [])

  // Browser not supported
  if (isSupported === false) {
    return (
      <Box className={className} sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Przeglądarka nie jest obsługiwana
          </Typography>
          <Typography variant="body2">
            Twoja przeglądarka nie obsługuje WebGL, który jest wymagany do wyświetlania map. Spróbuj zaktualizować
            przeglądarkę lub użyj innej.
          </Typography>
        </Alert>
      </Box>
    )
  }

  // Loading state
  if (isLoading && !error) {
    return (
      <Box
        className={className}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          p: 3,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Ładowanie mapy...
        </Typography>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box className={className} sx={{ p: 3 }}>
        <Alert severity="error" action={<button onClick={handleRetry}>Spróbuj ponownie</button>}>
          <Typography variant="h6" gutterBottom>
            Błąd ładowania mapy
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box
      ref={mapContainer}
      className={className}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        "& .mapboxgl-canvas": {
          outline: "none",
        },
        "& .mapboxgl-ctrl-attrib": {
          fontSize: "11px",
        },
      }}
    />
  )
}
