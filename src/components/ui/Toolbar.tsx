import type React from "react"
import { Toolbar as MuiToolbar, type ToolbarProps as MuiToolbarProps, Box, Divider } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface ToolbarProps extends MuiToolbarProps {
  /**
   * Left-aligned content
   */
  left?: React.ReactNode
  /**
   * Center-aligned content
   */
  center?: React.ReactNode
  /**
   * Right-aligned content
   */
  right?: React.ReactNode
  /**
   * Whether to show dividers between sections
   * @default false
   */
  showDividers?: boolean
  /**
   * Toolbar variant
   * @default 'regular'
   */
  variant?: "regular" | "dense" | "compact"
}

const StyledToolbar = styled(MuiToolbar)<{ variant?: ToolbarProps["variant"] }>(({ theme, variant }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2),
  minHeight: variant === "dense" ? 48 : variant === "compact" ? 40 : 56,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

const ToolbarSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
})

const LeftSection = styled(ToolbarSection)({
  flex: "0 1 auto",
})

const CenterSection = styled(ToolbarSection)({
  flex: "1 1 auto",
  justifyContent: "center",
})

const RightSection = styled(ToolbarSection)({
  flex: "0 1 auto",
  justifyContent: "flex-end",
})

/**
 * Flexible toolbar component with left, center, and right sections
 *
 * @example
 * ```tsx
 * <Toolbar
 *   left={<Typography variant="h6">Map Tools</Typography>}
 *   center={<SearchField />}
 *   right={
 *     <>
 *       <Button>Save</Button>
 *       <Button>Export</Button>
 *     </>
 *   }
 *   showDividers
 * />
 * ```
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  left,
  center,
  right,
  showDividers = false,
  variant = "regular",
  children,
  ...props
}) => {
  // If children are provided, use default MUI Toolbar behavior
  if (children) {
    return (
      <StyledToolbar {...props} variant={variant}>
        {children}
      </StyledToolbar>
    )
  }

  return (
    <StyledToolbar {...props} variant={variant}>
      {left && <LeftSection>{left}</LeftSection>}
      {showDividers && left && (center || right) && <Divider orientation="vertical" flexItem />}
      {center && <CenterSection>{center}</CenterSection>}
      {showDividers && center && right && <Divider orientation="vertical" flexItem />}
      {right && <RightSection>{right}</RightSection>}
    </StyledToolbar>
  )
}
