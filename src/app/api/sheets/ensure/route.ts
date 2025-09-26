import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsServerClient } from "@/server/google/sheetsClient"
import { EnsureSpreadsheetSchema } from "@/lib/validation/sheets"
import type { ApiErrorResponse, EnsureSpreadsheetResponse } from "@/lib/validation/sheets"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datasetName } = EnsureSpreadsheetSchema.parse(body)

    const client = new GoogleSheetsServerClient()
    const result = await client.ensureSpreadsheet(datasetName)

    const response: EnsureSpreadsheetResponse = {
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API] /api/sheets/ensure failed:", error)

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
        message: "Failed to ensure spreadsheet",
      },
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
