export interface GoogleSheetsConfig {
  spreadsheetId: string
  serviceAccountEmail: string
  privateKey: string
  scopes?: string[]
}

export interface SheetData {
  range: string
  majorDimension: "ROWS" | "COLUMNS"
  values: any[][]
}

export interface SheetMetadata {
  spreadsheetId: string
  properties: {
    title: string
    locale: string
    autoRecalc: string
    timeZone: string
  }
  sheets: Array<{
    properties: {
      sheetId: number
      title: string
      index: number
      sheetType: string
      gridProperties: {
        rowCount: number
        columnCount: number
      }
    }
  }>
}

export interface BatchUpdateRequest {
  requests: Array<{
    updateCells?: {
      range: {
        sheetId: number
        startRowIndex?: number
        endRowIndex?: number
        startColumnIndex?: number
        endColumnIndex?: number
      }
      rows: Array<{
        values: Array<{
          userEnteredValue: {
            stringValue?: string
            numberValue?: number
            boolValue?: boolean
            formulaValue?: string
          }
        }>
      }>
      fields: string
    }
    addSheet?: {
      properties: {
        title: string
        gridProperties: {
          rowCount: number
          columnCount: number
        }
      }
    }
    deleteSheet?: {
      sheetId: number
    }
  }>
}

export interface ParcelData {
  id: string
  numer: string
  powierzchnia: number
  klasaBonitacyjna: string
  uzytekGruntowy: string
  wspolrzedne: {
    lat: number
    lng: number
  }
  granice: Array<{
    lat: number
    lng: number
  }>
  wlasciciel?: string
  adres?: string
  dataAktualizacji: string
}

export interface LayerData {
  id: string
  nazwa: string
  typ: "WMS" | "WFS" | "MVT" | "GeoJSON"
  url: string
  widoczna: boolean
  przezroczystosc: number
  kolejnosc: number
  grupa?: string
  metadane?: Record<string, any>
}

export interface GoogleSheetsError extends Error {
  code?: number
  status?: string
  details?: any
}
