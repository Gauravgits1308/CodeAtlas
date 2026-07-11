"use client"

import * as React from "react"
import { 
  GitBranch, 
  FileCode, 
  Layers, 
  Activity, 
  Search, 
  Plus, 
  RefreshCw, 
  Lock, 
  Globe, 
  ExternalLink,
  CheckCircle,
  Loader2,
  XCircle,
  Star,
  GitFork,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { Container } from "@/components/common/Container"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { Button } from "@/components/ui/button"
import { RepoSelectionModal } from "@/features/dashboard/components/RepoSelectionModal"
import { RepositoryDetails } from "@/features/dashboard/types"

interface DBRepository {
  id: string
  name: string
  owner: string
  cloneUrl: string
  htmlUrl: string
  visibility: string
  status: string
  updatedAt: string
  createdAt: string
  primaryLanguage: string | null
  stars: number
  forks: number
  watchers: number
  defaultBranch: string
  chunksCount: number
  embeddingsCount: number
  classifications?: {
    SOURCE_CODE: number
    MARKUP: number
    STYLESHEET: number
    CONFIGURATION: number
    DOCUMENTATION: number
  }
  metrics?: {
    linesCount: number
    filesCount: number
    languages: { name: string; percentage: number }[]
    complexityScore?: number
    dependencyCount?: number
  }
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [repositories, setRepositories] = React.useState<RepositoryDetails[]>([])
  const [syncingId, setSyncingId] = React.useState<string | null>(null)
  const [isRepoModalOpen, setIsRepoModalOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchRepos = React.useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; repositories: DBRepository[] }>("/v1/repositories")
      if (response.success && Array.isArray(response.repositories)) {
        const mapped = response.repositories.map((repo) => ({
          id: repo.id,
          name: repo.name,
          owner: repo.owner,
          url: repo.htmlUrl || repo.cloneUrl,
          provider: "github" as const,
          isPrivate: repo.visibility === "private",
          status: repo.status as RepositoryDetails["status"],
          lastSyncedAt: repo.updatedAt,
          createdAt: repo.createdAt,
          primaryLanguage: repo.primaryLanguage,
          stars: repo.stars,
          forks: repo.forks,
          watchers: repo.watchers,
          defaultBranch: repo.defaultBranch,
          chunksCount: repo.chunksCount,
          embeddingsCount: repo.embeddingsCount,
          classifications: repo.classifications || undefined,
          metrics: repo.metrics ? {
            linesCount: repo.metrics.linesCount,
            filesCount: repo.metrics.filesCount,
            languages: repo.metrics.languages,
            complexityScore: repo.metrics.complexityScore || undefined,
            dependencyCount: repo.metrics.dependencyCount,
          } : undefined,
        }))
        setRepositories(mapped)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to load connected repositories.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRepos()
  }, [fetchRepos])

  // Filter repositories based on search
  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate totals
  const totalRepos = repositories.length
  const totalFiles = repositories.reduce((sum, repo) => sum + (repo.metrics?.filesCount || 0), 0)
  const totalLines = repositories.reduce((sum, repo) => sum + (repo.metrics?.linesCount || 0), 0)
  const reposWithComplexity = repositories.filter(repo => repo.metrics?.complexityScore !== undefined && repo.metrics.complexityScore > 0)
  const avgComplexity = reposWithComplexity.length > 0
    ? Math.round(reposWithComplexity.reduce((sum, repo) => sum + (repo.metrics?.complexityScore || 0), 0) / reposWithComplexity.length)
    : 0
  const aiReadyReposCount = repositories.filter(repo => (repo.embeddingsCount || 0) > 0).length

  const handleConnectRepo = () => {
    setIsRepoModalOpen(true)
  }

  const handleSyncRepo = async (id: string, name: string) => {
    if (syncingId === id) return
    setSyncingId(id)

    try {
      const response = await api.post<{ success: boolean; jobId: string; status: string }>(
        `/v1/repositories/${id}/process`
      )
      if (response.success) {
        toast.success("Repository queued for processing.")
        // Refresh local listings status
        await fetchRepos()
      } else {
        toast.error("Failed to queue repository for processing.")
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || `An error occurred while queuing ${name}.`)
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="py-8 min-h-full">
      <Container className="space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <Heading level="h1" className="text-3xl font-extrabold tracking-tight">
              Developer Console
            </Heading>
            <p className="text-sm text-muted-foreground">
              Monitor, document, and analyze your connected repositories
            </p>
          </div>
          <Button 
            onClick={handleConnectRepo} 
            className="bg-primary hover:bg-primary/95 text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Connect Repository</span>
          </Button>
        </div>

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1 */}
          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Repositories</span>
              <GitBranch className="size-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{totalRepos}</span>
              <span className="text-xs text-muted-foreground">connected</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Files Indexed</span>
              <FileCode className="size-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{totalFiles.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">files</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Lines of Code</span>
              <Layers className="size-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{totalLines.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">lines</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Complexity</span>
              <Activity className="size-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{avgComplexity}</span>
              <span className="text-xs text-muted-foreground">avg rating</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">AI Ready Repos</span>
              <CheckCircle className="size-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{aiReadyReposCount}</span>
              <span className="text-xs text-muted-foreground">repos</span>
            </div>
          </div>
        </div>

        {/* Repository Listing Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-[#111827]/30 border border-border/30 px-3.5 py-2 rounded-lg max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40 w-full"
            />
          </div>

          {/* Repositories Cards View */}
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading connected repositories...</p>
              </div>
            ) : totalRepos === 0 ? (
              <div className="text-center py-16 bg-[#111827]/10 border border-border/20 rounded-xl space-y-4 max-w-xl mx-auto">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  No repositories have been connected to CodeAtlas yet.
                  <br />
                  Connect a repository from GitHub to begin code analysis and semantic indexing.
                </p>
                <Button 
                  onClick={handleConnectRepo} 
                  className="bg-primary hover:bg-primary/95 text-white font-semibold flex items-center gap-1.5 mx-auto cursor-pointer rounded-xl text-xs h-9"
                >
                  <Plus className="size-4" />
                  <span>Connect Your First Repository</span>
                </Button>
              </div>
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <div 
                  key={repo.id} 
                  className="bg-[#111827]/35 border border-border/30 rounded-xl p-6 hover:border-border/50 transition-all backdrop-blur-sm flex flex-col md:flex-row md:items-start justify-between gap-6"
                >
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-bold text-lg leading-none text-foreground flex items-center gap-1.5">
                        {repo.name}
                      </h3>
                      {repo.isPrivate ? (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-amber-400 border-amber-400/20 bg-amber-400/5 flex items-center gap-1">
                          <Lock className="size-3" />
                          <span>Private</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 flex items-center gap-1">
                          <Globe className="size-3" />
                          <span>Public</span>
                        </Badge>
                      )}

                      {/* Status Badges */}
                      {repo.status === "PENDING" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-slate-400 border-slate-800 bg-slate-900/40 flex items-center gap-1">
                          <span>Imported</span>
                        </Badge>
                      )}
                      {repo.status === "QUEUED" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-purple-400 border-purple-400/20 bg-purple-400/5 flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          <span>Queued</span>
                        </Badge>
                      )}
                      {repo.status === "CLONING" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-cyan-400 border-cyan-400/20 bg-cyan-400/5 flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          <span>Cloning</span>
                        </Badge>
                      )}
                      {repo.status === "ANALYZING" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-indigo-400 border-indigo-400/20 bg-indigo-400/5 flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          <span>Analyzing</span>
                        </Badge>
                      )}
                      {(repo.status === "INDEXING" || repo.status === "PROCESSING") && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-blue-400 border-blue-400/20 bg-blue-400/5 flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          <span>Indexing...</span>
                        </Badge>
                      )}
                      {repo.status === "COMPLETED" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 flex items-center gap-1">
                          <CheckCircle className="size-3" />
                          <span>Completed</span>
                        </Badge>
                      )}
                      {repo.status === "FAILED" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-rose-400 border-rose-400/20 bg-rose-400/5 flex items-center gap-1">
                          <XCircle className="size-3" />
                          <span>Failed</span>
                        </Badge>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                        {repo.description}
                      </p>
                    )}

                    {/* Metadata Subtitles */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-mono">
                      <span>Owner: {repo.owner}</span>
                      {repo.defaultBranch && (
                        <>
                          <span>•</span>
                          <span>Branch: {repo.defaultBranch}</span>
                        </>
                      )}
                      {repo.primaryLanguage && (
                        <>
                          <span>•</span>
                          <span>{repo.primaryLanguage}</span>
                        </>
                      )}
                      {repo.stars !== undefined && repo.stars > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 text-amber-400 fill-amber-400/10" />
                            {repo.stars}
                          </span>
                        </>
                      )}
                      {repo.forks !== undefined && repo.forks > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <GitFork className="size-3 text-sky-400" />
                            {repo.forks}
                          </span>
                        </>
                      )}
                      {repo.watchers !== undefined && repo.watchers > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Activity className="size-3 text-indigo-400" />
                            {repo.watchers}
                          </span>
                        </>
                      )}
                      {repo.lastSyncedAt ? (
                        <>
                          <span>•</span>
                          <span>Synced: {new Date(repo.lastSyncedAt).toLocaleDateString()}</span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span>Imported: {new Date(repo.createdAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {/* Repository Processing & Metrics Insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 max-w-4xl">
                      {/* Chunks & Embeddings info */}
                      <div className="bg-[#111827]/25 border border-border/10 rounded-xl p-4.5 space-y-2 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Repository Indexing</span>
                        <div className="text-xs text-muted-foreground space-y-1 font-mono pt-1">
                          <div>Chunks: <span className="text-foreground font-bold">{repo.chunksCount || 0}</span></div>
                          <div>Embeddings: <span className="text-foreground font-bold">{repo.embeddingsCount || 0}</span></div>
                          {repo.classifications && (
                            <div className="pt-2 border-t border-border/10 space-y-1 mt-2 text-[11px] text-muted-foreground/80">
                              <div>Source Code: <span className="text-foreground font-semibold">{repo.classifications.SOURCE_CODE || 0}</span></div>
                              <div>Markup: <span className="text-foreground font-semibold">{repo.classifications.MARKUP || 0}</span></div>
                              <div>Stylesheets: <span className="text-foreground font-semibold">{repo.classifications.STYLESHEET || 0}</span></div>
                              <div>Configuration: <span className="text-foreground font-semibold">{repo.classifications.CONFIGURATION || 0}</span></div>
                              <div>Documentation: <span className="text-foreground font-semibold">{repo.classifications.DOCUMENTATION || 0}</span></div>
                            </div>
                          )}
                        </div>
                        {(repo.embeddingsCount || 0) > 0 && (
                          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-2">
                            <CheckCircle className="size-4 text-emerald-400 fill-emerald-500/10" />
                            <span>AI Ready</span>
                          </div>
                        )}
                      </div>

                      {/* CodeMetrics stats */}
                      <div className="bg-[#111827]/25 border border-border/10 rounded-xl p-4.5 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Analysis Metrics</span>
                        <div className="text-xs text-muted-foreground space-y-1 font-mono pt-1">
                          <div>Files Count: <span className="text-foreground font-bold">{repo.metrics?.filesCount || 0}</span></div>
                          <div>Lines Count: <span className="text-foreground font-bold">{(repo.metrics?.linesCount || 0).toLocaleString()}</span></div>
                        </div>
                      </div>

                      {/* Complexity & Dependencies */}
                      <div className="bg-[#111827]/25 border border-border/10 rounded-xl p-4.5 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Complexity Insights</span>
                        <div className="text-xs text-muted-foreground space-y-1 font-mono pt-1">
                          <div>Complexity: <span className="text-foreground font-bold">{repo.metrics?.complexityScore !== undefined ? repo.metrics.complexityScore : "N/A"}</span></div>
                          <div>Dependencies: <span className="text-foreground font-bold">{repo.metrics?.dependencyCount || 0}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Languages Stack Bar */}
                    {repo.metrics?.languages && repo.metrics.languages.length > 0 && (
                      <div className="space-y-1.5 max-w-md pt-1.5">
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/30">
                          {repo.metrics.languages.map((lang, idx) => {
                            const colors = ["bg-primary", "bg-purple-500", "bg-emerald-500", "bg-amber-500"]
                            const color = colors[idx % colors.length]
                            return (
                              <div
                                key={lang.name}
                                className={color}
                                style={{ width: `${lang.percentage}%` }}
                              />
                            )
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground/80 font-mono">
                          {repo.metrics.languages.map((lang, idx) => {
                            const dotColors = ["bg-primary", "bg-purple-500", "bg-emerald-500", "bg-amber-500"]
                            const dotColor = dotColors[idx % dotColors.length]
                            return (
                              <span key={lang.name} className="flex items-center gap-1.5">
                                <span className={`size-1.5 rounded-full ${dotColor}`} />
                                {lang.name} ({lang.percentage}%)
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <Link
                      href={`/dashboard/repository/${repo.id}/chat`}
                      className={`inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-xs font-semibold border transition-all ${
                        (repo.embeddingsCount || 0) > 0
                          ? "bg-primary border-primary text-white hover:bg-primary/90 cursor-pointer"
                          : "border-border/30 text-muted-foreground bg-muted/10 cursor-not-allowed pointer-events-none opacity-50"
                      }`}
                    >
                      <MessageSquare className="size-3.5 mr-1.5" />
                      <span>Chat</span>
                    </Link>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center size-9 border border-border/30 hover:bg-muted/40 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                      title="View GitHub Repository"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={repo.status === "QUEUED" || repo.status === "CLONING" || repo.status === "ANALYZING" || repo.status === "INDEXING" || repo.status === "PROCESSING" || syncingId === repo.id}
                      onClick={() => handleSyncRepo(repo.id, repo.name)}
                      className="border-border/30 hover:bg-muted/40 text-xs font-semibold flex items-center gap-1.5 h-9 px-3 cursor-pointer"
                    >
                      <RefreshCw className={`size-3.5 ${syncingId === repo.id ? "animate-spin" : ""}`} />
                      <span>Sync</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-[#111827]/10 border border-border/20 rounded-xl space-y-2 select-none">
                <p className="text-muted-foreground text-sm">No repositories match your search criteria</p>
              </div>
            )}
          </div>
        </div>
      </Container>
      <RepoSelectionModal 
        isOpen={isRepoModalOpen} 
        onClose={() => setIsRepoModalOpen(false)} 
        onImportSuccess={fetchRepos}
      />
    </div>
  )
}
