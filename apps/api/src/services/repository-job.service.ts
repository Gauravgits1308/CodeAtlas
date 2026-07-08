import { repositoryQueue } from "../queue/repository.queue";
import { RepositoryRepository } from "../repositories/repository.repository";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

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

    // Enqueue job using repositoryId as deduplication key
    const job = await repositoryQueue.add(
      `process-${repositoryId}`,
      { repositoryId, userId },
      { jobId: repositoryId }
    );

    if (!job || !job.id) {
      throw new AppError("Failed to enqueue processing job.", 500);
    }

    logger.info(`Job queued: Enqueued job ID ${job.id} for repository ${repositoryId}`);

    return job.id;
  }
}
