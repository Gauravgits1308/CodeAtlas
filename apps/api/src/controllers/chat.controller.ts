/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { RepositoryChatService } from "../services/repository-chat.service";
import { asyncHandler, AppError } from "../utils/errors";

export class ChatController {
  constructor(private repositoryChatService: RepositoryChatService) {}

  /**
   * Controller endpoint exposing repository-grounded RAG chat.
   */
  chat = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { repositoryId, question } = req.body;

    // 1. Validate repositoryId presence
    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required and must be a valid string.", 400);
    }

    // 2. Validate question presence
    if (!question || typeof question !== "string" || !question.trim()) {
      throw new AppError("Question cannot be empty and must be a valid string.", 400);
    }

    // 3. Validate question character constraints
    if (question.length > 3000) {
      throw new AppError("Question cannot be longer than 3000 characters.", 400);
    }

    // 4. Trigger vector search RAG pipeline
    const chatResult = await this.repositoryChatService.chat(
      repositoryId.trim(),
      question.trim()
    );

    // 5. Respond with structured answers and citations
    res.status(200).json({
      success: true,
      answer: chatResult.answer,
      sources: chatResult.sources,
    });
  });
}
