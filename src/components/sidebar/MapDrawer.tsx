/**
 * MapDrawer - Główny komponent drawera z drzewem warstw
 */

'use client'

import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { layerCategories } from '../../data/mapLayers'
import { MapDrawerProps } from '../../types/layers.types'
import styles from './sidebar.module.css'

const MapDrawer: React.FC<MapDrawerProps> = ({
  isOpen,
  onClose,
  anchor = 'left',
  width = 320,
  showResetButton = true,
  onReset,
  children
}) => {
  return (
    <Drawer
      anchor={anchor}
      open={isOpen}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box className={styles.drawerContent}>
        {/* Header */}
        <Box className={styles.drawerHeader}>
          <Typography variant="h6" className={styles.drawerTitle}>
            🗺️ Warstwy mapy
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            className={styles.closeButton}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Content */}
        <Box className={styles.drawerBody}>
          {children || (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              Drzewo warstw zostanie tutaj wyświetlone
            </Typography>
          )}
        </Box>

        {/* Footer z przyciskiem reset */}
        {showResetButton && (
          <>
            <Divider />
            <Box className={styles.drawerFooter}>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={onReset}
                fullWidth
                size="small"
              >
                Reset warstw
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}

export default MapDrawer