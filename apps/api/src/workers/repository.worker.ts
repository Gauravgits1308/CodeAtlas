console.log("🚀 Repository worker booted");
import { Worker, Job } from "bullmq";
import { redisConnection } from "../queue/queue";
import { QUEUE_NAME } from "../queue/repository.queue";
import { PipelineManager } from "../services/pipeline/PipelineManager";
import { logger } from "../utils/logger";

export const repositoryWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { repositoryId, userId } = job.data;

    logger.info(`[Repository: ${repositoryId}] Worker received job: Job ID ${job.id}`);
    logger.info(`[Repository: ${repositoryId}] Worker picked job: Job ID ${job.id} picked up for processing`);

    const pipeline = new PipelineManager(repositoryId, userId);
    await pipeline.run();
  },
  { connection: redisConnection }
);

repositoryWorker.on("completed", (job) => {
  logger.info(`Worker completed job ${job.id}`);
});

repositoryWorker.on("failed", (job, err) => {
  logger.error(`Worker failed job ${job?.id}: ${err.message}`);
});
