import * as React from "react";
import { useRepositoryHealth } from "@/hooks/useRepositoryHealth";
import { ShieldCheck, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryHealthBadgeProps {
  score?: number;
  className?: string;
}

export function RepositoryHealthBadge({ score, className }: RepositoryHealthBadgeProps) {
  const { rating, colorClass, label } = useRepositoryHealth(score);
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold font-mono border rounded-md cursor-pointer transition-all select-none",
          colorClass,
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        <ShieldCheck className="size-3.5" />
        <span>{rating}</span>
        {score !== undefined && <span className="text-[10px] opacity-60">({score})</span>}
      </div>

      {showTooltip && (
        <div className="absolute right-0 bottom-full mb-2 w-48 p-3 z-50 bg-[#0F1320] border border-border/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
            <span>Engineering Health</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {score !== undefined
              ? `This repository scores ${score}/100. Rating matches: ${label}.`
              : "Repository is currently waiting for metrics/AI evaluation."}
          </p>
        </div>
      )}
    </div>
  );
}
