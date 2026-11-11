import * as React from "react";
import { useRepositoryImport } from "@/hooks/useRepositoryImport";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Lock,
  Globe,
  Star,
  GitFork,
  Check,
  CheckCircle,
  Calendar,
  AlertCircle,
  FolderGit2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import { RepositoryDetails } from "@/features/dashboard/types";

interface ImportRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (importedRepos?: unknown[]) => void;
  importedRepositories: RepositoryDetails[];
}

export function ImportRepositoryModal({
  isOpen,
  onClose,
  onImportSuccess,
  importedRepositories,
}: ImportRepositoryModalProps) {
  const {
    repos,
    loading,
    isImporting,
    error,
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelect,
    handleImport,
    sortBy,
    setSortBy,
  } = useRepositoryImport(isOpen, onClose, onImportSuccess);

  const { availableRepos, alreadyImportedRepos } = React.useMemo(() => {
    const importedSet = new Set(
      (importedRepositories || []).map((r) => `${r.owner.toLowerCase()}/${r.name.toLowerCase()}`)
    );
    const available = repos.filter((r) => !importedSet.has(`${r.owner.toLowerCase()}/${r.name.toLowerCase()}`));
    const imported = repos.filter((r) => importedSet.has(`${r.owner.toLowerCase()}/${r.name.toLowerCase()}`));
    return { availableRepos: available, alreadyImportedRepos: imported };
  }, [repos, importedRepositories]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-[80vh] bg-[#0F1320] text-foreground font-sans">
        {/* Header */}
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center gap-2">
            <FolderGit2 className="size-5 text-primary" />
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Import GitHub Repositories
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Choose one or more connected GitHub repositories to index with AI embeddings.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 border-b border-border/10 bg-[#0B0F19]/40 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GitHub repositories..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#0F1320] border border-border/40 hover:border-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/20 rounded-lg text-xs placeholder:text-muted-foreground outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 select-none">
            <span className="text-[10px] text-muted-foreground font-mono">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as "updated" | "name" | "stars")}
              className="bg-[#0F1320] border border-border/40 px-2 py-1 text-xs rounded-md text-foreground cursor-pointer outline-none hover:border-border/80"
            >
              <option value="updated">Recent Activity</option>
              <option value="name">Alphabetical</option>
              <option value="stars">Most Stars</option>
            </select>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0 scrollbar-thin">
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            // Skeleton view
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/20 bg-[#161B2B]/20 animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-3 w-40 bg-[#1F2937] rounded" />
                  <div className="h-2 w-64 bg-[#1F2937] rounded" />
                </div>
                <div className="size-4 bg-[#1F2937] rounded-full" />
              </div>
            ))
          ) : repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground space-y-1">
              <span>No repositories found matching your query.</span>
              <span>Make sure you have authorized access in Github integration.</span>
            </div>
          ) : (
            <div className="space-y-6">
              {availableRepos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono tracking-wider pl-1">
                    Available to Import ({availableRepos.length})
                  </div>
                  <div className="space-y-2.5">
                    {availableRepos.map((repo) => {
                      const isSelected = selectedIds.has(repo.githubRepoId);
                      return (
                        <div
                          key={repo.githubRepoId}
                          onClick={() => toggleSelect(repo.githubRepoId)}
                          className={`flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/30 bg-[#111625]/40 hover:border-border hover:bg-[#1E2538]/20"
                          }`}
                        >
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-foreground tracking-wide group-hover:text-primary transition-colors">
                                {repo.name}
                              </span>
                              {repo.visibility === "private" ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-medium border border-amber-400/20 text-amber-400 bg-amber-400/5 rounded-md">
                                  <Lock className="size-2.5" />
                                  <span>Private</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-medium border border-emerald-400/20 text-emerald-400 bg-emerald-400/5 rounded-md">
                                  <Globe className="size-2.5" />
                                  <span>Public</span>
                                </span>
                              )}
                            </div>

                            {repo.description && (
                              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-1">
                                {repo.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] font-mono text-muted-foreground pt-1">
                              {repo.primaryLanguage && (
                                <span className="flex items-center gap-1.5">
                                  <span className="size-1.5 rounded-full bg-primary" />
                                  <span>{repo.primaryLanguage}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-0.5">
                                <Star className="size-2.5" />
                                <span>{repo.stars}</span>
                              </span>
                              <span className="flex items-center gap-0.5">
                                <GitFork className="size-2.5" />
                                <span>{repo.forks}</span>
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Calendar className="size-2.5" />
                                <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>

                          {/* Multi check Selection dot */}
                          <div
                            className={`size-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-[#0B0F19] group-hover:border-border/80"
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3px]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {alreadyImportedRepos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono tracking-wider pl-1">
                    Already Imported ({alreadyImportedRepos.length})
                  </div>
                  <div className="space-y-2.5">
                    {alreadyImportedRepos.map((repo) => (
                      <div
                        key={repo.githubRepoId}
                        className="flex items-start justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] opacity-75 select-none"
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-400 tracking-wide">
                              {repo.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-semibold border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 rounded-md">
                              Already Imported
                            </span>
                          </div>

                          {repo.description && (
                            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-1">
                              {repo.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] font-mono text-muted-foreground pt-1">
                            {repo.primaryLanguage && (
                              <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500/40" />
                                <span>{repo.primaryLanguage}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Star className="size-2.5" />
                              <span>{repo.stars}</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                              <GitFork className="size-2.5" />
                              <span>{repo.forks}</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Calendar className="size-2.5" />
                              <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>

                        {/* Green check icon */}
                        <div className="size-4.5 rounded-md border border-emerald-500/35 bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="size-3.5 text-emerald-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action button triggers Footer */}
        <div className="p-4 border-t border-border/20 bg-[#0B0F19]/40 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground select-none">
            {selectedIds.size > 0
              ? `${selectedIds.size} repo${selectedIds.size === 1 ? "" : "s"} selected`
              : "Select repositories to import"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isImporting} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleImport}
              disabled={selectedIds.size === 0 || isImporting}
              className="font-semibold cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                  <span>Importing...</span>
                </>
              ) : (
                <span>Import Workspace</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
