import { config } from "../../config";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";
import { AIProvider } from "./providers/AIProvider";
import { OpenRouterProvider } from "./providers/OpenRouterProvider";

export class EmbeddingService {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider || new OpenRouterProvider();
  }

  /**
   * Generates a text embedding vector using the configured AI provider.
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
