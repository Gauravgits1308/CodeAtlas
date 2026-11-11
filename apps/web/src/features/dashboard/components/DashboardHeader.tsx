import * as React from "react";
import { Plus, Search, Layers, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onImportClick: () => void;
  onSearchClick: () => void;
  repositoriesCount: number;
}

export function DashboardHeader({
  onImportClick,
  onSearchClick,
  repositoriesCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-6 border-b border-border/30 bg-[#0B0F19]">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground tracking-wider uppercase font-mono">
          <span>Workspace</span>
          <span>/</span>
          <span className="text-foreground">Connected Repositories</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground mt-1.5 flex items-center gap-2 font-sans">
          <span>Revora Dashboard</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium font-mono text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 rounded-full">
            <Radio className="size-2.5 animate-pulse" />
            <span>Systems Normal</span>
          </span>
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Search button trigger */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-[#0F1320] border border-border/60 hover:border-border rounded-lg shadow-sm transition-all text-left w-48 font-mono select-none cursor-pointer focus:outline-none"
        >
          <Search className="size-3.5" />
          <span className="flex-1">Quick Search</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-muted-foreground/30 bg-[#161B2B] px-1.5 font-mono text-[9px] font-medium opacity-100">
            <span>⌘</span>K
          </kbd>
        </button>

        {/* Sync Trigger CTA */}
        <Button
          onClick={onImportClick}
          size="sm"
          className="h-8 gap-1.5 font-semibold text-xs bg-primary hover:bg-primary/95 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Import Repository</span>
        </Button>
      </div>
    </div>
  );
}
