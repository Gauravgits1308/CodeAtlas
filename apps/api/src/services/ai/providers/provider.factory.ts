import { config } from "../../../config";
import { AppError } from "../../../utils/errors";
import { OpenRouterProvider } from "./OpenRouterProvider";
import { GeminiProvider } from "./GeminiProvider";
import { AIProvider } from "./AIProvider";

export function createAIProvider(): AIProvider {
  switch (config.aiProvider) {
    case "openrouter":
      return new OpenRouterProvider();

    case "gemini":
      return new GeminiProvider();

    default:
      throw new AppError(
        `Unsupported AI provider: ${config.aiProvider}`,
        500
      );
  }
}
export class AIProviderFactory {
  static create(): AIProvider {
    return createAIProvider();
  }
}
