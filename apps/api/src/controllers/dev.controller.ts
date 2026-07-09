import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { config } from "../config";
import { EmbeddingService } from "../services/ai/embedding.service";
import { createAIProvider } from "../services/ai/providers/provider.factory";
import { ChunkEmbeddingRepository } from "../repositories/chunk-embedding.repository";
import { asyncHandler, AppError } from "../utils/errors";

const embeddingService = new EmbeddingService(createAIProvider());
const chunkEmbeddingRepository = new ChunkEmbeddingRepository();

export class DevController {
  /**
   * Temporary development-only endpoint to test embedding generation.
   */
  testEmbedding = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { text } = req.body as { text?: string };

      if (!text || typeof text !== "string") {
        return next(
          new AppError(
            "Invalid input: text property is required and must be a string.",
            400
          )
        );
      }

      const vector = await embeddingService.generateEmbedding(text);

      res.status(200).json({
        success: true,
        message: "Embedding generated successfully.",
        dimensions: vector.length,
        preview: vector.slice(0, 10),
      });
    }
  );

  /**
   * Temporary development-only endpoint to test embedding persistence.
   * DELETE after Sprint 3.2 verification.
   */
  testEmbeddingStorage = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { text } = req.body as { text?: string };

      if (!text || typeof text !== "string") {
        return next(
          new AppError(
            "Invalid input: text property is required and must be a string.",
            400
          )
        );
      }

      // Find any repository for testing
      const repository = await prisma.repository.findFirst();

      if (!repository) {
        return next(
          new AppError(
            "No repository found. Please process a repository first.",
            400
          )
        );
      }

      // Generate embedding
      const embedding = await embeddingService.generateEmbedding(text);

      // Create a temporary chunk
      const chunk = await prisma.codeChunk.create({
        data: {
          repositoryId: repository.id,
          filePath: "dev-test.ts",
          startLine: 1,
          endLine: 1,
          content: text,
        },
      });

      // Persist embedding
      await chunkEmbeddingRepository.create({
        chunkId: chunk.id,
        provider: config.aiProvider,
        model: config.openrouterEmbeddingModel,
        dimensions: embedding.length,
        embedding,
      });

      res.status(200).json({
        success: true,
        message: "Embedding successfully stored in PostgreSQL.",
        chunkId: chunk.id,
        embeddingDimensions: embedding.length,
      });
    }
  );
}