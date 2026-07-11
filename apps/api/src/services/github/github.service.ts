import { clerkClient } from "@clerk/express";
import { GitHubRepositoryDto } from "./github.types";
import { GitHubMapper } from "./github.mapper";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

export class GitHubService {
  /**
   * Retrieves the authenticated user's GitHub repositories.
   *
   * @param userId Authenticated Clerk User ID.
   * @returns Mapped repository DTO collection.
   */
  async getUserRepositories(userId: string): Promise<GitHubRepositoryDto[]> {
    logger.info(`GitHub request started for user: ${userId}`);

    let oauthToken = "";
    try {
      // Fetch user's GitHub OAuth token list from Clerk
      const response = await clerkClient.users.getUserOauthAccessToken(
        userId,
        "oauth_github"
      );
      // Support Clerk SDK variations (direct array or data property wrapper)
      const tokens = Array.isArray(response)
        ? response
        : (response as any).data || [];

      if (!tokens || tokens.length === 0) {
        throw new AppError("No GitHub OAuth connection found. Please connect your GitHub account in profile settings.", 400);
      }

      oauthToken = tokens[0].token;
      if (!oauthToken) {
        throw new AppError("GitHub OAuth access token is missing.", 400);
      }
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to fetch Clerk GitHub OAuth token for user ${userId}`, error);
      throw new AppError("Failed to retrieve GitHub credentials. Please reconnect your account.", 400);
    }

    try {
      // Query GitHub User Repos REST API
      const url = "https://api.github.com/user/repos?sort=updated&direction=desc&per_page=100";
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${oauthToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CodeAtlas-Api",
        },
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        const status = response.status;
        
        logger.error(`GitHub API response error (status ${status}): ${JSON.stringify(errorData)}`);

        // Check for rate limit boundaries
        const remainingLimit = response.headers.get("x-ratelimit-remaining");
        if (status === 403 && remainingLimit === "0") {
          throw new AppError("GitHub API rate limit exceeded. Please try again later.", 429);
        }

        throw new AppError(errorData.message || "Failed to fetch repositories from GitHub REST API.", status);
      }

      const repos = (await response.json()) as any[];
      logger.info(`GitHub request succeeded. Repository count: ${repos.length}`);

      return GitHubMapper.toDtoList(repos);
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const err = error as Error;
      logger.error(`GitHub API request execution failed for user ${userId}: ${err.message}`, err);
      throw new AppError(`GitHub API request failed: ${err.message}`, 502);
    }
  }
}
export { GitHubRepositoryDto };
