import { NextResponse } from "next/server"
import { GoogleSheetsClient } from "@/lib/google-sheets/client"

// Force Node.js runtime (not Edge) as per requirements
export const runtime = "nodejs"

/**
 * GET /api/sheets/test
 * Test Google Sheets connection and authentication
 */
export async function GET() {
  try {
    const sheetsClient = new GoogleSheetsClient({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
      serviceAccountEmail: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL!,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
    })

    const isConnected = await sheetsClient.testConnection()

    if (isConnected) {
      const metadata = await sheetsClient.getSpreadsheetMetadata()

      return NextResponse.json({
        success: true,
        message: "Google Sheets connection successful",
        spreadsheet: {
          title: metadata.properties.title,
          locale: metadata.properties.locale,
          sheets: metadata.sheets.map((sheet) => ({
            title: sheet.properties.title,
            id: sheet.properties.sheetId,
            rows: sheet.properties.gridProperties.rowCount,
            columns: sheet.properties.gridProperties.columnCount,
          })),
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to Google Sheets",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[API] Google Sheets test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 },
    )
  }
}
