import * as React from "react";
import { BarChart2, FileText, Code2, Layers, AlertCircle } from "lucide-react";
import { CodeMetric } from "@/features/dashboard/types";

interface RepositoryStatsProps {
  metrics?: CodeMetric;
}

export function RepositoryStats({ metrics }: RepositoryStatsProps) {
  if (!metrics) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border/20 bg-[#161B2B]/20 text-xs text-muted-foreground">
        <AlertCircle className="size-4 text-zinc-500" />
        <span>No engineering metrics available for this repository. Sync to generate report.</span>
      </div>
    );
  }

  const { linesCount, filesCount, languages, dependencyCount } = metrics;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border/40 bg-[#0F1320]/45">
      {/* Metric LOC */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400">
          <Code2 className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Lines of Code</span>
          <span className="text-xs font-bold text-foreground font-mono">
            {linesCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Metric Files */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
          <FileText className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Total Files</span>
          <span className="text-xs font-bold text-foreground font-mono">
            {filesCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Metric Dependencies */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-purple-500/5 border border-purple-500/10 text-purple-400">
          <Layers className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Dependencies</span>
          <span className="text-xs font-bold text-foreground font-mono">
            {dependencyCount || 0}
          </span>
        </div>
      </div>

      {/* Languages Split preview */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400">
          <BarChart2 className="size-4" />
        </div>
        <div className="flex flex-col w-full max-w-[120px]">
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Languages</span>
          <div className="flex items-center gap-1 mt-0.5 w-full">
            {languages && languages.length > 0 ? (
              languages.slice(0, 3).map((lang, idx) => (
                <span
                  key={lang.name}
                  className="inline-flex items-center text-[8px] font-mono font-medium px-1 bg-zinc-800 text-zinc-300 rounded border border-border/30 max-w-[45px] truncate"
                  title={`${lang.name} (${lang.percentage}%)`}
                >
                  {lang.name}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground">N/A</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
