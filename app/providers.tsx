"use client"

import type React from "react"
import { useEffect } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { ThemeProvider } from "@mui/material/styles"
import { CssBaseline } from "@mui/material"
import { store, persistor } from "@/state/store"
import { createAppTheme } from "@/lib/theme"
import { useAppSelector } from "@/state/hooks"
import { selectThemeMode } from "@/state/slices/uiSlice"
import InstallPrompt from "@/components/pwa/InstallPrompt"
import OfflineIndicator from "@/components/pwa/OfflineIndicator"
import { initializePWA } from "@/lib/pwa/service-worker"

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const themeMode = useAppSelector(selectThemeMode)
  const theme = createAppTheme(themeMode)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <InstallPrompt />
      <OfflineIndicator />
    </ThemeProvider>
  )
}

function PWAWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PWA features on client side
    initializePWA()
  }, [])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PWAWrapper>
          <ThemeWrapper>{children}</ThemeWrapper>
        </PWAWrapper>
      </PersistGate>
    </Provider>
  )
}
