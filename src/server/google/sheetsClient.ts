import { JWT } from "google-auth-library"
import { google } from "googleapis"

/**
 * Enhanced Google Sheets Client with service account authentication
 * Supports spreadsheet creation, worksheet management, and data operations
 */
export class GoogleSheetsServerClient {
  private jwtClient: JWT
  private sheets: any
  private drive: any

  constructor() {
    // Initialize JWT client with service account credentials
    this.jwtClient = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    })

    // Initialize Google APIs
    this.sheets = google.sheets({ version: "v4", auth: this.jwtClient })
    this.drive = google.drive({ version: "v3", auth: this.jwtClient })
  }

  /**
   * Ensure spreadsheet exists, create if not found
   */
  async ensureSpreadsheet(datasetName: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    try {
      // Search for existing spreadsheet
      const searchResponse = await this.drive.files.list({
        q: `name='${datasetName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: "files(id, name, webViewLink)",
      })

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const file = searchResponse.data.files[0]
        return {
          spreadsheetId: file.id!,
          spreadsheetUrl: file.webViewLink!,
        }
      }

      // Create new spreadsheet
      const createResponse = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: datasetName,
            locale: "pl_PL",
            timeZone: "Europe/Warsaw",
          },
          sheets: [
            {
              properties: {
                title: "Dane",
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 26,
                },
              },
            },
          ],
        },
      })

      const spreadsheetId = createResponse.data.spreadsheetId!
      const spreadsheetUrl = createResponse.data.spreadsheetUrl!

      // Move to parent folder if specified
      if (process.env.GOOGLE_SHEETS_PARENT_FOLDER_ID) {
        await this.drive.files.update({
          fileId: spreadsheetId,
          addParents: process.env.GOOGLE_SHEETS_PARENT_FOLDER_ID,
          fields: "id, parents",
        })
      }

      console.log(`[GoogleSheetsServerClient] Created spreadsheet: ${datasetName}`)
      return { spreadsheetId, spreadsheetUrl }
    } catch (error) {
      console.error("[GoogleSheetsServerClient] Failed to ensure spreadsheet:", error)
      throw new Error(`Failed to ensure spreadsheet: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Ensure worksheet exists with proper headers
   */
  async ensureWorksheet(
    spreadsheetId: string,
    title: string,
    headers: string[],
  ): Promise<{ sheetId: number; sheetTitle: string }> {
    try {
      // Get spreadsheet metadata
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties",
      })

      // Check if worksheet exists
      const existingSheet = spreadsheet.data.sheets?.find((sheet: any) => sheet.properties.title === title)

      if (existingSheet) {
        // Check if headers match
        const range = `${title}!A1:${String.fromCharCode(64 + headers.length)}1`
        const headerResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        })

        const existingHeaders = headerResponse.data.values?.[0] || []
        const headersMatch =
          headers.length === existingHeaders.length &&
          headers.every((header, index) => header === existingHeaders[index])

        if (!headersMatch) {
          // Update headers
          await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [headers],
            },
          })
        }

        return {
          sheetId: existingSheet.properties.sheetId,
          sheetTitle: existingSheet.properties.title,
        }
      }

      // Create new worksheet
      const addSheetResponse = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: Math.max(headers.length, 10),
                  },
                },
              },
            },
          ],
        },
      })

      const sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId

      // Add headers
      const headerRange = `${title}!A1:${String.fromCharCode(64 + headers.length)}1`
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers],
        },
      })

      console.log(`[GoogleSheetsServerClient] Created worksheet: ${title}`)
      return { sheetId, sheetTitle: title }
    } catch (error) {
      console.error("[GoogleSheetsServerClient] Failed to ensure worksheet:", error)
      throw new Error(`Failed to ensure worksheet: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Upsert row data (insert or update based on key column)
   */
  async upsertRow(
    spreadsheetId: string,
    sheetTitle: string,
    keyColumn: string,
    keyValue: string,
    row: Record<string, any>,
  ): Promise<{ rowIndex: number; isNew: boolean }> {
    try {
      // Get all data to find existing row
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetTitle}!A:ZZ`,
      })

      const values = dataResponse.data.values || []
      if (values.length === 0) {
        throw new Error("No headers found in worksheet")
      }

      const headers = values[0]
      const keyColumnIndex = headers.indexOf(keyColumn)

      if (keyColumnIndex === -1) {
        throw new Error(`Key column '${keyColumn}' not found in headers`)
      }

      // Find existing row
      let existingRowIndex = -1
      for (let i = 1; i < values.length; i++) {
        if (values[i][keyColumnIndex] === keyValue) {
          existingRowIndex = i
          break
        }
      }

      // Prepare row data
      const rowData = headers.map((header) => row[header] || "")

      if (existingRowIndex !== -1) {
        // Update existing row
        const range = `${sheetTitle}!A${existingRowIndex + 1}:${String.fromCharCode(64 + headers.length)}${existingRowIndex + 1}`
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowData],
          },
        })

        return { rowIndex: existingRowIndex + 1, isNew: false }
      } else {
        // Append new row
        await this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetTitle}!A:A`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: [rowData],
          },
        })

        return { rowIndex: values.length + 1, isNew: true }
      }
    } catch (error) {
      console.error("[GoogleSheetsServerClient] Failed to upsert row:", error)
      throw new Error(`Failed to upsert row: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get all rows from worksheet
   */
  async getRows(spreadsheetId: string, sheetTitle: string): Promise<Record<string, any>[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetTitle}!A:ZZ`,
      })

      const values = response.data.values || []
      if (values.length === 0) {
        return []
      }

      const headers = values[0]
      const rows = values.slice(1)

      return rows.map((row) => {
        const rowData: Record<string, any> = {}
        headers.forEach((header, index) => {
          rowData[header] = row[index] || ""
        })
        return rowData
      })
    } catch (error) {
      console.error("[GoogleSheetsServerClient] Failed to get rows:", error)
      throw new Error(`Failed to get rows: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Test connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.drive.files.list({
        pageSize: 1,
        fields: "files(id, name)",
      })
      return true
    } catch (error) {
      console.error("[GoogleSheetsServerClient] Connection test failed:", error)
      return false
    }
  }
}
