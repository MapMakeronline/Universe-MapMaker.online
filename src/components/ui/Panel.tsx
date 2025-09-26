"use client"

import type React from "react"
import { Paper, type PaperProps, Typography, IconButton, Collapse, Box } from "@mui/material"
import { ExpandMore, ExpandLess } from "@mui/icons-material"
import { styled } from "@mui/material/styles"

export interface PanelProps extends Omit<PaperProps, "title"> {
  /**
   * Panel title
   */
  title?: React.ReactNode
  /**
   * Panel subtitle
   */
  subtitle?: React.ReactNode
  /**
   * Whether the panel is collapsible
   * @default false
   */
  collapsible?: boolean
  /**
   * Whether the panel is expanded (for collapsible panels)
   * @default true
   */
  expanded?: boolean
  /**
   * Callback when panel expand state changes
   */
  onExpandChange?: (expanded: boolean) => void
  /**
   * Actions to display in the panel header
   */
  actions?: React.ReactNode
  /**
   * Whether to show a divider between header and content
   * @default true
   */
  showDivider?: boolean
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  overflow: "hidden",
}))

const PanelHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2),
  minHeight: 56,
}))

const PanelTitle = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
})

const PanelActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(2),
}))

const PanelContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 2, 2),
}))

const Divider = styled("hr")(({ theme }) => ({
  border: "none",
  height: 1,
  backgroundColor: theme.palette.divider,
  margin: 0,
}))

/**
 * Collapsible panel component for organizing content sections
 *
 * @example
 * ```tsx
 * <Panel
 *   title="Layer Controls"
 *   subtitle="Manage map layers"
 *   collapsible
 *   expanded={expanded}
 *   onExpandChange={setExpanded}
 *   actions={<Button size="small">Add Layer</Button>}
 * >
 *   <LayerList />
 * </Panel>
 * ```
 */
export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  collapsible = false,
  expanded = true,
  onExpandChange,
  actions,
  showDivider = true,
  children,
  ...props
}) => {
  const handleExpandClick = () => {
    if (collapsible && onExpandChange) {
      onExpandChange(!expanded)
    }
  }

  return (
    <StyledPaper {...props}>
      {(title || subtitle || actions || collapsible) && (
        <>
          <PanelHeader>
            <PanelTitle>
              {title && (
                <Typography variant="h6" component="h3" noWrap>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {subtitle}
                </Typography>
              )}
            </PanelTitle>
            <PanelActions>
              {actions}
              {collapsible && (
                <IconButton
                  onClick={handleExpandClick}
                  aria-label={expanded ? "Zwiń panel" : "Rozwiń panel"}
                  size="small"
                >
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </PanelActions>
          </PanelHeader>
          {showDivider && <Divider />}
        </>
      )}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <PanelContent>{children}</PanelContent>
      </Collapse>
    </StyledPaper>
  )
}
