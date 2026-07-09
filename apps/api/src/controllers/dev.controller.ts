import { Request, Response, NextFunction } from "express";
import { EmbeddingService } from "../services/ai/embedding.service";
import { asyncHandler, AppError } from "../utils/errors";
import { createAIProvider } from "../services/ai/providers/provider.factory";

const embeddingService = new EmbeddingService(createAIProvider());

export class DevController {
  /**
 * Temporary development-only endpoint to test embedding generation.
 */
  testEmbedding = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body as { text?: string };

    if (!text || typeof text !== "string") {
      return next(new AppError("Invalid input: text property is required and must be a string.", 400));
    }

    const vector = await embeddingService.generateEmbedding(text);

    res.status(200).json({
      success: true,
      message: "Embedding generated successfully.",
      dimensions: vector.length,
      preview: vector.slice(0, 10),
    });
  });
}
