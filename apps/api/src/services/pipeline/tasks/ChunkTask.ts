import { PipelineTask, PipelineContext } from "../Task";
import { ChunkingService } from "../../chunking.service";
import { CodeChunkRepository } from "../../../repositories/code-chunk.repository";
import { prisma } from "../../../database";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
 
export class ChunkTask implements PipelineTask {
  name = "CHUNKING";
 
  private chunkingService = new ChunkingService();
  private codeChunkRepository = new CodeChunkRepository();
 
  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[ChunkTask] Started for repository ${ctx.repositoryId}`);
 
    // Retrieve extracted files from context
    const files = (ctx as any).extractedFiles;
    if (!files || !Array.isArray(files)) {
      throw new AppError("Extracted files not found in pipeline context.", 500);
    }
 
    try {
      // 1. Delete previous chunks (cascading embeddings automatically)
      await this.codeChunkRepository.deleteByRepository(ctx.repositoryId);
 
      // 2. Chunk files concurrently
      const chunkingPromises = files.map(async (file) => {
        const fileChunks = this.chunkingService.chunkFile(
          ctx.repositoryId,
          file.filePath,
          file.content
        );
        return fileChunks.map(chunk => ({
          ...chunk,
          classification: file.classification,
        }));
      });
 
      const nestedChunks = await Promise.all(chunkingPromises);
      const allChunks = nestedChunks.flat();
 
      logger.info(`[ChunkTask] Concurrently generated ${allChunks.length} chunks from ${files.length} files. Storing in DB...`);
 
      // 3. Bulk insert to database
      if (allChunks.length > 0) {
        await this.codeChunkRepository.createMany(allChunks);
      }
 
      // 4. Retrieve saved chunks from DB with IDs for the embedding stage
      const savedChunks = await prisma.codeChunk.findMany({
        where: { repositoryId: ctx.repositoryId },
        select: { id: true, content: true, filePath: true, classification: true },
      });
 
      ctx.processedChunks = savedChunks.length;
      ctx.totalChunks = savedChunks.length;
 
      // Store on context for the EmbeddingTask
      (ctx as any).savedChunks = savedChunks;
 
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[ChunkTask] Completed in ${duration.toFixed(2)} seconds. Chunks created: ${savedChunks.length}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`[ChunkTask] Failed: ${err.message}`, err);
      throw new AppError(`Code chunking failed: ${err.message}`, 500);
    }
  }
}
