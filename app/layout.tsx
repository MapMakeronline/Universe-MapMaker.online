import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Providers from "../src/components/providers/Providers"
import GoogleAnalytics from "@/components/GoogleAnalytics"

export const metadata: Metadata = {
  title: "MapMaker.online - Profesjonalne mapy GIS",
  description: "Twórz, edytuj i udostępniaj dane przestrzenne online. Narzędzia GIS, edycja map, eksport danych.",
  applicationName: "MapMaker.online",
  keywords: ["GIS", "mapy", "geoportal", "dane przestrzenne", "mapbox", "edytor map"],
  authors: [{ name: "MapMaker.online" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo2.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MapMaker",
  },
  openGraph: {
    type: "website",
    siteName: "MapMaker.online",
    title: "MapMaker.online - Profesjonalne mapy GIS",
    description: "Twórz, edytuj i udostępniaj dane przestrzenne online",
    images: ["/logo2.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MapMaker.online",
    description: "Profesjonalne narzędzia GIS online",
    images: ["/logo2.svg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>
        <GoogleAnalytics measurementId="G-8H03NRW1LR" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}