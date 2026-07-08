import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  default_branch: string;
  clone_url: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
}

export class GitHubService {
  async fetchRepositories(githubToken: string): Promise<GitHubRepositoryResponse[]> {
    try {
      const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "CodeAtlas-API",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`GitHub API returned error ${response.status}: ${errorText}`);

        if (response.status === 401) {
          throw new AppError("Invalid GitHub OAuth token.", 401);
        }
        if (response.status === 403) {
          throw new AppError("GitHub API rate limit exceeded or access forbidden.", 403);
        }
        throw new AppError(`GitHub API failed: status ${response.status}`, response.status);
      }

      const repos = (await response.json()) as Record<string, unknown>[];

      return repos.map((repo) => {
        const owner = repo.owner as Record<string, unknown> | undefined;
        return {
          id: repo.id as number,
          name: repo.name as string,
          full_name: repo.full_name as string,
          owner: {
            login: (owner?.login as string) || "",
          },
          private: repo.private as boolean,
          default_branch: (repo.default_branch as string) || "main",
          clone_url: repo.clone_url as string,
          html_url: repo.html_url as string,
          description: (repo.description as string) || null,
          language: (repo.language as string) || null,
          stargazers_count: (repo.stargazers_count as number) || 0,
          forks_count: (repo.forks_count as number) || 0,
          watchers_count: (repo.watchers_count as number) || 0,
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Network or internal error when fetching from GitHub:", error);
      throw new AppError("Network failure or connection error to GitHub API.", 503);
    }
  }
}
