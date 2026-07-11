/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { DiagramService } from "../services/diagram.service";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class DiagramController {
  private diagramService: DiagramService;

  constructor(diagramService?: DiagramService) {
    this.diagramService = diagramService || new DiagramService();
  }

  /**
   * Endpoint handler to generate or fetch cached repository architecture diagrams.
   */
  getDiagram = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;
    const { view, refresh } = req.query;

    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }

    // Verify user profile sync
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!dbUser) {
      throw new AppError("User not synchronized in local database.", 401);
    }

    // Verify user owns the repository
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: dbUser.id,
      },
    });
    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    // Parse and validate diagram view mapping
    let targetView: "FOLDER_STRUCTURE" | "DEPENDENCY_GRAPH" | "SERVICE_GRAPH" | "API_FLOW" | "DATABASE_FLOW" = "FOLDER_STRUCTURE";
    const requestView = (view || "").toString().toUpperCase();
    if (["FOLDER_STRUCTURE", "DEPENDENCY_GRAPH", "SERVICE_GRAPH", "API_FLOW", "DATABASE_FLOW"].includes(requestView)) {
      targetView = requestView as "FOLDER_STRUCTURE" | "DEPENDENCY_GRAPH" | "SERVICE_GRAPH" | "API_FLOW" | "DATABASE_FLOW";
    } else if (view) {
      throw new AppError(`Invalid view: ${view}. Must be FOLDER_STRUCTURE, DEPENDENCY_GRAPH, SERVICE_GRAPH, API_FLOW, or DATABASE_FLOW.`, 400);
    }

    const forceRefresh = refresh === "true";

    logger.info(`DiagramController: Repo=${repositoryId}, View=${targetView}, Refresh=${forceRefresh}`);

    const mermaidCode = await this.diagramService.getDiagram({
      repositoryId: repositoryId.trim(),
      view: targetView,
      forceRefresh,
    });

    res.status(200).json({
      success: true,
      mermaidCode,
    });
  });
}
