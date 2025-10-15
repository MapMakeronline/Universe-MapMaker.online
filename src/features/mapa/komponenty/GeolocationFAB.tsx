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

  return (
    <Fab
      onClick={handleGeolocation}
      sx={{
        position: 'fixed',
        bottom: 86, // Above QGISIdentifyTool (16 + 56 + 14 spacing)
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
      <MyLocation sx={{ fontSize: 24 }} />
    </Fab>
  )
}

export default GeolocationFAB
