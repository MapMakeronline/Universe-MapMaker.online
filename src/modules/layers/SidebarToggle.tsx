/**
 * SidebarToggle - Przycisk toggle dla panelu warstw
 * Zintegrowany z Redux state
 */

'use client'

import React from 'react'
import { IconButton, alpha } from '@mui/material'
import { Layers as LayersIcon } from '@mui/icons-material'
import { useLayerTree, useLayerActions } from '../../state/layers/hooks'

interface SidebarToggleProps {
  /**
   * Position from top in pixels
   */
  top?: number
  /**
   * Position from left when sidebar is closed
   */
  leftClosed?: number
  /**
   * Offset from sidebar width when sidebar is open
   */
  sidebarOffset?: number
  /**
   * Sidebar width to calculate position
   */
  sidebarWidth?: number
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  top = 20,
  leftClosed = 20,
  sidebarOffset = 20,
  sidebarWidth = 320
}) => {
  const { sidebarOpen } = useLayerTree()
  const { onToggleSidebar } = useLayerActions()

  const leftPosition = sidebarOpen ? sidebarWidth + sidebarOffset : leftClosed

  return (
    <IconButton
      onClick={onToggleSidebar}
      sx={{
        position: 'fixed',
        top: top,
        left: leftPosition,
        zIndex: 1200,
        bgcolor: 'background.paper',
        boxShadow: 2,
        transition: (theme) => theme.transitions.create('left', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        },
        '&:active': {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
        }
      }}
      aria-label={sidebarOpen ? 'Zamknij panel warstw' : 'Otwórz panel warstw'}
    >
      <LayersIcon color={sidebarOpen ? 'primary' : 'inherit'} />
    </IconButton>
  )
}

export default SidebarToggle