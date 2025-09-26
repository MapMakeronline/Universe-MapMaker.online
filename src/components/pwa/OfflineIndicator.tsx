"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Chip } from "@mui/material"
import { WifiOff as OfflineIcon, Wifi as OnlineIcon } from "@mui/icons-material"

/**
 * Offline Indicator Component
 * Shows connection status and offline capabilities
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      setShowIndicator(!online)

      if (!online) {
        console.log("[PWA] App is offline")
      } else {
        console.log("[PWA] App is online")
        // Hide indicator after 3 seconds when back online
        setTimeout(() => setShowIndicator(false), 3000)
      }
    }

    // Set initial status
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  if (!showIndicator) {
    return null
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1300,
      }}
    >
      <Chip
        icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
        label={<Typography variant="caption">{isOnline ? "Połączenie przywrócone" : "Tryb offline"}</Typography>}
        color={isOnline ? "success" : "warning"}
        variant="filled"
        sx={{
          boxShadow: 2,
        }}
      />
    </Box>
  )
}
