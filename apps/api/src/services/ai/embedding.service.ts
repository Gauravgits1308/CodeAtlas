import OpenAI from "openai";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

// Create a singleton OpenAI client instance
const openai = new OpenAI({
  apiKey: config.openaiApiKey || "dummy-key",
});

export class EmbeddingService {
  /**
   * Generates a text embedding vector using OpenAI Embeddings API.
   *
   * @param text The input text string to embed.
   * @returns A promise that resolves to the embedding vector (array of numbers).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!config.openaiApiKey) {
      throw new AppError("OpenAI API key is missing. Please configure OPENAI_API_KEY.", 500);
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new AppError("Input text for embedding generation cannot be empty or whitespace-only.", 400);
    }

    logger.info(`Embedding request started for model: ${config.openaiEmbeddingModel}`);

    try {
      const response = await openai.embeddings.create({
        model: config.openaiEmbeddingModel,
        input: trimmedText,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new AppError("Failed to extract embedding vector from OpenAI response.", 500);
      }

      logger.info("Embedding generated successfully");
      return embedding;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Embedding generation failed: ${err.message}`, err);
      throw new AppError(`Failed to generate embedding: ${err.message}`, 500);
    }
  }
}
