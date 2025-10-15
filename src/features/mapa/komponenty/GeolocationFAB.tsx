"use client"

import type React from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useMap } from 'react-map-gl'
import Fab from '@mui/material/Fab'
import MyLocation from '@mui/icons-material/MyLocation'

const GeolocationFAB: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { current: map } = useMap()

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map?.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 1500,
            essential: true,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Nie można pobrać lokalizacji. Sprawdź uprawnienia przeglądarki.')
        }
      )
    } else {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.')
    }
  }

  const fabRightPosition = isMobile ? '16px' : '24px'

  return (
    <Fab
      onClick={handleGeolocation}
      sx={{
        position: 'fixed',
        bottom: 16,
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
      <MyLocation sx={{ fontSize: isMobile ? 32 : 24 }} />
    </Fab>
  )
}

export default GeolocationFAB
