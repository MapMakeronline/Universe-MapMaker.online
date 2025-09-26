"use client"

import type React from "react"
import { Button as MuiButton, type ButtonProps as MuiButtonProps, CircularProgress } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface ButtonProps extends Omit<MuiButtonProps, "size"> {
  /**
   * The size of the button
   * @default 'medium'
   */
  size?: "small" | "medium" | "large"
  /**
   * Show loading spinner
   * @default false
   */
  loading?: boolean
  /**
   * Icon to display before the button text
   */
  startIcon?: React.ReactNode
  /**
   * Icon to display after the button text
   */
  endIcon?: React.ReactNode
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, loading }) => ({
  position: "relative",
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  ...(loading && {
    color: "transparent",
  }),
}))

const LoadingSpinner = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}))

/**
 * Enhanced Material UI Button component with loading state and accessibility features
 *
 * @example
 * ```tsx
 * <Button variant="contained" loading={isSubmitting} onClick={handleSubmit}>
 *   Submit Form
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled,
  startIcon,
  endIcon,
  size = "medium",
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
    >
      {children}
      {loading && <LoadingSpinner size={24} />}
    </StyledButton>
  )
}
