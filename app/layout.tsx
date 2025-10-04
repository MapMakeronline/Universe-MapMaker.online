import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Providers from "../src/components/providers/Providers"

export const metadata: Metadata = {
  title: "Universe MapMaker - GIS",
  description: "Professional map creation and analysis tool with Mapbox GL JS",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}