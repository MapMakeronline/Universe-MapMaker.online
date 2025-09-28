import type React from "react"
import type { Metadata } from "next"
import { Providers } from "./providers"
import "./globals.css"

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
    <html lang="pl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}