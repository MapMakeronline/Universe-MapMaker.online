'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// Dynamic import z wyłączonym SSR
// Dlaczego używamy dynamic import?
// 1. Mapbox GL JS używa window i document, które nie istnieją podczas server-side rendering
// 2. To pozwala na ładowanie biblioteki tylko w przeglądarce
// 3. Zmniejsza rozmiar początkowego bundle'a i przyspiesza ładowanie strony
const MapboxMapNew = dynamic(
  () => import('./MapboxMapNew'),
  {
    ssr: false, // Wyłączamy server-side rendering dla tego komponentu
    loading: () => <MapLoadingComponent />
  }
)

// Komponent wyświetlany podczas ładowania mapy
function MapLoadingComponent() {
  return (
    <div className="map-loading-container">
      <div className="map-loading-content">
        <div className="map-loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h3>Przygotowywanie mapy...</h3>
        <p>Ładowanie zasobów Mapbox GL JS</p>
      </div>
    </div>
  )
}

interface MapWrapperProps {
  token?: string
}

export default function MapWrapper({ token }: MapWrapperProps) {
  const [mapReady, setMapReady] = useState(false)

  // Ten komponent służy jako wrapper dla dynamicznie importowanego komponentu mapy
  // Zapewnia płynne ładowanie i obsługę błędów
  return (
    <div className="map-wrapper">
      <MapboxMapNew
        token={token}
      />
    </div>
  )
}