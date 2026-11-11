import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryTimelineProps {
  currentStage: string;
  completedStages?: string[];
}

const PIPELINE_STAGES = [
  { key: "QUEUED", label: "Queued" },
  { key: "Cloning Repository", label: "Cloning Repository" },
  { key: "Extracting Files", label: "Extracting Files" },
  { key: "Chunking Code", label: "Chunking Code" },
  { key: "Generating Embeddings", label: "Generating Embeddings" },
  { key: "Calculating Repository Metrics", label: "Metrics Analysis" },
  { key: "AI Health Analysis", label: "AI Health Analysis" },
  { key: "Repository Ready", label: "Repository Ready" },
];

export function RepositoryTimeline({ currentStage, completedStages = [] }: RepositoryTimelineProps) {
  // Find current step index
  const currentIndex = React.useMemo(() => {
    return PIPELINE_STAGES.findIndex((stage) => stage.key === currentStage || stage.label === currentStage);
  }, [currentStage]);

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/30">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex || currentStage === "Repository Ready";
        const isActive = idx === currentIndex && currentStage !== "Repository Ready";
        const isPending = idx > currentIndex && currentStage !== "Repository Ready";

        return (
          <div
            key={stage.key}
            className={cn(
              "relative flex items-center justify-between text-xs transition-all duration-300",
              isCompleted ? "text-emerald-400 font-medium" : isActive ? "text-blue-400 font-bold" : "text-muted-foreground"
            )}
          >
            {/* Timeline Dot Indicator */}
            <div
              className={cn(
                "absolute -left-6 flex items-center justify-center size-4 rounded-full border bg-[#0B0F19] transition-all",
                isCompleted
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 shadow-[0_0_6px_rgba(52,211,153,0.3)]"
                  : isActive
                  ? "border-blue-500/40 text-blue-400 animate-pulse bg-blue-500/5 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  : "border-zinc-800 text-zinc-500 bg-zinc-950"
              )}
            >
              {isCompleted ? (
                <Check className="size-2.5 stroke-[3px]" />
              ) : isActive ? (
                <Loader2 className="size-2 animate-spin" />
              ) : (
                <div className="size-1 rounded-full bg-zinc-600" />
              )}
            </div>

            {/* Label */}
            <span>{stage.label}</span>

            {/* Stage indicator message */}
            {isActive && (
              <span className="text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono text-[9px] animate-pulse">
                Active
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
