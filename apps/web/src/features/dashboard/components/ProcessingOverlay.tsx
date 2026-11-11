import * as React from "react";
import { RepositoryProgress } from "./RepositoryProgress";
import { RepositoryTimeline } from "./RepositoryTimeline";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessingOverlayProps {
  progress: number;
  currentStage: string;
  startedAt?: string | Date;
  estimatedRemainingTime?: string | null;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function ProcessingOverlay({
  progress,
  currentStage,
  startedAt,
  estimatedRemainingTime,
  onCancel,
  isCancelling = false,
}: ProcessingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-[6px] z-10 flex flex-col justify-between p-5 rounded-xl border border-blue-500/20 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)] transition-all animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1E2538]/50">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 text-blue-400 animate-spin" />
          <span className="text-xs font-semibold text-foreground tracking-wide font-sans">
            AI Pipeline Processing...
          </span>
        </div>

        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="h-6 px-2 text-[10px] font-semibold border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 cursor-pointer gap-1"
          >
            <XCircle className="size-3 text-rose-400" />
            <span>{isCancelling ? "Cancelling..." : "Cancel"}</span>
          </Button>
        )}
      </div>

      {/* Main progress stats */}
      <div className="flex-1 py-4 overflow-y-auto scrollbar-none">
        <RepositoryProgress
          progress={progress}
          currentStage={currentStage}
          startedAt={startedAt}
          estimatedRemainingTime={estimatedRemainingTime}
        />
        
        {/* Timeline trigger */}
        <div className="mt-5 pt-4 border-t border-[#1E2538]/30">
          <RepositoryTimeline currentStage={currentStage} />
        </div>
      </div>
    </div>
  );
}
