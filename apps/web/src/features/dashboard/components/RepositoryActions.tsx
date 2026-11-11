import * as React from "react";
import { MessageSquare, ArrowRight, RefreshCw, ChevronDown, ChevronUp, XCircle, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RepositoryActionsProps {
  repoId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSync: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onDeleteClick?: () => void;
  isSyncing: boolean;
  isCancelling?: boolean;
  isDeleting?: boolean;
  status: string;
}

export function RepositoryActions({
  repoId,
  isExpanded,
  onToggleExpand,
  onSync,
  onCancel,
  onRetry,
  onDeleteClick,
  isSyncing,
  isCancelling = false,
  isDeleting = false,
  status,
}: RepositoryActionsProps) {
  const isReady = status === "COMPLETED";
  const isHalted = ["FAILED", "CANCELLED", "STALLED"].includes(status);
  const isProcessing = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(status);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E2538]/50 w-full select-none">
      {/* Left panel buttons: toggle details or manual sync */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleExpand}
          className="h-7 text-[10px] font-semibold tracking-wide border-border/60 hover:bg-[#1E2538]/40 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-3.5 mr-1" />
              <span>Hide Details</span>
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5 mr-1" />
              <span>View Metrics & Logs</span>
            </>
          )}
        </Button>

        {!isProcessing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="h-7 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={`size-3 mr-1 ${isSyncing ? "animate-spin text-primary" : ""}`} />
            <span>Sync Code</span>
          </Button>
        )}
      </div>

      {/* Right panel primary actions */}
      <div className="flex items-center gap-2">
        {isReady ? (
          <>
            <Link href={`/dashboard/repository/${repoId}/chat?tab=chat`}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-semibold border-border/60 hover:bg-[#1E2538]/40 cursor-pointer"
              >
                <MessageSquare className="size-3 text-primary mr-1" />
                <span>Chat Console</span>
              </Button>
            </Link>
            <Link href={`/dashboard/repository/${repoId}/chat`}>
              <Button
                variant="default"
                size="sm"
                className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/95 text-white gap-1 cursor-pointer"
              >
                <span>Open Workspace</span>
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </>
        ) : isProcessing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="h-7 text-[10px] font-semibold border-rose-500/40 text-rose-400 hover:bg-rose-500/10 cursor-pointer gap-1"
          >
            <XCircle className="size-3 text-rose-400" />
            <span>{isCancelling ? "Cancelling..." : "Cancel Processing"}</span>
          </Button>
        ) : isHalted ? (
          <>
            {onDeleteClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteClick}
                disabled={isDeleting}
                className="h-7 text-[10px] font-semibold border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer gap-1"
              >
                <Trash2 className="size-3 text-rose-400" />
                <span>Delete</span>
              </Button>
            )}
            {onRetry && (
              <Button
                variant="default"
                size="sm"
                onClick={onRetry}
                disabled={isSyncing}
                className="h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white gap-1 cursor-pointer shadow-[0_1px_4px_rgba(59,130,246,0.3)]"
              >
                <RotateCcw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Retry Indexing</span>
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white gap-1 cursor-pointer shadow-[0_1px_4px_rgba(59,130,246,0.3)]"
          >
            <span>Start Processing</span>
            <ArrowRight className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
