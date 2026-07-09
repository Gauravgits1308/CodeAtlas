import { config } from "../../../config";
import { AppError } from "../../../utils/errors";
import { OpenRouterProvider } from "./OpenRouterProvider";
import { AIProvider } from "./AIProvider";

export function createAIProvider(): AIProvider {
    switch (config.aiProvider) {
        case "openrouter":
            return new OpenRouterProvider();

        default:
            throw new AppError(
                `Unsupported AI provider: ${config.aiProvider}`,
                500
            );
    }
}