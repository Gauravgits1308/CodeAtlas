import OpenAI from "openai";
import { config } from "../../../config";
import { AIProvider } from "./AIProvider";

export class OpenRouterProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey || "dummy-key",
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  /**
   * Sends the text to OpenRouter to compute embedding vectors.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!config.openaiApiKey) {
      throw new Error("OpenAI API key is missing. Please configure OPENAI_API_KEY.");
    }

    const response = await this.openai.embeddings.create({
      model: config.openaiEmbeddingModel || "text-embedding-3-small",
      input: text,
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Failed to extract embedding vector from OpenRouter response.");
    }

    return embedding;
  }
}
