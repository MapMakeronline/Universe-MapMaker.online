"use client"

import type React from "react"
import { useState } from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import Search from '@mui/icons-material/Search'
import SearchModal from '@/features/mapa/interakcje/SearchModal'

const SearchFAB: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [searchModalOpen, setSearchModalOpen] = useState(false)

  const fabRightPosition = isMobile ? '16px' : '24px'

  return (
    <>
      <Fab
        onClick={() => setSearchModalOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 310,
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
        <Search sx={{ fontSize: isMobile ? 32 : 24 }} />
      </Fab>

      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  )
}

export default SearchFAB
