import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";
import { AIProvider } from "./providers/AIProvider";

export class EmbeddingService {
  constructor(private provider: AIProvider) {}

  /**
   * Generates a text embedding vector using the injected AI provider.
   *
   * @param text The input text string to embed.
   * @returns A promise that resolves to the embedding vector (array of numbers).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new AppError("Input text for embedding generation cannot be empty or whitespace-only.", 400);
    }

    logger.info("Embedding request started");

    try {
      const embedding = await this.provider.generateEmbedding(trimmedText);
      logger.info("Embedding generated successfully");
      return embedding;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Embedding generation failed: ${err.message}`, err);
      throw new AppError(`Failed to generate embedding: ${err.message}`, 500);
    }
  }
}
