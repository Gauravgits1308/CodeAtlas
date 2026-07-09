import OpenAI from "openai";
import { config } from "../../../config";
import { AIProvider } from "./AIProvider";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";

export class OpenRouterProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    const apiKey = config.openrouterApiKey;
    const baseURL = config.openrouterBaseUrl;

    if (!baseURL) {
      throw new AppError("OPENROUTER_BASE_URL is not configured.", 500);
    }

    logger.info(`Initializing OpenRouterProvider with baseURL: ${baseURL}`);

    this.openai = new OpenAI({
      apiKey: apiKey || "dummy-key",
      baseURL: baseURL,
    });
  }

  /**
   * Generates embedding via OpenRouter API.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterEmbeddingModel) {
      throw new AppError("OPENROUTER_EMBEDDING_MODEL is not configured.", 500);
    }

    const model = config.openrouterEmbeddingModel;
    logger.info(`Sending embedding API request to OpenRouter model: ${model}`);

    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new AppError("Invalid response format received from OpenRouter API.", 500);
      }

      logger.info("OpenRouter API embedding response successfully received");
      return embedding;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`OpenRouter API request failed: ${err.message}`, err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(`OpenRouter API request failed: ${err.message}`, 500);
    }
  }
}
