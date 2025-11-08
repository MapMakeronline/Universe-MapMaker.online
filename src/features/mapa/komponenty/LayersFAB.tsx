"use client"

import type React from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import Badge from '@mui/material/Badge'
import Layers from '@mui/icons-material/Layers'

interface LayersFABProps {
  isOpen: boolean
  layersCount: number
  onToggle: () => void
  attributeTableHeight?: number // Height of attribute table panel (if open)
}

const LayersFAB: React.FC<LayersFABProps> = ({ isOpen, layersCount, onToggle, attributeTableHeight = 0 }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Szerokość LeftPanel (drzewa warstw)
  const LEFT_PANEL_WIDTH = 320

  // Haptic feedback for mobile
  const handleClick = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    onToggle()
  }

  // Calculate bottom position: default 16px + attribute table height (if open)
  const bottomPosition = 16 + attributeTableHeight

  return (
    <Fab
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: bottomPosition,
        // FAB przesuwa się razem z drzewem warstw
        left: isOpen ? LEFT_PANEL_WIDTH + 16 : 16,
        zIndex: 1400,
        width: 56,
        height: 56,
        bgcolor: isOpen ? theme.palette.primary.dark : theme.palette.primary.main,
        color: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: isOpen ? theme.palette.primary.dark : theme.palette.primary.dark,
          transform: 'scale(1.05)',
        },
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        // Subtle pulse animation when closed (hint for new users)
        animation: !isOpen ? 'pulse 2s ease-in-out infinite' : 'none',
        '@keyframes pulse': {
          '0%': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          '50%': {
            boxShadow: `0 4px 20px ${theme.palette.primary.main}80`,
          },
          '100%': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      }}
    >
      <Badge
        badgeContent={layersCount}
        color="secondary"
        sx={{
          '& .MuiBadge-badge': {
            right: -3,
            top: 3,
            fontSize: '10px',
            minWidth: '18px',
            height: '18px',
          }
        }}
      >
        <Layers sx={{ fontSize: 24 }} />
      </Badge>
    </Fab>
  )
}

export default LayersFAB
