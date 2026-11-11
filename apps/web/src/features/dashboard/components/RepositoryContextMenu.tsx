import * as React from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Archive, Trash2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepositoryContextMenuProps {
  isArchived: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onDeleteClick: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export function RepositoryContextMenu({
  isArchived,
  onArchive,
  onRestore,
  onDeleteClick,
  onSync,
  isSyncing,
}: RepositoryContextMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  const updateCoords = React.useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right - 160 + window.scrollX, // 160px is the width of the dropdown menu
      });
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen, updateCoords]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".portal-context-menu")
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const menuContent = (
    <div
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      className="portal-context-menu w-40 py-1.5 z-[9999] bg-[#0F1320] border border-border/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-1 duration-155 select-none"
    >
      {/* Sync action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
          onSync();
        }}
        disabled={isSyncing}
        className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-[#1E2538]/60 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <RefreshCcw className={cn("size-3.5", isSyncing && "animate-spin")} />
        <span>Sync Codebase</span>
      </button>

      {/* Archive / Restore actions */}
      {isArchived ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            onRestore();
          }}
          className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-[#1E2538]/60 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Archive className="size-3.5 text-emerald-400" />
          <span>Restore Repo</span>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            onArchive();
          }}
          className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-[#1E2538]/60 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Archive className="size-3.5 text-zinc-400" />
          <span>Archive Repo</span>
        </button>
      )}

      {/* Divider */}
      <div className="h-px bg-border/20 my-1" />

      {/* Delete action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
          onDeleteClick();
        }}
        className="w-full px-3 py-1.5 text-xs text-left text-rose-400 hover:bg-rose-500/5 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Trash2 className="size-3.5" />
        <span>Delete Repo</span>
      </button>
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center size-7 rounded-lg border border-border/40 bg-[#0F1320] text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/50 transition-all cursor-pointer"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(menuContent, document.body)}
    </div>
  );
}
