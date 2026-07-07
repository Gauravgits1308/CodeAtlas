export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code?: string
  status: number
  details?: Record<string, string[]>
}

export interface AppConfig {
  apiUrl: string
  environment: "development" | "production" | "test"
  version: string
}
