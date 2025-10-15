"use client"

import type React from "react"
import { useState } from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import Straighten from '@mui/icons-material/Straighten'
import MeasurementModal from '@/features/warstwy/modale/MeasurementModal'
import { useAppSelector } from "@/redux/hooks"

const MeasurementFAB: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)

  const { measurement } = useAppSelector((state) => state.draw)
  const isActive = measurement.isDistanceMode || measurement.isAreaMode

  return (
    <>
      <Fab
        onClick={() => setMeasurementModalOpen(true)}
        sx={{
          position: 'fixed',
          top: 296, // Under DocumentFAB
          right: 16,
          zIndex: 1400,
          width: 56,
          height: 56,
          bgcolor: isActive ? theme.palette.primary.dark : theme.palette.primary.main,
          color: 'white',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            transform: 'scale(1.05)',
          },
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Straighten sx={{ fontSize: 24 }} />
      </Fab>

      <MeasurementModal
        open={measurementModalOpen}
        onClose={() => setMeasurementModalOpen(false)}
      />
    </>
  )
}

export default MeasurementFAB
