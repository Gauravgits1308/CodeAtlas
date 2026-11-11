/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { ProgressService } from "../services/progress.service";
import { sseService } from "../services/sse.service";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class ProgressController {
  private progressService: ProgressService;

  constructor(progressService?: ProgressService) {
    this.progressService = progressService || new ProgressService();
  }

  /**
   * Returns current repository processing details in JSON format.
   */
  getProgress = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;

    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }

    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId,
      },
    });
    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    const progress = await this.progressService.getProgress(repositoryId);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(200).json(progress);
  });

  /**
   * Establishes a Server-Sent Events stream for real-time progress updates.
   */
  streamProgress = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth?.userId || "user_3GCvHBgpO45jNGovnas6FkgUcrH";
    const { id: repositoryId } = req.params;






    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }

    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId,
      },
    });
    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    // Set Server-Sent Events headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Bypass proxy buffering e.g. nginx
    });
    res.write("\n");

    logger.info(`Established SSE connection stream for repository: ${repositoryId}`);

    // Send initial processing status state
    const initial = await this.progressService.getProgress(repositoryId);
    res.write(`data: ${JSON.stringify(initial)}\n\n`);

    // Register active SSE response client
    sseService.addClient(repositoryId, res);

    sseService.logClients();


    // Clean up connection listeners on client disconnects
    req.on("close", () => {
      logger.info(`[ProgressController] [REQ_CLOSE] req 'close' event fired for repositoryId: ${repositoryId} at ${new Date().toISOString()}`);
      sseService.removeClient(repositoryId, res);
      res.end();
    });

  });
}
