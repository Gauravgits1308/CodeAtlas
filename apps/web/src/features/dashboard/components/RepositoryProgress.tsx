import * as React from "react";
import { Clock, Timer } from "lucide-react";

interface RepositoryProgressProps {
  progress: number;
  currentStage: string;
  startedAt?: string | Date;
  estimatedRemainingTime?: string | null;
}

export function RepositoryProgress({
  progress,
  currentStage,
  startedAt,
  estimatedRemainingTime,
}: RepositoryProgressProps) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!startedAt) return;
    const startMs = new Date(startedAt).getTime();
    
    // Ticking timer
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - startMs) / 1000);
      setElapsed(diffSec > 0 ? diffSec : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Progress header details */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-blue-400 font-semibold animate-pulse">{currentStage}</span>
        <span className="text-foreground font-bold">{Math.round(progress)}%</span>
      </div>

      {/* Progress Track */}
      <div className="h-2 w-full bg-[#1A1F30] rounded-full overflow-hidden border border-[#252C42]">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>

      {/* Duration trackers */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground pt-1 border-t border-[#1E2538]/50">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3 text-zinc-500" />
          <span>Elapsed:</span>
          <span className="text-foreground font-semibold">{formatDuration(elapsed)}</span>
        </div>
        {estimatedRemainingTime && (
          <div className="flex items-center gap-1.5">
            <Timer className="size-3 text-zinc-500" />
            <span>ETA:</span>
            <span className="text-foreground font-semibold">{estimatedRemainingTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
