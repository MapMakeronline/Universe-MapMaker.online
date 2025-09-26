import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schemas
const SearchOffersSchema = z.object({
  q: z.string().min(1),
  category: z.string().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

const GetOfferSchema = z.object({
  id: z.string().min(1),
})

// Django backend URL
const DJANGO_BASE_URL = process.env.DJANGO_API_URL || "http://localhost:8000/api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const offerId = searchParams.get("id")

    if (offerId) {
      // Get single offer by ID
      const validation = GetOfferSchema.safeParse({ id: offerId })
      if (!validation.success) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid offer ID" } }, { status: 400 })
      }

      const response = await fetch(`${DJANGO_BASE_URL}/offers/${offerId}/`, {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: { code: "NOT_FOUND", message: "Offer not found" } }, { status: 404 })
        }
        throw new Error(`Django API error: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Search offers
      const validation = SearchOffersSchema.safeParse(Object.fromEntries(searchParams))
      if (!validation.success) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Search query is required" } },
          { status: 400 },
        )
      }

      const { q, category, priceMin, priceMax, location, limit, offset } = validation.data
      const queryParams = new URLSearchParams({
        search: q,
        ...(category && { category }),
        ...(priceMin && { price_min: priceMin.toString() }),
        ...(priceMax && { price_max: priceMax.toString() }),
        ...(location && { location }),
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`${DJANGO_BASE_URL}/offers/search/?${queryParams}`, {
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
    console.error("Proxy error (offers):", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch offer data" } },
      { status: 500 },
    )
  }
}
