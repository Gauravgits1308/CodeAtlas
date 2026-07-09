import { randomUUID } from "crypto";
import { prisma } from "../database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Input fields required to create a new chunk embedding record.
 */
export interface CreateChunkEmbeddingInput {
  /** The unique identifier of the code chunk associated with the embedding */
  chunkId: string;

  /** The AI provider used to generate the embedding (e.g. "openrouter") */
  provider: string;

  /** The embedding model used */
  model: string;

  /** Expected embedding dimensions */
  dimensions: number;

  /** High-dimensional embedding vector */
  embedding: number[];
}

/**
 * Repository responsible for persisting and managing embedding vectors.
 *
 * NOTE:
 * Prisma currently does not natively support the PostgreSQL pgvector type,
 * therefore vector persistence is implemented using parameterized raw SQL.
 */
export class ChunkEmbeddingRepository {
  /**
   * Persists a chunk embedding into PostgreSQL.
   */
  async create(input: CreateChunkEmbeddingInput): Promise<void> {
    if (input.embedding.length !== input.dimensions) {
      throw new AppError(
        `Embedding dimension mismatch. Expected ${input.dimensions}, received ${input.embedding.length}.`,
        400
      );
    }

    const id = randomUUID();
    const now = new Date();
    const vectorString = this.formatVector(input.embedding);

    try {
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
        )
        VALUES (
          ${id},
          ${input.chunkId},
          ${input.provider},
          ${input.model},
          ${input.dimensions},
          CAST(${vectorString} AS vector),
          ${now},
          ${now}
        )
      `;

      logger.info(
        `Embedding stored successfully for chunk ${input.chunkId}`
      );
    } catch (error: unknown) {
      const err = error as Error;

      logger.error(
        `Failed to persist embedding for chunk ${input.chunkId}: ${err.message}`,
        err
      );

      throw new AppError(
        `Failed to persist chunk embedding: ${err.message}`,
        500
      );
    }
  }

  /**
   * Placeholder for future cleanup flow.
   *
   * TODO:
   * Delete all embeddings associated with a repository.
   */
  async deleteByRepository(_repositoryId: string): Promise<void> {
    logger.warn(
      "ChunkEmbeddingRepository.deleteByRepository() is not implemented yet."
    );
  }

  /**
   * Converts a numeric embedding array into PostgreSQL pgvector literal format.
   *
   * Example:
   * [0.12, -0.45, 0.88]
   *
   * becomes
   *
   * "[0.12,-0.45,0.88]"
   */
  private formatVector(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
  }
}