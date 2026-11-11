import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryStatusChipProps {
  status: "PENDING" | "QUEUED" | "CLONING" | "ANALYZING" | "INDEXING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "STALLED";
  className?: string;
}

export function RepositoryStatusChip({ status, className }: RepositoryStatusChipProps) {
  const config = React.useMemo(() => {
    switch (status) {
      case "COMPLETED":
        return {
          icon: <CheckCircle2 className="size-3.5 text-emerald-400" />,
          text: "Ready",
          styles: "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10",
        };
      case "FAILED":
        return {
          icon: <AlertCircle className="size-3.5 text-rose-400" />,
          text: "Failed",
          styles: "bg-rose-500/5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10",
        };
      case "CANCELLED":
        return {
          icon: <XCircle className="size-3.5 text-amber-400" />,
          text: "Cancelled",
          styles: "bg-amber-500/5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10",
        };
      case "STALLED":
        return {
          icon: <AlertTriangle className="size-3.5 text-orange-400 animate-pulse" />,
          text: "Stalled",
          styles: "bg-orange-500/5 text-orange-400 border-orange-500/20 hover:bg-orange-500/10",
        };
      case "PENDING":
      case "QUEUED":
        return {
          icon: <Clock className="size-3.5 text-zinc-400 animate-pulse" />,
          text: status === "QUEUED" ? "Queued" : "Imported",
          styles: "bg-zinc-800/30 text-zinc-400 border-zinc-700/30 hover:bg-zinc-800/50",
        };
      default:
        // Processing status
        return {
          icon: <Loader2 className="size-3.5 text-blue-400 animate-spin" />,
          text: status === "CLONING" ? "Cloning" : status === "ANALYZING" ? "Analyzing" : "Processing",
          styles: "bg-blue-500/5 text-blue-400 border-blue-500/20 animate-pulse",
        };
    }
  }, [status]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium font-mono border rounded-full transition-all select-none cursor-default",
        config.styles,
        className
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
