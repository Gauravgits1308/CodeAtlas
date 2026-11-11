import { GitService } from "./git.service";
import { RepositoryRepository } from "../repositories/repository.repository";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/logger";
import { REPOSITORY_STORAGE_PATH } from "../config";
import { AppError } from "../utils/errors";

export class CloneService {
  constructor(
    private gitService: GitService,
    private repositoryRepository: RepositoryRepository
  ) { }

  async cloneRepository(repositoryId: string, cloneUrl: string): Promise<void> {
    const storagePath = path.join(REPOSITORY_STORAGE_PATH, repositoryId);
    logger.info(`[CloneService] Processing clone request for repository: ${repositoryId} -> Path: ${storagePath}`);

    // Create the storage parent directory automatically if missing
    const parentDir = path.dirname(storagePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Verify if repository is already valid locally
    if (
      fs.existsSync(storagePath) &&
      (await this.gitService.exists(storagePath))
    ) {
      logger.info(`[CloneService] Repository ${repositoryId} already exists locally at: ${storagePath}. Skipping clone step.`);
      await this.repositoryRepository.updateLastSynced(repositoryId);
      return;
    }

    await this.repositoryRepository.updateStatus(repositoryId, "CLONING");
    logger.info(`[CloneService] Repository ${repositoryId} status updated to: CLONING`);

    try {
      await this.gitService.clone(cloneUrl, storagePath);
      await this.repositoryRepository.updateLastSynced(repositoryId);

      logger.info(`[CloneService] Clone step completed successfully for repository: ${repositoryId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[CloneService] Clone failed for repository ${repositoryId}: ${errorMsg}`, error);

      // Clean up target directory if left in invalid state
      if (fs.existsSync(storagePath)) {
        try {
          fs.rmSync(storagePath, { recursive: true, force: true });
          logger.info(`[CloneService] Cleaned up directory for failed repo: ${storagePath}`);
        } catch (cleanupErr) {
          logger.warn(`[CloneService] Directory cleanup warning for ${storagePath}: ${cleanupErr}`);
        }
      }

      await this.repositoryRepository.updateStatus(repositoryId, "FAILED");
      throw error instanceof AppError ? error : new AppError(`Clone Service Failed: ${errorMsg}`, 500);
    }
  }
}
