import * as React from "react";
import { Search, FolderGit2, ArrowRight, CornerDownLeft } from "lucide-react";
import { RepositoryDetails } from "@/features/dashboard/types";

interface RepositorySearchProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: RepositoryDetails[];
  onSelect: (repoId: string) => void;
}

export function RepositorySearch({
  isOpen,
  onClose,
  repositories,
  onSelect,
}: RepositorySearchProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Monitor toggle global keys
  React.useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    if (!query) return repositories.slice(0, 5);
    return repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query.toLowerCase()) ||
        repo.owner.toLowerCase().includes(query.toLowerCase())
    );
  }, [repositories, query]);

  // Handle navigate list keyboard keys
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#070A13]/85 backdrop-blur-[6px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main command bar box */}
      <div className="relative bg-[#0F1320] border border-[#252C42]/80 w-full max-w-xl shadow-2xl rounded-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/20">
          <Search className="size-4.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a repository name to open Workspace..."
            className="w-full bg-transparent text-sm text-foreground outline-none border-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center h-5 select-none rounded border border-muted-foreground/30 bg-[#161B2B] px-2 font-mono text-[9px] text-muted-foreground shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground font-mono">
              No matching repositories found.
            </div>
          ) : (
            filtered.map((repo, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={repo.id}
                  onClick={() => {
                    onSelect(repo.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none ${
                    isSelected ? "bg-primary/10 text-foreground border border-primary/20" : "text-muted-foreground hover:bg-[#1E2538]/40 border border-transparent"
                  }`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex items-center gap-3">
                    <FolderGit2 className={`size-4 ${isSelected ? "text-primary" : "text-zinc-500"}`} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-foreground">{repo.name}</span>
                      <span className="text-[10px] text-muted-foreground">{repo.owner}</span>
                    </div>
                  </div>

                  {/* Actions / hints */}
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-primary animate-pulse bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded">
                        <span>Open Workspace</span>
                        <ArrowRight className="size-3" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-muted-foreground/50 opacity-0 group-hover:opacity-100">
                        Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command bar Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/10 bg-[#070A13] text-[9px] font-mono text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="border border-muted-foreground/30 bg-[#161B2B] px-1 rounded">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-muted-foreground/30 bg-[#161B2B] px-1 rounded">ENTER</kbd>
              <span>Open</span>
            </span>
          </div>
          <span>Revora Command Palette</span>
        </div>
      </div>
    </div>
  );
}
