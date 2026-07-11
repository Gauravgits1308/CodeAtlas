import { RepositoryRepository } from "../repositories/repository.repository";
import { CodeChunkRepository } from "../repositories/code-chunk.repository";
import { ChunkEmbeddingRepository } from "../repositories/chunk-embedding.repository";
import { FileExtractionService } from "./file-extraction.service";
import { ChunkingService } from "./chunking.service";
import { EmbeddingService } from "./ai/embedding.service";
import { createAIProvider } from "./ai/providers/provider.factory";
import { config } from "../config";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

export class RepositoryProcessingService {
  private repositoryRepository: RepositoryRepository;
  private codeChunkRepository: CodeChunkRepository;
  private chunkEmbeddingRepository: ChunkEmbeddingRepository;
  private fileExtractionService: FileExtractionService;
  private chunkingService: ChunkingService;
  private embeddingService: EmbeddingService;

  constructor(
    repositoryRepository?: RepositoryRepository,
    codeChunkRepository?: CodeChunkRepository,
    fileExtractionService?: FileExtractionService,
    chunkingService?: ChunkingService,
    embeddingService?: EmbeddingService,
    chunkEmbeddingRepository?: ChunkEmbeddingRepository
  ) {
    this.repositoryRepository =
      repositoryRepository || new RepositoryRepository();

    this.codeChunkRepository =
      codeChunkRepository || new CodeChunkRepository();

    this.fileExtractionService =
      fileExtractionService || new FileExtractionService();

    this.chunkingService =
      chunkingService || new ChunkingService();

    this.embeddingService =
      embeddingService || new EmbeddingService(createAIProvider());

    this.chunkEmbeddingRepository =
      chunkEmbeddingRepository || new ChunkEmbeddingRepository();
  }

  /**
   * Performs the complete repository indexing pipeline.
   *
   * Steps:
   * 1. Delete previously indexed chunks.
   * 2. Extract supported source files.
   * 3. Chunk each file.
   * 4. Persist each chunk.
   * 5. Generate embeddings.
   * 6. Persist embeddings.
   *
   * @param repositoryId Repository to process.
   * @returns Total number of processed chunks.
   */
  async processRepository(
    repositoryId: string
  ): Promise<{ chunksCount: number }> {
    const repo = await this.repositoryRepository.findById(repositoryId);

    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    if (repo.status !== "COMPLETED" && repo.status !== "FAILED") {
      throw new AppError(
        "Repository codebase must be cloned successfully before triggering indexing.",
        400
      );
    }

    logger.info(
      `Repository processing started for repository: ${repositoryId}`
    );

    await this.repositoryRepository.updateStatus(repo.id, "PROCESSING");

    try {
      /**
       * Remove previously indexed chunks.
       * Associated embeddings are automatically deleted via
       * database cascade constraints.
       */
      await this.codeChunkRepository.deleteByRepository(repo.id);

      /**
       * Extract supported source files.
       */
      const files = this.fileExtractionService.extractFiles(repo.id);

      logger.info(
        `Extracted ${files.length} supported source files for repository ${repositoryId}`
      );

      let totalChunksCount = 0;

      /**
       * Process every file.
       */
      for (const file of files) {
        const chunks = this.chunkingService.chunkFile(
          repo.id,
          file.filePath,
          file.content
        );

        logger.debug(
          `Generated ${chunks.length} chunks from ${file.filePath}`
        );

        /**
         * Process every chunk.
         */
        for (const chunkInput of chunks) {
          // Persist chunk
          const createdChunk =
            await this.codeChunkRepository.create({
              ...chunkInput,
              classification: file.classification,
            });

          logger.debug(
            `Generating embedding for chunk ${createdChunk.id}`
          );

          // Generate embedding
          const embedding =
            await this.embeddingService.generateEmbedding(
              createdChunk.content
            );

          // Persist embedding
          await this.chunkEmbeddingRepository.create({
            chunkId: createdChunk.id,
            provider: config.aiProvider,
            model: config.openrouterEmbeddingModel,
            dimensions: embedding.length,
            embedding,
          });

          logger.debug(
            `Embedding stored successfully for chunk ${createdChunk.id}`
          );

          totalChunksCount++;
        }
      }

      await this.repositoryRepository.updateStatus(
        repo.id,
        "COMPLETED"
      );

      logger.info(
        `Repository processing completed successfully for repository ${repositoryId}. Total chunks processed: ${totalChunksCount}`
      );

      return {
        chunksCount: totalChunksCount,
      };
    } catch (error) {
      logger.error(
        `Repository processing failed for repository ${repositoryId}`,
        error
      );

      await this.repositoryRepository.updateStatus(
        repo.id,
        "FAILED"
      );

      throw error;
    }
  }
}