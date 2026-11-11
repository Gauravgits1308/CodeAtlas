console.log(`[WORKER_BOOT] PID=${process.pid} START=${new Date().toISOString()}`);

import { Worker, Job } from "bullmq";
import { redisConnection } from "../queue/queue";
import { QUEUE_NAME } from "../queue/repository.queue";
import { PipelineManager } from "../services/pipeline/PipelineManager";
import { logger } from "../utils/logger";
import { prisma } from "../database";

export const repositoryWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { repositoryId, userId } = job.data;
    const startTime = Date.now();

    logger.info(`[BULLMQ_WORKER] [JOB_RECEIVED] Job ID: ${job.id} | Repo: ${repositoryId} | User: ${userId}`);

    try {
      logger.info(`[BULLMQ_WORKER] [JOB_START] Initializing PipelineManager for ${repositoryId}`);
      const pipeline = new PipelineManager(repositoryId, userId);

      await pipeline.run();

      const elapsed = Date.now() - startTime;
      logger.info(`[BULLMQ_WORKER] [JOB_FINISHED] Job ID: ${job.id} completed successfully in ${elapsed}ms`);
      if (elapsed > 30000) {
        logger.warn(`[BULLMQ_WORKER] [TIMEOUT_WARNING] Job ID ${job.id} execution exceeded 30s threshold (${(elapsed / 1000).toFixed(1)}s)`);
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[BULLMQ_WORKER] [JOB_FAILED] Job ID: ${job.id} failed after ${elapsed}ms: ${errMsg}`, err);

      // Guard database status transition to FAILED
      try {
        await prisma.repository.update({
          where: { id: repositoryId },
          data: { status: "FAILED" },
        });
      } catch (dbErr) {
        logger.warn(`[BULLMQ_WORKER] Failed DB status update for ${repositoryId}: ${dbErr}`);
      }

      throw err;
    }
  },
  {
    connection: redisConnection,
    lockDuration: 300000, // 5 minutes lock duration
    concurrency: 2,
  }
);

repositoryWorker.on("active", (job) => {
  logger.info(`[BULLMQ_EVENT] [ACTIVE] Job ID ${job.id} has transitioned to ACTIVE state.`);
});

repositoryWorker.on("completed", (job) => {
  logger.info(`[BULLMQ_EVENT] [COMPLETED] Job ID ${job.id} has COMPLETED.`);
});

repositoryWorker.on("failed", (job, err) => {
  logger.error(`[BULLMQ_EVENT] [FAILED] Job ID ${job?.id} FAILED: ${err.message}`, err);
});

repositoryWorker.on("stalled", (jobId) => {
  logger.warn(`[BULLMQ_EVENT] [STALLED] Job ID ${jobId} was marked as STALLED by BullMQ watchdog.`);
});

repositoryWorker.on("error", (err) => {
  logger.error(`[BULLMQ_EVENT] [ERROR] Worker encountered error: ${err.message}`, err);
});
