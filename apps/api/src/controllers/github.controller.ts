import { Request, Response, NextFunction } from "express";
import { GitHubService } from "../services/github/github.service";
import { asyncHandler, AppError } from "../utils/errors";

export class GitHubController {
  constructor(private githubService: GitHubService) {}

  /**
   * GET /api/v1/github/repositories
   * Retrieves the authenticated user's GitHub repositories via Clerk OAuth tokens.
   */
  getUserRepositories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.auth?.userId;

    if (!userId) {
      return next(new AppError("Unauthorized: Missing user authentication session context.", 401));
    }

    const repositories = await this.githubService.getUserRepositories(userId);

    res.status(200).json({
      success: true,
      repositories,
    });
  });
}
