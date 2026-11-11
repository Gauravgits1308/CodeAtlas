"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Calendar, 
  Code, 
  MessageSquare, 
  ArrowRight, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw
} from "lucide-react";
import { RepositoryDetails } from "@/features/dashboard/types";
import { RepositoryStatusChip } from "./RepositoryStatusChip";
import { RepositoryHealthBadge } from "./RepositoryHealthBadge";
import { RepositoryContextMenu } from "./RepositoryContextMenu";
import { RepositoryStats } from "./RepositoryStats";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { useRepositorySync } from "@/hooks/useRepositorySync";
import { useRepositoryActions } from "@/hooks/useRepositoryActions";
import { cn } from "@/lib/utils";

interface RepositoryCardProps {
  repo: RepositoryDetails;
  onSync: (id: string, name: string) => void;
  syncing: boolean;
  onActionCompleted: () => void;
  onDeleteClick: (id: string, name: string) => void;
}

export function RepositoryCard({
  repo,
  onSync,
  syncing,
  onActionCompleted,
  onDeleteClick,
}: RepositoryCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Connect to custom progress synchronization hook
  const progress = useRepositorySync(repo.id, repo.status, onActionCompleted);

  // Unified repository actions hook
  const { handleArchive, handleRestore, handleCancel, handleRetry, isCancelling } = useRepositoryActions(onActionCompleted);

  // Get active status: check if liveProgress updates status
  const currentStatus = progress?.status || repo.status;
  const currentStage = progress?.currentStage || "QUEUED";
  const progressPercent = progress?.progress || 0;
  const estimatedRemainingTime = progress?.estimatedRemainingTime || null;
  const startedAt = progress?.startedAt || repo.createdAt;

  const isLiveProcessing = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(currentStatus);
  const isReady = currentStatus === "COMPLETED";
  const isHalted = ["FAILED", "CANCELLED", "STALLED"].includes(currentStatus);

  // Secondary language derivation (computed inline on render)
  const languages = repo.metrics?.languages;
  const primaryLanguage = repo.primaryLanguage;
  const secondaryLang = (() => {
    if (!languages || languages.length <= 1) return null;
    const sorted = [...languages].sort((a, b) => b.percentage - a.percentage);
    const primary = primaryLanguage?.toLowerCase();
    const second = sorted.find((l) => l.name.toLowerCase() !== primary);
    return second ? second.name : null;
  })();

  // Size calculation (computed inline on render)
  const repoSizeStr = (() => {
    if (!repo.metrics?.averageFileSize || !repo.metrics?.filesCount) return "—";
    const totalBytes = repo.metrics.averageFileSize * repo.metrics.filesCount;
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  })();

  // Documentation coverage calculation (computed inline on render)
  const docStatusStr = (() => {
    if (repo.metrics?.documentationCoverage === undefined) return "—";
    return `${Math.round(repo.metrics.documentationCoverage * 100)}%`;
  })();

  return (
    <div
      className={cn(
        "relative flex flex-col p-5 border rounded-xl bg-[#111625]/35 transition-all duration-300 w-full overflow-hidden select-none hover:shadow-md group",
        isLiveProcessing
          ? "border-blue-500/25 bg-blue-500/[0.01] shadow-[0_0_12px_rgba(59,130,246,0.03)]"
          : "border-border/15 hover:border-blue-500/30 hover:bg-[#1E2538]/15 hover:shadow-[0_2px_12px_rgba(59,130,246,0.03)]"
      )}
    >
      {/* Live Processing Overlay */}
      {isLiveProcessing && (
        <ProcessingOverlay
          progress={progressPercent}
          currentStage={currentStage}
          startedAt={startedAt}
          estimatedRemainingTime={estimatedRemainingTime}
          onCancel={() => handleCancel(repo.id, repo.name)}
          isCancelling={isCancelling}
        />
      )}

      {/* Main Row Content */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full text-left">
        
        {/* Left Column: Repository Info & Metadata */}
        <div className="flex flex-col gap-1.5 lg:w-1/4 xl:w-1/3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground/50">{repo.owner} /</span>
            <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{repo.name}</span>
            <span className={`inline-flex items-center px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase rounded border ${
              repo.isPrivate 
                ? "border-amber-500/20 text-amber-400 bg-amber-500/5" 
                : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
            }`}>
              {repo.isPrivate ? "Private" : "Public"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span className="text-foreground/80 font-semibold">{repo.primaryLanguage || "None"}</span>
            {secondaryLang && <span>• {secondaryLang}</span>}
            <span>•</span>
            <span>{repoSizeStr}</span>
          </div>

          {repo.description && (
            <p className="text-[11px] text-muted-foreground/80 truncate max-w-xs font-sans">
              {repo.description}
            </p>
          )}
        </div>

        {/* Center Column: Statistics Metrics Grid */}
        <div className="lg:flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 text-left border-t lg:border-t-0 lg:border-l lg:border-r border-border/10 lg:px-6 py-4 lg:py-0 select-none">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#636E8B] font-mono">Files</span>
            <span className="text-foreground font-semibold text-xs font-mono">
              {repo.metrics?.filesCount !== undefined ? repo.metrics.filesCount.toLocaleString() : "—"}
            </span>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#636E8B] font-mono">Lines of Code</span>
            <span className="text-foreground font-semibold text-xs font-mono">
              {repo.metrics?.linesCount !== undefined ? repo.metrics.linesCount.toLocaleString() : "—"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#636E8B] font-mono">Chunks</span>
            <span className="text-foreground font-semibold text-xs font-mono">
              {repo.chunksCount !== undefined ? repo.chunksCount.toLocaleString() : "—"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#636E8B] font-mono">Docs Status</span>
            <span className="text-foreground font-semibold text-xs font-mono">{docStatusStr}</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#636E8B] font-mono">Health Score</span>
            <div className="pt-0.5">
              <RepositoryHealthBadge score={repo.metrics?.complexityScore} />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#636E8B] font-mono">Last Sync</span>
            <span className="text-foreground font-semibold text-[10px] font-mono truncate max-w-20" title={repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : "Never"}>
              {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleDateString() : "Never"}
            </span>
          </div>
        </div>

        {/* Right Column: Badges & Call-to-Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-3.5 shrink-0 border-t lg:border-t-0 border-border/10 pt-4 lg:pt-0">
          
          {/* Status Badge */}
          <RepositoryStatusChip status={currentStatus as RepositoryDetails["status"]} />

          {/* Action triggers */}
          <div className="flex items-center gap-2">
            
            {/* View Metrics/Details Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 text-[10px] font-semibold border-border/60 hover:bg-[#1E2538]/40 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="size-3.5 mr-1" />
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5 mr-1" />
                  <span>View Metrics</span>
                </>
              )}
            </Button>

            {/* Primary & Secondary Action CTAs */}
            {isReady ? (
              <>
                <Link href={`/dashboard/repository/${repo.id}/chat?tab=chat`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-semibold border-border/60 hover:bg-[#1E2538]/40 cursor-pointer"
                  >
                    <MessageSquare className="size-3 text-primary mr-1" />
                    <span>Chat Console</span>
                  </Button>
                </Link>
                <Link href={`/dashboard/repository/${repo.id}/chat`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/95 text-white gap-1 cursor-pointer rounded-lg px-3"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </>
            ) : isHalted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetry(repo.id, repo.name)}
                className="h-7 text-[10px] font-semibold border-border/60 hover:bg-[#1E2538]/40 cursor-pointer gap-1"
              >
                <RotateCcw className="size-3 text-foreground" />
                <span>Retry Sync</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSync(repo.id, repo.name)}
                disabled={syncing}
                className="h-7 text-[10px] font-semibold border-border/60 hover:bg-[#1E2538]/40 cursor-pointer gap-1"
              >
                <RefreshCw className={`size-3 text-foreground ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Initializing..." : "Start Sync"}</span>
              </Button>
            )}

            {/* Context menu for advanced actions */}
            <RepositoryContextMenu
              isArchived={repo.isArchived || false}
              onArchive={() => handleArchive(repo.id, repo.name)}
              onRestore={() => handleRestore(repo.id, repo.name)}
              onDeleteClick={() => onDeleteClick(repo.id, repo.name)}
              onSync={() => onSync(repo.id, repo.name)}
              isSyncing={syncing}
            />
          </div>
        </div>
      </div>

      {/* Expandable statistics section details drawer */}
      {isExpanded && (
        <div className="pt-4 mt-4 border-t border-border/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 w-full text-left">
          <RepositoryStats metrics={repo.metrics} />

          {/* Repo metadata details footer */}
          <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-muted-foreground pt-1 select-none">
            {repo.primaryLanguage && (
              <span className="flex items-center gap-1.5">
                <Code className="size-3 text-zinc-500" />
                <span>Primary Language:</span>
                <span className="text-foreground font-semibold">{repo.primaryLanguage}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3 text-zinc-500" />
              <span>Synced At:</span>
              <span className="text-foreground font-semibold">
                {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : "Never"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
