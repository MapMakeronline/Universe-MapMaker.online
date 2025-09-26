import type React from "react"
import { Card as MuiCard, type CardProps as MuiCardProps, CardContent, CardHeader, CardActions } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface CardProps extends MuiCardProps {
  /**
   * Card title
   */
  title?: React.ReactNode
  /**
   * Card subtitle
   */
  subtitle?: React.ReactNode
  /**
   * Card actions (buttons, etc.)
   */
  actions?: React.ReactNode
  /**
   * Whether to show hover effect
   * @default false
   */
  hoverable?: boolean
  /**
   * Whether the card is interactive (clickable)
   * @default false
   */
  interactive?: boolean
}

const StyledCard = styled(MuiCard)<{ hoverable?: boolean; interactive?: boolean }>(
  ({ theme, hoverable, interactive }) => ({
    transition: theme.transitions.create(["box-shadow", "transform"], {
      duration: theme.transitions.duration.short,
    }),
    ...(hoverable && {
      "&:hover": {
        boxShadow: theme.shadows[4],
        transform: "translateY(-2px)",
      },
    }),
    ...(interactive && {
      cursor: "pointer",
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    }),
  }),
)

/**
 * Enhanced Material UI Card component with hover effects and accessibility
 *
 * @example
 * ```tsx
 * <Card
 *   title="Layer Information"
 *   subtitle="Parcels dataset"
 *   hoverable
 *   actions={<Button>Edit</Button>}
 * >
 *   <Typography>Card content goes here</Typography>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  hoverable = false,
  interactive = false,
  ...props
}) => {
  return (
    <StyledCard
      {...props}
      hoverable={hoverable}
      interactive={interactive}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
    >
      {(title || subtitle) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          titleTypographyProps={{ variant: "h6" }}
          subheaderTypographyProps={{ variant: "body2" }}
        />
      )}
      {children && <CardContent>{children}</CardContent>}
      {actions && <CardActions>{actions}</CardActions>}
    </StyledCard>
  )
}
