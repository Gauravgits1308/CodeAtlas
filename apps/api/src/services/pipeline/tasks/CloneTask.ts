import { PipelineTask, PipelineContext } from "../Task";
import { CloneService } from "../../clone.service";
import { GitService } from "../../git.service";
import { RepositoryRepository } from "../../../repositories/repository.repository";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
 
export class CloneTask implements PipelineTask {
  name = "CLONING";
 
  private cloneService = new CloneService(new GitService(), new RepositoryRepository());
  private repositoryRepository = new RepositoryRepository();
 
  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[CloneTask] Started for repository ${ctx.repositoryId}`);
 
    const repo = await this.repositoryRepository.findById(ctx.repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }
 
    await this.cloneService.cloneRepository(repo.id, repo.cloneUrl);
 
    const duration = (Date.now() - startTime) / 1000;
    logger.info(`[CloneTask] Completed in ${duration.toFixed(2)} seconds`);
  }
}
