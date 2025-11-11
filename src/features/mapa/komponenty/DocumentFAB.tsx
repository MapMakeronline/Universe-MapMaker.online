"use client"

import React, { useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import Description from '@mui/icons-material/Description'

import { useGetWypisConfigurationsQuery } from '@/backend/projects'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { openGenerateModal, setHasConfigurations, selectHasConfigurations } from '@/redux/slices/wypisSlice'

interface DocumentFABProps {
  projectName: string
}

/**
 * DocumentFAB - Floating Action Button for Wypis i Wyrys
 *
 * Features:
 * - Conditional rendering (show only if configurations exist)
 * - Opens WypisGenerateDialog on click
 * - Positioned in right toolbar
 *
 * IMPORTANT: This FAB appears ONLY when at least one wypis configuration exists
 */
const DocumentFAB: React.FC<DocumentFABProps> = ({ projectName }) => {
  const theme = useTheme()
  const dispatch = useAppDispatch()

  // Redux state
  const hasConfigurations = useAppSelector(selectHasConfigurations)

  // Check if configurations exist
  const { data: response, isLoading } = useGetWypisConfigurationsQuery(
    { project: projectName },
    { skip: !projectName }
  )

  // Update hasConfigurations flag
  useEffect(() => {
    if (response?.success && response.data?.config_structure) {
      const hasConfigs = response.data.config_structure.length > 0
      dispatch(setHasConfigurations(hasConfigs))
    }
  }, [response, dispatch])

  const handleClick = () => {
    // Open generate modal (auto-selects first config)
    dispatch(openGenerateModal(null))
  }

  // Don't render if no configurations or still loading
  if (isLoading || !hasConfigurations) {
    return null
  }

  return (
    <Tooltip title="Wypis i wyrys" placement="left">
      <Fab
        onClick={handleClick}
        sx={{
          position: 'fixed',
          top: 86, // Position between UserFAB and red FABs (16 + 56 + 14 spacing)
          right: 16,
          zIndex: 1400,
          width: 56,
          height: 56,
          bgcolor: '#2c3e50',
          color: 'white',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: '#34495e',
            transform: 'scale(1.05)',
          },
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Description sx={{ fontSize: 24 }} />
      </Fab>
    </Tooltip>
  )
}

export default DocumentFAB
