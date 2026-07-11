/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { DocumentationService } from "../services/documentation.service";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class DocumentationController {
  private docService: DocumentationService;

  constructor(docService?: DocumentationService) {
    this.docService = docService || new DocumentationService();
  }

  /**
   * Endpoint handler to generate repository documentation on-demand.
   */
  generateDocumentation = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;
    const { type, tone } = req.body;

    // Validate request parameter inputs
    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID parameter is required.", 400);
    }

    // Verify user profile sync
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!dbUser) {
      throw new AppError("User not synchronized in local database.", 401);
    }

    // Verify user owns the target repository
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: dbUser.id,
      },
    });
    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    // Parse and validate document type
    let targetType: "README" | "API_DOCS" | "FOLDER_STRUCTURE" | "SETUP_GUIDE" = "README";
    const requestType = (type || "").toString().toUpperCase();
    if (["README", "API_DOCS", "FOLDER_STRUCTURE", "SETUP_GUIDE"].includes(requestType)) {
      targetType = requestType as "README" | "API_DOCS" | "FOLDER_STRUCTURE" | "SETUP_GUIDE";
    } else if (type) {
      throw new AppError(`Invalid documentation type: ${type}. Must be README, API_DOCS, FOLDER_STRUCTURE, or SETUP_GUIDE.`, 400);
    }

    // Parse and validate tone
    let targetTone: "PROFESSIONAL" | "BEGINNER" | "ENTERPRISE" = "PROFESSIONAL";
    const requestTone = (tone || "").toString().toUpperCase();
    if (["PROFESSIONAL", "BEGINNER", "ENTERPRISE"].includes(requestTone)) {
      targetTone = requestTone as "PROFESSIONAL" | "BEGINNER" | "ENTERPRISE";
    } else if (tone) {
      throw new AppError(`Invalid tone option: ${tone}. Must be PROFESSIONAL, BEGINNER, or ENTERPRISE.`, 400);
    }

    logger.info(`DocumentationController: generating doc: type=${targetType}, tone=${targetTone} for repo=${repositoryId}`);

    const content = await this.docService.generateDocumentation({
      repositoryId: repositoryId.trim(),
      type: targetType,
      tone: targetTone,
    });

    res.status(200).json({
      success: true,
      content,
    });
  });
}
