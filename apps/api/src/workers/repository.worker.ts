import { Worker, Job } from "bullmq";
import { redisConnection } from "../queue/queue";
import { QUEUE_NAME } from "../queue/repository.queue";
import { RepositoryRepository } from "../repositories/repository.repository";
import { RepositoryService } from "../services/repository.service";
import { logger } from "../utils/logger";

const repositoryRepository = new RepositoryRepository();
const repositoryService = new RepositoryService(repositoryRepository);

export const repositoryWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { repositoryId, userId } = job.data;

    logger.info(`Job started: Job ID ${job.id} for repository ${repositoryId}`);
    await job.updateProgress({ progress: 10, stage: "CLONING" });

    try {
      // 1. CLONING stage
      logger.info(`[Job ${job.id}] Clone started for repository ${repositoryId}`);
      await repositoryRepository.updateStatus(repositoryId, "CLONING");
      await repositoryService.cloneRepository(repositoryId, userId);
      logger.info(`[Job ${job.id}] Clone completed for repository ${repositoryId}`);
      
      // 2. ANALYZING stage
      await job.updateProgress({ progress: 40, stage: "ANALYZING" });
      logger.info(`[Job ${job.id}] Analysis started for repository ${repositoryId}`);
      await repositoryService.analyzeRepository(repositoryId, userId);
      logger.info(`[Job ${job.id}] Analysis completed for repository ${repositoryId}`);

      // 3. PROCESSING stage
      await job.updateProgress({ progress: 70, stage: "PROCESSING" });
      logger.info(`[Job ${job.id}] Chunk generation started for repository ${repositoryId}`);
      await repositoryService.processRepository(repositoryId, userId);
      logger.info(`[Job ${job.id}] Chunk generation completed for repository ${repositoryId}`);

      // 4. COMPLETED stage
      await job.updateProgress({ progress: 100, stage: "COMPLETED" });
      await repositoryRepository.updateStatus(repositoryId, "COMPLETED");
      logger.info(`Job completed: Job ID ${job.id} successfully processed repository ${repositoryId}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Job failed: Job ID ${job.id} failed to process repository ${repositoryId}`, err);
      await repositoryRepository.updateStatus(repositoryId, "FAILED");
      await job.updateProgress({ progress: 100, stage: "FAILED" });
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
