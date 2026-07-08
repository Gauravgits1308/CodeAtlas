import { Request, Response, NextFunction } from "express";
import { GitHubService } from "../services/github.service";
import { asyncHandler, AppError } from "../utils/errors";

export class GitHubController {
  constructor(private githubService: GitHubService) {}

  getUserRepositories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const githubToken = req.headers["x-github-token"];

    if (!githubToken || typeof githubToken !== "string") {
      return next(new AppError("Missing required X-Github-Token authorization header.", 401));
    }

    const repositories = await this.githubService.fetchRepositories(githubToken);

    res.status(200).json({
      success: true,
      repositories,
    });
  });
}
