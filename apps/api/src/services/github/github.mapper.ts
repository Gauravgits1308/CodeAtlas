import { GitHubRepositoryDto } from "./github.types";

export class GitHubMapper {
  /**
   * Maps raw GitHub API repository response properties to our internal DTO.
   */
  static toDto(repo: any): GitHubRepositoryDto {
    return {
      githubRepoId: String(repo.id),
      name: repo.name || "",
      fullName: repo.full_name || "",
      owner: repo.owner?.login || "",
      visibility: repo.visibility || (repo.private ? "private" : "public"),
      defaultBranch: repo.default_branch || "main",
      cloneUrl: repo.clone_url || "",
      htmlUrl: repo.html_url || "",
      description: repo.description ?? null,
      primaryLanguage: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      watchers: repo.watchers_count ?? 0,
      updatedAt: repo.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Maps an array of raw GitHub API repositories to an array of DTOs.
   */
  static toDtoList(repos: any[]): GitHubRepositoryDto[] {
    if (!repos || !Array.isArray(repos)) return [];
    return repos.map((repo) => this.toDto(repo));
  }
}
