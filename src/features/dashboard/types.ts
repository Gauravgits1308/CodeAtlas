export interface Repository {
  id: string
  name: string
  owner: string
  url: string
  provider: "github" | "gitlab" | "bitbucket"
  isPrivate: boolean
  status: "indexing" | "active" | "failed"
  lastSyncedAt?: string
  createdAt: string
}

export interface CodeMetric {
  linesCount: number
  filesCount: number
  languages: { name: string; percentage: number }[]
  complexityScore?: number
}

export interface RepositoryDetails extends Repository {
  metrics?: CodeMetric
}
