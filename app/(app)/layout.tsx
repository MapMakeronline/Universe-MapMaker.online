"use client"

<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
/>

import type React from "react"

import { useState, useRef } from "react"
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
} from "@mui/material"
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material"
import { LayerPanel } from "@/components/ui/LayerPanel"
import { HelpDialog } from "@/components/ui/HelpDialog"
import { useGlobalHotkeys } from "@/hooks/useHotkeys"
import { spacing, zIndex } from "@/lib/theme"

const DRAWER_WIDTH = 300

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * Main application layout with AppBar, Sidebar (Layer Panel), and content area
 * Responsive: permanent drawer on desktop, swipeable drawer on mobile
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen)
  }

  const handleDrawerClose = () => {
    setMobileDrawerOpen(false)
  }

  const handleFocusSearch = () => {
    searchInputRef.current?.focus()
  }

  const handleShowHelp = () => {
    setHelpDialogOpen(true)
  }

  useGlobalHotkeys(handleDrawerToggle, handleFocusSearch, handleShowHelp)

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Mobile drawer header */}
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: spacing.md,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" component="h2">
            Warstwy
          </Typography>
          <IconButton
            onClick={handleDrawerClose}
            size="large"
            aria-label="Zamknij panel warstw"
            sx={{
              minWidth: 48,
              minHeight: 48,
              "@media (max-width: 768px)": {
                minWidth: 56,
                minHeight: 56,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Layer Panel Content */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <LayerPanel searchInputRef={searchInputRef} />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: zIndex.appBar,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="Otwórz panel warstw"
              edge="start"
              onClick={handleDrawerToggle}
              size="large"
              sx={{
                mr: spacing.md,
                minWidth: 48,
                minHeight: 48,
                "@media (max-width: 768px)": {
                  minWidth: 56,
                  minHeight: 56,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Universe MapMaker
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }} aria-label="Panel warstw">
        {isMobile ? (
          <SwipeableDrawer
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={handleDrawerClose}
            onOpen={() => setMobileDrawerOpen(true)}
            swipeAreaWidth={20}
            disableSwipeToOpen={false}
            hysteresis={0.52}
            minFlingVelocity={450}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_WIDTH,
                zIndex: zIndex.drawer,
              },
            }}
          >
            {drawerContent}
          </SwipeableDrawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_WIDTH,
                zIndex: zIndex.drawer,
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Toolbar spacer */}
        <Toolbar />

        {/* Content area */}
        <Box
          sx={{
            height: "calc(100vh - 64px)", // Subtract AppBar height
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>

      <HelpDialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />
    </Box>
  )
}
