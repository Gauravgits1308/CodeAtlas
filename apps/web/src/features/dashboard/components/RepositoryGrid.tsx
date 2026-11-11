import * as React from "react";
import { RepositoryDetails } from "@/features/dashboard/types";
import { RepositoryCard } from "./RepositoryCard";
import { EmptyState } from "./EmptyState";

interface RepositoryGridProps {
  repositories: RepositoryDetails[];
  onSync: (id: string, name: string) => void;
  syncingId: string | null;
  onActionCompleted: () => void;
  onImportClick: () => void;
  onDeleteClick: (id: string, name: string) => void;
}

export function RepositoryGrid({
  repositories,
  onSync,
  syncingId,
  onActionCompleted,
  onImportClick,
  onDeleteClick,
}: RepositoryGridProps) {
  if (repositories.length === 0) {
    return <EmptyState onImportClick={onImportClick} />;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {repositories.map((repo) => (
        <RepositoryCard
          key={repo.id}
          repo={repo}
          onSync={onSync}
          syncing={syncingId === repo.id}
          onActionCompleted={onActionCompleted}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
}
