console.log("🚀 Repository worker booted");
import { Worker, Job } from "bullmq";
import { redisConnection } from "../queue/queue";
import { QUEUE_NAME } from "../queue/repository.queue";
import { RepositoryRepository } from "../repositories/repository.repository";
import { RepositoryService } from "../services/repository.service";
import { progressService } from "../services/progress.service";
import { logger } from "../utils/logger";

const repositoryRepository = new RepositoryRepository();
const repositoryService = new RepositoryService(repositoryRepository);

export const repositoryWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { repositoryId, userId } = job.data;

    logger.info(`Job started: Job ID ${job.id} for repository ${repositoryId}`);

    try {
      // 1. CLONING stage
      logger.info(`[Job ${job.id}] Clone started for repository ${repositoryId}`);
      await progressService.updateProgress(repositoryId, {
        currentStage: "Cloning Repository",
        stageProgress: 10.0,
        currentMessage: "Cloning source files from GitHub to local file server...",
      });
      await repositoryRepository.updateStatus(repositoryId, "CLONING");
      await repositoryService.cloneRepository(repositoryId, userId);
      logger.info(`[Job ${job.id}] Clone completed for repository ${repositoryId}`);

      // 2. METRICS ANALYSIS stage
      logger.info(`[Job ${job.id}] Analysis started for repository ${repositoryId}`);
      await progressService.updateProgress(repositoryId, {
        currentStage: "Calculating Repository Metrics",
        stageProgress: 30.0,
        currentMessage: "Calculating codebase metrics, LOC, languages, and directory structures...",
      });
      await repositoryRepository.updateStatus(repositoryId, "ANALYZING");
      await repositoryService.analyzeRepository(repositoryId, userId);
      logger.info(`[Job ${job.id}] Analysis completed for repository ${repositoryId}`);

      // 3. INDEXING (Extracting, Chunking, Embeddings) stage
      logger.info(`[Job ${job.id}] Indexing pipeline started for repository ${repositoryId}`);
      await repositoryService.processRepository(repositoryId, userId);
      logger.info(`[Job ${job.id}] Indexing pipeline completed for repository ${repositoryId}`);

      // 4. AI HEALTH ANALYSIS stage
      logger.info(`[Job ${job.id}] AI Health analysis started for repository ${repositoryId}`);
      await progressService.updateProgress(repositoryId, {
        currentStage: "AI Health Analysis",
        stageProgress: 90.0,
        currentMessage: "Running AI health check rules on codebase patterns...",
      });

      const { RepositoryHealthService } = await import("../services/repository-health.service");
      const healthService = new RepositoryHealthService();
      try {
        await healthService.getHealthReport(repositoryId, true); // force compile and cache
      } catch (err) {
        logger.warn(`Failed to pre-cache health report in worker pipeline: ${err}`);
      }

      // 5. READY stage
      await progressService.updateProgress(repositoryId, {
        currentStage: "Repository Ready",
        stageProgress: 100.0,
        currentMessage: "Repository processing completed successfully. AI Workspace is live!",
        finishedAt: new Date(),
      });
      await repositoryRepository.updateStatus(repositoryId, "COMPLETED");
      logger.info(`Job completed: Job ID ${job.id} successfully processed repository ${repositoryId}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Job failed: Job ID ${job.id} failed to process repository ${repositoryId}`, err);

      await progressService.updateProgress(repositoryId, {
        errorMessage: err.message || "Unknown error occurred during processing pipeline.",
      });
      await repositoryRepository.updateStatus(repositoryId, "FAILED");
      throw err;
    }
  },
  { connection: redisConnection }
);

repositoryWorker.on("completed", (job) => {
  logger.info(`Worker completed job ${job.id}`);
});

repositoryWorker.on("failed", (job, err) => {
  logger.error(`Worker failed job ${job?.id}: ${err.message}`);
});
