"use client"

interface MaterialIconProps {
  name: string
  className?: string
  size?: number
  filled?: boolean
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700
  grade?: -25 | 0 | 200
  opticalSize?: 20 | 24 | 40 | 48
  variant?: "outlined" | "rounded" | "sharp"
}

export function MaterialIcon({
  name,
  className = "",
  size = 24,
  filled = false,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  variant = "outlined",
}: MaterialIconProps) {
  const getIconClass = () => {
    switch (variant) {
      case "rounded":
        return "material-symbols-rounded"
      case "sharp":
        return "material-symbols-sharp"
      default:
        return "material-symbols-outlined"
    }
  }

  const iconClass = getIconClass()

  const style = {
    fontSize: `${size}px`,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
    userSelect: "none" as const,
  }

  return (
    <span className={`${iconClass} ${className}`} style={style} aria-hidden="true">
      {name}
    </span>
  )
}