import { PipelineTask, PipelineContext } from "../Task";
import { CloneService } from "../../clone.service";
import { GitService } from "../../git.service";
import { RepositoryRepository } from "../../../repositories/repository.repository";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
import * as fs from "fs";
import * as path from "path";

export class CloneTask implements PipelineTask {
  name = "CLONING";

  private cloneService = new CloneService(new GitService(), new RepositoryRepository());
  private repositoryRepository = new RepositoryRepository();

  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[CloneTask] Started for repository: ${ctx.repositoryId}`);

    logger.info(`[CloneTask] Fetching repository metadata from database for: ${ctx.repositoryId}`);
    const repo = await this.repositoryRepository.findById(ctx.repositoryId);
    if (!repo) {
      logger.error(`[CloneTask] Repository not found in database: ${ctx.repositoryId}`);
      throw new AppError("Repository not found in database.", 404);
    }

    logger.info(`[CloneTask] Repository metadata retrieved. Name: ${repo.fullName}, Clone URL: ${repo.cloneUrl}`);

    try {
      logger.info(`[CloneTask] Initiating clone service execution for repository: ${ctx.repositoryId}`);
      await this.cloneService.cloneRepository(repo.id, repo.cloneUrl);
      logger.info(`[CloneTask] Clone service execution finished successfully for: ${ctx.repositoryId}`);
    } catch (cloneErr: any) {
      const duration = (Date.now() - startTime) / 1000;
      logger.error(`[CloneTask] Failed after ${duration.toFixed(2)}s for ${ctx.repositoryId}: ${cloneErr.message}`, cloneErr);
      throw cloneErr instanceof AppError ? cloneErr : new AppError(`Clone Task Failed: ${cloneErr.message}`, 500);
    }

    // Explicit filesystem verification step after cloning
    logger.info(`[CloneTask] Verifying filesystem clone output for repository: ${ctx.repositoryId}`);
    const { REPOSITORY_STORAGE_PATH } = await import("../../../config");
    const repoPath = path.join(REPOSITORY_STORAGE_PATH, repo.id);
    const gitPath = path.join(repoPath, ".git");

    if (!fs.existsSync(repoPath)) {
      logger.error(`[CloneTask] Verification failed: Storage directory does not exist at ${repoPath}`);
      throw new AppError("Clone Verification Failed: Storage directory does not exist after clone.", 500);
    }
    if (!fs.existsSync(gitPath)) {
      logger.error(`[CloneTask] Verification failed: .git metadata directory missing at ${gitPath}`);
      throw new AppError("Clone Verification Failed: .git metadata folder is missing after clone.", 500);
    }

    const duration = (Date.now() - startTime) / 1000;
    logger.info(`[CloneTask] Verification successful. Repository ${ctx.repositoryId} cloned and verified in ${duration.toFixed(2)}s`);
  }
}
