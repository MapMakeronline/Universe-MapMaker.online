import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Universe MapMaker",
  description: "Professional map creation and analysis tool",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}