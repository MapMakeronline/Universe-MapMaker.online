import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schemas
const GetParcelSchema = z.object({
  id: z.string().min(1),
})

const SearchParcelsSchema = z.object({
  q: z.string().optional(),
  bbox: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

// Django backend URL - should be in environment variables
const DJANGO_BASE_URL = process.env.DJANGO_API_URL || "http://localhost:8000/api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parcelId = searchParams.get("id")

    if (parcelId) {
      // Get single parcel by ID
      const validation = GetParcelSchema.safeParse({ id: parcelId })
      if (!validation.success) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid parcel ID" } }, { status: 400 })
      }

      const response = await fetch(`${DJANGO_BASE_URL}/parcels/${parcelId}/`, {
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if needed
        },
        // Cache for 60 seconds
        next: { revalidate: 60 },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parcel not found" } }, { status: 404 })
        }
        throw new Error(`Django API error: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Search parcels
      const validation = SearchParcelsSchema.safeParse(Object.fromEntries(searchParams))
      if (!validation.success) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid search parameters" } },
          { status: 400 },
        )
      }

      const { q, bbox, limit, offset } = validation.data
      const queryParams = new URLSearchParams({
        ...(q && { search: q }),
        ...(bbox && { bbox }),
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`${DJANGO_BASE_URL}/parcels/?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      })

      if (!response.ok) {
        throw new Error(`Django API error: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("Proxy error (parcels):", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch parcel data" } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parcelId = searchParams.get("id")

    if (!parcelId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Parcel ID is required" } },
        { status: 400 },
      )
    }

    const body = await request.json()

    const response = await fetch(`${DJANGO_BASE_URL}/parcels/${parcelId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parcel not found" } }, { status: 404 })
      }
      throw new Error(`Django API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Proxy error (update parcel):", error)
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update parcel" } }, { status: 500 })
  }
}
