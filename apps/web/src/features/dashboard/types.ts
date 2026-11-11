export interface Repository {
  id: string
  name: string
  owner: string
  url: string
  provider: "github" | "gitlab" | "bitbucket"
  isPrivate: boolean
  status: "PENDING" | "QUEUED" | "CLONING" | "ANALYZING" | "INDEXING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "STALLED"
  isArchived?: boolean
  lastSyncedAt?: string
  createdAt: string
  primaryLanguage?: string | null
  description?: string | null
  stars?: number
  forks?: number
  watchers?: number
  defaultBranch?: string
  chunksCount?: number
  embeddingsCount?: number
  classifications?: {
    SOURCE_CODE: number
    MARKUP: number
    STYLESHEET: number
    CONFIGURATION: number
    DOCUMENTATION: number
  }
}

export interface CodeMetric {
  linesCount: number
  filesCount: number
  languages: { name: string; percentage: number }[]
  complexityScore?: number
  dependencyCount?: number
  averageFileSize?: number
  documentationCoverage?: number
}

export interface RepositoryDetails extends Repository {
  metrics?: CodeMetric
}
