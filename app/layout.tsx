import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
// import { WebVitals } from "@/components/ui/WebVitals"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Universe MapMaker",
  description: "Professional mapping application for spatial data management",
  manifest: "/manifest.json",
  themeColor: "#1976d2",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Universe MapMaker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Universe MapMaker",
    title: "Universe MapMaker",
    description: "Professional mapping application for spatial data management",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body>
        <Providers>{children}</Providers>
        {/*<WebVitals />*/}
      </body>
    </html>
  )
}
