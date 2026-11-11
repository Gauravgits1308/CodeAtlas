import * as React from "react";
import { Lock, Globe, Star, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryHeaderProps {
  name: string;
  owner: string;
  isPrivate: boolean;
  stars?: number;
  forks?: number;
  className?: string;
}

export function RepositoryHeader({
  name,
  owner,
  isPrivate,
  stars = 0,
  forks = 0,
  className,
}: RepositoryHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between w-full", className)}>
      {/* Title Breadcrumb details */}
      <div className="flex items-center flex-wrap gap-2.5">
        <span className="text-xs text-muted-foreground font-mono">{owner}</span>
        <span className="text-muted-foreground/30 text-xs">/</span>
        <span className="text-sm font-bold text-foreground font-sans tracking-wide">
          {name}
        </span>

        {/* Private / Public Tag */}
        {isPrivate ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.25 text-[9px] font-mono font-medium border border-amber-400/25 text-amber-400 bg-amber-400/5 rounded">
            <Lock className="size-2.5" />
            <span>Private</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.25 text-[9px] font-mono font-medium border border-emerald-400/25 text-emerald-400 bg-emerald-400/5 rounded">
            <Globe className="size-2.5" />
            <span>Public</span>
          </span>
        )}
      </div>

      {/* GitHub stars/forks count indicators */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground select-none">
        <span className="flex items-center gap-0.5">
          <Star className="size-3" />
          <span>{stars}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <GitFork className="size-3" />
          <span>{forks}</span>
        </span>
      </div>
    </div>
  );
}
