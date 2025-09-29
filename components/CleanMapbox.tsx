'use client'

/**
 * Clean Mapbox Component - Simple, no dependencies
 * Minimal implementation for testing Mapbox functionality
 */

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface CleanMapboxProps {
  width?: string
  height?: string
  center?: [number, number] // [lng, lat]
  zoom?: number
  style?: string
  showControls?: boolean
  className?: string
}

export default function CleanMapbox({
  width = '100%',
  height = '400px',
  center = [21.0122, 52.2297], // Warsaw
  zoom = 10,
  style = 'mapbox://styles/mapbox/streets-v12',
  showControls = true,
  className = ''
}: CleanMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    // Check token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    console.log('[CleanMapbox] Token check:', {
      hasToken: !!token,
      tokenPrefix: token?.substring(0, 10),
      tokenLength: token?.length
    })

    if (!token) {
      setError('No Mapbox token found. Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local')
      setTokenStatus('invalid')
      setIsLoading(false)
      return
    }

    if (!token.startsWith('pk.')) {
      setError('Invalid token format. Mapbox tokens should start with "pk."')
      setTokenStatus('invalid')
      setIsLoading(false)
      return
    }

    setTokenStatus('valid')

    // Initialize Mapbox
    if (!mapContainer.current || map.current) return

    console.log('[CleanMapbox] Initializing map...')

    try {
      mapboxgl.accessToken = token

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center,
        zoom,
        attributionControl: true
      })

      map.current = mapInstance

      mapInstance.on('load', () => {
        console.log('[CleanMapbox] Map loaded successfully')
        setIsLoading(false)
        setError(null)

        // Add controls if requested
        if (showControls) {
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
          mapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left')
          mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-left')
        }
      })

      mapInstance.on('error', (e) => {
        const errorMsg = e.error?.message || 'Map loading error'
        console.error('[CleanMapbox] Map error:', e)
        setError(`Map Error: ${errorMsg}`)
        setIsLoading(false)

        // Common error handling
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          setError('Token unauthorized. Check URL restrictions in Mapbox Console.')
        } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          setError('Token forbidden. Check token scopes and permissions.')
        }
      })

    } catch (err: any) {
      console.error('[CleanMapbox] Initialization error:', err)
      setError(`Initialization Error: ${err.message}`)
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [center, zoom, style, showControls])

  // Error state
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h3 className="text-red-800 font-semibold mb-2">Map Error</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>

          {tokenStatus === 'invalid' && (
            <div className="text-left bg-white p-3 rounded border text-xs">
              <strong>Setup Instructions:</strong>
              <ol className="mt-2 ml-4 list-decimal">
                <li>Get token from <a href="https://account.mapbox.com" className="text-blue-600 underline">Mapbox Console</a></li>
                <li>Add to <code className="bg-gray-100 px-1">.env.local</code>:</li>
                <li><code className="bg-gray-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token</code></li>
                <li>Restart dev server</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mapbox...</p>
          <p className="text-gray-500 text-xs">Token: {tokenStatus}</p>
        </div>
      </div>
    )
  }

  // Map container
  return (
    <div
      ref={mapContainer}
      className={`mapbox-container ${className}`}
      style={{ width, height }}
    />
  )
}

// Export for easy testing
export { CleanMapbox }