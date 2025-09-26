"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Box, Typography, IconButton } from "@mui/material"
import { Close as CloseIcon, GetApp as InstallIcon } from "@mui/icons-material"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * PWA Install Prompt Component
 * Shows install prompt for PWA when available
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
        setIsInstalled(true)
        return
      }
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setShowPrompt(true)
      console.log("[PWA] Install prompt available")
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      console.log("[PWA] App installed successfully")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted install prompt")
      } else {
        console.log("[PWA] User dismissed install prompt")
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("[PWA] Install prompt failed:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Hide for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true")
  }

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showPrompt || sessionStorage.getItem("pwa-prompt-dismissed")) {
    return null
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 1300,
        maxWidth: 400,
        mx: "auto",
      }}
    >
      <Card
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          boxShadow: 3,
        }}
      >
        <InstallIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Zainstaluj Universe MapMaker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dodaj aplikację do ekranu głównego dla szybszego dostępu
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" size="small" onClick={handleInstallClick}>
            Zainstaluj
          </Button>
          <IconButton size="small" onClick={handleDismiss}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Card>
    </Box>
  )
}
