"use client"

import type React from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import FlightTakeoff from '@mui/icons-material/FlightTakeoff'

const DroneFAB: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleClick = () => {
    // TODO: Implement drone functionality
    console.log("Drone feature coming soon...")
  }

  return (
    <Fab
      onClick={handleClick}
      sx={{
        position: 'fixed',
        top: 156, // Under SearchFAB
        right: 16,
        zIndex: 1400,
        width: 56,
        height: 56,
        bgcolor: theme.palette.primary.main,
        color: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: theme.palette.primary.dark,
          transform: 'scale(1.05)',
        },
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <FlightTakeoff sx={{ fontSize: 24 }} />
    </Fab>
  )
}

export default DroneFAB
