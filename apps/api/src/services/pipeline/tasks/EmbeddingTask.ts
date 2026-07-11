import { PipelineTask, PipelineContext } from "../Task";
import { EmbeddingService } from "../../ai/embedding.service";
import { OpenRouterProvider } from "../../ai/providers/OpenRouterProvider";
import { ChunkEmbeddingRepository } from "../../../repositories/chunk-embedding.repository";
import { config } from "../../../config";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
import { progressService } from "../../progress.service";
 
export class EmbeddingTask implements PipelineTask {
  name = "GENERATING_EMBEDDINGS";
 
  private embeddingService = new EmbeddingService(new OpenRouterProvider());
  private chunkEmbeddingRepository = new ChunkEmbeddingRepository();
 
  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[EmbeddingTask] Started for repository ${ctx.repositoryId}`);
 
    const chunks = (ctx as any).savedChunks;
    if (!chunks || !Array.isArray(chunks)) {
      throw new AppError("Saved chunks not found in pipeline context.", 500);
    }
 
    if (chunks.length === 0) {
      logger.info("[EmbeddingTask] No chunks to embed.");
      return;
    }
 
    const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE || "50", 10);
    logger.info(`[EmbeddingTask] Commencing batch embedding of ${chunks.length} chunks. Batch size: ${batchSize}`);
 
    try {
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map(c => c.content);
 
        logger.info(`[EmbeddingTask] Fetching embeddings for batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);
        const vectors = await this.embeddingService.generateEmbeddings(texts);
 
        logger.info(`[EmbeddingTask] Storing embeddings concurrently in DB for batch ${Math.floor(i / batchSize) + 1}...`);
        const savePromises = batch.map((chunk, index) => {
          const embedding = vectors[index];
          return this.chunkEmbeddingRepository.create({
            chunkId: chunk.id,
            provider: config.aiProvider,
            model: config.openrouterEmbeddingModel,
            dimensions: embedding.length,
            embedding,
          });
        });
 
        await Promise.all(savePromises);
 
        ctx.embeddingsGenerated += batch.length;
 
        // Report progress dynamically
        const progressPercentage = 60.0 + Math.round((ctx.embeddingsGenerated / chunks.length) * 20.0);
        await progressService.updateProgress(ctx.repositoryId, {
          currentStage: "Generating Embeddings",
          stageProgress: progressPercentage,
          currentMessage: `Generating pgvector embeddings (${ctx.embeddingsGenerated} / ${chunks.length})...`,
          processedChunks: ctx.embeddingsGenerated,
          totalChunks: chunks.length,
          embeddingsGenerated: ctx.embeddingsGenerated,
        });
      }
 
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[EmbeddingTask] Completed in ${duration.toFixed(2)} seconds. Embeddings created: ${ctx.embeddingsGenerated}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`[EmbeddingTask] Failed: ${err.message}`, err);
      throw new AppError(`Embedding generation failed: ${err.message}`, 500);
    }
  }
}
