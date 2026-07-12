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
    logger.info(`[Clone] Started`);
    logger.info(`[CloneTask] Started for repository ${ctx.repositoryId}`);
 
    const repo = await this.repositoryRepository.findById(ctx.repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }
 
    try {
      await this.cloneService.cloneRepository(repo.id, repo.cloneUrl);
      logger.info(`[Clone] Completed`);
    } catch (cloneErr: any) {
      logger.error(`[Clone] Failed: ${cloneErr.message}`);
      throw new AppError(`Clone Failed: ${cloneErr.message}`, 500);
    }
 
    // Explicit verification step after cloning
    const { REPOSITORY_STORAGE_PATH } = await import("../../../config");
    const repoPath = path.join(REPOSITORY_STORAGE_PATH, repo.id);
    const gitPath = path.join(repoPath, ".git");
 
    if (!fs.existsSync(repoPath)) {
      throw new AppError("Clone Verification Failed: Repository directory does not exist.", 500);
    }
    if (!fs.existsSync(gitPath)) {
      throw new AppError("Clone Verification Failed: .git folder does not exist.", 500);
    }
 
    logger.info(`[Clone] Verified`);
    const duration = (Date.now() - startTime) / 1000;
    logger.info(`[CloneTask] Completed in ${duration.toFixed(2)} seconds`);
  }
}
