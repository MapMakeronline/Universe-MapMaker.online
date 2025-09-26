import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsServerClient } from "@/server/google/sheetsClient"
import { PullDataSchema } from "@/lib/validation/sheets"
import type { ApiErrorResponse, PullDataResponse } from "@/lib/validation/sheets"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spreadsheetId, sheetTitle } = PullDataSchema.parse(body)

    const client = new GoogleSheetsServerClient()
    const rows = await client.getRows(spreadsheetId, sheetTitle)

    const response: PullDataResponse = {
      rows,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API] /api/sheets/pull failed:", error)

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
        message: "Failed to pull data",
      },
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
