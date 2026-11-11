import * as React from "react";
import { Search, Archive, Grid, ListFilter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  repositoriesCount: number;
}

export function RepositoryFilters({
  searchQuery,
  setSearchQuery,
  showArchived,
  setShowArchived,
  repositoriesCount,
}: RepositoryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-border/10 bg-[#0B0F19]">
      {/* Search Input bar */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by repository name..."
          className="w-full pl-9 pr-8 py-1.5 bg-[#0F1320] border border-border/40 hover:border-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/30 rounded-lg text-xs placeholder:text-muted-foreground outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Tabs list (Active vs Archived) */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-0.5 bg-[#0F1320] border border-border/40 rounded-lg">
          <button
            onClick={() => setShowArchived(false)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 select-none",
              !showArchived
                ? "bg-[#1E2538] text-foreground border border-border/20 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="size-3.5" />
            <span>Active</span>
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 select-none",
              showArchived
                ? "bg-[#1E2538] text-foreground border border-border/20 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Archive className="size-3.5" />
            <span>Archived</span>
          </button>
        </div>
      </div>
    </div>
  );
}
