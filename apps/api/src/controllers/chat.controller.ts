/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { RepositoryChatService } from "../services/repository-chat.service";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

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

  /**
   * Controller endpoint exposing repository-grounded RAG chat streams.
   */
  chatStream = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { repositoryId, question } = req.body;

    // 1. Validate parameters
    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }
    if (!question || typeof question !== "string" || !question.trim()) {
      throw new AppError("Question cannot be empty.", 400);
    }
    if (question.length > 3000) {
      throw new AppError("Question cannot be longer than 3000 characters.", 400);
    }

    // 2. Set SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Close handler for client cancellations
    let isAborted = false;
    req.on("close", () => {
      isAborted = true;
      logger.info("Client closed connection, aborting chat stream.");
    });

    try {
      await this.repositoryChatService.chatStream(
        repositoryId.trim(),
        question.trim(),
        (sources) => {
          if (!isAborted) {
            res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);
          }
        },
        (token) => {
          if (!isAborted) {
            res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
          }
        },
        () => {
          if (!isAborted) {
            res.write(`event: end\ndata: [DONE]\n\n`);
            res.end();
          }
        },
        {
          get aborted() {
            return isAborted;
          },
          addEventListener: () => {},
          removeEventListener: () => {},
        } as unknown as AbortSignal
      );
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Stream controller execution error: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
        res.end();
      }
    }
  });
}
