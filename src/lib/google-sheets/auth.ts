import { JWT } from "google-auth-library"
import type { GoogleSheetsConfig, GoogleSheetsError } from "./types"

/**
 * Google Sheets Authentication Manager
 * Handles service account authentication with proper error handling
 */
export class GoogleSheetsAuth {
  private jwtClient: JWT | null = null
  private config: GoogleSheetsConfig

  constructor(config: GoogleSheetsConfig) {
    this.config = {
      ...config,
      scopes: config.scopes || [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    }
  }

  /**
   * Initialize JWT client with service account credentials
   */
  private initializeJWT(): JWT {
    if (this.jwtClient) {
      return this.jwtClient
    }

    try {
      // Parse private key (handle both raw and base64 encoded)
      let privateKey = this.config.privateKey
      if (!privateKey.includes("-----BEGIN")) {
        privateKey = Buffer.from(privateKey, "base64").toString("utf8")
      }

      this.jwtClient = new JWT({
        email: this.config.serviceAccountEmail,
        key: privateKey,
        scopes: this.config.scopes,
      })

      console.log("[GoogleSheetsAuth] JWT client initialized successfully")
      return this.jwtClient
    } catch (error) {
      const authError = error as GoogleSheetsError
      console.error("[GoogleSheetsAuth] Failed to initialize JWT client:", authError)
      throw new Error(`Authentication initialization failed: ${authError.message}`)
    }
  }

  /**
   * Get authenticated access token
   */
  async getAccessToken(): Promise<string> {
    try {
      const jwtClient = this.initializeJWT()
      const tokens = await jwtClient.authorize()

      if (!tokens.access_token) {
        throw new Error("No access token received")
      }

      console.log("[GoogleSheetsAuth] Access token obtained successfully")
      return tokens.access_token
    } catch (error) {
      const authError = error as GoogleSheetsError
      console.error("[GoogleSheetsAuth] Failed to get access token:", authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
  }

  /**
   * Get authenticated headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken()
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }
  }

  /**
   * Validate service account configuration
   */
  validateConfig(): boolean {
    const { spreadsheetId, serviceAccountEmail, privateKey } = this.config

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      console.error("[GoogleSheetsAuth] Missing required configuration")
      return false
    }

    if (!serviceAccountEmail.includes("@") || !serviceAccountEmail.includes(".iam.gserviceaccount.com")) {
      console.error("[GoogleSheetsAuth] Invalid service account email format")
      return false
    }

    if (!privateKey.includes("PRIVATE KEY") && !this.isBase64(privateKey)) {
      console.error("[GoogleSheetsAuth] Invalid private key format")
      return false
    }

    return true
  }

  /**
   * Check if string is base64 encoded
   */
  private isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str
    } catch {
      return false
    }
  }

  /**
   * Test authentication by making a simple API call
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}?fields=properties.title`,
        { headers },
      )

      if (!response.ok) {
        console.error("[GoogleSheetsAuth] Authentication test failed:", response.status, response.statusText)
        return false
      }

      const data = await response.json()
      console.log("[GoogleSheetsAuth] Authentication test successful:", data.properties?.title)
      return true
    } catch (error) {
      console.error("[GoogleSheetsAuth] Authentication test error:", error)
      return false
    }
  }
}
