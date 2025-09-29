'use client'

/**
 * Clean Map Test Page - Minimal Mapbox implementation
 * No external dependencies, pure Mapbox GL JS test
 */

import { useState, useEffect } from 'react'
import CleanMapbox from '../../components/CleanMapbox'

interface ServerStatus {
  hasToken: boolean
  tokenValid: boolean
  environment: {
    nodeEnv: string
    isProduction: boolean
    isCloudRun: boolean
  }
  apiTest?: {
    success: boolean
    status?: number
    styleName?: string
  }
}

export default function CleanMapPage() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Fetch server status on mount
  useEffect(() => {
    fetch('/api/mapbox/status')
      .then(response => response.json())
      .then((data: ServerStatus) => {
        setServerStatus(data)
        console.log('Server status:', data)
      })
      .catch(error => {
        setApiError(error.message)
        console.error('Failed to fetch server status:', error)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Clean Mapbox Test</h1>
          <p className="text-gray-600 mt-2">Simple Mapbox implementation without complex dependencies</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Mapbox Map</h2>
            <p className="text-sm text-gray-600 mt-1">Clean implementation with minimal dependencies</p>
          </div>

          <div className="p-4">
            <CleanMapbox
              height="500px"
              showControls={true}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Client Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-mono text-sm">{process.env.NODE_ENV || 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Has Token:</span>
                <span className={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Length:</span>
                <span className="font-mono text-sm">
                  {process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.length || 0} chars
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Prefix:</span>
                <span className="font-mono text-sm">
                  {process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.substring(0, 10) || 'none'}...
                </span>
              </div>
            </div>
          </div>

          {/* Server Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Status (API)</h3>

            {apiError ? (
              <div className="text-red-600 text-sm">
                API Error: {apiError}
              </div>
            ) : serverStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Server Has Token:</span>
                  <span className={serverStatus.hasToken ? 'text-green-600' : 'text-red-600'}>
                    {serverStatus.hasToken ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Valid:</span>
                  <span className={serverStatus.tokenValid ? 'text-green-600' : 'text-red-600'}>
                    {serverStatus.tokenValid ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-mono text-sm">{serverStatus.environment.nodeEnv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Production:</span>
                  <span className={serverStatus.environment.isProduction ? 'text-orange-600' : 'text-blue-600'}>
                    {serverStatus.environment.isProduction ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cloud Run:</span>
                  <span className={serverStatus.environment.isCloudRun ? 'text-purple-600' : 'text-gray-600'}>
                    {serverStatus.environment.isCloudRun ? 'Yes' : 'No'}
                  </span>
                </div>
                {serverStatus.apiTest && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">API Test:</span>
                      <span className={serverStatus.apiTest.success ? 'text-green-600' : 'text-red-600'}>
                        {serverStatus.apiTest.success ?
                          `✓ ${serverStatus.apiTest.styleName}` :
                          `✗ ${serverStatus.apiTest.status}`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Loading server status...</div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🔧 Setup Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Local Development:</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Create <code className="bg-white px-1 rounded">.env.local</code></li>
                <li>Add: <code className="bg-white px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token</code></li>
                <li>Restart server: <code className="bg-white px-1 rounded">npm run dev</code></li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Cloud Run Production:</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Configure URL restrictions in Mapbox Console</li>
                <li>Add: <code className="bg-white px-1 rounded">https://*.run.app/*</code></li>
                <li>Deploy with env vars set</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Debug Links */}
        <div className="mt-4 text-center space-x-4">
          <a
            href="/mapbox-test"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Advanced Test Page
          </a>
          <a
            href="/api/mapbox/status"
            target="_blank"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View API Response
          </a>
          <a
            href="/"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Main Application
          </a>
        </div>
      </div>
    </div>
  )
}