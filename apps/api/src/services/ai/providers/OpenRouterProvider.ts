import OpenAI from "openai";
import { config } from "../../../config";
import { AIProvider } from "./AIProvider";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) {
      throw error;
    }
    logger.warn(`API call failed, retrying in ${delay}ms... Error: ${(error as Error).message}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

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
   * Generates embedding via OpenRouter API with retries.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterEmbeddingModel) {
      throw new AppError("OPENROUTER_EMBEDDING_MODEL is not configured.", 500);
    }

    const model = config.openrouterEmbeddingModel;
    const trimmedText = text.trim();

    return retryWithBackoff(async () => {
      logger.info(`Sending embedding API request to OpenRouter model: ${model}`);
      const response = await this.openai.embeddings.create({
        model,
        input: trimmedText,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new AppError("Invalid response format received from OpenRouter API.", 500);
      }

      logger.info("OpenRouter API embedding response successfully received");
      return embedding;
    });
  }

  /**
   * Generates embeddings for multiple texts in a batch with retries.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterEmbeddingModel) {
      throw new AppError("OPENROUTER_EMBEDDING_MODEL is not configured.", 500);
    }

    if (texts.length === 0) {
      return [];
    }

    const model = config.openrouterEmbeddingModel;
    const trimmedTexts = texts.map(t => t.trim()).filter(Boolean);

    if (trimmedTexts.length === 0) {
      return [];
    }

    return retryWithBackoff(async () => {
      logger.info(`Sending batch embedding API request (size: ${trimmedTexts.length}) to OpenRouter model: ${model}`);
      const response = await this.openai.embeddings.create({
        model,
        input: trimmedTexts,
      });

      const embeddings = response.data?.map(item => item.embedding);
      if (!embeddings || embeddings.length !== trimmedTexts.length) {
        throw new AppError("Invalid response format or count mismatch received from OpenRouter API batch request.", 500);
      }

      logger.info(`OpenRouter API batch embedding response successfully received (size: ${embeddings.length})`);
      return embeddings;
    });
  }
}
