import { RepositoryRepository } from "../repositories/repository.repository";
import * as fs from "fs";
import * as path from "path";
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

    const repoPath = path.join(__dirname, "../../../../storage/repositories", repositoryId);
    if (!fs.existsSync(repoPath)) {
      throw new AppError(
        "Repository codebase must be cloned successfully before triggering indexing.",
        400
      );
    }

    logger.info(
      `Repository processing started for repository: ${repositoryId}`
    );

    const { progressService } = await import("./progress.service");
    await progressService.updateProgress(repo.id, {
      currentStage: "Extracting Files",
      stageProgress: 30.0,
      currentMessage: "Extracting supported source files from local repository clone...",
    });

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
      logger.info(`[Repository: ${repo.id}] File extraction started`);
      const files = this.fileExtractionService.extractFiles(repo.id);
      logger.info(`[Repository: ${repo.id}] File extraction completed: Discovered ${files.length} files`);

      await progressService.updateProgress(repo.id, {
        currentStage: "Processing Files",
        stageProgress: 40.0,
        currentMessage: `Discovered ${files.length} source code files. Parsing structures...`,
        totalFiles: files.length,
      });

      logger.info(
        `Extracted ${files.length} supported source files for repository ${repositoryId}`
      );

      // Pre-chunk all files to get accurate counts
      await progressService.updateProgress(repo.id, {
        currentStage: "Chunking Code",
        stageProgress: 50.0,
        currentMessage: "Chunking source code files into semantic segments...",
        totalFiles: files.length,
      });

      logger.info(`[Repository: ${repo.id}] Chunking started for ${files.length} files`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileChunksMap: Array<{ file: typeof files[0]; chunks: any[] }> = [];
      let estimatedTotalChunks = 0;

      for (const file of files) {
        const chunks = this.chunkingService.chunkFile(
          repo.id,
          file.filePath,
          file.content
        );
        fileChunksMap.push({ file, chunks });
        estimatedTotalChunks += chunks.length;
      }
      logger.info(`[Repository: ${repo.id}] Chunking completed: Formulated ${estimatedTotalChunks} code chunks`);

      await progressService.updateProgress(repo.id, {
        currentStage: "Chunking Code",
        stageProgress: 55.0,
        currentMessage: `Chunking completed. Formulated ${estimatedTotalChunks} code chunks.`,
        totalFiles: files.length,
        totalChunks: estimatedTotalChunks,
      });

      let processedFiles = 0;
      let processedChunks = 0;
      let embeddingsGenerated = 0;

      /**
       * Process every chunk map and generate embeddings.
       */
      logger.info(`[Repository: ${repo.id}] Embedding generation started for ${estimatedTotalChunks} chunks`);
      for (const item of fileChunksMap) {
        processedFiles++;
        
        for (const chunkInput of item.chunks) {
          // Persist chunk
          const createdChunk =
            await this.codeChunkRepository.create({
              ...chunkInput,
              classification: item.file.classification,
            });

          processedChunks++;

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

          embeddingsGenerated++;

          logger.debug(
            `Embedding stored successfully for chunk ${createdChunk.id}`
          );

          // Dynamic percentage from 60% to 80%
          const scaleOffset = estimatedTotalChunks > 0 ? (embeddingsGenerated / estimatedTotalChunks) * 20.0 : 20.0;
          await progressService.updateProgress(repo.id, {
            currentStage: "Generating Embeddings",
            stageProgress: 60.0 + Math.round(scaleOffset),
            currentMessage: `Generating pgvector embeddings (${embeddingsGenerated} / ${estimatedTotalChunks})...`,
            processedFiles,
            totalFiles: files.length,
            processedChunks,
            totalChunks: estimatedTotalChunks,
            embeddingsGenerated,
          });
        }
      }
      logger.info(`[Repository: ${repo.id}] Embedding generation completed: Generated ${embeddingsGenerated} embeddings`);

      await this.repositoryRepository.updateStatus(
        repo.id,
        "COMPLETED"
      );

      logger.info(
        `Repository processing completed successfully for repository ${repositoryId}. Total chunks processed: ${embeddingsGenerated}`
      );

      return {
        chunksCount: embeddingsGenerated,
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