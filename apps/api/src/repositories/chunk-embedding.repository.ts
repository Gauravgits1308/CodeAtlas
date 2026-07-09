import { prisma } from "../database";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";
import { randomUUID } from "crypto";

/**
 * Input fields required to create a new chunk embedding record.
 */
export interface CreateChunkEmbeddingInput {
  /** The unique identifier of the code chunk associated with the embedding */
  chunkId: string;
  /** The AI provider used to generate the embedding (e.g., 'openrouter') */
  provider: string;
  /** The model configuration used to generate the embedding */
  model: string;
  /** The number of dimensions of the embedding vector */
  dimensions: number;
  /** The numeric array representing the high-dimensional vector */
  embedding: number[];
}

/**
 * Repository responsible for all operations on the ChunkEmbedding table,
 * specifically handling the raw SQL interface for the pgvector vector data type.
 */
export class ChunkEmbeddingRepository {
  /**
   * Persists a new chunk embedding record with the high-dimensional vector.
   *
   * @param input Data required to persist a chunk embedding record.
   * @returns A promise that resolves when the insertion completes successfully.
   */
  async create(input: CreateChunkEmbeddingInput): Promise<void> {
    const id = randomUUID();
    const now = new Date();
    const vectorString = this.formatVector(input.embedding);

    try {
      // Execute parameterized insert utilizing cast block for pgvector datatype compatibilities
      await prisma.$executeRaw`
        INSERT INTO "ChunkEmbedding" (
          "id",
          "chunkId",
          "provider",
          "model",
          "dimensions",
          "embedding",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${input.chunkId},
          ${input.provider},
          ${input.model},
          ${input.dimensions},
          cast(${vectorString} as vector),
          ${now},
          ${now}
        )
      `;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Database error occurred while persisting chunk embedding for chunkId ${input.chunkId}: ${err.message}`, err);
      throw new AppError(`Database error: Failed to save chunk embedding. Details: ${err.message}`, 500);
    }
  }

  /**
   * Deletes all embeddings associated with code chunks belonging to a repository.
   * Note: This method is currently a placeholder for a future index cleanup flow.
   *
   * @param repositoryId The ID of the repository to clear embeddings for.
   */
  async deleteByRepository(repositoryId: string): Promise<void> {
    // TODO: Implement deletion cascade or query based deletion when cascading is needed.
    logger.info(`Placeholder: deleteByRepository called with repositoryId ${repositoryId}`);
  }

  /**
   * Converts a numeric embedding array into a PostgreSQL pgvector literal format string.
   * Example: [0.12, -0.45, 0.88] -> '[0.12,-0.45,0.88]'
   *
   * @param embedding The numeric array to convert.
   * @returns The PostgreSQL vector literal string.
   */
  private formatVector(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
  }
}
