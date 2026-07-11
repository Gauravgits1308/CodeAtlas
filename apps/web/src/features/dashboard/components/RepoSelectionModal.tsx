"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Search, 
  Lock, 
  Globe, 
  Star, 
  GitFork, 
  Check, 
  Calendar,
  AlertCircle,
  FolderGit2
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { Badge } from "@/components/common/Badge"
import { Button } from "@/components/ui/button"

export interface GitHubRepositoryDto {
  githubRepoId: string;
  name: string;
  fullName: string;
  owner: string;
  visibility: string;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  updatedAt: string;
}

interface RepoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RepoSelectionModal({ isOpen, onClose }: RepoSelectionModalProps) {
  const [repos, setRepos] = React.useState<GitHubRepositoryDto[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = React.useState<"updated" | "name" | "stars">("updated")

  // Fetch repositories when modal opens
  React.useEffect(() => {
    if (!isOpen) return

    const fetchRepos = async () => {
      setLoading(true)
      setError(null)
      setSelectedIds(new Set())
      try {
        const response = await api.get<{ success: boolean; repositories: GitHubRepositoryDto[] }>(
          "/v1/github/repositories"
        )
        if (response.success && Array.isArray(response.repositories)) {
          setRepos(response.repositories)
        } else {
          setError("Invalid response format received from server.")
        }
      } catch (err: unknown) {
        const error = err as Error
        setError(error.message || "Failed to load GitHub repositories.")
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [isOpen])

  // Close modal when Escape key is pressed
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const toggleSelect = (repoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      return next
    })
  }

  const handleImport = () => {
    if (selectedIds.size === 0) return
    
    const selectedRepos = repos.filter((r) => selectedIds.has(r.githubRepoId))
    console.log("Selected Repositories to Import:", selectedRepos)
    
    toast.info(`Selected ${selectedIds.size} repositories logged to console successfully. Import pipeline will be implemented in the next sprint.`)
    onClose()
  }

  // Filter and sort
  const filtered = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "stars") {
      return b.stars - a.stars
    } else {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
          />

          {/* Modal content wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#0B0F19] border border-border/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-foreground"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border/30">
              <div className="space-y-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FolderGit2 className="size-5 text-primary" />
                  <span>Connect GitHub Repositories</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select repositories to import and analyze in CodeAtlas
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Toolbar: Search and Sort */}
            {!error && !loading && repos.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-border/20 bg-card/10">
                <div className="flex items-center gap-2 bg-[#111827]/40 border border-border/30 px-3 py-1.5 rounded-lg flex-1">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/45 w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="sortBy" className="text-xs text-muted-foreground whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "updated" | "name" | "stars")}
                    className="bg-[#111827]/45 border border-border/30 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="name">Name</option>
                    <option value="stars">Stars</option>
                  </select>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto min-h-[300px] max-h-[50vh]">
              {loading ? (
                // Skeletons
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border border-border/20 rounded-xl p-5 bg-[#111827]/10 animate-pulse space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-1/3 bg-muted rounded" />
                        <div className="h-4 w-12 bg-muted rounded" />
                      </div>
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="flex gap-4">
                        <div className="h-4 w-16 bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                // Error card
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="p-3 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    <AlertCircle className="size-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="font-bold text-base text-foreground">Failed to load repositories</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
                  </div>
                  {error.includes("connection") && (
                    <p className="text-[11px] text-muted-foreground/75 leading-relaxed bg-[#111827]/30 border border-border/20 p-3.5 rounded-lg max-w-md">
                      To connect your GitHub account, go to your Profile / Account Settings in Clerk and link GitHub as an authentication provider.
                    </p>
                  )}
                </div>
              ) : sorted.length === 0 ? (
                // Empty state card
                <div className="flex flex-col items-center justify-center text-center py-12 space-y-2">
                  <p className="text-sm text-muted-foreground select-none">
                    {repos.length === 0
                      ? "No repositories found under your GitHub profile."
                      : "No repositories match your filter query."}
                  </p>
                </div>
              ) : (
                // Repository items grid
                <div className="grid grid-cols-1 gap-3.5">
                  {sorted.map((repo) => {
                    const isSelected = selectedIds.has(repo.githubRepoId)
                    return (
                      <div
                        key={repo.githubRepoId}
                        onClick={() => toggleSelect(repo.githubRepoId)}
                        className={`group border rounded-xl p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer select-none relative ${
                          isSelected
                            ? "border-primary bg-primary/5 hover:bg-primary/10"
                            : "border-border/30 bg-[#111827]/20 hover:border-border/60 hover:bg-[#111827]/35"
                        }`}
                      >
                        {/* Checkbox item */}
                        <div
                          className={`size-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border/50 bg-[#111827]/40 group-hover:border-border"
                          }`}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {repo.name}
                            </h3>
                            <div className="flex items-center gap-1.5">
                              {repo.visibility === "private" ? (
                                <Badge variant="outline" className="px-1.5 py-0.5 text-[9px] text-amber-400 border-amber-400/20 bg-amber-400/5 flex items-center gap-1">
                                  <Lock className="size-2.5" />
                                  <span>Private</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="px-1.5 py-0.5 text-[9px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 flex items-center gap-1">
                                  <Globe className="size-2.5" />
                                  <span>Public</span>
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          {repo.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {repo.description}
                            </p>
                          )}

                          {/* Meta grid */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground/80 font-mono">
                            <span>Owner: {repo.owner}</span>
                            {repo.primaryLanguage && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="size-1.5 rounded-full bg-primary" />
                                  {repo.primaryLanguage}
                                </span>
                              </>
                            )}
                            {repo.stars > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Star className="size-3 text-amber-400 fill-amber-400/10" />
                                  {repo.stars}
                                </span>
                              </>
                            )}
                            {repo.forks > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <GitFork className="size-3 text-sky-400" />
                                  {repo.forks}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              <span>Updated: {formatDate(repo.updatedAt)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-[#111827]/10">
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0
                  ? `Selected: ${selectedIds.size} repositor${selectedIds.size === 1 ? "y" : "ies"}`
                  : "No repositories selected"}
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-xl border border-transparent hover:border-border/30 hover:bg-muted text-xs h-9 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  disabled={selectedIds.size === 0 || loading}
                  onClick={handleImport}
                  className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Import Selected
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
