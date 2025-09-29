import { NextRequest, NextResponse } from 'next/server'

interface MapboxStatusResponse {
  hasToken: boolean
  tokenValid: boolean
  tokenInfo?: {
    prefix: string
    length: number
  }
  environment: {
    nodeEnv: string
    isProduction: boolean
    isCloudRun: boolean
    region?: string
    service?: string
  }
  apiTest?: {
    success: boolean
    status?: number
    error?: string
    styleName?: string
  }
  availableEnvVars: string[]
}

export async function GET(request: NextRequest): Promise<NextResponse<MapboxStatusResponse>> {
  try {
    // Get tokens from environment
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const altToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    const actualToken = token || altToken

    // Environment detection
    const isProduction = process.env.NODE_ENV === 'production'
    const isCloudRun = !!(process.env.K_SERVICE || process.env.K_REVISION)

    // Get all NEXT_PUBLIC env vars (safely)
    const availableEnvVars = Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))

    const response: MapboxStatusResponse = {
      hasToken: !!actualToken,
      tokenValid: false,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction,
        isCloudRun,
        service: process.env.K_SERVICE,
        region: process.env.GOOGLE_CLOUD_REGION
      },
      availableEnvVars
    }

    // If we have a token, validate it
    if (actualToken) {
      response.tokenInfo = {
        prefix: actualToken.substring(0, 10),
        length: actualToken.length
      }

      // Test token with Mapbox API
      try {
        const mapboxResponse = await fetch(
          `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${actualToken}`,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'Universe-MapMaker/1.0'
            }
          }
        )

        if (mapboxResponse.ok) {
          const data = await mapboxResponse.json()
          response.tokenValid = true
          response.apiTest = {
            success: true,
            status: mapboxResponse.status,
            styleName: data.name
          }
        } else {
          const errorText = await mapboxResponse.text()
          response.apiTest = {
            success: false,
            status: mapboxResponse.status,
            error: errorText.substring(0, 200) // Limit error message length
          }
        }
      } catch (apiError: any) {
        response.apiTest = {
          success: false,
          error: `Network error: ${apiError.message}`
        }
      }
    }

    // Log server-side info (will appear in Cloud Run logs)
    console.log('[Mapbox API] Status check:', {
      hasToken: response.hasToken,
      tokenValid: response.tokenValid,
      environment: response.environment,
      availableEnvVars: response.availableEnvVars,
      tokenLength: actualToken?.length,
      apiTestStatus: response.apiTest?.status
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Mapbox API] Error:', error)
    return NextResponse.json(
      {
        hasToken: false,
        tokenValid: false,
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isProduction: process.env.NODE_ENV === 'production',
          isCloudRun: !!(process.env.K_SERVICE || process.env.K_REVISION)
        },
        availableEnvVars: [],
        apiTest: {
          success: false,
          error: error.message
        }
      } as MapboxStatusResponse,
      { status: 500 }
    )
  }
}