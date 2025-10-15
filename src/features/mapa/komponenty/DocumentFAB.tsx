"use client"

import type React from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import Description from '@mui/icons-material/Description'

const DocumentFAB: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleClick = () => {
    // TODO: Implement document (wypis i wyrys) functionality
    console.log("Document feature coming soon...")
  }

  const fabRightPosition = isMobile ? '16px' : '24px'

  return (
    <Fab
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: 240,
        right: fabRightPosition,
        zIndex: 1400,
        width: isMobile ? 64 : 56,
        height: isMobile ? 64 : 56,
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
      <Description sx={{ fontSize: isMobile ? 32 : 24 }} />
    </Fab>
  )
}

export default DocumentFAB
