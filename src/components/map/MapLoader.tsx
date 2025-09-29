'use client'

/**
 * MapLoader - Smart loading component dla MapView
 * Używa dynamic import, sprawdza token i obsługuje błędy
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

import { MapLoaderProps } from '../../types/map.types'
import { validateMapboxToken } from '../../config/mapbox'
import styles from './map.module.css'

// Dynamic import MapView z wyłączonym SSR
// Dlaczego dynamic import?
// 1. Mapbox GL JS wymaga window/document (browser-only)
// 2. Zmniejsza rozmiar początkowego bundle
// 3. Ładuje się tylko gdy rzeczywiście potrzebny
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />
})

// Skeleton loader - pokazuje się podczas dynamic import
const MapSkeleton = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonSpinner}>
        <div className={styles.skeletonRing}></div>
        <div className={styles.skeletonRing}></div>
        <div className={styles.skeletonRing}></div>
      </div>
      <h3>Przygotowywanie mapy...</h3>
      <p>Ładowanie Mapbox GL JS</p>
    </div>
  </div>
)

// Error boundary dla błędów tokenu
const TokenError = ({ message }: { message: string }) => (
  <div className={styles.error}>
    <div className={styles.errorContent}>
      <h3>⚠️ Problem z konfiguracją</h3>
      <p className={styles.errorMessage}>{message}</p>

      <div className={styles.errorHelp}>
        <h4>Jak naprawić:</h4>
        <ol>
          <li>
            Zarejestruj się na{' '}
            <a
              href="https://account.mapbox.com/auth/signup/"
              target="_blank"
              rel="noopener noreferrer"
            >
              mapbox.com
            </a>
          </li>
          <li>
            Skopiuj swój Access Token z{' '}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
            >
              panelu tokenów
            </a>
          </li>
          <li>Dodaj token do pliku <code>.env.local</code>:</li>
          <li>
            <pre className={styles.codeBlock}>
              NEXT_PUBLIC_MAPBOX_TOKEN=twój_token_tutaj
            </pre>
          </li>
          <li>Zrestartuj serwer deweloperski</li>
        </ol>

        <div className={styles.infoNote}>
          <strong>💡 Wskazówka:</strong> Token zaczyna się od "pk." i ma około 100 znaków.
          Upewnij się, że ma uprawnienia do odczytu map.
        </div>
      </div>
    </div>
  </div>
)

const MapLoader = ({
  fallbackMessage = 'Mapa niedostępna',
  loadingMessage = 'Ładowanie mapy...',
  ...mapViewProps
}: MapLoaderProps) => {
  const [tokenStatus, setTokenStatus] = useState<{
    isValid: boolean
    error?: string
    checked: boolean
  }>({
    isValid: false,
    error: undefined,
    checked: false
  })

  // Sprawdzenie tokenu przy pierwszym renderze
  useEffect(() => {
    console.log('[MAP] MapLoader - sprawdzanie tokenu...')

    const validation = validateMapboxToken()
    setTokenStatus({
      isValid: validation.isValid,
      error: validation.error,
      checked: true
    })

    if (validation.isValid) {
      console.log('[MAP] Token prawidłowy - ładowanie mapy')
    } else {
      console.error('[MAP] Błąd tokenu:', validation.error)
    }
  }, [])

  // Loading state - czeka na sprawdzenie tokenu
  if (!tokenStatus.checked) {
    return (
      <div className={styles.checking}>
        <div className={styles.checkingSpinner} />
        <p>Sprawdzanie konfiguracji...</p>
      </div>
    )
  }

  // Error state - nieprawidłowy token
  if (!tokenStatus.isValid) {
    return <TokenError message={tokenStatus.error || fallbackMessage} />
  }

  // Success state - ładowanie mapy
  return (
    <div className={styles.wrapper}>
      <MapView
        {...mapViewProps}
        onError={(error) => {
          console.error('[MAP] Błąd MapView:', error)
          // Przekazuj błąd dalej jeśli był handler
          mapViewProps.onError?.(error)
        }}
      />
    </div>
  )
}

export default MapLoader

// Named exports dla łatwiejszego importu
export { MapView, MapSkeleton, TokenError }

// TODO: Dodać retry mechanism przy błędach sieciowych
// TODO: Dodać offline detection i stosowny komunikat
// TODO: Dodać progress bar dla ładowania map resources