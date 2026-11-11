import * as React from "react";
import { FolderGit2, Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onImportClick: () => void;
}

export function EmptyState({ onImportClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-border/60 bg-[#0F1320]/20 min-h-[400px]">
      {/* Icon */}
      <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/5 border border-primary/10 text-primary shadow-[inset_0_0_12px_rgba(59,130,246,0.1)] mb-5">
        <FolderGit2 className="size-7" />
      </div>

      {/* Heading & Details */}
      <h3 className="text-sm font-bold text-foreground tracking-wide font-sans">
        No Connected Repositories
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
        Connect your GitHub repositories to index them with vector embeddings and generate AI-powered engineering insights.
      </p>

      {/* Onboarding Hints */}
      <div className="flex flex-col gap-2.5 pt-6 pb-2 text-[10px] font-mono text-muted-foreground/80 max-w-xs w-full">
        <div className="flex items-center gap-2 bg-[#0F1320]/45 border border-border/30 px-3 py-1.5 rounded-lg">
          <Terminal className="size-3 text-primary shrink-0" />
          <span className="text-left leading-tight">1. Authorize your GitHub account</span>
        </div>
        <div className="flex items-center gap-2 bg-[#0F1320]/45 border border-border/30 px-3 py-1.5 rounded-lg">
          <Terminal className="size-3 text-primary shrink-0" />
          <span className="text-left leading-tight">2. Select codebases for AI chunking</span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onImportClick}
        size="sm"
        className="mt-6 gap-1.5 font-semibold text-xs bg-primary hover:bg-primary/95 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
      >
        <Plus className="size-4" />
        <span>Import Your First Repository</span>
      </Button>
    </div>
  );
}
