"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/common/Container";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { RepositoryStatsRow } from "@/features/dashboard/components/RepositoryStatsRow";
import { RepositoryFilters } from "@/features/dashboard/components/RepositoryFilters";
import { RepositoryGrid } from "@/features/dashboard/components/RepositoryGrid";
import { LoadingState } from "@/features/dashboard/components/LoadingState";
import { ErrorState } from "@/features/dashboard/components/ErrorState";
import { ImportRepositoryModal } from "@/features/dashboard/components/ImportRepositoryModal";
import { DeleteRepositoryModal } from "@/features/dashboard/components/DeleteRepositoryModal";
import { RepositorySearch } from "@/features/dashboard/components/RepositorySearch";
import { useRepositoryMetrics } from "@/hooks/useRepositoryMetrics";
import { useRepositoryActions } from "@/hooks/useRepositoryActions";
import { RepositoryDetails } from "@/features/dashboard/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface RawRepository {
  id: string;
  name: string;
  owner: string;
  htmlUrl?: string;
  cloneUrl?: string;
  visibility?: string;
  status: string;
  isArchived?: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  primaryLanguage?: string | null;
  stars?: number;
  forks?: number;
  watchers?: number;
  defaultBranch?: string;
  chunksCount?: number;
  embeddingsCount?: number;
  classifications?: {
    SOURCE_CODE: number;
    MARKUP: number;
    STYLESHEET: number;
    CONFIGURATION: number;
    DOCUMENTATION: number;
  };
  metrics?: {
    linesCount: number;
    filesCount: number;
    languages: { name: string; percentage: number }[];
    complexityScore?: number;
    dependencyCount?: number;
    averageFileSize?: number;
    documentationCoverage?: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [repositories, setRepositories] = React.useState<RepositoryDetails[]>([]);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Modals Toggles State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Destructive Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  // Load Connected Repositories
  const fetchRepos = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const response = await api.get<{ success: boolean; repositories: RawRepository[] }>("/v1/repositories");
      if (response.success && Array.isArray(response.repositories)) {
        const mapped = response.repositories.map((repo) => ({
          id: repo.id,
          name: repo.name,
          owner: repo.owner,
          url: repo.htmlUrl || repo.cloneUrl || "",
          provider: "github" as const,
          isPrivate: repo.visibility === "private",
          status: repo.status as RepositoryDetails["status"],
          isArchived: repo.isArchived || false,
          lastSyncedAt: repo.lastSyncedAt || undefined,
          createdAt: repo.createdAt,
          primaryLanguage: repo.primaryLanguage,
          stars: repo.stars,
          forks: repo.forks,
          watchers: repo.watchers,
          defaultBranch: repo.defaultBranch,
          chunksCount: repo.chunksCount,
          embeddingsCount: repo.embeddingsCount,
          classifications: repo.classifications || undefined,
          metrics: repo.metrics
            ? {
                linesCount: repo.metrics.linesCount,
                filesCount: repo.metrics.filesCount,
                languages: repo.metrics.languages,
                complexityScore: repo.metrics.complexityScore || undefined,
                dependencyCount: repo.metrics.dependencyCount,
                averageFileSize: repo.metrics.averageFileSize,
                documentationCoverage: repo.metrics.documentationCoverage,
              }
            : undefined,
        }));
        setRepositories(mapped);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to establish database connection.");
      toast.error(error.message || "Failed to load connected repositories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchRepos();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRepos]);

  // Hook actions
  const { handleSync, handleDelete, isDeleting } = useRepositoryActions(() => {
    fetchRepos();
    setDeleteTarget(null);
  });

  const onSyncTrigger = async (id: string, name: string) => {
    setSyncingId(id);
    await handleSync(id, name);
    setSyncingId(null);
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id, deleteTarget.name);
  };

  // Keyboard shortcut listener for Command Palette (⌘K or Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter Repos
  const filteredRepos = React.useMemo(() => {
    return repositories.filter((repo) => {
      const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            repo.owner.toLowerCase().includes(searchQuery.toLowerCase());
      if (showArchived) {
        return matchesSearch && repo.isArchived;
      }
      return matchesSearch && !repo.isArchived;
    });
  }, [repositories, searchQuery, showArchived]);

  // Aggregate Metrics using useRepositoryMetrics Hook
  const {
    totalRepos,
    totalFiles,
    totalLines,
    totalChunks,
    totalEmbeddings,
    totalDependencies,
  } = useRepositoryMetrics(repositories);

  return (
    <div className="py-12 min-h-full bg-[#0B0F19]">
      <Container className="max-w-5xl space-y-12">
        {/* Breadcrumb Header */}
        <DashboardHeader
          onImportClick={() => setIsImportModalOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
          repositoriesCount={totalRepos}
        />

        {/* Aggregate statistics row */}
        <RepositoryStatsRow
          totalRepos={totalRepos}
          totalFiles={totalFiles}
          totalLines={totalLines}
          totalChunks={totalChunks}
          totalEmbeddings={totalEmbeddings}
          totalDependencies={totalDependencies}
        />

        {/* Filters and main list area */}
        <div className="space-y-6">
          <RepositoryFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            repositoriesCount={filteredRepos.length}
          />

          {/* Main List Area */}
          {isLoading ? (
            <LoadingState />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={fetchRepos} />
          ) : (
            <RepositoryGrid
              repositories={filteredRepos}
              onSync={onSyncTrigger}
              syncingId={syncingId}
              onActionCompleted={fetchRepos}
              onImportClick={() => setIsImportModalOpen(true)}
              onDeleteClick={(id, name) => setDeleteTarget({ id, name })}
            />
          )}
        </div>
      </Container>

      {/* GitHub Repository Picker Modal */}
      <ImportRepositoryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importedRepositories={repositories}
        onImportSuccess={(importedRepos) => {
          if (importedRepos && Array.isArray(importedRepos) && importedRepos.length > 0) {
            const mapped = (importedRepos as RawRepository[]).map((repo) => ({
              id: repo.id,
              name: repo.name,
              owner: repo.owner,
              url: repo.htmlUrl || repo.cloneUrl || "",
              provider: "github" as const,
              isPrivate: repo.visibility === "private",
              status: "QUEUED" as const,
              isArchived: false,
              createdAt: repo.createdAt || new Date().toISOString(),
              primaryLanguage: repo.primaryLanguage,
              stars: repo.stars,
              forks: repo.forks,
              watchers: repo.watchers,
              defaultBranch: repo.defaultBranch,
            }));

            setRepositories((prev) => {
              const existingIds = new Set(prev.map((r) => r.id));
              const filteredMapped = mapped.filter((r) => !existingIds.has(r.id));
              return [...prev, ...filteredMapped];
            });
          }
          fetchRepos();
        }}
      />

      {/* Destructive Delete Confirmation Modal */}
      <DeleteRepositoryModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDeleteConfirm}
        repoName={deleteTarget?.name || ""}
        isDeleting={isDeleting}
      />

      {/* Global Command Palette search */}
      <RepositorySearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        repositories={repositories}
        onSelect={(id) => router.push(`/dashboard/repository/${id}/chat`)}
      />
    </div>
  );
}
