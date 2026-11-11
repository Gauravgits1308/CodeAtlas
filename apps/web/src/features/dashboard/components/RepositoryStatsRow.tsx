import * as React from "react";
import { FolderGit2, FileText, Code2, Database, ShieldAlert, BarChart3, Users2, Library } from "lucide-react";

interface RepositoryStatsRowProps {
  totalRepos: number;
  totalFiles: number;
  totalLines: number;
  totalChunks: number;
  totalEmbeddings: number;
  totalDependencies: number;
}

export function RepositoryStatsRow({
  totalRepos,
  totalFiles,
  totalLines,
  totalChunks,
  totalEmbeddings,
  totalDependencies,
}: RepositoryStatsRowProps) {
  const statsList = React.useMemo(
    () => [
      {
        label: "Connected Repos",
        value: totalRepos.toLocaleString(),
        icon: <FolderGit2 className="size-4 text-primary" />,
        bg: "bg-primary/5 border-primary/10",
      },
      {
        label: "Files Indexed",
        value: totalFiles.toLocaleString(),
        icon: <FileText className="size-4 text-emerald-400" />,
        bg: "bg-emerald-500/5 border-emerald-500/10",
      },
      {
        label: "Lines of Code",
        value: totalLines.toLocaleString(),
        icon: <Code2 className="size-4 text-purple-400" />,
        bg: "bg-purple-500/5 border-purple-500/10",
      },
      {
        label: "Vector Chunks",
        value: totalChunks.toLocaleString(),
        icon: <Database className="size-4 text-amber-400" />,
        bg: "bg-amber-500/5 border-amber-500/10",
      },
    ],
    [totalRepos, totalFiles, totalLines, totalChunks]
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2 select-none">
      {statsList.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-3.5 p-4 rounded-xl border bg-[#111625]/30 ${stat.bg}`}
        >
          <div className="flex items-center justify-center size-9 rounded-lg bg-[#0F1320] border border-border/40 shadow-sm shrink-0">
            {stat.icon}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              {stat.label}
            </span>
            <span className="text-base font-bold text-foreground font-mono mt-0.5">
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
