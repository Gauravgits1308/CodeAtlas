/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { RepositoryHealthService } from "../services/repository-health.service";
import { RepositoryRepository } from "../repositories/repository.repository";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class HealthController {
  private repositoryRepository: RepositoryRepository;
  private healthService: RepositoryHealthService;

  constructor(repositoryRepository?: RepositoryRepository, healthService?: RepositoryHealthService) {
    this.repositoryRepository = repositoryRepository || new RepositoryRepository();
    this.healthService = healthService || new RepositoryHealthService();
  }

  /**
   * Retrieves or computes repository health dashboard analytics reports.
   */
  getHealthReport = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;
    const forceRefresh = req.query.refresh === "true";

    // 1. Verify repository exists
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    // Ownership check (Repository matches authenticated user)
    if (repo.userId !== userId) {
      throw new AppError("Access denied.", 403);
    }

    // 2. Verify repository is indexed
    if (repo.status !== "COMPLETED") {
      throw new AppError("Repository is not fully indexed yet. Health reports require complete embeddings.", 400);
    }

    logger.info(`Health dashboard query: RepoId=${repositoryId}, forceRefresh=${forceRefresh}`);

    const report = await this.healthService.getHealthReport(repositoryId, forceRefresh);

    res.status(200).json({
      success: true,
      report,
    });
  });
}
