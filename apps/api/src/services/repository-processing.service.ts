import { RepositoryRepository } from "../repositories/repository.repository";
import { CodeChunkRepository, CreateChunkInput } from "../repositories/code-chunk.repository";
import { FileExtractionService } from "./file-extraction.service";
import { ChunkingService } from "./chunking.service";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

export class RepositoryProcessingService {
  private repositoryRepository: RepositoryRepository;
  private codeChunkRepository: CodeChunkRepository;
  private fileExtractionService: FileExtractionService;
  private chunkingService: ChunkingService;

  constructor(
    repositoryRepository?: RepositoryRepository,
    codeChunkRepository?: CodeChunkRepository,
    fileExtractionService?: FileExtractionService,
    chunkingService?: ChunkingService
  ) {
    this.repositoryRepository = repositoryRepository || new RepositoryRepository();
    this.codeChunkRepository = codeChunkRepository || new CodeChunkRepository();
    this.fileExtractionService = fileExtractionService || new FileExtractionService();
    this.chunkingService = chunkingService || new ChunkingService();
  }

  /**
   * Performs the complete repository indexing codebase pipeline (file extraction, chunking, and db persistence).
   *
   * @param repositoryId The ID of the repository to process.
   * @returns A promise resolving to the total count of chunks generated.
   */
  async processRepository(repositoryId: string): Promise<{ chunksCount: number }> {
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    if (repo.status !== "COMPLETED" && repo.status !== "FAILED") {
      throw new AppError("Repository codebase must be cloned successfully before triggering indexing.", 400);
    }

    logger.info(`Code processing and chunking started for repository: ${repositoryId}`);

    await this.repositoryRepository.updateStatus(repo.id, "PROCESSING");

    try {
      // 1. Delete existing chunks
      await this.codeChunkRepository.deleteByRepository(repo.id);

      // 2. Extract files
      const files = this.fileExtractionService.extractFiles(repo.id);
      logger.info(`Extracted ${files.length} supported source files for repository: ${repositoryId}`);

      // 3. Chunk files
      const allChunks: CreateChunkInput[] = [];
      for (const file of files) {
        const fileChunks = this.chunkingService.chunkFile(repo.id, file.filePath, file.content);
        allChunks.push(...fileChunks);
      }

      logger.info(`Generated ${allChunks.length} chunks for repository: ${repositoryId}`);

      // 4. Save chunks
      if (allChunks.length > 0) {
        await this.codeChunkRepository.createMany(allChunks);
      }

      await this.repositoryRepository.updateStatus(repo.id, "COMPLETED");
      logger.info(`Code processing and chunking completed successfully for repository: ${repositoryId}`);

      return { chunksCount: allChunks.length };
    } catch (error) {
      logger.error(`Code processing failed for repository: ${repositoryId}`, error);
      await this.repositoryRepository.updateStatus(repo.id, "FAILED");
      throw error;
    }
  }
}
