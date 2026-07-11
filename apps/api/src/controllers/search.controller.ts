/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { RepositorySearchService } from "../services/repository-search.service";
import { asyncHandler, AppError } from "../utils/errors";

export class SearchController {
  constructor(private repositorySearchService: RepositorySearchService) {}

  /**
   * Controller endpoint exposing natural language semantic search.
   */
  search = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { repositoryId, query, limit } = req.body;

    // 1. Validate repositoryId presence
    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required and must be a valid string.", 400);
    }

    // 2. Validate search query presence
    if (!query || typeof query !== "string" || !query.trim()) {
      throw new AppError("Query cannot be empty and must be a valid string.", 400);
    }

    // 3. Validate results limit range
    let parsedLimit = 10;
    if (limit !== undefined) {
      const numLimit = Number(limit);
      if (!Number.isInteger(numLimit) || numLimit < 1 || numLimit > 20) {
        throw new AppError("Limit must be an integer between 1 and 20.", 400);
      }
      parsedLimit = numLimit;
    }

    // 4. Trigger vector search query service
    const results = await this.repositorySearchService.search(
      repositoryId.trim(),
      query.trim(),
      parsedLimit
    );

    // 5. Respond with structured results
    res.status(200).json({
      success: true,
      results: results.map((chunk) => ({
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        content: chunk.content,
        similarity: chunk.similarity,
      })),
    });
  });
}
