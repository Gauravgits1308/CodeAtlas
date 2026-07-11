import { PipelineTask, PipelineContext } from "../Task";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
 
export class HealthTask implements PipelineTask {
  name = "AI_HEALTH_ANALYSIS";
 
  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[HealthTask] Started for repository ${ctx.repositoryId}`);
 
    try {
      const { RepositoryHealthService } = await import("../../repository-health.service");
      const healthService = new RepositoryHealthService();
      
      logger.info(`[HealthTask] Generating health report using AI LLM rules...`);
      await healthService.getHealthReport(ctx.repositoryId, true); // Force generation & cache
 
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[HealthTask] Completed in ${duration.toFixed(2)} seconds`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`[HealthTask] Failed: ${err.message}`, err);
      throw new AppError(`AI repository health check failed: ${err.message}`, 500);
    }
  }
}
