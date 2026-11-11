import { repositoryQueue } from "../queue/repository.queue";
import { RepositoryRepository } from "../repositories/repository.repository";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { prisma } from "../database";
import * as path from "path";
import * as fs from "fs";

export class RepositoryJobService {
  private repositoryRepository: RepositoryRepository;

  constructor(repositoryRepository?: RepositoryRepository) {
    this.repositoryRepository = repositoryRepository || new RepositoryRepository();
  }

  /**
   * Validates database entries, transitions status to QUEUED, and adds processing task to BullMQ.
   */
  async enqueueRepository(repositoryId: string, userId: string): Promise<string> {
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    if (repo.userId !== userId) {
      throw new AppError("Forbidden: You do not own this repository.", 403);
    }

    // Set repository status to QUEUED in PostgreSQL
    await this.repositoryRepository.updateStatus(repositoryId, "QUEUED");
    const { progressService } = await import("./progress.service");
    await progressService.updateProgress(repositoryId, {
      currentStage: "QUEUED",
      stageProgress: 0.0,
      currentMessage: "Repository waiting in processing queue...",
      finishedAt: null,
    });

    // Remove existing job with the same ID if it exists to allow re-runs/syncs
    const existingJob = await repositoryQueue.getJob(repositoryId);
    if (existingJob) {
      logger.info(`[Repository: ${repositoryId}] Found existing job in queue. Removing it to allow fresh execution.`);
      try {
        await existingJob.remove();
      } catch (removeErr) {
        logger.warn(`[Repository: ${repositoryId}] Failed to remove existing job: ${removeErr}`);
      }
    }

    // Enqueue job using repositoryId as deduplication key
    logger.info(`[BULLMQ_ENQUEUE] Queue: ${repositoryQueue.name} | Repo: ${repositoryId} | User: ${userId}`);
    const job = await repositoryQueue.add(
      `process-${repositoryId}`,
      { repositoryId, userId },
      { jobId: repositoryId }
    );

    if (!job || !job.id) {
      throw new AppError("Failed to enqueue processing job.", 500);
    }

    const state = await job.getState();
    logger.info(`[BULLMQ_VERIFIED] Job ID: ${job.id} | Queue Name: ${repositoryQueue.name} | Initial State: ${state}`);

    return job.id;
  }

  /**
   * Cancels active repository processing, removes BullMQ job, updates status to CANCELLED, and cleans filesystem & partial DB data.
   */
  async cancelRepository(repositoryId: string, userId: string): Promise<void> {
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    if (repo.userId !== userId) {
      throw new AppError("Forbidden: You do not own this repository.", 403);
    }

    logger.info(`[CANCEL] Cancelling processing for repository: ${repositoryId}`);

    // 1. Remove job from BullMQ queue
    try {
      const job = await repositoryQueue.getJob(repositoryId);
      if (job) {
        await job.remove();
        logger.info(`[CANCEL] Removed BullMQ job ${job.id} for repository ${repositoryId}`);
      }
    } catch (jobErr) {
      logger.warn(`[CANCEL] Failed to remove BullMQ job: ${jobErr}`);
    }

    // 2. Update repository status in PostgreSQL
    await this.repositoryRepository.updateStatus(repositoryId, "CANCELLED");

    // 3. Update processing status record
    const { progressService } = await import("./progress.service");
    await progressService.updateProgress(repositoryId, {
      currentStage: "CANCELLED",
      stageProgress: 0.0,
      currentMessage: "Processing cancelled by user.",
      errorMessage: "Processing cancelled by user.",
      finishedAt: new Date(),
    });

    // 4. Clean up filesystem storage
    try {
      const { REPOSITORY_STORAGE_PATH } = await import("../config");
      const repoPath = path.join(REPOSITORY_STORAGE_PATH, repositoryId);
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
        logger.info(`[CANCEL] Cleaned up filesystem checkout directory: ${repoPath}`);
      }
    } catch (fsErr) {
      logger.warn(`[CANCEL] Filesystem cleanup warning: ${fsErr}`);
    }

    // 5. Clean up partial code chunks from DB (cascading embeddings)
    try {
      await prisma.codeChunk.deleteMany({
        where: { repositoryId },
      });
      logger.info(`[CANCEL] Cleared partial code chunks for repository ${repositoryId}`);
    } catch (dbErr) {
      logger.warn(`[CANCEL] Failed to clear partial code chunks: ${dbErr}`);
    }
  }

  /**
   * Resets repository processing state, cleans previous partial data, and enqueues a fresh processing job.
   */
  async retryRepository(repositoryId: string, userId: string): Promise<string> {
    logger.info(`[RETRY] Initiating full retry for repository: ${repositoryId}`);

    // 1. Clean previous partial artifacts
    await this.cancelRepository(repositoryId, userId);

    // 2. Enqueue fresh processing job
    return await this.enqueueRepository(repositoryId, userId);
  }
}
