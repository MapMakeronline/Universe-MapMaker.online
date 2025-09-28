"use client"

import type React from "react"
import { useState } from "react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { CssBaseline } from "@mui/material"

// Simple theme without external dependencies
const createAppTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
  },
})

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [themeMode] = useState<'light' | 'dark'>('light')
  const theme = createAppTheme(themeMode)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeWrapper>{children}</ThemeWrapper>
  )
}
