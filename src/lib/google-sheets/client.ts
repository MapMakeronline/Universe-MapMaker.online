import { GoogleSheetsAuth } from "./auth"
import type { GoogleSheetsConfig, SheetData, SheetMetadata, BatchUpdateRequest, GoogleSheetsError } from "./types"

/**
 * Google Sheets API Client
 * Provides methods for reading and writing spreadsheet data
 * Must use Node.js runtime (not Edge) as per requirements
 */
export class GoogleSheetsClient {
  private auth: GoogleSheetsAuth
  private baseUrl = "https://sheets.googleapis.com/v4/spreadsheets"

  constructor(config: GoogleSheetsConfig) {
    this.auth = new GoogleSheetsAuth(config)
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetMetadata(): Promise<SheetMetadata> {
    try {
      const headers = await this.auth.getAuthHeaders()
      const response = await fetch(`${this.baseUrl}/${this.auth["config"].spreadsheetId}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.status} ${response.statusText}`)
      }

      const metadata = await response.json()
      console.log("[GoogleSheetsClient] Retrieved spreadsheet metadata")
      return metadata
    } catch (error) {
      const sheetsError = error as GoogleSheetsError
      console.error("[GoogleSheetsClient] Failed to get metadata:", sheetsError)
      throw new Error(`Metadata retrieval failed: ${sheetsError.message}`)
    }
  }

  /**
   * Read data from a specific range
   */
  async readRange(range: string, majorDimension: "ROWS" | "COLUMNS" = "ROWS"): Promise<SheetData> {
    try {
      const headers = await this.auth.getAuthHeaders()
      const url = `${this.baseUrl}/${this.auth["config"].spreadsheetId}/values/${encodeURIComponent(range)}`
      const params = new URLSearchParams({
        majorDimension,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      })

      const response = await fetch(`${url}?${params}`, { headers })

      if (!response.ok) {
        throw new Error(`Failed to read range: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`[GoogleSheetsClient] Read range ${range}: ${data.values?.length || 0} rows`)

      return {
        range: data.range || range,
        majorDimension: data.majorDimension || majorDimension,
        values: data.values || [],
      }
    } catch (error) {
      const sheetsError = error as GoogleSheetsError
      console.error("[GoogleSheetsClient] Failed to read range:", sheetsError)
      throw new Error(`Range read failed: ${sheetsError.message}`)
    }
  }

  /**
   * Write data to a specific range
   */
  async writeRange(range: string, values: any[][], majorDimension: "ROWS" | "COLUMNS" = "ROWS"): Promise<boolean> {
    try {
      const headers = await this.auth.getAuthHeaders()
      const url = `${this.baseUrl}/${this.auth["config"].spreadsheetId}/values/${encodeURIComponent(range)}`

      const body = {
        range,
        majorDimension,
        values,
      }

      const response = await fetch(`${url}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Failed to write range: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[GoogleSheetsClient] Wrote range ${range}: ${result.updatedCells} cells updated`)
      return true
    } catch (error) {
      const sheetsError = error as GoogleSheetsError
      console.error("[GoogleSheetsClient] Failed to write range:", sheetsError)
      throw new Error(`Range write failed: ${sheetsError.message}`)
    }
  }

  /**
   * Append data to a sheet
   */
  async appendData(range: string, values: any[][], majorDimension: "ROWS" | "COLUMNS" = "ROWS"): Promise<boolean> {
    try {
      const headers = await this.auth.getAuthHeaders()
      const url = `${this.baseUrl}/${this.auth["config"].spreadsheetId}/values/${encodeURIComponent(range)}:append`

      const body = {
        range,
        majorDimension,
        values,
      }

      const response = await fetch(`${url}?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Failed to append data: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[GoogleSheetsClient] Appended data: ${result.updates?.updatedCells} cells added`)
      return true
    } catch (error) {
      const sheetsError = error as GoogleSheetsError
      console.error("[GoogleSheetsClient] Failed to append data:", sheetsError)
      throw new Error(`Data append failed: ${sheetsError.message}`)
    }
  }

  /**
   * Batch update spreadsheet
   */
  async batchUpdate(requests: BatchUpdateRequest["requests"]): Promise<boolean> {
    try {
      const headers = await this.auth.getAuthHeaders()
      const url = `${this.baseUrl}/${this.auth["config"].spreadsheetId}:batchUpdate`

      const body: BatchUpdateRequest = { requests }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Failed to batch update: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[GoogleSheetsClient] Batch update completed: ${requests.length} requests processed`)
      return true
    } catch (error) {
      const sheetsError = error as GoogleSheetsError
      console.error("[GoogleSheetsClient] Failed to batch update:", sheetsError)
      throw new Error(`Batch update failed: ${sheetsError.message}`)
    }
  }

  /**
   * Clear range data
   */
  async clearRange(range: string): Promise<boolean> {
    try {
      const headers = await this.auth.getAuthHeaders()
      const url = `${this.baseUrl}/${this.auth["config"].spreadsheetId}/values/${encodeURIComponent(range)}:clear`

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error(`Failed to clear range: ${response.status} ${response.statusText}`)
      }

      console.log(`[GoogleSheetsClient] Cleared range: ${range}`)
      return true
    } catch (error) {
      const sheetsError = error as GoogleSheetsError
      console.error("[GoogleSheetsClient] Failed to clear range:", sheetsError)
      throw new Error(`Range clear failed: ${sheetsError.message}`)
    }
  }

  /**
   * Test connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      const isValid = this.auth.validateConfig()
      if (!isValid) {
        return false
      }

      const isAuthenticated = await this.auth.testAuthentication()
      if (!isAuthenticated) {
        return false
      }

      // Try to read a simple range
      await this.getSpreadsheetMetadata()
      return true
    } catch (error) {
      console.error("[GoogleSheetsClient] Connection test failed:", error)
      return false
    }
  }
}
