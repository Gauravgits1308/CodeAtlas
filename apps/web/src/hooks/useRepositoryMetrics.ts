import { useMemo } from "react";
import { RepositoryDetails } from "@/features/dashboard/types";

export function useRepositoryMetrics(repositories: RepositoryDetails[]) {
  return useMemo(() => {
    const activeRepos = repositories.filter((r) => !r.isArchived);

    const totalRepos = activeRepos.length;
    
    const totalFiles = activeRepos.reduce(
      (sum, repo) => sum + (repo.metrics?.filesCount || 0),
      0
    );
    
    const totalLines = activeRepos.reduce(
      (sum, repo) => sum + (repo.metrics?.linesCount || 0),
      0
    );
    
    const totalChunks = activeRepos.reduce(
      (sum, repo) => sum + (repo.chunksCount || 0),
      0
    );
    
    const totalEmbeddings = activeRepos.reduce(
      (sum, repo) => sum + (repo.embeddingsCount || 0),
      0
    );

    const totalDependencies = activeRepos.reduce(
      (sum, repo) => sum + (repo.metrics?.dependencyCount || 0),
      0
    );

    return {
      totalRepos,
      totalFiles,
      totalLines,
      totalChunks,
      totalEmbeddings,
      totalDependencies,
    };
  }, [repositories]);
}
