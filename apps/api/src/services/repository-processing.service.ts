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
  private fileExtractionService: FileExtractionService;
  private chunkingService: ChunkingService;
  private embeddingService: EmbeddingService;
  private chunkEmbeddingRepository: ChunkEmbeddingRepository;

  constructor(
    repositoryRepository?: RepositoryRepository,
    codeChunkRepository?: CodeChunkRepository,
    fileExtractionService?: FileExtractionService,
    chunkingService?: ChunkingService,
    embeddingService?: EmbeddingService,
    chunkEmbeddingRepository?: ChunkEmbeddingRepository
  ) {
    this.repositoryRepository = repositoryRepository || new RepositoryRepository();
    this.codeChunkRepository = codeChunkRepository || new CodeChunkRepository();
    this.fileExtractionService = fileExtractionService || new FileExtractionService();
    this.chunkingService = chunkingService || new ChunkingService();
    this.embeddingService = embeddingService || new EmbeddingService(createAIProvider());
    this.chunkEmbeddingRepository = chunkEmbeddingRepository || new ChunkEmbeddingRepository();
  }

  /**
   * Performs the complete repository indexing codebase pipeline (file extraction, chunking, embedding, and db persistence).
   *
   * @param repositoryId The ID of the repository to process.
   * @returns A promise resolving to the total count of chunks generated and embedded.
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
      // 1. Delete existing chunks (associated embeddings will cascade delete due to DB constraints)
      await this.codeChunkRepository.deleteByRepository(repo.id);

      // 2. Extract files
      const files = this.fileExtractionService.extractFiles(repo.id);
      logger.info(`Extracted ${files.length} supported source files for repository: ${repositoryId}`);

      // 3. Chunk, embed, and store sequentially
      let totalChunksCount = 0;
      for (const file of files) {
        const fileChunks = this.chunkingService.chunkFile(repo.id, file.filePath, file.content);
        for (const chunkInput of fileChunks) {
          // Persist the chunk to PostgreSQL to obtain its created ID
          const createdChunk = await this.codeChunkRepository.create(chunkInput);
          
          // Generate embedding for the chunk content
          const embeddingVector = await this.embeddingService.generateEmbedding(createdChunk.content);
          
          // Persist embedding using ChunkEmbeddingRepository
          await this.chunkEmbeddingRepository.create({
            chunkId: createdChunk.id,
            provider: config.aiProvider,
            model: config.openrouterEmbeddingModel,
            dimensions: embeddingVector.length,
            embedding: embeddingVector,
          });

          totalChunksCount++;
        }
      }

      await this.repositoryRepository.updateStatus(repo.id, "COMPLETED");
      logger.info(`Code processing, chunking, and embedding completed successfully for repository: ${repositoryId}. Total chunks: ${totalChunksCount}`);

      return { chunksCount: totalChunksCount };
    } catch (error) {
      logger.error(`Code processing failed for repository: ${repositoryId}`, error);
      await this.repositoryRepository.updateStatus(repo.id, "FAILED");
      throw error;
    }
  }
}
