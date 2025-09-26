// Common types used across the application
export interface ApiError {
  status: number
  data: {
    error: {
      code: string
      message: string
      details?: any
    }
  }
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface FilterParams {
  search?: string
  dateFrom?: string
  dateTo?: string
  status?: string[]
  tags?: string[]
}

export interface GeoServerConfig {
  baseUrl: string
  workspace?: string
  username?: string
  password?: string
}

export interface MapboxConfig {
  accessToken: string
  style: string
  center: [number, number]
  zoom: number
  pitch?: number
  bearing?: number
}

export interface GoogleSheetsConfig {
  projectId: string
  serviceAccountEmail: string
  serviceAccountKey: string
  parentFolderId?: string
}
