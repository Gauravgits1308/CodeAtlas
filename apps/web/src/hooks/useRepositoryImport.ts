import * as React from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { GitHubRepositoryDto } from "@/features/dashboard/components/RepoSelectionModal";

export function useRepositoryImport(isOpen: boolean, onClose: () => void, onImportSuccess?: (importedRepos?: unknown[]) => void) {
  const [repos, setRepos] = React.useState<GitHubRepositoryDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = React.useState<"updated" | "name" | "stars">("updated");

  React.useEffect(() => {
    if (!isOpen) return;

    const fetchRepos = async () => {
      setLoading(true);
      setError(null);
      setSelectedIds(new Set());
      try {
        const response = await api.get<{ success: boolean; repositories: GitHubRepositoryDto[] }>(
          "/v1/github/repositories"
        );
        if (response.success && Array.isArray(response.repositories)) {
          setRepos(response.repositories);
        } else {
          setError("Invalid response format received from server.");
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || "Failed to load GitHub repositories.");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [isOpen]);

  const toggleSelect = (repoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedIds.size === 0 || isImporting) return;
    
    setIsImporting(true);
    const selectedRepos = repos.filter((r) => selectedIds.has(r.githubRepoId));
    const payloads = selectedRepos.map((repo) => ({
      githubRepoId: repo.githubRepoId,
      name: repo.name,
      fullName: repo.fullName,
      owner: repo.owner,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranch,
      cloneUrl: repo.cloneUrl,
      htmlUrl: repo.htmlUrl,
      description: repo.description,
      primaryLanguage: repo.primaryLanguage,
      stars: repo.stars,
      forks: repo.forks,
      watchers: repo.watchers,
    }));

    try {
      const response = await api.post<{ success: boolean; imported: number; repositories: unknown[] }>(
        "/v1/repositories/import",
        { repositories: payloads }
      );

      if (response.success) {
        if (response.imported === 0) {
          toast.success("Repositories synchronized successfully.");
        } else {
          toast.success(`Successfully imported ${response.imported} repositor${response.imported === 1 ? "y" : "ies"}.`);
        }
        
        if (onImportSuccess) {
          onImportSuccess(response.repositories);
        }
        onClose();
      } else {
        toast.error("Failed to import repositories.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "An error occurred during repository import.");
    } finally {
      setIsImporting(false);
    }
  };

  const filtered = React.useMemo(() => {
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [repos, searchQuery]);

  const sortedRepos = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "stars") {
        return b.stars - a.stars;
      } else {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [filtered, sortBy]);

  return {
    repos: sortedRepos,
    loading,
    isImporting,
    error,
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelect,
    handleImport,
    sortBy,
    setSortBy,
  };
}
