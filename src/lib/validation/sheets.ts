import { z } from "zod"

export const EnsureSpreadsheetSchema = z.object({
  datasetName: z.string().min(1, "Dataset name is required").max(100, "Dataset name too long"),
})

export const SyncRowSchema = z.object({
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetTitle: z.string().min(1, "Sheet title is required"),
  keyColumn: z.string().min(1, "Key column is required"),
  keyValue: z.string().min(1, "Key value is required"),
  row: z.record(z.any()),
})

export const PullDataSchema = z.object({
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetTitle: z.string().min(1, "Sheet title is required"),
})

export type EnsureSpreadsheetRequest = z.infer<typeof EnsureSpreadsheetSchema>
export type SyncRowRequest = z.infer<typeof SyncRowSchema>
export type PullDataRequest = z.infer<typeof PullDataSchema>

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
  }
}

export interface EnsureSpreadsheetResponse {
  spreadsheetId: string
  spreadsheetUrl: string
}

export interface SyncRowResponse {
  success: true
  rowIndex: number
  isNew: boolean
  spreadsheetUrl: string
}

export interface PullDataResponse {
  rows: Record<string, any>[]
}
