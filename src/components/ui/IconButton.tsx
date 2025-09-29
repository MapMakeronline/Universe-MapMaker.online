/**
 * IconButton - Floating Action Button do otwierania drawera
 */

import React from 'react'
import { Fab, Tooltip } from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'

interface IconButtonProps {
  onClick: () => void
  isOpen: boolean
  className?: string
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, isOpen, className }) => {
  return (
    <Tooltip title={isOpen ? "Zamknij warstwy" : "Otwórz warstwy"} arrow>
      <Fab
        color="primary"
        onClick={onClick}
        className={className}
        sx={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1300,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: isOpen ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'
          }
        }}
      >
        <LayersIcon />
      </Fab>
    </Tooltip>
  )
}

export default IconButton