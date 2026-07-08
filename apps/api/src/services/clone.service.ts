import { GitService } from "./git.service";
import { RepositoryRepository } from "../repositories/repository.repository";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

export class CloneService {
  constructor(
    private gitService: GitService,
    private repositoryRepository: RepositoryRepository
  ) {}

  async cloneRepository(repositoryId: string, cloneUrl: string): Promise<void> {
    const storagePath = path.join(__dirname, "../../../../storage/repositories", repositoryId);

    // Create the storage directories automatically if missing
    const parentDir = path.dirname(storagePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Verify if already cloned to prevent overwrite conflicts
    if (fs.existsSync(storagePath) && (await this.gitService.exists(storagePath))) {
      logger.warn(`Conflict: Repository ${repositoryId} already exists locally at path: ${storagePath}`);
      throw new AppError("Repository already cloned.", 409);
    }

    logger.info(`Clone started for repository: ${repositoryId}`);

    // Transition status to CLONING before checkout
    await this.repositoryRepository.updateStatus(repositoryId, "CLONING");

    try {
      await this.gitService.clone(cloneUrl, storagePath);

      // Transition status to COMPLETED and mark sync timestamp
      await this.repositoryRepository.updateStatus(repositoryId, "COMPLETED");
      await this.repositoryRepository.updateLastSynced(repositoryId);

      logger.info(`Clone completed successfully for repository: ${repositoryId}`);
    } catch (error) {
      logger.error(`Clone failed for repository: ${repositoryId}`, error);

      // Transition status to FAILED on errors
      await this.repositoryRepository.updateStatus(repositoryId, "FAILED");
      throw error;
    }
  }
}
