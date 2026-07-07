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
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { Container } from "@/components/common/Container"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { Button } from "@/components/ui/button"
import { RepositoryDetails } from "@/features/dashboard/types"

const mockRepositories: RepositoryDetails[] = [
  {
    id: "1",
    name: "code-atlas-core",
    owner: "codeatlas-org",
    url: "https://github.com/codeatlas-org/code-atlas-core",
    provider: "github",
    isPrivate: true,
    status: "active",
    lastSyncedAt: "2026-07-07T12:00:00Z",
    createdAt: "2026-06-01T08:00:00Z",
    metrics: {
      linesCount: 45200,
      filesCount: 312,
      languages: [
        { name: "TypeScript", percentage: 68 },
        { name: "React", percentage: 22 },
        { name: "CSS", percentage: 10 },
      ],
      complexityScore: 78,
    },
  },
  {
    id: "2",
    name: "atlas-indexer",
    owner: "codeatlas-org",
    url: "https://github.com/codeatlas-org/atlas-indexer",
    provider: "github",
    isPrivate: true,
    status: "indexing",
    createdAt: "2026-07-01T10:00:00Z",
    metrics: {
      linesCount: 18900,
      filesCount: 145,
      languages: [
        { name: "Go", percentage: 92 },
        { name: "Shell", percentage: 8 },
      ],
      complexityScore: 65,
    },
  },
  {
    id: "3",
    name: "documentation-gen",
    owner: "codeatlas-org",
    url: "https://github.com/codeatlas-org/documentation-gen",
    provider: "github",
    isPrivate: false,
    status: "failed",
    lastSyncedAt: "2026-07-05T14:20:00Z",
    createdAt: "2026-06-15T09:00:00Z",
    metrics: {
      linesCount: 8400,
      filesCount: 56,
      languages: [
        { name: "Python", percentage: 100 },
      ],
      complexityScore: 42,
    },
  },
]

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [repositories, setRepositories] = React.useState<RepositoryDetails[]>(mockRepositories)
  const [syncingId, setSyncingId] = React.useState<string | null>(null)

  // Filter repositories based on search
  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate totals
  const totalRepos = repositories.length
  const totalFiles = repositories.reduce((sum, repo) => sum + (repo.metrics?.filesCount || 0), 0)
  const totalLines = repositories.reduce((sum, repo) => sum + (repo.metrics?.linesCount || 0), 0)
  const avgComplexity = Math.round(
    repositories.reduce((sum, repo) => sum + (repo.metrics?.complexityScore || 0), 0) / totalRepos
  )

  const handleConnectRepo = () => {
    toast.info("Repository integration will be implemented in the next sprint.")
  }

  const handleSyncRepo = (id: string, name: string) => {
    if (syncingId) return
    setSyncingId(id)
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2500)),
      {
        loading: `Analyzing & indexing ${name}...`,
        success: () => {
          setRepositories((prev) =>
            prev.map((repo) =>
              repo.id === id
                ? {
                    ...repo,
                    status: "active",
                    lastSyncedAt: new Date().toISOString(),
                    metrics: repo.metrics
                      ? {
                          ...repo.metrics,
                          linesCount: repo.metrics.linesCount + Math.floor(Math.random() * 500),
                        }
                      : undefined,
                  }
                : repo
            )
          )
          setSyncingId(null)
          return `${name} analysis updated successfully!`
        },
        error: "Indexing failed.",
      }
    )
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="text-xs font-semibold uppercase tracking-wider">Complexity Score</span>
              <Activity className="size-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{avgComplexity}</span>
              <span className="text-xs text-muted-foreground">avg rating</span>
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
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <div 
                  key={repo.id} 
                  className="bg-[#111827]/35 border border-border/30 rounded-xl p-6 hover:border-border/50 transition-all backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
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

                      {/* Sync Status Badge */}
                      {repo.status === "active" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 flex items-center gap-1">
                          <CheckCircle className="size-3" />
                          <span>Synced</span>
                        </Badge>
                      )}
                      {repo.status === "indexing" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-blue-400 border-blue-400/20 bg-blue-400/5 flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          <span>Indexing</span>
                        </Badge>
                      )}
                      {repo.status === "failed" && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-rose-400 border-rose-400/20 bg-rose-400/5 flex items-center gap-1">
                          <XCircle className="size-3" />
                          <span>Failed</span>
                        </Badge>
                      )}
                    </div>

                    {/* Metadata Subtitles */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                      <span>Owner: {repo.owner}</span>
                      <span>•</span>
                      <span>Files: {repo.metrics?.filesCount || 0}</span>
                      <span>•</span>
                      <span>Lines: {(repo.metrics?.linesCount || 0).toLocaleString()}</span>
                      {repo.lastSyncedAt && (
                        <>
                          <span>•</span>
                          <span>Synced: {new Date(repo.lastSyncedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {/* Languages Stack Bar */}
                    {repo.metrics?.languages && (
                      <div className="space-y-1.5 max-w-md pt-1">
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/30">
                          {repo.metrics.languages.map((lang, idx) => {
                            // Assign unique colors to top languages
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
                  <div className="flex items-center gap-2">
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
                      disabled={repo.status === "indexing" || syncingId === repo.id}
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
    </div>
  )
}
