import OpenAI from "openai";
import { config } from "../../../config";
import { AIProvider } from "./AIProvider";
import { logger } from "../../../utils/logger";

export class OpenRouterProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    const apiKey = config.openrouterApiKey;
    const baseURL = config.openrouterBaseUrl || "https://openrouter.ai/api/v1";

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
      throw new Error("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.");
    }

    const model = config.openrouterEmbeddingModel || "text-embedding-3-small";
    logger.info(`OpenRouter embedding request started using model: ${model}`);

    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid response format received from OpenRouter API.");
      }

      logger.info("OpenRouter embedding response successfully received and parsed");
      return embedding;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`OpenRouter embedding generation failed: ${err.message}`, err);
      throw err;
    }
  }
}
