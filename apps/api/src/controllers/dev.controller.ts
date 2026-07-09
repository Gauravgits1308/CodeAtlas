import { Request, Response, NextFunction } from "express";
import { EmbeddingService } from "../services/ai/embedding.service";
import { OpenRouterProvider } from "../services/ai/providers/OpenRouterProvider";
import { asyncHandler, AppError } from "../utils/errors";

const provider = new OpenRouterProvider();
const embeddingService = new EmbeddingService(provider);

export class DevController {
  /**
   * Temporary development-only endpoint to test OpenAI embedding generation.
   */
  testEmbedding = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body as { text?: string };

    if (!text || typeof text !== "string") {
      return next(new AppError("Invalid input: text property is required and must be a string.", 400));
    }

    const vector = await embeddingService.generateEmbedding(text);

    res.status(200).json({
      success: true,
      message: "TEMPORARY DEVELOPMENT ENDPOINT: Embedding generated successfully.",
      dimensions: vector.length,
      preview: vector.slice(0, 5),
    });
  });
}
