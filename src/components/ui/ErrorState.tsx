"use client"

import type React from "react"
import { Box, Typography, Button, Alert } from "@mui/material"
import { ErrorOutline, Refresh } from "@mui/icons-material"
import { styled } from "@mui/material/styles"

export interface ErrorStateProps {
  /**
   * Error title
   */
  title?: string
  /**
   * Error message
   */
  message: string
  /**
   * Detailed error information
   */
  details?: string
  /**
   * Retry action
   */
  onRetry?: () => void
  /**
   * Whether to show as inline alert instead of full state
   * @default false
   */
  inline?: boolean
  /**
   * Error severity
   * @default 'error'
   */
  severity?: "error" | "warning"
}

const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: theme.spacing(4),
  minHeight: 200,
}))

const IconContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& svg": {
    fontSize: 64,
    color: theme.palette.error.main,
  },
}))

const ActionsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}))

/**
 * Error state component for displaying error messages with retry functionality
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load data"
 *   message="Unable to connect to the server"
 *   details="Network error: Connection timeout"
 *   onRetry={handleRetry}
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Wystąpił błąd",
  message,
  details,
  onRetry,
  inline = false,
  severity = "error",
}) => {
  if (inline) {
    return (
      <Alert
        severity={severity}
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry} startIcon={<Refresh />}>
              Spróbuj ponownie
            </Button>
          )
        }
      >
        <Typography variant="body2" component="div">
          <strong>{title}</strong>
        </Typography>
        <Typography variant="body2">{message}</Typography>
        {details && (
          <Typography variant="caption" component="div" sx={{ mt: 1 }}>
            {details}
          </Typography>
        )}
      </Alert>
    )
  }

  return (
    <Container>
      <IconContainer>
        <ErrorOutline />
      </IconContainer>
      <Typography variant="h6" color="error" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.primary" gutterBottom>
        {message}
      </Typography>
      {details && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          {details}
        </Typography>
      )}
      {onRetry && (
        <ActionsContainer>
          <Button variant="contained" onClick={onRetry} startIcon={<Refresh />}>
            Spróbuj ponownie
          </Button>
        </ActionsContainer>
      )}
    </Container>
  )
}
