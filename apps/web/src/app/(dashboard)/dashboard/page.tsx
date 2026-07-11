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
  MessageSquare,
  Terminal,
  MoreVertical,
  FileText,
  Play,
  Archive,
  Trash2
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
  isArchived?: boolean
  updatedAt: string
  createdAt: string
  primaryLanguage: string | null
  description: string | null
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

// Dedicated RepositoryCard component with actions menu and SSE progress tracking
interface RepositoryCardProps {
  repo: DBRepository & { url: string; isPrivate: boolean; provider: string; lastSyncedAt?: string };
  onSync: (id: string, name: string) => Promise<void>;
  syncing: boolean;
  onActionCompleted: () => void;
}

function RepositoryCard({ repo, onSync, syncing, onActionCompleted }: RepositoryCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveProgress, setLiveProgress] = React.useState<any>(null);
  
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isProcessing = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(repo.status);

  // Close actions dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SSE progress listener
  React.useEffect(() => {
    let eventSource: EventSource | null = null;

    async function connectSSE() {
      if (!isExpanded && !isProcessing) {
        setLiveProgress(null);
        return;
      }

      // Fetch Clerk auth token
      const token = typeof window !== "undefined" && (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk?.session
        ? await (window as unknown as { Clerk: { session: { getToken: () => Promise<string> } } }).Clerk.session.getToken()
        : "";

      const queryParam = token ? `?token=${encodeURIComponent(token)}` : "";
      
      // Connect to event stream
      eventSource = new EventSource(
        `/api/v1/repositories/${repo.id}/progress/stream${queryParam}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLiveProgress(data);
        } catch (err) {
          console.error("Failed to parse SSE progress:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("SSE connection closed or lost: ", err);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isExpanded, isProcessing, repo.id]);

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      const res = await api.patch<{ success: boolean }>(`/v1/repositories/${repo.id}/archive`);
      if (res.success) {
        toast.success("Repository archived successfully.");
        onActionCompleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to archive repository.");
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      const res = await api.patch<{ success: boolean }>(`/v1/repositories/${repo.id}/restore`);
      if (res.success) {
        toast.success("Repository restored successfully.");
        onActionCompleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to restore repository.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete<{ success: boolean }>(`/v1/repositories/${repo.id}`);
      if (res.success) {
        toast.success("Repository removed successfully.");
        setShowDeleteModal(false);
        onActionCompleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Unable to remove repository.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(repo, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${repo.name}_analysis.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Analysis metrics exported successfully.");
  };

  // Pipeline execution sequence stages definition
  const PIPELINE_STAGES = [
    "QUEUED",
    "Cloning Repository",
    "Extracting Files",
    "Processing Files",
    "Chunking Code",
    "Generating Embeddings",
    "Calculating Repository Metrics",
    "AI Health Analysis",
    "Repository Ready"
  ];

  const currentStageIndex = liveProgress 
    ? PIPELINE_STAGES.indexOf(liveProgress.currentStage)
    : PIPELINE_STAGES.indexOf(
        repo.status === "PENDING" ? "QUEUED" :
        repo.status === "CLONING" ? "Cloning Repository" :
        repo.status === "ANALYZING" ? "Calculating Repository Metrics" :
        repo.status === "PROCESSING" || repo.status === "INDEXING" ? "Generating Embeddings" :
        repo.status === "COMPLETED" ? "Repository Ready" : "QUEUED"
      );

  return (
    <div 
      className={`bg-[#111827]/35 border border-border/30 rounded-xl p-6 transition-all backdrop-blur-sm relative cursor-pointer ${
        isExpanded ? "ring-1 ring-primary/45 border-primary/20" : "hover:border-border/50"
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
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

            {/* SSE Current Stage Badge status */}
            {liveProgress ? (
              liveProgress.status === "FAILED" ? (
                <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-rose-400 border-rose-400/20 bg-rose-400/5 flex items-center gap-1">
                  <XCircle className="size-3 animate-pulse" />
                  <span>Failed: {liveProgress.currentStage}</span>
                </Badge>
              ) : liveProgress.status === "COMPLETED" ? (
                <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 flex items-center gap-1">
                  <CheckCircle className="size-3" />
                  <span>Ready</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-amber-400 border-amber-400/25 bg-amber-400/5 flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  <span>{liveProgress.currentStage}</span>
                </Badge>
              )
            ) : (
              <>
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
                    <span>Cloning Repository</span>
                  </Badge>
                )}
                {repo.status === "ANALYZING" && (
                  <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-indigo-400 border-indigo-400/20 bg-indigo-400/5 flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    <span>Calculating Metrics</span>
                  </Badge>
                )}
                {(repo.status === "INDEXING" || repo.status === "PROCESSING") && (
                  <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-blue-400 border-blue-400/20 bg-blue-400/5 flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    <span>Generating Embeddings</span>
                  </Badge>
                )}
                {repo.status === "COMPLETED" && (
                  <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    <span>Repository Ready</span>
                  </Badge>
                )}
                {repo.status === "FAILED" && (
                  <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-rose-400 border-rose-400/20 bg-rose-400/5 flex items-center gap-1">
                    <XCircle className="size-3" />
                    <span>Failed</span>
                  </Badge>
                )}
              </>
            )}

            {repo.isArchived && (
              <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] text-zinc-400 border-zinc-800 bg-zinc-900/40">
                Archived
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

          {/* Collapsed/Default Summary Details */}
          {!isExpanded && repo.status === "COMPLETED" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 max-w-4xl">
              <div className="bg-[#111827]/25 border border-border/10 rounded-xl p-4.5 space-y-2 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Repository Indexing</span>
                <div className="text-xs text-muted-foreground space-y-1 font-mono pt-1">
                  <div>Chunks: <span className="text-foreground font-bold">{repo.chunksCount || 0}</span></div>
                  <div>Embeddings: <span className="text-foreground font-bold">{repo.embeddingsCount || 0}</span></div>
                </div>
              </div>
              <div className="bg-[#111827]/25 border border-border/10 rounded-xl p-4.5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Analysis Metrics</span>
                <div className="text-xs text-muted-foreground space-y-1 font-mono pt-1">
                  <div>Files Count: <span className="text-foreground font-bold">{repo.metrics?.filesCount || 0}</span></div>
                  <div>Lines Count: <span className="text-foreground font-bold">{(repo.metrics?.linesCount || 0).toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-[#111827]/25 border border-border/10 rounded-xl p-4.5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Complexity Insights</span>
                <div className="text-xs text-muted-foreground space-y-1 font-mono pt-1">
                  <div>Complexity: <span className="text-foreground font-bold">{repo.metrics?.complexityScore !== undefined ? repo.metrics.complexityScore : "N/A"}</span></div>
                  <div>Dependencies: <span className="text-foreground font-bold">{repo.metrics?.dependencyCount || 0}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action controls button and menus */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/dashboard/repository/${repo.id}/chat`}
            className={`inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-xs font-semibold border transition-all ${
              (repo.embeddingsCount || 0) > 0 && !repo.isArchived
                ? "bg-primary border-primary text-white hover:bg-primary/90 cursor-pointer"
                : "border-border/30 text-muted-foreground bg-muted/10 cursor-not-allowed pointer-events-none opacity-50"
            }`}
          >
            <MessageSquare className="size-3.5 mr-1.5" />
            <span>Chat</span>
          </Link>

          {/* Custom absolute Actions Menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="border-border/30 hover:bg-muted/40 h-9 w-9 flex items-center justify-center cursor-pointer"
            >
              <MoreVertical className="size-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#111622] border border-border/15 shadow-2xl py-1.5 z-30 font-mono text-xs select-none">
                <Link href={`/dashboard/repository/${repo.id}/chat`} className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors">
                  <MessageSquare className="size-3.5 text-muted-foreground" />
                  <span>💬 Open Chat</span>
                </Link>
                <button
                  disabled={isProcessing || syncing}
                  onClick={() => { setShowMenu(false); onSync(repo.id, repo.name); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 text-muted-foreground ${syncing ? "animate-spin" : ""}`} />
                  <span>🔄 Sync Repository</span>
                </button>
                <Link href={`/dashboard/repository/${repo.id}/chat`} className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors">
                  <Activity className="size-3.5 text-muted-foreground" />
                  <span>📊 View Health Report</span>
                </Link>
                <Link href={`/dashboard/repository/${repo.id}/chat`} className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>📄 Generate Documentation</span>
                </Link>
                <button onClick={handleExportAnalysis} className="w-full text-left flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors cursor-pointer">
                  <Layers className="size-3.5 text-muted-foreground" />
                  <span>📦 Export Analysis</span>
                </button>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors">
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                  <span>📁 Open on GitHub</span>
                </a>
                <button
                  disabled={isProcessing || syncing}
                  onClick={() => { setShowMenu(false); onSync(repo.id, repo.name); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-foreground hover:bg-[#1A233C]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-muted-foreground" />
                  <span>📥 Re-import</span>
                </button>

                <div className="border-t border-border/10 my-1" />

                {repo.isArchived ? (
                  <button onClick={handleRestore} className="w-full text-left flex items-center gap-2 px-3 py-2 text-emerald-400 hover:bg-[#1A233C]/40 transition-colors cursor-pointer font-bold">
                    <Play className="size-3.5 text-emerald-400" />
                    <span>🔓 Restore Repository</span>
                  </button>
                ) : (
                  <button onClick={handleArchive} className="w-full text-left flex items-center gap-2 px-3 py-2 text-amber-400 hover:bg-[#1A233C]/40 transition-colors cursor-pointer font-bold">
                    <Archive className="size-3.5 text-amber-400" />
                    <span>🗃 Archive Repository</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (isProcessing) {
                      toast.error("Repository is currently processing. Wait until processing finishes.");
                    } else {
                      setShowDeleteModal(true);
                    }
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-[#1A233C]/40 transition-colors cursor-pointer font-bold"
                >
                  <Trash2 className="size-3.5 text-rose-500" />
                  <span>🗑 Remove from CodeAtlas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Progress Timeline & Pipeline dashboard */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-border/10 space-y-6" onClick={(e) => e.stopPropagation()}>
          {/* Progress Bar overall */}
          {liveProgress && (
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Overall pipeline completion</span>
                <span className="font-bold text-foreground">{Math.round(liveProgress.progress)}%</span>
              </div>
              <div className="w-full bg-muted/20 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${liveProgress.status === "FAILED" ? "bg-rose-500" : "bg-primary"}`}
                  style={{ width: `${liveProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Pipeline stages list timeline */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-muted-foreground block mb-3">
              Pipeline Timeline
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {[
                { label: "Queued", key: "QUEUED" },
                { label: "Repository Cloned", key: "Cloning Repository" },
                { label: "Files Extracted", key: "Extracting Files", detailKey: "totalFiles" },
                { label: "Code Chunked", key: "Chunking Code", detailKey: "totalChunks" },
                { label: "Generating Embeddings", key: "Generating Embeddings", detailKey: "embeddingsGenerated" },
                { label: "Calculated Metrics", key: "Calculating Repository Metrics" },
                { label: "AI Health Report", key: "AI Health Analysis" },
                { label: "Repository Ready", key: "Repository Ready" }
              ].map((stage) => {
                const stageIndex = PIPELINE_STAGES.indexOf(stage.key);
                let statusIcon = "⬜";
                let textClass = "text-muted-foreground/60";

                if (currentStageIndex > stageIndex) {
                  statusIcon = "✔";
                  textClass = "text-emerald-400 font-semibold";
                } else if (currentStageIndex === stageIndex) {
                  if (liveProgress?.status === "FAILED") {
                    statusIcon = "❌";
                    textClass = "text-rose-400 font-bold";
                  } else if (liveProgress?.status === "COMPLETED" || repo.status === "COMPLETED") {
                    statusIcon = "✔";
                    textClass = "text-emerald-400 font-semibold";
                  } else {
                    statusIcon = "⏳";
                    textClass = "text-amber-400 font-bold animate-pulse";
                  }
                }

                // Add counters details
                let countDetail = "";
                if (liveProgress && stage.detailKey) {
                  if (stage.key === "Generating Embeddings" && liveProgress.embeddingsGenerated > 0) {
                    countDetail = ` (${liveProgress.embeddingsGenerated} / ${liveProgress.totalChunks || 0})`;
                  } else if (liveProgress[stage.detailKey] > 0) {
                    countDetail = ` (${liveProgress[stage.detailKey]})`;
                  }
                }

                return (
                  <div key={stage.key} className={`flex items-center gap-2 p-2 rounded-lg bg-[#0F1422]/35 border border-border/5 ${textClass}`}>
                    <span className="text-sm shrink-0">{statusIcon}</span>
                    <span>{stage.label}{countDetail}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failure screen if pipeline broke */}
          {liveProgress?.status === "FAILED" && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4.5 space-y-3 font-mono">
              <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <XCircle className="size-4" />
                <span>Sync Pipeline Failed during stage: &quot;{liveProgress.currentStage}&quot;</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {liveProgress.errorMessage || "Unknown process error occurred."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSync(repo.id, repo.name)}
                className="border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 font-bold text-xs h-8 cursor-pointer rounded-lg"
              >
                Retry Processing
              </Button>
            </div>
          )}

          {/* Completion Screen Stats */}
          {liveProgress?.status === "COMPLETED" && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4.5 space-y-3 font-mono text-xs text-muted-foreground">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle className="size-4" />
                <span>Repository Synced Successfully</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div>
                  <div className="text-[10px] uppercase font-semibold">Files Indexed</div>
                  <div className="text-foreground font-bold text-sm mt-0.5">{liveProgress.processedFiles}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold">Chunks Created</div>
                  <div className="text-foreground font-bold text-sm mt-0.5">{liveProgress.processedChunks}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold">Embeddings</div>
                  <div className="text-foreground font-bold text-sm mt-0.5">{liveProgress.embeddingsGenerated}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold">Processing Time</div>
                  <div className="text-foreground font-bold text-sm mt-0.5">
                    {(() => {
                      if (!liveProgress.startedAt || !liveProgress.finishedAt) return "N/A";
                      const totalSecs = Math.round((new Date(liveProgress.finishedAt).getTime() - new Date(liveProgress.startedAt).getTime()) / 1000);
                      const avg = liveProgress.processedFiles > 0 ? (totalSecs / liveProgress.processedFiles).toFixed(2) : "0.00";
                      return `${totalSecs}s (${avg}s/file)`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live logs terminal viewer */}
          {liveProgress && liveProgress.logs && liveProgress.logs.length > 0 && (
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Terminal className="size-3.5 text-muted-foreground" />
                <span>Processing Execution Logs</span>
              </div>
              <div className="bg-black/90 p-4 rounded-lg text-[10px] text-zinc-300 max-h-48 overflow-y-auto mt-2 leading-relaxed border border-border/10 font-mono select-text scrollbar-thin">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {liveProgress.logs.map((log: any, logIdx: number) => (
                  <div key={logIdx} className="hover:bg-white/5 py-0.5">
                    <span className="text-muted-foreground/60 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-primary mr-1.5">[{log.stage}]</span>
                    <span className="text-zinc-200">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#0D111A] border border-border/20 rounded-2xl max-w-lg w-full p-6 space-y-6 font-mono text-left shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-rose-500 flex items-center gap-2">
                ⚠️ Remove Repository?
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently remove this repository from CodeAtlas. The GitHub repository will NOT be affected.
              </p>
            </div>

            <div className="bg-[#111622] rounded-xl p-4.5 border border-border/5 space-y-2.5 text-xs text-muted-foreground">
              <div className="text-foreground font-bold mb-1">The following data will be deleted:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>• Local cloned repository</div>
                <div>• Indexed codebase files</div>
                <div>• Generated code chunks</div>
                <div>• Vector search embeddings</div>
                <div>• AI chat conversation history</div>
                <div>• Calculated metrics scorecard</div>
                <div>• cached Health reports</div>
              </div>
              <div className="text-rose-400 font-bold border-t border-border/10 pt-3 mt-3 text-[10px] uppercase tracking-wider">
                This cleanup action cannot be undone.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 select-none">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="border-border/30 hover:bg-muted/40 font-bold text-xs h-9 cursor-pointer rounded-lg text-foreground"
              >
                Cancel
              </Button>
              <Button
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 cursor-pointer rounded-lg"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    Removing...
                  </>
                ) : (
                  "Remove Repository"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [repositories, setRepositories] = React.useState<RepositoryDetails[]>([]);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchRepos = React.useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<{ success: boolean; repositories: any[] }>("/v1/repositories");
      if (response.success && Array.isArray(response.repositories)) {
        const mapped = response.repositories.map((repo) => ({
          id: repo.id,
          name: repo.name,
          owner: repo.owner,
          url: repo.htmlUrl || repo.cloneUrl,
          provider: "github" as const,
          isPrivate: repo.visibility === "private",
          status: repo.status as RepositoryDetails["status"],
          isArchived: repo.isArchived || false,
          lastSyncedAt: repo.lastSyncedAt || undefined,
          createdAt: repo.createdAt,
          primaryLanguage: repo.primaryLanguage,
          stars: repo.stars,
          forks: repo.forks,
          watchers: repo.watchers,
          defaultBranch: repo.defaultBranch,
          chunksCount: repo.chunksCount,
          embeddingsCount: repo.embeddingsCount,
          classifications: repo.classifications || undefined,
          metrics: repo.metrics
            ? {
                linesCount: repo.metrics.linesCount,
                filesCount: repo.metrics.filesCount,
                languages: repo.metrics.languages,
                complexityScore: repo.metrics.complexityScore || undefined,
                dependencyCount: repo.metrics.dependencyCount,
              }
            : undefined,
        }));
        setRepositories(mapped);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to load connected repositories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRepos();
  }, [fetchRepos]);

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (showArchived) {
      return matchesSearch && repo.isArchived;
    }
    return matchesSearch && !repo.isArchived;
  });

  // Calculate totals
  const totalRepos = repositories.filter(r => !r.isArchived).length;
  const totalFiles = repositories.filter(r => !r.isArchived).reduce((sum, repo) => sum + (repo.metrics?.filesCount || 0), 0);
  const totalLines = repositories.filter(r => !r.isArchived).reduce((sum, repo) => sum + (repo.metrics?.linesCount || 0), 0);
  const totalChunks = repositories.filter(r => !r.isArchived).reduce((sum, repo) => sum + (repo.chunksCount || 0), 0);
  const totalEmbeddings = repositories.filter(r => !r.isArchived).reduce((sum, repo) => sum + (repo.embeddingsCount || 0), 0);

  const handleConnectRepo = () => {
    setIsRepoModalOpen(true);
  };

  const handleSyncRepo = async (id: string, name: string) => {
    if (syncingId === id) return;
    setSyncingId(id);

    try {
      const response = await api.post<{ success: boolean; jobId: string; status: string }>(
        `/v1/repositories/${id}/process`
      );
      if (response.success) {
        toast.success("Repository queued for processing.");
        await fetchRepos();
      } else {
        toast.error("Failed to queue repository for processing.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `An error occurred while queuing ${name}.`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="py-8 min-h-full select-none">
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

          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Chunks</span>
              <Activity className="size-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{totalChunks.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">segments</span>
            </div>
          </div>

          <div className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">AI Embeddings</span>
              <CheckCircle className="size-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{totalEmbeddings.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">vectors</span>
            </div>
          </div>
        </div>

        {/* Repository Listing Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-[#111827]/30 border border-border/30 px-3.5 py-2 rounded-lg max-w-md flex-1">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40 w-full"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="accent-primary rounded border-border bg-transparent focus:ring-0 cursor-pointer"
              />
              <span>Show Archived Repositories</span>
            </label>
          </div>

          {/* Repositories Cards View */}
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading connected repositories...</p>
              </div>
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <RepositoryCard
                  key={repo.id}
                  repo={repo as unknown as RepositoryCardProps["repo"]}
                  onSync={handleSyncRepo}
                  syncing={syncingId === repo.id}
                  onActionCompleted={fetchRepos}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-[#111827]/10 border border-border/20 rounded-xl space-y-4 max-w-xl mx-auto select-none">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {showArchived ? "No archived repositories found." : "No repositories have been connected to CodeAtlas yet."}
                </p>
                {!showArchived && (
                  <Button 
                    onClick={handleConnectRepo} 
                    className="bg-primary hover:bg-primary/95 text-white font-semibold flex items-center gap-1.5 mx-auto cursor-pointer rounded-xl text-xs h-9"
                  >
                    <Plus className="size-4" />
                    <span>Connect Your First Repository</span>
                  </Button>
                )}
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
  );
}
