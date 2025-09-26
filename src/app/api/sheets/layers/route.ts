import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsClient } from "@/lib/google-sheets/client"
import { GoogleSheetsDataMapper } from "@/lib/google-sheets/data-mapper"
import type { LayerData } from "@/lib/google-sheets/types"

// Force Node.js runtime (not Edge) as per requirements
export const runtime = "nodejs"

const sheetsClient = new GoogleSheetsClient({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
  serviceAccountEmail: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL!,
  privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
})

/**
 * GET /api/sheets/layers
 * Retrieve layers configuration from Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "Warstwy!A:I"

    console.log(`[API] Getting layers from range: ${range}`)

    const sheetData = await sheetsClient.readRange(range)
    const layers = GoogleSheetsDataMapper.mapSheetToLayers(sheetData)

    // Sort by order
    layers.sort((a, b) => a.kolejnosc - b.kolejnosc)

    return NextResponse.json({
      success: true,
      data: layers,
      total: layers.length,
    })
  } catch (error) {
    console.error("[API] Failed to get layers:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve layers",
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/sheets/layers
 * Add new layer configuration to Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const layerData: Partial<LayerData> = await request.json()

    // Validate data
    const errors = GoogleSheetsDataMapper.validateLayerData(layerData)
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

    const layer: LayerData = layerData as LayerData

    // Convert to sheet format and append
    const sheetData = GoogleSheetsDataMapper.mapLayersToSheet([layer])
    const success = await sheetsClient.appendData("Warstwy!A:I", [sheetData.values[1]]) // Skip header

    if (success) {
      console.log(`[API] Added layer: ${layer.id}`)
      return NextResponse.json({
        success: true,
        data: layer,
      })
    } else {
      throw new Error("Failed to append layer to sheet")
    }
  } catch (error) {
    console.error("[API] Failed to add layer:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add layer",
      },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/sheets/layers
 * Update existing layer configuration in Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const layerData: LayerData = await request.json()

    // Validate data
    const errors = GoogleSheetsDataMapper.validateLayerData(layerData)
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

    // Read current layers
    const sheetData = await sheetsClient.readRange("Warstwy!A:I")
    const layers = GoogleSheetsDataMapper.mapSheetToLayers(sheetData)

    const index = layers.findIndex((l) => l.id === layerData.id)
    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Layer not found",
        },
        { status: 404 },
      )
    }

    // Update the layer in the array
    layers[index] = layerData

    // Write back to sheet
    const updatedSheetData = GoogleSheetsDataMapper.mapLayersToSheet(layers)
    const success = await sheetsClient.writeRange("Warstwy!A:I", updatedSheetData.values)

    if (success) {
      console.log(`[API] Updated layer: ${layerData.id}`)
      return NextResponse.json({
        success: true,
        data: layerData,
      })
    } else {
      throw new Error("Failed to update sheet data")
    }
  } catch (error) {
    console.error("[API] Failed to update layer:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update layer",
      },
      { status: 500 },
    )
  }
}
