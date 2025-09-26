import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsClient } from "@/lib/google-sheets/client"
import { GoogleSheetsDataMapper } from "@/lib/google-sheets/data-mapper"
import type { ParcelData } from "@/lib/google-sheets/types"

// Force Node.js runtime (not Edge) as per requirements
export const runtime = "nodejs"

const sheetsClient = new GoogleSheetsClient({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
  serviceAccountEmail: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL!,
  privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
})

/**
 * GET /api/sheets/parcels
 * Retrieve parcels data from Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "Działki!A:K"
    const limit = Number.parseInt(searchParams.get("limit") || "1000")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log(`[API] Getting parcels from range: ${range}`)

    const sheetData = await sheetsClient.readRange(range)
    const parcels = GoogleSheetsDataMapper.mapSheetToparcels(sheetData)

    // Apply pagination
    const paginatedParcels = parcels.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedParcels,
      total: parcels.length,
      offset,
      limit,
    })
  } catch (error) {
    console.error("[API] Failed to get parcels:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve parcels",
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/sheets/parcels
 * Add new parcel to Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const parcelData: Partial<ParcelData> = await request.json()

    // Validate data
    const errors = GoogleSheetsDataMapper.validateParcelData(parcelData)
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      )
    }

    // Add timestamp
    const parcel: ParcelData = {
      ...parcelData,
      dataAktualizacji: new Date().toISOString(),
    } as ParcelData

    // Convert to sheet format and append
    const sheetData = GoogleSheetsDataMapper.mapParcelsToSheet([parcel])
    const success = await sheetsClient.appendData("Działki!A:K", [sheetData.values[1]]) // Skip header

    if (success) {
      console.log(`[API] Added parcel: ${parcel.id}`)
      return NextResponse.json({
        success: true,
        data: parcel,
      })
    } else {
      throw new Error("Failed to append data to sheet")
    }
  } catch (error) {
    console.error("[API] Failed to add parcel:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add parcel",
      },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/sheets/parcels
 * Update existing parcel in Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const parcelData: ParcelData = await request.json()

    // Validate data
    const errors = GoogleSheetsDataMapper.validateParcelData(parcelData)
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      )
    }

    // Update timestamp
    parcelData.dataAktualizacji = new Date().toISOString()

    // For updates, we need to find the row and update it
    // This is a simplified approach - in production, you might want to use batch updates
    const sheetData = await sheetsClient.readRange("Działki!A:K")
    const parcels = GoogleSheetsDataMapper.mapSheetToparcels(sheetData)

    const index = parcels.findIndex((p) => p.id === parcelData.id)
    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Parcel not found",
        },
        { status: 404 },
      )
    }

    // Update the parcel in the array
    parcels[index] = parcelData

    // Write back to sheet
    const updatedSheetData = GoogleSheetsDataMapper.mapParcelsToSheet(parcels)
    const success = await sheetsClient.writeRange("Działki!A:K", updatedSheetData.values)

    if (success) {
      console.log(`[API] Updated parcel: ${parcelData.id}`)
      return NextResponse.json({
        success: true,
        data: parcelData,
      })
    } else {
      throw new Error("Failed to update sheet data")
    }
  } catch (error) {
    console.error("[API] Failed to update parcel:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update parcel",
      },
      { status: 500 },
    )
  }
}
