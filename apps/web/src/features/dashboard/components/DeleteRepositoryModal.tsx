import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  repoName: string;
  isDeleting: boolean;
}

export function DeleteRepositoryModal({
  isOpen,
  onClose,
  onConfirm,
  repoName,
  isDeleting,
}: DeleteRepositoryModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-4 bg-[#0F1320] text-foreground font-sans">
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Remove Repository</h2>
            <p className="text-[10px] text-muted-foreground">This operation is destructive.</p>
          </div>
        </div>

        {/* Details prompt */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to remove <span className="font-semibold text-foreground font-mono">&quot;{repoName}&quot;</span> from Revora?
          This will permanently delete all indexed semantic chunks, vector embeddings, and cached health report audits.
        </p>

        {/* Buttons trigger panel */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/10">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="font-semibold cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                <span>Removing...</span>
              </>
            ) : (
              <span>Delete Workspace</span>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
