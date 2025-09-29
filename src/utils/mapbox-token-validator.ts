/**
 * Enhanced Mapbox Token Validator for Cloud Run Deployment
 * Validates token format, availability, and environment configuration
 */

interface TokenValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
  environment?: {
    isProduction: boolean
    isCloudRun: boolean
    hasToken: boolean
    tokenLength?: number
  }
}

/**
 * Validates Mapbox token with enhanced checks for Cloud Run deployment
 */
export function validateMapboxToken(token?: string): TokenValidationResult {
  const envToken = token || process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const isProduction = process.env.NODE_ENV === 'production'
  const isCloudRun = process.env.K_SERVICE !== undefined
  const warnings: string[] = []

  // Log environment info (without exposing token)
  if (typeof window !== 'undefined') {
    console.log('[Mapbox Validator] Environment:', {
      isProduction,
      isCloudRun,
      hasToken: !!envToken,
      tokenLength: envToken?.length,
      tokenPrefix: envToken?.substring(0, 7) + '...',
      hostname: window.location.hostname
    })
  }

  // Check if token exists
  if (!envToken) {
    return {
      isValid: false,
      error: 'Missing Mapbox token. Add NEXT_PUBLIC_MAPBOX_TOKEN to environment variables.',
      environment: {
        isProduction,
        isCloudRun,
        hasToken: false
      }
    }
  }

  // Validate token format
  if (!envToken.startsWith('pk.')) {
    return {
      isValid: false,
      error: 'Invalid Mapbox token format. Token must start with "pk."',
      environment: {
        isProduction,
        isCloudRun,
        hasToken: true,
        tokenLength: envToken.length
      }
    }
  }

  // Check token length
  if (envToken.length < 80) {
    return {
      isValid: false,
      error: 'Mapbox token appears to be incomplete. Please check if you copied the full token.',
      environment: {
        isProduction,
        isCloudRun,
        hasToken: true,
        tokenLength: envToken.length
      }
    }
  }

  // Production/Cloud Run specific warnings
  if (isProduction || isCloudRun) {
    warnings.push('Running in production mode. Ensure token has proper URL restrictions configured.')

    if (isCloudRun) {
      warnings.push('Detected Cloud Run environment. Token must allow *.run.app domains.')
    }
  }

  // Additional validation for token structure
  const tokenParts = envToken.split('.')
  if (tokenParts.length !== 3) {
    return {
      isValid: false,
      error: 'Malformed Mapbox token. Token should have 3 parts separated by dots.',
      environment: {
        isProduction,
        isCloudRun,
        hasToken: true,
        tokenLength: envToken.length
      }
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    environment: {
      isProduction,
      isCloudRun,
      hasToken: true,
      tokenLength: envToken.length
    }
  }
}

/**
 * Gets safe token info for logging (doesn't expose actual token)
 */
export function getTokenDebugInfo(): Record<string, any> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    return { hasToken: false }
  }

  return {
    hasToken: true,
    prefix: token.substring(0, 7),
    suffix: token.substring(token.length - 4),
    length: token.length,
    format: token.startsWith('pk.') ? 'valid_prefix' : 'invalid_prefix'
  }
}

/**
 * Checks if running in Cloud Run environment
 */
export function isCloudRunEnvironment(): boolean {
  return typeof process !== 'undefined' &&
         (process.env.K_SERVICE !== undefined ||
          process.env.K_REVISION !== undefined)
}

/**
 * Gets Cloud Run service info if available
 */
export function getCloudRunInfo(): Record<string, string | undefined> {
  if (!isCloudRunEnvironment()) {
    return {}
  }

  return {
    service: process.env.K_SERVICE,
    revision: process.env.K_REVISION,
    configuration: process.env.K_CONFIGURATION,
    region: process.env.GOOGLE_CLOUD_REGION
  }
}

/**
 * Provides setup instructions for Mapbox token configuration
 */
export function getTokenSetupInstructions(): string[] {
  return [
    '1. Go to https://account.mapbox.com/access-tokens/',
    '2. Create a new PUBLIC token (starts with pk.)',
    '3. Configure URL restrictions:',
    '   - Add: https://*.run.app/*',
    '   - Add: https://universe-mapmaker-*.europe-central2.run.app/*',
    '   - Add: http://localhost:3000/* (for development)',
    '4. Select minimal required scopes:',
    '   - styles:read',
    '   - fonts:read',
    '   - datasets:read',
    '   - vision:read (if using 3D features)',
    '5. Copy the token and add to Cloud Run:',
    '   gcloud run services update universe-mapmaker \\',
    '     --update-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here \\',
    '     --region europe-central2'
  ]
}