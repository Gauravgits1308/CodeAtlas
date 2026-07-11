export interface Repository {
  id: string
  name: string
  owner: string
  url: string
  provider: "github" | "gitlab" | "bitbucket"
  isPrivate: boolean
  status: "PENDING" | "QUEUED" | "CLONING" | "ANALYZING" | "INDEXING" | "PROCESSING" | "COMPLETED" | "FAILED"
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
}

export interface CodeMetric {
  linesCount: number
  filesCount: number
  languages: { name: string; percentage: number }[]
  complexityScore?: number
  dependencyCount?: number
}

export interface RepositoryDetails extends Repository {
  metrics?: CodeMetric
}
