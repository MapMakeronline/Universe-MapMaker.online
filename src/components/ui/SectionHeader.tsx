import type React from "react"
import { Box, Typography, Divider } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface SectionHeaderProps {
  /**
   * Section title
   */
  title: string
  /**
   * Section subtitle
   */
  subtitle?: string
  /**
   * Actions to display on the right side
   */
  actions?: React.ReactNode
  /**
   * Whether to show a divider below the header
   * @default true
   */
  showDivider?: boolean
  /**
   * Header size variant
   * @default 'medium'
   */
  size?: "small" | "medium" | "large"
}

const Container = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}))

const HeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
}))

const TitleSection = styled(Box)({
  flex: 1,
  minWidth: 0,
})

const ActionsSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexShrink: 0,
}))

/**
 * Section header component for organizing content with title, subtitle, and actions
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Map Layers"
 *   subtitle="Manage your data layers"
 *   actions={
 *     <>
 *       <Button size="small">Add Layer</Button>
 *       <IconButton><MoreVertIcon /></IconButton>
 *     </>
 *   }
 * />
 * ```
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  showDivider = true,
  size = "medium",
}) => {
  const getTitleVariant = () => {
    switch (size) {
      case "small":
        return "h6"
      case "large":
        return "h4"
      default:
        return "h5"
    }
  }

  const getSubtitleVariant = () => {
    switch (size) {
      case "small":
        return "caption"
      case "large":
        return "body1"
      default:
        return "body2"
    }
  }

  return (
    <Container>
      <HeaderContent>
        <TitleSection>
          <Typography variant={getTitleVariant()} component="h2" color="text.primary" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant={getSubtitleVariant()} color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </TitleSection>
        {actions && <ActionsSection>{actions}</ActionsSection>}
      </HeaderContent>
      {showDivider && <Divider />}
    </Container>
  )
}
