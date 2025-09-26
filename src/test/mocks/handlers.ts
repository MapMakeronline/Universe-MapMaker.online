import { http, HttpResponse } from "msw"

export const handlers = [
  // Mock Google Sheets API
  http.post("/api/sheets/ensure", () => {
    return HttpResponse.json({
      spreadsheetId: "mock-sheet-id",
      url: "https://docs.google.com/spreadsheets/d/mock-sheet-id",
    })
  }),

  // Mock GeoServer WFS
  http.get("*/geoserver/*/wfs", () => {
    return HttpResponse.json({
      type: "FeatureCollection",
      features: [],
    })
  }),
]
