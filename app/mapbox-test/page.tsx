'use client'

import { useEffect, useState, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface TokenInfo {
  hasToken: boolean
  tokenPrefix?: string
  tokenLength?: number
  environment: {
    nodeEnv: string
    isProduction: boolean
    isCloudRun: boolean
    hostname: string
    url: string
  }
  error?: string
}

interface MapLoadStatus {
  status: 'loading' | 'success' | 'error'
  message: string
  details?: any
}

export default function MapboxTestPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>({
    status: 'loading',
    message: 'Initializing...'
  })
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const logEntry = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`
    console.log(logEntry, data)
    setLogs(prev => [...prev, logEntry])
  }

  useEffect(() => {
    // Gather environment information
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const altToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    const actualToken = token || altToken

    const info: TokenInfo = {
      hasToken: !!actualToken,
      tokenPrefix: actualToken?.substring(0, 7),
      tokenLength: actualToken?.length,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isCloudRun: typeof process !== 'undefined' && !!process.env.K_SERVICE,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    }

    setTokenInfo(info)
    addLog('Environment info gathered', info)

    // Check token availability
    if (!actualToken) {
      const error = 'No Mapbox token found in environment variables'
      setMapStatus({
        status: 'error',
        message: error,
        details: {
          checkedVars: ['NEXT_PUBLIC_MAPBOX_TOKEN', 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN'],
          found: false
        }
      })
      addLog('ERROR: ' + error)
      return
    }

    // Validate token format
    if (!actualToken.startsWith('pk.')) {
      const error = 'Invalid token format (should start with pk.)'
      setMapStatus({
        status: 'error',
        message: error,
        details: { tokenStart: actualToken.substring(0, 3) }
      })
      addLog('ERROR: ' + error)
      return
    }

    // Initialize Mapbox
    addLog('Setting Mapbox access token')
    mapboxgl.accessToken = actualToken

    if (!mapContainer.current) {
      addLog('ERROR: Map container not ready')
      return
    }

    try {
      addLog('Creating Mapbox map instance')
      setMapStatus({ status: 'loading', message: 'Creating map...' })

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [21.0122, 52.2297], // Warsaw
        zoom: 10,
        failIfMajorPerformanceCaveat: false // Allow software rendering
      })

      map.current = mapInstance

      // Add event listeners
      mapInstance.on('load', () => {
        addLog('Map loaded successfully')
        setMapStatus({
          status: 'success',
          message: 'Map loaded successfully!',
          details: {
            style: mapInstance.getStyle().name,
            zoom: mapInstance.getZoom(),
            center: mapInstance.getCenter()
          }
        })

        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl())
        mapInstance.addControl(new mapboxgl.ScaleControl())
        mapInstance.addControl(new mapboxgl.FullscreenControl())
        addLog('Controls added')
      })

      mapInstance.on('error', (e) => {
        const errorMsg = e.error?.message || e.message || 'Unknown map error'
        addLog('Map error', { error: errorMsg, details: e })

        setMapStatus({
          status: 'error',
          message: `Map error: ${errorMsg}`,
          details: e
        })

        // Check for common token issues
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          addLog('Token authorization failed - check URL restrictions in Mapbox console')
        } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          addLog('Token forbidden - check token scopes and permissions')
        }
      })

      // Test token with API call
      addLog('Testing token with Mapbox API...')
      fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${actualToken}`)
        .then(response => {
          addLog(`API test response: ${response.status} ${response.statusText}`)
          if (!response.ok) {
            return response.text().then(text => {
              addLog('API error response', text)
            })
          }
          return response.json()
        })
        .then(data => {
          if (data) {
            addLog('API test successful', { styleName: data.name, version: data.version })
          }
        })
        .catch(error => {
          addLog('API test failed', error.message)
        })

    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to initialize map'
      addLog('ERROR: ' + errorMsg, error)
      setMapStatus({
        status: 'error',
        message: errorMsg,
        details: error
      })
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mapbox Test Page</h1>
          <p className="text-gray-600">Clean Mapbox initialization test with debugging</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-lg">Map View</h2>
                <p className={`text-sm mt-1 ${
                  mapStatus.status === 'success' ? 'text-green-600' :
                  mapStatus.status === 'error' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  Status: {mapStatus.message}
                </p>
              </div>
              <div ref={mapContainer} className="h-[500px] w-full" />
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Token Information</h3>
              {tokenInfo ? (
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600">Has Token:</dt>
                    <dd className={tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
                      {tokenInfo.hasToken ? '✓ Yes' : '✗ No'}
                    </dd>
                  </div>
                  {tokenInfo.hasToken && (
                    <>
                      <div>
                        <dt className="font-medium text-gray-600">Token Prefix:</dt>
                        <dd className="font-mono">{tokenInfo.tokenPrefix}...</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-600">Token Length:</dt>
                        <dd>{tokenInfo.tokenLength} characters</dd>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t">
                    <dt className="font-medium text-gray-600 mb-1">Environment:</dt>
                    <dd className="space-y-1">
                      <div>Node Env: <span className="font-mono">{tokenInfo.environment.nodeEnv}</span></div>
                      <div>Production: <span className={tokenInfo.environment.isProduction ? 'text-orange-600' : 'text-blue-600'}>
                        {tokenInfo.environment.isProduction ? 'Yes' : 'No'}
                      </span></div>
                      <div>Cloud Run: <span className={tokenInfo.environment.isCloudRun ? 'text-purple-600' : 'text-gray-600'}>
                        {tokenInfo.environment.isCloudRun ? 'Yes' : 'No'}
                      </span></div>
                      <div className="break-all">Host: <span className="font-mono text-xs">{tokenInfo.environment.hostname}</span></div>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                {tokenInfo?.environment.isCloudRun ? '🚀 Cloud Run Detected' : '💻 Local Development'}
              </h3>

              {tokenInfo?.environment.isCloudRun ? (
                <div className="text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">Cloud Run Requirements:</p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Token must have URL restrictions for:
                      <ul className="ml-6 mt-1 text-xs font-mono bg-white p-1 rounded">
                        <li>• https://*.run.app/*</li>
                        <li>• https://universe-mapmaker-*.run.app/*</li>
                        <li>• {tokenInfo.environment.url.split('/').slice(0, 3).join('/')}/*</li>
                      </ul>
                    </li>
                    <li>Check Cloud Run logs for 401/403 errors</li>
                    <li>Verify env var is set in Cloud Run</li>
                  </ol>
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                    <strong>Service:</strong> {process.env.K_SERVICE || 'unknown'}<br/>
                    <strong>Region:</strong> {process.env.GOOGLE_CLOUD_REGION || 'unknown'}
                  </div>
                </div>
              ) : (
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://account.mapbox.com/access-tokens/" target="_blank" className="underline">Mapbox Console</a></li>
                  <li>Find token: <code className="text-xs">{tokenInfo?.tokenPrefix}...</code></li>
                  <li>Add URL restrictions:
                    <ul className="ml-6 mt-1 text-xs font-mono">
                      <li>• https://*.run.app/*</li>
                      <li>• https://universe-mapmaker-*.europe-central2.run.app/*</li>
                      <li>• http://localhost:*/*</li>
                    </ul>
                  </li>
                  <li>Set minimal scopes (styles:read, fonts:read)</li>
                </ol>
              )}
            </div>

            {/* Deployment Commands */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🚀 Deploy Commands</h3>
              <pre className="text-xs font-mono bg-white p-2 rounded overflow-x-auto">
{`# Set token in Cloud Run
gcloud run services update universe-mapmaker \\
  --update-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=${tokenInfo?.hasToken ? tokenInfo.tokenPrefix + '...' : 'YOUR_TOKEN'} \\
  --region europe-central2

# Check current env vars
gcloud run services describe universe-mapmaker \\
  --region europe-central2 \\
  --format "value(spec.template.spec.containers[0].env[].name)"`}
              </pre>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="mt-6 bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-lg">Debug Logs</h3>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              <pre className="text-xs font-mono space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.includes('ERROR') ? 'text-red-600' :
                      log.includes('SUCCESS') || log.includes('successful') ? 'text-green-600' :
                      'text-gray-700'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </pre>
            ) : (
              <p className="text-gray-500">No logs yet...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}