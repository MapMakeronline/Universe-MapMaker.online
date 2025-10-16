"use client"

import type React from "react"
import { useRef } from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import Draggable from 'react-draggable'
import Paper, { PaperProps } from '@mui/material/Paper'

// Draggable Paper Component
function DraggablePaper(props: PaperProps) {
  const nodeRef = useRef<HTMLDivElement>(null)

  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper ref={nodeRef} {...props} />
    </Draggable>
  )
}

export interface DraggableDialogProps extends Omit<DialogProps, 'title'> {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
  hideBackdrop?: boolean
  showDragIcon?: boolean
  headerColor?: string
  contentColor?: string
}

/**
 * DraggableDialog - Universal draggable modal component
 *
 * Features:
 * - Draggable on desktop (grab by header)
 * - Fullscreen on mobile
 * - Optional backdrop removal for map interaction
 * - Customizable colors
 * - Drag indicator icon
 *
 * Example usage:
 * ```tsx
 * <DraggableDialog
 *   open={open}
 *   onClose={handleClose}
 *   title="My Dialog"
 *   hideBackdrop
 *   actions={
 *     <Button onClick={handleSave}>Save</Button>
 *   }
 * >
 *   <Typography>Content here</Typography>
 * </DraggableDialog>
 * ```
 */
export const DraggableDialog: React.FC<DraggableDialogProps> = ({
  title,
  onClose,
  children,
  actions,
  hideBackdrop = false,
  showDragIcon = true,
  headerColor = '#2c3e50',
  contentColor = '#ecf0f1',
  maxWidth = 'sm',
  fullWidth = true,
  PaperProps = {},
  ...dialogProps
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={isMobile}
      PaperComponent={isMobile ? Paper : DraggablePaper}
      aria-labelledby="draggable-dialog-title"
      hideBackdrop={hideBackdrop && !isMobile}
      disableScrollLock={hideBackdrop && !isMobile}
      PaperProps={{
        ...PaperProps,
        sx: {
          borderRadius: isMobile ? 0 : '12px',
          m: 0,
          boxShadow: hideBackdrop && !isMobile
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : undefined,
          ...PaperProps.sx,
        }
      }}
      onClose={onClose}
      {...dialogProps}
    >
      {/* Header - Draggable */}
      <DialogTitle
        id="draggable-dialog-title"
        sx={{
          bgcolor: headerColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '18px',
          fontWeight: 600,
          cursor: isMobile ? 'default' : 'move',
          userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isMobile && showDragIcon && (
            <DragIndicatorIcon
              sx={{
                fontSize: '20px',
                opacity: 0.7,
                mr: 0.5
              }}
            />
          )}
          {title}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: contentColor,
          px: 3,
          py: 3,
        }}
      >
        {children}
      </DialogContent>

      {/* Footer */}
      {actions && (
        <DialogActions
          sx={{
            bgcolor: contentColor,
            px: 3,
            pb: 3,
            pt: 0,
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default DraggableDialog
