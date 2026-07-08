/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { RepositoryService, ImportRepositoryPayload } from "../services/repository.service";
import { asyncHandler, AppError } from "../utils/errors";

export class RepositoryController {
  constructor(private repositoryService: RepositoryService) {}

  importRepositories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.auth.userId;
    const { repositories } = req.body as { repositories?: ImportRepositoryPayload[] };

    if (!repositories || !Array.isArray(repositories)) {
      return next(new AppError("Invalid payload shape: repositories list is required and must be an array.", 400));
    }

    const imported = await this.repositoryService.importRepositories(userId, repositories);

    res.status(201).json({
      success: true,
      imported: imported.length,
      repositories: imported.map((repo) => ({
        id: repo.id,
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
        status: repo.status,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
      })),
    });
  });
}
