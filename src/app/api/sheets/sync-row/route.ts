import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsServerClient } from "@/server/google/sheetsClient"
import { SyncRowSchema } from "@/lib/validation/sheets"
import type { ApiErrorResponse, SyncRowResponse } from "@/lib/validation/sheets"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spreadsheetId, sheetTitle, keyColumn, keyValue, row } = SyncRowSchema.parse(body)

    const client = new GoogleSheetsServerClient()

    // Ensure worksheet exists with proper headers
    const headers = Object.keys(row)
    await client.ensureWorksheet(spreadsheetId, sheetTitle, headers)

    // Upsert the row
    const result = await client.upsertRow(spreadsheetId, sheetTitle, keyColumn, keyValue, row)

    // Generate spreadsheet URL
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`

    const response: SyncRowResponse = {
      success: true,
      rowIndex: result.rowIndex,
      isNew: result.isNew,
      spreadsheetUrl,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API] /api/sheets/sync-row failed:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sync row",
      },
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
