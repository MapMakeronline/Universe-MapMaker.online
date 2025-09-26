import type { ParcelData, LayerData, SheetData } from "./types"

/**
 * Data mapping utilities for converting between Google Sheets and application data
 */
export class GoogleSheetsDataMapper {
  /**
   * Convert sheet data to parcel objects
   */
  static mapSheetToparcels(sheetData: SheetData): ParcelData[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return []
    }

    const [headers, ...rows] = sheetData.values
    const parcels: ParcelData[] = []

    for (const row of rows) {
      try {
        const parcel: ParcelData = {
          id: row[0]?.toString() || "",
          numer: row[1]?.toString() || "",
          powierzchnia: Number.parseFloat(row[2]?.toString() || "0"),
          klasaBonitacyjna: row[3]?.toString() || "",
          uzytekGruntowy: row[4]?.toString() || "",
          wspolrzedne: {
            lat: Number.parseFloat(row[5]?.toString() || "0"),
            lng: Number.parseFloat(row[6]?.toString() || "0"),
          },
          granice: this.parseCoordinates(row[7]?.toString() || ""),
          wlasciciel: row[8]?.toString() || "",
          adres: row[9]?.toString() || "",
          dataAktualizacji: row[10]?.toString() || new Date().toISOString(),
        }

        if (parcel.id && parcel.numer) {
          parcels.push(parcel)
        }
      } catch (error) {
        console.warn("[DataMapper] Failed to parse parcel row:", row, error)
      }
    }

    console.log(`[DataMapper] Mapped ${parcels.length} parcels from sheet data`)
    return parcels
  }

  /**
   * Convert parcel objects to sheet data
   */
  static mapParcelsToSheet(parcels: ParcelData[]): SheetData {
    const headers = [
      "ID",
      "Numer",
      "Powierzchnia",
      "Klasa Bonitacyjna",
      "Użytek Gruntowy",
      "Szerokość",
      "Długość",
      "Granice",
      "Właściciel",
      "Adres",
      "Data Aktualizacji",
    ]

    const values = [
      headers,
      ...parcels.map((parcel) => [
        parcel.id,
        parcel.numer,
        parcel.powierzchnia,
        parcel.klasaBonitacyjna,
        parcel.uzytekGruntowy,
        parcel.wspolrzedne.lat,
        parcel.wspolrzedne.lng,
        this.stringifyCoordinates(parcel.granice),
        parcel.wlasciciel || "",
        parcel.adres || "",
        parcel.dataAktualizacji,
      ]),
    ]

    return {
      range: "A1:K" + (parcels.length + 1),
      majorDimension: "ROWS",
      values,
    }
  }

  /**
   * Convert sheet data to layer objects
   */
  static mapSheetToLayers(sheetData: SheetData): LayerData[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return []
    }

    const [headers, ...rows] = sheetData.values
    const layers: LayerData[] = []

    for (const row of rows) {
      try {
        const layer: LayerData = {
          id: row[0]?.toString() || "",
          nazwa: row[1]?.toString() || "",
          typ: (row[2]?.toString() as LayerData["typ"]) || "WMS",
          url: row[3]?.toString() || "",
          widoczna: this.parseBoolean(row[4]?.toString()),
          przezroczystosc: Number.parseFloat(row[5]?.toString() || "1"),
          kolejnosc: Number.parseInt(row[6]?.toString() || "0"),
          grupa: row[7]?.toString() || undefined,
          metadane: this.parseJSON(row[8]?.toString()),
        }

        if (layer.id && layer.nazwa && layer.url) {
          layers.push(layer)
        }
      } catch (error) {
        console.warn("[DataMapper] Failed to parse layer row:", row, error)
      }
    }

    console.log(`[DataMapper] Mapped ${layers.length} layers from sheet data`)
    return layers
  }

  /**
   * Convert layer objects to sheet data
   */
  static mapLayersToSheet(layers: LayerData[]): SheetData {
    const headers = ["ID", "Nazwa", "Typ", "URL", "Widoczna", "Przezroczystość", "Kolejność", "Grupa", "Metadane"]

    const values = [
      headers,
      ...layers.map((layer) => [
        layer.id,
        layer.nazwa,
        layer.typ,
        layer.url,
        layer.widoczna,
        layer.przezroczystosc,
        layer.kolejnosc,
        layer.grupa || "",
        layer.metadane ? JSON.stringify(layer.metadane) : "",
      ]),
    ]

    return {
      range: "A1:I" + (layers.length + 1),
      majorDimension: "ROWS",
      values,
    }
  }

  /**
   * Parse coordinate string to array of coordinates
   */
  private static parseCoordinates(coordString: string): Array<{ lat: number; lng: number }> {
    try {
      if (!coordString) return []

      const coords = JSON.parse(coordString)
      if (Array.isArray(coords)) {
        return coords.map((coord) => ({
          lat: Number.parseFloat(coord.lat || coord[0]),
          lng: Number.parseFloat(coord.lng || coord[1]),
        }))
      }
      return []
    } catch {
      return []
    }
  }

  /**
   * Convert coordinates array to string
   */
  private static stringifyCoordinates(coordinates: Array<{ lat: number; lng: number }>): string {
    try {
      return JSON.stringify(coordinates)
    } catch {
      return "[]"
    }
  }

  /**
   * Parse boolean from string
   */
  private static parseBoolean(value?: string): boolean {
    if (!value) return false
    const lower = value.toLowerCase()
    return lower === "true" || lower === "1" || lower === "tak" || lower === "yes"
  }

  /**
   * Parse JSON from string
   */
  private static parseJSON(value?: string): Record<string, any> | undefined {
    try {
      return value ? JSON.parse(value) : undefined
    } catch {
      return undefined
    }
  }

  /**
   * Validate parcel data
   */
  static validateParcelData(parcel: Partial<ParcelData>): string[] {
    const errors: string[] = []

    if (!parcel.id) errors.push("ID jest wymagane")
    if (!parcel.numer) errors.push("Numer działki jest wymagany")
    if (!parcel.powierzchnia || parcel.powierzchnia <= 0) errors.push("Powierzchnia musi być większa od 0")
    if (!parcel.wspolrzedne?.lat || !parcel.wspolrzedne?.lng) errors.push("Współrzędne są wymagane")

    return errors
  }

  /**
   * Validate layer data
   */
  static validateLayerData(layer: Partial<LayerData>): string[] {
    const errors: string[] = []

    if (!layer.id) errors.push("ID jest wymagane")
    if (!layer.nazwa) errors.push("Nazwa warstwy jest wymagana")
    if (!layer.url) errors.push("URL warstwy jest wymagany")
    if (!["WMS", "WFS", "MVT", "GeoJSON"].includes(layer.typ || "")) {
      errors.push("Typ warstwy musi być WMS, WFS, MVT lub GeoJSON")
    }

    return errors
  }
}
