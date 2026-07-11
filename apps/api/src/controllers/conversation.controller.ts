/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { RepositoryConversationService } from "../services/repository-conversation.service";
import { asyncHandler, AppError } from "../utils/errors";
import { prisma } from "../database";

export class ConversationController {
  constructor(private repositoryConversationService: RepositoryConversationService) {}

  /**
   * List conversations for a user + repository.
   */
  listConversations = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { repositoryId } = req.query;

    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("repositoryId query parameter is required.", 400);
    }

    const conversations = await this.repositoryConversationService.listConversations(
      userId,
      repositoryId.trim()
    );

    res.status(200).json({
      success: true,
      conversations,
    });
  });

  /**
   * Rename a conversation title.
   */
  renameConversation = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      throw new AppError("title is required.", 400);
    }

    const updated = await this.repositoryConversationService.renameConversation(
      userId,
      id,
      title.trim()
    );

    res.status(200).json({
      success: true,
      conversation: updated,
    });
  });

  /**
   * Delete a conversation thread.
   */
  deleteConversation = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    await this.repositoryConversationService.deleteConversation(userId, id);

    res.status(200).json({
      success: true,
      message: "Conversation successfully deleted.",
    });
  });

  /**
   * Get all messages for a specific conversation.
   */
  getMessages = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    // Quick ownership check
    const convoObj = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!convoObj || convoObj.userId !== userId) {
      throw new AppError("Conversation not found or access denied.", 404);
    }

    res.status(200).json({
      success: true,
      messages: convoObj.messages,
    });
  });
}
