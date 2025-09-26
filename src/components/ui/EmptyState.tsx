"use client"

import type React from "react"
import { Box, Typography, Button } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface EmptyStateProps {
  /**
   * Icon or illustration to display
   */
  icon?: React.ReactNode
  /**
   * Primary message
   */
  title: string
  /**
   * Secondary message
   */
  description?: string
  /**
   * Action button
   */
  action?: {
    label: string
    onClick: () => void
    variant?: "contained" | "outlined" | "text"
  }
  /**
   * Additional actions
   */
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "contained" | "outlined" | "text"
  }
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
  opacity: 0.6,
  "& svg": {
    fontSize: 64,
    color: theme.palette.text.secondary,
  },
}))

const ActionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  flexWrap: "wrap",
  justifyContent: "center",
}))

/**
 * Empty state component for displaying when no data is available
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<LayersIcon />}
 *   title="No layers found"
 *   description="Add your first layer to get started with mapping"
 *   action={{
 *     label: "Add Layer",
 *     onClick: handleAddLayer,
 *     variant: "contained"
 *   }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, secondaryAction }) => {
  return (
    <Container>
      {icon && <IconContainer>{icon}</IconContainer>}
      <Typography variant="h6" color="text.primary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {(action || secondaryAction) && (
        <ActionsContainer>
          {action && (
            <Button variant={action.variant || "contained"} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant={secondaryAction.variant || "outlined"} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </ActionsContainer>
      )}
    </Container>
  )
}
